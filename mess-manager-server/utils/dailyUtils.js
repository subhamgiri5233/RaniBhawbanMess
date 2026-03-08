const { getAIGitaVerse, getAIImportance } = require('./aiUtils');

const BUILD_ID = "2026-03-08-CLEAN-PUSH-V5"; // Clear generic fallbacks

/**
 * Gets the combined daily info (Gita verse + AI-generated occasion & insights).
 * dailyInfo.js is no longer needed — Gemini handles everything.
 * @param {Date} date - The date to check for.
 * @returns {Promise<Object>}
 */
async function getCombinedDailyInfo(date = new Date()) {
    const key = `${date.getMonth() + 1}-${date.getDate()}`;

    // Build date string for the AI prompt
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dateStr = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

    // Get the correct sequential verse for today
    const { getDailyGitaVerse } = require('./gitaUtils');
    const baseVerse = getDailyGitaVerse(date);

    // Get Gita Verse with AI Insights
    const gita = await getAIGitaVerse(dateStr, baseVerse);

    // Ask Gemini: "Why is today important?"
    const aiResult = await getAIImportance(dateStr);

    // Shape the occasion from AI output so the frontend reads it the same way
    const occasion = aiResult
        ? { name: aiResult.name, emoji: aiResult.emoji, color: 'text-emerald-600' }
        : null;

    const aiImportance = aiResult?.insights || [];

    return {
        buildId: BUILD_ID,
        gita,
        occasion,
        effects: null,   // Particle effects removed — fully AI-driven now
        dateKey: key,
        aiImportance
    };
}

module.exports = { getCombinedDailyInfo };
