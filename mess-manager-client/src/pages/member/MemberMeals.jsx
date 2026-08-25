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
            <div className="space-y-6 sm:space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">My Meal Registry</h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">Manage daily presence & guests</p>
                </div>

                <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                        <Calendar size={16} />
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="bg-transparent outline-none text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-tight"
                    />
                </div>
            </div>

            {/* Regular Meals Monthly Sheet */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 px-5 py-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Billing Policy:</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-extrabold shadow-sm">{MIN_MEALS} MEALS MINIMUM</span>
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

            {/* Guest Records Section */}
            <div className="space-y-6 pt-8 border-t border-slate-200/80 dark:border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
                            <Users size={20} />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight uppercase leading-none">Guest Archive</h2>
                    </div>

                    <Button
                        onClick={() => setShowGuestDialog(true)}
                        className="hidden md:flex items-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-500/25 active:scale-95 transition-all text-xs font-extrabold uppercase tracking-wider px-5"
                    >
                        <Plus size={16} /> Record Guest Meal
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Guest Meals List */}
                    <Card className="lg:col-span-2 p-0 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest">My Guest Meal History</h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 custom-scrollbar p-2">
                            {myGuestMeals.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-dashed border-slate-200 dark:border-white/10">
                                        <Info size={20} className="text-slate-400" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No guest records found for this month</p>
                                </div>
                            ) : (
                                myGuestMeals.map((guest, idx) => (
                                    <div
                                        key={`guest-${guest._id || idx}`}
                                        className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-slate-200/60 dark:border-white/5 group my-1"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                                                {guestMealIcons[guest.guestMealType]}
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-sm">
                                                    {guestMealLabels[guest.guestMealType]}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(guest.date), 'MMM dd')}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                    <span className="flex items-center gap-1">{guest.mealTime === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base">₹{guestMealPrices[guest.guestMealType]}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Charged to you</p>
                                            </div>
                                            <button
                                                onClick={() => removeGuestMeal(guest._id || guest.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-500/10 active:scale-90"
                                                title="Delete guest entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Summary Card */}
                    <Card className="p-0 overflow-hidden shadow-md border-transparent bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 h-fit relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-black/10 rounded-full -mr-16 -mt-16 blur-2xl transition-transform duration-700 pointer-events-none"></div>

                        <div className="p-6 border-b border-white/10 bg-black/10">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp size={14} className="text-indigo-200" />
                                <h3 className="font-extrabold text-white/70 uppercase text-[9px] tracking-widest">Personal Summary</h3>
                            </div>
                            <h2 className="text-xl font-extrabold text-white tracking-tight uppercase">Impact Card</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-black/15 rounded-2xl border border-white/10 backdrop-blur-md">
                                <div>
                                    <p className="font-extrabold text-white text-sm tracking-tight">Guest Liability</p>
                                    <p className="text-[9px] font-bold text-indigo-200/70 uppercase tracking-widest mt-0.5">{myGuestMeals.length} External Session{myGuestMeals.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="text-right">
                                    <span className="font-extrabold text-white text-lg font-mono">₹{myGuestTotal}</span>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-white/10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-extrabold text-indigo-200/70 uppercase tracking-wider">Estimate for this month</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-extrabold text-white tracking-tight font-mono">₹{myGuestTotal}</span>
                                        <div className="p-2 bg-white/15 rounded-xl border border-white/20 backdrop-blur-sm">
                                            <Sparkles size={16} className="text-white" />
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
                className="md:hidden fixed bottom-8 right-6 z-50 w-14 h-14 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/40 flex items-center justify-center transition-all active:scale-90"
            >
                <Plus size={24} strokeWidth={2.5} />
            </button>

            {/* Add Guest Dialog */}
            {showGuestDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <div
                            onClick={() => setShowGuestDialog(false)}
                            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
                        />
                        <div
                            className="relative w-full max-w-xl group my-auto"
                        >
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
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">Book an extra meal for visiting friends or family</p>
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
                                                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <input
                                                    type="date"
                                                    value={guestDate}
                                                    onChange={(e) => setGuestDate(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-extrabold text-xs"
                                                />
                                            </div>
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
        </>
    );
};

export default MemberMeals;


