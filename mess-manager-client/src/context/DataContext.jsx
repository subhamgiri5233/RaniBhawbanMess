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
            setMembers(prev => {
                const updated = [...prev, response.data];
                localStorage.setItem('mess_members', JSON.stringify(updated));
                return updated;
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Add Member failed:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    }, []);

    const removeMember = useCallback(async (id) => {
        // Optimistic UI removal
        let removedItem = null;
        setMembers(prev => {
            removedItem = prev.find(m => m._id === id || m.id === id);
            const updated = prev.filter(m => m._id !== id && m.id !== id);
            localStorage.setItem('mess_members', JSON.stringify(updated));
            return updated;
        });

        try {
            await api.delete(`/members/${id}`);
        } catch (error) {
            console.error('Remove member failed', error);
            // Rollback on error
            if (removedItem) {
                setMembers(prev => {
                    const rollback = [...prev, removedItem];
                    localStorage.setItem('mess_members', JSON.stringify(rollback));
                    return rollback;
                });
            }
        }
    }, []);

    const updateMember = useCallback(async (id, updates) => {
        // Optimistic update
        setMembers(prev => {
            const updated = prev.map(m => (m._id === id || m.id === id) ? { ...m, ...updates } : m);
            localStorage.setItem('mess_members', JSON.stringify(updated));
            return updated;
        });

        try {
            const response = await api.put(`/members/${id}`, updates);
            setMembers(prev => {
                const updated = prev.map(m => (m._id === id || m.id === id) ? response.data : m);
                localStorage.setItem('mess_members', JSON.stringify(updated));
                return updated;
            });
            return { success: true };
        } catch (error) {
            console.error('Update Member failed:', error);
            refreshMembers(); // Sync on error
            return { success: false, error: error.response?.data?.message || error.message };
        }
    }, [refreshMembers]);

    // Expense Actions
    const addExpense = useCallback(async (expense) => {
        // Optimistic UI update
        const tempId = `temp-exp-${Date.now()}`;
        const tempExpense = {
            _id: tempId,
            id: tempId,
            ...expense,
            amount: Number(expense.amount),
            loading: true
        };
        setExpenses(prev => [...prev, tempExpense]);

        try {
            const response = await api.post('/expenses', expense);
            setExpenses(prev => prev.map(e => e._id === tempId ? response.data : e));
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Add Expense failed', error);
            // Rollback
            setExpenses(prev => prev.filter(e => e._id !== tempId));
            const errorMessage = error.response?.data?.message || error.message || 'Failed to add expense';
            return { success: false, error: errorMessage };
        }
    }, []);

    const updateExpense = useCallback(async (id, updates) => {
        // Optimistic update
        setExpenses(prev => prev.map(e => (e._id === id || e.id === id) ? { ...e, ...updates } : e));

        try {
            const response = await api.put(`/expenses/${id}`, updates);
            setExpenses(prev => prev.map(e => (e._id === id || e.id === id) ? response.data : e));
            return { success: true };
        } catch (error) {
            console.error('Update Expense failed', error);
            refreshExpenses();
            return { success: false, error: error.response?.data?.message || 'Failed to update expense' };
        }
    }, [refreshExpenses]);

    const deleteExpense = useCallback(async (id) => {
        // Optimistic deletion - instant removal from UI
        let removedItem = null;
        setExpenses(prev => {
            removedItem = prev.find(e => e._id === id || e.id === id);
            return prev.filter(e => e._id !== id && e.id !== id);
        });

        try {
            await api.delete(`/expenses/${id}`);
            return { success: true };
        } catch (error) {
            console.error('Delete Expense failed', error);
            // Rollback on error
            if (removedItem) {
                setExpenses(prev => [...prev, removedItem]);
            }
            return { success: false, error: error.response?.data?.message || 'Failed to delete expense' };
        }
    }, []);

    // Market Actions
    const allocateMarketDay = useCallback(async (date, assignedMemberId, requestType = 'request', managerId = null) => {
        // Optimistic UI update
        const tempId = `temp-${Date.now()}`;
        const month = date.substring(0, 7);
        const optimisticReq = {
            _id: tempId,
            id: tempId,
            date,
            assignedMemberId,
            requestType,
            status: requestType === 'request' ? 'pending' : 'approved',
            managerId
        };

        setMarketSchedule(prev => {
            const updated = { ...prev };
            if (!updated[month]) updated[month] = [];
            
            // If manual assign/approved, remove any existing records for this date
            if (optimisticReq.status === 'approved') {
                updated[month] = updated[month].filter(req => req.date !== date);
            } else {
                // Remove any existing pending request from the same member for the same date
                updated[month] = updated[month].filter(req => !(req.date === date && req.assignedMemberId === assignedMemberId));
            }
            
            updated[month].push(optimisticReq);
            return updated;
        });

        try {
            const res = await api.post('/market', { date, assignedMemberId, requestType, managerId });
            if (res.data && res.data._id) {
                setMarketSchedule(prev => {
                    const updated = { ...prev };
                    if (updated[month]) {
                        updated[month] = updated[month].map(req => req._id === tempId ? res.data : req);
                    }
                    return updated;
                });
            }
            refreshMarket(); // Non-blocking background sync
        } catch (error) {
            console.error('Allocate market day failed', error);
            // Rollback optimistic update on failure
            setMarketSchedule(prev => {
                const updated = { ...prev };
                if (updated[month]) {
                    updated[month] = updated[month].filter(req => req._id !== tempId);
                }
                return updated;
            });
            refreshMarket();
        }
    }, [refreshMarket]);

    const approveMarketRequest = useCallback(async (requestId) => {
        // Optimistic UI Update
        let approvedDate = null;
        setMarketSchedule(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(month => {
                const req = updated[month].find(r => r._id === requestId || r.id === requestId);
                if (req) approvedDate = req.date;
                
                updated[month] = updated[month].map(r => 
                    (r._id === requestId || r.id === requestId) ? { ...r, status: 'approved' } : r
                );
                // Clear any other records on the same date
                if (approvedDate) {
                    updated[month] = updated[month].filter(r => r.date !== approvedDate || r._id === requestId || r.id === requestId);
                }
            });
            return updated;
        });

        try {
            await api.put(`/market/id/${requestId}`, { status: 'approved' });
            refreshMarket(); // Non-blocking sync
        } catch (error) {
            console.error('Approve market request failed', error);
            refreshMarket(); // Rollback on error
        }
    }, [refreshMarket]);

    const rejectMarketRequest = useCallback(async (requestId, date = null) => {
        if (!requestId && !date) return;
        // Optimistic UI Update - immediately strip from local schedule state
        setMarketSchedule(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(month => {
                if (date && date.startsWith(month)) {
                    updated[month] = updated[month].filter(req => req.date !== date && req._id !== requestId && req.id !== requestId);
                } else {
                    updated[month] = updated[month].filter(req => req._id !== requestId && req.id !== requestId && (!date || req.date !== date));
                }
            });
            return updated;
        });

        try {
            if (date) {
                await api.delete(`/market/date/${date}`);
            } else if (requestId && !requestId.startsWith('temp-')) {
                await api.put(`/market/id/${requestId}`, { status: 'rejected' });
            }
            refreshMarket(); // Non-blocking sync
        } catch (error) {
            console.error('Reject market request failed', error);
            refreshMarket();
        }
    }, [refreshMarket]);

    const clearMarketDate = useCallback(async (date) => {
        if (!date) return;
        const month = date.substring(0, 7);
        // Optimistic UI Update
        setMarketSchedule(prev => {
            const updated = { ...prev };
            if (updated[month]) {
                updated[month] = updated[month].filter(req => req.date !== date);
            }
            return updated;
        });

        try {
            await api.delete(`/market/date/${date}`);
            refreshMarket(); // Non-blocking sync
        } catch (error) {
            console.error('Clear market date failed', error);
            refreshMarket();
        }
    }, [refreshMarket]);

    // Manager Allocation
    const setManagerForMonth = useCallback(async (month, memberId) => {
        setManagerAllocation(prev => ({ ...prev, [month]: memberId }));
        try {
            await api.post('/managers', { month, memberId });
        } catch (error) {
            console.error('Set manager failed', error);
        }
    }, []);

    // Cooking Duties
    const markCookingFinished = useCallback(async (date, memberId) => {
        setCookingDuties(prev => [...prev, { date, memberId, finished: true }]);
        try {
            await api.post('/cooking/finish', { date, memberId });
        } catch (error) {
            console.error('Mark cooking finished failed', error);
        }
    }, []);

    const getCookingDuty = useCallback((date) => cookingDuties.find(d => d.date === date), [cookingDuties]);

    // Guest Meal Functions
    const addGuestMeal = useCallback(async (date, memberId, guestMealType, mealTime) => {
        // Optimistic UI update
        const tempId = `temp-guest-${Date.now()}`;
        const host = members.find(m => m._id === memberId || m.id === memberId);
        const tempGuest = {
            _id: tempId,
            date,
            memberId,
            memberName: host ? host.name : 'Unknown',
            guestMealType,
            mealTime,
            amount: MESS_CONFIG.GUEST_CONFIG.PRICES[guestMealType] || 0,
            loading: true
        };
        
        setGuestMeals(prev => [...prev, tempGuest]);

        try {
            const settingKey = `guest_price_${guestMealType}`;
            const dbSetting = settings.find(s => s.key === settingKey);
            const amount = dbSetting ? Number(dbSetting.value) : (MESS_CONFIG.GUEST_CONFIG.PRICES[guestMealType] || 0);

            const response = await api.post('/guest-meals', { date, memberId, guestMealType, mealTime, amount });
            
            // Replace temp item with real one
            setGuestMeals(prev => prev.map(gm => gm._id === tempId ? response.data : gm));
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Add guest meal failed', error);
            // Rollback
            setGuestMeals(prev => prev.filter(gm => gm._id !== tempId));
            throw error;
        }
    }, [settings, members]);

    // Meal Actions
    const addMeal = useCallback(async (date, memberIds, type, isGuest = false, guestMealType = null, mealTime = null) => {
        if (isGuest) {
            return addGuestMeal(date, memberIds[0], guestMealType, mealTime);
        }

        // Optimistic UI: Add temporary items to state immediately
        const tempMeals = memberIds.map(id => {
            const memberObj = members.find(m => m._id === id || m.id === id || m.userId === id);
            return {
                _id: `temp-${Date.now()}-${id}`,
                date,
                memberId: id,
                memberName: memberObj ? memberObj.name : 'Unknown',
                type,
                isGuest: false,
                loading: false
            };
        });
        setMeals(prev => [...prev, ...tempMeals]);

        try {
            // Single bulk API call
            const response = await api.post('/meals/bulk', { date, memberIds, type });
            
            if (Array.isArray(response.data)) {
                // Replace temp meals with saved documents seamlessly
                setMeals(prev => {
                    const withoutTemps = prev.filter(m => !tempMeals.some(tm => tm._id === m._id));
                    return [...withoutTemps, ...response.data];
                });
            }
            // Non-blocking background sync if needed
            refreshMeals();
        } catch (error) {
            console.error('Add bulk meal failed', error);
            // Rollback optimistic update
            setMeals(prev => prev.filter(m => !tempMeals.some(tm => tm._id === m._id)));
            alert('Failed to add meals. Please try again.');
        }
    }, [members, refreshMeals, addGuestMeal]);

    const removeMeal = useCallback(async (date, memberId, type, mealId = null) => {
        // Optimistic UI: Remove item from local state immediately
        let removedItem = null;
        setMeals(prev => {
            if (mealId) {
                removedItem = prev.find(m => m._id === mealId || m.id === mealId);
                return prev.filter(m => m._id !== mealId && m.id !== mealId);
            }
            const idx = prev.findIndex(m => m.date === date && (m.memberId === memberId || m.memberId === String(memberId)) && m.type === type);
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

    const removeGuestMeal = useCallback(async (guestMealId) => {
        // Optimistic UI removal
        let removedItem = null;
        setGuestMeals(prev => {
            removedItem = prev.find(m => m._id === guestMealId || m.id === guestMealId);
            return prev.filter(m => m._id !== guestMealId && m.id !== guestMealId);
        });

        try {
            await api.delete(`/guest-meals/${guestMealId}`);
        } catch (error) {
            console.error('Remove guest meal failed', error);
            if (removedItem) {
                setGuestMeals(prev => [...prev, removedItem]);
            }
        }
    }, []);

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
        clearMarketDate,
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
        rejectMarketRequest, clearMarketDate, setManagerForMonth, markCookingFinished, getCookingDuty,
        updateSystemSetting, loadingDaily,
    ]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};


