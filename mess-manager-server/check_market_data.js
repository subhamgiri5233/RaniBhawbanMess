const mongoose = require('mongoose');
const MarketRequest = require('./models/MarketRequest');
const User = require('./models/User');
require('dotenv').config();

async function checkData() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const month = '2026-04';
    const requests = await MarketRequest.find({ date: { $regex: new RegExp('^' + month) } });
    console.log(`Found ${requests.length} requests for ${month}:`);
    
    for (const req of requests) {
        const user = await User.findById(req.assignedMemberId);
        console.log(`Date: ${req.date}, ID: ${req.assignedMemberId}, Status: ${req.status}, Name: ${user ? user.name : 'NOT FOUND'}`);
    }

    process.exit();
}

checkData();
