import { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Plus, Trash2, Users, TrendingUp, Sparkles, ArrowRight, UtensilsCrossed, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import MealMonthlySheet from '../../components/MealMonthlySheet';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { MESS_CONFIG } from '../../config';

const MemberMeals = () => {
    const { user } = useAuth();
    const {
        members, meals, guestMeals, addMeal, removeMeal,
        addGuestMeal, removeGuestMeal, globalMonth, setGlobalMonth
    } = useData();
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
        if (memberId !== user.id) return;

        if (shouldAdd) {
            addMeal(dateStr, [memberId], type);
        } else {
            removeMeal(dateStr, memberId, type);
        }
    };

    // Guest meal helpers from global config
    const { guestMealPrices, guestMealIcons, guestMealLabels } = useMemo(() => ({
        guestMealPrices: MESS_CONFIG.GUEST_CONFIG.PRICES,
        guestMealIcons: MESS_CONFIG.GUEST_CONFIG.ICONS,
        guestMealLabels: MESS_CONFIG.GUEST_CONFIG.LABELS
    }), []);

    const handleAddGuest = async () => {
        if (!selectedMealType) {
            alert('⚠️ Please select a menu item!');
            return;
        }

        try {
            await addGuestMeal(guestDate, user.id, selectedMealType, guestMealTime);
            setShowGuestDialog(false);
            setSelectedMealType('meat');
            setGuestMealTime('lunch');
        } catch (error) {
            console.error('Failed to add guest meal:', error);
            alert(`Error sharing guest meal: ${error.response?.data?.message || error.message}`);
        }
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 border-l-8 border-l-indigo-500 shadow-sm p-8 rounded-[2rem] border border-slate-200/50 dark:border-white/5 transition-colors">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">My Meal Registry</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Manage your daily presence and guest logs</p>
                </div>

                <div className="flex items-center gap-3 bg-[#f4f7ff] dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                        <Calendar size={18} className="text-indigo-500" />
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="bg-transparent outline-none text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight"
                    />
                </div>
            </div>

            {/* Regular Meals Monthly Sheet */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 px-6 py-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Billing Policy:</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-black">{MESS_CONFIG.MIN_MEALS_PER_MONTH} MEALS MINIMUM</span>
                        PER MONTH
                    </div>
                </div>
                <MealMonthlySheet
                    members={currentMember}
                    meals={meals}
                    selectedDate={selectedDate}
                    onToggleMeal={handleToggleMeal}
                />
            </div>

            {/* Guest Meals Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-100 dark:bg-primary-950/40 rounded-2xl">
                            <Users size={24} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Guest Records</h2>
                    </div>

                    <Button
                        onClick={() => setShowGuestDialog(true)}
                        className="flex items-center gap-2 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        <Plus size={16} /> Record Guest Meal
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Guest Meals List */}
                    <Card className="lg:col-span-2 p-0 overflow-hidden shadow-sm border-slate-200/60 dark:border-white/5 relative bg-white dark:bg-slate-900/40">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase text-[10px] tracking-[0.2em]">Personal Guest Ledger</h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 scrollbar-hide">
                            {myGuestMeals.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-white/10">
                                        <Info size={24} className="text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No guest records found for this month</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {myGuestMeals.map((guest, idx) => (
                                        <motion.div
                                            key={guest._id || guest.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                                    {guestMealIcons[guest.guestMealType]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                                        {guestMealLabels[guest.guestMealType]}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                        <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(guest.date), 'MMM dd')}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800"></span>
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
                                                    className="opacity-0 group-hover:opacity-100 transition-all text-slate-300 hover:text-red-500 p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-90"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </Card>

                    {/* Summary Card */}
                    <Card className="p-0 overflow-hidden shadow-premium border-transparent bg-gradient-to-br from-indigo-600 via-indigo-700 to-primary-800 h-fit relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl transition-transform duration-700"></div>

                        <div className="p-8 border-b border-white/10 bg-black/10">
                            <div className="flex items-center gap-3 mb-1">
                                <TrendingUp size={16} className="text-indigo-300" />
                                <h3 className="font-black text-white/60 uppercase text-[9px] tracking-[0.3em]">Personal Summary</h3>
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Financial Impact</h2>
                        </div>

                        <div className="p-8 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
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

            {/* Add Guest Dialog */}
            <AnimatePresence>
                {showGuestDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowGuestDialog(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl"
                        >
                            <Card className="p-10 shadow-2xl shadow-black/50 border-white/10 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                    <UtensilsCrossed size={160} />
                                </div>

                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles size={16} className="text-indigo-500" />
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Quick Entry</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Registry Extra Meal</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowGuestDialog(false)}
                                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all active:scale-95"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Target Date</label>
                                            <input
                                                type="date"
                                                value={guestDate}
                                                onChange={(e) => setGuestDate(e.target.value)}
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 dark:text-slate-100 font-black uppercase tracking-tight transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Session Timing</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['lunch', 'dinner'].map(time => (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        onClick={() => setGuestMealTime(time)}
                                                        className={cn(
                                                            "p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[10px]",
                                                            guestMealTime === time
                                                                ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 shadow-lg shadow-indigo-500/10"
                                                                : "border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50 text-slate-400 hover:border-slate-200"
                                                        )}
                                                    >
                                                        {time === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Select Menu Item</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(guestMealLabels)
                                                .filter(([key]) => ['fish', 'egg', 'veg', 'meat'].includes(key))
                                                .map(([key, label]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedMealType(key)}
                                                        className={cn(
                                                            "p-5 rounded-3xl border-2 transition-all group flex flex-col items-center justify-center gap-1",
                                                            selectedMealType === key
                                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-xl shadow-emerald-500/10 hover:scale-[1.02]"
                                                                : "border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50 text-slate-400 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <div className="text-3xl mb-1 transition-transform group-hover:scale-125 duration-500">{guestMealIcons[key]}</div>
                                                        <div className="font-black text-[10px] uppercase tracking-widest">{label}</div>
                                                        <div className="text-sm font-black mt-1">₹{guestMealPrices[key]}</div>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-12">
                                    <button
                                        onClick={() => setShowGuestDialog(false)}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddGuest}
                                        className="flex-2 py-4 bg-gradient-to-r from-indigo-600 to-primary-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Confirm Record <ArrowRight size={16} />
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

export default MemberMeals;
