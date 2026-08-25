import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { 
    CreditCard, 
    History, 
    CheckCircle2, 
    Wallet, 
    ArrowUpRight, 
    ShieldCheck, 
    Search, 
    ShoppingCart, 
    Wifi, 
    Flame, 
    Zap, 
    PackageCheck, 
    Receipt 
} from 'lucide-react';
import { cn } from '../../lib/utils';

const getCategoryDetails = (category, title = '', description = '') => {
    const cat = String(category || '').toLowerCase();
    const text = (String(title) + ' ' + String(description)).toLowerCase();

    if (cat === 'deposit') {
        return {
            label: 'Deposit Credited',
            icon: CheckCircle2,
            badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            iconBoxClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            defaultTitle: 'Mess Vault Deposit Contribution'
        };
    }
    if (cat === 'market') {
        return {
            label: 'Market Purchase',
            icon: ShoppingCart,
            badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            iconBoxClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            defaultTitle: 'Market Grocery Purchase'
        };
    }
    if (cat === 'wifi' || text.includes('wifi')) {
        return {
            label: 'WiFi Bill',
            icon: Wifi,
            badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            iconBoxClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            defaultTitle: 'WiFi Internet Bill Payment'
        };
    }
    if (cat === 'gas' || text.includes('gas')) {
        return {
            label: 'Gas Cylinder',
            icon: Flame,
            badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
            iconBoxClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
            defaultTitle: 'Gas Cylinder Settlement'
        };
    }
    if (cat === 'electric' || text.includes('electric') || text.includes('power')) {
        return {
            label: 'Electricity Bill',
            icon: Zap,
            badgeClass: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
            iconBoxClass: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
            defaultTitle: 'Electricity Bill Payment'
        };
    }
    if (cat === 'spices' || text.includes('spice') || text.includes('oil')) {
        return {
            label: 'Spices & Oil',
            icon: PackageCheck,
            badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
            iconBoxClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
            defaultTitle: 'Spices & Cooking Oil Stock'
        };
    }
    if (cat === 'rice' || text.includes('rice') || text.includes('grain')) {
        return {
            label: 'Rice & Grains',
            icon: PackageCheck,
            badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            iconBoxClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            defaultTitle: 'Rice & Grain Stock'
        };
    }
    return {
        label: cat ? `${cat.toUpperCase()}` : 'Mess Expense',
        icon: Receipt,
        badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        iconBoxClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        defaultTitle: 'Mess Financial Transaction'
    };
};

