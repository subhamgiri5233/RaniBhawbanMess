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
import NotificationWidget from '../../components/NotificationWidget';
import NoticeBoard from '../../components/NoticeBoard';

const AdminDashboard = () => {
    const { members, expenses, meals, globalMonth, loadingDaily } = useData();
    const navigate = useNavigate();

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

    const stats = useMemo(() => [
        { title: 'Total Members', value: members.length, icon: Users, color: 'text-indigo-700', bg: 'bg-indigo-300/40 dark:bg-blue-950/20' },
        { title: 'Total Meals', value: totalMeals, icon: UtensilsCrossed, color: 'text-orange-700', bg: 'bg-orange-300/40 dark:bg-orange-950/20' },
    ], [members.length, totalMeals]);

    const expenseBreakdown = useMemo(() => [
        { title: 'Market', value: `₹${marketExpenses}`, icon: ShoppingCart, color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-300/40 dark:bg-indigo-950/20' },
        { title: 'Spices', value: `₹${spicesExpenses}`, icon: Flame, color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-300/40 dark:bg-orange-950/20' },
        { title: 'Rice', value: `₹${riceExpenses}`, icon: Wheat, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-300/40 dark:bg-emerald-950/20' },
        { title: 'Other', value: `₹${othersExpenses}`, icon: Package, color: 'text-slate-700 dark:text-slate-400', bg: 'bg-indigo-300/40 dark:bg-slate-900/40' },
    ], [marketExpenses, spicesExpenses, riceExpenses, othersExpenses]);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-5xl rb-header">Dashboard</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest">Authorized Mess Controller Interface</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-300/40 border border-emerald-500/20 rounded-2xl shadow-sm">
                        <TrendingUp size={16} className="text-emerald-600" />
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">System Active</span>
                    </div>
                </div>
            </div>

            {/* Clock Component */}
            <Clock />

            {/* Birthday Spotlight */}
            <BirthdayWidget />

            {/* Smart Notifications */}
            <NotificationWidget />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {(loadingDaily && meals.length === 0) ? (
                    <>
                        <Skeleton.Card className="h-40" />
                        <Skeleton.Card className="h-40" />
                    </>
                ) : (
                    stats.map((stat, index) => (
                        <div key={index}>
                            <Card className={cn(
                                "rb-card p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden",
                                stat.bg === 'bg-indigo-300/40 dark:bg-blue-950/20' ? 'rb-shadow-blue' : 'rb-shadow-orange'
                            )}>
                                {/* Background decoration */}
                                <div className={cn(
                                    "absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 pointer-events-none",
                                    stat.color
                                )}>
                                    <stat.icon size={120} />
                                </div>

                                <div className="relative z-10 flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={cn("p-2.5 rounded-xl bg-indigo-300/40 dark:bg-slate-900/60 backdrop-blur-md shadow-sm", stat.color)}>
                                                <stat.icon size={20} />
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest">{stat.title}</p>
                                        </div>
                                        <h3 className={cn("text-4xl sm:text-6xl rb-header mt-1", stat.color)}>
                                            {stat.value}
                                        </h3>
                                    </div>
                                    <div className="p-2 bg-indigo-300/40 dark:bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border border-indigo-300/30 dark:border-white/5 shadow-sm">
                                        <ArrowUpRight size={16} className="text-indigo-500" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))
                )}
            </div>

            {/* Expense Category Breakdown */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {(loadingDaily && expenses.length === 0) ? (
                    <>
                        <Skeleton.Card className="h-32" />
                        <Skeleton.Card className="h-32" />
                        <Skeleton.Card className="h-32" />
                        <Skeleton.Card className="h-32" />
                    </>
                ) : (
                    expenseBreakdown.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index}>
                                <Card className={cn(
                                    "rb-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden",
                                    item.title === 'Market' ? 'rb-shadow-indigo' :
                                        item.title === 'Spices' ? 'rb-shadow-orange' :
                                            item.title === 'Rice' ? 'rb-shadow-emerald' : 'rb-shadow-indigo'
                                )}>
                                    {/* Background decoration */}
                                    <div className={cn(
                                        "absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 pointer-events-none",
                                        item.color
                                    )}>
                                        <Icon size={100} />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={cn("p-2 rounded-xl bg-indigo-300/40 dark:bg-slate-900/60 backdrop-blur-md shadow-sm", item.color)}>
                                                <Icon size={16} />
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest">{item.title}</p>
                                        </div>
                                        <h3 className={cn("text-2xl sm:text-3xl rb-header mt-1", item.color)}>
                                            {item.value}
                                        </h3>
                                    </div>
                                </Card>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Member Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rb-card p-0 overflow-hidden rb-shadow-blue">
                    <div className="p-6 border-b border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary-300/40 dark:bg-primary-950/40 rounded-xl">
                                <Crown className="text-primary-700 dark:text-primary-400" size={20} />
                            </div>
                            <h2 className="text-xl rb-header">Active Members</h2>
                        </div>
                        <button
                            onClick={() => navigate('/members')}
                            className="text-[10px] font-black uppercase tracking-widest text-primary-700 hover:text-primary-800 flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-300/40 dark:bg-primary-950/20 rounded-xl transition-all border border-indigo-400/20 shadow-sm"
                        >
                            View All <ArrowUpRight size={14} />
                        </button>
                    </div>
                    <div className="overflow-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-indigo-300/40 dark:bg-slate-900/90 backdrop-blur-sm">
                                <tr className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-indigo-300/30 dark:border-white/5">
                                    <th className="p-4 md:p-6">Member Name</th>
                                    <th className="p-4 md:p-6 text-center">Meals</th>
                                    <th className="p-4 md:p-6 text-center">Total Contribution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-300/30 dark:divide-white/5">
                                {loadingDaily && members.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-0">
                                            <Skeleton.Table rows={6} />
                                        </td>
                                    </tr>
                                ) : (
                                    (memberSummary || []).map((member, index) => (
                                        <tr
                                            key={member._id}
                                            className="hover:bg-indigo-300/40 dark:hover:bg-white/5 transition-all group border-b border-indigo-300/30 last:border-0"
                                        >
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center font-black text-xs md:text-sm text-indigo-500 dark:text-slate-400 group-hover:from-primary-600 group-hover:to-primary-700 group-hover:text-white transition-all duration-500 shadow-sm uppercase shrink-0">
                                                        {(member.name || '?').charAt(0)}
                                                    </div>
                                                    <span className="font-black text-slate-900 dark:text-slate-100 tracking-tight text-sm md:text-base">{member.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-300/40 dark:bg-amber-950/20 text-orange-700 dark:text-amber-400 font-black border border-orange-300/30 dark:border-amber-900/30 text-xs md:text-sm">
                                                    {member.totalMeals}
                                                </span>
                                            </td>
                                            <td className="p-4 md:p-6 text-center">
                                                <span className="font-black text-violet-600 dark:text-violet-400 text-sm md:text-lg">₹{member.monthlyDeposit}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Admin Expenses Section */}
                <Card className="rb-card p-0 overflow-hidden rb-shadow-emerald">
                    <div className="p-6 border-b border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-300/40 dark:bg-emerald-950/40 rounded-xl border border-emerald-400/20 shadow-lg shadow-emerald-500/10">
                                <Receipt className="text-emerald-700 dark:text-emerald-400" size={20} />
                            </div>
                            <h2 className="text-xl rb-header">Admin Spends</h2>
                        </div>
                        <button
                            onClick={() => navigate('/expenses')}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-2 px-3 md:px-4 py-2 bg-emerald-300/40 dark:bg-emerald-950/20 rounded-xl transition-all"
                        >
                            View All <ArrowUpRight size={14} />
                        </button>
                    </div>
                    <div className="overflow-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-indigo-300/40 dark:bg-slate-900/90 backdrop-blur-sm">
                                <tr className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-indigo-300/30 dark:border-white/5">
                                    <th className="p-4 md:p-6">Details</th>
                                    <th className="p-4 md:p-6">Amount</th>
                                    <th className="p-4 md:p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-300/30 dark:divide-white/5">
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
            <tr className="border-b dark:border-slate-800/50 last:border-0 hover:bg-indigo-300/40 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3 pr-2">
                    <input
                        type="text"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-indigo-300/40 dark:bg-slate-900 border border-indigo-300/30 dark:border-slate-800 rounded-lg text-xs mb-2 transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:text-slate-200"
                        placeholder="Description"
                    />
                    <select
                        value={editData.category}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        className="w-full px-2 py-1.5 bg-indigo-300/40 dark:bg-slate-900 border border-indigo-300/30 dark:border-slate-800 rounded-lg text-xs transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:text-slate-200"
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
                        className="w-24 px-3 py-2 bg-indigo-300/40 dark:bg-slate-900 border border-indigo-300/30 dark:border-slate-800 rounded-lg text-xs transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:text-slate-200"
                    />
                </td>
                <td className="py-3 text-right align-top">
                    <div className="flex justify-end gap-1">
                        <button onClick={handleSave} className="text-success-600 hover:bg-success-50 dark:hover:bg-success-500/10 p-2 rounded-lg transition-colors">
                            <Save size={18} />
                        </button>
                        <button onClick={() => setIsEditing(false)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-b dark:border-slate-800/50 last:border-0 hover:bg-indigo-300/40 dark:hover:bg-slate-800/50 transition-colors h-16">
            <td className="py-3">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{expense.description || expense.title}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                    {(() => {
                        const cat = (expense.category || 'others').toLowerCase();
                        const config = {
                            market: { icon: ShoppingCart, label: 'Market', cls: 'bg-indigo-300/40 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-300/30' },
                            spices: { icon: Flame, label: 'Spices', cls: 'bg-orange-300/40 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-orange-300/30' },
                            rice: { icon: Wheat, label: 'Rice', cls: 'bg-emerald-300/40 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-300/30' },
                            deposit: { icon: Wallet, label: 'Deposit', cls: 'bg-blue-300/40 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-300/30' },
                            wifi: { icon: Wifi, label: 'WiFi', cls: 'bg-blue-300/40 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-300/30' },
                            gas: { icon: Flame, label: 'Gas', cls: 'bg-rose-300/40 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-300/30' },
                            electric: { icon: Zap, label: 'Electric', cls: 'bg-amber-300/40 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-300/30' },
                            others: { icon: Package, label: 'Other', cls: 'bg-slate-300/40 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-300/30' }
                        };
                        const cfg = config[cat] || config.others;
                        const Icon = cfg.icon;
                        return (
                            <span className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-black uppercase tracking-widest text-[9px]",
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
            <td className="py-3 text-slate-900 dark:text-slate-100 font-black text-sm">₹{expense.amount}</td>
            <td className="py-3 text-right">
                <div className="flex justify-end gap-1">
                    <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-primary-500 p-2 rounded-lg transition-colors hover:bg-primary-50 dark:hover:bg-primary-500/10">
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-500 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10"
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


