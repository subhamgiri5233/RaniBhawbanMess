const mongoose = require('mongoose');

const managerRecordSchema = new mongoose.Schema({
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    isManager: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ManagerRecord', managerRecordSchema);
