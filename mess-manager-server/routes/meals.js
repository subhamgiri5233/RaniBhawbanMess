const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Trash = require('../models/Trash');
const { auth, requireAdmin } = require('../middleware/auth');

// GET /api/meals - Get all meals (optional: filter by date) - Requires auth
router.get('/', auth, async (req, res) => {
    try {
        const { date, month } = req.query;
        let query = {};
        if (date) {
            query.date = date;
        } else if (month) {
            // Escape special regex characters
            const escapedMonth = month.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Support both YYYY-MM and DD-MM-YYYY formats
            if (escapedMonth.includes('-')) {
                const parts = escapedMonth.split('-');
                if (parts.length === 2) {
                    const [year, mnt] = parts;
                    query.date = { $regex: `(${year}-${mnt}|-${mnt}-${year})` };
                } else {
                    query.date = { $regex: escapedMonth };
                }
            } else {
                query.date = { $regex: escapedMonth };
            }
        }
        const meals = await Meal.find(query);
        res.json(meals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/meals - Add a meal - Requires auth
router.post('/', auth, async (req, res) => {
    try {
        const { date, memberId, type, isGuest, guestMealType, mealTime } = req.body;

        // Security: Members can only add their own meals
        if (req.user.role === 'member' && memberId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You can only record your own meals.' });
        }

        // Fetch member name from User collection
        const user = await User.findOne({
            $or: [{ _id: memberId }, { userId: memberId }]
        });

        if (!user) {
            return res.status(404).json({ error: 'Member not found' });
        }

        const mealData = {
            date,
            memberId,
            memberName: user.name,
            type: isGuest ? 'guest' : type
        };

        // If it's a guest meal, add guest-specific fields
        if (isGuest) {
            mealData.isGuest = true;
            mealData.guestMealType = guestMealType;
            mealData.mealTime = mealTime; // Store lunch or dinner
        } else {
            mealData.isGuest = false;
        }

        const newMeal = new Meal(mealData);
        const savedMeal = await newMeal.save();
        res.status(201).json(savedMeal);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Meal already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// POST /api/meals/bulk - Add multiple meals - Requires auth
router.post('/bulk', auth, async (req, res) => {
    try {
        const { date, memberIds, type } = req.body;

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ error: 'memberIds must be a non-empty array' });
        }

        // Security: Members can only add their own meals
        if (req.user.role === 'member') {
            const onlySelf = memberIds.every(id => id === req.user.id);
            if (!onlySelf) {
                return res.status(403).json({ error: 'Access denied. You can only record your own meals.' });
            }
        }

        // Fetch all members in one go
        const members = await User.find({
            $or: [
                { _id: { $in: memberIds } },
                { userId: { $in: memberIds } }
            ]
        });

        const mealsToInsert = memberIds.map(memberId => {
            const user = members.find(m => String(m._id) === String(memberId) || m.userId === String(memberId));
            return {
                date,
                memberId,
                memberName: user ? user.name : 'Unknown',
                type,
                isGuest: false
            };
        });

        // Use insertMany with ordered: false to skip duplicates and continue
        const result = await Meal.insertMany(mealsToInsert, { ordered: false });
        res.status(201).json(result);
    } catch (err) {
        // If some succeeded and some failed due to duplicates, we might get a partial success or error
        if (err.code === 11000 || err.name === 'BulkWriteError') {
            // Some records were inserted, some were skipped
            return res.status(201).json({ 
                message: 'Bulk insert completed with some duplicates skipped',
                insertedCount: err.result?.nInserted || 0 
            });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/meals - Remove a meal - Requires auth
router.delete('/', auth, async (req, res) => {
    try {
        const { date, memberId, type, mealId } = req.body;

        // Security: Members can only remove their own meals
        if (req.user.role === 'member' && memberId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You can only remove your own meals.' });
        }

        let result;
        // If mealId provided (for guest meals), delete by ID
        if (mealId) {
            // Additional check for guest meals: ensure the host is the requester if not admin
            if (req.user.role === 'member') {
                const meal = await Meal.findById(mealId);
                if (meal && meal.memberId !== req.user.id) {
                    return res.status(403).json({ error: 'Access denied. This record does not belong to you.' });
                }
            }
            result = await Meal.findByIdAndDelete(mealId);
        } else {
            // Otherwise delete by date/memberId/type (for regular meals)
            result = await Meal.findOneAndDelete({ date, memberId, type, isGuest: false });
        }

        if (!result) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        // Move to Trash
        const trashedItem = new Trash({
            originalId: result._id,
            type: 'Meal',
            data: result.toObject(),
            deletedBy: req.user.id || req.user.userId,
            deletedByName: req.user.name
        });
        await trashedItem.save();

        res.json({ message: 'Meal moved to bin' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear all guest meals (with password verification) - Admin only
router.delete('/clear-all-guests', auth, requireAdmin, async (req, res) => {
    try {
        const { password } = req.body;

        // Verify password against Settings DB
        const setting = await Settings.findOne({ key: 'clear_guests_password' });
        if (!setting || setting.value !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Delete all guest meals
        const result = await Meal.deleteMany({ isGuest: true });

        res.json({
            message: 'All guest meals cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear all meals (with password verification) - Admin only
router.delete('/clear-all-meals', auth, requireAdmin, async (req, res) => {
    try {
        const { password } = req.body;

        // Verify password against Settings DB
        const setting = await Settings.findOne({ key: 'clear_all_meals_password' });
        if (!setting || setting.value !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Delete all meals (including guest meals)
        const result = await Meal.deleteMany({});

        res.json({
            message: 'All meals cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
