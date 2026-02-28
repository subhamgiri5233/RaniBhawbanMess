const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Meal = require('../models/Meal');
const { auth, requireAdmin } = require('../middleware/auth');

// Simple in-memory cache for members list (invalidated on any write)
let membersCache = { data: null, fetchedAt: 0 };
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const invalidateMembersCache = () => { membersCache = { data: null, fetchedAt: 0 }; };

// Get Member Summary (Name, Total Meals, Deposit) - Requires authentication
router.get('/summary', auth, async (req, res) => {
    try {
        const members = await User.find({
            $or: [{ role: 'member' }, { role: { $exists: false } }, { role: null }]
        }).lean();

        const summary = await Promise.all(members.map(async (member) => {
            // Check meals by both _id and userId to cover all cases
            const mealCount = await Meal.countDocuments({
                $or: [
                    { memberId: member._id.toString() },
                    { memberId: member.userId }
                ]
            });
            return {
                _id: member._id,
                userId: member.userId,
                name: member.name,
                totalMeals: mealCount
            };
        }));

        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all members - Requires authentication (admin gets passwords too)
router.get('/', auth, async (req, res) => {
    try {
        const now = Date.now();
        // Serve from cache if fresh enough
        if (membersCache.data && (now - membersCache.fetchedAt) < CACHE_TTL_MS) {
            return res.json(membersCache.data);
        }

        const query = User.find({
            $or: [{ role: 'member' }, { role: { $exists: false } }, { role: null }]
        });
        // Admin can see passwords, members cannot
        if (req.user.role !== 'admin') {
            query.select('-password');
        }
        const members = await query.lean();
        // Only cache non-admin responses to avoid leaking passwords
        if (req.user.role !== 'admin') {
            membersCache = { data: members, fetchedAt: now };
        }
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add Member - Admin only
router.post('/', auth, requireAdmin, async (req, res) => {
    const { name, email, userId, password, mobile, dateOfBirth } = req.body;

    try {
        const newMember = new User({
            name: name?.trim(),
            email: email?.trim(),
            userId: userId?.trim(),
            password: password?.trim(),
            mobile: mobile?.trim(),
            dateOfBirth,
            joinedAt: new Date().toISOString().split('T')[0],
            role: 'member'
        });
        const savedMember = await newMember.save();
        invalidateMembersCache();
        res.status(201).json(savedMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Member - Admin only
router.put('/:id', auth, requireAdmin, async (req, res) => {
    try {
        // Whitelist allowed fields to prevent mass assignment (e.g. role escalation)
        const { name, email, mobile, dateOfBirth } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (mobile !== undefined) updateData.mobile = mobile;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

        const updatedMember = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        invalidateMembersCache();
        res.json(updatedMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// Change Member Password - Admin only
router.patch('/:id/password', auth, requireAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ message: 'Password must be at least 4 characters' });
        }

        const member = await User.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        member.password = newPassword.trim();
        await member.save();
        invalidateMembersCache();
        res.json({ message: 'Password updated successfully', member });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Remove Member - Admin only
router.delete('/:id', auth, requireAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        invalidateMembersCache();
        res.json({ message: 'Member removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
