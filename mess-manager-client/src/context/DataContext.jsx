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

export const DataProvider = ({ children }) => {
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [meals, setMeals] = useState([]);
    const [guestMeals, setGuestMeals] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [marketSchedule, setMarketSchedule] = useState({}); // { 'YYYY-MM': [ { date, memberId, status } ] }
    const [managerAllocation, setManagerAllocation] = useState({});
    const [cookingDuties, setCookingDuties] = useState([]);
    const [dailyInfo, setDailyInfo] = useState(null);
    const [loadingDaily, setLoadingDaily] = useState(true);

    // Global Month Filter
    const [globalMonth, setGlobalMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const { isAuthenticated } = useAuth();

    const refreshData = useCallback(async () => {
        try {
            const results = await Promise.allSettled([
                api.get('/members'),
                api.get('/expenses'),
                api.get('/market'),
                api.get('/meals'),
                api.get('/guest-meals'),
                api.get('/notifications'),
                getDailyInfo()
            ]);

            const [membersRes, expensesRes, marketRes, mealsRes, guestMealsRes, notificationsRes, dailyRes] = results;

            if (membersRes.status === 'fulfilled') setMembers(membersRes.value.data);
            if (expensesRes.status === 'fulfilled') setExpenses(expensesRes.value.data);
            if (mealsRes.status === 'fulfilled') setMeals(mealsRes.value.data);
            if (guestMealsRes.status === 'fulfilled') setGuestMeals(guestMealsRes.value.data);
            if (notificationsRes.status === 'fulfilled') setNotifications(notificationsRes.value.data);
            if (dailyRes.status === 'fulfilled') setDailyInfo(dailyRes.value);
            setLoadingDaily(false);

            if (marketRes.status === 'fulfilled') {
                const marketMap = {};
                marketRes.value.data.forEach(item => {
                    const month = item.date.substring(0, 7);
                    if (!marketMap[month]) marketMap[month] = [];
                    marketMap[month].push(item);
                });
                setMarketSchedule(marketMap);
            }

            // Log errors if any
            results.forEach((res, index) => {
                if (res.status === 'rejected') {
                    console.error(`Refresh failed for index ${index}:`, res.reason);
                }
            });

        } catch (e) {
            console.error('Refresh critically failed', e);
        }
    }, []);

    // Fetch Initial Data
    useEffect(() => {
        if (isAuthenticated) {
            const loadData = async () => {
                await refreshData();
            };
            loadData();
        }
    }, [isAuthenticated, refreshData]);

    // --- Targeted re-fetch helpers (more efficient than full refreshData) ---
    const refreshMembers = useCallback(async () => {
        try { const r = await api.get('/members'); setMembers(r.data); } catch (e) { console.error('refreshMembers failed', e); }
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
            await api.post('/members', member);
            await refreshMembers();
        } catch (error) {
            console.error('Add Member failed:', error);
        }
    }, [refreshMembers]);

    const removeMember = useCallback(async (id) => {
        try {
            await api.delete(`/members/${id}`);
            setMembers(prev => prev.filter(m => m._id !== id && m.id !== id));
        } catch (error) {
            console.error('Remove member failed', error);
        }
    }, []);

    const updateMember = useCallback(async (id, updates) => {
        try {
            await api.put(`/members/${id}`, updates);
            await refreshMembers();
        } catch (error) {
            console.error('Update Member failed:', error);
        }
    }, [refreshMembers]);

    // Notification Logic
    const sendNotification = useCallback(async (userId, message) => {
        try {
            await api.post('/notifications', { userId, message, type: 'general' });
        } catch (error) {
            console.error('Send Notification failed', error);
        }
    }, []);

    // Send Payment Notifications to All Members
    const sendPaymentNotifications = useCallback(async (members) => {
        try {
            const response = await api.post('/notifications/payment/bulk', { members });
            await refreshNotifications();
            return { success: true, count: response.data.count };
        } catch (error) {
            console.error('Send Payment Notifications failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to send notifications' };
        }
    }, [refreshNotifications]);

    // Send Official WhatsApp Notifications to Multiple Members
    const sendBulkWhatsAppOfficial = useCallback(async (members) => {
        try {
            const response = await api.post('/notifications/whatsapp/official/bulk', { members });
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
            await refreshExpenses();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Add Expense failed', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to add expense';
            return { success: false, error: errorMessage };
        }
    }, [refreshExpenses]);

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
            await refreshExpenses();
            return { success: true, modifiedCount: response.data.modifiedCount };
        } catch (error) {
            console.error('Approve all expenses failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to approve all expenses' };
        }
    }, [refreshExpenses]);

    const rejectExpense = useCallback(async (id) => {
        try {
            await api.put(`/expenses/${id}`, { status: 'rejected' });
            setExpenses(prev => prev.map(e => (e._id === id || e.id === id) ? { ...e, status: 'rejected' } : e));
        } catch (error) {
            console.error('Reject Expense failed', error);
        }
    }, []);

    const updateExpense = useCallback(async (id, updatedData) => {
        try {
            await api.put(`/expenses/${id}`, updatedData);
            await refreshExpenses();
        } catch (error) {
            console.error('Update Expense failed', error);
        }
    }, [refreshExpenses]);

    const deleteExpense = useCallback(async (id) => {
        try {
            await api.delete(`/expenses/${id}`);
            setExpenses(prev => prev.filter(e => e._id !== id && e.id !== id));
        } catch (error) {
            console.error('Delete Expense failed', error);
        }
    }, []);

    // Market Actions
    const allocateMarketDay = useCallback(async (date, memberId, type = 'manual_assign', managerId = null) => {
        try {
            await api.post('/market', { date, assignedMemberId: memberId, requestType: type, managerId });
            await refreshMarket();
        } catch (error) {
            console.error('Allocate market failed', error);
        }
    }, [refreshMarket]);

    const approveMarketRequest = useCallback(async (idOrDate, shouldRefresh = true) => {
        try {
            const isId = !idOrDate.includes('-') || idOrDate.length > 10;
            const endpoint = isId ? `/market/id/${idOrDate}` : `/market/${idOrDate}`;
            await api.put(endpoint, { status: 'approved' });
            if (shouldRefresh) await refreshMarket();
        } catch (error) {
            console.error('Approve market failed', error);
        }
    }, [refreshMarket]);

    const rejectMarketRequest = useCallback(async (idOrDate, shouldRefresh = true) => {
        try {
            const isId = !idOrDate.includes('-') || idOrDate.length > 10;
            const endpoint = isId ? `/market/id/${idOrDate}` : `/market/${idOrDate}`;
            await api.put(endpoint, { status: 'rejected' });
            if (shouldRefresh) await refreshMarket();
        } catch (error) {
            console.error('Reject market failed', error);
        }
    }, [refreshMarket]);

    const setManagerForMonth = useCallback((month, memberId) => {
        setManagerAllocation(prev => ({ ...prev, [month]: memberId }));
    }, []);

    const markCookingFinished = useCallback((date, memberId) => {
        setCookingDuties(prev => [...prev, { date, memberId, finished: true }]);
    }, []);

    const getCookingDuty = useCallback((date) => cookingDuties.find(d => d.date === date), [cookingDuties]);

    // Meal Actions
    const addMeal = useCallback(async (date, memberIds, type, isGuest = false, guestMealType = null, mealTime = null) => {
        try {
            for (const memberId of memberIds) {
                const payload = { date, memberId, type };
                if (isGuest) { payload.isGuest = true; payload.guestMealType = guestMealType; payload.mealTime = mealTime; }
                await api.post('/meals', payload);
            }
            await refreshMeals();
        } catch (error) {
            console.error('Add meal failed', error);
        }
    }, [refreshMeals]);

    const removeMeal = useCallback(async (date, memberId, type, mealId = null) => {
        try {
            const payload = { date, memberId, type };
            if (mealId) payload.mealId = mealId;
            await api.delete('/meals', { data: payload });
            await refreshMeals();
        } catch (error) {
            console.error('Remove meal failed', error);
        }
    }, [refreshMeals]);

    // Guest Meal Functions
    const addGuestMeal = useCallback(async (date, memberId, guestMealType, mealTime) => {
        try {
            const amount = MESS_CONFIG.GUEST_CONFIG.PRICES[guestMealType] || 0;
            await api.post('/guest-meals', { date, memberId, guestMealType, mealTime, amount });
            await refreshGuestMeals();
        } catch (error) {
            console.error('Add guest meal failed', error);
            throw error;
        }
    }, [refreshGuestMeals]);

    const removeGuestMeal = useCallback(async (guestMealId) => {
        try {
            await api.delete(`/guest-meals/${guestMealId}`);
            await refreshGuestMeals();
        } catch (error) {
            console.error('Remove guest meal failed', error);
        }
    }, [refreshGuestMeals]);

    const clearMonthlyData = useCallback(async (month, password) => {
        try {
            const response = await api.delete('/admin/clear-month', { data: { month, password } });
            await refreshData();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Clear monthly data failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to clear monthly data' };
        }
    }, [refreshData]);

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
        allExpenses: expenses, // Keep raw data just in case
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
        loadingDaily,
        sendBulkWhatsAppOfficial
    }), [
        members, expenses, filteredExpenses, meals, filteredMeals, guestMeals, filteredGuestMeals,
        globalMonth, setGlobalMonth, notifications, marketSchedule,
        managerAllocation, cookingDuties, clearMonthlyData, getMonthlyDataPreview, dailyInfo, loadingDaily, refreshData,
        addMember, removeMember, updateMember, addMeal, removeMeal, addGuestMeal,
        removeGuestMeal, sendNotification,
        sendPaymentNotifications, markPaymentAsPaid, updateNotification,
        deleteNotification, markAllAsRead, addExpense, approveExpense,
        approveAllExpenses, rejectExpense, updateExpense, deleteExpense,
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
