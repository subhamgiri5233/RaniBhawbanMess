import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In a real app, you would use an environment variable or config. 
// For Expo local development on device, use your computer's local network IP.
// Make sure this matches your Node backend's host network IP (not localhost for physical devices).
const API_URL = 'http://192.168.1.16:5000/api';

const client = axios.create({
    baseURL: API_URL,
});

client.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default client;
