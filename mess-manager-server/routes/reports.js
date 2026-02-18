const express = require('express');
const router = express.Router();
const MonthlyReport = require('../models/MonthlyReport');
const User = require('../models/User');
const { auth, requireAdmin } = require('../middleware/auth');

// Get all monthly reports (list for members) - Requires auth
router.get('/', auth, async (req, res) => {
    try {
        // Return all reports without PDF data for listing (to save bandwidth)
        const reports = await MonthlyReport.find()
            .select('-pdfData') // Exclude pdfData
            .sort({ month: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get specific report with PDF data for download - Requires auth
router.get('/:id', auth, async (req, res) => {
    try {
        const report = await MonthlyReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get report by month - Requires auth
router.get('/month/:month', auth, async (req, res) => {
    try {
        const report = await MonthlyReport.findOne({ month: req.params.month });
        if (!report) {
            return res.status(404).json({ error: 'Report not found for this month' });
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save new monthly report (admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
    try {
        const { month, pdfData, fileName, generatedBy, generatedByName } = req.body;

        // Try to get admin name from database if valid ObjectId, otherwise use provided name
        let adminName = generatedByName || 'Admin';

        // Check if generatedBy is a valid MongoDB ObjectId
        if (generatedBy && generatedBy.match(/^[0-9a-fA-F]{24}$/)) {
            try {
                const admin = await User.findById(generatedBy);
                if (admin) {
                    adminName = admin.name;
                }
            } catch (e) {
                // If lookup fails, use provided name or default
            }
        }

        // Check if report for this month already exists
        const existing = await MonthlyReport.findOne({ month });

        if (existing) {
            // Update existing report
            existing.pdfData = pdfData;
            existing.fileName = fileName;
            existing.generatedBy = generatedBy;
            existing.generatedByName = adminName;
            existing.createdAt = new Date();
            existing.fileSize = Buffer.from(pdfData, 'base64').length;

            await existing.save();
            return res.json({ message: 'Report updated successfully', report: existing });
        }

        // Create new report
        const report = new MonthlyReport({
            month,
            pdfData,
            fileName,
            generatedBy,
            generatedByName: adminName,
            fileSize: Buffer.from(pdfData, 'base64').length
        });

        await report.save();
        res.status(201).json({ message: 'Report saved successfully', report });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a report (admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
    try {
        const report = await MonthlyReport.findByIdAndDelete(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json({ message: 'Report deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
