const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

/* ==========================
   CONFIG & INITIALIZATION
========================== */

const DATA_DIR = path.join(__dirname, "../data");
const CACHE_FILE = path.join(DATA_DIR, "aiCache.json");
const GITA_CACHE_FILE = path.join(DATA_DIR, "aiGitaCache.json");
const DEBUG_LOG = path.join(DATA_DIR, "ai_debug.log");

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const GEMINI_TIMEOUT = 45000;
const MAX_RETRIES = 2;

const MODEL_NAME = "gemini-1.5-flash"; // More stable for free tier quotas

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Lazy initialized Gemini instances
let genAI = null;
let model = null;

function getModel() {
    if (model) return model;

    if (!process.env.GEMINI_API_KEY) {
        logDebug("Warning: GEMINI_API_KEY is missing in process.env");
        return null;
    }

    try {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: MODEL_NAME });
        return model;
    } catch (err) {
        logDebug("Gemini initialization failed: " + err.message);
        return null;
    }
}

const inFlightRequests = new Map();

// Local memory cache
let memoryCache = null;
let gitaMemoryCache = null;

/* ==========================
   UTILITIES
========================== */

const MAX_LOG_SIZE = 500 * 1024; // 500KB

function logDebug(msg) {
    const time = new Date().toISOString();
    const line = `${time}: ${msg}\n`;

    try {
        // Rotate log if it exceeds 500KB
        if (fs.existsSync(DEBUG_LOG) && fs.statSync(DEBUG_LOG).size > MAX_LOG_SIZE) {
            fs.writeFileSync(DEBUG_LOG, `${time}: [LOG ROTATED — previous entries cleared]\n`);
        }
        fs.appendFileSync(DEBUG_LOG, line);
    } catch { }

    console.log("[AI]", msg);
}

const CACHE_VERSION = "v16-clean-refresh"; // Bump this to force a server-side refresh

function getTodayKey() {
    // Returns YYYY-MM-DD for Kolkata timezone prefixed with version
    const dateStr = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
    });
    return `${CACHE_VERSION}_${dateStr}`;
}

function loadCache(force = false) {
    if (memoryCache && !force) return memoryCache;
    try {
        if (!fs.existsSync(CACHE_FILE)) {
            memoryCache = {};
            return memoryCache;
        }
        const raw = fs.readFileSync(CACHE_FILE, "utf8");
        memoryCache = JSON.parse(raw || "{}");
        return memoryCache;
    } catch (e) {
        logDebug("Cache read error: " + e.message);
        return {};
    }
}

/**
 * Removes cache entries older than maxDays from a cache object (in-place).
 */
function pruneCacheEntries(cache, maxDays = 30) {
    const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
    let pruned = 0;
    for (const key of Object.keys(cache)) {
        if (cache[key]?.timestamp && cache[key].timestamp < cutoff) {
            delete cache[key];
            pruned++;
        }
    }
    if (pruned > 0) logDebug(`Pruned ${pruned} stale cache entries (older than ${maxDays} days)`);
    return cache;
}

function saveCache(cache) {
    pruneCacheEntries(cache, 30);
    memoryCache = cache;
    try {
        const temp = CACHE_FILE + ".tmp";
        fs.writeFileSync(temp, JSON.stringify(cache, null, 2));
        fs.renameSync(temp, CACHE_FILE);
    } catch (e) {
        logDebug("Cache write error: " + e.message);
    }
}

function loadGitaCache(force = false) {
    if (gitaMemoryCache && !force) return gitaMemoryCache;
    try {
        if (!fs.existsSync(GITA_CACHE_FILE)) {
            gitaMemoryCache = {};
            return gitaMemoryCache;
        }
        const raw = fs.readFileSync(GITA_CACHE_FILE, "utf8");
        gitaMemoryCache = JSON.parse(raw || "{}");
        return gitaMemoryCache;
    } catch (e) {
        logDebug("Gita Cache read error: " + e.message);
        return {};
    }
}

function saveGitaCache(cache) {
    pruneCacheEntries(cache, 30);
    gitaMemoryCache = cache;
    try {
        const temp = GITA_CACHE_FILE + ".tmp";
        fs.writeFileSync(temp, JSON.stringify(cache, null, 2));
        fs.renameSync(temp, GITA_CACHE_FILE);
    } catch (e) {
        logDebug("Gita Cache write error: " + e.message);
    }
}

