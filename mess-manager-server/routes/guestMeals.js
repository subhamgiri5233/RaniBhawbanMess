const express = require('express');
const router = express.Router();
const GuestMeal = require('../models/GuestMeal');
const User = require('../models/User');
const { auth, requireAdmin } = require('../middleware/auth');
const Settings = require('../models/Settings');

// GET /api/guest-meals - Get all guest meals (optional: filter by date or month) - Requires auth
router.get('/', auth, async (req, res) => {
    try {
        const { date, month } = req.query;
        let query = {};

        if (date) {
            query.date = date;
        } else if (month) {
            // regex for YYYY-MM
            query.date = { $regex: `^${month}` };
        }

        const guestMeals = await GuestMeal.find(query).sort({ createdAt: -1 });
        res.json(guestMeals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/guest-meals - Add a guest meal - Requires auth
router.post('/', auth, async (req, res) => {
    try {
        const { date, memberId, guestMealType, mealTime } = req.body;

        // Security: Members can only add their own guest meals
        if (req.user.role === 'member' && memberId !== req.user.id && memberId !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied. You can only record your own guest meals.' });
        }

        // Validate required fields
        if (!date || !memberId || !guestMealType || !mealTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Fetch member name from User collection
        const user = await User.findOne({
            $or: [{ _id: memberId }, { userId: memberId }]
        });

        if (!user) {
            return res.status(404).json({ error: 'Member not found' });
        }

        const guestMeal = new GuestMeal({
            date,
            memberId,
            memberName: user.name,
            guestMealType,
            mealTime
        });

        await guestMeal.save();
        res.status(201).json(guestMeal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/guest-meals/:id - Remove a specific guest meal by ID - Requires auth
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Security: Members can only remove their own guest meals
        if (req.user.role === 'member') {
            const guestMeal = await GuestMeal.findById(id);
            if (guestMeal && guestMeal.memberId !== req.user.id && guestMeal.memberId !== req.user.userId) {
                return res.status(403).json({ error: 'Access denied. You can only remove your own guest meals.' });
            }
        }
        const result = await GuestMeal.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ error: 'Guest meal not found' });
        }

        res.json({ message: 'Guest meal removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/guest-meals/clear-all - Clear all guest meals (with password verification) - Admin only
router.delete('/clear-all/confirm', auth, requireAdmin, async (req, res) => {
    try {
        const { password } = req.body;

        // Verify password against Settings DB
        const setting = await Settings.findOne({ key: 'clear_guests_password' });
        if (!setting || setting.value !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Delete all guest meals
        const result = await GuestMeal.deleteMany({});

        res.json({
            message: 'All guest meals cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
