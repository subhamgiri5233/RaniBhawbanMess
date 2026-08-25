import { useState, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';
import { TrendingUp, Filter, Trash2, ShoppingCart, Flame, Wheat, Package, RefreshCw, Wallet, Zap, Wifi } from 'lucide-react';
import { cn } from '../../lib/utils';

const Expenses = () => {
    const { expenses, members, deleteExpense, refreshData, globalMonth } = useData();
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedMember, setSelectedMember] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const getMemberName = (paidBy) => {
        if (paidBy === 'admin') return 'Admin';
        const member = members.find(m => (m._id || m.id) === paidBy);
        return member?.name || 'Unknown';
    };

    // Robust month matching (handles YYYY-MM-DD and DD-MM-YYYY smoothly)
    const matchesMonth = useCallback((dateStr) => {
        if (!dateStr || !globalMonth) return false;
        const d = String(dateStr).replace(/[ /]/g, '-');
        const gm = globalMonth.replace(/[ /]/g, '-');
        return d.includes(gm) ||
            (d.includes('-') && d.split('-').reverse().join('-').includes(gm));
    }, [globalMonth]);

    // Filter expenses based on category and member
    // Exclude admin market expenses (admin only adds spices/other)
    const filteredExpenses = useMemo(() => expenses
        .filter(expense => {
            if (expense.category === 'market' && String(expense.paidBy).toLowerCase() === 'admin') return false;
            const categoryMatch = activeCategory === 'all' || expense.category === activeCategory;
            const selMember = (members || []).find(m => (m._id || m.id) === selectedMember);
            const memberMatch = selectedMember === 'all' ||
                String(expense.paidBy).toLowerCase() === String(selectedMember).toLowerCase() ||
                (selMember && String(expense.paidBy).toLowerCase() === String(selMember.name).toLowerCase());
            const monthMatch = matchesMonth(expense.date);
            return categoryMatch && memberMatch && monthMatch;
        })
        .sort((a, b) => {
            const parseDate = (d) => {
                if (!d) return 0;
                const s = String(d).replace(/[ /]/g, '-');
                const parts = s.split('-');
                if (parts.length === 3 && parts[0].length < 4) {
                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
                }
                return new Date(s).getTime();
            };
            return parseDate(b.date) - parseDate(a.date);
        }), [expenses, activeCategory, selectedMember, members, matchesMonth]);

    // Category-wise breakdown for the SELECTED MONTH
    const marketExpenses = expenses.filter(e => e.category === 'market' && e.paidBy !== 'admin' && matchesMonth(e.date));
    const spicesExpenses = expenses.filter(e => e.category === 'spices' && matchesMonth(e.date));
    const riceExpenses = expenses.filter(e => e.category === 'rice' && matchesMonth(e.date));
    const depositExpenses = expenses.filter(e => e.category === 'deposit' && matchesMonth(e.date));
    const othersExpenses = expenses.filter(e => e.category === 'others' && matchesMonth(e.date));

    const categoryStats = [
        {
            name: 'Market',
            key: 'market',
            count: marketExpenses.length,
            total: marketExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: ShoppingCart,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20'
        },
        {
            name: 'Spices',
            key: 'spices',
            count: spicesExpenses.length,
            total: spicesExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: Flame,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20'
        },
        {
            name: 'Rice',
            key: 'rice',
            count: riceExpenses.length,
            total: riceExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: Wheat,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
        },
        {
            name: 'General Deposit',
            key: 'deposit',
            count: depositExpenses.length,
            total: depositExpenses.reduce((acc, e) => acc + (e.amount || 0), 0),
            icon: Wallet,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
        },
        {
            name: 'Other',
            key: 'others',
            count: othersExpenses.length,
            total: othersExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: Package,
            color: 'text-slate-600 dark:text-slate-400',
            bg: 'bg-slate-500/10',
            border: 'border-slate-500/20'
        },
    ];

    // Members who haven't submitted ANY market expense this month
    const memberOnlyList = members.filter(m => m.role === 'member');
    const membersWithMarket = new Set(
        expenses
            .filter(e => e.category === 'market' && e.paidBy !== 'admin' && matchesMonth(e.date))
            .map(e => e.paidBy)
    );
    const membersWithoutMarket = memberOnlyList.filter(m => !membersWithMarket.has(m._id || m.id));

    return (
        <div className="space-y-6 sm:space-y-8 pb-32">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Expense Management</h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Oversee categorized mess expenditures and audits</p>
                </div>
                <button
                    onClick={async () => {
                        setIsRefreshing(true);
                        await refreshData();
                        setIsRefreshing(false);
                    }}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-500/20 self-start sm:self-auto"
                >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                {categoryStats.filter(s => s.key === 'deposit' || s.total > 0).map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card
                            key={stat.key}
                            className={cn(
                                "p-4 sm:p-5 transition-all duration-200 hover:shadow-md cursor-pointer relative overflow-hidden",
                                activeCategory === stat.key
                                    ? "ring-2 ring-indigo-500 border-indigo-500 bg-white dark:bg-slate-900"
                                    : "border-slate-200/80 dark:border-white/5"
                            )}
                            onClick={() => setActiveCategory(activeCategory === stat.key ? 'all' : stat.key)}
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("p-2 rounded-xl border", stat.bg, stat.color, stat.border)}>
                                            <Icon size={16} />
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider">{stat.name}</p>
                                    </div>
                                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-extrabold tracking-wider uppercase border border-slate-200 dark:border-white/5">
                                        {stat.count}
                                    </span>
                                </div>
                                <h3 className={cn("text-xl sm:text-2xl font-extrabold tracking-tight mt-1", stat.color)}>
                                    ₹{stat.total}
                                </h3>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Member Summary Card */}
            <Card className="p-6 shadow-sm border border-slate-200/80 dark:border-white/5">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={16} />
                        <p className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-widest">Live Analysis</p>
                    </div>

                    {selectedMember !== 'all' ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mb-0.5">Active Contributor</p>
                                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                                        {getMemberName(selectedMember)}
                                    </h3>
                                </div>
                                <div className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                    <p className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-center mb-0.5">Total Monthly</p>
                                    <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">₹{(() => {
                                        const memberExpenses = expenses.filter(e => e.paidBy === selectedMember);
                                        return memberExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
                                    })()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {(() => {
                                    const isAdmin = selectedMember === 'admin';
                                    const memberExpenses = expenses.filter(e => e.paidBy === selectedMember);

                                    const getCatTotal = (cat) => memberExpenses.filter(e => e.category === cat).reduce((acc, e) => acc + (e.amount || 0), 0);

                                    if (isAdmin) {
                                        const stats = [
                                            { label: 'Rice', val: getCatTotal('rice'), icon: Wheat, color: 'emerald' },
                                            { label: 'Spices', val: getCatTotal('spices'), icon: Package, color: 'orange' },
                                            { label: 'Others', val: getCatTotal('others'), icon: Package, color: 'slate' }
                                        ];
                                        return stats.filter(s => s.val > 0).map(s => (
                                            <div key={s.label} className={cn("p-3.5 rounded-2xl border transition-all",
                                                s.color === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20" :
                                                    s.color === 'orange' ? "bg-orange-500/10 border-orange-500/20" :
                                                        "bg-slate-500/10 border-slate-500/20"
                                            )}>
                                                <s.icon size={16} className={cn("mb-2",
                                                    s.color === 'emerald' ? "text-emerald-500" :
                                                        s.color === 'orange' ? "text-orange-500" : "text-slate-500"
                                                )} />
                                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                                                <p className={cn("text-lg font-extrabold tracking-tight",
                                                    s.color === 'emerald' ? "text-emerald-600 dark:text-emerald-400" :
                                                        s.color === 'orange' ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-400"
                                                )}>₹{s.val}</p>
                                            </div>
                                        ));
                                    } else {
                                        const stats = [
                                            { label: 'Market', val: getCatTotal('market'), icon: ShoppingCart, color: 'indigo' },
                                            { label: 'Deposit', val: getCatTotal('deposit'), icon: Wallet, color: 'emerald' },
                                            { label: 'Gas', val: getCatTotal('gas'), icon: Flame, color: 'amber' },
                                            { label: 'WiFi', val: getCatTotal('wifi'), icon: Wifi, color: 'cyan' },
                                            { label: 'Electric', val: getCatTotal('electric'), icon: Zap, color: 'rose' }
                                        ];
                                        return stats.filter(s => s.val > 0).map(s => (
                                            <div key={s.label} className={cn("p-3.5 rounded-2xl border transition-all",
                                                s.color === 'indigo' ? "bg-indigo-500/10 border-indigo-500/20" :
                                                    s.color === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20" :
                                                        s.color === 'amber' ? "bg-amber-500/10 border-amber-500/20" :
                                                            s.color === 'cyan' ? "bg-blue-500/10 border-blue-500/20" :
                                                                "bg-rose-500/10 border-rose-500/20"
                                            )}>
                                                <s.icon size={16} className={cn("mb-2",
                                                    s.color === 'indigo' ? "text-indigo-500" :
                                                        s.color === 'emerald' ? "text-emerald-500" :
                                                            s.color === 'amber' ? "text-amber-500" :
                                                                s.color === 'cyan' ? "text-blue-500" : "text-rose-500"
                                                )} />
                                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                                                <p className={cn("text-lg font-extrabold tracking-tight",
                                                    s.color === 'indigo' ? "text-indigo-600 dark:text-indigo-400" :
                                                        s.color === 'emerald' ? "text-emerald-600 dark:text-emerald-400" :
                                                            s.color === 'amber' ? "text-amber-600 dark:text-amber-400" :
                                                                s.color === 'cyan' ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400"
                                                )}>₹{s.val}</p>
                                            </div>
                                        ));
                                    }
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-3 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                <Filter size={20} />
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Mission Control</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-bold max-w-xs">Select a member below to analyze individual contributions and category audit.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Filters */}
            <Card
                className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 mb-6 shadow-sm rounded-2xl"
                innerClassName="p-4 flex flex-wrap items-center gap-4"
            >
                <div className="flex items-center gap-2">
                    <Filter size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Filters:</span>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center overflow-x-auto custom-scrollbar gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/40 rounded-xl">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={cn(
                            "flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all uppercase tracking-wider",
                            activeCategory === 'all'
                                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        )}
                    >
                        All
                    </button>
                    {categoryStats.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={cn(
                                "flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all uppercase tracking-wider",
                                activeCategory === cat.key
                                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Member Filter */}
                <div className="flex-1 min-w-[180px] sm:ml-auto">
                    <select
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-extrabold tracking-wider uppercase text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
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
            </Card>

            {/* Expense Table */}
            <Card className="overflow-hidden p-0 border border-slate-200/80 dark:border-white/5 shadow-sm">
                <div className="overflow-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left relative border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-white/5">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Paid By</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredExpenses.map(expense => (
                                <tr key={expense._id || expense.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                    <td className="p-4 text-slate-500 text-xs font-bold tabular-nums">{expense.date}</td>
                                    <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100 text-sm">{expense.description || expense.title}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "text-[9px] px-2.5 py-1 rounded-xl font-extrabold uppercase tracking-wider border flex items-center gap-1.5 w-fit",
                                            expense.category === 'market' && "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
                                            expense.category === 'spices' && "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
                                            expense.category === 'rice' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
                                            expense.category === 'deposit' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
                                            expense.category === 'wifi' && "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
                                            expense.category === 'gas' && "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
                                            expense.category === 'electric' && "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
                                            expense.category === 'others' && "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20"
                                        )}>
                                            {expense.category === 'market' && <>🛒 Market</>}
                                            {expense.category === 'spices' && <>🌶️ Spices</>}
                                            {expense.category === 'rice' && <>🍚 Rice</>}
                                            {expense.category === 'deposit' && <>💰 Deposit</>}
                                            {expense.category === 'wifi' && <>🛜 WiFi</>}
                                            {expense.category === 'gas' && <>🔥 Gas</>}
                                            {expense.category === 'electric' && <>⚡ Electric</>}
                                            {expense.category === 'others' && <>📦 Other</>}
                                            {!['market', 'spices', 'rice', 'deposit', 'wifi', 'gas', 'electric', 'others'].includes(expense.category) && <span>{expense.category}</span>}
                                        </span>
                                    </td>
                                    <td className="p-4 font-extrabold text-slate-900 dark:text-slate-50">₹{expense.amount}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400 text-xs font-bold">{getMemberName(expense.paidBy)}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Do you want to delete this expense?')) {
                                                    await deleteExpense(expense._id || expense.id);
                                                }
                                            }}
                                            className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-rose-500/20"
                                            title="Delete Expense"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 text-xs font-bold">
                                        No expenses found with current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Expenses;