function extractJSON(text) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
        return JSON.parse(match[0]);
    } catch {
        return null;
    }
}

/* ==========================
   CATEGORY MAPPING (FOR UI COLORS)
========================== */

// Maps Bengali categories to English keys used by the frontend CSS
const CATEGORY_MAP = {
    "বাংলা উৎসব": "Bengali Festival",
    "ভারতীয় দিবস": "Indian National Day",
    "ঐতিহাসিক ঘটনা": "Historical Event",
    "আন্তর্জাতিক দিবস": "Global Observance",
    "বিজ্ঞান আবিষ্কার": "Science & Discovery",
    "বিখ্যাত জন্ম": "Famous Birth",
    "বিখ্যাত মৃত্যু": "Famous Death",
    "খেলাধুলা": "Sports & Achievement",
};

/* ==========================
   PROMPT BUILDER
========================== */

function buildPrompt(dateStr) {
    return `
আপনি একজন ঐতিহাসিক ও সাংস্কৃতিক গবেষণা সহকারী।

আজকের তারিখ: ${dateStr}

এই তারিখে ঘটে যাওয়া ৪ থেকে ৬টি গুরুত্বপূর্ণ ঐতিহাসিক বা সাংস্কৃতিক বিষয় খুঁজে বের করুন।

অগ্রাধিকার ক্রম:
1. বাংলা উৎসব বা বাঙালি ঐতিহাসিক ঘটনা (দুগাপূজা, কালীপূজা, নববর্ষ, ইত্যাদি)
2. ভারতীয় জাতীয় দিবস বা ঐতিহাসিক ঘটনা
3. বিখ্যাত ভারতীয় ব্যক্তিত্বের জন্ম বা মৃত্যুবার্ষিকী
4. আন্তর্জাতিক দিবস (UN, UNESCO ইত্যাদি)
5. বিশ্ব ইতিহাসের গুরুত্বপূর্ণ ঘটনা
6. বিজ্ঞান বা প্রযুক্তির আবিষ্কার

নিয়মাবলী:
• প্রতিটি বিষয়ের জন্য ১-২ বাক্যে সুন্দর বর্ণনা দিন।
• বিষয়গুলো অবশ্যই এই নির্দিষ্ট তারিখের সাথে সংশ্লিষ্ট হতে হবে।
• পাঠ্যবস্তু (নাম এবং বর্ণনা) অবশ্যই বাংলা ভাষায় হতে হবে।

ফলাফলটি শুধুমাত্র এই JSON ফরম্যাটে দিন:
{
"date":"${dateStr}",
"events":[
{
"name":"ঘটনার নাম",
"emoji":"উপযুক্ত ইমোজি (যেমন: 📜, 🎊, 🪔)",
"category":"${Object.keys(CATEGORY_MAP).join(" | ")}",
"year":"ঘটনার সাল (YYYY) বা null",
"insight":"ঘটনার বর্ণনা"
}
]
}
JSON ছাড়া অন্য কোনো লেখা পাঠাবেন না।
`;
}

function buildGitaPrompt(dateStr, baseVerse = null) {
    const verseContext = baseVerse
        ? `নির্দিষ্ট শ্লোক: ${baseVerse.chapterName} • শ্লোক ${baseVerse.verse}\nসংস্কৃত: ${baseVerse.sanskrit}\nসরলার্থ: ${baseVerse.meaning_bn}`
        : "শ্রীমদ্ভগবদ্গীতা থেকে একটি অর্থবহ শ্লোক নির্বাচন করুন।";

    return `
আপনি একজন আধ্যাত্মিক শিক্ষক এবং শ্রীমদ্ভগবদ্গীতা বিশেষজ্ঞ।

আজকের তারিখ: ${dateStr}

${verseContext}

নিয়মাবলী:
• যদি নির্দিষ্ট শ্লোক দেওয়া থাকে, তবে সেই শ্লোকটির জন্যই "দিব্য অন্তর্দৃষ্টি" প্রদান করুন।
• যদি শ্লোক দেওয়া না থাকে, তবে একটি শ্লোক নির্বাচন করুন।
• শ্লোকটি সংস্কৃত ভাষায় দিন।
• অধ্যায়ের নাম এবং শ্লোক নম্বর পরিষ্কারভাবে দিন।
• সরলার্থ (Meaning) বাংলা ভাষায় দিন।
• "দিব্য অন্তর্দৃষ্টি" (Divine Insight) নামে ২-৩ বাক্যের একটি আধুনিক ব্যাখ্যা দিন যা শিক্ষার্থীদের দৈনন্দিন জীবনে কাজে লাগবে।
• ভাষা যেন সহজ ও অনুপ্রেরণামূলক হয়।

ফলাফলটি শুধুমাত্র এই JSON ফরম্যাটে দিন:
{
"chapterName": "অধ্যায়ের নাম (যেমন: অর্জুন বিষাদ যোগ)",
"verseNumber": "শ্লোক নম্বর (যেমন: ২.৪৭)",
"sanskrit": "সংস্কৃত শ্লোক",
"meaning": "শ্লোকের বাংলা সরলার্থ",
"insight": "আধুনিক ব্যাখ্যা (শিক্ষার্থীদের জন্য)"
}
JSON ছাড়া অন্য কোনো লেখা পাঠাবেন না।
`;
}

