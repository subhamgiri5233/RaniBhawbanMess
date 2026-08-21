const express = require('express');
const router = express.Router();
const MarketRequest = require('../models/MarketRequest');
const MonthlySummary = require('../models/MonthlySummary');
const User = require('../models/User'); // For member list
const Trash = require('../models/Trash'); // Added for rejection history
const { auth, requireAdmin } = require('../middleware/auth');
const Notification = require('../models/Notification');

// Helper to check if a user is the assigned manager for a given month
const checkIsManager = async (user, dateOrMonth) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (!dateOrMonth) return false;
    
    try {
        const ManagerRecord = require('../models/ManagerRecord');
        const month = dateOrMonth.length === 7 ? dateOrMonth : dateOrMonth.substring(0, 7);
        const monthRegex = new RegExp('^' + month);
        const managerDoc = await ManagerRecord.findOne({
            $or: [
                { date: { $regex: monthRegex } },
                { date: month }
            ]
        });
        if (managerDoc && (
            managerDoc.memberId === user.id || 
            managerDoc.memberId === user.userId ||
            managerDoc.memberId === user._id?.toString()
        )) {
            return true;
        }
    } catch (e) {
        console.error('[Market] Error checking manager:', e);
    }
    return false;
};

// --- Manual Market Duty Routes ---

