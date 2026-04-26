const webpush = require('web-push');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Configure web-push
webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:adarshagiri@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to a specific user or all users
 * @param {string} userId - The database _id of the user, or 'all'
 * @param {string} title - The notification title
 * @param {string} body - The notification body
 * @param {string} url - Optional URL to open when clicked
 */
const sendPushNotification = async (userId, title, body, url = '/') => {
    try {
        let targets = [];
        
        if (userId === 'all') {
            const members = await User.find({ pushSubscription: { $ne: null } });
            const admins = await Admin.find({ pushSubscription: { $ne: null } });
            targets = [...members, ...admins];
        } else {
            // Find by _id (if valid) or custom userId
            const mongoose = require('mongoose');
            const isObjectId = mongoose.Types.ObjectId.isValid(userId);
            
            let user = await User.findOne({ 
                $or: [
                    ...(isObjectId ? [{ _id: userId }] : []),
                    { userId: userId }
                ],
                pushSubscription: { $ne: null }
            });
            
            if (!user) {
                user = await Admin.findOne({ 
                    _id: userId,
                    pushSubscription: { $ne: null }
                });
            }
            
            if (user) targets.push(user);
        }

        const notificationPayload = JSON.stringify({
            title,
            body,
            url
        });

        const pushPromises = targets.map(target => 
            webpush.sendNotification(target.pushSubscription, notificationPayload)
                .catch(err => {
                    console.error(`Error sending push to user ${target._id}:`, err.statusCode);
                    // If subscription has expired or is invalid, remove it
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        target.pushSubscription = null;
                        target.save();
                    }
                })
        );

        await Promise.all(pushPromises);
    } catch (err) {
        console.error('Error in sendPushNotification:', err);
    }
};

module.exports = { sendPushNotification };
