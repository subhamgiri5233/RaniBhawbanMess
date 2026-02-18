const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Simple JWT token generator
const generateToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
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
                // Generate a unique session token for single-device login
                const sessionToken = require('crypto').randomBytes(32).toString('hex');

                // Store session token in DB — this invalidates any previous session
                await User.findByIdAndUpdate(user._id, { sessionToken });

                const token = generateToken({
                    id: user._id,
                    userId: user.userId,
                    role: 'member',
                    name: user.name,
                    sessionToken // embed in JWT so middleware can validate
                });

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        role: 'member',
                        userId: user.userId,
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
        res.json({ success: true, user: decoded });
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

module.exports = router;
