const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Expense = require('../models/Expense');
const Meal = require('../models/Meal');
const GuestMeal = require('../models/GuestMeal');
const ManagerRecord = require('../models/ManagerRecord');
const MonthlySummary = require('../models/MonthlySummary');
const MonthlySharedExpense = require('../models/MonthlySharedExpense');
const MarketRequest = require('../models/MarketRequest');
const Settings = require('../models/Settings');
const { auth, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/summary/:month
 * Aggregates all monthly data for all members.
 */
router.get('/:month', auth, async (req, res) => {
    try {
        const { month } = req.params;

        // 1. Fetch all data in parallel for efficiency
        // Robust Month Filter: handle standard YYYY-MM, reversed DD-MM-YYYY, and non-padded YYYY-M
        const monthAlt = month.includes('-0') ? month.replace('-0', '-') : month;
        const [year, mnt] = month.split('-');
        const monthRegex = `(${month}|${monthAlt}|-${mnt}-${year})`;

        const [
            members,
            expenses,
            meals,
            guestMeals,
            guestMealsInMealCollection,
            managerRecords,
            sharedExpense,
            initialPaymentStatuses,
            marketRequests,
            settings
        ] = await Promise.all([
            User.find({ role: 'member' }).select('_id userId name deposit').lean(),
            Expense.find({
                date: { $regex: monthRegex },
                status: { $ne: 'rejected' }
            }).lean(),
            Meal.find({
                date: { $regex: monthRegex },
                isGuest: false
            }).lean(),
            GuestMeal.find({
                date: { $regex: monthRegex }
            }).lean(),
            Meal.find({
                date: { $regex: monthRegex },
                isGuest: true
            }).lean(),
            ManagerRecord.find({
                date: { $regex: monthRegex }
            }).sort({ date: 1 }).lean(),
            MonthlySharedExpense.findOne({ month }).lean(),
            MonthlySummary.find({ month }).lean(),
            MarketRequest.find({
                date: { $regex: monthRegex },
                status: 'approved'
            }).lean(),
            Settings.find({}).lean()
        ]);

        // 2. Map settings for easy access
        const settingsMap = {};
        (settings || []).forEach(s => { settingsMap[s.key] = s.value; });
        
        const minMealsLimit = Number(settingsMap['min_meals_month']) || 40;
        const guestPrices = {
            fish: Number(settingsMap['guest_price_fish']) || 0,
            meat: Number(settingsMap['guest_price_meat']) || 0,
            veg: Number(settingsMap['guest_price_veg']) || 0,
            egg: Number(settingsMap['guest_price_egg']) || 0
        };

        // 3. Build market duty map
        const dutyCounts = {};
        marketRequests.forEach(r => {
            const id = r.assignedMemberId;
            dutyCounts[id] = (dutyCounts[id] || 0) + 1;
        });

        // Also build a name-based or userId-based map if needed, but assignedMemberId is usually the primary key.
        // Let's ensure we have a mapping from _id to userId for lookups.
        const userToIdMap = {};
        members.forEach(m => {
            userToIdMap[m.userId] = m._id.toString();
            userToIdMap[m._id.toString()] = m.userId;
        });

        // 5. Build managers map (unique managers for the month)
        const managersMap = {};
        managerRecords.forEach(r => {
            managersMap[r.memberId] = r.memberName;
        });
        const managers = Object.values(managersMap);

        // 7. Get saved payment statuses for this month. If a member doesn't have one, initialize it with their current deposit.
        let paymentStatuses = initialPaymentStatuses || [];
        const existingMemberIds = new Set(
            paymentStatuses
                .filter(ps => ps && ps.memberId)
                .map(ps => ps.memberId.toString())
        );

        const newSummaries = [];
        const addedIds = new Set();
        members.forEach(member => {
            const memberIdStr = member._id.toString();
            if (!existingMemberIds.has(memberIdStr) && !addedIds.has(memberIdStr)) {
                newSummaries.push({
                    month,
                    memberId: memberIdStr,
                    memberName: member.name,
                    paymentStatus: 'pending',
                    amountPaid: 0,
                    submittedAmount: 0,
                    receivedAmount: 0,
                    depositBalance: member.deposit || 0, // Carry over current deposit as initial balance
                    depositDate: '',
                    marketDays: dutyCounts[memberIdStr] || dutyCounts[member.userId] || (userToIdMap[memberIdStr] ? dutyCounts[userToIdMap[memberIdStr]] : 0) || (userToIdMap[member.userId] ? dutyCounts[userToIdMap[member.userId]] : 4), 
                    note: '',
                });
                addedIds.add(memberIdStr);
            }
        });

        if (newSummaries.length > 0) {
            try {
                // Use ordered: false so valid inserts continue if some fail with duplicate keys
                await MonthlySummary.insertMany(newSummaries, { ordered: false });
            } catch (err) {
                // Ignore duplicate key errors (code 11000) which happen during concurrent initialization
                if (err.code !== 11000 && !err.writeErrors?.every(e => e.code === 11000)) {
                    console.error('Non-duplicate error during summary initialization:', err);
                }
            }
            // Re-fetch to include newly inserted (or existing if they were just inserted by another request)
            paymentStatuses = await MonthlySummary.find({ month }).lean();
        }

        const paymentMap = {};
        paymentStatuses.forEach(ps => {
            if (ps && ps.memberId) {
                paymentMap[ps.memberId.toString()] = ps;
            }
        });

        // --- NITRO PRE-GROUPING (O(N) Complexity) ---
        // Instead of filtering inside the member loop, we group once.
        const mealsByMember = {};
        (meals || []).forEach(m => {
            if (!m.memberId) return;
            const mid = m.memberId.toString();
            if (!mealsByMember[mid]) mealsByMember[mid] = [];
            mealsByMember[mid].push(m);
        });

        const guestMealsByMember = {};
        (guestMeals || []).forEach(g => {
            if (!g.memberId) return;
            const mid = g.memberId.toString();
            if (!guestMealsByMember[mid]) guestMealsByMember[mid] = [];
            guestMealsByMember[mid].push(g);
        });

        const guestInMealsByMember = {};
        (guestMealsInMealCollection || []).forEach(m => {
            if (!m.memberId) return;
            const mid = m.memberId.toString();
            if (!guestInMealsByMember[mid]) guestInMealsByMember[mid] = [];
            guestInMealsByMember[mid].push(m);
        });

        const expensesByMember = {};
        (expenses || []).forEach(e => {
            if (!e.paidBy) return;
            const pid = e.paidBy.toString();
            if (!expensesByMember[pid]) expensesByMember[pid] = [];
            expensesByMember[pid].push(e);
        });

        const marketByMember = {};
        (marketRequests || []).forEach(r => {
            if (!r.assignedMemberId) return;
            const mid = r.assignedMemberId.toString();
            if (!marketByMember[mid]) marketByMember[mid] = [];
            marketByMember[mid].push(r);
        });

        // 7. Build per-member summary with safe property access (Nuclear Hardening)
        const EXPENSE_CATEGORIES = ['market', 'wifi', 'electric', 'gas', 'houseRent', 'spices', 'rice', 'others', 'deposit'];

        const memberSummaries = members.map(member => {
            try {
                const memberIdStr = member._id?.toString();
                const memberName = member.name || 'Unknown Member';
                const memberUserId = member.userId;
                if (!memberIdStr) return null;

                // Match expenses by paidBy (name or ID) - O(1) Lookups
                const memberExpenses = [
                    ...(expensesByMember[memberName] || []),
                    ...(expensesByMember[memberIdStr] || []),
                    ...(memberUserId ? (expensesByMember[memberUserId] || []) : [])
                ];

                // Build category totals
                const expenseByCategory = {};
                EXPENSE_CATEGORIES.forEach(cat => {
                    expenseByCategory[cat] = memberExpenses
                        .filter(e => e.category === cat)
                        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                });

                // Regular meal count (Actual vs Charged) - O(1) Lookups
                const myRegMeals = [
                    ...(mealsByMember[memberIdStr] || []),
                    ...(memberUserId ? (mealsByMember[memberUserId] || []) : [])
                ];
                const actualRegularMeals = myRegMeals.length;
                const chargedRegularMeals = Math.max(minMealsLimit, actualRegularMeals);

                // Guest meal count - O(1) Lookups
                const myGstMeals = [
                    ...(guestMealsByMember[memberIdStr] || []),
                    ...(memberUserId ? (guestMealsByMember[memberUserId] || []) : [])
                ];
                const guestMealCount = myGstMeals.length;

                const myGstInMeals = [
                    ...(guestInMealsByMember[memberIdStr] || []),
                    ...(memberUserId ? (guestInMealsByMember[memberUserId] || []) : [])
                ];
                const guestMealInMealCount = myGstInMeals.length;

                const totalGuestMeals = guestMealCount + guestMealInMealCount;

                // Payment status
                const payment = paymentMap[memberIdStr] || (memberUserId ? paymentMap[memberUserId] : null);

                return {
                    memberId: memberIdStr,
                    userId: memberUserId || null,
                    memberName,
                    expenses: expenseByCategory,
                    regularMeals: actualRegularMeals,
                    chargedMeals: chargedRegularMeals,
                    guestMeals: totalGuestMeals,
                    paymentStatus: payment ? (payment.paymentStatus || 'pending') : 'pending',
                    amountPaid: payment ? (Number(payment.amountPaid) || 0) : 0,
                    submittedAmount: payment ? (Number(payment.submittedAmount) || 0) : 0,
                    receivedAmount: payment ? (Number(payment.receivedAmount) || 0) : 0,
                    depositBalance: payment ? (Number(payment.depositBalance) || 0) : 0,
                    depositDate: payment ? (payment.depositDate || '') : '',
                    depositBalanceLocked: !!payment,
                    marketDays: dutyCounts[memberIdStr] || dutyCounts[memberUserId] || 0,
                    marketDates: [
                        ...(marketByMember[memberIdStr] || []),
                        ...(memberUserId ? (marketByMember[memberUserId] || []) : [])
                    ].map(r => r.date),
                    note: payment ? (payment.note || '') : '',
                    deposit: member.deposit || 0
                };
            } catch (err) {
                console.error(`Error mapping summary for member ${member?.name}:`, err);
                return null;
            }
        }).filter(Boolean);

        // --- NITRO GUEST ARCHIVE RESTORATION ---
        const userMap = {};
        members.forEach(m => {
            const mid = m._id.toString();
            userMap[mid] = m.name;
            if (m.userId) userMap[m.userId] = m.name;
        });

        const guestRecords = [
            ...(guestMeals || []).map(g => {
                const type = (g.guestMealType || 'veg').toLowerCase();
                return {
                    _id: g._id,
                    date: g.date,
                    memberId: g.memberId,
                    memberName: g.memberName || userMap[g.memberId] || 'Unknown',
                    guestMealType: type,
                    mealTime: g.mealTime || 'lunch',
                    amount: g.amount || guestPrices[type] || 0,
                    source: 'guest_meal'
                };
            }),
            ...(guestMealsInMealCollection || []).map(m => {
                const type = (m.guestMealType || 'veg').toLowerCase();
                return {
                    _id: m._id,
                    date: m.date,
                    memberId: m.memberId,
                    memberName: userMap[m.memberId] || 'Unknown',
                    guestMealType: type,
                    mealTime: m.type || 'lunch',
                    amount: m.amount || 0,
                    source: 'meal_collection'
                };
            })
        ].sort((a, b) => b.date.localeCompare(a.date));

        // 9. Calculate live shared totals (Universal Sweep)
        const liveBills = {};
        const allCategories = ['gas', 'wifi', 'electric', 'paper', 'didi', 'houseRent', 'spices', 'rice', 'others', 'market', 'deposit'];
        
        allCategories.forEach(cat => {
            liveBills[cat] = (expensesByMember[cat] || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 
                             (expenses || []).filter(e => e.category === cat).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        });

        const responseData = {
            month,
            managers,
            liveBills,
            totalMembersCount: members.length,
            minMealsLimit, // Send the limit to the frontend
            guestRecords, // New full history log
            sharedExpense: sharedExpense || null,
            members: req.user.role === 'admin'
                ? memberSummaries
                : memberSummaries.filter(m => m.memberId === req.user.id || m.userId === req.user.userId || m.userId === req.user.id)
        };

        res.json(responseData);
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
        const totalMembers = await User.countDocuments({ role: 'member' });
        const adminExpenses = await Expense.find({
            date: { $regex: `(${month}|-${month.split('-')[1]}-${month.split('-')[0]})` },
            $or: [
                { paidBy: 'admin' },
                { category: { $in: ['gas', 'wifi', 'electric', 'paper', 'didi', 'houseRent', 'spices', 'others'] } }
            ],
            status: { $ne: 'rejected' }
        }).sort({ date: 1 });

        // Manager(s) for this month
        const managerRecords = await ManagerRecord.find({
            date: { $regex: `(${month}|-${month.split('-')[1]}-${month.split('-')[0]})` }
        }).sort({ date: 1 });
        
        const managersMap = {};
        managerRecords.forEach(r => { 
            if (r.memberId) managersMap[r.memberId] = r.memberName; 
        });
        const managers = Object.values(managersMap);

        res.json({ 
            month, 
            totalMembers: totalMembers || 0, 
            managers: managers || [], 
            adminExpenses: adminExpenses || [] 
        });
    } catch (err) {
        console.error('Admin expenses route error:', err);
        res.status(500).json({ error: 'Failed to load admin expenses: ' + err.message });
    }
});
/**
 * GET /api/summary/:month/invoice/:memberId
 * Returns all data needed to generate an invoice Excel for a specific member.
 * Admin only.
 */
router.get('/:month/invoice/:memberId', auth, async (req, res) => {
    try {
        const { month, memberId } = req.params;

        // Security check: members can only fetch their own invoice
        if (req.user.role !== 'admin' && req.user.id !== memberId && req.user.userId !== memberId) {
            return res.status(403).json({ error: 'Access denied: You can only view your own invoice.' });
        }

        // Find the member
        const member = await User.findById(memberId).select('_id userId name deposit');
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        const memberName = member.name;
        const memberIdStr = member._id.toString();

        // Count all members (for share calculation)
        const totalMembers = await User.countDocuments({ role: 'member' });

        // Member's own expenses for this month
        const memberExpenses = await Expense.find({
            date: { $regex: `(${month}|-${month.split('-')[1]}-${month.split('-')[0]})` },
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
            $or: [
                { paidBy: 'admin' },
                { category: { $in: ['gas', 'wifi', 'electric', 'paper', 'didi', 'houseRent'] } }
            ],
            status: { $ne: 'rejected' }
        }).sort({ date: 1 });

        // Regular meals for this member this month
        const regularMeals = await Meal.find({
            date: { $regex: `(${month}|-${month.split('-')[1]}-${month.split('-')[0]})` },
            $or: [{ memberId: memberIdStr }, { memberId: member.userId }],
            isGuest: false
        }).sort({ date: 1 });

        // Guest meals (GuestMeal collection)
        const guestMeals = await GuestMeal.find({
            date: { $regex: `(${month}|-${month.split('-')[1]}-${month.split('-')[0]})` },
            $or: [{ memberId: memberIdStr }, { memberId: member.userId }]
        }).sort({ date: 1 });

        // Guest meals in Meal collection
        const guestMealsInMeal = await Meal.find({
            date: { $regex: `(${month}|-${month.split('-')[1]}-${month.split('-')[0]})` },
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
            date: { $regex: `(${month}|-${month.split('-')[1]}-${month.split('-')[0]})` }
        }).sort({ date: 1 });
        const managersMap = {};
        managerRecords.forEach(r => { managersMap[r.memberId] = r.memberName; });
        const managers = Object.values(managersMap);

        // 7. Get finalized shared expense record for the month
        const sharedExpense = await MonthlySharedExpense.findOne({ month }).lean();
        const offR = sharedExpense?.results || {};
        const offI = sharedExpense?.mealInputs || {};
        const offM = (sharedExpense?.members || []).find(m => String(m.memberId) === memberIdStr) || {};

        // RESTRICTED MODE: Only use finalized data for invoice costs
        const finalizedRate = offR.mealCharge || 0;
        const finalizedHead = offR.perHeadAmount || 0;

        res.json({
            month,
            member: { id: memberIdStr, name: memberName, userId: member.userId },
            totalMembers,
            managers,
            memberExpenses, // Keep live expenses for receipt breakdown
            regularMeals,
            guestMeals: [...guestMeals, ...guestMealsInMeal],
            payment: payment || null,
            sharedExpense: sharedExpense || null,
            finalizedRate,
            finalizedHead,
            offM
        });
    } catch (err) {
        console.error('Invoice route error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
