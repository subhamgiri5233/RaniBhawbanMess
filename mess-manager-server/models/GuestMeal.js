const mongoose = require('mongoose');

const guestMealSchema = new mongoose.Schema({
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    guestMealType: { type: String, enum: ['fish', 'egg', 'veg', 'meat'], required: true },
    mealTime: { type: String, enum: ['lunch', 'dinner'], required: true },
    createdAt: { type: Date, default: Date.now }
});

// Allow multiple guest meals per member per day
guestMealSchema.index({ date: 1, memberId: 1, guestMealType: 1, mealTime: 1 });

module.exports = mongoose.model('GuestMeal', guestMealSchema);
