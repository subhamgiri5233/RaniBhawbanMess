import api from '../lib/api';

/**
 * Gets the Gita verse for the current day from the backend.
 * @returns {Promise<Object>} - Promise resolving to object containing chapter name, verse number, sanskrit, and meaning.
 */
export async function getDailyGitaVerse() {
    try {
        const response = await api.get('/gita/daily');
        return response.data;
    } catch (error) {
        console.error('Error fetching daily Gita verse:', error);
        // Return a fallback verse or null
        return null;
    }
}
