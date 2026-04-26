import { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Plus, Trash2, Users, TrendingUp, Sparkles, ArrowRight, UtensilsCrossed, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import MealMonthlySheet from '../../components/MealMonthlySheet';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { MESS_CONFIG } from '../../config';

const MemberMeals = () => {
    const { user } = useAuth();
    const {
        members, meals, guestMeals, addMeal, removeMeal,
        addGuestMeal, removeGuestMeal, globalMonth, setGlobalMonth, settings
    } = useData();

    // Helper to get setting value
    const getSettingValue = (key, fallback) => {
        const s = settings.find(item => item.key === key);
        return s ? Number(s.value) : fallback;
    };

    const MIN_MEALS = getSettingValue('min_meals_month', MESS_CONFIG.MIN_MEALS_PER_MONTH);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [showGuestDialog, setShowGuestDialog] = useState(false);

    // Guest dialog state
    const [selectedMealType, setSelectedMealType] = useState('meat');
    const [guestMealTime, setGuestMealTime] = useState('lunch');
    const [guestDate, setGuestDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Filter to only show the logged-in member
    const currentMember = useMemo(() =>
        members.filter(m => (m._id === user.id || m.id === user.id))
        , [members, user.id]);

    // Sync selectedDate with globalMonth
    useEffect(() => {
        if (!selectedDate.startsWith(globalMonth)) {
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
        // Security check: Member can only toggle their own meals
        if (String(memberId) !== String(user.id)) return;

        if (shouldAdd) {
            addMeal(dateStr, [memberId], type);
        } else {
            removeMeal(dateStr, memberId, type);
        }
    };

    // Guest meal helpers from global config
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
        if (!selectedMealType) {
            alert('⚠️ Please select a menu item!');
            return;
        }

        // Fire and forget (Optimistic update in DataContext handles the UI)
        addGuestMeal(guestDate, user.id, selectedMealType, guestMealTime)
            .catch(error => {
                console.error('Failed to add guest meal:', error);
                alert(`Error sharing guest meal: ${error.response?.data?.message || error.message}`);
            });

        // Close and reset immediately for "instant" feel
        setShowGuestDialog(false);
        setSelectedMealType('meat');
        setGuestMealTime('lunch');
    };

    // Get my guest meals for current month - now global
    const currentMonth = globalMonth;

    const myGuestMeals = useMemo(() =>
        (guestMeals || []).filter(m =>
            m?.memberId === user.id &&
            m?.date &&
            m.date.startsWith(currentMonth)
        )
        , [guestMeals, user.id, currentMonth]);

    const myGuestTotal = useMemo(() =>
        myGuestMeals.reduce((sum, g) => sum + (guestMealPrices[g?.guestMealType] || 0), 0)
        , [myGuestMeals, guestMealPrices]);

    // Calculate regular meal count for current month
    const myRegularMealsCount = useMemo(() => {
        return (meals || []).filter(m => 
            m.memberId === user.id && 
            m.date && 
            m.date.startsWith(currentMonth) &&
            !m.isGuest
        ).length;
    }, [meals, user.id, currentMonth]);

    return (
        <>
            <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-300/40 dark:bg-slate-900 border-l-8 border-l-indigo-600 shadow-sm p-8 rounded-[1.5rem] border border-indigo-300/30 dark:border-white/5 transition-colors">
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-tight">My Meal Registry</h1>
                    <p className="text-[9px] sm:text-xs font-bold text-indigo-500/80 dark:text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">Manage daily presence & guests</p>
                </div>

                <div className="flex items-center gap-3 bg-indigo-300/40 dark:bg-slate-800/50 p-2 rounded-2xl border border-indigo-400/30 dark:border-white/5 shadow-inner">
                    <div className="p-2 bg-indigo-300/40 dark:bg-slate-700 rounded-xl shadow-inner border border-indigo-400/20">
                        <Calendar size={18} className="text-indigo-600" />
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="bg-transparent outline-none text-sm font-black text-indigo-900 dark:text-slate-200 uppercase tracking-tight"
                    />
                </div>
            </div>            {/* Regular Meals Monthly Sheet */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 px-6 py-4 bg-indigo-300/40 dark:bg-indigo-950/20 border border-indigo-300/30 dark:border-indigo-500/10 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Billing Policy:</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-slate-400 uppercase tracking-tight">
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-black shadow-md">{MIN_MEALS} MEALS MINIMUM</span>
                        PER MONTH
                    </div>
                </div>
                <MealMonthlySheet
                    members={members}
                    meals={meals}
                    selectedDate={selectedDate}
                    onToggleMeal={handleToggleMeal}
                    editableMemberId={user.id}
                />
            </div>

            {/* Guest Records Section - MOVED TO BOTTOM */}
            <div className="space-y-6 pt-12 border-t border-indigo-300/30 dark:border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                         <div className="p-3 bg-indigo-300/40 dark:bg-primary-950/40 rounded-2xl shadow-inner border border-indigo-400/20">
                            <Users size={24} className="text-indigo-700 dark:text-primary-400" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tighter uppercase leading-none">Guest Archive</h2>
                    </div>

                    <Button
                        onClick={() => setShowGuestDialog(true)}
                        className="hidden md:flex items-center gap-2 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-all text-xs font-black uppercase tracking-widest px-6"
                    >
                        <Plus size={18} /> Record Guest Meal
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Guest Meals List */}
                    <Card className="lg:col-span-2 p-0 overflow-hidden shadow-sm border-indigo-300/30 dark:border-white/5 relative bg-indigo-300/40 dark:bg-slate-900/40">
                        <div className="p-6 border-b border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase text-[10px] tracking-[0.2em]">Personal Guest Ledger</h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-indigo-300/30 dark:divide-white/5 scrollbar-hide">
                            {myGuestMeals.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-indigo-300/40 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-indigo-400/30 dark:border-white/10">
                                        <Info size={24} className="text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No guest records found for this month</p>
                                </div>
                            ) : (
                                myGuestMeals.map((guest, idx) => (
                                    <div
                                        key={`guest-${guest._id || idx}`}
                                        className="flex items-center justify-between p-6 bg-indigo-300/40 backdrop-blur-lg dark:bg-slate-900/60 rounded-[1.5rem] hover:bg-indigo-300/60 dark:hover:bg-white/5 transition-all border border-indigo-300/30 dark:border-white/5 group"
                                    >
                                        <div className="flex items-center gap-5">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] sm:rounded-2xl bg-indigo-300/40 dark:bg-slate-800 shadow-inner border border-indigo-300/30 dark:border-white/5 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-500">
                                                {guestMealIcons[guest.guestMealType]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                                    {guestMealLabels[guest.guestMealType]}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(guest.date), 'MMM dd')}</span>
                                                    <span className="w-1 h-1 rounded-full bg-indigo-300/40 dark:bg-slate-800"></span>
                                                    <span className="flex items-center gap-1">{guest.mealTime === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="font-black text-indigo-600 dark:text-indigo-400 text-lg">₹{guestMealPrices[guest.guestMealType]}</p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Charged to you</p>
                                            </div>
                                            <button
                                                onClick={() => removeGuestMeal(guest._id || guest.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-rose-600 p-2.5 rounded-xl hover:bg-rose-300/40 dark:hover:bg-rose-950/20 active:scale-90"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Summary Card */}
                    <Card className="p-0 overflow-hidden shadow-premium border-transparent bg-gradient-to-br from-indigo-600 via-indigo-700 to-primary-800 h-fit relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-black/10 rounded-full -mr-16 -mt-16 blur-2xl transition-transform duration-700"></div>

                        <div className="p-6 sm:p-8 border-b border-white/10 bg-black/10">
                            <div className="flex items-center gap-3 mb-1">
                                <TrendingUp size={14} className="text-indigo-300" />
                                <h3 className="font-black text-white/50 uppercase text-[8px] sm:text-[9px] tracking-[0.3em]">Personal Summary</h3>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase">Impact Card</h2>
                        </div>

                        <div className="p-6 sm:p-8 space-y-3 sm:space-y-4">
                            <div className="flex items-center justify-between p-4 bg-black/10 rounded-2xl border border-white/10 backdrop-blur-md">
                                <div>
                                    <p className="font-black text-white text-sm tracking-tight">Guest Liability</p>
                                    <p className="text-[9px] font-black text-indigo-200/50 uppercase tracking-widest mt-0.5">{myGuestMeals.length} External Session{myGuestMeals.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="text-right">
                                    <span className="font-black text-white text-lg font-mono">₹{myGuestTotal}</span>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-white/10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-indigo-200/50 uppercase tracking-[0.2em]">Estimate for this month</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-4xl font-black text-white tracking-tighter font-mono">₹{myGuestTotal}</span>
                                        <div className="p-2 bg-white/20 rounded-xl border border-white/30 backdrop-blur-sm">
                                            <Sparkles size={18} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Floating Action Button (FAB) for Mobile */}
            <button
                onClick={() => setShowGuestDialog(true)}
                className="md:hidden fixed bottom-8 right-6 z-50 w-16 h-16 bg-gradient-to-br from-indigo-600 to-primary-600 text-white rounded-3xl shadow-2xl shadow-indigo-500/40 flex items-center justify-center transition-all active:rotate-12"
            >
                <Plus size={28} strokeWidth={3} />
            </button>

            {/* Add Guest Dialog - WOW Premium Style */}
            {showGuestDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <div
                            onClick={() => setShowGuestDialog(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        />
                        <div
                            className="relative w-full max-w-4xl group my-auto"
                        >
                            {/* Animated Background Glow */}

                            
                            <Card 
                                className="p-6 md:p-8 shadow-3xl shadow-black/60 border-indigo-300/30 bg-white dark:bg-slate-900 overflow-hidden relative rounded-[1.5rem] sm:rounded-[2.5rem] max-h-[80vh] flex flex-col"
                                innerClassName="flex flex-col h-full min-h-0"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-125 transition-transform duration-700">
                                    <Sparkles size={160} />
                                </div>

                                <div className="flex justify-between items-start mb-4 md:mb-6 flex-shrink-0">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles size={16} className="text-primary-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em]">Guest Registration</span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">Add Guest Record</h3>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tight">Real-time dynamic pricing applied</p>
                                    </div>
                                     <button
                                        onClick={() => setShowGuestDialog(false)}
                                        className="p-2 md:p-3 bg-indigo-300/40 dark:bg-slate-800 text-indigo-600 hover:text-rose-600 dark:hover:text-rose-400 rounded-2xl transition-all active:scale-90 hover:rotate-90 duration-300 shadow-inner border border-indigo-400/20"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 min-h-0">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Target Date</label>
                                            <div className="relative group/input">
                                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-primary-500 transition-colors" />
                                                <input
                                                    type="date"
                                                    value={guestDate}
                                                    onChange={(e) => setGuestDate(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-indigo-300/40 dark:bg-slate-950 border border-indigo-300/30 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none text-slate-900 dark:text-slate-100 font-black uppercase tracking-tight transition-all"
                                                />
                                            </div>
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
                                                            "p-4 rounded-[1.5rem] border-2 transition-all font-black uppercase tracking-widest text-[10px] flex flex-col items-center justify-center gap-1.5 relative overflow-hidden",
                                                            guestMealTime === time
                                                                ? "border-primary-500 bg-primary-500 text-white shadow-xl shadow-primary-500/30 scale-105"
                                                                : "border-indigo-400/30 dark:border-white/10 bg-indigo-300/40 dark:bg-slate-900/60 text-indigo-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-slate-300"
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
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {Object.entries(guestMealLabels)
                                                .filter(([key]) => ['fish', 'egg', 'veg', 'meat'].includes(key))
                                                .map(([key, label]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedMealType(key)}
                                                        className={cn(
                                                            "p-4 rounded-[1.5rem] border-2 transition-all group flex flex-col items-center justify-center gap-1.5 relative overflow-hidden",
                                                            selectedMealType === key
                                                                ? "border-primary-500 bg-primary-500 text-white shadow-xl shadow-primary-500/30 scale-105"
                                                                : "border-indigo-200/50 dark:border-white/5 bg-indigo-200/30 dark:bg-slate-950/50 text-indigo-400 hover:border-indigo-300 hover:bg-indigo-300/40 dark:hover:bg-slate-800"
                                                        )}
                                                    >
                                                        {selectedMealType === key && (
                                                            <div
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

                                <div className="flex gap-4 mt-auto pt-4 md:pt-6 border-t border-slate-100 dark:border-white/5 flex-shrink-0">
                                    <button
                                        onClick={() => setShowGuestDialog(false)}
                                        className="flex-1 py-4 bg-indigo-300/40 dark:bg-slate-800 text-indigo-500 font-black uppercase tracking-widest text-xs rounded-[1.5rem] hover:bg-rose-300/40 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-all active:scale-95"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={handleAddGuest}
                                        className="flex-[2] py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-[1.5rem] shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/60 transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                                    >
                                        <div className="absolute inset-0 bg-indigo-300/40 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                                        Confirm Registration <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default MemberMeals;


