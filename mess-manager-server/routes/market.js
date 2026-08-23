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
        const schedule = await MarketRequest.find({ status: { $ne: 'rejected' } }).lean();
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
            MarketRequest.deleteMany({
                date,
                _id: { $ne: updated._id }
            }).catch(err => console.error('[Market] Cleanup error:', err));
            
            // Cleanup notifications for this date
            Notification.deleteMany({
                type: 'market_request',
                'metadata.date': date
            }).catch(err => console.error('[Market] Notification cleanup error:', err));
        }

        if (requestType === 'request') {
            // Notify Manager in background
            const targetManager = managerId || 'admin-1';
            new Notification({
                userId: targetManager,
                message: `New Market Request for ${date}`,
                type: 'market_request',
                metadata: { date, requesterId: assignedMemberId }
            }).save().catch(err => console.error('[Market] Notification save error:', err));
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
    try {
        let existing = await MarketRequest.findById(req.params.id);
        if (!existing) {
            // Also check if id passed was actually a date
            existing = await MarketRequest.findOne({ date: req.params.id });
        }

        if (!existing) {
            if (status === 'rejected') {
                return res.json({ message: 'Request already removed', success: true });
            }
            return res.status(404).json({ message: 'Request not found' });
        }

        const isAdmin = req.user.role === 'admin';
        const isManager = await checkIsManager(req.user, existing.date);

        if (!isAdmin && !isManager && status === 'approved') {
            return res.status(403).json({ message: 'Only admins or the assigned manager can approve requests' });
        }

        if (status === 'approved') {
            existing.status = 'approved';
            await existing.save();

            // Auto-delete all other records for the same date in background
            MarketRequest.deleteMany({
                date: existing.date,
                _id: { $ne: existing._id }
            }).catch(err => console.error('[Market] Conflict delete error:', err));

            // Cleanup notifications in background
            Notification.deleteMany({
                type: 'market_request',
                'metadata.date': existing.date
            }).catch(err => console.error('[Market] Notification delete error:', err));

            // Notify User (if not OFF_DAY) in background
            if (existing.assignedMemberId !== 'OFF_DAY') {
                new Notification({
                    userId: existing.assignedMemberId,
                    message: `Your market request for ${existing.date} is APPROVED.`,
                    type: 'market_approved',
                    metadata: { date: existing.date }
                }).save().catch(err => console.error('[Market] Notif error:', err));
            }

            return res.json(existing);
        }

        if (status === 'rejected') {
            // Move to Trash in background
            new Trash({
                originalId: req.params.id,
                type: 'MarketRequest',
                data: existing.toObject(),
                deletedBy: req.user.id || req.user.userId || 'system',
                deletedByName: req.user.name || 'Unknown'
            }).save().catch(trashErr => console.error('[Market] Trash save error:', trashErr));

            // Delete the request and all records on that date
            await MarketRequest.findByIdAndDelete(existing._id);
            if (existing.date) {
                MarketRequest.deleteMany({ date: existing.date }).catch(err => console.error('[Market] deleteMany error:', err));
            }

            // Background rejection notification
            if (existing.assignedMemberId !== 'OFF_DAY' && existing.assignedMemberId !== req.user.id && existing.assignedMemberId !== req.user.userId) {
                new Notification({
                    userId: existing.assignedMemberId,
                    message: `Your market duty for ${existing.date} was removed/cancelled.`,
                    type: 'market_rejected',
                    metadata: { date: existing.date }
                }).save().catch(notifErr => console.error('[Market] Notif error:', notifErr));
            }

            return res.json({ message: 'Request removed/rejected', success: true });
        }

        res.status(400).json({ message: 'Invalid status' });
    } catch (err) {
        console.error(`[Market] Error processing PUT /id/${req.params.id}:`, err);
        res.status(400).json({ message: err.message });
    }
});

// Delete by ID
router.delete('/id/:id', auth, async (req, res) => {
    try {
        let existing = await MarketRequest.findById(req.params.id);
        if (!existing) {
            existing = await MarketRequest.findOne({ date: req.params.id });
        }

        if (existing) {
            new Trash({
                originalId: req.params.id,
                type: 'MarketRequest',
                data: existing.toObject(),
                deletedBy: req.user.id || req.user.userId || 'system',
                deletedByName: req.user.name || 'Unknown'
            }).save().catch(trashErr => console.error(`[Market] Trash error:`, trashErr));

            await MarketRequest.findByIdAndDelete(existing._id);
            if (existing.date) {
                MarketRequest.deleteMany({ date: existing.date }).catch(err => console.error(err));
            }
        } else {
            await MarketRequest.deleteMany({ date: req.params.id });
        }

        return res.json({ message: 'Market request removed', success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete all market duties for a specific date (Admin / Manager / User clearing date)
router.delete('/date/:date', auth, async (req, res) => {
    try {
        const { date } = req.params;
        const existingRecords = await MarketRequest.find({ date }).lean();
        
        if (existingRecords.length > 0) {
            const trashEntries = existingRecords.map(record => ({
                originalId: record._id.toString(),
                type: 'MarketRequest',
                data: record,
                deletedBy: req.user.id || req.user.userId || 'system',
                deletedByName: req.user.name || 'Unknown'
            }));
            Trash.insertMany(trashEntries).catch(trashErr => console.error(`[Market] Trash bulk error:`, trashErr));
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
        if (status === 'rejected') {
            await MarketRequest.deleteMany({ date: req.params.date });
            return res.json({ message: 'Duties for date cleared', success: true });
        }

        const existing = await MarketRequest.findOne({ date: req.params.date });
        if (!existing) return res.status(404).json({ message: 'Request not found' });

        existing.status = 'approved';
        await existing.save();
        await MarketRequest.deleteMany({ date: req.params.date, _id: { $ne: existing._id } });
        return res.json(existing);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
