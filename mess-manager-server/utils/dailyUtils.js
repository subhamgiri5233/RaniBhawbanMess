const { getDailyGitaVerse } = require('./gitaUtils');
const Settings = require('../models/Settings');

const BUILD_ID = "2026-04-01-NO-AI";

/**
 * Gets the combined daily info (Gita verse + static occasion info).
 * AI has been removed — uses only static data from gitaUtils.
 * @param {Date} date - The date to check for.
 * @returns {Promise<Object>}
 */
async function getCombinedDailyInfo(date = new Date()) {
    const key = `${date.getMonth() + 1}-${date.getDate()}`;

    try {
        const gitaSetting = await Settings.findOne({ key: 'gita_start_date' });
        const startDate = gitaSetting ? gitaSetting.value : null;
        
        const gita = getDailyGitaVerse(date, startDate);

        // Build a simple static verse result
        const gitaResult = gita ? {
            chapterName: gita.chapterName,
            verse: String(gita.verse),
            sanskrit: gita.sanskrit,
            meaning_bn: gita.meaning_bn,
            insight: gita.insight || "প্রতিদিন গীতার একটি শ্লোক পাঠ জীবনকে অর্থবহ করে তোলে।",
            ai: false
        } : null;

        return {
            buildId: BUILD_ID,
            gita: gitaResult,
            occasion: null,
            effects: null,
            dateKey: key,
            aiImportance: [],
            aiError: null
        };
    } catch (e) {
        return { error: e.message, buildId: BUILD_ID };
    }
}

module.exports = { getCombinedDailyInfo };
