import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Clock from '../../components/ui/Clock';
import AvatarPicker, { getAvatarUrl } from '../../components/ui/AvatarPicker';
import { Wallet, Utensils, ShoppingCart, Star, TrendingUp, Calendar as CalendarIcon, Lock, Eye, EyeOff, Check, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { MESS_CONFIG } from '../../config';
import api from '../../lib/api';
import Skeleton from '../../components/ui/Skeleton';
import BirthdayWidget from '../../components/BirthdayWidget';

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

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [pwStatus, setPwStatus] = useState(null);
    const [pwLoading, setPwLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwStatus(null);

        if (newPassword.length < 4) {
            setPwStatus({ type: 'error', message: 'New password must be at least 4 characters' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwStatus({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        setPwLoading(true);
        try {
            const res = await api.patch('/auth/change-password', { currentPassword, newPassword });
            setPwStatus({ type: 'success', message: res.data.message || 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPwStatus({ type: 'error', message: err.response?.data?.message || 'Failed to change password' });
        } finally {
            setPwLoading(false);
        }
    };

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
            day => day.assignedMemberId === user?.id && day.status === 'approved'
        );
    }, [marketSchedule, user?.id, globalMonth]);

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
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-indigo-300/40 dark:bg-slate-900 shadow-sm p-5 sm:p-8 rounded-[1.5rem] border border-indigo-300/30 dark:border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-4 sm:gap-6">
                    {/* Avatar */}
                    <AvatarPicker
                        currentAvatar={currentMember?.avatar || avatarSeed}
                        memberId={user.id}
                        onSaved={(seed) => setAvatarSeed(seed)}
                    />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                            Namaste, <span className="text-indigo-600 dark:text-indigo-400">{user.name}</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                            Activity overview for <span className="text-indigo-600 bg-indigo-300/40 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-300/30 dark:border-indigo-800/30 font-black">{monthLabel}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-300/40 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-sm">
                    <Star size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Active Member</span>
                </div>
            </div>

            {/* Birthday Spotlight */}
            <BirthdayWidget />

            {/* Clock Component */}
            <div className="rounded-[1.5rem] overflow-hidden shadow-sm border border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 backdrop-blur-xl dark:bg-slate-900/40">
                <Clock />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loadingDaily && meals.length === 0 ? (
                    <>
                        <Skeleton.Card className="h-48" />
                        <Skeleton.Card className="h-48" />
                        <Skeleton.Card className="h-48" />
                        <Skeleton.Card className="h-48" />
                    </>
                ) : (
                    <>
                        <Card className="p-6 md:p-8 group hover:-translate-y-1 transition-all duration-500">
                            <div className="flex items-start justify-between mb-4">
                                 <div className="p-4 rounded-2xl bg-indigo-300/40 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-500/20 group-hover:scale-110 transition-transform shadow-inner border border-indigo-400/20">
                                    <Utensils size={24} />
                                </div>
                                <TrendingUp size={16} className="text-slate-300 dark:text-slate-700" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monthly Consumption</p>
                            <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2 tracking-tight">
                                {myMeals} <span className="text-sm font-bold opacity-60">Meals</span>
                            </h3>
                            {myMeals < MIN_MEALS && (
                                <p className="text-[10px] font-black text-rose-500/80 dark:text-rose-400/80 mt-1 uppercase tracking-widest italic group-hover:scale-105 transition-transform origin-left">
                                    * {MIN_MEALS} meal minimum applies
                                </p>
                            )}
                        </Card>

                        <Card className="p-6 md:p-8 group hover:-translate-y-1 transition-all duration-500">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-4 rounded-2xl bg-emerald-300/40 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 group-hover:scale-110 transition-transform border border-emerald-400/20">
                                    <Wallet size={24} />
                                </div>
                                <TrendingUp size={16} className="text-slate-300 dark:text-slate-700" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Credit (Dep + Bills)</p>
                            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">₹{myMonthlyDeposit + myBillPayments}</h3>
                            <p className="text-[10px] font-black text-emerald-500/60 dark:text-emerald-400/60 mt-1 uppercase tracking-widest italic">Gen: ₹{myMonthlyDeposit}</p>
                        </Card>

                        <Card className="p-6 md:p-8 group hover:-translate-y-1 transition-all duration-500">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-4 rounded-2xl bg-amber-300/40 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20 group-hover:scale-110 transition-transform border border-amber-400/20">
                                    <ShoppingCart size={24} />
                                </div>
                                <TrendingUp size={16} className="text-slate-300 dark:text-slate-700" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Market Spend</p>
                            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2 tracking-tight">₹{totalMarketAmount}</h3>
                        </Card>

                        <Card className="p-6 md:p-8 group hover:-translate-y-1 transition-all duration-500">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-4 rounded-2xl bg-purple-300/40 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20 group-hover:scale-110 transition-transform border border-purple-400/20">
                                    <Utensils size={24} />
                                </div>
                                <TrendingUp size={16} className="text-slate-300 dark:text-slate-700" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Guest Liability</p>
                            <div className="flex items-end justify-between mt-2">
                                <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{myGuestMeals.length} <span className="text-sm font-bold opacity-60">Meals</span></h3>
                                <button
                                    onClick={() => window.location.href = '/member-meals'}
                                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/30 transition-all active:scale-90 flex items-center justify-center"
                                    title="Add Guest Meal"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                </button>
                            </div>
                            <p className="text-[10px] font-black text-purple-500/60 dark:text-purple-400/60 mt-1 uppercase tracking-widest italic">Est. Cost: ₹{totalGuestAmount}</p>
                        </Card>
                    </>
                )}
            </div>

            {/* Guest Meals Detail Card */}
            {myGuestMeals.length > 0 && (
                    <div>
                        <Card className="p-0 overflow-hidden shadow-sm border-indigo-300/30 bg-indigo-300/40 backdrop-blur-xl dark:bg-slate-900/40 mt-8">
                            <div className="p-8 border-b border-indigo-300/30 dark:border-white/5 flex items-center justify-between bg-indigo-300/40 dark:bg-slate-900/50">
                                <div className="flex items-center gap-4">
                                     <div className="p-3 bg-purple-300/40 dark:bg-purple-900/30 rounded-2xl shadow-inner border border-purple-400/20">
                                        <Utensils className="text-purple-600 dark:text-purple-400" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Guest Log</h2>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Detailed breakdown of visiting meals</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black bg-purple-300/40 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400 px-4 py-2 rounded-xl border border-purple-300/30 dark:border-purple-500/10 tracking-widest uppercase">
                                    {myGuestMeals.length} Total • ₹{totalGuestAmount}
                                </span>
                            </div>
                            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide">
                                {myGuestMeals.map((guest, idx) => {
                                    const guestIcons = MESS_CONFIG.GUEST_CONFIG.ICONS;
                                    const mealTimeIcons = { lunch: '☀️', dinner: '🌙' };

                                    return (
                                        <div
                                            key={`guest-${guest._id || idx}`}
                                            className="flex items-center justify-between p-6 bg-indigo-300/40 backdrop-blur-lg dark:bg-slate-900/60 rounded-[1.5rem] hover:bg-indigo-300/60 dark:hover:bg-white/5 transition-all border border-indigo-300/30 dark:border-white/5 group"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-300/30 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                    {guestIcons[guest.guestMealType]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-slate-50 capitalize tracking-tight flex items-center gap-3">
                                                        {guest.guestMealType}
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-300/40 dark:bg-slate-800 font-bold opacity-60">
                                                            {mealTimeIcons[guest.mealTime]} {guest.mealTime}
                                                        </span>
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                                        {format(new Date(guest.date), 'dd MMMM yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-purple-600 dark:text-purple-400 tracking-tight">₹{guestMealPrices[guest.guestMealType]}</p>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Left Card - Market Expenses History */}
                    <Card className="p-0 overflow-hidden shadow-sm border-indigo-300/30 bg-indigo-300/40 backdrop-blur-xl dark:bg-slate-900/40">
                        <div className="p-8 border-b border-indigo-300/30 dark:border-white/5 flex items-center justify-between bg-indigo-300/40 dark:bg-slate-900/50">
                            <div className="flex items-center gap-4">
                                 <div className="p-3 bg-amber-300/40 dark:bg-amber-900/30 rounded-2xl shadow-inner border border-amber-400/20">
                                    <ShoppingCart className="text-amber-600 dark:text-amber-400" size={20} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Market Outlay</h2>
                            </div>
                            <span className="text-[10px] font-black bg-amber-300/40 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 px-4 py-2 rounded-xl border border-amber-300/30 dark:border-amber-500/10 tracking-widest">
                                ₹{totalMarketAmount}
                            </span>
                        </div>
                        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                            {myMarketExpenses.length > 0 ? (
                                myMarketExpenses.map((expense, idx) => (
                                    <div
                                        key={`expense-${expense._id || idx}`}
                                        className="flex items-center justify-between p-5 bg-indigo-300/40 dark:bg-slate-900/60 rounded-2xl hover:bg-indigo-300/60 dark:hover:bg-white/5 transition-all border border-indigo-300/30 dark:border-white/5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-300/40 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-400/20">
                                                <Wallet size={16} className="text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 dark:text-slate-50 tracking-tight">
                                                    {format(new Date(expense.date), 'dd MMM yyyy')}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{expense.description || 'Market Purchase'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">₹{expense.amount}</p>
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center opacity-40">
                                    <ShoppingCart size={32} className="mx-auto mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No verified purchases</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Right Card - Market Duty Days */}
                    <Card className="p-0 overflow-hidden shadow-sm border-indigo-300/30 bg-indigo-300/40 backdrop-blur-xl dark:bg-slate-900/40">
                        <div className="p-8 border-b border-indigo-300/30 dark:border-white/5 flex items-center justify-between bg-indigo-300/40 dark:bg-slate-900/50">
                            <div className="flex items-center gap-4">
                                 <div className="p-3 bg-indigo-300/40 dark:bg-indigo-900/30 rounded-2xl shadow-inner border border-indigo-400/20">
                                    <CalendarIcon className="text-indigo-600 dark:text-indigo-400" size={20} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Duty Roster</h2>
                            </div>
                            <span className="text-[10px] font-black bg-indigo-300/40 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-400 px-4 py-2 rounded-xl border border-indigo-300/30 dark:border-indigo-500/10 tracking-widest">
                                {myMarketDays.length} SESSIONS
                            </span>
                        </div>
                        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                            {myMarketDays.length > 0 ? (
                                myMarketDays.map((day, idx) => (
                                    <div
                                        key={`duty-${day.date}-${idx}`}
                                        className="flex items-center justify-between p-5 bg-indigo-300/40 dark:bg-slate-900/60 rounded-2xl hover:bg-indigo-300/60 dark:hover:bg-white/5 transition-all border border-indigo-300/30 dark:border-white/5"
                                    >
                                        <div className="flex items-center gap-4">
                                             <div className="w-10 h-10 rounded-xl bg-indigo-300/30 dark:bg-indigo-900/20 flex items-center justify-center">
                                                <ShoppingCart size={16} className="text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 dark:text-slate-50 tracking-tight">
                                                    {format(new Date(day.date), 'dd MMM yyyy')}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">Shift Completed</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Confirmed</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center opacity-40">
                                    <CalendarIcon size={32} className="mx-auto mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No completed shifts</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Change Password Section */}
            <Card className="p-0 overflow-hidden shadow-sm border-indigo-300/30 bg-indigo-300/40 backdrop-blur-xl dark:bg-slate-900/40 mt-8">
                <div className="p-8 border-b border-indigo-300/30 dark:border-white/5 flex items-center gap-4 bg-indigo-300/40 dark:bg-slate-900/50">
                     <div className="p-3 bg-rose-300/40 dark:bg-rose-900/30 rounded-2xl shadow-inner border border-rose-400/20">
                        <Lock className="text-rose-700 dark:text-rose-400" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Change Password</h2>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Update your login credentials</p>
                    </div>
                </div>
                <form onSubmit={handlePasswordChange} className="p-8 space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPw ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Enter current password"
                                className="w-full px-4 py-3 rounded-xl border border-indigo-300/30 dark:border-white/10 bg-indigo-300/40 dark:bg-slate-800/50 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all pr-10"
                            />
                            <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPw ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Min 4 characters"
                                    className="w-full px-4 py-3 rounded-xl border border-indigo-300/30 dark:border-white/10 bg-indigo-300/40 dark:bg-slate-800/50 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all pr-10"
                                />
                                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Confirm New Password</label>
                            <input
                                type={showNewPw ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Re-enter new password"
                                className="w-full px-4 py-3 rounded-xl border border-indigo-300/30 dark:border-white/10 bg-indigo-300/40 dark:bg-slate-800/50 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                    {pwStatus && (
                        <div className={cn(
                            "text-xs font-black px-4 py-3 rounded-xl border",
                            pwStatus.type === 'success'
                                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-300/40 dark:bg-emerald-900/20 border-emerald-300/30 dark:border-emerald-500/20"
                                : "text-rose-700 dark:text-rose-400 bg-rose-300/40 dark:bg-red-900/20 border-rose-300/30 dark:border-rose-500/20"
                        )}>
                            {pwStatus.type === 'success' && <Check size={14} className="inline mr-1" />}
                            {pwStatus.message}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={pwLoading}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {pwLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default MemberDashboard;


