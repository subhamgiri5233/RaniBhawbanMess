// Server last updated: 2026-08-25T19:41 - Atlas Live Sync
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();
app.set('trust proxy', 1); // Crucial for reverse proxies (Render, Vercel, Nginx)
app.use(compression()); // Compress all responses
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mess-manager';

// Security Middleware
app.use(helmet()); // Security headers

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://rani-bhawban-mess.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        // Allow listed origins, all vercel subdomains, all localhost/127.0.0.1 ports, and local IP networks
        if (
            allowedOrigins.indexOf(origin) !== -1 || 
            origin.endsWith('.vercel.app') ||
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
            /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)
        ) {
            return callback(null, true);
        }
        
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting - Generous for production and multi-user environments
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Generous limit for concurrent dashboard polling
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const remainingMs = req.rateLimit?.resetTime ? req.rateLimit.resetTime - new Date() : 60000;
        const remainingMins = Math.ceil(remainingMs / (60 * 1000));
        res.status(options.statusCode).json({
            success: false,
            message: `Too many requests from this network, please try again after ${remainingMins} minute${remainingMins > 1 ? 's' : ''}.`
        });
    }
});
app.use('/api/', limiter);

// Rate limit for auth routes: skips successful logins so legitimate members are NEVER blocked
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 attempts per 15 min per IP (accommodates shared mess Wi-Fi)
    skipSuccessfulRequests: true, // Legitimate logins do NOT consume the limit
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const remainingMs = req.rateLimit?.resetTime ? req.rateLimit.resetTime - new Date() : 60000;
        const remainingMins = Math.ceil(remainingMs / (60 * 1000));
        res.status(options.statusCode).json({
            success: false,
            message: `Too many invalid login attempts, please try again after ${remainingMins} minute${remainingMins > 1 ? 's' : ''}.`
        });
    }
});

// Body parsers (reduced limits for security)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// NoSQL Injection Protection (custom, compatible with Express 5)
const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
        }
    }
    return obj;
};
app.use((req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.params) sanitizeObject(req.params);
    if (req.query) sanitizeObject(req.query);
    next();
});

// Database Connection with High Concurrency Pool Configuration
mongoose.connect(MONGO_URI, {
    maxPoolSize: 50, // Maintain up to 50 socket connections for high concurrent users
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(async () => {
        console.log('✅ MongoDB Connected with High Concurrency Pool (max: 50)');
        // Initialize default settings after DB is connected
        const { initializeDefaultSettings } = require('./routes/settings');
        await initializeDefaultSettings();
        console.log('✅ Default settings initialized');
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Basic Route
app.get('/', (req, res) => {
    res.json({
        message: 'Mess Manager API is running',
        version: '2.0.0',
        fingerprint: 'prod-sync-v16.45', // Diagnostic ID
        security: 'enabled'
    });
});

// Import Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authLimiter, authRoutes);

const memberRoutes = require('./routes/members');
app.use('/api/members', memberRoutes);

const expenseRoutes = require('./routes/expenses');
app.use('/api/expenses', expenseRoutes);

const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

const marketRoutes = require('./routes/market');
app.use('/api/market', marketRoutes);

const mealRoutes = require('./routes/meals');
app.use('/api/meals', mealRoutes);

const guestMealRoutes = require('./routes/guestMeals');
app.use('/api/guest-meals', guestMealRoutes);

const settingsRoutes = require('./routes/settings');
app.use('/api/settings', settingsRoutes);

const cookingRoutes = require('./routes/cooking');
app.use('/api/cooking', cookingRoutes);

const managerRoutes = require('./routes/managers');
app.use('/api/managers', managerRoutes);

const reportsRoutes = require('./routes/reports');
app.use('/api/reports', reportsRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const summaryRoutes = require('./routes/summary');
app.use('/api/summary', summaryRoutes);

const dailyRoutes = require('./routes/daily');
app.use('/api/daily', dailyRoutes);


const gitaRoutes = require('./routes/gita');
app.use('/api/gita', gitaRoutes);

const trashRoutes = require('./routes/trash');
app.use('/api/trash', trashRoutes);




// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔒 Security features enabled`);
    console.log(`🌐 CORS origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
