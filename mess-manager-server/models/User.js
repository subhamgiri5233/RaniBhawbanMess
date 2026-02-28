const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String },
    mobile: { type: String },
    role: { type: String, default: 'member' },
    joinedAt: { type: String },
    dateOfBirth: { type: String },
    sessionToken: { type: String, default: null }, // For single-device login
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
