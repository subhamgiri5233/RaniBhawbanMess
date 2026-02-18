const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Verify JWT token + single-device session for all users
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Validate sessionToken to enforce single-device login
        if (decoded.sessionToken) {
            let dbUser;
            if (decoded.role === 'admin') {
                dbUser = await Admin.findById(decoded.id).select('sessionToken');
            } else {
                dbUser = await User.findById(decoded.id).select('sessionToken');
            }
            if (!dbUser || dbUser.sessionToken !== decoded.sessionToken) {
                return res.status(401).json({
                    message: 'Session expired. You have been logged in on another device.',
                    code: 'SESSION_REPLACED'
                });
            }
        }

        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Require admin role
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

// Require member role
const requireMember = (req, res, next) => {
    if (req.user && req.user.role === 'member') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Member only.' });
    }
};

module.exports = { auth, requireAdmin, requireMember };
