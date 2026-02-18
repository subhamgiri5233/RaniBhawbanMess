const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Settings = require('../models/Settings');
const { auth, requireAdmin } = require('../middleware/auth');

// Get all expenses - Requires authentication
router.get('/', auth, async (req, res) => {
    try {
        const expenses = await Expense.find();
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add Expense - Requires authentication
router.post('/', auth, async (req, res) => {
    const { description, amount, category, paidBy, date, splits, status } = req.body;

    // Security: Members cannot pre-approve their own expenses or set themselves as 'admin'
    let finalStatus = status || 'pending';
    let finalPaidBy = paidBy;

    if (req.user.role === 'member') {
        finalStatus = 'pending';
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

// Approve all pending expenses - Admin only
router.put('/approve-all', auth, requireAdmin, async (req, res) => {
    try {
        // Update all pending expenses to approved
        const result = await Expense.updateMany(
            { status: 'pending' },
            { status: 'approved' }
        );

        res.json({
            message: 'All pending expenses approved successfully',
            modifiedCount: result.modifiedCount
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
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(updatedExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Expense - Admin only
router.delete('/:id', auth, requireAdmin, async (req, res) => {
    try {
        const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
        if (!deletedExpense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json({ message: 'Expense deleted successfully', deletedExpense });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
