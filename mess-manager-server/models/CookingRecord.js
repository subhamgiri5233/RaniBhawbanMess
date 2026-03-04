const mongoose = require('mongoose');

const cookingRecordSchema = new mongoose.Schema({
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    mealType: { type: String, enum: ['lunch', 'dinner'], default: 'lunch' },
    cooked: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CookingRecord', cookingRecordSchema);
