import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Check, Clock, X, TrendingUp, Filter, Trash2, ShoppingCart, Flame, Wheat, Package } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

const Expenses = () => {
    const { expenses, members, approveExpense, approveAllExpenses, deleteExpense, refreshData } = useData();
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedMember, setSelectedMember] = useState('all');

    const getMemberName = (paidBy) => {
        if (paidBy === 'admin') return 'Admin';
        const member = members.find(m => (m._id || m.id) === paidBy);
        return member?.name || 'Unknown';
    };

    // Filter expenses based on category and member
    // Exclude admin market expenses (admin only adds spices/other)
    const filteredExpenses = expenses.filter(expense => {
        // Hide admin market expenses
        if (expense.category === 'market' && expense.paidBy === 'admin') {
            return false;
        }

        const categoryMatch = activeCategory === 'all' || expense.category === activeCategory;
        const memberMatch = selectedMember === 'all' || expense.paidBy === selectedMember;
        return categoryMatch && memberMatch;
    });

    // Category-wise breakdown - Only count APPROVED expenses
    const marketExpenses = expenses.filter(e => e.category === 'market' && e.paidBy !== 'admin' && e.status === 'approved');
    const spicesExpenses = expenses.filter(e => e.category === 'spices' && e.status === 'approved');
    const riceExpenses = expenses.filter(e => e.category === 'rice' && e.status === 'approved');
    const othersExpenses = expenses.filter(e => e.category === 'others' && e.status === 'approved');

    const categoryStats = [
        {
            name: 'Market',
            key: 'market',
            count: marketExpenses.length,
            total: marketExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: ShoppingCart,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-950/20',
            border: 'border-indigo-200/50 dark:border-indigo-800/30'
        },
        {
            name: 'Spices',
            key: 'spices',
            count: spicesExpenses.length,
            total: spicesExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: Flame,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-50 dark:bg-orange-950/20',
            border: 'border-orange-200/50 dark:border-orange-800/30'
        },
        {
            name: 'Rice',
            key: 'rice',
            count: riceExpenses.length,
            total: riceExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: Wheat,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
            border: 'border-emerald-200/50 dark:border-emerald-800/30'
        },
        {
            name: 'Other',
            key: 'others',
            count: othersExpenses.length,
            total: othersExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: Package,
            color: 'text-slate-600 dark:text-slate-400',
            bg: 'bg-slate-50 dark:bg-slate-900/40',
            border: 'border-slate-200/50 dark:border-white/5'
        },
    ];

    const totalApproved = expenses.filter(e => e.status === 'approved').reduce((acc, e) => acc + e.amount, 0);
    const pendingCount = expenses.filter(e => e.status === 'pending').length;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Expense Management</h1>


            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pending Approvals Card */}
                <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-slate-900 dark:to-slate-800/80 border-amber-200/50 dark:border-amber-900/30 overflow-hidden relative group">
                    <div className="absolute -right-6 -top-6 text-amber-500/10 dark:text-amber-500/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <Clock size={120} />
                    </div>
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="text-amber-500 dark:text-amber-400" size={20} />
                                <p className="text-amber-700/70 dark:text-amber-400/70 font-black text-xs uppercase tracking-widest">Pending Approvals</p>
                            </div>
                            <h2 className="text-5xl font-black mt-2 text-amber-600 dark:text-amber-500 tracking-tighter">{pendingCount}</h2>
                        </div>
                        {pendingCount > 0 && (
                            <div className="mt-6">
                                <button
                                    onClick={async () => {
                                        if (window.confirm(`Approve all ${pendingCount} pending expenses?`)) {
                                            const result = await approveAllExpenses();
                                            if (result.success) {
                                                alert(`✅ Successfully approved ${result.modifiedCount} expenses!`);
                                            } else {
                                                alert(`❌ Error: ${result.error}`);
                                            }
                                        }
                                    }}
                                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-sm shadow-amber-500/20 w-fit"
                                >
                                    <Check size={16} />
                                    Approve All
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Member Summary Card */}
                <Card className="p-6 bg-gradient-to-br from-primary-50 to-white dark:from-slate-900 dark:to-slate-900/50 border-primary-200/50 dark:border-primary-900/30">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-primary-500 dark:text-primary-400" size={20} />
                        <p className="text-primary-600/70 dark:text-primary-400/70 font-black text-xs uppercase tracking-widest">Individual Summary</p>
                    </div>

                    {selectedMember !== 'all' ? (
                        <>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                                {getMemberName(selectedMember)}
                            </h3>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                {(() => {
                                    const memberExpenses = expenses.filter(e => e.paidBy === selectedMember && e.category === 'market');
                                    const approved = memberExpenses.filter(e => e.status === 'approved');
                                    const pending = memberExpenses.filter(e => e.status === 'pending');
                                    const approvedTotal = approved.reduce((acc, e) => acc + e.amount, 0);
                                    const pendingTotal = pending.reduce((acc, e) => acc + e.amount, 0);

                                    return (
                                        <>
                                            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                                                <p className="text-xs font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-1">Approved</p>
                                                <p className="font-black text-lg text-emerald-700 dark:text-emerald-400">₹{approvedTotal}</p>
                                            </div>
                                            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30">
                                                <p className="text-xs font-black text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider mb-1">Pending</p>
                                                <p className="font-black text-lg text-amber-700 dark:text-amber-400">₹{pendingTotal}</p>
                                            </div>
                                            <div className="col-span-2 mt-2 pt-4 border-t border-primary-100 dark:border-primary-900/30 flex justify-between items-center">
                                                <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">Total Market Selected:</span>
                                                <span className="font-black text-2xl text-primary-600 dark:text-primary-400">₹{approvedTotal + pendingTotal}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[140px] text-center">
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-3">
                                <Filter className="text-primary-500" size={24} />
                            </div>
                            <p className="text-primary-700 dark:text-primary-400 text-sm font-bold">Select a member below</p>
                            <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">to view their specific contributions</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                {categoryStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card
                            key={stat.key}
                            className={cn(
                                "p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer relative overflow-hidden",
                                activeCategory === stat.key
                                    ? `ring-4 ring-offset-2 dark:ring-offset-slate-900 ${stat.color.replace('text-', 'ring-').split(' ')[0]} bg-white dark:bg-slate-900`
                                    : cn("bg-white dark:bg-slate-900/60 border-slate-200/60 dark:border-white/5", stat.bg)
                            )}
                            onClick={() => setActiveCategory(activeCategory === stat.key ? 'all' : stat.key)}
                        >
                            {/* Background decoration */}
                            <div className={cn(
                                "absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 pointer-events-none",
                                stat.color
                            )}>
                                <Icon size={100} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm", stat.color)}>
                                            <Icon size={16} />
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest">{stat.name}</p>
                                    </div>
                                    <span className="text-[9px] bg-white/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-black tracking-wider uppercase border border-slate-200/50 dark:border-white/5 shadow-sm">
                                        {stat.count} items
                                    </span>
                                </div>
                                <h3 className={cn("text-2xl sm:text-3xl font-black tracking-tighter mt-1", stat.color)}>
                                    ₹{stat.total}
                                </h3>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Filters */}
            <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-100 dark:border-white/5">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-primary-600 dark:text-primary-400" />
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Filters:</span>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-sm font-black transition-all duration-200 uppercase tracking-wider",
                                activeCategory === 'all'
                                    ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            )}
                        >
                            All
                        </button>
                        {categoryStats.map(cat => (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-sm font-black transition-all duration-200 uppercase tracking-wider",
                                    activeCategory === cat.key
                                        ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Member Filter */}
                    <div className="flex-1 min-w-[200px]">
                        <select
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                        >
                            <option value="all">All Members</option>
                            <option value="admin">Admin</option>
                            {members.filter(m => m.role === 'member').map(member => (
                                <option key={member._id || member.id} value={member._id || member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Expense Table */}
            <Card className="overflow-hidden p-0 border-slate-100 dark:border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[11px] border-b border-slate-100 dark:border-white/5">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Paid By</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredExpenses.map(expense => (
                                <tr key={expense._id || expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm font-bold">{expense.date}</td>
                                    <td className="p-4 font-black text-slate-900 dark:text-slate-100">{expense.description || expense.title}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                                            expense.category === 'market' && "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
                                            expense.category === 'spices' && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                                            expense.category === 'rice' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                                            expense.category === 'others' && "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400"
                                        )}>
                                            {expense.category === 'market' && '🛒 Market'}
                                            {expense.category === 'spices' && '🌶️ Spices'}
                                            {expense.category === 'rice' && '🍚 Rice'}
                                            {expense.category === 'others' && '📦 Other'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-black text-slate-900 dark:text-slate-50">₹{expense.amount}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400 text-sm font-bold">{getMemberName(expense.paidBy)}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center w-fit gap-1.5",
                                            expense.status === 'approved' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                                            expense.status === 'rejected' && "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
                                            expense.status === 'pending' && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                                        )}>
                                            {expense.status === 'approved' && <Check size={12} />}
                                            {expense.status === 'rejected' && <X size={12} />}
                                            {expense.status === 'pending' && <Clock size={12} />}
                                            {expense.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {expense.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => approveExpense(expense._id || expense.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white shadow-none"
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to reject this expense? This will delete the record.')) {
                                                            await deleteExpense(expense._id || expense.id);
                                                        }
                                                    }}
                                                    className="bg-red-500 hover:bg-red-600 text-white shadow-none"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                        {expense.status === 'approved' && (
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Do you want to delete?')) {
                                                        await deleteExpense(expense._id || expense.id);
                                                    }
                                                }}
                                                className="p-2 bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-red-500/10"
                                                title="Delete Expense"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400">
                                        No expenses found with current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card >
        </div >
    );
};

export default Expenses;
