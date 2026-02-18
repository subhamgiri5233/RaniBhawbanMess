const { getDailyGitaVerse } = require('./gitaUtils');
const { SPECIAL_OCCASIONS, DATE_EFFECTS } = require('../data/dailyInfo');

/**
 * Gets the combined daily info (Gita verse + Special Occasion + Date Effects)
 * @param {Date} date - The date to check for.
 * @returns {Object} - Object containing gita, occasion, and effects.
 */
function getCombinedDailyInfo(date = new Date()) {
    const key = `${date.getMonth() + 1}-${date.getDate()}`;

    // Get Gita Verse
    const gita = getDailyGitaVerse(date);

    // Get Occasion
    const occasion = SPECIAL_OCCASIONS[key] || null;

    // Get Effects
    const effects = DATE_EFFECTS[key] || null;

    return {
        gita,
        occasion,
        effects,
        dateKey: key
    };
}

module.exports = { getCombinedDailyInfo };
