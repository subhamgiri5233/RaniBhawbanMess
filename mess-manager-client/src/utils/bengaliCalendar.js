// Bengali Calendar Utility Functions
// Converts Gregorian dates to Bengali calendar dates

/**
 * Bengali calendar months
 * The Bengali year starts on April 15th (or April 14th in leap years)
 */
const bengaliMonths = [
    'বৈশাখ',    // Boishakh (mid-April to mid-May)
    'জ্যৈষ্ঠ',   // Jyoishtho (mid-May to mid-June)
    'আষাঢ়',     // Asharh (mid-June to mid-July)
    'শ্রাবণ',    // Shraban (mid-July to mid-August)
    'ভাদ্র',     // Bhadro (mid-August to mid-September)
    'আশ্বিন',    // Ashwin (mid-September to mid-October)
    'কার্তিক',   // Kartik (mid-October to mid-November)
    'অগ্রহায়ণ',  // Agrohayon (mid-November to mid-December)
    'পৌষ',       // Poush (mid-December to mid-January)
    'মাঘ',        // Magh (mid-January to mid-February)
    'ফাল্গুন',   // Falgun (mid-February to mid-March)
    'চৈত্র'      // Choitro (mid-March to mid-April)
];

/**
 * Bengali day names
 */
const bengaliDays = [
    'রবিবার',    // Robibar (Sunday)
    'সোমবার',    // Shombar (Monday)
    'মঙ্গলবার',  // Mongolbar (Tuesday)
    'বুধবার',    // Budhbar (Wednesday)
    'বৃহস্পতিবার', // Brihoshpotibar (Thursday)
    'শুক্রবার',  // Shukrobar (Friday)
    'শনিবার'     // Shonibar (Saturday)
];

/**
 * Convert Bengali numerals to Bengali script
 */
const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num) {
    return String(num)
        .split('')
        .map(digit => bengaliNumerals[parseInt(digit)] || digit)
        .join('');
}

/**
 * Convert a Gregorian date to Bengali calendar date
 * The Bengali calendar (revised) starts on April 14/15
 */
export function gregorianToBengali(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const day = date.getDate();

    // Bengali year starts on April 14/15
    // If we're before April 14, we're still in the previous Bengali year
    let bengaliYear;
    let bengaliMonth;
    let bengaliDay;

    // Determine if it's a leap year
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const bengaliNewYearDay = isLeapYear ? 14 : 14; // April 14 in both cases for simplicity

    // Calculate Bengali year (Bengali year = Gregorian year - 593)
    if (month < 3 || (month === 3 && day < bengaliNewYearDay)) {
        bengaliYear = year - 594;
    } else {
        bengaliYear = year - 593;
    }

    // Month and day calculation
    // Simplified algorithm based on the revised Bengali calendar
    const monthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30]; // Days in each Bengali month

    // Create a reference date for Bengali new year
    const bengaliNewYear = new Date(year, 3, bengaliNewYearDay); // April 14/15

    if (date < bengaliNewYear) {
        // We're in the previous Bengali year
        const prevYearNewYear = new Date(year - 1, 3, bengaliNewYearDay);
        const daysDiff = Math.floor((date - prevYearNewYear) / (1000 * 60 * 60 * 24));

        let totalDays = daysDiff;
        bengaliMonth = 0;

        for (let i = 0; i < monthDays.length; i++) {
            if (totalDays < monthDays[i]) {
                bengaliMonth = i;
                bengaliDay = totalDays + 1;
                break;
            }
            totalDays -= monthDays[i];
        }
    } else {
        // We're in the current Bengali year
        const daysDiff = Math.floor((date - bengaliNewYear) / (1000 * 60 * 60 * 24));

        let totalDays = daysDiff;
        bengaliMonth = 0;

        for (let i = 0; i < monthDays.length; i++) {
            if (totalDays < monthDays[i]) {
                bengaliMonth = i;
                bengaliDay = totalDays + 1;
                break;
            }
            totalDays -= monthDays[i];
        }
    }

    return {
        year: bengaliYear,
        month: bengaliMonth,
        day: bengaliDay,
        monthName: bengaliMonths[bengaliMonth],
        dayName: bengaliDays[date.getDay()],
        yearBengali: toBengaliNumber(bengaliYear),
        dayBengali: toBengaliNumber(bengaliDay)
    };
}

/**
 * Format Bengali date as a string
 */
export function formatBengaliDate(date) {
    const bengali = gregorianToBengali(date);
    return {
        full: `${bengali.dayBengali} ${bengali.monthName}, ${bengali.yearBengali}`,
        day: bengali.dayName,
        date: bengali.dayBengali,
        month: bengali.monthName,
        year: bengali.yearBengali
    };
}
