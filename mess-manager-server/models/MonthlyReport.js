const mongoose = require('mongoose');

const monthlyReportSchema = new mongoose.Schema({
    month: { type: String, required: true, unique: true }, // Format: YYYY-MM
    pdfData: { type: String, required: true }, // Base64 encoded PDF
    fileName: { type: String, required: true },
    generatedBy: { type: String, required: true }, // Admin user ID
    generatedByName: { type: String }, // Admin name for display
    createdAt: { type: Date, default: Date.now },
    fileSize: { type: Number } // Size in bytes
});

module.exports = mongoose.model('MonthlyReport', monthlyReportSchema);
