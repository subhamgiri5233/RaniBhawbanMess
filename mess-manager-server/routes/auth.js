const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const webpush = require('web-push');

// Configure web-push
webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:adarshagiri@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Simple JWT token generator
const generateToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// SIMPLE LOGIN - No complicated logic
router.post('/login', async (req, res) => {
    try {
        const { userId, password, role } = req.body;

        if (role === 'admin') {
            // Admin login - always verify against database
            const admin = await Admin.findOne();

            if (!admin) {
                return res.status(401).json({ success: false, message: 'Admin account not found. Please contact the system administrator.' });
            }

            // Always verify credentials against the database
            if (admin.username.toLowerCase() === userId.toLowerCase() && admin.password === password) {
                const token = generateToken({
                    id: admin._id,
                    username: admin.username,
                    role: 'admin',
                    name: 'Mess Admin'
                });

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: admin._id,
                        name: 'Mess Admin',
                        role: 'admin',
                        avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
                    }
                });
            }

            return res.status(401).json({ success: false, message: 'Invalid credentials' });

        } else {
            // Member login
            let user;
            try {
                user = await User.findOne({ userId: userId });
            } catch (dbError) {
                console.error('❌ Database query error:', dbError);
                return res.status(500).json({ success: false, message: 'Database error: ' + dbError.message });
            }

            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            if (user.password === password) {
                const token = generateToken({
                    id: user._id,
                    userId: user.userId,
                    role: 'member',
                    name: user.name
                });

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        role: 'member',
                        userId: user.userId,
                        notificationPermission: user.notificationPermission || 'default',
                        avatar: `https://ui-avatars.com/api/?name=${user.name}&background=random`
                    }
                });
            }

            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Token verification
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch fresh data from DB to get latest permissions/avatar/etc.
        let userData;
        if (decoded.role === 'admin') {
            const admin = await Admin.findById(decoded.id);
            userData = {
                id: admin._id,
                username: admin.username,
                role: 'admin',
                name: 'Mess Admin',
                avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
            };
        } else {
            const user = await User.findById(decoded.id);
            if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });
            userData = {
                id: user._id,
                name: user.name,
                role: 'member',
                userId: user.userId,
                notificationPermission: user.notificationPermission || 'default',
                avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`
            };
        }
        
        res.json({ success: true, user: userData });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// Member self-service password change
const { auth } = require('../middleware/auth');
router.patch('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ success: false, message: 'New password must be at least 4 characters' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.password !== currentPassword) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword.trim();
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Member self-service avatar update
router.patch('/update-avatar', auth, async (req, res) => {
    try {
        const { avatar } = req.body;
        if (!avatar) {
            return res.status(400).json({ success: false, message: 'Avatar seed is required' });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatar },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, avatar: user.avatar });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update notification permission status
router.patch('/update-notification-permission', auth, async (req, res) => {
    try {
        const { permission } = req.body;
        if (!permission) {
            return res.status(400).json({ success: false, message: 'Permission status is required' });
        }
        
        let updatedUser;
        if (req.user.role === 'admin') {
            updatedUser = await Admin.findByIdAndUpdate(
                req.user.id,
                { notificationPermission: permission },
                { new: true }
            );
        } else {
            updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { notificationPermission: permission },
                { new: true }
            );
        }
        
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, notificationPermission: updatedUser.notificationPermission });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Save Web Push subscription
router.post('/subscribe', auth, async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription) {
            return res.status(400).json({ success: false, message: 'Subscription is required' });
        }
        
        let updatedUser;
        if (req.user.role === 'admin') {
            updatedUser = await Admin.findByIdAndUpdate(
                req.user.id,
                { pushSubscription: subscription },
                { new: true }
            );
        } else {
            updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { pushSubscription: subscription },
                { new: true }
            );
        }
        
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.status(201).json({ success: true, message: 'Subscription saved' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get VAPID Public Key
router.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
