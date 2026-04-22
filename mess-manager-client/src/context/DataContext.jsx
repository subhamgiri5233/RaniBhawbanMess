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

    // Transactional data hydrated from storage for instant "Recent" view
    const [expenses, setExpenses] = useState(() => hydrateFromStorage('mess_expenses', []));
    const [meals, setMeals] = useState(() => hydrateFromStorage('mess_meals', []));
    const [guestMeals, setGuestMeals] = useState(() => hydrateFromStorage('mess_guest_meals', []));
    
    const [marketSchedule, setMarketSchedule] = useState({});
    const [marketDutyLimits, setMarketDutyLimits] = useState({});
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

        // Fetch transactional data restricted to globalMonth for speed
        // Only save to localStorage if it's the current month (for "instant load" next time)
        const isCurrentMonth = globalMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        
        fetchEndpoint(api.get(`/expenses?month=${globalMonth}`), setExpenses, isCurrentMonth ? 'mess_expenses' : null);
        fetchEndpoint(api.get(`/meals?month=${globalMonth}`), setMeals, isCurrentMonth ? 'mess_meals' : null);
        fetchEndpoint(api.get(`/guest-meals?month=${globalMonth}`), setGuestMeals, isCurrentMonth ? 'mess_guest_meals' : null);
        
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

        // Fetch market duty limits for the chosen month
        (async () => {
            try {
                const res = await api.get(`/market/duty/${globalMonth}`);
                setMarketDutyLimits(res.data);
            } catch (e) { console.error('Market duty limits fetch failed', e); }
        })();

    }, [globalMonth]);

    // Fetch Initial Data
    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
        } else {
            setLoadingDaily(true); // Reset for next login
        }
    }, [isAuthenticated, refreshData, globalMonth]);

    // --- Targeted re-fetch helpers (more efficient than full refreshData) ---
    const refreshMembers = useCallback(async () => {
        try { 
            const r = await api.get('/members'); 
            setMembers(r.data);
            localStorage.setItem('mess_members', JSON.stringify(r.data));
        } catch (e) { console.error('refreshMembers failed', e); }
    }, []);
    const refreshExpenses = useCallback(async () => {
        try { const r = await api.get(`/expenses?month=${globalMonth}`); setExpenses(r.data); } catch (e) { console.error('refreshExpenses failed', e); }
    }, [globalMonth]);
    const refreshMarket = useCallback(async () => {
        try {
            const r = await api.get('/market');
            const map = {};
            r.data.forEach(item => { const m = item.date.substring(0, 7); if (!map[m]) map[m] = []; map[m].push(item); });
            setMarketSchedule(map);
            
            // Also refresh limits while we're at it
            const limitsRes = await api.get(`/market/duty/${globalMonth}`);
            setMarketDutyLimits(limitsRes.data);
        } catch (e) { console.error('refreshMarket failed', e); }
    }, [globalMonth]);

    const refreshMarketDutyLimits = useCallback(async (month) => {
        try {
            const res = await api.get(`/market/duty/${month || globalMonth}`);
            setMarketDutyLimits(res.data);
        } catch (e) { console.error('refreshMarketDutyLimits failed', e); }
    }, [globalMonth]);
    const refreshMeals = useCallback(async () => {
        try { const r = await api.get(`/meals?month=${globalMonth}`); setMeals(r.data); } catch (e) { console.error('refreshMeals failed', e); }
    }, [globalMonth]);
    const refreshGuestMeals = useCallback(async () => {
        try { const r = await api.get(`/guest-meals?month=${globalMonth}`); setGuestMeals(r.data); } catch (e) { console.error('refreshGuestMeals failed', e); }
    }, [globalMonth]);

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
    const allocateMarketDay = useCallback(async (date, assignedMemberId, requestType = 'request', managerId = null) => {
        try {
            await api.post('/market', { date, assignedMemberId, requestType, managerId });
            await refreshMarket();
        } catch (error) {
            console.error('Allocate market day failed', error);
        }
    }, [refreshMarket]);

    const approveMarketRequest = useCallback(async (requestId) => {
        // Optimistic UI Update
        setMarketSchedule(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(month => {
                updated[month] = updated[month].map(req => 
                    (req._id === requestId || req.id === requestId) ? { ...req, status: 'approved' } : req
                );
            });
            return updated;
        });

        try {
            await api.put(`/market/id/${requestId}`, { status: 'approved' });
            await refreshMarket();
        } catch (error) {
            console.error('Approve market request failed', error);
            await refreshMarket(); // Rollback on error
        }
    }, [refreshMarket]);

    const rejectMarketRequest = useCallback(async (requestId) => {
        // Optimistic UI Update
        setMarketSchedule(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(month => {
                updated[month] = updated[month].filter(req => req._id !== requestId && req.id !== requestId);
            });
            return updated;
        });

        try {
            await api.put(`/market/id/${requestId}`, { status: 'rejected' });
            await refreshMarket();
        } catch (error) {
            console.error('Reject market request failed', error);
            await refreshMarket(); // Rollback on error
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
        // Optimistic UI: Add temporary items to state
        const tempMeals = memberIds.map(id => ({
            _id: `temp-${Date.now()}-${id}`,
            date,
            memberId: id,
            type,
            isGuest,
            guestMealType,
            mealTime,
            loading: true
        }));
        setMeals(prev => [...prev, ...tempMeals]);

        try {
            // Parallel API calls for better performance
            const promises = memberIds.map(memberId => {
                const payload = { date, memberId, type };
                if (isGuest) { payload.isGuest = true; payload.guestMealType = guestMealType; payload.mealTime = mealTime; }
                return api.post('/meals', payload);
            });
            
            const responses = await Promise.all(promises);
            const newMealsResult = responses.map(r => r.data);
            
            // Replace temp items with actual server data
            setMeals(prev => [
                ...prev.filter(m => !tempMeals.some(tm => tm._id === m._id)),
                ...newMealsResult
            ]);
        } catch (error) {
            console.error('Add meal failed', error);
            // Rollback optimistic update
            setMeals(prev => prev.filter(m => !tempMeals.some(tm => tm._id === m._id)));
            alert('Failed to add meal. Please try again.');
        }
    }, []);

    const removeMeal = useCallback(async (date, memberId, type, mealId = null) => {
        // Optimistic UI: Remove item from local state immediately
        let removedItem = null;
        setMeals(prev => {
            if (mealId) {
                removedItem = prev.find(m => m._id === mealId || m.id === mealId);
                return prev.filter(m => m._id !== mealId && m.id !== mealId);
            }
            const idx = prev.findIndex(m => m.date === date && m.memberId === memberId && m.type === type);
            if (idx === -1) return prev;
            removedItem = prev[idx];
            return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });

        try {
            const payload = { date, memberId, type };
            if (mealId) payload.mealId = mealId;
            await api.delete('/meals', { data: payload });
        } catch (error) {
            console.error('Remove meal failed', error);
            // Rollback on error
            if (removedItem) setMeals(prev => [...prev, removedItem]);
            alert('Failed to remove meal. Please try again.');
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
        return expenses.filter(e => {
            if (!e.date || !globalMonth) return false;
            // Clean globalMonth (usually YYYY-MM)
            const gm = globalMonth.replace(/[ /]/g, '-');
            
            // Normalize separators in expense date string
            const d = String(e.date).replace(/[ /]/g, '-');
            
            // Match YYYY-MM-DD or DD-MM-YYYY (normalized)
            return d.includes(gm) || 
                   (d.includes('-') && d.split('-').reverse().join('-').includes(gm));
        });
    }, [expenses, globalMonth]);

    const filteredMeals = useMemo(() => {
        if (!Array.isArray(meals)) return [];
        return meals.filter(m => {
            if (!m.date || !globalMonth) return false;
            const gm = globalMonth.replace(/[ /]/g, '-');
            const d = String(m.date).replace(/[ /]/g, '-');
            return d.includes(gm) || 
                   (d.includes('-') && d.split('-').reverse().join('-').includes(gm));
        });
    }, [meals, globalMonth]);

    const filteredGuestMeals = useMemo(() => {
        if (!Array.isArray(guestMeals)) return [];
        return guestMeals.filter(m => {
            if (!m.date || !globalMonth) return false;
            const gm = globalMonth.replace(/[ /]/g, '-');
            const d = String(m.date).replace(/[ /]/g, '-');
            return d.includes(gm) || 
                   (d.includes('-') && d.split('-').reverse().join('-').includes(gm));
        });
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
        marketSchedule,
        marketDutyLimits,
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
        addExpense,
        updateExpense,
        deleteExpense,
        allocateMarketDay,
        approveMarketRequest,
        rejectMarketRequest,
        setManagerForMonth,
        markCookingFinished,
        getCookingDuty,
        refreshExpenses,
        refreshMembers,
        refreshMeals,
        refreshGuestMeals,
        refreshMarket,
        refreshData,
        dailyInfo,
        settings,
        updateSystemSetting,
        loadingDaily,
    }), [
        members, expenses, filteredExpenses, meals, filteredMeals, guestMeals, filteredGuestMeals,
        globalMonth, setGlobalMonth, marketSchedule, marketDutyLimits,
        managerAllocation, cookingDuties, clearMonthlyData, getMonthlyDataPreview, dailyInfo, settings, 
        refreshExpenses, refreshMembers, refreshMeals, refreshGuestMeals, refreshMarket, refreshData,
        addMember, removeMember, updateMember, addMeal, removeMeal, addGuestMeal,
        removeGuestMeal, addExpense, updateExpense, deleteExpense,
        allocateMarketDay, approveMarketRequest,
        rejectMarketRequest, setManagerForMonth, markCookingFinished, getCookingDuty,
        updateSystemSetting, loadingDaily,
    ]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};


