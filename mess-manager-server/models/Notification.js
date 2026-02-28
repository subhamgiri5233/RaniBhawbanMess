const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // 'all', 'admin-1', or specific userId
    message: { type: String, required: true },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    isRead: { type: Boolean, default: false },
    type: { type: String }, // 'market_request', 'payment', etc.
    metadata: { type: Object }, // Store requestDate, requesterId, paymentAmount etc.
    status: { type: String }, // 'approved', 'rejected'
    // Payment-specific fields
    paymentAmount: { type: Number }, // Amount member needs to pay
    isPaid: { type: Boolean, default: false } // Whether payment is marked as complete
});

// Speed up per-user notification lookups and unread counts
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
