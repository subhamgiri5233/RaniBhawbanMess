const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mess-manager';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB for Seeding'))
    .catch(err => console.error(err));

const seedMembers = [
    { name: 'John Doe', userId: 'john', password: '123', mobile: '9876543210', email: 'john@example.com', deposit: 5000, role: 'member' },
    { name: 'Alice Smith', userId: 'alice', password: '123', mobile: '9876543211', email: 'alice@example.com', deposit: 5000, role: 'member' },
    { name: 'Bob Johnson', userId: 'bob', password: '123', mobile: '9876543212', email: 'bob@example.com', deposit: 0, role: 'member' },
];

const seedDB = async () => {
    await User.deleteMany({}); // Clear existing
    await User.insertMany(seedMembers);
    console.log('Database Seeded!');
    mongoose.connection.close();
};

seedDB();
