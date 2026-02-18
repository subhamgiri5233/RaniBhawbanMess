const express = require('express');
const router = express.Router();
const CookingRecord = require('../models/CookingRecord');
const User = require('../models/User');
const { auth, requireAdmin } = require('../middleware/auth');

// Get all cooking records - Requires auth
router.get('/', auth, async (req, res) => {
    try {
        const records = await CookingRecord.find().sort({ date: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get cooking records for a specific date - Requires auth
router.get('/date/:date', auth, async (req, res) => {
    try {
        const records = await CookingRecord.find({ date: req.params.date });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a cooking record - Admin only
router.post('/', auth, requireAdmin, async (req, res) => {
    try {
        const { memberId, date, assignedBy } = req.body;

        // Get member name
        const member = await User.findById(memberId);
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Check if record already exists for this member and date
        const existing = await CookingRecord.findOne({ memberId, date });
        if (existing) {
            return res.status(400).json({ error: 'Cooking record already exists for this member and date' });
        }

        const record = new CookingRecord({
            memberId,
            memberName: member.name,
            date,
            cooked: true
        });

        await record.save();

        // Send notification ONLY if assigned by someone else (admin), not self
        if (assignedBy && assignedBy !== memberId) {
            const Notification = require('../models/Notification');

            // Handle admin case (admin-1 is not in User collection)
            let assignedByName = 'Admin';
            if (assignedBy !== 'admin-1') {
                const assignedByUser = await User.findById(assignedBy);
                assignedByName = assignedByUser?.name || 'Admin';
            }

            const notification = new Notification({
                userId: memberId,
                message: `You have been assigned cooking duty for ${date} by ${assignedByName}`,
                type: 'cooking_assignment',
                date: new Date().toISOString().split('T')[0],
                isRead: false
            });

            await notification.save();
        }

        res.status(201).json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a cooking record - Admin only
router.delete('/:id', auth, requireAdmin, async (req, res) => {
    try {
        await CookingRecord.findByIdAndDelete(req.params.id);
        res.json({ message: 'Cooking record deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
