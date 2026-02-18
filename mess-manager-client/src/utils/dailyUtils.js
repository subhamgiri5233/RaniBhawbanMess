import api from '../lib/api';

/**
 * Fetches the combined daily info (Gita + Special Occasions + Effects) from the backend.
 * Implements localStorage caching to prevent redundant calls on refresh.
 * @returns {Promise<Object>} - The combined daily info or null on error.
 */
export async function getDailyInfo() {
    const CACHE_KEY = 'mess_daily_info';
    const today = new Date().toDateString();

    try {
        // 1. Check Cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.date === today) {
                    console.log('Serving daily info from cache');
                    return parsed.data;
                }
            } catch (e) {
                console.warn('Malformed daily info cache, clearing...');
                localStorage.removeItem(CACHE_KEY);
            }
        }

        // 2. Fetch Fresh Data
        const response = await api.get('/daily/info');

        if (response.data) {
            // 3. Update Cache
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                date: today,
                data: response.data
            }));
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching combined daily info:', error);
        return null;
    }
}
