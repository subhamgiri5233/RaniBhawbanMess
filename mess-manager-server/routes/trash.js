const express = require('express');
const router = express.Router();
const Trash = require('../models/Trash');
const Expense = require('../models/Expense');
const Meal = require('../models/Meal');
const GuestMeal = require('../models/GuestMeal');
const User = require('../models/User');
const { auth, requireAdmin } = require('../middleware/auth');

// Get all trashed items - Admin only
router.get('/', auth, requireAdmin, async (req, res) => {
    try {
        const items = await Trash.find().sort({ deletedAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Restore a trashed item
router.post('/restore/:id', auth, requireAdmin, async (req, res) => {
    try {
        const trashedItem = await Trash.findById(req.params.id);
        if (!trashedItem) {
            return res.status(404).json({ message: 'Item not found in bin' });
        }

        const { type, data } = trashedItem;
        let restoredItem;

        // Restore to original collection based on type
        if (type === 'Expense') {
            restoredItem = new Expense(data);
        } else if (type === 'Meal') {
            restoredItem = new Meal(data);
        } else if (type === 'GuestMeal') {
            restoredItem = new GuestMeal(data);
        } else if (type === 'Member') {
            restoredItem = new User(data);
        } else {
            return res.status(400).json({ message: 'Unknown item type' });
        }

        await restoredItem.save();
        await Trash.findByIdAndDelete(req.params.id);

        res.json({ message: 'Item restored successfully', restoredItem });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ 
                message: `Restoration failed: A record with this unique identity already exists in the destination. Please check the active ${req.body.type || 'records'}.` 
            });
        }
        res.status(500).json({ message: err.message });
    }
});

// Permanently delete an item from trash
router.delete('/:id', auth, requireAdmin, async (req, res) => {
    try {
        await Trash.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Clear entire bin
router.delete('/clear/all', auth, requireAdmin, async (req, res) => {
    try {
        await Trash.deleteMany({});
        res.json({ message: 'Bin cleared successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
