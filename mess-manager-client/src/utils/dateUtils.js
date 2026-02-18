
/**
 * Calculates the number of days until the next birthday and check if it's today.
 * @param {string|Date} dateOfBirth - The date of birth.
 * @returns {object} - { isToday: boolean, daysLeft: number }
 */
export const getBirthdayStatus = (dateOfBirth) => {
    if (!dateOfBirth) return { isToday: false, daysLeft: -1 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dob = new Date(dateOfBirth);
    const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    birthdayThisYear.setHours(0, 0, 0, 0);

    let nextBirthday = birthdayThisYear;

    if (today > birthdayThisYear) {
        nextBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
    }

    const diffTime = nextBirthday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isToday = today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();

    return {
        isToday,
        daysLeft: isToday ? 0 : diffDays
    };
};
