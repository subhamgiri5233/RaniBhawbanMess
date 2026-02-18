const mongoose = require('mongoose');

const marketRequestSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // One request per date usually
    assignedMemberId: { type: String },
    status: { type: String, default: 'pending' }, // 'pending', 'approved'
    requestType: { type: String } // 'manual_assign', 'request'
});

module.exports = mongoose.model('MarketRequest', marketRequestSchema);
