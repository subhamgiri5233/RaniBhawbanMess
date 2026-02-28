const mongoose = require('mongoose');

const marketRequestSchema = new mongoose.Schema({
    date: { type: String, required: true },
    assignedMemberId: { type: String, required: true },
    status: { type: String, default: 'pending' }, // 'pending', 'approved', 'rejected'
    requestType: { type: String } // 'manual_assign', 'request'
});

// Ensure a member can't request the same date twice, but different members can request same date
marketRequestSchema.index({ date: 1, assignedMemberId: 1 }, { unique: true });

module.exports = mongoose.model('MarketRequest', marketRequestSchema);
