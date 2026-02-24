const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Meal = require('../models/Meal');
const Expense = require('../models/Expense');
const { getDailyGitaVerse } = require('../utils/gitaUtils');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;


// Build mess context from live database data
const buildMessContext = async () => {
    const [members, expenses, meals] = await Promise.all([
        User.find({ $or: [{ role: 'member' }, { role: { $exists: false } }, { role: null }] })
            .select('name deposit joinedAt dateOfBirth mobile').lean(),
        Expense.find({ status: 'approved' }).lean(),
        Meal.find().lean(),
    ]);

    // Member summaries with meal counts and birthdays
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const memberSummaries = await Promise.all(members.map(async (m) => {
        const mealCount = await Meal.countDocuments({ memberId: m._id.toString() });
        let daysToBirthday = 'Unknown';
        let isBirthdayToday = false;

        if (m.dateOfBirth) {
            const dob = new Date(m.dateOfBirth);
            if (!isNaN(dob.getTime())) {
                const currentYear = today.getFullYear();
                let nextBirthday = new Date(currentYear, dob.getMonth(), dob.getDate());

                if (nextBirthday < today) {
                    nextBirthday.setFullYear(currentYear + 1);
                }

                const diffTime = Math.abs(nextBirthday - today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

    // Expense breakdown by category
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
        acc[e.category || 'others'] = (acc[e.category || 'others'] || 0) + e.amount;
        return acc;
    }, {});

    const totalMeals = meals.length;
    const mealRate = totalMeals > 0 && totalExpenses > 0
        ? (totalExpenses / totalMeals).toFixed(2)
        : 'N/A';

    return { memberSummaries, totalExpenses, byCategory, totalMeals, mealRate };
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

        const systemPrompt = `You are JARVIS, the intelligent AI assistant for Rani Bhawban Mess — a student mess management system. You speak like the JARVIS from Iron Man: confident, precise, slightly witty, and always helpful. Keep answers concise (2-4 sentences max unless a list is needed).

Current date/time (IST): ${now}
Asking user: ${req.user.name} (${req.user.role})

=== DAILY GITA VERSE ===
Chapter ${gitaVerse.chapter}, Verse ${gitaVerse.verse}
Sanskrit: ${gitaVerse.sanskrit}
Translation: ${gitaVerse.translation}
Meaning: ${gitaVerse.meaning}

=== LIVE MESS DATA ===

Members & Deposits & Birthdays:
${ctx.memberSummaries.map(m => `- ${m.name}: ₹${m.deposit} deposit, ${m.meals} meals. DOB: ${m.dob} (${m.daysToBirthday === 0 ? 'HAPPY BIRTHDAY TODAY! 🎈' : m.daysToBirthday !== 'Unknown' ? m.daysToBirthday + ' days until next birthday' : 'Unknown'})`).join('\n')}

Important Events Today:
${ctx.memberSummaries.filter(m => m.isBirthdayToday).length > 0 ? 'Today is the birthday of: ' + ctx.memberSummaries.filter(m => m.isBirthdayToday).map(m => m.name).join(', ') + '! Wish them a happy birthday!' : 'No member birthdays today. (You can search the web for external holidays/events).'}

Total Members: ${ctx.memberSummaries.length}
Total Meals Recorded: ${ctx.totalMeals}
Total Approved Expenses: ₹${ctx.totalExpenses}
Estimated Meal Rate: ₹${ctx.mealRate}/meal

Expense Breakdown (approved):
${Object.entries(ctx.byCategory).map(([cat, amt]) => `- ${cat}: ₹${amt}`).join('\n')}

=== END OF DATA ===

Answer the user's question using the above data when relevant. If asked why today is important, mention member birthdays if any, or use the googleSearch tool to find out if today is a special holiday, festival, or important date in India/World. Never make up numbers not present in the data.`;

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