const Payments = () => {
    const { user } = useAuth();
    const { members, expenses, globalMonth } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'deposit' | 'market' | 'bills'

    const myId = String(user?.id || user?.userId || user?._id || '');
    const currentMember = members.find(m => (
        String(m._id) === myId ||
        String(m.id) === myId ||
        m.userId === user?.userId ||
        m.name === user?.name
    ));

    // 1. Get ALL expenses and payments paid by this user
    const allMemberExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) return [];
        const memberId = currentMember?._id || currentMember?.id || user?.id || user?._id;
        const memberUserId = currentMember?.userId || user?.userId;
        const memberName = currentMember?.name || user?.name;

        return expenses.filter(e => {
            const paid = String(e.paidBy);
            return (
                paid === String(memberId) ||
                paid === memberUserId ||
                paid === memberName ||
                e.paidByName === memberName
            );
        }).map(e => ({
            ...e,
            isDeposit: e.category === 'deposit',
            isMarket: e.category === 'market'
        })).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }, [expenses, currentMember, user]);

    // Current month filtered expenses & deposits
    const currentMonthItems = useMemo(() => {
        return allMemberExpenses.filter(d => {
            if (!d.date) return false;
            if (d.date.startsWith(globalMonth)) return true;
            if (d.date.length === 10 && d.date.includes('-')) {
                const parts = d.date.split('-');
                if (parts[0].length === 2 && parts[2].length === 4) {
                    const revMonth = `${parts[2]}-${parts[1]}`;
                    if (revMonth === globalMonth) return true;
                }
            }
            return false;
        });
    }, [allMemberExpenses, globalMonth]);

    // Monthly Deposit Total
    const monthlyDepositTotal = useMemo(() => {
        return currentMonthItems
            .filter(e => e.isDeposit)
            .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    }, [currentMonthItems]);

    // Monthly Market Spend Total (Spent by user for market duty)
    const monthlyMarketTotal = useMemo(() => {
        return currentMonthItems
            .filter(e => e.isMarket)
            .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    }, [currentMonthItems]);

    // Filtered ledger items by category & search
    const filteredLedger = useMemo(() => {
        let list = currentMonthItems.length > 0 ? currentMonthItems : allMemberExpenses;
        
        if (categoryFilter === 'deposit') {
            list = list.filter(e => e.isDeposit);
        } else if (categoryFilter === 'market') {
            list = list.filter(e => e.isMarket);
        } else if (categoryFilter === 'bills') {
            list = list.filter(e => !e.isDeposit && !e.isMarket);
        }

        if (!searchTerm.trim()) return list;
        const q = searchTerm.toLowerCase().trim();
        return list.filter(item => 
            (item.title && item.title.toLowerCase().includes(q)) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.date && item.date.includes(q)) ||
            (item.category && item.category.toLowerCase().includes(q)) ||
            (item.amount && String(item.amount).includes(q))
        );
    }, [allMemberExpenses, currentMonthItems, categoryFilter, searchTerm]);

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-emerald-500 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Financial Ledger & Spends</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Financial Terminal</h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                        Activity for <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 font-extrabold">{globalMonth}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl self-start md:self-auto shadow-sm">
                    <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Account Verified</span>
                </div>
            </div>

            {/* Executive 2-Card Metric Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Monthly Deposit */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/5 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Vault Deposit</span>
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Wallet size={14} />
                        </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                        ₹{monthlyDepositTotal.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight size={12} />
                        <span>Verified Deposit Balance</span>
                    </div>
                </div>

                {/* 2. Market Spends */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/5 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Market Spend</span>
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                            <ShoppingCart size={14} />
                        </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                        ₹{monthlyMarketTotal.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                        <ArrowUpRight size={12} />
                        <span>Duty Market Purchases</span>
                    </div>
                </div>
            </div>

            {/* Transaction & Spend Ledger Card */}
            <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5">
                <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 shadow-sm">
                            <History size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Verified Financial Ledger</h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Itemized deposits, market spends & bills</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'deposit', label: 'Deposits' },
                                { id: 'market', label: 'Market Spends' },
                                { id: 'bills', label: 'Bills & Others' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setCategoryFilter(tab.id)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all",
                                        categoryFilter === tab.id
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-56">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search entries..."
                                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredLedger.length > 0 ? (
                        filteredLedger.map((item) => {
                            const itemId = item._id || item.id;
                            const amount = Number(item.amount) || 0;
                            const catDetails = getCategoryDetails(item.category, item.title, item.description);
                            const ItemIcon = catDetails.icon;

                            return (
                                <div
                                    key={itemId}
                                    className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                                        <div className={cn(
                                            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm border group-hover:scale-105 transition-transform shrink-0",
                                            catDetails.iconBoxClass
                                        )}>
                                            <ItemIcon size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={cn(
                                                    "text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0",
                                                    catDetails.badgeClass
                                                )}>
                                                    {catDetails.label}
                                                </span>
                                                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                    {item.date}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">
                                                {item.title || item.description || catDetails.defaultTitle}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                            +₹{amount.toLocaleString()}
                                        </div>
                                        <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            Verified
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-16 text-center">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/40 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-dashed border-slate-200 dark:border-white/10">
                                <CheckCircle2 size={20} className="text-slate-400" />
                            </div>
                            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                No financial records found for this filter
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Payments;
