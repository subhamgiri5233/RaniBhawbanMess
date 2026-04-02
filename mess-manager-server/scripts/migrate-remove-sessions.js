const mongoose = require('mongoose');
require('dotenv').config();

const migrate = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mess-manager';
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        console.log('Removing sessionToken from all users...');
        const userResult = await db.collection('users').updateMany(
            {}, 
            { $unset: { sessionToken: "" } }
        );
        console.log('Users update result:', userResult);

        console.log('Removing sessionToken from all admins...');
        const adminResult = await db.collection('admins').updateMany(
            {}, 
            { $unset: { sessionToken: "" } }
        );
        console.log('Admins update result:', adminResult);

        console.log('Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