// Get Duty counts for a month
router.get('/duty/:month', auth, async (req, res) => {
    try {
        const { month } = req.params;
        const duties = await MonthlySummary.find({ month }).select('memberId marketDays');
        
        // Return a map of memberId -> marketDays
        const dutyMap = {};
        duties.forEach(d => {
            dutyMap[d.memberId] = d.marketDays;
        });
        
        res.json(dutyMap);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Duty count for a member
router.put('/duty/:month', auth, requireAdmin, async (req, res) => {
    try {
        const { month } = req.params;
        const { memberId, marketDays } = req.body;

        if (!memberId) return res.status(400).json({ message: 'memberId is required' });

        // Fetch user to get name if creating new summary record
        const user = await User.findById(memberId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const updated = await MonthlySummary.findOneAndUpdate(
            { month, memberId },
            { 
                $set: { 
                    marketDays: Number(marketDays),
                    memberName: user.name,
                    month,
                    memberId
                } 
            },
            { upsert: true, new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Schedule (by month or all) - filter out rejected
router.get('/', auth, async (req, res) => {
    try {
        const schedule = await MarketRequest.find({ status: { $ne: 'rejected' } });
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create/Update Request or Assignment
router.post('/', auth, async (req, res) => {
    const { date, assignedMemberId, requestType, managerId } = req.body;

    if (!date || !assignedMemberId) {
        return res.status(400).json({ message: 'date and assignedMemberId are required' });
    }

    const isAdmin = req.user.role === 'admin';
    const isManager = await checkIsManager(req.user, date);

    // Security check: regular members can only create requests for THEMSELVES
    if (!isAdmin && !isManager && requestType !== 'request') {
        return res.status(403).json({ message: 'Access denied. Only admins or managers can manually assign market duties.' });
    }
    if (!isAdmin && !isManager && assignedMemberId !== req.user.id && assignedMemberId !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied. You can only create requests for yourself.' });
    }

    try {
        const isApproved = requestType !== 'request';

        // Upsert by date AND assignedMemberId
        const updated = await MarketRequest.findOneAndUpdate(
            { date, assignedMemberId },
            { requestType, status: isApproved ? 'approved' : 'pending' },
            { new: true, upsert: true }
        );

        // If newly approved (or manual_assign), delete/clear ANY other records for this date
        if (updated.status === 'approved') {
            await MarketRequest.deleteMany({
                date,
                _id: { $ne: updated._id }
            });
            // Cleanup notifications for this date
            await Notification.deleteMany({
                type: 'market_request',
                'metadata.date': date
            });
        }

        if (requestType === 'request') {
            // Notify Manager
            const targetManager = managerId || 'admin-1';
            await new Notification({
                userId: targetManager,
                message: `New Market Request for ${date}`,
                type: 'market_request',
                metadata: { date, requesterId: assignedMemberId }
            }).save();
        }

        res.json(updated);
    } catch (err) {
        console.error('[Market] POST / error:', err);
        res.status(400).json({ message: err.message });
    }
});

// Update status by ID (Approve / Reject / Remove)
router.put('/id/:id', auth, async (req, res) => {
    const { status } = req.body;
    console.log(`[Market] Received PUT /id/${req.params.id} with status: ${status} from user: ${req.user.name} (${req.user.role})`);
    try {
        const existing = await MarketRequest.findById(req.params.id);
        if (!existing) {
            console.log(`[Market] Request ${req.params.id} not found`);
            return res.status(404).json({ message: 'Request not found' });
        }

        const isAdmin = req.user.role === 'admin';
        const isManager = await checkIsManager(req.user, existing.date);

        console.log(`[Market] User role logic - isAdmin: ${isAdmin}, isManager: ${isManager}`);

        if (!isAdmin && !isManager && status === 'approved') {
            console.log(`[Market] 403 Forbidden: Only admins or managers can approve`);
            return res.status(403).json({ message: 'Only admins or the assigned manager can approve requests' });
        }

        if (status === 'approved') {
            existing.status = 'approved';
            await existing.save();

            // Auto-delete all other records for the same date so only 1 approved record exists
            await MarketRequest.deleteMany({
                date: existing.date,
                _id: { $ne: existing._id }
            });

            // Cleanup notifications
            await Notification.deleteMany({
                type: 'market_request',
                'metadata.date': existing.date
            });

            // Notify User (if not OFF_DAY)
            if (existing.assignedMemberId !== 'OFF_DAY') {
                await new Notification({
                    userId: existing.assignedMemberId,
                    message: `Your market request for ${existing.date} is APPROVED.`,
                    type: 'market_approved',
                    metadata: { date: existing.date }
                }).save();
            }

            console.log(`[Market] Successfully approved request ${existing._id}`);
            return res.json(existing);
        }

        if (status === 'rejected') {
            // A regular member can cancel their OWN request
            if (!isAdmin && !isManager) {
                if (existing.assignedMemberId !== req.user.id && existing.assignedMemberId !== req.user.userId) {
                    console.log(`[Market] 403 Forbidden: Member tried to reject someone else's request`);
                    return res.status(403).json({ message: 'You can only cancel your own requests' });
                }
            }

            // Move to Trash before deleting
            try {
                const trashedItem = new Trash({
                    originalId: req.params.id,
                    type: 'MarketRequest',
                    data: existing.toObject(),
                    deletedBy: req.user.id || req.user.userId || 'system',
                    deletedByName: req.user.name || 'Unknown'
                });
                await trashedItem.save();
                console.log(`[Market] Saved rejected request to Trash`);
            } catch (trashErr) {
                console.error(`[Market] Error saving to Trash:`, trashErr);
            }

            // Delete the request
            await MarketRequest.findByIdAndDelete(req.params.id);
            console.log(`[Market] Deleted request ${req.params.id}`);

            // Also delete any other records for the same date if any
            if (existing.date && existing.assignedMemberId) {
                await MarketRequest.deleteMany({
                    date: existing.date,
                    assignedMemberId: existing.assignedMemberId
                });
            }

            // If admin or manager rejected a member's request (not OFF_DAY and not self-cancel), notify
            if ((isAdmin || isManager) && existing.assignedMemberId !== 'OFF_DAY' && existing.assignedMemberId !== req.user.id && existing.assignedMemberId !== req.user.userId) {
                try {
                    await new Notification({
                        userId: existing.assignedMemberId,
                        message: `Your market request for ${existing.date} was removed/cancelled.`,
                        type: 'market_rejected',
                        metadata: { date: existing.date }
                    }).save();
                    console.log(`[Market] Sent rejection notification to ${existing.assignedMemberId}`);
                } catch (notifErr) {
                    console.error(`[Market] Error sending rejection notification:`, notifErr);
                }
            }

            return res.json({ message: 'Request removed/rejected', success: true });
        }

        console.log(`[Market] 400 Invalid status: ${status}`);
        res.status(400).json({ message: 'Invalid status' });
    } catch (err) {
        console.error(`[Market] Error processing PUT /id/${req.params.id}:`, err);
        res.status(400).json({ message: err.message });
    }
});

// Delete by ID
router.delete('/id/:id', auth, async (req, res) => {
    try {
        const existing = await MarketRequest.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const isAdmin = req.user.role === 'admin';
        const isManager = await checkIsManager(req.user, existing.date);

        if (!isAdmin && !isManager && existing.assignedMemberId !== req.user.id && existing.assignedMemberId !== req.user.userId) {
            return res.status(403).json({ message: 'You can only cancel your own requests' });
        }

        try {
            const trashedItem = new Trash({
                originalId: req.params.id,
                type: 'MarketRequest',
                data: existing.toObject(),
                deletedBy: req.user.id || req.user.userId || 'system',
                deletedByName: req.user.name || 'Unknown'
            });
            await trashedItem.save();
        } catch (trashErr) {
            console.error(`[Market] Trash error:`, trashErr);
        }

        await MarketRequest.findByIdAndDelete(req.params.id);
        return res.json({ message: 'Market request removed', success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete all market duties for a specific date (Admin / Manager)
router.delete('/date/:date', auth, async (req, res) => {
    try {
        const { date } = req.params;
        const isAdmin = req.user.role === 'admin';
        const isManager = await checkIsManager(req.user, date);

        if (!isAdmin && !isManager) {
            return res.status(403).json({ message: 'Only admins or managers can clear duties by date' });
        }

        const existingRecords = await MarketRequest.find({ date });
        for (const record of existingRecords) {
            try {
                const trashedItem = new Trash({
                    originalId: record._id.toString(),
                    type: 'MarketRequest',
                    data: record.toObject(),
                    deletedBy: req.user.id || req.user.userId || 'system',
                    deletedByName: req.user.name || 'Unknown'
                });
                await trashedItem.save();
            } catch (trashErr) {
                console.error(`[Market] Trash error:`, trashErr);
            }
        }

        await MarketRequest.deleteMany({ date });
        res.json({ message: `Duties for ${date} cleared`, count: existingRecords.length, success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Original route (For backward compatibility or simple rejection by date)
router.put('/:date', auth, async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    try {
        const existing = await MarketRequest.findOne({ date: req.params.date });
        if (!existing) return res.status(404).json({ message: 'Request not found' });

        // Redirect to ID based logic if specific
        return res.redirect(307, `/api/market/id/${existing._id}`);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
