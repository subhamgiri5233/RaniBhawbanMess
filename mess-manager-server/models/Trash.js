const mongoose = require('mongoose');

const trashSchema = new mongoose.Schema({
    originalId: { type: String, required: true },
    type: { type: String, required: true }, // 'Expense', 'Meal', 'Member', etc.
    data: { type: Object, required: true },
    deletedBy: { type: String, required: true },
    deletedByName: { type: String },
    deletedAt: { type: Date, default: Date.now }
});

// Index for performance
trashSchema.index({ type: 1 });
trashSchema.index({ deletedAt: -1 });

module.exports = mongoose.model('Trash', trashSchema);
