/**
 * AI Seed Data for Production
 * This file provides high-quality fallbacks for "Why Today is Important" 
 * to ensure production looks great even if the AI hits rate limits.
 */

const aiSeed = {
    // March 8, 2026 - curated from local cache
    "2026-03-08": {
        "name": "March 8, 2026 — আজকের গুরুত্বপূর্ণ ঘটনা",
        "emoji": "📅",
        "insights": [
            {
                "icon": "🎨",
                "categoryDisplay": "বাংলা উৎসব",
                "category": "Bengali Festival",
                "event": "রঙ পঞ্চমী (Ranga Panchami)",
                "text": "দোল বা হোলির পাঁচ দিন পর এটি অনুষ্ঠিত হয়। এটি পঞ্চতত্ত্ব বা সৃষ্টির পাঁচ উপাদানকে সক্রিয় করার উৎসব হিসেবে পালিত হয়।",
                "ai": true
            },
            {
                "icon": "👩",
                "categoryDisplay": "আন্তর্জাতিক দিবস",
                "category": "Global Observance",
                "event": "আন্তর্জাতিক নারী দিবস",
                "text": "নারীর সামাজিক, অর্থনৈতিক এবং রাজনৈতিক সাফল্য উদযাপনের দিন। আজকের প্রতিপাদ্য হলো নারী শক্তির জয়গান।",
                "ai": true
            },
            {
                "icon": "📜",
                "categoryDisplay": "ঐতিহাসিক ঘটনা",
                "category": "Historical Event",
                "event": "মুঘল সম্রাট বাবর (১৫৩০)",
                "text": "ভারতে মুঘল সাম্রাজ্যের প্রতিষ্ঠাতা বাবরের মৃত্যু দিবস হিসেবে এটি ঐতিহাসিকভাবে গুরুত্ব বহন করে।",
                "year": 1530,
                "ai": true
            }
        ]
    }
    // We can add more dates here as we crawl them locally
};

module.exports = aiSeed;
