import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { 
    Check, Clock, X, TrendingUp, Filter, Trash2, ShoppingCart, 
    Flame, Wheat, Package, RefreshCw, Bell, Wallet, Zap, Wifi, ShoppingBag, History
} from 'lucide-react';
import { cn } from '../../lib/utils';

const MemberExpenses = () => {
    const { expenses, members, deleteExpense, refreshData, globalMonth } = useData();
    const { user } = useAuth();
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedMember, setSelectedMember] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const myId = user?.id || user?._id || user?.userId;

    const getMemberName = (paidBy) => {
        if (paidBy === 'admin') return 'Admin';
        return (members || []).find(m => (m._id || m.id || m.userId) === paidBy)?.name || 'Admin';
    };

    // Filter and sort expenses
    const filteredExpenses = [...expenses]
        .filter(expense => {
            const categoryMatch = activeCategory === 'all' || expense.category === activeCategory;
            const memberMatch = selectedMember === 'all' || expense.paidBy === selectedMember;
            return categoryMatch && memberMatch;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Operational Category Stats (Synchronized with Admin Expenses Logic)
    const getCatTotal = (cat) => expenses.filter(e => {
        if (cat === 'market' && e.paidBy === 'admin') return false;
        return e.category === cat;
    }).reduce((acc, e) => acc + (e.amount || 0), 0);
    
    const getCatCount = (cat) => expenses.filter(e => {
        if (cat === 'market' && e.paidBy === 'admin') return false;
        return e.category === cat;
    }).length;

    const categoryStats = [
        { name: 'Market', key: 'market', count: getCatCount('market'), total: getCatTotal('market'), icon: ShoppingCart, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
        { name: 'Spices', key: 'spices', count: getCatCount('spices'), total: getCatTotal('spices'), icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/20' },
        { name: 'Rice', key: 'rice', count: getCatCount('rice'), total: getCatTotal('rice'), icon: Wheat, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
        { name: 'Others', key: 'others', count: getCatCount('others'), total: getCatTotal('others'), icon: Package, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/40' },
    ];

    const myApprovedTotal = expenses.filter(e => (e.paidBy === myId || e.paidBy === String(myId))).reduce((acc, e) => acc + (e.amount || 0), 0);

    const monthLabel = globalMonth
        ? new Date(`${globalMonth}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : '';

    return (
        <div className="space-y-6 pb-32">
            {/* Header Synchronization with Admin Style */}
            <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Expense Management</h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{monthLabel} Mess Transparency</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-center mb-0.5 whitespace-nowrap">My Personal Total</p>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 text-center leading-none">₹{myApprovedTotal}</p>
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

            {/* Dashboard Category Grid (Exact Admin CSS) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                {categoryStats.filter(s => s.total > 0).map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card
                            key={stat.key}
                            className={cn(
                                "p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer relative overflow-hidden",
                                activeCategory === stat.key 
                                    ? `ring-4 ring-offset-2 dark:ring-offset-slate-900 ${stat.color.replace('text-', 'ring-').split(' ')[0]} bg-white dark:bg-slate-900 shadow-xl` 
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
                                    <span className="text-[9px] bg-white/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-black tracking-wider uppercase border border-slate-200/50 dark:border-white/5 shadow-sm whitespace-nowrap">
                                        {stat.count} items
                                    </span>
                                </div>
                                <h3 className={cn("text-2xl sm:text-3xl font-black tracking-tighter mt-1", stat.color)}>₹{stat.total}</h3>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Live Analysis Sync with Admin Structure & Logic */}
            <Card className="p-6 bg-gradient-to-br from-primary-50 to-white dark:from-slate-900 dark:to-slate-900/50 border-primary-200/50 dark:border-primary-900/30 overflow-hidden relative">
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
                                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1.5">Active Contributor</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tighter uppercase leading-none">
                                        {getMemberName(selectedMember)} {selectedMember === myId && "(Me)"}
                                    </h3>
                                </div>
                                <div className="px-4 py-2 bg-primary-500/10 dark:bg-primary-500/20 rounded-2xl border border-primary-500/20 backdrop-blur-md">
                                    <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest text-center mb-0.5">Total Monthly</p>
                                    <p className="text-2xl font-black text-primary-600 dark:text-primary-400 tracking-tight leading-none">₹{(() => {
                                        const memberExpenses = expenses.filter(e => e.paidBy === selectedMember && e.status === 'approved');
                                        return memberExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
                                    })()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {(() => {
                                    const isAdmin = selectedMember === 'admin';
                                    const memberExpenses = expenses.filter(e => e.paidBy === selectedMember && e.status === 'approved');
                                    const getCatVal = (cat) => memberExpenses.filter(e => e.category === cat).reduce((acc, e) => acc + (e.amount || 0), 0);

                                    if (isAdmin) {
                                      // Admin Categories (Synchronized with Admin logic)
                                      return [
                                          { label: 'Rice', val: getCatVal('rice'), i: Wheat, c: 'emerald' },
                                          { label: 'Spices', val: getCatVal('spices'), i: Flame, c: 'orange' },
                                          { label: 'Others', val: getCatVal('others'), i: Package, c: 'slate' }
                                      ]
                                      .filter(s => s.val > 0)
                                      .map(s => (
                                          <div key={s.label} className={cn("p-4 rounded-3xl border transition-all hover:scale-[1.02]", 
                                              s.c === 'emerald' ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" :
                                              s.c === 'orange' ? "bg-orange-50/50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20" :
                                              "bg-slate-50/50 dark:bg-slate-500/10 border-slate-100 dark:border-slate-500/20"
                                          )}>
                                              <s.i size={18} className={cn("mb-3", s.c === 'emerald' ? "text-emerald-500" : s.c === 'orange' ? "text-orange-500" : "text-slate-500")} />
                                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                              <p className={cn("text-xl font-black tracking-tight", s.c === 'emerald' ? "text-emerald-600 dark:text-emerald-400" : s.c === 'orange' ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-400")}>₹{s.val}</p>
                                          </div>
                                      ));
                                    } else {
                                      // Member Categories (Synchronized with Admin logic)
                                      return [
                                          { label: 'Market', val: getCatVal('market'), i: ShoppingCart, c: 'indigo' },
                                          { label: 'Deposit', val: getCatVal('deposit'), i: Wallet, c: 'emerald' },
                                          { label: 'Gas', val: getCatVal('gas'), i: Flame, c: 'amber' },
                                          { label: 'WiFi', val: getCatVal('wifi'), i: Wifi, c: 'cyan' },
                                          { label: 'Electric', val: getCatVal('electric'), i: Zap, c: 'rose' }
                                      ]
                                      .filter(s => s.val > 0)
                                      .map(s => (
                                          <div key={s.label} className={cn("p-4 rounded-3xl border transition-all hover:scale-[1.02]", 
                                              s.c === 'indigo' ? "bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20" :
                                              s.c === 'emerald' ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" :
                                              s.c === 'amber' ? "bg-amber-50/50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" :
                                              s.c === 'cyan' ? "bg-cyan-50/50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20" :
                                              "bg-rose-50/50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"
                                          )}>
                                              <s.i size={18} className={cn("mb-3", s.c === 'indigo' ? "text-indigo-500" : s.c === 'emerald' ? "text-emerald-500" : s.c === 'amber' ? "text-amber-500" : s.c === 'cyan' ? "text-cyan-500" : "text-rose-500")} />
                                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                              <p className={cn("text-xl font-black tracking-tight", s.c === 'indigo' ? "text-indigo-600 dark:text-indigo-400" : s.c === 'emerald' ? "text-emerald-600 dark:text-emerald-400" : s.c === 'amber' ? "text-amber-600 dark:text-amber-400" : s.c === 'cyan' ? "text-cyan-600 dark:text-cyan-400" : "text-rose-600 dark:text-rose-400")}>₹{s.val}</p>
                                          </div>
                                      ));
                                    }
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-20 h-20 bg-primary-500/10 dark:bg-primary-500/20 rounded-[2rem] flex items-center justify-center mb-6 rotate-12 transition-transform hover:rotate-0">
                                <Filter className="text-primary-500" size={32} />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Audit Control</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-2 font-bold max-w-[280px] leading-relaxed uppercase">Select a specific member to analyze their confirmed mess contributions and individual category audit.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Filter Section */}
            <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-100 dark:border-white/5">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-primary-600 dark:text-primary-400" />
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Filters</span>
                    </div>

                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                        {['all', 'market', 'spices', 'rice', 'others'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider",
                                    activeCategory === cat 
                                        ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <select
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                        >
                            <option value="all">View All Contributions</option>
                            <option value="admin">Admin (Mess Shared)</option>
                            {members.filter(m => m.role === 'member').map(m => (
                                <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Transaction Ledger */}
            <Card className="overflow-hidden p-0 border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/80">
                <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <History size={18} className="text-primary-500" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Transaction History</h2>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredExpenses.length} Auditable Items Found</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left pt-2">
                        <thead className="bg-slate-100/30 dark:bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Item Detail</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredExpenses.map(e => {
                                const isMine = e.paidBy === myId || e.paidBy === String(myId);
                                const payer = members.find(m => (m._id === e.paidBy || m.userId === e.paidBy));
                                
                                return (
                                    <tr key={e._id || e.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{e.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-slate-800 dark:text-slate-100">{e.description || e.title}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={cn(
                                                    "w-1 h-1 rounded-full",
                                                    isMine ? "bg-emerald-500" : "bg-indigo-500"
                                                )} />
                                                <span className="text-[8px] font-black uppercase text-slate-400">
                                                    {isMine ? 'Personal Contribution' : `Mess Shared (${payer?.name || 'Admin'})`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                                                e.category === 'market' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" :
                                                e.category === 'spices' ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" :
                                                e.category === 'rice' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                                "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400"
                                            )}>
                                                {e.category === 'market' && '🛒 Market'}
                                                {e.category === 'spices' && '🌶️ Spices'}
                                                {e.category === 'rice' && '🍚 Rice'}
                                                {e.category === 'others' && '📦 Other'}
                                                {!['market', 'spices', 'rice', 'others'].includes(e.category) && e.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-black text-slate-900 dark:text-slate-100 tracking-tight">₹{e.amount}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default MemberExpenses;
