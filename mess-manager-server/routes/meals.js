const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Trash = require('../models/Trash');
const MonthlySummary = require('../models/MonthlySummary');
const MarketRequest = require('../models/MarketRequest');
const { auth, requireAdmin } = require('../middleware/auth');

// Helper: Check if user is the market manager for a specific date
const checkIsDayManager = async (user, date) => {
    if (!user || !date) return false;
    if (user.role === 'admin') return true;
    try {
        const record = await MarketRequest.findOne({ date, status: 'approved' });
        if (!record) return false;
        const uid = user.id || user.userId || user._id?.toString();
        return record.assignedMemberId === uid;
    } catch (e) {
        console.error('[Meals] checkIsDayManager error:', e);
        return false;
    }
};

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
        const meals = await Meal.find(query).lean();
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
        }).lean().select('name');

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
// Market managers (approved for that date) can also add meals for all members on their duty day
router.post('/bulk', auth, async (req, res) => {
    try {
        const { date, memberIds, type } = req.body;

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ error: 'memberIds must be a non-empty array' });
        }

        // Security: Members can only add their own meals UNLESS they are the market manager for that date
        if (req.user.role === 'member') {
            const onlySelf = memberIds.every(id => id === req.user.id);
            if (!onlySelf) {
                // Check if this member is the market manager for the given date
                const isDayManager = await checkIsDayManager(req.user, date);
                if (!isDayManager) {
                    return res.status(403).json({ error: 'Access denied. Only the market manager for this date can record meals for all members.' });
                }
            }
        }

        // Fetch all members in one go
        const members = await User.find({
            $or: [
                { _id: { $in: memberIds } },
                { userId: { $in: memberIds } }
            ]
        }).lean().select('_id userId name');

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

        // Move to Trash in background
        new Trash({
            originalId: result._id,
            type: 'Meal',
            data: result.toObject(),
            deletedBy: req.user.id || req.user.userId,
            deletedByName: req.user.name
        }).save().catch(trashErr => console.error('[Meal] Trash save error:', trashErr));

        res.json({ message: 'Meal moved to bin', success: true });
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

// -----------------------------------------------------------------------
// PUT /api/meals/override - Admin sets a member's total meal count for a month
// Stores a mealOverride value in MonthlySummary (non-destructive)
// -----------------------------------------------------------------------
router.put('/override', auth, requireAdmin, async (req, res) => {
    try {
        const { memberId, month, totalMeals } = req.body;

        if (!memberId || !month) {
            return res.status(400).json({ error: 'memberId and month are required' });
        }

        // totalMeals = null removes the override; otherwise must be a non-negative integer
        const overrideValue = totalMeals === null || totalMeals === undefined ? null : Number(totalMeals);
        if (overrideValue !== null && (isNaN(overrideValue) || overrideValue < 0)) {
            return res.status(400).json({ error: 'totalMeals must be a non-negative number or null' });
        }

        // Fetch member name for upsert
        const member = await User.findById(memberId).lean().select('name');
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        const updated = await MonthlySummary.findOneAndUpdate(
            { month, memberId },
            { $set: { mealOverride: overrideValue, memberName: member.name, month, memberId } },
            { upsert: true, new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/meals/overrides/:month - Get all meal overrides for a month (admin/member)
router.get('/overrides/:month', auth, async (req, res) => {
    try {
        const { month } = req.params;
        const records = await MonthlySummary.find({ month, mealOverride: { $ne: null } })
            .select('memberId memberName mealOverride month')
            .lean();
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
