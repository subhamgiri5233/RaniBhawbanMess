import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Clock from '../../components/ui/Clock';
import { Users, Receipt, UtensilsCrossed, Pencil, Check, X, Trash2, Save, TrendingUp, ArrowUpRight, Crown, Wallet, ShoppingCart, Flame, Wheat, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const AdminDashboard = () => {
    const { members, expenses, meals, globalMonth } = useData();
    const navigate = useNavigate();

    const memberSummary = useMemo(() => {
        if (!Array.isArray(members) || !Array.isArray(meals) || !Array.isArray(expenses)) return [];
        return members.filter(m => m.role === 'member').map(member => {
            const memberId = member._id || member.id;
            const memberMealCount = meals.filter(m =>
                m.memberId === memberId || m.memberId === member?.userId
            ).length;

            const memberDeposits = expenses.filter(e =>
                e.category === 'deposit' && (e.paidBy === member.name || e.paidBy === memberId || e.paidBy === member?.userId)
            );
            const totalMonthlyDeposit = memberDeposits.reduce((sum, e) => sum + e.amount, 0);

            return {
                ...member,
                totalMeals: memberMealCount,
                monthlyDeposit: totalMonthlyDeposit
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
        return expenses.filter(e => e.category === 'market' && e.paidBy !== 'admin' && e.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [expenses]);

    const spicesExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return 0;
        return expenses.filter(e => e.category === 'spices' && e.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [expenses]);

    const riceExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return 0;
        return expenses.filter(e => e.category === 'rice' && e.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [expenses]);

    const othersExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return 0;
        return expenses.filter(e => e.category === 'others' && e.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [expenses]);

    const stats = useMemo(() => [
        { title: 'Total Members', value: members.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
        { title: 'Total Meals', value: totalMeals, icon: UtensilsCrossed, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20' },
    ], [members.length, totalMeals]);

    const expenseBreakdown = useMemo(() => [
        { title: 'Market', value: `₹${marketExpenses}`, icon: ShoppingCart, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
        { title: 'Spices', value: `₹${spicesExpenses}`, icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/20' },
        { title: 'Rice', value: `₹${riceExpenses}`, icon: Wheat, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
        { title: 'Other', value: `₹${othersExpenses}`, icon: Package, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/40' },
    ], [marketExpenses, spicesExpenses, riceExpenses, othersExpenses]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Dashboard</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Welcome back, Admin. Here's your mess overview.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <TrendingUp size={16} className="text-emerald-500" />
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">System Active</span>
                    </div>
                </div>
            </div>

            {/* Clock Component */}
            <Clock showGita={true} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className={cn(
                            "p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden",
                            "bg-white dark:bg-slate-900/60 border-slate-200/60 dark:border-white/5",
                            stat.bg
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
                                        <div className={cn("p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm", stat.color)}>
                                            <stat.icon size={20} />
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest">{stat.title}</p>
                                    </div>
                                    <h3 className={cn("text-4xl sm:text-5xl font-black tracking-tighter mt-1", stat.color)}>
                                        {stat.value}
                                    </h3>
                                </div>
                                <div className="p-2 bg-white/50 dark:bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 dark:border-white/5 shadow-sm">
                                    <ArrowUpRight size={16} className="text-slate-400" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Expense Category Breakdown */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {expenseBreakdown.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                        >
                            <Card className={cn(
                                "p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden",
                                "bg-white dark:bg-slate-900/60 border-slate-200/60 dark:border-white/5",
                                item.bg
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
                                        <div className={cn("p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm", item.color)}>
                                            <Icon size={16} />
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest">{item.title}</p>
                                    </div>
                                    <h3 className={cn("text-2xl sm:text-3xl font-black tracking-tighter mt-1", item.color)}>
                                        {item.value}
                                    </h3>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Member Summary Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                <Card className="p-0 overflow-hidden border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary-100 dark:bg-primary-950/40 rounded-xl">
                                <Crown className="text-primary-600 dark:text-primary-400" size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight text-base md:text-xl">Active Members</h2>
                        </div>
                        <button
                            onClick={() => navigate('/members')}
                            className="text-[10px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 flex items-center gap-2 px-3 md:px-4 py-2 bg-primary-50 dark:bg-primary-950/20 rounded-xl transition-all"
                        >
                            View All <ArrowUpRight size={14} />
                        </button>
                    </div>
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-white/5">
                                    <th className="p-4 md:p-6">Member Name</th>
                                    <th className="p-4 md:p-6 text-center">Meals</th>
                                    <th className="p-4 md:p-6 text-center">Monthly Deposit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {(memberSummary || []).map((member, index) => (
                                        <motion.tr
                                            key={member._id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + index * 0.05 }}
                                            className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                                        >
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center font-black text-xs md:text-sm text-slate-500 dark:text-slate-400 group-hover:from-primary-500 group-hover:to-primary-600 group-hover:text-white transition-all duration-500 shadow-sm uppercase">
                                                        {(member.name || '?').charAt(0)}
                                                    </div>
                                                    <span className="font-black text-slate-900 dark:text-slate-100 tracking-tight text-sm md:text-base">{member.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-black border border-amber-100 dark:border-amber-900/30 text-xs md:text-sm">
                                                    {member.totalMeals}
                                                </span>
                                            </td>
                                            <td className="p-4 md:p-6 text-center">
                                                <span className="font-black text-violet-600 dark:text-violet-400 text-sm md:text-lg">₹{member.monthlyDeposit}</span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Admin Expenses Section */}
                <Card className="p-0 overflow-hidden border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl">
                                <Receipt className="text-emerald-600 dark:text-emerald-400" size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight text-base md:text-xl">Admin Spends</h2>
                        </div>
                        <button
                            onClick={() => navigate('/expenses')}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-2 px-3 md:px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl transition-all"
                        >
                            View All <ArrowUpRight size={14} />
                        </button>
                    </div>
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-white/5">
                                    <th className="p-4 md:p-6">Details</th>
                                    <th className="p-4 md:p-6">Amount</th>
                                    <th className="p-4 md:p-6 text-right">Actions</th>
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
            </motion.div>
        </motion.div>
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
            <tr className="border-b dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3 pr-2">
                    <input
                        type="text"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs mb-2 transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:text-slate-200"
                        placeholder="Description"
                    />
                    <select
                        value={editData.category}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:text-slate-200"
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
                        className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:text-slate-200"
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
        <tr className="border-b dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors h-16">
            <td className="py-3">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{expense.description || expense.title}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${(expense.category || 'others') === 'market' ? 'bg-blue-100/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                        (expense.category || 'others') === 'spices' ? 'bg-orange-100/50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                            (expense.category || 'others') === 'rice' ? 'bg-green-100/50 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                        }`}>
                        {(expense.category || 'others') === 'market' ? '🛒 Market' :
                            (expense.category || 'others') === 'spices' ? '🌶️ Spices' :
                                (expense.category || 'others') === 'rice' ? '🍚 Rice' :
                                    '📦 Other'}
                    </span>
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
