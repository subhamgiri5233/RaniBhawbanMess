const { ALL_GITA_VERSES } = require('../data/gitaFullData');

/**
 * Gets the Gita verse for the current day.
 * Uses the merged ALL_GITA_VERSES from gitaFullData.js
 * (which already contains chapter, verse, sanskrit, meaning_bn, and insight).
 * @param {Date} date - The date to check for.
 * @returns {Object} - Full verse object with insight included.
 */
function getDailyGitaVerse(date = new Date()) {
    // Lock start date to March 8, 2026
    const startYear = 2026;
    const startMonth = 2; // March (0-indexed)
    const startDay = 8;

    // Use a fixed midnight calculation in IST context
    // We construct a string "YYYY-MM-DD" in IST to ensure consistency
    const istDateStr = new Date(date.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const targetDate = new Date(istDateStr);
    const anchorDate = new Date(startYear, startMonth, startDay);

    const diffTime = targetDate - anchorDate;
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    const verseIndex = diffDays % ALL_GITA_VERSES.length;

    // Verse already has: chapter, chapterName, verse, sanskrit, meaning_bn, insight
    return ALL_GITA_VERSES[verseIndex];
}

module.exports = { getDailyGitaVerse };


