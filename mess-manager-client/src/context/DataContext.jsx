import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { getDailyInfo } from '../utils/dailyUtils';
import { MESS_CONFIG } from '../config';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// Helper for hydration from localStorage
const hydrateFromStorage = (key, fallback) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
        console.error(`Failed to hydrate ${key}:`, e);
        return fallback;
    }
};

export const DataProvider = ({ children }) => {
    // Hydrate critical data from localStorage for near-instant rendering
    const [members, setMembers] = useState(() => hydrateFromStorage('mess_members', []));
    const [settings, setSettings] = useState(() => hydrateFromStorage('mess_settings', []));
    const [dailyInfo, setDailyInfo] = useState(() => hydrateFromStorage('mess_daily_info', null));

    // Fast-changing data is kept in state but not pre-hydrated for better consistency
    const [expenses, setExpenses] = useState([]);
    const [meals, setMeals] = useState([]);
    const [guestMeals, setGuestMeals] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [marketSchedule, setMarketSchedule] = useState({});
    const [managerAllocation, setManagerAllocation] = useState({});
    const [cookingDuties, setCookingDuties] = useState([]);
    const [loadingDaily, setLoadingDaily] = useState(true);

    // Global Month Filter
    const [globalMonth, setGlobalMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const { isAuthenticated } = useAuth();

    const refreshData = useCallback(async () => {
        // Track the count of critical requests completed
        let criticalCompleted = 0;
        const totalCritical = 3; // members, settings, dailyInfo

        const markCritical = () => {
            criticalCompleted++;
            if (criticalCompleted >= totalCritical) {
                setLoadingDaily(false);
            }
        };

        // Helper to fetch one endpoint and update state + storage instantly
        const fetchEndpoint = async (promise, setter, storageKey = null, isCritical = false) => {
            try {
                const res = await promise;
                const data = res.data || res; // Handle cases where res is not an axios response (like getDailyInfo)
                setter(data);
                if (storageKey) localStorage.setItem(storageKey, JSON.stringify(data));
                if (isCritical) markCritical();
            } catch (e) {
                console.error(`Refresh failed for ${storageKey || 'endpoint'}:`, e);
                if (isCritical) markCritical();
            }
        };

        // Fire all requests simultaneously. Each will update state as soon as it resolves.
        // This is much faster than waiting for all of them using Promise.allSettled.
        fetchEndpoint(api.get('/members'), setMembers, 'mess_members', true);
        fetchEndpoint(api.get('/settings'), setSettings, 'mess_settings', true);
        fetchEndpoint(getDailyInfo(), setDailyInfo, 'mess_daily_info', true);

        fetchEndpoint(api.get('/expenses'), setExpenses);
        fetchEndpoint(api.get('/meals'), setMeals);
        fetchEndpoint(api.get('/guest-meals'), setGuestMeals);
        fetchEndpoint(api.get('/notifications'), setNotifications);
        
        // Market logic needs special handling for mapping
        (async () => {
            try {
                const res = await api.get('/market');
                const marketMap = {};
                res.data.forEach(item => {
                    const month = item.date.substring(0, 7);
                    if (!marketMap[month]) marketMap[month] = [];
                    marketMap[month].push(item);
                });
                setMarketSchedule(marketMap);
            } catch (e) { console.error('Market fetch failed', e); }
        })();

    }, []);

    // Fetch Initial Data
    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
        } else {
            setLoadingDaily(true); // Reset for next login
        }
    }, [isAuthenticated, refreshData]);

    // --- Targeted re-fetch helpers (more efficient than full refreshData) ---
    const refreshMembers = useCallback(async () => {
        try { 
            const r = await api.get('/members'); 
            setMembers(r.data);
            localStorage.setItem('mess_members', JSON.stringify(r.data));
        } catch (e) { console.error('refreshMembers failed', e); }
    }, []);
    const refreshExpenses = useCallback(async () => {
        try { const r = await api.get('/expenses'); setExpenses(r.data); } catch (e) { console.error('refreshExpenses failed', e); }
    }, []);
    const refreshMarket = useCallback(async () => {
        try {
            const r = await api.get('/market');
            const map = {};
            r.data.forEach(item => { const m = item.date.substring(0, 7); if (!map[m]) map[m] = []; map[m].push(item); });
            setMarketSchedule(map);
        } catch (e) { console.error('refreshMarket failed', e); }
    }, []);
    const refreshMeals = useCallback(async () => {
        try { const r = await api.get('/meals'); setMeals(r.data); } catch (e) { console.error('refreshMeals failed', e); }
    }, []);
    const refreshGuestMeals = useCallback(async () => {
        try { const r = await api.get('/guest-meals'); setGuestMeals(r.data); } catch (e) { console.error('refreshGuestMeals failed', e); }
    }, []);
    const refreshNotifications = useCallback(async () => {
        try { const r = await api.get('/notifications'); setNotifications(r.data); } catch (e) { console.error('refreshNotifications failed', e); }
    }, []);

    // Admin Actions
    const addMember = useCallback(async (member) => {
        try {
            const response = await api.post('/members', member);
            setMembers(prev => [...prev, response.data]);
            localStorage.setItem('mess_members', JSON.stringify([...members, response.data]));
        } catch (error) {
            console.error('Add Member failed:', error);
        }
    }, [members]);

    const removeMember = useCallback(async (id) => {
        try {
            await api.delete(`/members/${id}`);
            setMembers(prev => {
                const updated = prev.filter(m => m._id !== id && m.id !== id);
                localStorage.setItem('mess_members', JSON.stringify(updated));
                return updated;
            });
        } catch (error) {
            console.error('Remove member failed', error);
        }
    }, []);

    const updateMember = useCallback(async (id, updates) => {
        try {
            const response = await api.put(`/members/${id}`, updates);
            setMembers(prev => {
                const updated = prev.map(m => (m._id === id || m.id === id) ? response.data : m);
                localStorage.setItem('mess_members', JSON.stringify(updated));
                return updated;
            });
        } catch (error) {
            console.error('Update Member failed:', error);
        }
    }, []);

    // Notification Logic
    const sendNotification = useCallback(async (userId, message) => {
        try {
            await api.post('/notifications', { userId, message, type: 'general' });
        } catch (error) {
            console.error('Send Notification failed', error);
        }
    }, []);

    // Send Payment Notifications to All Members
    const sendPaymentNotifications = useCallback(async (membersToNotify) => {
        try {
            const response = await api.post('/notifications/payment/bulk', { members: membersToNotify });
            await refreshNotifications();
            return { success: true, count: response.data.count };
        } catch (error) {
            console.error('Send Payment Notifications failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to send notifications' };
        }
    }, [refreshNotifications]);

    // Send Official WhatsApp Notifications to Multiple Members
    const sendBulkWhatsAppOfficial = useCallback(async (membersToNotify) => {
        try {
            const response = await api.post('/notifications/whatsapp/official/bulk', { members: membersToNotify });
            return { success: true, results: response.data.results };
        } catch (error) {
            console.error('Official WhatsApp Notifications failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to send bulk WhatsApp messages' };
        }
    }, []);

    // Mark Payment as Paid
    const markPaymentAsPaid = useCallback(async (notificationId) => {
        try {
            await api.put(`/notifications/payment/${notificationId}/mark-paid`);
            await refreshNotifications();
            return { success: true };
        } catch (error) {
            console.error('Mark payment as paid failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to mark payment' };
        }
    }, [refreshNotifications]);

    const updateNotification = useCallback(async (id, updates) => {
        try {
            await api.put(`/notifications/${id}`, updates);
            setNotifications(prev => prev.map(n => n.id === id || n._id === id ? { ...n, ...updates } : n));
        } catch (error) {
            console.error('Update Notification failed', error);
        }
    }, []);

    const deleteNotification = useCallback(async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
        } catch (error) {
            console.error('Delete Notification failed', error);
        }
    }, []);

    const markAllAsRead = useCallback(async (userId) => {
        try {
            await api.put(`/notifications/mark-read/${userId}`);
            setNotifications(prev => prev.map(n =>
                (n.userId === userId || n.userId === 'all') ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Mark read failed', error);
        }
    }, []);

    // Expense Actions
    const addExpense = useCallback(async (expense) => {
        try {
            const response = await api.post('/expenses', expense);
            setExpenses(prev => [...prev, response.data]);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Add Expense failed', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to add expense';
            return { success: false, error: errorMessage };
        }
    }, []);

    const approveExpense = useCallback(async (id) => {
        try {
            await api.put(`/expenses/${id}`, { status: 'approved' });
            setExpenses(prev => prev.map(e => (e._id === id || e.id === id) ? { ...e, status: 'approved' } : e));
        } catch (error) {
            console.error('Approve Expense failed', error);
        }
    }, []);

    const approveAllExpenses = useCallback(async () => {
        try {
            const response = await api.put('/expenses/approve-all');
            setExpenses(prev => prev.map(e => e.status === 'pending' ? { ...e, status: 'approved' } : e));
            return { success: true, modifiedCount: response.data.modifiedCount };
        } catch (error) {
            console.error('Approve all expenses failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to approve all expenses' };
        }
    }, []);

    const rejectExpense = useCallback(async (id) => {
        try {
            await api.put(`/expenses/${id}`, { status: 'rejected' });
            setExpenses(prev => prev.map(e => (e._id === id || e.id === id) ? { ...e, status: 'rejected' } : e));
        } catch (error) {
            console.error('Reject Expense failed', error);
        }
    }, []);

    const rejectAllExpenses = useCallback(async () => {
        try {
            await api.put('/expenses/reject-all');
            setExpenses(prev => prev.map(e => e.status === 'pending' ? { ...e, status: 'rejected' } : e));
            return { success: true };
        } catch (error) {
            console.error('Reject all expenses failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to reject all expenses' };
        }
    }, []);

    const updateExpense = useCallback(async (id, updates) => {
        try {
            const response = await api.put(`/expenses/${id}`, updates);
            setExpenses(prev => prev.map(e => (e._id === id || e.id === id) ? response.data : e));
            return { success: true };
        } catch (error) {
            console.error('Update Expense failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to update expense' };
        }
    }, []);

    const deleteExpense = useCallback(async (id) => {
        try {
            await api.delete(`/expenses/${id}`);
            setExpenses(prev => prev.filter(e => e._id !== id && e.id !== id));
            return { success: true };
        } catch (error) {
            console.error('Delete Expense failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to delete expense' };
        }
    }, []);

    // Market Actions
    const allocateMarketDay = useCallback(async (date, memberId) => {
        try {
            await api.post('/market', { date, memberId });
            await refreshMarket();
        } catch (error) {
            console.error('Allocate market day failed', error);
        }
    }, [refreshMarket]);

    const approveMarketRequest = useCallback(async (requestId) => {
        try {
            await api.put(`/market/requests/${requestId}/approve`);
            await refreshMarket();
        } catch (error) {
            console.error('Approve market request failed', error);
        }
    }, [refreshMarket]);

    const rejectMarketRequest = useCallback(async (requestId) => {
        try {
            await api.put(`/market/requests/${requestId}/reject`);
            await refreshMarket();
        } catch (error) {
            console.error('Reject market request failed', error);
        }
    }, [refreshMarket]);

    // Manager Allocation
    const setManagerForMonth = useCallback(async (month, memberId) => {
        try {
            await api.post('/managers', { month, memberId });
            setManagerAllocation(prev => ({ ...prev, [month]: memberId }));
        } catch (error) {
            console.error('Set manager failed', error);
        }
    }, []);

    // Cooking Duties
    const markCookingFinished = useCallback(async (date, memberId) => {
        try {
            await api.post('/cooking/finish', { date, memberId });
            setCookingDuties(prev => [...prev, { date, memberId, finished: true }]);
        } catch (error) {
            console.error('Mark cooking finished failed', error);
        }
    }, []);

    const getCookingDuty = useCallback((date) => cookingDuties.find(d => d.date === date), [cookingDuties]);

    // Meal Actions
    const addMeal = useCallback(async (date, memberIds, type, isGuest = false, guestMealType = null, mealTime = null) => {
        try {
            const newMealsResult = [];
            for (const memberId of memberIds) {
                const payload = { date, memberId, type };
                if (isGuest) { payload.isGuest = true; payload.guestMealType = guestMealType; payload.mealTime = mealTime; }
                const response = await api.post('/meals', payload);
                newMealsResult.push(response.data);
            }
            setMeals(prev => [...prev, ...newMealsResult]);
        } catch (error) {
            console.error('Add meal failed', error);
        }
    }, []);

    const removeMeal = useCallback(async (date, memberId, type, mealId = null) => {
        try {
            const payload = { date, memberId, type };
            if (mealId) payload.mealId = mealId;
            await api.delete('/meals', { data: payload });
            setMeals(prev => {
                if (mealId) return prev.filter(m => m._id !== mealId && m.id !== mealId);
                const idx = prev.findIndex(m => m.date === date && m.memberId === memberId && m.type === type);
                if (idx === -1) return prev;
                return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
            });
        } catch (error) {
            console.error('Remove meal failed', error);
        }
    }, []);

    // Guest Meal Functions
    const addGuestMeal = useCallback(async (date, memberId, guestMealType, mealTime) => {
        try {
            const settingKey = `guest_price_${guestMealType}`;
            const dbSetting = settings.find(s => s.key === settingKey);
            const amount = dbSetting ? Number(dbSetting.value) : (MESS_CONFIG.GUEST_CONFIG.PRICES[guestMealType] || 0);

            const response = await api.post('/guest-meals', { date, memberId, guestMealType, mealTime, amount });
            setGuestMeals(prev => [...prev, response.data]);
        } catch (error) {
            console.error('Add guest meal failed', error);
            throw error;
        }
    }, [settings]);

    const removeGuestMeal = useCallback(async (guestMealId) => {
        try {
            await api.delete(`/guest-meals/${guestMealId}`);
            await refreshGuestMeals();
        } catch (error) {
            console.error('Remove guest meal failed', error);
        }
    }, [refreshGuestMeals]);

    const clearMonthlyData = useCallback(async (month, password, category = null) => {
        try {
            const response = await api.delete('/admin/clear-month', { data: { month, password, category } });
            await refreshData();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Clear monthly data failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to clear monthly data' };
        }
    }, [refreshData]);

    const updateSystemSetting = useCallback(async (key, value) => {
        try {
            await api.put(`/settings/${key}`, { value });
            setSettings(prev => {
                const updated = prev.map(s => s.key === key ? { ...s, value } : s);
                localStorage.setItem('mess_settings', JSON.stringify(updated));
                return updated;
            });
            return { success: true };
        } catch (error) {
            console.error('Update setting failed', error);
            return { success: false, error: error.response?.data?.message || 'Update failed' };
        }
    }, []);

    const getMonthlyDataPreview = useCallback(async (month) => {
        try {
            const response = await api.get(`/admin/clear-month/preview?month=${month}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get preview failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to fetch preview' };
        }
    }, []);

    const filteredExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return [];
        return expenses.filter(e => e.date?.startsWith(globalMonth));
    }, [expenses, globalMonth]);

    const filteredMeals = useMemo(() => {
        if (!Array.isArray(meals)) return [];
        return meals.filter(m => m.date?.startsWith(globalMonth));
    }, [meals, globalMonth]);

    const filteredGuestMeals = useMemo(() => {
        if (!Array.isArray(guestMeals)) return [];
        return guestMeals.filter(m => m.date?.startsWith(globalMonth));
    }, [guestMeals, globalMonth]);

    const contextValue = useMemo(() => ({
        members,
        expenses: filteredExpenses,
        meals: filteredMeals,
        guestMeals: filteredGuestMeals,
        allExpenses: expenses,
        allMeals: meals,
        allGuestMeals: guestMeals,
        globalMonth,
        setGlobalMonth,
        notifications,
        marketSchedule,
        managerAllocation,
        cookingDuties,
        clearMonthlyData,
        getMonthlyDataPreview,
        addMember,
        removeMember,
        updateMember,
        addMeal,
        removeMeal,
        addGuestMeal,
        removeGuestMeal,
        sendNotification,
        sendPaymentNotifications,
        markPaymentAsPaid,
        updateNotification,
        deleteNotification,
        markAllAsRead,
        addExpense,
        approveExpense,
        approveAllExpenses,
        rejectExpense,
        rejectAllExpenses,
        updateExpense,
        deleteExpense,
        allocateMarketDay,
        approveMarketRequest,
        rejectMarketRequest,
        setManagerForMonth,
        markCookingFinished,
        getCookingDuty,
        refreshData,
        dailyInfo,
        settings,
        updateSystemSetting,
        loadingDaily,
        sendBulkWhatsAppOfficial
    }), [
        members, expenses, filteredExpenses, meals, filteredMeals, guestMeals, filteredGuestMeals,
        globalMonth, setGlobalMonth, notifications, marketSchedule,
        managerAllocation, cookingDuties, clearMonthlyData, getMonthlyDataPreview, dailyInfo, settings, 
        updateSystemSetting, loadingDaily, refreshData,
        addMember, removeMember, updateMember, addMeal, removeMeal, addGuestMeal,
        removeGuestMeal, sendNotification,
        sendPaymentNotifications, markPaymentAsPaid, updateNotification,
        deleteNotification, markAllAsRead, addExpense, approveExpense,
        approveAllExpenses, rejectExpense, rejectAllExpenses, updateExpense, deleteExpense,
        allocateMarketDay, approveMarketRequest,
        rejectMarketRequest, setManagerForMonth, markCookingFinished, getCookingDuty,
        sendBulkWhatsAppOfficial
    ]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};
