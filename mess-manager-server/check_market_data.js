const mongoose = require('mongoose');
const MonthlySummary = require('./models/MonthlySummary');
const MarketRequest = require('./models/MarketRequest');
require('dotenv').config();

const MONGO_URI = 'mongodb://localhost:27017/mess-manager'; // Adjust if needed

async function check() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const month = '2026-04'; // Adjust to current month
    
    console.log(`\n--- Checking Market Duty Limits for ${month} ---`);
    const summaries = await MonthlySummary.find({ month });
    summaries.forEach(s => {
        console.log(`Member: ${s.memberName} (${s.memberId}), marketDays (Limit): ${s.marketDays}`);
    });

    console.log(`\n--- Checking Market Requests/Assignments for ${month} ---`);
    const requests = await MarketRequest.find({ date: new RegExp(`^${month}`) });
    const counts = {};
    requests.forEach(r => {
        const id = r.assignedMemberId.toString();
        if (!counts[id]) counts[id] = { approved: 0, pending: 0, rejected: 0 };
        counts[id][r.status]++;
    });

    for (const id in counts) {
        console.log(`Member ID: ${id}, Approved: ${counts[id].approved}, Pending: ${counts[id].pending}, Rejected: ${counts[id].rejected}`);
    }

    await mongoose.disconnect();
}

check();
