const express = require('express');
const router = express.Router();
const MarketRequest = require('../models/MarketRequest');
const MonthlySummary = require('../models/MonthlySummary');
const User = require('../models/User'); // For member list
const Trash = require('../models/Trash'); // Added for rejection history
const { auth, requireAdmin } = require('../middleware/auth');

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

// Get Schedule (by month or all)
router.get('/', auth, async (req, res) => {
    try {
        const schedule = await MarketRequest.find();
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const Notification = require('../models/Notification');

// Create/Update Request or Assignment
router.post('/', auth, async (req, res) => {
    const { date, assignedMemberId, requestType, managerId } = req.body;

    // Security check: members can only create requests for THEMSELVES
    if (req.user.role === 'member' && assignedMemberId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You can only create requests for yourself.' });
    }

    try {
        // Upsert by date AND memberId
        const updated = await MarketRequest.findOneAndUpdate(
            { date, assignedMemberId },
            { requestType, status: requestType === 'request' ? 'pending' : 'approved' },
            { new: true, upsert: true }
        );

        // If newly approved, reject others for this date
        if (updated.status === 'approved') {
            await MarketRequest.updateMany(
                { date, _id: { $ne: updated._id }, status: 'pending' },
                { status: 'rejected' }
            );
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
        res.status(400).json({ message: err.message });
    }
});

// Update status by ID (New more specific route)
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
        
        // Find if user is the assigned manager for the month of this request
        let isManager = false;
        if (!isAdmin) {
            const Manager = require('../models/Manager');
            const requestMonth = existing.date.substring(0, 7);
            const managerDoc = await Manager.findOne({ month: requestMonth });
            if (managerDoc && (managerDoc.memberId === req.user.id || managerDoc.memberId === req.user.userId)) {
                isManager = true;
            }
        }

        console.log(`[Market] User role logic - isAdmin: ${isAdmin}, isManager: ${isManager}`);

        if (!isAdmin && !isManager && status === 'approved') {
            console.log(`[Market] 403 Forbidden: Only admins or managers can approve`);
            return res.status(403).json({ message: 'Only admins or the assigned manager can approve requests' });
        }

        if (status === 'approved') {
            existing.status = 'approved';
            await existing.save();

            // Auto-reject others for the same date
            await MarketRequest.updateMany(
                { date: existing.date, _id: { $ne: existing._id }, status: 'pending' },
                { status: 'rejected' }
            );

            // Cleanup notifications
            await Notification.deleteMany({
                type: 'market_request',
                'metadata.date': existing.date
            });

            // Notify User
            await new Notification({
                userId: existing.assignedMemberId,
                message: `Your market request for ${existing.date} is APPROVED.`,
                type: 'market_approved',
                metadata: { date: existing.date }
            }).save();

            console.log(`[Market] Successfully approved request ${existing._id}`);
            return res.json(existing);
        }

        if (status === 'rejected') {
            // A regular member can only reject their OWN pending request
            if (!isAdmin && !isManager) {
                if (existing.assignedMemberId !== req.user.id && existing.assignedMemberId !== req.user.userId) {
                    console.log(`[Market] 403 Forbidden: Member tried to reject someone else's request`);
                    return res.status(403).json({ message: 'You can only cancel your own requests' });
                }
            }

            // Move to Trash before deleting
            const trashedItem = new Trash({
                originalId: req.params.id,
                type: 'MarketRequest',
                data: existing.toObject(),
                deletedBy: req.user.id || req.user.userId,
                deletedByName: req.user.name || 'Unknown'
            });
            await trashedItem.save();
            console.log(`[Market] Saved rejected request to Trash`);

            // For rejection, we usually just delete to keep calendar clean for requests
            await MarketRequest.findByIdAndDelete(req.params.id);
            console.log(`[Market] Deleted request ${req.params.id}`);

            // If admin or manager rejected it (and it wasn't a self-cancel), notify
            if ((isAdmin || isManager) && existing.assignedMemberId !== req.user.id && existing.assignedMemberId !== req.user.userId) {
                await new Notification({
                    userId: existing.assignedMemberId,
                    message: `Your market request for ${existing.date} was REJECTED.`,
                    type: 'market_rejected',
                    metadata: { date: existing.date }
                }).save();
                console.log(`[Market] Sent rejection notification to ${existing.assignedMemberId}`);
            }

            return res.json({ message: 'Request removed/rejected' });
        }

        console.log(`[Market] 400 Invalid status: ${status}`);
        res.status(400).json({ message: 'Invalid status' });
    } catch (err) {
        console.error(`[Market] Error processing PUT /id/${req.params.id}:`, err);
        res.status(400).json({ message: err.message });
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