/* ==========================
   GEMINI CALL
========================== */

async function callGemini(prompt) {
    let retries = 0;
    const MAX_RETRIES = 5; // Increased for production stability

    while (retries < MAX_RETRIES) {
        try {
            const aiModel = getModel();
            if (!aiModel) throw new Error("Gemini not initialized (Missing API Key)");

            const aiPromise = aiModel.generateContent(prompt);
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Gemini API timeout (45s)")), GEMINI_TIMEOUT)
            );

            const result = await Promise.race([aiPromise, timeout]);
            return result.response.text();
        } catch (error) {
            const isRateLimit = error.message?.includes("429") || error.message?.includes("quota");
            if (isRateLimit && retries < MAX_RETRIES - 1) {
                retries++;
                // Stronger exponential backoff: 3s, 9s, 27s...
                const delay = Math.pow(3, retries) * 1000;
                logDebug(`[AI] Rate limit hit. Attempt ${retries}/${MAX_RETRIES}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
}

/**
 * Advanced Gemini call for JARVIS with system instructions and tools.
 */
async function callGeminiAdvanced({ prompt, systemInstruction, tools = [] }) {
    let retries = 0;
    const MAX_RETRIES = 5;

    while (retries < MAX_RETRIES) {
        try {
            const aiModel = getModel();
            if (!aiModel) throw new Error("Gemini not initialized (Missing API Key)");

            const genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const advancedModel = genAIInstance.getGenerativeModel({
                model: MODEL_NAME,
                systemInstruction: systemInstruction,
                tools: tools
            });

            const aiPromise = advancedModel.generateContent(prompt);
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Gemini API timeout (45s)")), GEMINI_TIMEOUT)
            );

            const result = await Promise.race([aiPromise, timeout]);
            return result.response.text();
        } catch (error) {
            const isRateLimit = error.message?.includes("429") || error.message?.includes("quota");
            if (isRateLimit && retries < MAX_RETRIES - 1) {
                retries++;
                const delay = Math.pow(3, retries) * 1000;
                logDebug(`[AI] Advanced Rate limit hit. Attempt ${retries}/${MAX_RETRIES}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
}

/* ==========================
   NORMALIZE EVENTS
========================== */

function normalizeEvents(parsed) {
    if (!parsed || !Array.isArray(parsed.events)) return [];

    return parsed.events.slice(0, 6).map((e) => {
        // Translate Bengali category to English key for UI color coding
        const englishCategory = CATEGORY_MAP[e.category] || "Historical Event";

        return {
            icon: e.emoji || "📜",
            categoryDisplay: e.category || "ঐতিহাসিক ঘটনা", // Original Bengali text for label
            category: englishCategory,                   // English key for CSS class
            event: e.name || "গুরুত্বপূর্ণ ঘটনা",
            text: e.insight || "",
            year: e.year || null,
            ai: true,
        };
    }).filter((e) => e.event && e.text);
}

/* ==========================
   MAIN FUNCTION
========================== */

async function getAIImportance(dateStr) {
    const todayKey = getTodayKey();
    let cache = loadCache();
    if (!cache[todayKey]) cache = loadCache(true); // Force reload from disk if missing

    // Check valid cache first
    if (cache[todayKey]) {
        const age = Date.now() - cache[todayKey].timestamp;
        if (age < CACHE_TTL) {
            logDebug(`Serving cached data for ${todayKey}`);
            return cache[todayKey].data;
        }
    }

    // Prevent duplicate concurrent requests
    if (inFlightRequests.has(todayKey)) {
        logDebug(`Waiting for existing request: ${todayKey}`);
        return inFlightRequests.get(todayKey);
    }

    const promise = (async () => {
        try {
            const prompt = buildPrompt(dateStr);
            let parsed = null;

            for (let i = 0; i <= MAX_RETRIES; i++) {
                logDebug(`Calling Gemini for Importance (Attempt ${i + 1})...`);
                const raw = await callGemini(prompt);
                logDebug("AI Importance Response Preview: " + raw.slice(0, 100));

                parsed = extractJSON(raw);
                if (parsed) break;
                logDebug("Malformed Importance JSON. Retrying...");
            }

            const events = normalizeEvents(parsed);
            if (!events.length) throw new Error("AI returned zero valid events");

            const result = {
                name: `${dateStr} — আজকের গুরুত্বপূর্ণ ঘটনা`,
                emoji: "📅",
                insights: events,
            };

            // Atomic persistence
            cache[todayKey] = {
                timestamp: Date.now(),
                data: result,
            };
            saveCache(cache);

            logDebug(`Successfully cached ${events.length} events for ${dateStr}`);
            return result;

        } catch (err) {
            logDebug("Final AI Importance error: " + err.message);
            return getFallback(dateStr);
        } finally {
            inFlightRequests.delete(todayKey);
        }
    })();

    inFlightRequests.set(todayKey, promise);
    return promise;
}

/**
 * AI Powered Gita Verse Generator
 * Always computes the correct sequential verse from gitaUtils first.
 * Only uses cache if the cached verse matches today's computed verse.
 * This means changing startDay in gitaUtils.js works automatically.
 */
async function getAIGitaVerse(dateStr, baseVerse = null) {
    const todayKey = getTodayKey() + "_gita";

    // 1. ALWAYS get the correct verse from gitaUtils (this is the source of truth)
    const { getDailyGitaVerse } = require('./gitaUtils');
    const todayVerse = baseVerse || getDailyGitaVerse(new Date());

    // 2. Check cache — but ONLY serve it if the verse number matches
    let cache = loadGitaCache();
    if (!cache[todayKey]) cache = loadGitaCache(true); // Force reload from disk if missing

    if (cache[todayKey]) {
        const age = Date.now() - cache[todayKey].timestamp;
        const cachedVerseNum = cache[todayKey].data?.verse;
        const expectedVerseNum = todayVerse?.verse
            ? String(todayVerse.verse)
            : null;

        const verseMatches = !cachedVerseNum || !expectedVerseNum ||
            cachedVerseNum.replace(/[^\d.]/g, '') === String(expectedVerseNum).replace(/[^\d.]/g, '');

        if (age < CACHE_TTL && verseMatches) {
            logDebug(`Serving cached Gita for ${todayKey} (verse ${cachedVerseNum})`);
            return cache[todayKey].data;
        }

        if (!verseMatches) {
            logDebug(`Cache verse mismatch: cached=${cachedVerseNum}, expected=${expectedVerseNum}. Invalidating.`);
            delete cache[todayKey];
            saveGitaCache(cache);
        }
    }

    if (inFlightRequests.has(todayKey)) {
        logDebug(`Waiting for existing Gita request: ${todayKey}`);
        return inFlightRequests.get(todayKey);
    }

    const promise = (async () => {
        try {
            const prompt = buildGitaPrompt(dateStr, todayVerse);
            let parsed = null;

            for (let i = 0; i <= MAX_RETRIES; i++) {
                logDebug(`Calling Gemini for Gita (Attempt ${i + 1})...`);
                const raw = await callGemini(prompt);
                logDebug("AI Gita Response Preview: " + raw.slice(0, 100));

                parsed = extractJSON(raw);
                if (parsed) break;
                logDebug("Malformed Gita JSON. Retrying...");
            }

            if (!parsed || !parsed.sanskrit) {
                // AI failed — use todayVerse directly with its verse-specific insight
                if (todayVerse) {
                    const fallbackResult = {
                        chapterName: todayVerse.chapterName,
                        verse: String(todayVerse.verse),
                        sanskrit: todayVerse.sanskrit,
                        meaning_bn: todayVerse.meaning_bn,
                        insight: todayVerse.insight || "প্রতিদিন গীতার একটি শ্লোক পাঠ জীবনকে অর্থবহ করে তোলে।",
                        ai: false
                    };
                    cache[todayKey] = { timestamp: Date.now(), data: fallbackResult };
                    saveGitaCache(cache);
                    return fallbackResult;
                }
                throw new Error("Invalid Gita response from AI");
            }

            const result = {
                chapterName: parsed.chapterName || (todayVerse ? todayVerse.chapterName : "শ্রীমদ্ভগবদ্গীতা"),
                verse: parsed.verseNumber || (todayVerse ? String(todayVerse.verse) : "১.১"),
                sanskrit: parsed.sanskrit || (todayVerse ? todayVerse.sanskrit : ""),
                meaning_bn: parsed.meaning || (todayVerse ? todayVerse.meaning_bn : ""),
                insight: parsed.insight,
                ai: true
            };

            cache[todayKey] = { timestamp: Date.now(), data: result };
            saveGitaCache(cache);

            logDebug(`Successfully cached AI Gita for ${dateStr}`);
            return result;

        } catch (err) {
            logDebug("Final AI Gita error: " + err.message);
            // Last resort — return todayVerse with its verse-specific insight from gitaInsights.js
            if (todayVerse) {
                return {
                    chapterName: todayVerse.chapterName,
                    verse: String(todayVerse.verse),
                    sanskrit: todayVerse.sanskrit,
                    meaning_bn: todayVerse.meaning_bn,
                    insight: todayVerse.insight || "প্রতিদিন গীতার একটি শ্লোক পাঠ জীবনকে অর্থবহ করে তোলে।",
                    ai: false
                };
            }
            return getGitaFallback();
        } finally {
            inFlightRequests.delete(todayKey);
        }
    })();

    inFlightRequests.set(todayKey, promise);
    return promise;
}


/* ==========================
   FALLBACK
========================== */

function getFallback(dateStr) {
    return {
        name: `${dateStr} — আজকের দিন`,
        emoji: "📅",
        insights: [
            {
                icon: "🌅",
                categoryDisplay: "অনুপ্রেরণা",
                category: "Daily Thought",
                event: "নতুন শুরু",
                text: "প্রতিটি দিন নতুন কিছু শেখার সুযোগ নিয়ে আসে।",
                ai: false,
            },
            {
                icon: "📚",
                categoryDisplay: "শিক্ষা",
                category: "Learning",
                event: "নিয়মিত শিক্ষা",
                text: "নিয়মিত অধ্যবসায় সাফল্যের চাবিকাঠি।",
                ai: false,
            },
            {
                icon: "🤝",
                categoryDisplay: "সম্প্রীতি",
                category: "Community",
                event: "একতা",
                text: "পারস্পরিক সহযোগিতা একটি শক্তিশালী সমাজ গড়ে তোলে।",
                ai: false,
            },
        ],
    };
}

function getGitaFallback() {
    // Return the legendary 2.47 if everything fails
    return {
        chapterName: "কর্মযোগ (২য় অধ্যায়)",
        verse: "২.৪৭",
        sanskrit: "কর্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন। মা কর্মফলহেতুর্ভুর্মা তে সঙ্গোঽস্ত্বাকর্মণি॥",
        meaning_bn: "তোমার অধিকার কেবল কর্মে, ফলে নয়। ফলের আকাঙ্ক্ষা নিয়ে কাজ করো না, আবার কর্মত্যাগেও আসক্ত হয়ো না।",
        insight: "সাফল্য বা ব্যর্থতার চিন্তা না করে নিজের সেরাটা দিয়ে কাজ করে যাওয়াই সাফল্যের প্রকৃত চাবিকাঠি।",
        ai: false
    };
}

/* ==========================
   WARM CACHE
   ========================== */

async function warmUpAICache() {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const now = new Date();
    const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    logDebug(`Warming up all caches for ${dateStr}...`);

    // Get the sequential verse for warm-up
    const { getDailyGitaVerse } = require('./gitaUtils');
    const baseVerse = getDailyGitaVerse(now);

    try {
        // Run sequentially to avoid 429 "Too Many Requests"
        await getAIImportance(dateStr);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
        await getAIGitaVerse(dateStr, baseVerse);
        logDebug("Warmup complete.");
    } catch (e) {
        logDebug("Warmup failed partially: " + e.message);
    }
}

module.exports = {
    getAIImportance,
    getAIGitaVerse,
    warmUpAICache,
    callGeminiAdvanced,
};
