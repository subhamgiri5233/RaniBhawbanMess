import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Clock from '../../components/ui/Clock';
import AvatarPicker, { getAvatarUrl } from '../../components/ui/AvatarPicker';
import { Wallet, Utensils, ShoppingCart, Star, TrendingUp, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { MESS_CONFIG } from '../../config';
import api from '../../lib/api';
import Skeleton from '../../components/ui/Skeleton';
import BirthdayWidget from '../../components/BirthdayWidget';
import NoticeBoard from '../../components/NoticeBoard';

const MemberDashboard = () => {
    const { user } = useAuth();
    const { members, expenses, meals, guestMeals, marketSchedule, addExpense, globalMonth, settings, loadingDaily } = useData();

    // Helper to get setting value
    const getSettingValue = (key, fallback) => {
        const s = settings.find(item => item.key === key);
        return s ? Number(s.value) : fallback;
    };

    const MIN_MEALS = getSettingValue('min_meals_month', MESS_CONFIG.MIN_MEALS_PER_MONTH);

    // Avatar state — read from members list
    const [avatarSeed, setAvatarSeed] = useState(null);

    // Mock calculations for member
    const myMeals = useMemo(() => {
        if (!Array.isArray(meals)) return 0;
        return meals.filter(m => m.memberId === user?.id || m.memberId === user?._id).length;
    }, [meals, user?.id, user?._id]);

    const currentMember = useMemo(() => {
        if (!Array.isArray(members)) return null;
        return members.find(m => (m._id === user?.id || m.id === user?.id || m.userId === user?.id));
    }, [members, user?.id]);

    const myMonthlyDeposit = useMemo(() => {
        if (!Array.isArray(expenses)) return 0;
        return expenses
            .filter(e => e.category === 'deposit' && (e.paidBy === user?.name || e.paidBy === user?.id || e.paidBy === currentMember?._id))
            .reduce((sum, e) => sum + e.amount, 0);
    }, [expenses, user?.id, user?.name, currentMember?._id]);

    // Calculate market history - get approved market days for this member SPECIFIC to globalMonth
    const myMarketDays = useMemo(() => {
        return (marketSchedule[globalMonth] || []).filter(
            day => (day.assignedMemberId === user?.id || day.assignedMemberId === user?.userId || day.assignedMemberId === user?._id) && day.status === 'approved'
        );
    }, [marketSchedule, user?.id, user?.userId, user?._id, globalMonth]);

    const monthLabel = useMemo(() => {
        if (!globalMonth || typeof globalMonth !== 'string' || !globalMonth.includes('-')) {
            return format(new Date(), 'MMMM yyyy');
        }
        const [year, month] = globalMonth.split('-');
        return format(new Date(year, month - 1), 'MMMM yyyy');
    }, [globalMonth]);

    // Calculate total market expenses for this member (approved market expenses)
    const myMarketExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return [];
        return expenses.filter(
            e => (e.paidBy === user?.id || e.paidBy === user?._id || e.paidBy === user?.userId || e.paidBy === user?.name || e.paidBy === currentMember?._id) && e.category === 'market'
        );
    }, [expenses, user?.id, user?._id, user?.userId, user?.name, currentMember?._id]);

    const totalMarketAmount = useMemo(() => {
        return myMarketExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    }, [myMarketExpenses]);

    // Calculate guest meals for this member
    const myGuestMeals = useMemo(() => (guestMeals || []).filter(g => g.memberId === user.id), [guestMeals, user.id]);

    // Use dynamic settings for prices
    const guestMealPrices = useMemo(() => ({
        fish: getSettingValue('guest_price_fish', MESS_CONFIG.GUEST_CONFIG.PRICES.fish),
        meat: getSettingValue('guest_price_meat', MESS_CONFIG.GUEST_CONFIG.PRICES.meat),
        veg: getSettingValue('guest_price_veg', MESS_CONFIG.GUEST_CONFIG.PRICES.veg),
        egg: getSettingValue('guest_price_egg', MESS_CONFIG.GUEST_CONFIG.PRICES.egg)
    }), [settings]);

    const totalGuestAmount = useMemo(() => myGuestMeals.reduce((sum, g) => sum + (guestMealPrices[g.guestMealType] || 0), 0), [myGuestMeals, guestMealPrices]);

    // Calculate total bill payments (Gas, Wifi, Electric) for this member SPECIFIC to globalMonth
    const myBillPayments = useMemo(() => {
        if (!Array.isArray(expenses)) return 0;
        return expenses
            .filter(e =>
                (e.paidBy === user?.id || e.paidBy === user?._id || e.paidBy === user?.userId || e.paidBy === user?.name || e.paidBy === currentMember?._id) &&
                ['gas', 'wifi', 'electric'].includes(e.category)
            )
            .reduce((sum, e) => sum + (e.amount || 0), 0);
    }, [expenses, user?.id, user?._id, user?.userId, user?.name, currentMember?._id]);

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-white/80 dark:bg-slate-900/80 shadow-sm p-5 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-4 sm:gap-6">
                    {/* Avatar */}
                    <AvatarPicker
                        currentAvatar={currentMember?.avatar || avatarSeed}
                        memberId={user.id}
                        onSaved={(seed) => setAvatarSeed(seed)}
                    />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                            Namaste, <span className="text-indigo-600 dark:text-indigo-400">{user.name}</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                            Activity overview for <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 font-extrabold">{monthLabel}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-sm">
                    <Star size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Active Member</span>
                </div>
            </div>

            {/* Birthday Spotlight */}
            <BirthdayWidget />

            {/* Clock Component */}
            <Clock />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {loadingDaily && meals.length === 0 ? (
                    <>
                        <Skeleton.Card className="h-28" />
                        <Skeleton.Card className="h-28" />
                        <Skeleton.Card className="h-28" />
                        <Skeleton.Card className="h-28" />
                    </>
                ) : (
                    <>
                        {/* 1. Monthly Consumption */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/5 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Monthly Meals</span>
                                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <Utensils size={14} />
                                </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                                {myMeals} <span className="text-xs font-bold text-slate-400">Meals</span>
                            </div>
                            {myMeals < MIN_MEALS ? (
                                <p className="text-[9px] font-bold text-rose-500 dark:text-rose-400 mt-1 uppercase tracking-wider truncate">
                                    * {MIN_MEALS} meal minimum
                                </p>
                            ) : (
                                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-wider truncate">
                                    Quota satisfied
                                </p>
                            )}
                        </div>

                        {/* 2. Total Credit */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/5 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Total Credit</span>
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <Wallet size={14} />
                                </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                ₹{myMonthlyDeposit + myBillPayments}
                            </div>
                            <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/70 mt-1 uppercase tracking-wider truncate">
                                Vault Gen: ₹{myMonthlyDeposit}
                            </p>
                        </div>

                        {/* 3. Market Spend */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/5 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Market Spend</span>
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                    <ShoppingCart size={14} />
                                </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                                ₹{totalMarketAmount}
                            </div>
                            <p className="text-[9px] font-bold text-amber-600/70 dark:text-amber-400/70 mt-1 uppercase tracking-wider truncate">
                                Spent on duty purchases
                            </p>
                        </div>

                        {/* 4. Guest Liability */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/5 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Guest Liability</span>
                                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                                    <Utensils size={14} />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                                    {myGuestMeals.length} <span className="text-xs font-bold text-slate-400">Meals</span>
                                </div>
                                <button
                                    onClick={() => window.location.href = '/member-meals'}
                                    className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-sm transition-all active:scale-90 flex items-center justify-center shrink-0"
                                    title="Add Guest Meal"
                                >
                                    <Plus size={13} strokeWidth={2.5} />
                                </button>
                            </div>
                            <p className="text-[9px] font-bold text-purple-600/70 dark:text-purple-400/70 mt-1 uppercase tracking-wider truncate">
                                Est. Cost: ₹{totalGuestAmount}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Guest Meals Detail Card */}
            {myGuestMeals.length > 0 && (
                <div>
                    <Card className="p-0 overflow-hidden shadow-sm mt-8">
                        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/20">
                                    <Utensils size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Guest Log</h2>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Detailed breakdown of visiting meals</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-extrabold bg-purple-500/10 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-xl border border-purple-500/20 tracking-wider uppercase">
                                {myGuestMeals.length} Total • ₹{totalGuestAmount}
                            </span>
                        </div>
                        <div className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {myGuestMeals.map((guest, idx) => {
                                const guestIcons = MESS_CONFIG.GUEST_CONFIG.ICONS;
                                const mealTimeIcons = { lunch: '☀️', dinner: '🌙' };

                                return (
                                    <div
                                        key={`guest-${guest._id || idx}`}
                                        className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-slate-200/60 dark:border-white/5 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
                                                {guestIcons[guest.guestMealType]}
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-900 dark:text-slate-50 capitalize tracking-tight flex items-center gap-2 text-sm">
                                                    {guest.guestMealType}
                                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 font-bold opacity-75">
                                                        {mealTimeIcons[guest.mealTime]} {guest.mealTime}
                                                    </span>
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {format(new Date(guest.date), 'dd MMMM yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">₹{guestMealPrices[guest.guestMealType]}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}

            {/* Market History - Two Tab-like Cards */}
            {(myMarketExpenses.length > 0 || myMarketDays.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-8">
                    {/* Left Card - Market Expenses History */}
                    <Card className="p-0 overflow-hidden shadow-sm">
                        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                                    <ShoppingCart size={18} />
                                </div>
                                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Market Outlay</h2>
                            </div>
                            <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/20 tracking-wider">
                                ₹{totalMarketAmount}
                            </span>
                        </div>
                        <div className="p-4 space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {myMarketExpenses.length > 0 ? (
                                myMarketExpenses.map((expense, idx) => (
                                    <div
                                        key={`expense-${expense._id || idx}`}
                                        className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-slate-200/60 dark:border-white/5"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                                <Wallet size={15} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                                                    {format(new Date(expense.date), 'dd MMM yyyy')}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{expense.description || 'Market Purchase'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">₹{expense.amount}</p>
                                            <p className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider">Verified</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center opacity-40">
                                    <ShoppingCart size={28} className="mx-auto mb-2 text-slate-400" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No verified purchases</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Right Card - Market Duty Days */}
                    <Card className="p-0 overflow-hidden shadow-sm">
                        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                                    <CalendarIcon size={18} />
                                </div>
                                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Duty Roster</h2>
                            </div>
                            <span className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-500/20 tracking-wider uppercase">
                                {myMarketDays.length} SESSIONS
                            </span>
                        </div>
                        <div className="p-4 space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {myMarketDays.length > 0 ? (
                                myMarketDays.map((day, idx) => (
                                    <div
                                        key={`duty-${day.date}-${idx}`}
                                        className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-slate-200/60 dark:border-white/5"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                                <ShoppingCart size={15} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                                                    {format(new Date(day.date), 'dd MMM yyyy')}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Shift Completed</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider">Confirmed</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center opacity-40">
                                    <CalendarIcon size={28} className="mx-auto mb-2 text-slate-400" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No completed shifts</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default MemberDashboard;


