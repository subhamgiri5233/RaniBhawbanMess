import { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Calendar, Plus, Trash2, Users, TrendingUp, Sparkles, ArrowRight, UtensilsCrossed, Info, Trash, X } from 'lucide-react';
import { format } from 'date-fns';
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

    const handleAddGuest = () => {
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

        // Fire and forget (Optimistic update in DataContext handles the UI)
        addGuestMeal(guestDate, selectedMember, selectedMealType, guestMealTime)
            .catch(error => {
                console.error('Failed to add guest meal:', error);
                alert(`Error adding guest meal: ${error.response?.data?.message || error.message || error}`);
            });

        // Close and reset immediately for "instant" feel
        setShowGuestDialog(false);
        setSelectedMember('');
        setSelectedMealType('meat');
        setGuestMealTime('lunch');
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
        <div className="space-y-6 sm:space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 md:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Meal Logistics</h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Track daily consumption and guest records</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
                        <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="bg-transparent outline-none text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight"
                        />
                    </div>
                </div>
            </div>

            {/* Regular Meals Monthly Sheet */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed size={15} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Billing Rule:</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-extrabold">{MIN_MEALS} MEALS MINIMUM</span>
                        PER PERSON PER MONTH
                    </div>
                    {membersBelowMinCount > 0 && (
                        <div className="ml-auto flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
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

            {/* Guest Meals Section */}
            <div className="space-y-6 pt-8 border-t border-slate-200/80 dark:border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                            <Users size={20} />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Guest Operations</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                value={filterByMember}
                                onChange={(e) => setFilterByMember(e.target.value)}
                                className="pl-9 pr-6 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-extrabold uppercase tracking-wider outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-slate-700 dark:text-slate-300"
                            >
                                <option value="all">Consolidated View</option>
                                {members.map(m => (
                                    <option key={m._id || m.id} value={m._id || m.id} className="dark:bg-slate-900">{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <Button
                            onClick={() => setShowGuestDialog(true)}
                            className="flex items-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 active:scale-95 transition-all text-xs font-extrabold uppercase tracking-wider px-4"
                        >
                            <Plus size={16} /> Add Guest
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Guest Meals List */}
                    <Card className="lg:col-span-2 p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Guest Meals List</h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 custom-scrollbar">
                            {filteredGuestMeals.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                                        <Info size={20} />
                                    </div>
                                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">No guest meal records for this month</p>
                                </div>
                            ) : (
                                filteredGuestMeals.map((guest) => (
                                    <div
                                        key={guest._id || guest.id}
                                        className="flex items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group border-b border-slate-100 dark:border-white/5 last:border-0"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/5 flex items-center justify-center text-xl shrink-0">
                                                {guestMealIcons[guest.guestMealType]}
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight flex items-center gap-2">
                                                    Guest of {guest.memberName}
                                                    {guest.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                    <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(guest.date), 'MMM dd')}</span>
                                                    <span>•</span>
                                                    <span>{guestMealLabels[guest.guestMealType]}</span>
                                                    <span>•</span>
                                                    <span>{guest.mealTime === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base">₹{guestMealPrices[guest.guestMealType]}</p>
                                                <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Applied</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Do you want to delete this guest meal?')) {
                                                        removeGuestMeal(guest._id || guest.id);
                                                    }
                                                }}
                                                className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-rose-500/20"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Summary Card */}
                    <Card className="p-0 overflow-hidden border-transparent bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white shadow-md shadow-indigo-500/20 h-fit">
                        <div className="p-6 border-b border-white/10 bg-black/10">
                            <div className="flex items-center gap-2 mb-0.5">
                                <TrendingUp size={14} className="text-indigo-200" />
                                <h3 className="text-white/60 text-[9px] font-extrabold uppercase tracking-widest">Guest Summary</h3>
                            </div>
                            <h2 className="text-xl font-extrabold text-white">Guest Meal Charges</h2>
                        </div>

                        <div className="p-6 space-y-3">
                            {memberGuestTotals.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">No guest meals recorded</p>
                                </div>
                            ) : (
                                <>
                                    {memberGuestTotals.map(({ member, count, total }) => (
                                        <div
                                            key={member._id || member.id}
                                            className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/10 transition-all backdrop-blur-md"
                                        >
                                            <div>
                                                <p className="font-extrabold text-white text-xs tracking-tight">{member.name}</p>
                                                <p className="text-[9px] font-extrabold text-indigo-200/60 uppercase tracking-wider mt-0.5">{count} Session{count > 1 ? 's' : ''}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-extrabold text-white text-base">₹{total}</span>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-4 mt-4 border-t border-white/10">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-extrabold text-indigo-200/60 uppercase tracking-wider">Aggregate Total</span>
                                            <div className="flex items-center justify-between">
                                                <span className="text-3xl font-extrabold text-white tracking-tight">₹{totalGuestCost}</span>
                                                <div className="p-2 bg-white/20 rounded-xl border border-white/30">
                                                    <Sparkles size={16} className="text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Add Guest Dialog */}
            {showGuestDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowGuestDialog(false)}
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
                    />
                    <div className="relative w-full max-w-lg my-auto z-10">
                        <Card 
                             className="p-5 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden relative rounded-3xl max-h-[90vh] flex flex-col"
                             innerClassName="flex flex-col h-full min-h-0"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-start mb-5 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 shrink-0">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Add Guest Meal</h3>
                                        <p className="text-xs font-bold text-slate-400 mt-0.5">Record an extra meal for a visiting guest</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowGuestDialog(false)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full transition-all active:scale-95"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 min-h-0">
                                <div className="space-y-3.5">
                                    {/* Date */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5">Meal Date</label>
                                        <div className="relative">
                                            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="date"
                                                value={guestDate}
                                                onChange={(e) => setGuestDate(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-extrabold text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Host Member */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5">Host Member</label>
                                        <select
                                            value={selectedMember}
                                            onChange={(e) => setSelectedMember(e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-extrabold text-xs cursor-pointer"
                                        >
                                            <option value="">Choose Member...</option>
                                            {members.map(m => (
                                                <option key={m._id || m.id} value={m._id || m.id} className="dark:bg-slate-900">{m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Meal Timing */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5">Meal Time</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { time: 'lunch', label: 'Lunch', icon: '☀️' },
                                                { time: 'dinner', label: 'Dinner', icon: '🌙' }
                                            ].map(({ time, label, icon }) => (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => setGuestMealTime(time)}
                                                    className={cn(
                                                        "p-2.5 rounded-2xl border transition-all font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2",
                                                        guestMealTime === time
                                                            ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30 shadow-sm"
                                                            : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-indigo-400"
                                                    )}
                                                >
                                                    <span className="text-base">{icon}</span>
                                                    <span>{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Selection */}
                                <div className="space-y-2 pt-1">
                                    <label className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5">Menu Choice</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        {Object.entries(guestMealLabels)
                                            .filter(([key]) => ['fish', 'egg', 'veg', 'meat'].includes(key))
                                            .map(([key, label]) => {
                                                const isSelected = selectedMealType === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setSelectedMealType(key)}
                                                        className={cn(
                                                            "p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden",
                                                            isSelected
                                                                ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30 shadow-sm"
                                                                : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-indigo-300"
                                                        )}
                                                    >
                                                        <div className="text-2xl transition-transform group-hover:scale-110">{guestMealIcons[key]}</div>
                                                        <div className="font-extrabold text-[11px] uppercase tracking-wide">{label}</div>
                                                        <div className={cn(
                                                            "text-xs font-black px-2 py-0.5 rounded-full mt-0.5",
                                                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                                        )}>₹{guestMealPrices[key]}</div>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-white/10 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowGuestDialog(false)}
                                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddGuest}
                                    className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <span>Save Guest Meal</span>
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Meals;


