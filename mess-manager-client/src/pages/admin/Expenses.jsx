import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Check, Clock, X, TrendingUp, Filter, Trash2 } from 'lucide-react';
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
            icon: '🛒',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200'
        },
        {
            name: 'Spices',
            key: 'spices',
            count: spicesExpenses.length,
            total: spicesExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: '🌶️',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-200'
        },
        {
            name: 'Rice',
            key: 'rice',
            count: riceExpenses.length,
            total: riceExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: '🍚',
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-200'
        },
        {
            name: 'Other',
            key: 'others',
            count: othersExpenses.length,
            total: othersExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: '📦',
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            border: 'border-slate-200'
        },
    ];

    const totalApproved = expenses.filter(e => e.status === 'approved').reduce((acc, e) => acc + e.amount, 0);
    const pendingCount = expenses.filter(e => e.status === 'pending').length;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Expense Management</h1>

            {/* Clear All History Button */}
            {expenses.length > 0 && (
                <Card className="p-4 border-l-4 border-l-red-500 bg-white/90 backdrop-blur-xl dark:bg-red-950/20 border-indigo-100/50 dark:border-red-900/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-red-400 tracking-tight">Danger Zone</h3>
                            <p className="text-sm text-slate-500 dark:text-red-500/80 font-medium">Permanently delete all expense records from database</p>
                        </div>
                        <button
                            onClick={async () => {
                                const password = prompt('Enter password to clear ALL expense history:');
                                if (password === null) return; // User cancelled

                                if (password === 'came') {
                                    if (window.confirm(`⚠️ WARNING: This will delete ALL ${expenses.length} expenses permanently! This cannot be undone! Are you absolutely sure?`)) {
                                        try {
                                            const response = await api.delete('/expenses/clear-all-history', {
                                                data: { password }
                                            });
                                            if (response.status === 200) {
                                                alert(`✅ Successfully deleted ${response.data.deletedCount} expenses!`);
                                                await refreshData();
                                            }
                                        } catch (error) {
                                            const message = error.response?.data?.message || 'Failed to clear history';
                                            alert(`❌ Error: ${message}`);
                                            console.error(error);
                                        }
                                    }
                                } else {
                                    alert('Incorrect password! Access denied.');
                                }
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Clear All History
                        </button>
                    </div>
                </Card>
            )}

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-0 overflow-hidden bg-primary-600 dark:bg-gradient-to-br dark:from-primary-600 dark:to-indigo-700 text-white border-none shadow-lg relative group">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                    <div className="p-6 relative">
                        <p className="text-primary-100 font-bold opacity-80 text-sm uppercase tracking-widest">Total Approved Expenses</p>
                        <h2 className="text-4xl font-black mt-2">₹{totalApproved}</h2>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">Pending Approvals</p>
                            <h2 className="text-4xl font-black mt-2 text-amber-500">{pendingCount}</h2>
                        </div>
                        {pendingCount > 0 && (
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
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
                            >
                                <Check size={16} />
                                Approve All
                            </button>
                        )}
                    </div>
                </Card>

                {/* Member Summary Card */}
                <Card className="p-6 border-l-4 border-l-primary-500 border-slate-200/60 dark:border-primary-500/30 bg-white dark:bg-primary-950/20">
                    {selectedMember !== 'all' ? (
                        <>
                            <p className="text-primary-600 dark:text-primary-400 font-bold text-sm uppercase tracking-widest">Individual Summary</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mt-2 tracking-tight">
                                {getMemberName(selectedMember)}
                            </h3>
                            <div className="mt-4 space-y-2">
                                {(() => {
                                    const memberExpenses = expenses.filter(e =>
                                        e.paidBy === selectedMember &&
                                        e.category === 'market'
                                    );
                                    const approved = memberExpenses.filter(e => e.status === 'approved');
                                    const pending = memberExpenses.filter(e => e.status === 'pending');
                                    const approvedTotal = approved.reduce((acc, e) => acc + e.amount, 0);
                                    const pendingTotal = pending.reduce((acc, e) => acc + e.amount, 0);

                                    return (
                                        <>
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span className="text-emerald-600 dark:text-emerald-400">✓ Approved:</span>
                                                <span className="text-emerald-700 dark:text-emerald-400">₹{approvedTotal}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span className="text-amber-600 dark:text-amber-400">⏳ Pending:</span>
                                                <span className="text-amber-700 dark:text-amber-400">₹{pendingTotal}</span>
                                            </div>
                                            <div className="pt-3 mt-3 border-t border-primary-200 dark:border-primary-500/30 flex justify-between items-center">
                                                <span className="text-slate-900 dark:text-slate-50 font-black">Total Market:</span>
                                                <span className="font-black text-2xl text-primary-600 dark:text-primary-400">₹{approvedTotal + pendingTotal}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-widest">Select a member to view</p>
                            <p className="text-slate-900 dark:text-slate-50 font-black text-xl mt-2 tracking-tight">Individual Summary</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categoryStats.map((stat) => (
                    <Card
                        key={stat.key}
                        className={cn(
                            "p-5 border-2 transition-all hover:shadow-md group cursor-pointer",
                            activeCategory === stat.key
                                ? "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900 border-primary-500 shadow-sm"
                                : cn("bg-white border-slate-100 dark:border-white/5", stat.border.replace('border-', 'dark:border-').replace('border-', 'border-').replace('blue', 'primary').replace('orange', 'amber'))
                        )}
                        style={{
                            backgroundColor: activeCategory === stat.key ? 'transparent' : undefined
                        }}
                        onClick={() => setActiveCategory(activeCategory === stat.key ? 'all' : stat.key)}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">{stat.icon} {stat.name}</p>
                            <span className="text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 font-bold border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                                {stat.count} items
                            </span>
                        </div>
                        <h3 className={cn("text-3xl font-black tracking-tight transition-colors", stat.color.replace('blue', 'primary').replace('orange', 'amber'))}>
                            ₹{stat.total}
                        </h3>
                    </Card>
                ))}
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
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to reject and delete this expense?')) {
                                                            deleteExpense(expense._id || expense.id);
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
                                                onClick={() => {
                                                    if (window.confirm(`Delete this expense?\n\nDescription: ${expense.description || expense.title}\nAmount: ₹${expense.amount}\n\nThis action cannot be undone.`)) {
                                                        deleteExpense(expense._id || expense.id);
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-xl transition-all"
                                                title="Delete expense"
                                            >
                                                <Trash2 size={18} />
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
