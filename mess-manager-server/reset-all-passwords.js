require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const User = require('./models/User');

async function resetAllPasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Reset admin password to admin@123
        const adminResult = await mongoose.model('Admin').updateMany(
            {},
            { $set: { password: 'admin@123' } }
        );
        console.log(`✅ Reset ${adminResult.modifiedCount} admin password(s) to: admin@123`);

        // Reset all user passwords to their userId (lowercase)
        const users = await User.find();
        for (const user of users) {
            const newPassword = user.userId.toLowerCase();
            await mongoose.model('User').updateOne(
                { _id: user._id },
                { $set: { password: newPassword } }
            );
            console.log(`✅ Reset password for ${user.userId} to: ${newPassword}`);
        }

        console.log('\n✅ All passwords reset successfully!');
        console.log('🔐 Admin login: Admin / admin@123');
        console.log('🔐 Member login: [userId] / [userId in lowercase]');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

resetAllPasswords();
