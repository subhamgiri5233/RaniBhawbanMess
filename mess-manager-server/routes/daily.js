const express = require('express');
const router = express.Router();
const { getCombinedDailyInfo } = require('../utils/dailyUtils');

/**
 * @route   GET /api/daily/info
 * @desc    Get all daily information (Gita + Occasions)
 * @access  Public
 */
router.get('/info', (req, res) => {
    try {
        const info = getCombinedDailyInfo();
        res.json(info);
    } catch (error) {
        console.error('Error fetching combined daily info:', error);
        res.status(500).json({ message: 'Error fetching combined daily info' });
    }
});

module.exports = router;
