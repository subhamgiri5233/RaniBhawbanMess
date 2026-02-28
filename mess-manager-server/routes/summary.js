const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Expense = require('../models/Expense');
const Meal = require('../models/Meal');
const GuestMeal = require('../models/GuestMeal');
const ManagerRecord = require('../models/ManagerRecord');
const MonthlySummary = require('../models/MonthlySummary');
const { auth, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/summary/:month
 * Aggregates all monthly data for all members.
 * month format: YYYY-MM  (e.g. 2025-12)
 * Admin only.
 */
router.get('/:month', auth, requireAdmin, async (req, res) => {
    try {
        const { month } = req.params; // e.g. "2025-12"

        // 1. Get all active members
        const members = await User.find({ role: 'member' }).select('_id userId name deposit');

        // 2. Get all expenses for this month (date starts with YYYY-MM)
        const expenses = await Expense.find({
            date: { $regex: `^${month}` },
            status: { $ne: 'rejected' }
        });

        // 3. Get all regular meals for this month
        const meals = await Meal.find({
            date: { $regex: `^${month}` },
            isGuest: false
        });

        // 4. Get all guest meals for this month (from GuestMeal collection)
        const guestMeals = await GuestMeal.find({
            date: { $regex: `^${month}` }
        });

        // Also check for guest meals stored in Meal collection
        const guestMealsInMealCollection = await Meal.find({
            date: { $regex: `^${month}` },
            isGuest: true
        });

        // 5. Get manager(s) for this month
        const managerRecords = await ManagerRecord.find({
            date: { $regex: `^${month}` }
        }).sort({ date: 1 });

        // Unique managers for the month
        const managersMap = {};
        managerRecords.forEach(r => {
            managersMap[r.memberId] = r.memberName;
        });
        const managers = Object.values(managersMap);

        // 6. Get saved payment statuses for this month. If a member doesn't have one, initialize it with their current deposit.
        let paymentStatuses = await MonthlySummary.find({ month });
        const existingMemberIds = new Set(paymentStatuses.map(ps => ps.memberId.toString()));

        const newSummaries = [];
        members.forEach(member => {
            const memberIdStr = member._id.toString();
            if (!existingMemberIds.has(memberIdStr)) {
                newSummaries.push({
                    month,
                    memberId: memberIdStr,
                    memberName: member.name,
                    paymentStatus: 'pending',
                    amountPaid: 0,
                    submittedAmount: 0,
                    receivedAmount: 0,
                    depositBalance: 0, // Starts fresh each month
                    depositDate: '',
                    note: '',
                });
            }
        });

        if (newSummaries.length > 0) {
            await MonthlySummary.insertMany(newSummaries);
            // Re-fetch to include newly inserted
            paymentStatuses = await MonthlySummary.find({ month });
        }

        const paymentMap = {};
        paymentStatuses.forEach(ps => {
            paymentMap[ps.memberId.toString()] = ps;
        });

        // 7. Build per-member summary
        const EXPENSE_CATEGORIES = ['market', 'wifi', 'electric', 'gas', 'houseRent', 'spices', 'rice', 'others', 'deposit'];

        const memberSummaries = members.map(member => {
            const memberIdStr = member._id.toString();
            const memberName = member.name;

            // Match expenses by paidBy (name or ID)
            const memberExpenses = expenses.filter(e =>
                e.paidBy === memberName ||
                e.paidBy === memberIdStr ||
                e.paidBy === member.userId
            );

            // Build category totals
            const expenseByCategory = {};
            EXPENSE_CATEGORIES.forEach(cat => {
                expenseByCategory[cat] = memberExpenses
                    .filter(e => e.category === cat)
                    .reduce((sum, e) => sum + (e.amount || 0), 0);
            });

            // Regular meal count
            const regularMeals = meals.filter(m =>
                m.memberId === memberIdStr || m.memberId === member.userId
            ).length;

            // Guest meal count (GuestMeal collection)
            const guestMealCount = guestMeals.filter(g =>
                g.memberId === memberIdStr || g.memberId === member.userId
            ).length;

            // Guest meals stored in Meal collection
            const guestMealInMealCount = guestMealsInMealCollection.filter(m =>
                m.memberId === memberIdStr || m.memberId === member.userId
            ).length;

            const totalGuestMeals = guestMealCount + guestMealInMealCount;

            // Payment status
            const payment = paymentMap[memberIdStr] || paymentMap[member.userId];

            return {
                memberId: memberIdStr,
                userId: member.userId,
                memberName,
                expenses: expenseByCategory,
                regularMeals,
                guestMeals: totalGuestMeals,
                paymentStatus: payment ? payment.paymentStatus : 'pending',
                amountPaid: payment ? payment.amountPaid : 0,
                submittedAmount: payment ? (payment.submittedAmount || 0) : 0,
                receivedAmount: payment ? (payment.receivedAmount || 0) : 0,
                // Use saved MonthlySummary depositBalance if available, otherwise 0
                depositBalance: payment ? (payment.depositBalance || 0) : 0,
                depositDate: payment ? (payment.depositDate || '') : '',
                depositBalanceLocked: !!payment,
                note: payment ? payment.note : '',
                deposit: member.deposit // Keep live profile deposit for reference only
            };
        });

        res.json({
            month,
            managers,
            members: memberSummaries
        });
    } catch (err) {
        console.error('Summary route error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/summary/:month/payment
 * Upsert payment status for a specific member for a given month.
 * Admin only.
 * Body: { memberId, memberName, paymentStatus, amountPaid, note }
 */
router.put('/:month/payment', auth, requireAdmin, async (req, res) => {
    try {
        const { month } = req.params;
        const { memberId, memberName, paymentStatus, amountPaid, submittedAmount, receivedAmount, depositBalance, depositDate, note } = req.body;

        if (!memberId || !paymentStatus) {
            return res.status(400).json({ error: 'memberId and paymentStatus are required' });
        }

        const updated = await MonthlySummary.findOneAndUpdate(
            { month, memberId },
            {
                month,
                memberId,
                memberName: memberName || '',
                paymentStatus,
                amountPaid: Number(amountPaid) || 0,
                submittedAmount: Number(submittedAmount) || 0,
                receivedAmount: Number(receivedAmount) || 0,
                depositBalance: Number(depositBalance) || 0,
                depositDate: depositDate || '',
                note: note || '',
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ message: 'Payment status updated', data: updated });
    } catch (err) {
        console.error('Payment update error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/summary/:month/admin-expenses
 * Returns all admin-paid expenses for the month.
 * Admin only.
 */
router.get('/:month/admin-expenses', auth, requireAdmin, async (req, res) => {
    try {
        const { month } = req.params;
        const totalMembers = await require('../models/User').countDocuments({ role: 'member' });
        const adminExpenses = await Expense.find({
            date: { $regex: `^${month}` },
            paidBy: 'admin',
            status: { $ne: 'rejected' }
        }).sort({ date: 1 });

        const managerRecords = await ManagerRecord.find({
            date: { $regex: `^${month}` }
        }).sort({ date: 1 });
        const managersMap = {};
        managerRecords.forEach(r => { managersMap[r.memberId] = r.memberName; });
        const managers = Object.values(managersMap);

        res.json({ month, totalMembers, managers, adminExpenses });
    } catch (err) {
        console.error('Admin expenses route error:', err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /api/summary/:month/invoice/:memberId
 * Returns all data needed to generate an invoice Excel for a specific member.
 * Admin only.
 */
router.get('/:month/invoice/:memberId', auth, requireAdmin, async (req, res) => {
    try {
        const { month, memberId } = req.params;

        // Find the member
        const member = await require('../models/User').findById(memberId).select('_id userId name deposit');
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        const memberName = member.name;
        const memberIdStr = member._id.toString();

        // Count all members (for share calculation)
        const totalMembers = await require('../models/User').countDocuments({ role: 'member' });

        // Member's own expenses for this month
        const memberExpenses = await Expense.find({
            date: { $regex: `^${month}` },
            status: { $ne: 'rejected' },
            $or: [
                { paidBy: memberName },
                { paidBy: memberIdStr },
                { paidBy: member.userId }
            ]
        }).sort({ date: 1 });

        // Admin expenses for this month (shared costs)
        const adminExpenses = await Expense.find({
            date: { $regex: `^${month}` },
            paidBy: 'admin',
            status: { $ne: 'rejected' }
        }).sort({ date: 1 });

        // Regular meals for this member this month
        const regularMeals = await Meal.find({
            date: { $regex: `^${month}` },
            $or: [{ memberId: memberIdStr }, { memberId: member.userId }],
            isGuest: false
        }).sort({ date: 1 });

        // Guest meals (GuestMeal collection)
        const guestMeals = await GuestMeal.find({
            date: { $regex: `^${month}` },
            $or: [{ memberId: memberIdStr }, { memberId: member.userId }]
        }).sort({ date: 1 });

        // Guest meals in Meal collection
        const guestMealsInMeal = await Meal.find({
            date: { $regex: `^${month}` },
            $or: [{ memberId: memberIdStr }, { memberId: member.userId }],
            isGuest: true
        }).sort({ date: 1 });

        // Payment status
        const payment = await MonthlySummary.findOne({
            month,
            $or: [{ memberId: memberIdStr }, { memberId: member.userId }]
        });

        // Manager(s) for this month
        const managerRecords = await ManagerRecord.find({
            date: { $regex: `^${month}` }
        }).sort({ date: 1 });
        const managersMap = {};
        managerRecords.forEach(r => { managersMap[r.memberId] = r.memberName; });
        const managers = Object.values(managersMap);

        res.json({
            month,
            member: { id: memberIdStr, name: memberName, userId: member.userId },
            totalMembers,
            managers,
            memberExpenses,
            regularMeals,
            guestMeals: [...guestMeals, ...guestMealsInMeal],
            payment: payment || null
        });
    } catch (err) {
        console.error('Invoice route error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
