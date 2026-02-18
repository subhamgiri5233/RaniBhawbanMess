const gitaData = require('../data/gitaData');

/**
 * Gets the Gita verse for the current day.
 * Cycles through all verses of all implemented chapters.
 * @param {Date} date - The date to check for.
 * @returns {Object} - Object containing chapter name, verse number, sanskrit, and meaning.
 */
function getDailyGitaVerse(date = new Date()) {
    const chapters = Object.values(gitaData);
    const allVerses = [];

    chapters.forEach(chapter => {
        chapter.verses.forEach(v => {
            allVerses.push({
                ...v,
                chapterName: chapter.chapter_name_bn,
                chapter: chapter.chapter
            });
        });
    });

    const startYear = 2026;
    const startMonth = 1; // February (0-indexed 1)
    const startDay = 14;

    // Create an anchor date (today) as Verse 1
    const anchorDate = new Date(startYear, startMonth, startDay);

    // Create clean midnight dates for accurate day counting
    const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const d2 = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());

    // Calculate difference in days
    const diffTime = d1 - d2;
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    const totalVerses = allVerses.length;
    const verseIndex = diffDays % totalVerses;

    return allVerses[verseIndex];
}

module.exports = { getDailyGitaVerse };
