const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Meal = require('../models/Meal');
const GuestMeal = require('../models/GuestMeal');
const Expense = require('../models/Expense');
const MarketRequest = require('../models/MarketRequest');
const CookingRecord = require('../models/CookingRecord');
const ManagerRecord = require('../models/ManagerRecord');
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

// GET /api/admin/clear-month/preview - Preview items to be deleted and memory usage
router.get('/clear-month/preview', auth, requireAdmin, async (req, res) => {
    try {
        const { month } = req.query;

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ message: 'Valid month (YYYY-MM) is required' });
        }

        const dateRegex = new RegExp(`^${month}`);
        const models = [
            { name: 'meals', model: Meal },
            { name: 'guestMeals', model: GuestMeal },
            { name: 'expenses', model: Expense },
            { name: 'marketRequests', model: MarketRequest },
            { name: 'cookingRecords', model: CookingRecord },
            { name: 'managerRecords', model: ManagerRecord }
        ];

        const stats = await Promise.all(models.map(async ({ name, model }) => {
            const count = await model.countDocuments({ date: { $regex: dateRegex } });

            // Accurate BSON size estimate using aggregation
            const sizeResult = await model.aggregate([
                { $match: { date: { $regex: dateRegex } } },
                { $project: { size: { $bsonSize: "$$ROOT" } } },
                { $group: { _id: null, totalSize: { $sum: "$size" } } }
            ]);

            return {
                name,
                count,
                size: sizeResult.length > 0 ? sizeResult[0].totalSize : 0
            };
        }));

        const totalItems = stats.reduce((acc, curr) => acc + curr.count, 0);
        const totalSize = stats.reduce((acc, curr) => acc + curr.size, 0);

        res.json({
            month,
            stats,
            totalItems,
            totalSizeInBytes: totalSize,
            totalSizeFormatted: totalSize > 1048576
                ? `${(totalSize / 1048576).toFixed(2)} MB`
                : `${(totalSize / 1024).toFixed(2)} KB`
        });

    } catch (error) {
        console.error('Preview failed:', error);
        res.status(500).json({ message: 'Failed to generate preview', error: error.message });
    }
});

// DELETE /api/admin/clear-month - Clear all transaction data for a particular month
router.delete('/clear-month', auth, requireAdmin, async (req, res) => {
    try {
        const { month, password } = req.body;

        if (!month || !password) {
            return res.status(400).json({ message: 'Month and password are required' });
        }

        // Validate month format (YYYY-MM)
        if (!/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ message: 'Invalid month format. Use YYYY-MM' });
        }

        // Get admin from DB to verify password
        const admin = await Admin.findOne();
        if (!admin || admin.password !== password) {
            return res.status(401).json({ message: 'Invalid admin password' });
        }

        const dateRegex = new RegExp(`^${month}`);

        // Perform deletions across all transaction models
        const results = await Promise.all([
            Meal.deleteMany({ date: { $regex: dateRegex } }),
            GuestMeal.deleteMany({ date: { $regex: dateRegex } }),
            Expense.deleteMany({ date: { $regex: dateRegex } }),
            MarketRequest.deleteMany({ date: { $regex: dateRegex } }),
            CookingRecord.deleteMany({ date: { $regex: dateRegex } }),
            ManagerRecord.deleteMany({ date: { $regex: dateRegex } })
        ]);

        const deletedCounts = {
            meals: results[0].deletedCount,
            guestMeals: results[1].deletedCount,
            expenses: results[2].deletedCount,
            marketRequests: results[3].deletedCount,
            cookingRecords: results[4].deletedCount,
            managerRecords: results[5].deletedCount
        };

        const totalDeleted = Object.values(deletedCounts).reduce((a, b) => a + b, 0);

        res.json({
            success: true,
            message: `Successfully cleared all data for ${month}`,
            deletedCounts,
            totalDeleted
        });

    } catch (error) {
        console.error('Clear month failed:', error);
        res.status(500).json({ message: 'Failed to clear month data', error: error.message });
    }
});

module.exports = router;
