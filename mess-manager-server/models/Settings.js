const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['security', 'feature', 'system'],
        default: 'feature'
    },
    description: {
        type: String
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
settingsSchema.pre('save', function () {
    this.updatedAt = new Date();
});

module.exports = mongoose.model('Settings', settingsSchema);
