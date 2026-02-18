import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { getDailyInfo } from '../utils/dailyUtils';

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
    const { isAuthenticated } = useAuth();

    // Fetch Initial Data
    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
        }
    }, [isAuthenticated]);

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

    // Admin Actions
    const addMember = async (member) => {
        try {
            console.log('Adding member:', member);
            await api.post('/members', member);
            console.log('Member added, refreshing data...');
            await refreshData();
            console.log('Data refreshed.');
        } catch (error) {
            console.error('Add Member failed:', error);
        }
    };

    const removeMember = async (id) => {
        try {
            await api.delete(`/members/${id}`);
            refreshData(); // Or optimistically update
            setMembers(prev => prev.filter(m => m._id !== id && m.id !== id)); // Handle both _id and id (backend uses _id)
        } catch (error) {
            console.error('Remove member failed', error);
        }
    };

    const updateMember = async (id, updates) => {
        try {
            await api.put(`/members/${id}`, updates);
            refreshData();
        } catch (error) {
            console.error('Update Member failed:', error);
        }
    };

    // Notification Logic (Backend Hybrid)
    // We send to backend, but we also want UI to update instantly if possible.
    const sendNotification = async (userId, message) => {
        try {
            await api.post('/notifications', { userId, message, type: 'general' });
            // Ideally we re-fetch notifications if the current user needs to see them
        } catch (error) {
            console.error('Send Notification failed', error);
        }
    };

    // Send Payment Notifications to All Members
    const sendPaymentNotifications = async (members) => {
        try {
            const response = await api.post('/notifications/payment/bulk', { members });
            await refreshData();
            return { success: true, count: response.data.count };
        } catch (error) {
            console.error('Send Payment Notifications failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to send notifications' };
        }
    };

    // Send Official WhatsApp Notifications to Multiple Members
    const sendBulkWhatsAppOfficial = async (members) => {
        try {
            const response = await api.post('/notifications/whatsapp/official/bulk', { members });
            return { success: true, results: response.data.results };
        } catch (error) {
            console.error('Official WhatsApp Notifications failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to send bulk WhatsApp messages' };
        }
    };

    // Mark Payment as Paid
    const markPaymentAsPaid = async (notificationId) => {
        try {
            await api.put(`/notifications/payment/${notificationId}/mark-paid`);
            await refreshData();
            return { success: true };
        } catch (error) {
            console.error('Mark payment as paid failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to mark payment' };
        }
    };

    const updateNotification = async (id, updates) => {
        try {
            await api.put(`/notifications/${id}`, updates);
            // We need to update local state if we are tracking it. 
            // Since we moved notifications fetching to components/AuthContext mostly, 
            // we expose a way to update it.
            setNotifications(prev => prev.map(n => n.id === id || n._id === id ? { ...n, ...updates } : n));
        } catch (error) {
            console.error('Update Notification failed', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
        } catch (error) {
            console.error('Delete Notification failed', error);
        }
    };

    const markAllAsRead = async (userId) => {
        try {
            await api.put(`/notifications/mark-read/${userId}`);
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                (n.userId === userId || n.userId === 'all') ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Mark read failed', error);
        }
    };


    // Member Actions
    const addExpense = async (expense) => {
        try {
            const response = await api.post('/expenses', expense);
            await refreshData();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Add Expense failed', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to add expense';
            return { success: false, error: errorMessage };
        }
    };


    const approveExpense = async (id) => {
        try {
            await api.put(`/expenses/${id}`, { status: 'approved' });
            refreshData();
        } catch (error) {
            console.error('Approve Expense failed', error);
        }
    };

    const approveAllExpenses = async () => {
        try {
            const response = await api.put('/expenses/approve-all');
            await refreshData();
            return { success: true, modifiedCount: response.data.modifiedCount };
        } catch (error) {
            console.error('Approve all expenses failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to approve all expenses' };
        }
    };


    const rejectExpense = async (id) => {
        try {
            await api.put(`/expenses/${id}`, { status: 'rejected' });
            refreshData();
        } catch (error) {
            console.error('Reject Expense failed', error);
        }
    };

    const updateExpense = async (id, updatedData) => {
        try {
            await api.put(`/expenses/${id}`, updatedData);
            refreshData();
        } catch (error) {
            console.error('Update Expense failed', error);
        }
    };

    const deleteExpense = async (id) => {
        try {
            await api.delete(`/expenses/${id}`);
            await refreshData();
        } catch (error) {
            console.error('Delete Expense failed', error);
        }
    };

    const clearAllAdminExpenses = async (password) => {
        try {
            const response = await api.delete('/expenses/admin/clear-all', {
                data: { password }
            });
            await refreshData();
            return { success: true, deletedCount: response.data.deletedCount };
        } catch (error) {
            console.error('Clear all expenses failed', error);
            return { success: false, error: error.response?.data?.message || 'Failed to clear expenses' };
        }
    };

    // Market Actions
    const allocateMarketDay = async (date, memberId, type = 'manual_assign', managerId = null) => {
        try {
            await api.post('/market', {
                date,
                assignedMemberId: memberId,
                requestType: type,
                managerId
            });
            refreshData();
            // Notify Member? Backend could handle this trigger.
        } catch (error) {
            console.error('Allocate market failed', error);
        }
    };

    // Request Market Day (Member)
    // Logic: Request -> Pending. 
    // Previous logic was: allocateMarketDay handles both. Let's keep signature or separate?
    // User click calls `allocateMarketDay` in Market.jsx. 
    // If it's a request, it should be distinct?
    // The UI uses `allocateMarketDay` for both. I'll modify logic to detect context or just simpler api call.
    // Actually, `allocateMarketDay` in previous DataContext handled request logic too.
    // I will make `allocateMarketDay` strictly about assignment/request logic.
    // I need to know WHO is calling it? Market.jsx knows.
    // I will rename this to `requestOrAssignMarket`. But to avoid breaking UI, I keep name.
    // But wait, the backend route `POST /market` handles upsert.
    // If Admin calls, status=approved. If Member calls, status=pending.
    // How do we know? We don't send token yet. 
    // Temporary Hack: Send `role` or `requestType` in body.
    // UI doesn't pass role here.
    // I'll update it to just send `requestType: 'request'` if it's a request.
    // But `Market.jsx` isn't updated yet.
    // I'll stick to Default behavior: `allocateMarketDay` = `request`. 
    // I'll add a separate `assignMarketDay` if needed, or check `date` logic.

    // Actually, let's look at Market.jsx usage. It calls `allocateMarketDay(date, user.id)`.
    // So it's mostly member making requests.
    // If Admin assigns, it might be different.
    // I'll treat it as a request if status isn't passed.
    // The previous code had complex logic.
    // I'll simplify: Call API, let backend set default status.

    // Also, we need notify admin logic. Backend can handle logic if we improve it, 
    // but for now, I'll send a notification manually here to match previous behavior if needed.
    // But previous behavior: `setNotifications` (admin).

    // I'll assume standard flow:
    // Member clicks -> allocateMarketDay -> POST /market (requestType='request')
    // Admin clicks Approve -> PUT /market/:date (status='approved')

    // I'll keep the function signature.

    const approveMarketRequest = async (date, shouldRefresh = true) => {
        try {
            await api.put(`/market/${date}`, { status: 'approved' });
            if (shouldRefresh) refreshData();
        } catch (error) {
            console.error('Approve market failed', error);
        }
    };

    const rejectMarketRequest = async (date, shouldRefresh = true) => {
        // Backend doesn't delete, it sets status=rejected? Or deletes?
        // Previous logic: filter out (delete).
        // I'll delete or set status. Let's set status 'rejected' for record, or delete if "cancel".
        // Use PUT status='rejected'.
        try {
            await api.put(`/market/${date}`, { status: 'rejected' });
            if (shouldRefresh) refreshData();
        } catch (error) {
            console.error('Reject market failed', error);
        }
    };

    const setManagerForMonth = (month, memberId) => {
        setManagerAllocation(prev => ({ ...prev, [month]: memberId }));
    };

    const markCookingFinished = (date, memberId) => {
        setCookingDuties(prev => [...prev, { date, memberId, finished: true }]);
    };

    const getCookingDuty = (date) => cookingDuties.find(d => d.date === date);

    // Meal Mock
    const addMeal = async (date, memberIds, type, isGuest = false, guestMealType = null, mealTime = null) => {
        try {
            // Support single member addition as per usage
            for (const memberId of memberIds) {
                const payload = { date, memberId, type };
                if (isGuest) {
                    payload.isGuest = true;
                    payload.guestMealType = guestMealType;
                    payload.mealTime = mealTime;
                }
                await api.post('/meals', payload);
            }
            refreshData();
        } catch (error) {
            console.error('Add meal failed', error);
        }
    };

    const removeMeal = async (date, memberId, type, mealId = null) => {
        try {
            const payload = { date, memberId, type };
            if (mealId) {
                payload.mealId = mealId;
            }
            await api.delete('/meals', { data: payload });
            refreshData();
        } catch (error) {
            console.error('Remove meal failed', error);
        }
    };

    // Guest Meal Functions
    const addGuestMeal = async (date, memberId, guestMealType, mealTime) => {
        try {
            const payload = { date, memberId, guestMealType, mealTime };
            await api.post('/guest-meals', payload);
            await refreshData(); // Fixed: await refreshData
        } catch (error) {
            console.error('Add guest meal failed', error);
            throw error;
        }
    };

    const removeGuestMeal = async (guestMealId) => {
        try {
            await api.delete(`/guest-meals/${guestMealId}`);
            await refreshData(); // Fixed: await refreshData
        } catch (error) {
            console.error('Remove guest meal failed', error);
        }
    };

    const clearAllGuestMeals = async (password) => {
        try {
            const response = await api.delete('/guest-meals/clear-all/confirm', {
                data: { password }
            });
            await refreshData();
            return { success: true, deletedCount: response.data.deletedCount };
        } catch (error) {
            console.error('Clear all guest meals failed', error);
            return { success: false, error: error.response?.data?.error || 'Failed to clear guest meals' };
        }
    };

    const clearAllMeals = async (password) => {
        try {
            const response = await api.delete('/meals/clear-all-meals', {
                data: { password }
            });
            await refreshData();
            return {
                success: true,
                deletedCount: response.data.deletedCount,
                message: response.data.message
            };
        } catch (error) {
            console.error('Clear all meals failed', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to clear meals'
            };
        }
    };


    const contextValue = useMemo(() => ({
        members,
        expenses,
        meals,
        guestMeals,
        notifications,
        marketSchedule,
        managerAllocation,
        cookingDuties,
        addMember,
        removeMember,
        updateMember,
        addMeal,
        removeMeal,
        addGuestMeal,
        removeGuestMeal,
        clearAllGuestMeals,
        clearAllMeals,
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
        clearAllAdminExpenses,
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
        members, expenses, meals, guestMeals, notifications, marketSchedule,
        managerAllocation, cookingDuties, dailyInfo, loadingDaily, refreshData,
        addMember, removeMember, updateMember, addMeal, removeMeal, addGuestMeal,
        removeGuestMeal, clearAllGuestMeals, clearAllMeals, sendNotification,
        sendPaymentNotifications, markPaymentAsPaid, updateNotification,
        deleteNotification, markAllAsRead, addExpense, approveExpense,
        approveAllExpenses, rejectExpense, updateExpense, deleteExpense,
        clearAllAdminExpenses, allocateMarketDay, approveMarketRequest,
        rejectMarketRequest, setManagerForMonth, markCookingFinished, getCookingDuty,
        sendBulkWhatsAppOfficial
    ]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};
