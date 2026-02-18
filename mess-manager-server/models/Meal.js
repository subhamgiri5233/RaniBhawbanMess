const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    memberId: { type: String, required: true }, // Ideally ObjectId ref 'User', but strict string ID for now
    memberName: { type: String, required: true }, // Member's name for easy display
    type: { type: String, enum: ['lunch', 'dinner', 'guest'], required: true },
    isGuest: { type: Boolean, default: false },
    guestMealType: { type: String, enum: ['fish', 'egg', 'veg', 'meat'], required: false }, // Only for guest meals
    mealTime: { type: String, enum: ['lunch', 'dinner'], required: false }, // For guest meals: lunch or dinner
    createdAt: { type: Date, default: Date.now }
});

// For regular meals: unique per member per type (lunch/dinner) per day
// For guest meals: allow multiple guests per member per day
mealSchema.index({ date: 1, memberId: 1, type: 1, isGuest: 1 });

module.exports = mongoose.model('Meal', mealSchema);
