const mongoose = require('mongoose');

const monthlySummarySchema = new mongoose.Schema({
    month: { type: String, required: true }, // Format: YYYY-MM
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    paymentStatus: {
        type: String,
        enum: ['clear', 'pending', 'partial'],
        default: 'pending'
    },
    amountPaid: { type: Number, default: 0 },
    submittedAmount: { type: Number, default: 0 }, // Amount submitted/paid by member
    receivedAmount: { type: Number, default: 0 },  // Amount actually received by admin
    depositBalance: { type: Number, default: 0 }, // Snapshot of User.deposit for this month
    depositDate: { type: String, default: '' }, // Date when deposit was paid (YYYY-MM-DD)
    note: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
});

// Compound unique index: one record per member per month
monthlySummarySchema.index({ month: 1, memberId: 1 }, { unique: true });

module.exports = mongoose.model('MonthlySummary', monthlySummarySchema);
