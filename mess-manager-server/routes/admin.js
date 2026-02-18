const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { auth, requireAdmin } = require('../middleware/auth');

// Get current admin username only (password is NEVER sent to frontend)
router.get('/credentials', auth, requireAdmin, async (req, res) => {
    try {
        const admin = await Admin.findOne();

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Only return username — NEVER expose any part of the password
        res.json({
            username: admin.username
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch credentials' });
    }
});

// Change admin password — requires current admin auth + verifies current password from DB
router.put('/change-password', auth, requireAdmin, async (req, res) => {
    try {
        const { currentPassword, newUsername, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Get current admin from DB
        const admin = await Admin.findOne();

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Verify current password against DB (not hardcoded)
        if (admin.password !== currentPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update credentials
        admin.username = newUsername || admin.username;
        admin.password = newPassword;
        admin.updatedAt = Date.now();
        await admin.save();

        res.json({
            success: true,
            message: 'Admin credentials updated successfully',
            username: admin.username
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to change password' });
    }
});

module.exports = router;
