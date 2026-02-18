const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String },
    mobile: { type: String },
    role: { type: String, default: 'member' },
    deposit: { type: Number, default: 0 },
    joinedAt: { type: String },
    dateOfBirth: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
