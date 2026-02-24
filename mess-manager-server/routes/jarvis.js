const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Meal = require('../models/Meal');
const Expense = require('../models/Expense');
const GuestMeal = require('../models/GuestMeal');
const CookingRecord = require('../models/CookingRecord');
const MarketRequest = require('../models/MarketRequest');
const { getDailyGitaVerse } = require('../utils/gitaUtils');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;


// Build mess context from live database data
const buildMessContext = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const [members, expenses, meals, guestMeals, cookingRecords, marketRequests] = await Promise.all([
        User.find({ $or: [{ role: 'member' }, { role: { $exists: false } }, { role: null }] })
            .select('name deposit joinedAt dateOfBirth mobile').lean(),
        Expense.find({ status: 'approved' }).lean(),
        Meal.find().lean(),
        GuestMeal.find().sort({ date: -1 }).limit(50).lean(),
        CookingRecord.find().sort({ date: -1 }).limit(30).lean(),
        MarketRequest.find().sort({ date: -1 }).limit(20).lean(),
    ]);

    // Member summaries with meal counts and birthdays
    const memberSummaries = await Promise.all(members.map(async (m) => {
        const mealCount = await Meal.countDocuments({ memberId: m._id.toString() });
        let daysToBirthday = 'Unknown';
        let isBirthdayToday = false;

        if (m.dateOfBirth) {
            const dob = new Date(m.dateOfBirth);
            if (!isNaN(dob.getTime())) {
                const currentYear = today.getFullYear();
                let nextBirthday = new Date(currentYear, dob.getMonth(), dob.getDate());
                if (nextBirthday < today) nextBirthday.setFullYear(currentYear + 1);
                const diffDays = Math.ceil(Math.abs(nextBirthday - today) / (1000 * 60 * 60 * 24));
                daysToBirthday = diffDays;
                if (diffDays === 0 || diffDays === 365 || diffDays === 366) {
                    isBirthdayToday = true;
                    daysToBirthday = 0;
                }
            }
        }

        return {
            name: m.name,
            deposit: m.deposit || 0,
            meals: mealCount,
            dob: m.dateOfBirth || 'Not provided',
            daysToBirthday,
            isBirthdayToday
        };
    }));

    // Expense breakdown
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
        acc[e.category || 'others'] = (acc[e.category || 'others'] || 0) + e.amount;
        return acc;
    }, {});

    // Recent itemized expenses (last 20)
    const recentExpenseItems = expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20)
        .map(e => ({ description: e.description, amount: e.amount, category: e.category, date: e.date, paidBy: e.paidBy }));

    const totalMeals = meals.length;
    const mealRate = totalMeals > 0 && totalExpenses > 0
        ? (totalExpenses / totalMeals).toFixed(2)
        : 'N/A';

    // Guest meal summary
    const guestMealSummary = guestMeals.reduce((acc, g) => {
        const key = g.guestMealType;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const todayGuestMeals = guestMeals.filter(g => g.date === todayStr);

    // Cooking record (who cooked recently)
    const recentCooks = cookingRecords.map(c => ({ name: c.memberName, date: c.date }));

    // Market schedule (recent)
    const marketSchedule = marketRequests.map(r => ({
        date: r.date,
        status: r.status,
        assignedTo: r.assignedMemberId || 'Unassigned',
        type: r.requestType || 'N/A'
    }));

    return {
        memberSummaries, totalExpenses, byCategory, recentExpenseItems,
        totalMeals, mealRate, guestMealSummary, todayGuestMeals,
        recentCooks, marketSchedule
    };
};

// POST /api/jarvis
router.post('/', auth, async (req, res) => {
    const { question } = req.body;

    if (!question?.trim()) {
        return res.status(400).json({ error: 'Question is required' });
    }

    if (!GEMINI_API_KEY) {
        return res.status(503).json({ error: 'JARVIS is not configured. Add GEMINI_API_KEY to server .env' });
    }

    try {
        const ctx = await buildMessContext();
        const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const gitaVerse = getDailyGitaVerse();

        const systemPrompt = `You are JARVIS — the intelligent AI assistant embedded inside Rani Bhawban Mess, a student mess management system. You are modeled after JARVIS from Iron Man: calm, confident, precisely analytical, and occasionally witty. You address the user respectfully, using their name where natural.

## YOUR CORE RULES
- Be concise: 2–4 sentences for simple queries; use bullet lists for data-heavy answers.
- Never fabricate numbers, names, or facts not present in the data below.
- If data is unavailable or unclear, say so honestly — do not guess.
- When answering about finances, always clearly state amounts with the ₹ symbol.
- If the question is unrelated to mess operations, answer helpfully but briefly, staying in character.
- Never break character. You are JARVIS. Always.

## CURRENT SESSION
- Date & Time (IST): ${now}
- User: ${req.user.name} | Role: ${req.user.role}

## DAILY WISDOM — Bhagavad Gita
> Chapter ${gitaVerse.chapter}, Verse ${gitaVerse.verse}
> "${gitaVerse.sanskrit}"
> Translation: ${gitaVerse.translation}
> Meaning: ${gitaVerse.meaning}
(Share this verse if the user asks for inspiration, motivation, or today's message. Keep it reverent.)

## LIVE MESS DATA (pulled from database right now)

### Members Overview
${ctx.memberSummaries.map(m =>
            `• ${m.name} — Deposit: ₹${m.deposit} | Meals recorded: ${m.meals} | DOB: ${m.dob} | Birthday: ${m.daysToBirthday === 0 ? '🎂 TODAY!' : m.daysToBirthday !== 'Unknown' ? `in ${m.daysToBirthday} day(s)` : 'Unknown'}`
        ).join('\n')}

### Today's Special Events
${ctx.memberSummaries.filter(m => m.isBirthdayToday).length > 0
                ? '🎉 Birthday(s) today: ' + ctx.memberSummaries.filter(m => m.isBirthdayToday).map(m => m.name).join(', ') + ' — Wish them well!'
                : 'No member birthdays today. Use googleSearch to check for Indian holidays or global events if asked.'}

### Financial Summary
- Total Members: ${ctx.memberSummaries.length}
- Total Meals Recorded: ${ctx.totalMeals}
- Total Approved Expenses: ₹${ctx.totalExpenses}
- Estimated Meal Rate: ₹${ctx.mealRate} per meal

### Expense Breakdown by Category (Approved Only)
${Object.entries(ctx.byCategory).map(([cat, amt]) => `• ${cat[0].toUpperCase() + cat.slice(1)}: ₹${amt}`).join('\n') || '• No expense data available.'}

### Recent Expense Items (Last 20)
${ctx.recentExpenseItems.map(e => `• [${e.date}] ${e.description} — ₹${e.amount} (${e.category}, paid by: ${e.paidBy})`).join('\n') || '• No recent expenses.'}

### Guest Meals Summary
- Today's guest meals: ${ctx.todayGuestMeals.length > 0 ? ctx.todayGuestMeals.map(g => `${g.memberName}: ${g.guestMealType} (${g.mealTime})`).join(', ') : 'None recorded today'}
- All-time guest meal counts: ${Object.entries(ctx.guestMealSummary).map(([type, count]) => `${type}: ${count}`).join(' | ') || 'No guest meals recorded'}

### Cooking Schedule (Recent)
${ctx.recentCooks.slice(0, 10).map(c => `• ${c.date}: ${c.name}`).join('\n') || '• No cooking records.'}

### Market Schedule (Recent)
${ctx.marketSchedule.map(r => `• ${r.date}: ${r.status.toUpperCase()} — Assigned to member ID: ${r.assignedTo} (${r.type})`).join('\n') || '• No market requests found.'}

## BEHAVIOR GUIDELINES
- Financial queries → use category breakdown and recent expense items. Show totals and breakdowns clearly.
- Item-level queries ("what did we buy?", "how much was spent on rice?") → use Recent Expense Items list.
- Guest meal queries → use Guest Meals Summary section.
- Cooking queries ("who cooked last?", "has anyone cooked today?") → use Cooking Schedule.
- Market queries ("who went to market?", "what's the market schedule?") → use Market Schedule section.
- Birthday / event queries → check memberSummaries first; use googleSearch for national/global events.
- Motivational or philosophical queries → reference the Gita verse above naturally.
- General knowledge queries → answer concisely using googleSearch if needed.
- If a member (non-admin) asks about another member's financial data, politely decline to share.
- Always end complex data responses with a one-line insight or recommendation if appropriate.`;

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: question }]
                    }
                ],
                tools: [{ googleSearch: {} }],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 512,
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('[JARVIS] Gemini error:', err);
            return res.status(502).json({ error: 'AI service error. Please try again.' });
        }

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I was unable to generate a response.';
        res.json({ answer });

    } catch (err) {
        console.error('[JARVIS]', err.message);
        res.status(500).json({ error: 'JARVIS encountered an error. Please try again.' });
    }
});

module.exports = router;
