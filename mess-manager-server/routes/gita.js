const express = require('express');
const router = express.Router();
const { getDailyGitaVerse } = require('../utils/gitaUtils');

/**
 * @route   GET /api/gita/daily
 * @desc    Get the daily Gita verse
 * @access  Public
 */
router.get('/daily', (req, res) => {
    try {
        const verse = getDailyGitaVerse();
        res.json(verse);
    } catch (error) {
        console.error('Error fetching daily Gita verse:', error);
        res.status(500).json({ message: 'Error fetching daily Gita verse' });
    }
});

module.exports = router;
