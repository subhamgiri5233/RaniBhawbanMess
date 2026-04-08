const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Settings = require('../models/Settings');
const MonthlySharedExpense = require('../models/MonthlySharedExpense');
const MonthlySummary = require('../models/MonthlySummary');
const { auth, requireAdmin } = require('../middleware/auth');



// Get all expenses - Requires authentication (optional: filter by month)
router.get('/', auth, async (req, res) => {
    try {
        const { month } = req.query;
        let query = {};
        if (month) {
            // Escape special regex characters
            const escapedMonth = month.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Support both YYYY-MM and DD-MM-YYYY formats by matching the month string anywhere
            // or specifically handling the reverse case.
            if (escapedMonth.includes('-')) {
                const parts = escapedMonth.split('-');
                if (parts.length === 2) {
                    const [year, mnt] = parts;
                    // Match either "2026-03" or "-03-2026"
                    query.date = { $regex: `(${year}-${mnt}|-${mnt}-${year})` };
                } else {
                    query.date = { $regex: escapedMonth };
                }
            } else {
                query.date = { $regex: escapedMonth };
            }
        }
        const expenses = await Expense.find(query).lean().sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add Expense - Requires authentication
router.post('/', auth, async (req, res) => {
    const { description, amount, category, paidBy, date, splits, status } = req.body;

    // Security: Admin fund expenses must be labeled as 'admin'
    let finalStatus = status || 'approved'; // Default to approved
    let finalPaidBy = paidBy;

    if (req.user.role === 'member') {
        // Members can now have their expenses auto-approved
        if (paidBy === 'admin') finalPaidBy = req.user.name;
    }

    try {
        const newExpense = new Expense({
            description,
            amount: Number(amount),
            category: category || 'others',
            paidBy: finalPaidBy,
            date,
            splits,
            status: finalStatus
        });
        const savedExpense = await newExpense.save();
        res.status(201).json(savedExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// IMPORTANT: Specific routes MUST come BEFORE parameterized routes like /:id


// Delete all admin expenses - Admin only (requires password verification)
router.delete('/admin/clear-all', auth, requireAdmin, async (req, res) => {
    try {
        const { password } = req.body;

        // Verify password against Settings DB
        const setting = await Settings.findOne({ key: 'clear_expenses_password' });
        if (!setting || setting.value !== password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Delete all expenses where paidBy is 'admin'
        const result = await Expense.deleteMany({ paidBy: 'admin' });

        res.json({
            message: 'All admin expenses deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




// Clear all expense history - Admin only
router.delete('/clear-all-history', auth, requireAdmin, async (req, res) => {
    try {
        // Delete all expenses
        const result = await Expense.deleteMany({});

        res.json({
            message: 'All expense history cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Expense - Admin only
router.put('/:id', auth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    // Guard: ensure this is a valid ObjectId (not a named route segment like 'approve-all')
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ message: 'Invalid expense ID' });
    }
    const { status, description, amount, category, date, paidBy } = req.body;

    // Construct update object with only provided fields
    const updateData = {};
    if (status) updateData.status = status;
    if (description) updateData.description = description;
    if (amount) updateData.amount = Number(amount);
    if (category) updateData.category = category;
    if (date) updateData.date = date;
    if (paidBy) updateData.paidBy = paidBy;

    try {
        const updatedExpense = await Expense.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
        res.json(updatedExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Expense - Admin or the member who paid
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    // Guard: ensure this is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ message: 'Invalid expense ID' });
    }
    try {
        const expense = await Expense.findById(id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Permission check: Admin can delete anything, members can only delete their own
        // paidBy may be stored as member _id OR auth user id — check all possible fields
        const possibleUserIds = [
            req.user.id,
            req.user.userId,
            req.user._id,
            req.user.memberId,
            req.user.name
        ].filter(Boolean).map(String);
        const paidBy = String(expense.paidBy || '');
        const isOwner = possibleUserIds.some(uid => uid === paidBy);
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ message: 'Only admin can delete this expense' });
        }

        const deletedExpense = await Expense.findByIdAndDelete(id);
        res.json({ message: 'Expense deleted successfully', deletedExpense });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Bulk update or create shared expenses for a month (dedicated collection)
router.post('/bulk-shared', auth, requireAdmin, async (req, res) => {
    try {
        const { month, bills, mealInputs, perHeadResult, mealChargeResult, memberBalances } = req.body;
        if (!month || !bills) {
            return res.status(400).json({ message: 'Month and bills are required' });
        }

        // Upsert into MonthlySharedExpense collection
        const updatedShared = await MonthlySharedExpense.findOneAndUpdate(
            { month },
            {
                month,
                bills,
                mealInputs,
                results: {
                    perHeadAmount: perHeadResult?.perHeadAmount || 0,
                    totalSharedAmount: perHeadResult?.totalAmount || 0,
                    mealCharge: mealChargeResult?.mealCharge || 0
                },
                memberBalances: memberBalances || [],
                submittedBy: req.user.id || req.user.userId,
                submittedByName: req.user.name,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        // Sync marketDays to MonthlySummary for each member included in the snapshot
        if (memberBalances && memberBalances.length > 0) {
            for (const mb of memberBalances) {
                await MonthlySummary.findOneAndUpdate(
                    { month, memberId: mb.memberId },
                    { $set: { marketDays: mb.marketDays || 4 } },
                    { upsert: true }
                );
            }
        }

        res.json({ message: 'Monthly shared expenses saved successfully', data: updatedShared });
    } catch (err) {
        console.error('Bulk shared expenses error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
