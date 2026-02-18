const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Meal = require('../models/Meal');
const { auth, requireAdmin } = require('../middleware/auth');



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
                totalMeals: mealCount,
                deposit: member.deposit || 0
            };
        }));

        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all members - Requires authentication
router.get('/', auth, async (req, res) => {
    try {
        // Return members (excluding admin ideally, but 'role' filter works)
        const members = await User.find({
            $or: [{ role: 'member' }, { role: { $exists: false } }, { role: null }]
        }).select('-password');
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add Member - Admin only
router.post('/', auth, requireAdmin, async (req, res) => {
    const { name, email, userId, password, mobile, deposit, dateOfBirth } = req.body;

    try {
        const newMember = new User({
            name: name?.trim(),
            email: email?.trim(),
            userId: userId?.trim(),
            password: password?.trim(),
            mobile: mobile?.trim(),
            dateOfBirth,
            deposit,
            joinedAt: new Date().toISOString().split('T')[0],
            role: 'member'
        });
        const savedMember = await newMember.save();
        res.status(201).json(savedMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Member - Admin only
router.put('/:id', auth, requireAdmin, async (req, res) => {
    try {
        // Whitelist allowed fields to prevent mass assignment (e.g. role escalation)
        const { name, email, mobile, deposit, dateOfBirth } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (mobile !== undefined) updateData.mobile = mobile;
        if (deposit !== undefined) updateData.deposit = deposit;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

        const updatedMember = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
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

        res.json({ message: 'Password updated successfully', member });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Remove Member - Admin only
router.delete('/:id', auth, requireAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Member removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
