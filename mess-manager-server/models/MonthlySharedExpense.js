const mongoose = require('mongoose');

const monthlySharedExpenseSchema = new mongoose.Schema({
    month: { type: String, required: true, unique: true }, // Format: YYYY-MM
    bills: {
        gas: { type: Number, default: 0 },
        paper: { type: Number, default: 0 },
        wifi: { type: Number, default: 0 },
        didi: { type: Number, default: 0 },
        spices: { type: Number, default: 0 },
        houseRent: { type: Number, default: 0 },
        electric: { type: Number, default: 0 },
        others: { type: Number, default: 0 }
    },
    mealInputs: {
        totalMarket: { type: Number, default: 0 },
        rice: { type: Number, default: 0 },
        guest: { type: Number, default: 0 },
        totalMeal: { type: Number, default: 1 }
    },
    results: {
        perHeadAmount: { type: Number, default: 0 },
        totalSharedAmount: { type: Number, default: 0 },
        mealCharge: { type: Number, default: 0 }
    },
    memberBalances: [{
        memberId: { type: String, required: true },
        memberName: { type: String },
        meals: { type: Number, default: 0 },
        isBelowMinimum: { type: Boolean, default: false },
        mealCost: { type: Number, default: 0 },
        sharedCost: { type: Number, default: 0 },
        marketCost: { type: Number, default: 0 },
        guestCost: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },
        type: { type: String, enum: ['Pay', 'Get'] }
    }],
    submittedBy: { type: String, required: true }, // admin userId
    submittedByName: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MonthlySharedExpense', monthlySharedExpenseSchema);
