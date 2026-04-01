const express = require('express');
const router = express.Router();
const { getDailyGitaVerse } = require('../utils/gitaUtils');
const Settings = require('../models/Settings');

/**
 * @route   GET /api/gita/daily
 * @desc    Get the daily Gita verse
 * @access  Public
 */
router.get('/daily', async (req, res) => {
    try {
        const gitaSetting = await Settings.findOne({ key: 'gita_start_date' });
        const startDate = gitaSetting ? gitaSetting.value : null;

        const verse = getDailyGitaVerse(new Date(), startDate);
        res.json(verse);
    } catch (error) {
        console.error('Error fetching daily Gita verse:', error);
        res.status(500).json({ message: 'Error fetching daily Gita verse' });
    }
});

module.exports = router;
