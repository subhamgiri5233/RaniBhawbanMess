const express = require('express');
const router = express.Router();
const { getCombinedDailyInfo } = require('../utils/dailyUtils');

/**
 * @route   GET /api/daily/info
 * @desc    Get all daily information (Gita + Occasions + AI Insights)
 * @access  Public
 */
router.get('/info', async (req, res) => {
    try {
        const info = await getCombinedDailyInfo();
        res.json(info);
    } catch (error) {
        console.error('Error fetching combined daily info:', error);
        res.status(500).json({ message: 'Error fetching combined daily info' });
    }
});

module.exports = router;
