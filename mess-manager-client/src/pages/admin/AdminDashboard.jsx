import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Clock from '../../components/ui/Clock';
import { Users, Receipt, UtensilsCrossed, Pencil, Check, X, Trash2, Save, TrendingUp, ArrowUpRight, Crown, Wallet, ShoppingCart, Flame, Wheat, Package, Wifi, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import Skeleton from '../../components/ui/Skeleton';
import BirthdayWidget from '../../components/BirthdayWidget';
import NoticeBoard from '../../components/NoticeBoard';
import { MESS_CONFIG } from '../../config';

const AdminDashboard = () => {
    const { members, expenses, meals, globalMonth, loadingDaily, settings } = useData();
    const navigate = useNavigate();

    const getSettingValue = useCallback((key, fallback) => {
        if (!settings || !Array.isArray(settings)) return fallback;
        const s = settings.find(s => s.key === key);
        return s ? s.value : fallback;
    }, [settings]);

    const memberSummary = useMemo(() => {
        if (!Array.isArray(members) || !Array.isArray(meals) || !Array.isArray(expenses)) return [];
        return members.filter(m => m.role === 'member').map(member => {
            const memberId = member._id || member.id;
            const memberMealCount = meals.filter(m =>
                m.memberId === memberId || m.memberId === member?.userId
            ).length;

            const memberContribs = expenses.filter(e =>
                (e.paidBy === member.name || e.paidBy === memberId || e.paidBy === member?.userId) &&
                ['deposit', 'market', 'wifi', 'gas', 'electric', 'spices', 'rice'].includes(e.category)
            );
            const totalMonthlyContrib = memberContribs.reduce((sum, e) => sum + (e.amount || 0), 0);

            return {
                ...member,
                totalMeals: memberMealCount,
                monthlyDeposit: totalMonthlyContrib
            };
        });
    }, [members, meals, expenses]);

    const totalExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return 0;
        return expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [expenses]);

    const totalMeals = useMemo(() => {
        if (!Array.isArray(meals)) return 0;
        return meals.length;
    }, [meals]);

    const MIN_MEALS = getSettingValue('min_meals_month', MESS_CONFIG.MIN_MEALS_PER_MONTH);

    const totalAdjustedMeals = useMemo(() => {
        if (!Array.isArray(members) || !Array.isArray(meals)) return 0;
        return members.filter(m => m.role === 'member').reduce((sum, member) => {
            const memberId = member._id || member.id;
            const mealCount = meals.filter(m =>
                m.memberId === memberId || m.memberId === member?.userId
            ).length;
            return sum + Math.max(MIN_MEALS, mealCount);
        }, 0);
    }, [members, meals, MIN_MEALS]);

    // Calculate expenses by category - Only count APPROVED expenses
    const marketExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return 0;
        return expenses.filter(e => e.category === 'market' && e.paidBy !== 'admin' && e.status !== 'rejected').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [expenses]);

    const spicesExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return 0;
        return expenses.filter(e => e.category === 'spices' && e.status !== 'rejected').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [expenses]);

    const riceExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return 0;
        return expenses.filter(e => e.category === 'rice' && e.status !== 'rejected').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [expenses]);

    const othersExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return 0;
        return expenses.filter(e => e.category === 'others' && e.status !== 'rejected').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [expenses]);

    const metrics = useMemo(() => [
        {
            title: 'Total Members',
            value: members.length,
            subtext: `${members.filter(m => m.active !== false).length} Active Residents`,
            icon: Users,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20'
        },
        {
            title: 'Total Meals',
            value: totalMeals,
            subValue: totalAdjustedMeals,
            subtext: totalAdjustedMeals !== totalMeals ? `Adj: ${totalAdjustedMeals} (min applied)` : 'Recorded attendance',
            icon: UtensilsCrossed,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20'
        },
        {
            title: 'Market Spends',
            value: `₹${marketExpenses}`,
            subtext: 'Bazaar Procurement',
            icon: ShoppingCart,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20'
        },
        {
            title: 'Spices & Oil',
            value: `₹${spicesExpenses}`,
            subtext: 'Pantry Seasoning',
            icon: Flame,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20'
        },
        {
            title: 'Rice & Grains',
            value: `₹${riceExpenses}`,
            subtext: 'Staple Inventories',
            icon: Wheat,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
        },
        {
            title: 'Other Expenses',
            value: `₹${othersExpenses}`,
            subtext: 'Mess Maintenance',
            icon: Package,
            color: 'text-slate-600 dark:text-slate-400',
            bg: 'bg-slate-500/10',
            border: 'border-slate-500/20'
        },
    ], [members, totalMeals, totalAdjustedMeals, marketExpenses, spicesExpenses, riceExpenses, othersExpenses]);

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Dashboard</h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Authorized Mess Controller Interface</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-sm">
                        <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">System Active</span>
                    </div>
                </div>
            </div>

            {/* Clock Component */}
            <Clock />

            {/* Birthday Spotlight */}
            <BirthdayWidget />

            {/* Executive KPI Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {(loadingDaily && meals.length === 0) ? (
                    <>
                        <Skeleton.Card className="h-28" />
                        <Skeleton.Card className="h-28" />
                        <Skeleton.Card className="h-28" />
                        <Skeleton.Card className="h-28" />
                        <Skeleton.Card className="h-28" />
                        <Skeleton.Card className="h-28" />
                    </>
                ) : (
                    metrics.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Card key={index} className="p-3.5 sm:p-4 group hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className={cn("p-2 rounded-xl border shadow-sm shrink-0", item.bg, item.color, item.border)}>
                                        <Icon size={15} />
                                    </div>
                                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                                        {item.title}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-baseline justify-between gap-1">
                                        <h3 className={cn("text-xl sm:text-2xl font-extrabold tracking-tight", item.color)}>
                                            {item.value}
                                        </h3>
                                        {item.subValue !== undefined && item.subValue !== item.value && (
                                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20" title="Adjusted Meals">
                                                {item.subValue}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate">
                                        {item.subtext}
                                    </p>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Member Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-0 overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                                <Crown size={18} />
                            </div>
                            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Active Members</h2>
                        </div>
                        <button
                            onClick={() => navigate('/members')}
                            className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 rounded-xl transition-all border border-indigo-500/20 shadow-sm"
                        >
                            View All <ArrowUpRight size={13} />
                        </button>
                    </div>
                    <div className="overflow-auto max-h-[400px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md">
                                <tr className="text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest text-[10px] border-b border-slate-200/80 dark:border-white/5">
                                    <th className="p-4 md:p-5">Member Name</th>
                                    <th className="p-4 md:p-5 text-center">Meals</th>
                                    <th className="p-4 md:p-5 text-center">Total Contribution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loadingDaily && members.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-0">
                                            <Skeleton.Table rows={6} />
                                        </td>
                                    </tr>
                                ) : (
                                    (memberSummary || []).map((member) => (
                                        <tr
                                            key={member._id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group"
                                        >
                                            <td className="p-4 md:p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center font-extrabold text-xs text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm uppercase shrink-0">
                                                        {(member.name || '?').charAt(0)}
                                                    </div>
                                                    <span className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-sm">{member.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-5 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold border border-orange-500/20 text-xs">
                                                    {member.totalMeals}
                                                </span>
                                            </td>
                                            <td className="p-4 md:p-5 text-center">
                                                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm md:text-base">₹{member.monthlyDeposit}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Admin Expenses Section */}
                <Card className="p-0 overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                                <Receipt size={18} />
                            </div>
                            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Admin Spends</h2>
                        </div>
                        <button
                            onClick={() => navigate('/expenses')}
                            className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-xl transition-all border border-emerald-500/20 shadow-sm"
                        >
                            View All <ArrowUpRight size={13} />
                        </button>
                    </div>
                    <div className="overflow-auto max-h-[400px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md">
                                <tr className="text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest text-[10px] border-b border-slate-200/80 dark:border-white/5">
                                    <th className="p-4 md:p-5">Details</th>
                                    <th className="p-4 md:p-5">Amount</th>
                                    <th className="p-4 md:p-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {expenses.filter(e => e.paidBy === 'admin').length > 0 ? (
                                    expenses.filter(e => e.paidBy === 'admin').map((expense) => (
                                        <AdminExpenseRow key={expense._id || expense.id} expense={expense} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm font-medium italic">No admin expenses recorded.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const AdminExpenseRow = ({ expense }) => {
    const { updateExpense } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        description: expense.description || expense.title,
        amount: expense.amount,
        category: expense.category || 'others'
    });

    const handleSave = async () => {
        await updateExpense(expense._id || expense.id, editData);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Do you want to delete?')) return;
        try {
            await api.delete(`/expenses/${expense._id || expense.id}`);
            window.location.reload();
        } catch (err) {
            console.error("Failed to delete expense:", err);
            alert("Failed to delete expense");
        }
    };


    if (isEditing) {
        return (
            <tr className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3 pr-2">
                    <input
                        type="text"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs mb-2 transition-all focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-200"
                        placeholder="Description"
                    />
                    <select
                        value={editData.category}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs transition-all focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-200"
                    >
                        <option value="market">Market</option>
                        <option value="spices">Spices</option>
                        <option value="rice">Rice</option>
                        <option value="others">Other</option>
                    </select>
                </td>
                <td className="py-3 pr-2 align-top">
                    <input
                        type="number"
                        value={editData.amount}
                        onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                        className="w-24 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs transition-all focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-200"
                    />
                </td>
                <td className="py-3 text-right align-top">
                    <div className="flex justify-end gap-1">
                        <button onClick={handleSave} className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 p-2 rounded-lg transition-colors">
                            <Save size={18} />
                        </button>
                        <button onClick={() => setIsEditing(false)} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors h-16">
            <td className="py-3">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{expense.description || expense.title}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                    {(() => {
                        const cat = (expense.category || 'others').toLowerCase();
                        const config = {
                            market: { icon: ShoppingCart, label: 'Market', cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
                            spices: { icon: Flame, label: 'Spices', cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
                            rice: { icon: Wheat, label: 'Rice', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
                            deposit: { icon: Wallet, label: 'Deposit', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
                            wifi: { icon: Wifi, label: 'WiFi', cls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
                            gas: { icon: Flame, label: 'Gas', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
                            electric: { icon: Zap, label: 'Electric', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
                            others: { icon: Package, label: 'Other', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' }
                        };
                        const cfg = config[cat] || config.others;
                        const Icon = cfg.icon;
                        return (
                            <span className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-extrabold uppercase tracking-wider text-[9px]",
                                cfg.cls
                            )}>
                                <Icon size={10} />
                                {cfg.label}
                            </span>
                        );
                    })()}
                    <span className="font-medium">{expense.date}</span>
                </div>
            </td>
            <td className="py-3 text-slate-900 dark:text-slate-100 font-extrabold text-sm">₹{expense.amount}</td>
            <td className="py-3 text-right">
                <div className="flex justify-end gap-1">
                    <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-rose-400 hover:text-rose-500 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        title="Delete Spends"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default AdminDashboard;


