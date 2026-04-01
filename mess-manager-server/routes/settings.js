const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { auth, requireAdmin } = require('../middleware/auth');

/**
 * API Routes
 */

// Get all settings
router.get('/', auth, async (req, res) => {
    try {
        const settings = await Settings.find({});
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a setting
router.put('/:key', auth, requireAdmin, async (req, res) => {
    try {
        const { value, currentPassword } = req.body;

        // Allow 0 and empty strings by checking for undefined/null
        if (value === undefined || value === null) {
            return res.status(400).json({ message: 'New value is required' });
        }

        let setting = await Settings.findOne({ key: req.params.key });

        if (!setting) {
            setting = new Settings({
                key: req.params.key,
                value: String(value),
                category: 'system',
                description: 'Auto-initialized system setting'
            });
        }

        if (currentPassword && setting.value !== currentPassword) {
            return res.status(403).json({ message: 'Current password is incorrect' });
        }

        setting.value = String(value);
        await setting.save();

        res.json({
            message: 'Setting updated successfully',
            key: setting.key,
            value: setting.value,
            updatedAt: setting.updatedAt
        });
    } catch (err) {
        console.error('Settings update error:', err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * Initializes default system settings in the database.
 * Exported separately to be called on server startup.
 */
const initializeDefaultSettings = async () => {
    const defaults = [
        { key: 'clear_notifications_password', value: 'cnhis', category: 'feature' },
        { key: 'clear_guests_password', value: 'dage', category: 'feature' },
        { key: 'clear_all_meals_password', value: 'dame', category: 'feature' },
        { key: 'clear_expenses_password', value: 'hdelall', category: 'feature' },
        { key: 'min_meals_month', value: '40', category: 'system' },
        { key: 'guest_price_fish', value: '40', category: 'system' },
        { key: 'guest_price_egg', value: '40', category: 'system' },
        { key: 'guest_price_veg', value: '35', category: 'system' },
        { key: 'guest_price_meat', value: '50', category: 'system' },
        { key: 'gita_start_date', value: '2026-04-01', category: 'system' },
        { key: 'gita_shlokas_completed', value: '0', category: 'system' }
    ];

    try {
        for (const setting of defaults) {
            const exists = await Settings.findOne({ key: setting.key });
            if (!exists) {
                await Settings.create(setting);
            }
        }
    } catch (err) {
        console.error('Failed to initialize default settings:', err);
    }
};

module.exports = router;
module.exports.initializeDefaultSettings = initializeDefaultSettings;
