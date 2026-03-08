const { getAIGitaVerse, getAIImportance } = require('./aiUtils');

const BUILD_ID = "2026-03-08-CLEAN-PUSH-V5"; // Clear generic fallbacks

/**
 * Gets the combined daily info (Gita verse + AI-generated occasion & insights).
 * dailyInfo.js is no longer needed — Gemini handles everything.
 * @param {Date} date - The date to check for.
 * @returns {Promise<Object>}
 */
let lastAIError = null;

async function getCombinedDailyInfo(date = new Date()) {
    const key = `${date.getMonth() + 1}-${date.getDate()}`;

    // Build date string for the AI prompt
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dateStr = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

    // Get the correct sequential verse for today
    const { getDailyGitaVerse } = require('./gitaUtils');
    const baseVerse = getDailyGitaVerse(date);

    try {
        // Fetch both with error capturing
        const gita = await getAIGitaVerse(dateStr, baseVerse).catch(err => {
            lastAIError = `Gita Error: ${err.message}`;
            return null; // Fallback handled inside getAIGitaVerse
        });

        const aiResult = await getAIImportance(dateStr).catch(err => {
            lastAIError = `Importance Error: ${err.message}`;
            return null; // Fallback handled inside getAIImportance
        });

        // Shape the occasion from AI output
        const occasion = aiResult
            ? { name: aiResult.name, emoji: aiResult.emoji, color: 'text-emerald-600' }
            : null;

        const aiImportance = aiResult?.insights || [];

        return {
            buildId: BUILD_ID,
            gita,
            occasion,
            effects: null,
            dateKey: key,
            aiImportance,
            aiError: lastAIError
        };
    } catch (e) {
        return { error: e.message, buildId: BUILD_ID };
    }
}

module.exports = { getCombinedDailyInfo };
