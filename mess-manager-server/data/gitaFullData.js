/**
 * gitaFullData.js
 * ─────────────────────────────────────────────────────────
 * Single source of truth for all Gita verses.
 * All 18 chapters now have insight_bn embedded directly in gitaData.js,
 * so no secondary lookup is needed.
 *
 * Usage:
 *   const { ALL_GITA_VERSES } = require('./gitaFullData');
 * ─────────────────────────────────────────────────────────
 */

const gitaData = require('./gitaData');

const GENERIC_INSIGHT = "প্রতিদিন গীতার একটি শ্লোক পাঠ মনকে শান্ত ও কেন্দ্রীভূত রাখে। জ্ঞানের আলোয় জীবনকে অর্থবহ করে তুলুন।";

// Build a flat array of all verses with everything embedded
const ALL_GITA_VERSES = [];

Object.values(gitaData).forEach(chapter => {
    chapter.verses.forEach(v => {
        ALL_GITA_VERSES.push({
            chapter: chapter.chapter,
            chapterName: chapter.chapter_name_bn,
            verse: v.verse,
            sanskrit: v.sanskrit,
            meaning_bn: v.meaning_bn,
            insight: v.insight_bn || GENERIC_INSIGHT
        });
    });
});

module.exports = { ALL_GITA_VERSES };
