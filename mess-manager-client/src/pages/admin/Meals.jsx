import { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Calendar, Plus, Trash2, Users, TrendingUp, Sparkles, ArrowRight, UtensilsCrossed, Info, Trash, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import MealMonthlySheet from '../../components/MealMonthlySheet';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { MESS_CONFIG } from '../../config';

const Meals = () => {
    const {
        members, meals, guestMeals, addMeal, removeMeal,
        addGuestMeal, removeGuestMeal,
        refreshData, globalMonth, setGlobalMonth, settings
    } = useData();

    // Helper to get setting value
    const getSettingValue = (key, fallback) => {
        const s = settings.find(item => item.key === key);
        return s ? Number(s.value) : fallback;
    };

    const MIN_MEALS = getSettingValue('min_meals_month', MESS_CONFIG.MIN_MEALS_PER_MONTH);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [showGuestDialog, setShowGuestDialog] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');
    const [selectedMealType, setSelectedMealType] = useState('meat');
    const [guestMealTime, setGuestMealTime] = useState('lunch');
    const [guestDate, setGuestDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [filterByMember, setFilterByMember] = useState('all');

    // Sync selectedDate with globalMonth
    useEffect(() => {
        if (!selectedDate.startsWith(globalMonth)) {
            // If the selected date is not in the global month, 
            // set it to the first day of the global month
            setSelectedDate(`${globalMonth}-01`);
        }
    }, [globalMonth, selectedDate]);

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
        const newMonth = newDate.substring(0, 7);
        if (newMonth !== globalMonth) {
            setGlobalMonth(newMonth);
        }
    };

    // Handle Meal Toggling from Monthly Sheet
    const handleToggleMeal = (memberId, dateStr, type, shouldAdd) => {
        if (shouldAdd) {
            addMeal(dateStr, [memberId], type);
        } else {
            removeMeal(dateStr, memberId, type);
        }
    };

    // Guest meal helpers from global config - Memoized
    const { guestMealPrices, guestMealIcons, guestMealLabels } = useMemo(() => ({
        guestMealPrices: {
            fish: getSettingValue('guest_price_fish', MESS_CONFIG.GUEST_CONFIG.PRICES.fish),
            meat: getSettingValue('guest_price_meat', MESS_CONFIG.GUEST_CONFIG.PRICES.meat),
            veg: getSettingValue('guest_price_veg', MESS_CONFIG.GUEST_CONFIG.PRICES.veg),
            egg: getSettingValue('guest_price_egg', MESS_CONFIG.GUEST_CONFIG.PRICES.egg)
        },
        guestMealIcons: MESS_CONFIG.GUEST_CONFIG.ICONS,
        guestMealLabels: MESS_CONFIG.GUEST_CONFIG.LABELS
    }), [settings]);

    const handleAddGuest = async () => {
        if (!selectedMember) {
            alert('⚠️ Please select a member (Host Account) first!');
            return;
        }

        if (!selectedMealType) {
            alert('⚠️ Please select a menu item (Veg, Meat, etc.)!');
            return;
        }

        if (!guestDate) {
            alert('⚠️ Please select a target date!');
            return;
        }

        try {
            await addGuestMeal(guestDate, selectedMember, selectedMealType, guestMealTime);
            setShowGuestDialog(false);
            setSelectedMember('');
            setSelectedMealType('meat');
            setGuestMealTime('lunch');
        } catch (error) {
            console.error('Failed to add guest meal:', error);
            alert(`Error adding guest meal: ${error.response?.data?.message || error.message || error}`);
        }
    };


    // --- PERFORMANCE OPTIMIZATION: CENTRALIZED INDEXING ---
    // Instead of filtering the entire 'meals' and 'guestMeals' array for every member (O(N*M)),
    // we process it once per render (O(N+M)) to build a lookup map.
    const memberStats = useMemo(() => {
        const stats = {};
        const currentM = globalMonth;

        // Initialize stats for each member
        (members || []).forEach(m => {
            const mId = m._id || m.id;
            stats[mId] = { mealCount: 0, guestCount: 0, guestTotal: 0, guestMeals: [] };
        });

        // Single pass on meals
        (meals || []).forEach(meal => {
            if (meal?.memberId && meal?.date?.startsWith(currentM)) {
                if (stats[meal.memberId]) stats[meal.memberId].mealCount++;
            }
        });

        // Single pass on guest meals
        (guestMeals || []).forEach(gm => {
            if (gm?.memberId && gm?.date?.startsWith(currentM)) {
                if (stats[gm.memberId]) {
                    stats[gm.memberId].guestCount++;
                    const price = guestMealPrices[gm.guestMealType] || 0;
                    stats[gm.memberId].guestTotal += price;
                    stats[gm.memberId].guestMeals.push(gm);
                }
            }
        });

        return stats;
    }, [members, meals, guestMeals, globalMonth, guestMealPrices]);

    // Derived statistics using the map (O(1) lookups)
    const membersBelowMinCount = useMemo(() => {
        return (members || []).filter(m => (memberStats[m._id || m.id]?.mealCount || 0) < MIN_MEALS).length;
    }, [members, memberStats, MIN_MEALS]);

    const memberGuestTotals = useMemo(() => {
        return (members || []).map(member => {
            const s = memberStats[member._id || member.id];
            if (!s || s.guestCount === 0) return null;
            return {
                member,
                count: s.guestCount,
                total: s.guestTotal,
                meals: s.guestMeals
            };
        }).filter(Boolean);
    }, [members, memberStats]);

    const totalGuestCost = useMemo(() =>
        memberGuestTotals.reduce((sum, m) => sum + m.total, 0)
        , [memberGuestTotals]);

    const allGuestMeals = useMemo(() => {
        return Object.values(memberStats).flatMap(s => s.guestMeals);
    }, [memberStats]);

    const filteredGuestMeals = useMemo(() =>
        filterByMember === 'all'
            ? allGuestMeals
            : memberStats[filterByMember]?.guestMeals || []
        , [allGuestMeals, filterByMember, memberStats]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rb-card p-8 group border-l-8 border-l-primary-500">
                <div>
                    <h1 className="text-3xl sm:text-5xl rb-header">Meal Logistics</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest">Track daily consumption and guest records</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-indigo-300/40 dark:bg-slate-800/50 p-2 rounded-2xl border border-indigo-300/30 dark:border-white/5 shadow-inner">
                        <div className="p-2 bg-indigo-300/40 dark:bg-slate-700 rounded-xl shadow-sm border border-indigo-400/20">
                            <Calendar size={18} className="text-primary-500" />
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="bg-transparent outline-none text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight"
                        />
                </div>
            </div>
        </div>

            {/* Regular Meals Monthly Sheet */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 px-6 py-4 bg-indigo-300/40 dark:bg-indigo-950/20 border border-indigo-300/30 dark:border-indigo-500/10 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Billing Rule:</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-black">{MIN_MEALS} MEALS MINIMUM</span>
                        PER PERSON PER MONTH
                    </div>
                    {membersBelowMinCount > 0 && (
                        <div className="ml-auto flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                                {membersBelowMinCount} Members Below Minimum
                            </span>
                        </div>
                    )}
                </div>
                <MealMonthlySheet
                    members={members}
                    meals={meals}
                    selectedDate={selectedDate}
                    onToggleMeal={handleToggleMeal}
                />
            </div>

            {/* Guest Meals Section - MOVED TO BOTTOM */}
            <div className="space-y-6 pt-12 border-t border-indigo-300/30 dark:border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-300/40 dark:bg-primary-950/40 rounded-2xl border border-primary-400/20 shadow-lg shadow-primary-500/10">
                            <Users size={24} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <h2 className="text-2xl rb-header">Guest Operations</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Users size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                value={filterByMember}
                                onChange={(e) => setFilterByMember(e.target.value)}
                                className="pl-10 pr-6 py-2.5 bg-indigo-300/40 dark:bg-slate-900 border border-indigo-300/30 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-500/10 transition-all appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="all">Consolidated View</option>
                                {members.map(m => (
                                    <option key={m._id || m.id} value={m._id || m.id} className="dark:bg-slate-900">{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <Button
                            onClick={() => setShowGuestDialog(true)}
                            className="flex items-center gap-2 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 active:scale-95 transition-all text-xs font-black uppercase tracking-widest px-6"
                        >
                            <Plus size={18} /> Add Guest
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Guest Meals List */}
                    <Card className="lg:col-span-2 rb-card rb-shadow-blue p-0 overflow-hidden relative group">
                        <div className="p-6 border-b border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="rb-header !text-[10px] tracking-[0.2em] opacity-60">Transaction Ledger</h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-indigo-300/30 dark:divide-white/5 scrollbar-hide">
                            {filteredGuestMeals.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-indigo-300/40 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-indigo-400/30 dark:border-white/10">
                                        <Info size={24} className="text-indigo-400" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60">Zero active records</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredGuestMeals.map((guest, idx) => (
                                        <motion.div
                                            key={guest._id || guest.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="flex items-center justify-between p-6 hover:bg-indigo-300/40 dark:hover:bg-white/5 transition-all group border-b border-indigo-300/30 last:border-0"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-300/40 dark:bg-slate-800 shadow-sm border border-indigo-300/30 dark:border-white/5 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                                    {guestMealIcons[guest.guestMealType]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                                        Guest of {guest.memberName}
                                                        {guest.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                        <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(guest.date), 'MMM dd')}</span>
                                                        <span className="w-1 h-1 rounded-full bg-indigo-300/40 dark:bg-slate-800"></span>
                                                        <span>{guestMealLabels[guest.guestMealType]}</span>
                                                        <span className="w-1 h-1 rounded-full bg-indigo-300/40 dark:bg-slate-800"></span>
                                                        <span className="flex items-center gap-1">{guest.mealTime === 'lunch' ? '|☀️ Lunch' : '🌙 Dinner'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right flex items-center gap-4">
                                                    <div>
                                                        <p className="font-black text-primary-600 dark:text-primary-400 text-lg">₹{guestMealPrices[guest.guestMealType]}</p>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Charge Applied</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Do you want to delete?')) {
                                                                removeGuestMeal(guest._id || guest.id);
                                                            }
                                                        }}
                                                        className="p-2 bg-rose-300/40 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-rose-500/10"
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </Card>

                    {/* Summary Card */}
                    <Card className="p-0 overflow-hidden rb-card rb-shadow-indigo border-transparent bg-gradient-to-br from-indigo-600 via-indigo-700 to-primary-800 h-fit relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                        <div className="p-8 border-b border-white/10 bg-black/10">
                            <div className="flex items-center gap-3 mb-1">
                                <TrendingUp size={16} className="text-indigo-300" />
                                <h3 className="rb-header !text-white/40 !text-[9px] tracking-[0.3em]">Financial Matrix</h3>
                            </div>
                            <h2 className="text-2xl rb-header !text-white">Revenue Intel</h2>
                        </div>

                        <div className="p-8 space-y-4">
                            <AnimatePresence mode="popLayout">
                                {memberGuestTotals.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Zero contribution detected</p>
                                    </div>
                                ) : (
                                    <>
                                        {memberGuestTotals.map(({ member, count, total }) => (
                                            <motion.div
                                                key={member._id || member.id}
                                                layout
                                                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all backdrop-blur-md group/stat"
                                            >
                                                <div>
                                                    <p className="font-black text-white text-sm tracking-tight">{member.name}</p>
                                                    <p className="text-[9px] font-black text-indigo-200/50 uppercase tracking-widest mt-0.5">{count} Active Session{count > 1 ? 's' : ''}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black text-white text-lg">₹{total}</span>
                                                </div>
                                            </motion.div>
                                        ))}

                                        <div className="pt-6 mt-6 border-t border-white/10">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-indigo-200/50 uppercase tracking-[0.2em]">Aggregate Total</span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-4xl font-black text-white tracking-tighter">₹{totalGuestCost}</span>
                                                    <div className="p-2 bg-white/20 rounded-xl border border-white/30 backdrop-blur-sm animate-pulse-subtle">
                                                        <Sparkles size={18} className="text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Add Guest Dialog - WOW Premium Style */}
            <AnimatePresence>
                {showGuestDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowGuestDialog(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-xl group"
                        >
                            {/* Animated Background Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500 rounded-[1.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            
                            <Card className="p-5 md:p-10 shadow-3xl shadow-black/60 border-indigo-400/30 bg-indigo-300/40 dark:bg-slate-900/90 overflow-hidden relative backdrop-blur-2xl rounded-[1.5rem] flex flex-col max-h-[90vh]">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-125 transition-transform duration-700">
                                    <Sparkles size={160} />
                                </div>

                                <div className="flex justify-between items-start mb-6 md:mb-10 flex-shrink-0">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles size={16} className="text-primary-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em]">Guest Registration</span>
                                        </div>
                                        <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">Add Guest Record</h3>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tight">Manual entry for host member accounts</p>
                                    </div>
                                    <button
                                        onClick={() => setShowGuestDialog(false)}
                                        className="p-2 md:p-3 bg-indigo-300/40 dark:bg-slate-800 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-2xl transition-all active:scale-90 hover:rotate-90 duration-300"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-4 -mr-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Target Date</label>
                                            <div className="relative group/input">
                                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within/input:text-primary-500 transition-colors" />
                                                <input
                                                    type="date"
                                                    value={guestDate}
                                                    onChange={(e) => setGuestDate(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-indigo-300/40 dark:bg-slate-950 border border-indigo-300/30 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none text-slate-900 dark:text-slate-100 font-black uppercase tracking-tight transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Host Member</label>
                                            <select
                                                value={selectedMember}
                                                onChange={(e) => setSelectedMember(e.target.value)}
                                                className="w-full p-4 bg-indigo-300/40 dark:bg-slate-950 border border-indigo-300/30 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none text-slate-900 dark:text-slate-100 font-bold transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Account</option>
                                                {members.map(m => (
                                                    <option key={m._id || m.id} value={m._id || m.id} className="dark:bg-slate-900">{m.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Meal Timing</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['lunch', 'dinner'].map(time => (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        onClick={() => setGuestMealTime(time)}
                                                        className={cn(
                                                            "p-5 rounded-[1.5rem] border-2 transition-all font-black uppercase tracking-widest text-[10px] flex flex-col items-center justify-center gap-1.5 relative overflow-hidden",
                                                            guestMealTime === time
                                                                ? "border-primary-500 bg-primary-500 text-white shadow-xl shadow-primary-500/30 scale-105"
                                                                : "border-indigo-300/30 dark:border-white/10 bg-indigo-300/40 dark:bg-slate-900/60 text-indigo-500 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-slate-300"
                                                        )}
                                                    >
                                                        <span className="text-lg group-hover:scale-125 transition-transform">{time === 'lunch' ? '☀️' : '🌙'}</span>
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Selection Menu</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(guestMealLabels)
                                                .filter(([key]) => ['fish', 'egg', 'veg', 'meat'].includes(key))
                                                .map(([key, label]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedMealType(key)}
                                                        className={cn(
                                                            "p-5 rounded-[1.5rem] border-2 transition-all group flex flex-col items-center justify-center gap-1.5 relative overflow-hidden",
                                                            selectedMealType === key
                                                                ? "border-primary-500 bg-primary-500 text-white shadow-xl shadow-primary-500/30 scale-105"
                                                                : "border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-slate-950/50 text-indigo-400 hover:border-indigo-400 hover:bg-white dark:hover:bg-slate-800"
                                                        )}
                                                    >
                                                        {selectedMealType === key && (
                                                            <motion.div
                                                                layoutId="admin-selection-glow"
                                                                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                                                            />
                                                        )}
                                                        <div className="text-3xl mb-1 group-hover:scale-125 transition-transform duration-500">{guestMealIcons[key]}</div>
                                                        <div className="font-black text-[10px] uppercase tracking-widest opacity-80">{label}</div>
                                                        <div className={cn(
                                                            "text-sm font-black mt-1",
                                                            selectedMealType === key ? "text-white" : "text-slate-900 dark:text-white"
                                                        )}>₹{guestMealPrices[key]}</div>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100 dark:border-white/5 flex-shrink-0">
                                    <button
                                        onClick={() => setShowGuestDialog(false)}
                                        className="flex-1 py-5 bg-indigo-300/40 dark:bg-slate-800 text-indigo-600 font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] hover:bg-rose-300/40 dark:hover:bg-rose-950/30 hover:text-rose-500 transition-all active:scale-95"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={handleAddGuest}
                                        className="flex-[2] py-5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/60 transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                                        Confirm Registration <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Meals;


