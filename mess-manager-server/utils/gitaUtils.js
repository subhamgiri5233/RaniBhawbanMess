const { ALL_GITA_VERSES } = require('../data/gitaFullData');

/**
 * Gets the Gita verse for the current day.
 * Uses the merged ALL_GITA_VERSES from gitaFullData.js
 * (which already contains chapter, verse, sanskrit, meaning_bn, and insight).
 * @param {Date} date - The date to check for.
 * @param {String} customStartDate - Optional start date from settings (e.g., '2026-04-01').
 * @returns {Object} - Full verse object with insight included.
 */
function getDailyGitaVerse(date = new Date(), customStartDate = null) {
    // Default setup (April 1st, 2026) in case no custom date is provided or setting is missing
    let startYear = 2026;
    let startMonth = 3; // April (0-indexed)
    let startDay = 1;

    // Preference: If a custom date is provided in settings, use it.
    if (customStartDate && customStartDate !== '') {
        try {
            const d = new Date(customStartDate);
            if (!isNaN(d.getTime())) {
                startYear = d.getFullYear();
                startMonth = d.getMonth();
                startDay = d.getDate();
            }
        } catch (e) {
            console.error('Invalid custom start date provided:', customStartDate);
        }
    }

    // Use a fixed midnight calculation in IST context
    // We construct a string "YYYY-MM-DD" in IST to ensure consistency
    const istDateStr = new Date(date.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const targetDate = new Date(istDateStr);
    
    // Construct the anchor date - Note: new Date(year, month, day) expects 0-indexed month
    const anchorDate = new Date(startYear, startMonth, startDay);

    const diffTime = targetDate - anchorDate;
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    // Ensure we don't go out of bounds (mod the total verses)
    const verseIndex = diffDays % ALL_GITA_VERSES.length;

    // Return the full verse object
    return ALL_GITA_VERSES[verseIndex];
}

module.exports = { getDailyGitaVerse };
