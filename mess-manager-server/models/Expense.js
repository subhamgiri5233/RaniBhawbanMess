const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ['market', 'spices', 'rice', 'others', 'gas', 'paper', 'wifi', 'electric', 'didi', 'houseRent', 'deposit'], required: true, default: 'others' }, // Expense category
    paidBy: { type: String, required: true }, // userId or name? Better userId for reference, but simple string supported for now.
    date: { type: String, required: true },
    status: { type: String, default: 'pending' }, // 'pending', 'approved', 'rejected'
    splits: [String] // Array of userIds/names
});

// Speed up date-based filtering (by month) and status queries
expenseSchema.index({ date: 1 });
expenseSchema.index({ date: 1, status: 1 });
expenseSchema.index({ paidBy: 1, date: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
