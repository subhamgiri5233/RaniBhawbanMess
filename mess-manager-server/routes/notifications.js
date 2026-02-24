const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const { auth, requireAdmin } = require('../middleware/auth');

// Get All Notifications - Admin only, or restricted to current user
router.get('/', auth, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query = { $or: [{ userId: req.user.id || req.user.userId }, { userId: 'all' }] };
        }
        const notifications = await Notification.find(query);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Notifications for User (and 'all')
router.get('/:userId', auth, async (req, res) => {
    try {
        // Security check: must be admin or the requested user
        if (req.user.role !== 'admin' && (req.user.id || req.user.userId) !== req.params.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const notifications = await Notification.find({
            $or: [{ userId: req.params.userId }, { userId: 'all' }]
        });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send Notification
router.post('/', auth, async (req, res) => {
    const { userId, message, type, metadata } = req.body;
    try {
        const newNotif = new Notification({
            userId,
            message,
            type,
            metadata
        });
        const savedNotif = await newNotif.save();
        res.status(201).json(savedNotif);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Send Payment Notifications to Multiple Members - Admin only
router.post('/payment/bulk', auth, requireAdmin, async (req, res) => {
    const { members } = req.body; // Array of { userId, memberName, amount }
    try {
        const notifications = [];

        for (const member of members) {
            const message = `Payment Due: ₹${Math.abs(Math.round(member.amount))} ${member.amount >= 0 ? 'to pay' : 'to receive'} for this month's mess expenses.`;

            const newNotif = new Notification({
                userId: member.userId,
                message,
                type: 'payment',
                paymentAmount: Math.round(member.amount),
                isPaid: false,
                metadata: {
                    memberName: member.memberName,
                    sentDate: new Date().toISOString()
                }
            });

            const savedNotif = await newNotif.save();
            notifications.push(savedNotif);
        }

        res.status(201).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mark All as Read
router.put('/mark-read/:userId', auth, async (req, res) => {
    try {
        // Security check: must be admin or the user themselves
        const requesterId = req.user.id || req.user.userId;
        if (req.user.role !== 'admin' && requesterId !== req.params.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Notification.updateMany(
            { $or: [{ userId: req.params.userId }, { userId: 'all' }] },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update specific notification (e.g. status)
router.put('/:id', auth, async (req, res) => {
    try {
        // Whitelist allowed fields to prevent mass assignment
        const { isRead, status, isPaid } = req.body;
        const updateData = {};
        if (isRead !== undefined) updateData.isRead = isRead;
        if (status !== undefined) updateData.status = status;
        if (isPaid !== undefined) updateData.isPaid = isPaid;

        const updated = await Notification.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mark Payment as Paid
router.put('/payment/:id/mark-paid', auth, async (req, res) => {
    try {
        const updated = await Notification.findByIdAndUpdate(
            req.params.id,
            { isPaid: true, isRead: true },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Notification
router.delete('/:id', auth, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Clear all notification history - Admin only (requires password verification)
router.delete('/admin/clear-all', auth, requireAdmin, async (req, res) => {
    try {
        const { password } = req.body;

        // Verify password against Settings DB
        const setting = await Settings.findOne({ key: 'clear_notifications_password' });
        if (!setting || setting.value !== password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Delete all notifications
        const result = await Notification.deleteMany({});

        res.json({
            message: 'All notification history cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const axios = require('axios');

// Official WhatsApp Cloud API - Send Bulk Notifications
router.post('/whatsapp/official/bulk', auth, requireAdmin, async (req, res) => {
    const { members } = req.body; // Array of { userId, name, mobile, balance, month }
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        return res.status(500).json({ message: 'WhatsApp API credentials not configured on server' });
    }

    try {
        const results = [];
        const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

        for (const member of members) {
            if (!member.mobile) continue;

            // Clean number and ensure 91 for India if 10 digits
            let cleanNumber = member.mobile.replace(/\D/g, '');
            if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

            const balanceText = `${Math.abs(Math.round(member.balance))} ${member.balance >= 0 ? 'To Pay' : 'To Receive'}`;

            // Production Template: mess_bill_notification (Phase 2)
            const data = {
                messaging_product: "whatsapp",
                to: cleanNumber,
                type: "template",
                template: {
                    name: "mess_bill_notification",
                    language: { code: "en" },
                    components: [
                        {
                            type: "header",
                            parameters: [
                                { type: "text", text: member.month || "Current Month" } // {{1}}
                            ]
                        },
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: member.name }, // {{1}} (Body)
                                { type: "text", text: member.month || "Current Month" }, // {{2}} (Body)
                                { type: "text", text: (member.meals || 0).toString() }, // {{3}} (Body)
                                { type: "text", text: (member.mealCharge || 0).toFixed(2) }, // {{4}} (Body)
                                { type: "text", text: (member.mealCost || 0).toFixed(2) }, // {{5}} (Body)
                                { type: "text", text: (member.fixedCost || 0).toFixed(2) }, // {{6}} (Body)
                                { type: "text", text: (member.marketContribution || 0).toFixed(2) }, // {{7}} (Body)
                                { type: "text", text: (member.deposit || 0).toFixed(2) }, // {{8}} (Body)
                                { type: "text", text: balanceText } // {{9}} (Body)
                            ]
                        }
                    ]
                }
            };

            try {
                const response = await axios.post(url, data, {
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                results.push({ name: member.name, success: true, messageId: response.data.messages[0].id });
            } catch (err) {
                const errorData = err.response?.data?.error || {};
                console.log(`\n[WHATSAPP ERROR] Member: ${member.name}`);
                console.log(`Number: ${cleanNumber}`);
                console.log('Error:', JSON.stringify(errorData, null, 2));

                results.push({
                    name: member.name,
                    success: false,
                    error: errorData.message || err.message,
                    code: errorData.code,
                    fbtrace_id: errorData.fbtrace_id
                });
            }
        }

        res.json({
            message: 'WhatsApp bulk operation completed',
            results
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
