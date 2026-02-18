require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');

async function resetAdminPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find admin
        const admin = await Admin.findOne();

        if (!admin) {
            console.log('❌ No admin found. Creating new admin...');
            const newAdmin = new Admin({
                username: 'Admin',
                password: 'admin@123' // Will be hashed by pre-save hook
            });
            await newAdmin.save();
            console.log('✅ New admin created with password: admin@123');
        } else {
            console.log(`📝 Found admin: ${admin.username}`);
            console.log('🔄 Resetting password to: admin@123');

            // Hash the password manually
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin@123', salt);

            // Update directly in DB to bypass pre-save hook
            await mongoose.model('Admin').updateOne(
                { _id: admin._id },
                { $set: { password: hashedPassword } }
            );

            console.log('✅ Admin password reset successfully!');

            // Verify it works
            const updatedAdmin = await Admin.findOne().select('+password');
            const isMatch = await bcrypt.compare('admin@123', updatedAdmin.password);
            console.log('✅ Verification: admin@123 matches?', isMatch);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

resetAdminPassword();
