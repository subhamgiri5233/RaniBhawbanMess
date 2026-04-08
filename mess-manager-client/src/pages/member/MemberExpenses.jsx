import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { TrendingUp, Filter, Trash2, ShoppingCart, Flame, Wheat, Package, RefreshCw, Wallet, Zap, Wifi } from 'lucide-react';
import { cn } from '../../lib/utils';

const Expenses = () => {
    const { expenses, members, deleteExpense, refreshData, globalMonth } = useData();
    const { user } = useAuth();
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedMember, setSelectedMember] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const myId = user?.id || user?._id || user?.userId;

    const getMemberName = (paidBy) => {
        if (paidBy === 'admin') return 'Admin';
        const member = (members || []).find(m => (m._id || m.id) === paidBy);
        return member?.name || 'Unknown';
    };

    // Robust month matching (handles YYYY-MM-DD and DD-MM-YYYY smoothly)
    const matchesMonth = (dateStr) => {
        if (!dateStr || !globalMonth) return false;
        // Normalize separators to handle inconsistent data (Mirroring DataContext fix)
        const d = String(dateStr).replace(/[ /]/g, '-');
        const gm = globalMonth.replace(/[ /]/g, '-');
        return d.includes(gm) ||
            (d.includes('-') && d.split('-').reverse().join('-').includes(gm));
    };

    // Filter expenses based on category and member
    const filteredExpenses = expenses
        .filter(expense => {
            // Hide admin market expenses
            if (expense.category === 'market' && (String(expense.paidBy).toLowerCase() === 'admin')) return false;
            
            const categoryMatch = activeCategory === 'all' || expense.category === activeCategory;
            const selMember = (members || []).find(m => (m._id || m.id) === selectedMember);
            
            // Robust member matching (handles ID, Name, and 'admin' case-insensitively)
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
                    // Reorder DD-MM-YYYY to YYYY-MM-DD for browser safety
                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
                }
                return new Date(s).getTime();
            };
            return parseDate(b.date) - parseDate(a.date);
        });

    // Calculated totals for this member specifically (Only for current month)
    const myApprovedTotal = expenses.filter(e => {
        const isMe = e.paidBy === myId || e.paidBy === String(myId) || String(e.paidBy).toLowerCase() === String(user?.name).toLowerCase();
        return isMe && matchesMonth(e.date);
    }).reduce((acc, e) => acc + (e.amount || 0), 0);

    // Category-wise breakdown for the SELECTED MONTH
    const marketExpenses = expenses.filter(e => e.category === 'market' && e.paidBy !== 'admin' && matchesMonth(e.date));
    const spicesExpenses = expenses.filter(e => e.category === 'spices' && matchesMonth(e.date));
    const riceExpenses = expenses.filter(e => e.category === 'rice' && matchesMonth(e.date));
    const othersExpenses = expenses.filter(e => e.category === 'others' && matchesMonth(e.date));

    const categoryStats = [
        {
            name: 'Market',
            key: 'market',
            count: marketExpenses.length,
            total: marketExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: ShoppingCart,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-300/40 dark:bg-indigo-950/20',
            border: 'border-indigo-300/30 dark:border-indigo-800/30'
        },
        {
            name: 'Spices',
            key: 'spices',
            count: spicesExpenses.length,
            total: spicesExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: Flame,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-300/40 dark:bg-orange-950/20',
            border: 'border-orange-300/30 dark:border-orange-800/30'
        },
        {
            name: 'Rice',
            key: 'rice',
            count: riceExpenses.length,
            total: riceExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: Wheat,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-300/40 dark:bg-emerald-950/20',
            border: 'border-emerald-300/30 dark:border-emerald-800/30'
        },
        {
            name: 'Other',
            key: 'others',
            count: othersExpenses.length,
            total: othersExpenses.reduce((acc, e) => acc + e.amount, 0),
            icon: Package,
            color: 'text-slate-600 dark:text-slate-400',
            bg: 'bg-indigo-300/40 dark:bg-slate-900/40',
            border: 'border-indigo-400/30 dark:border-white/5'
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

    // Format month label e.g. "2026-03" → "March 2026"
    const monthLabel = globalMonth
        ? new Date(`${globalMonth}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : '';

    return (
        <div className="space-y-6 pb-32">
            <div className="flex items-center justify-between">
                <div>
                   <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Expense Management</h1>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{monthLabel} Mess Transparency</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block px-4 py-2 bg-emerald-300/40 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-xl shadow-inner">
                        <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-center mb-0.5 whitespace-nowrap">My Personal Total</p>
                        <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 text-center leading-none">₹{myApprovedTotal}</p>
                    </div>
                    <button
                        onClick={async () => {
                            setIsRefreshing(true);
                            await refreshData();
                            setIsRefreshing(false);
                        }}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm shadow-primary-500/20"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>


            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                {categoryStats.filter(s => s.total > 0).map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card
                            key={stat.key}
                            className={cn(
                                "p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer relative overflow-hidden",
                                activeCategory === stat.key
                                    ? `ring-4 ring-offset-2 dark:ring-offset-slate-900 ${stat.color.replace('text-', 'ring-').split(' ')[0]} bg-indigo-300/40 dark:bg-slate-900`
                                    : cn("bg-indigo-300/40 dark:bg-slate-900/60 border-indigo-300/30 dark:border-white/5", stat.bg)
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
                                        <div className={cn("p-2 rounded-xl bg-white/20 dark:bg-slate-900/60 backdrop-blur-md shadow-sm", stat.color)}>
                                            <Icon size={16} />
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest">{stat.name}</p>
                                    </div>
                                    <span className="text-[9px] bg-white/30 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-black tracking-wider uppercase border border-white/20 dark:border-white/5 shadow-sm">
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

            {/* Member Summary Card */}
            <Card className="p-6 bg-gradient-to-br from-indigo-300/40 to-indigo-300/30 dark:from-slate-900 dark:to-slate-900/50 border-primary-300/30 dark:border-primary-900/30 overflow-hidden relative shadow-xl">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
                    <TrendingUp size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="text-primary-500 dark:text-primary-400" size={18} />
                        <p className="text-primary-600/70 dark:text-primary-400/70 font-black text-[10px] uppercase tracking-[0.2em]">Live Analysis</p>
                    </div>

                    {selectedMember !== 'all' ? (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Active Contributor</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">
                                        {getMemberName(selectedMember)}
                                    </h3>
                                </div>
                                <div className="px-4 py-2 bg-primary-300/40 dark:bg-primary-500/20 rounded-2xl border border-primary-500/20 backdrop-blur-md">
                                    <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest text-center mb-0.5">Total Monthly</p>
                                    <p className="text-2xl font-black text-primary-600 dark:text-primary-400 tracking-tight">₹{(() => {
                                        const memberExpenses = expenses.filter(e => 
                                            (String(e.paidBy).toLowerCase() === String(selectedMember).toLowerCase()) && 
                                            matchesMonth(e.date)
                                        );
                                        return memberExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
                                    })()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {(() => {
                                    const isAdmin = String(selectedMember).toLowerCase() === 'admin';
                                    const memberExpenses = expenses.filter(e => 
                                        (String(e.paidBy).toLowerCase() === String(selectedMember).toLowerCase()) && 
                                        matchesMonth(e.date)
                                    );

                                    const getCatTotal = (cat) => memberExpenses.filter(e => e.category === cat).reduce((acc, e) => acc + (e.amount || 0), 0);

                                    if (isAdmin) {
                                        const stats = [
                                            { label: 'Rice', val: getCatTotal('rice'), icon: Wheat, color: 'emerald' },
                                            { label: 'Spices', val: getCatTotal('spices'), icon: Package, color: 'orange' },
                                            { label: 'Others', val: getCatTotal('others'), icon: Package, color: 'slate' }
                                        ];
                                        return stats.filter(s => s.val > 0).map(s => (
                                            <div key={s.label} className={cn("p-4 rounded-3xl border transition-all hover:scale-[1.02]",
                                                s.color === 'emerald' ? "bg-emerald-300/40 dark:bg-emerald-500/10 border-emerald-300/30 dark:border-emerald-500/20" :
                                                    s.color === 'orange' ? "bg-orange-300/40 dark:bg-orange-500/10 border-orange-300/30 dark:border-orange-500/20" :
                                                        "bg-indigo-300/40 dark:bg-slate-500/10 border-indigo-300/30 dark:border-slate-500/20"
                                            )}>
                                                <s.icon size={18} className={cn("mb-3",
                                                    s.color === 'emerald' ? "text-emerald-500" :
                                                        s.color === 'orange' ? "text-orange-500" : "text-slate-500"
                                                )} />
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                                <p className={cn("text-xl font-black tracking-tight",
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
                                            <div key={s.label} className={cn("p-4 rounded-3xl border transition-all hover:scale-[1.02]",
                                                s.color === 'indigo' ? "bg-indigo-300/40 dark:bg-indigo-500/10 border-indigo-300/30 dark:border-indigo-500/20" :
                                                    s.color === 'emerald' ? "bg-emerald-300/40 dark:bg-emerald-500/10 border-emerald-300/30 dark:border-emerald-500/20" :
                                                        s.color === 'amber' ? "bg-amber-300/40 dark:bg-amber-500/10 border-amber-300/30 dark:border-amber-500/20" :
                                                            s.color === 'cyan' ? "bg-cyan-300/40 dark:bg-cyan-500/10 border-cyan-300/30 dark:border-cyan-500/20" :
                                                                "bg-rose-300/40 dark:bg-rose-500/10 border-rose-300/30 dark:border-rose-500/20"
                                            )}>
                                                <s.icon size={18} className={cn("mb-3",
                                                    s.color === 'indigo' ? "text-indigo-500" :
                                                        s.color === 'emerald' ? "text-emerald-500" :
                                                            s.color === 'amber' ? "text-amber-500" :
                                                                s.color === 'cyan' ? "text-cyan-500" : "text-rose-500"
                                                )} />
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                                <p className={cn("text-xl font-black tracking-tight",
                                                    s.color === 'indigo' ? "text-indigo-600 dark:text-indigo-400" :
                                                        s.color === 'emerald' ? "text-emerald-600 dark:text-emerald-400" :
                                                            s.color === 'amber' ? "text-amber-600 dark:text-amber-400" :
                                                                s.color === 'cyan' ? "text-cyan-600 dark:text-cyan-400" : "text-rose-600 dark:text-rose-400"
                                                )}>₹{s.val}</p>
                                            </div>
                                        ));
                                    }
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-20 h-20 bg-primary-300/40 dark:bg-primary-500/20 rounded-[2.5rem] flex items-center justify-center mb-6 rotate-12 transition-transform hover:rotate-0 border border-primary-400/20 shadow-lg shadow-primary-500/10">
                                <Filter className="text-primary-500" size={32} />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Mission Control</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 font-bold max-w-[240px] leading-relaxed">Select a member below to analyze their individual mess contributions and category audit.</p>
                        </div>
                    )}
                </div>
            </Card>


            {/* Filters */}
            <Card className="px-5 py-4 bg-slate-100 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200 dark:border-white/5 mb-6 shadow-sm rounded-2xl flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2.5">
                    <Filter size={16} className="text-primary-600 dark:text-primary-500/80" />
                    <span className="text-[13px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em]">Filters:</span>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center overflow-x-auto scrollbar-hide gap-1 p-1 bg-slate-200/60 dark:bg-slate-800/40 rounded-xl">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={cn(
                            "flex-shrink-0 px-4 py-1.5 rounded-lg text-[11px] font-black transition-all duration-300 uppercase tracking-widest",
                            activeCategory === 'all'
                                ? "bg-white dark:bg-slate-700/80 text-primary-600 dark:text-primary-400 shadow-sm"
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5"
                        )}
                    >
                        All
                    </button>
                    {categoryStats.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={cn(
                                "flex-shrink-0 px-4 py-1.5 rounded-lg text-[11px] font-black transition-all duration-300 uppercase tracking-widest",
                                activeCategory === cat.key
                                    ? "bg-white dark:bg-slate-700/80 text-primary-600 dark:text-primary-400 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Member Filter */}
                <div className="flex-1 min-w-[200px] ml-auto">
                    <select
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-200/50 dark:bg-slate-800/40 border-none rounded-xl text-[11px] font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
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
            <Card className="overflow-hidden p-0 border-indigo-300/30 dark:border-white/5">
                <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <table className="w-full text-left relative border-collapse">
                        <thead className="sticky top-0 z-10 bg-indigo-300/40 dark:bg-slate-900 shadow-sm text-indigo-700 dark:text-slate-400 font-black uppercase tracking-widest text-[11px] border-b border-indigo-300/30 dark:border-white/5">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Paid By</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-300/30 dark:divide-white/5">
                            {filteredExpenses.map(expense => (
                                <tr key={expense._id || expense.id} className="hover:bg-indigo-300/40 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm font-bold">{expense.date}</td>
                                    <td className="p-4 font-black text-slate-900 dark:text-slate-100">{expense.description || expense.title}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "text-[10px] px-2.5 py-1 rounded-xl font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit",
                                            expense.category === 'market' && "bg-blue-300/40 text-blue-800 border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-400",
                                            expense.category === 'spices' && "bg-amber-300/40 text-amber-800 border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-400",
                                            expense.category === 'rice' && "bg-emerald-300/40 text-emerald-800 border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-400",
                                            expense.category === 'deposit' && "bg-emerald-300/40 text-emerald-800 border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-400",
                                            expense.category === 'wifi' && "bg-blue-300/40 text-blue-800 border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-400",
                                            expense.category === 'gas' && "bg-rose-300/40 text-rose-800 border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-400",
                                            expense.category === 'electric' && "bg-amber-300/40 text-amber-800 border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-400",
                                            expense.category === 'others' && "bg-indigo-300/40 text-indigo-800 border-indigo-400/30 dark:bg-slate-500/20 dark:text-slate-400"
                                        )}>
                                            {expense.category === 'market' && <>🛒 Market</>}
                                            {expense.category === 'spices' && <>🌶️ Spices</>}
                                            {expense.category === 'rice' && <>🍚 Rice</>}
                                            {expense.category === 'deposit' && <>💰 Deposit</>}
                                            {expense.category === 'wifi' && <>📶 WiFi</>}
                                            {expense.category === 'gas' && <>🔥 Gas</>}
                                            {expense.category === 'electric' && <>⚡ Electric</>}
                                            {expense.category === 'others' && <>📦 Other</>}
                                            {!['market', 'spices', 'rice', 'deposit', 'wifi', 'gas', 'electric', 'others'].includes(expense.category) && <span>{expense.category}</span>}
                                        </span>
                                    </td>
                                    <td className="p-4 font-black text-slate-900 dark:text-slate-50">₹{expense.amount}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400 text-sm font-bold">{getMemberName(expense.paidBy)}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Do you want to delete?')) {
                                                    await deleteExpense(expense._id || expense.id);
                                                }
                                            }}
                                            className="p-2 bg-rose-300/40 dark:bg-rose-950/30 text-rose-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg shadow-red-500/10 border border-rose-400/20"
                                            title="Delete Expense"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
