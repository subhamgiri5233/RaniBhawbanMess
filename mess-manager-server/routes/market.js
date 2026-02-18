const express = require('express');
const router = express.Router();
const MarketRequest = require('../models/MarketRequest');
const { auth, requireAdmin } = require('../middleware/auth');

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
        // Upsert
        const updated = await MarketRequest.findOneAndUpdate(
            { date },
            { assignedMemberId, requestType, status: requestType === 'request' ? 'pending' : 'approved' },
            { new: true, upsert: true }
        );

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

// Approve/Reject - Admin or Requester (for cancellation)
router.put('/:date', auth, async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    try {
        const existing = await MarketRequest.findOne({ date: req.params.date });
        if (!existing) return res.status(404).json({ message: 'Request not found' });

        const isAdmin = req.user.role === 'admin';
        const isRequester = existing.assignedMemberId === req.user.id;
        const isPending = existing.status === 'pending';

        if (status === 'approved') {
            // ONLY Admin can approve
            if (!isAdmin) {
                return res.status(403).json({ message: 'Access denied. Only managers can approve requests.' });
            }

            const updated = await MarketRequest.findOneAndUpdate(
                { date: req.params.date },
                { status: 'approved' },
                { new: true }
            );

            // CLEANUP: Delete any pending "New Market Request" alerts for this date
            await Notification.deleteMany({
                type: 'market_request',
                'metadata.date': req.params.date
            });

            // Notify User
            await new Notification({
                userId: existing.assignedMemberId,
                message: `Your market request for ${existing.date} is APPROVED.`,
                type: 'market_approved',
                metadata: { date: existing.date }
            }).save();

            return res.json(updated);
        }

        if (status === 'rejected') {
            // REJECT (Cancel) is allowed if:
            // 1. User is Admin (Standard Rejection)
            // 2. User is Requester AND it's still pending (Self-Cancellation)
            if (!isAdmin && !(isRequester && isPending)) {
                return res.status(403).json({ message: 'Access denied.' });
            }

            // "Not stored in database" -> Delete it
            await MarketRequest.findOneAndDelete({ date: req.params.date });

            // CLEANUP: Delete any pending "New Market Request" alerts for this date
            await Notification.deleteMany({
                type: 'market_request',
                'metadata.date': req.params.date
            });

            // Notify User only if NOT self-canceling
            if (isAdmin && !isRequester) {
                await new Notification({
                    userId: existing.assignedMemberId,
                    message: `Your market request for ${existing.date} was REJECTED. Please choose another date.`,
                    type: 'market_rejected',
                    metadata: { date: existing.date }
                }).save();
            }

            return res.json({ message: isRequester ? 'Request cancelled' : 'Request rejected and removed' });
        }

        res.status(400).json({ message: 'Invalid status update' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
