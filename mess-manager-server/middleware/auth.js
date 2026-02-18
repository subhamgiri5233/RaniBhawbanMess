const jwt = require('jsonwebtoken');

// Verify JWT token
const auth = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
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
