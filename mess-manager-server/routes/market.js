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
    try {
        const existing = await MarketRequest.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Request not found' });

        const isAdmin = req.user.role === 'admin';
        if (!isAdmin && status === 'approved') {
            return res.status(403).json({ message: 'Only admins can approve requests' });
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

            return res.json(existing);
        }

        if (status === 'rejected') {
            // For rejection, we usually just delete to keep calendar clean for requests
            await MarketRequest.findByIdAndDelete(req.params.id);

            // If admin rejected it (and it wasn't a self-cancel), notify
            if (isAdmin && existing.assignedMemberId !== req.user.id) {
                await new Notification({
                    userId: existing.assignedMemberId,
                    message: `Your market request for ${existing.date} was REJECTED.`,
                    type: 'market_rejected',
                    metadata: { date: existing.date }
                }).save();
            }

            return res.json({ message: 'Request removed/rejected' });
        }

        res.status(400).json({ message: 'Invalid status' });
    } catch (err) {
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
