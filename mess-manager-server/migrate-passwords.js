require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Admin = require('./models/Admin');

const MONGO_URI = process.env.MONGO_URI;

async function migratePasswords() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Migrate User passwords
        console.log('\n📝 Migrating user passwords...');
        const users = await User.find().select('+password');
        console.log(`Found ${users.length} users`);

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2)
            if (user.password.startsWith('$2')) {
                console.log(`  ✓ User ${user.name} password already hashed`);
                continue;
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);

            // Update directly in DB to bypass pre-save hook
            await mongoose.model('User').updateOne(
                { _id: user._id },
                { $set: { password: hashedPassword } }
            );

            console.log(`  ✓ Migrated password for user: ${user.name}`);
        }

        // Migrate Admin passwords
        console.log('\n📝 Migrating admin passwords...');
        const admins = await Admin.find().select('+password');
        console.log(`Found ${admins.length} admins`);

        for (const admin of admins) {
            if (admin.password.startsWith('$2')) {
                console.log(`  ✓ Admin ${admin.username} password already hashed`);
                continue;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(admin.password, salt);

            await mongoose.model('Admin').updateOne(
                { _id: admin._id },
                { $set: { password: hashedPassword } }
            );

            console.log(`  ✓ Migrated password for admin: ${admin.username}`);
        }

        console.log('\n✅ Password migration completed successfully!');
        console.log('\n⚠️  IMPORTANT: All users must login again with their passwords.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run migration
migratePasswords();
