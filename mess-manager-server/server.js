// Server last updated: 2026-03-07T22:48
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();
app.use(compression()); // Compress all responses
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mess-manager';

// Security Middleware
app.use(helmet()); // Security headers

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://rani-bhawban-mess.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const remainingMs = req.rateLimit.resetTime - new Date();
        const remainingMins = Math.ceil(remainingMs / (60 * 1000));
        res.status(options.statusCode).json({
            success: false,
            message: `Too many requests from this IP, please try again after ${remainingMins} minute${remainingMins > 1 ? 's' : ''}.`
        });
    }
});
app.use('/api/', limiter);

// Special rate limit for auth routes (stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 login attempts per 15 min
    handler: (req, res, next, options) => {
        const remainingMs = req.rateLimit.resetTime - new Date();
        const remainingMins = Math.ceil(remainingMs / (60 * 1000));
        res.status(options.statusCode).json({
            success: false,
            message: `Too many login attempts, please try again after ${remainingMins} minute${remainingMins > 1 ? 's' : ''}.`
        });
    }
});

// Body parsers (reduced limits for security)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// NoSQL Injection Protection (custom, compatible with Express 5)
// express-mongo-sanitize is not compatible with Express 5's read-only req.query
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

// Database Connection
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected');
        // Initialize default settings after DB is connected
        const { initializeDefaultSettings } = require('./routes/settings');
        await initializeDefaultSettings();
        console.log('✅ Default settings initialized');

        // Pre-warm Gemini AI cache in background (don't block server startup)
        const { warmUpAICache } = require('./utils/aiUtils');
        warmUpAICache().catch(err => console.error('[AI] Warm-up failed:', err.message));
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Basic Route
app.get('/', (req, res) => {
    res.json({
        message: 'Mess Manager API is running',
        version: '2.0.0',
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

const jarvisRoutes = require('./routes/jarvis');
app.use('/api/jarvis', jarvisRoutes);


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
