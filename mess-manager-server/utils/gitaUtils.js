const { ALL_GITA_VERSES } = require('../data/gitaFullData');

/**
 * Gets the Gita verse for the current day.
 * Uses the merged ALL_GITA_VERSES from gitaFullData.js
 * (which already contains chapter, verse, sanskrit, meaning_bn, and insight).
 * @param {Date} date - The date to check for.
 * @returns {Object} - Full verse object with insight included.
 */
function getDailyGitaVerse(date = new Date()) {
    const startYear = 2026;
    const startMonth = 2; // March (0-indexed)
    const startDay = 8;   // March 8, 2026 = Verse 1.1 (Day 0)

    const anchorDate = new Date(startYear, startMonth, startDay);

    // Clean midnight dates for accurate day counting
    const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const d2 = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());

    const diffTime = d1 - d2;
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    const verseIndex = diffDays % ALL_GITA_VERSES.length;

    // Verse already has: chapter, chapterName, verse, sanskrit, meaning_bn, insight
    return ALL_GITA_VERSES[verseIndex];
}

module.exports = { getDailyGitaVerse };


