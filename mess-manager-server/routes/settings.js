const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { auth, requireAdmin } = require('../middleware/auth');

// Initialize default settings if they don't exist
const initializeDefaultSettings = async () => {
    const defaults = [
        {
            key: 'clear_notifications_password',
            value: 'cnhis',
            category: 'feature',
            description: 'Password required to clear all notification history'
        },
        {
            key: 'clear_guests_password',
            value: 'dage',
            category: 'feature',
            description: 'Password required to clear all guest meals'
        },
        {
            key: 'clear_all_meals_password',
            value: 'dame',
            category: 'feature',
            description: 'Password required to clear all meals'
        },
        {
            key: 'clear_expenses_password',
            value: 'hdelall',
            category: 'feature',
            description: 'Password required to clear all admin expense history'
        }
    ];

    for (const setting of defaults) {
        const exists = await Settings.findOne({ key: setting.key });
        if (!exists) {
            await Settings.create(setting);
        }
    }
};




// Get all settings (admin only - includes values)
router.get('/', auth, requireAdmin, async (req, res) => {
    try {
        const settings = await Settings.find();

        const settingsData = settings.map(s => ({
            key: s.key,
            value: s.value,
            category: s.category,
            description: s.description,
            updatedAt: s.updatedAt
        }));

        res.json(settingsData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a specific setting (admin only - includes value)
router.get('/:key', auth, requireAdmin, async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: req.params.key });
        if (!setting) {
            return res.status(404).json({ message: 'Setting not found' });
        }
        res.json({
            key: setting.key,
            value: setting.value,
            category: setting.category,
            description: setting.description,
            updatedAt: setting.updatedAt
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify a password for a feature
router.post('/verify', auth, async (req, res) => {
    try {
        const { key, password } = req.body;
        const setting = await Settings.findOne({ key });

        if (!setting) {
            return res.status(404).json({ message: 'Setting not found' });
        }

        const isValid = setting.value === password;
        res.json({ valid: isValid });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a setting
router.put('/:key', auth, requireAdmin, async (req, res) => {
    try {
        const { value, currentPassword } = req.body;

        if (!value) {
            return res.status(400).json({ message: 'New value is required' });
        }

        const setting = await Settings.findOne({ key: req.params.key });

        if (!setting) {
            return res.status(404).json({ message: 'Setting not found' });
        }

        // Verify current password
        if (currentPassword) {
            if (setting.value !== currentPassword) {
                return res.status(403).json({ message: 'Current password is incorrect' });
            }
        }

        setting.value = value;
        await setting.save();

        res.json({
            message: 'Setting updated successfully',
            key: setting.key,
            updatedAt: setting.updatedAt
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Create new setting (admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
    try {
        const { key, value, category, description } = req.body;

        const exists = await Settings.findOne({ key });
        if (exists) {
            return res.status(400).json({ message: 'Setting already exists' });
        }

        const setting = new Settings({
            key,
            value,
            category,
            description
        });

        await setting.save();
        res.status(201).json({
            message: 'Setting created successfully',
            key: setting.key
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
module.exports.initializeDefaultSettings = initializeDefaultSettings;
