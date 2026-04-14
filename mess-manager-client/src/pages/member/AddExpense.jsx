import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Receipt, PlusCircle, History, Trash2, TrendingUp, ArrowRight, User, Wallet, Sparkles, Info, X, ShoppingBag, Flame, Wifi, Zap, Package, Calendar, ShoppingCart, Utensils, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const AddExpense = () => {
    const { addExpense, expenses, members, updateMember, deleteExpense, globalMonth, setGlobalMonth, refreshExpenses } = useData();
    const { user } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isAdmin = user?.role === 'admin';

    // Compute each member's general deposit balance for the selected month
    const getMemberGeneralDeposit = (member) => {
        if (!Array.isArray(expenses)) return 0;
        const memberId = member._id || member.id;
        return expenses
            .filter(e =>
                e.category === 'deposit' &&
                (e.paidBy === memberId || e.paidBy === String(memberId) || e.paidBy === member?.userId || e.paidBy === member?.name)
            )
            .reduce((sum, e) => sum + (e.amount || 0), 0);
    };

    const getMemberName = (paidBy) => {
        if (paidBy === 'admin') return 'Admin Account';
        const m = members?.find(member => (member.id === paidBy || member._id === paidBy || member.userId === paidBy || member.name === paidBy));
        return m?.name || paidBy;
    };

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(isAdmin ? 'spices' : 'market');
    const [transactionDate, setTransactionDate] = useState(() => {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        return dateStr.startsWith(globalMonth) ? dateStr : `${globalMonth}-01`;
    });

    const [activeTab, setActiveTab] = useState('expense');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [paymentPurpose, setPaymentPurpose] = useState('deposit');
    const purposeOptions = [
        { id: 'deposit', name: 'General Deposit', icon: Wallet },
        { id: 'market', name: 'Market Payment', icon: ShoppingCart },
        { id: 'gas', name: 'Gas Bill', icon: Flame },
        { id: 'wifi', name: 'WiFi Bill', icon: Wifi },
        { id: 'electric', name: 'Electric Bill', icon: Zap }
    ];

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        if (!title || !amount || !category) return;

        const result = await addExpense({
            description: title,
            amount: Number(amount),
            category,
            paidBy: isAdmin ? 'admin' : (user.id || user.userId),
            date: transactionDate,
            status: 'approved'
        });

        if (result.success) {
            setTitle('');
            setAmount('');
            setCategory(isAdmin ? 'spices' : 'market');
            alert('✅ Expense submitted successfully!');
        } else {
            alert('❌ Error: ' + result.error);
        }
    };

    const handleDepositSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMemberId || !depositAmount) return;

        const member = members.find(m => m.id === selectedMemberId || m._id === selectedMemberId);
        if (!member) return;

        const amountNum = Number(depositAmount);
        if (amountNum <= 0) {
            alert('❌ Please enter a valid positive amount.');
            return;
        }

        const newTotal = (member.deposit || 0) + amountNum;
        await updateMember(selectedMemberId, { deposit: newTotal });

        const isGeneral = paymentPurpose === 'deposit';
        const purposeLabel = purposeOptions.find(p => p.id === paymentPurpose)?.name || 'Credit Account';

        const res = await addExpense({
            description: `${purposeLabel} (By ${member.name})`,
            amount: Number(depositAmount),
            category: paymentPurpose,
            paidBy: selectedMemberId,
            date: transactionDate,
            status: 'approved'
        });

        if (res.success) {
            setIsRefreshing(true);
            await refreshExpenses();
            setIsRefreshing(false);

            setDepositAmount('');

            // Check if month mismatch
            const selectedMonth = transactionDate.substring(0, 7);
            if (selectedMonth !== globalMonth) {
                const monthName = new Date(transactionDate).toLocaleString('default', { month: 'long', year: 'numeric' });
                alert(`✅ Success! ₹${depositAmount} recorded for ${member.name} in ${monthName}.\n\n📌 Note: To see this in the audit log, please switch the Global Timeline at the top to ${monthName}.`);
            } else {
                alert(`✅ Transaction successful! ₹${depositAmount} recorded as ${purposeLabel} for ${member.name}.`);
            }
        } else {
            alert(`❌ Error: ${res.error || 'Failed to record transaction'}`);
        }
    };

    const historyItems = useMemo(() => {
        if (!expenses) return [];
        return expenses.filter(e => {
            // Apply Global Month Filter
            if (e.date && globalMonth && !e.date.startsWith(globalMonth)) return false;

            const myId = user.id || user.userId || user._id;

            if (isAdmin) {
                // Admin sees what they entered in the current tab context
                if (activeTab === 'expense') return e.paidBy === 'admin';
                return e.paidBy !== 'admin'; // Deposits
            }

            return e.paidBy === myId || e.paidBy === String(myId) || e.paidBy === user.name;
        }).sort((a, b) => {
            // Sort by date descending
            const dateCompare = new Date(b.date) - new Date(a.date);
            if (dateCompare !== 0) return dateCompare;
            // If dates are equal, use ID or array index (implicit in expenses order)
            // But since we want "recently added", and expenses are usually pushed, 
            // the one with higher index in the original array is more recent.
            return expenses.indexOf(b) - expenses.indexOf(a);
        });
    }, [expenses, globalMonth, user, isAdmin, activeTab]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="relative overflow-hidden rb-card p-6 sm:p-10 group">
                <div className="absolute inset-0 opacity-10 dark:opacity-[0.03] pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-primary-500 animate-pulse" />
                            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em]">Institutional Grade Audit</span>
                        </div>
                        <h1 className="text-3xl sm:text-6xl rb-header">
                            {isAdmin ? 'Financial Terminal' : 'Market Terminal'}
                        </h1>
                        <p className="text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-4 h-[1px] bg-indigo-500 dark:bg-indigo-700"></div>
                            {isAdmin ? 'Manage Mess Vault & Member Records' : 'Log Daily Procurement Logs'}
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-1.5 p-1.5 bg-indigo-300/40 dark:bg-slate-800/50 border border-indigo-300/30 dark:border-white/5 rounded-[1.5rem] backdrop-blur-sm self-start lg:self-center">
                            <button
                                className={cn(
                                    "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                    activeTab === 'expense'
                                        ? "bg-indigo-300/40 dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-[0_8px_20px_rgba(99,102,241,0.15)] scale-[1.02] border border-indigo-400/20"
                                        : "text-indigo-500/60 hover:text-indigo-600 dark:hover:text-slate-300"
                                )}
                                onClick={() => setActiveTab('expense')}
                            >
                                <PlusCircle size={14} className={activeTab === 'expense' ? "text-primary-500" : "opacity-40"} />
                                Expense Entry
                            </button>
                            <button
                                className={cn(
                                    "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                    activeTab === 'deposit'
                                        ? "bg-emerald-300/40 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-[0_8px_20px_rgba(16,185,129,0.15)] scale-[1.02] border border-emerald-400/20"
                                        : "text-indigo-500/60 hover:text-indigo-600 dark:hover:text-slate-300"
                                )}
                                onClick={() => setActiveTab('deposit')}
                            >
                                <Receipt size={14} className={activeTab === 'deposit' ? "text-emerald-500" : "opacity-40"} />
                                Manage Deposits
                            </button>
                        </div>
                    )}
                </div>

            </div>

            <div className="grid grid-cols-1 gap-12 items-start">
                <div className="space-y-8">
                    <AnimatePresence mode="wait">
                        {(!isAdmin || activeTab === 'expense') ? (
                            <motion.div
                                key="expense-form"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card className="rb-card rb-shadow-indigo p-6 sm:p-10 relative group overflow-hidden">
                                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary-500/20 transition-all"></div>
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <ShoppingBag size={140} strokeWidth={1} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="p-3 bg-primary-300/40 dark:bg-primary-950/40 rounded-2xl shadow-inner border border-primary-400/20">
                                                <PlusCircle size={24} className="text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl rb-header mb-1">
                                                    {isAdmin ? 'Expense Entry' : 'Market Purchase Log'}
                                                </h2>
                                                <div className="p-4 rounded-2xl bg-indigo-300/40 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-500/20 group-hover:scale-110 transition-transform shadow-inner border border-indigo-400/20">
                                                    <Utensils size={24} />
                                                </div>
                                            </div>
                                        </div>
                                        <form onSubmit={handleExpenseSubmit} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                                <Input label="Transaction Date" type="date" value={transactionDate} onChange={e => { const newDate = e.target.value; setTransactionDate(newDate); const newMonth = newDate.substring(0, 7); if (newMonth !== globalMonth) setGlobalMonth(newMonth); }} className="bg-indigo-300/40 dark:bg-slate-950/50 border-indigo-300/30" required />
                                                <Input label="Item Description" value={title} onChange={e => setTitle(e.target.value)} className="bg-indigo-300/40 dark:bg-slate-950/50 border-indigo-300/30" required />
                                            </div>
                                            <div className="relative pt-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-3 block">Total Amount (₹)</label>
                                                <div className="relative group/amt">
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 group-focus-within/amt:text-primary-500 transition-colors">₹</div>
                                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-16 pr-8 py-8 bg-indigo-300/40 dark:bg-slate-950/80 border-2 border-indigo-300/30 dark:border-white/5 rounded-3xl text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800" required />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 block">Fund Category Allocation</label>
                                                {isAdmin ? (
                                                    <div className="relative group/carousel-admin">
                                                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-indigo-300/40 dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel-admin:opacity-100 transition-opacity"></div>
                                                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-indigo-300/40 dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel-admin:opacity-100 transition-opacity"></div>

                                                        <div className="flex overflow-x-auto gap-4 pb-4 pt-1 px-1 custom-scrollbar scroll-smooth w-full">
                                                            {[
                                                                { id: 'spices', n: 'Spices', i: Flame, c: 'orange' },
                                                                { id: 'rice', n: 'Rice', i: ShoppingBag, c: 'emerald' },
                                                                { id: 'others', n: 'Other', i: Package, c: 'indigo' }
                                                            ].map(cat => (
                                                                <button
                                                                    key={cat.id}
                                                                    type="button"
                                                                    onClick={() => setCategory(cat.id)}
                                                                    className={cn(
                                                                        "flex-shrink-0 min-w-[120px] p-6 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-4 group/cat relative overflow-hidden snap-center",
                                                                        category === cat.id
                                                                            ? cn(
                                                                                "border-primary-500 dark:border-primary-400 bg-indigo-300/40 dark:bg-primary-950/40 scale-[1.05] shadow-2xl shadow-primary-500/20",
                                                                                cat.c === 'orange' && "ring-orange-500/10",
                                                                                cat.c === 'emerald' && "ring-emerald-500/10",
                                                                                cat.c === 'indigo' && "ring-indigo-500/10"
                                                                            )
                                                                            : "border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-slate-950/50 text-slate-400 hover:border-indigo-300 hover:bg-indigo-300/40 dark:hover:bg-slate-900 shadow-sm"
                                                                    )}
                                                                >
                                                                    <cat.i size={24} className={cn("transition-all duration-500", category === cat.id ? (cat.c === 'orange' ? "text-orange-500" : cat.c === 'emerald' ? "text-emerald-500" : "text-indigo-500") : "text-slate-300 opacity-40 group-hover/cat:scale-125 group-hover/cat:opacity-100")} />
                                                                    <span className={cn("text-[11px] font-black uppercase tracking-[0.2em]", category === cat.id ? "text-slate-900 dark:text-slate-100" : "text-slate-400 group-hover:text-slate-600")}>{cat.n}</span>

                                                                    {category === cat.id && (
                                                                        <motion.div layoutId="category-glow" className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 dark:via-white/2 dark:to-white/5 pointer-events-none" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-6 rounded-[1.5rem] bg-gradient-to-r from-indigo-300/40 to-blue-300/40 dark:from-indigo-950/20 dark:to-blue-950/20 border border-indigo-300/30 dark:border-indigo-900/30 flex items-center justify-between group/market shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-indigo-300/40 rounded-2xl group-hover/market:rotate-12 transition-transform shadow-inner border border-indigo-400/20"><Sparkles size={20} className="text-primary-600 dark:text-indigo-400" /></div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-1">Authenticated Category</p>
                                                                <p className="text-sm font-black text-indigo-950 dark:text-slate-100 uppercase tracking-tighter leading-none">🛒 Mess Market Collection Fund</p>
                                                            </div>
                                                        </div>
                                                        <div className="p-2 bg-indigo-300/40 rounded-lg border border-indigo-400/20"><Info size={16} className="text-indigo-500 animate-pulse" /></div>
                                                    </div>
                                                )}
                                            </div>
                                            <Button type="submit" className="w-full py-8 rounded-3xl bg-gradient-to-r from-slate-900 via-primary-600 to-indigo-700 hover:from-black hover:to-indigo-800 text-white shadow-2xl shadow-primary-500/30 active:scale-[0.98] transition-all font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs overflow-hidden relative group">
                                                <div className="relative z-10 flex items-center justify-center gap-3">Finalize Transaction <ArrowRight size={18} /></div>
                                                <div className="absolute inset-0 bg-indigo-300/40 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
                                            </Button>
                                        </form>
                                    </div>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="deposit-form"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card className="rb-card rb-shadow-emerald p-6 sm:p-10 relative group overflow-hidden">
                                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Receipt size={140} strokeWidth={1} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="p-3 bg-emerald-300/40 dark:bg-emerald-950/40 rounded-2xl shadow-inner border border-emerald-400/20">
                                                <TrendingUp size={24} className="text-emerald-700 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl rb-header mb-1">Deposit Registry</h2>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Internal Member Credit Interface</p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleDepositSubmit} className="space-y-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-1.5"><User size={10} /> Select Member Account</label>
                                                <div className="relative group/sel">
                                                    <select className="w-full p-6 bg-indigo-300/40 dark:bg-slate-950/80 border-2 border-indigo-300/30 dark:border-white/5 rounded-3xl focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100 font-black tracking-tight transition-all appearance-none cursor-pointer" value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} required >
                                                        <option value="">AWAITING SELECTION...</option>
                                                        {members.filter(m => m.role === 'member').map(m => (
                                                            <option key={m.id || m._id} value={m.id || m._id} className="dark:bg-slate-900">{m.name.toUpperCase()} (AVL: ₹{getMemberGeneralDeposit(m)})</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/sel:rotate-180 transition-transform"><ArrowRight size={20} className="rotate-90" /></div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                                <Input label="Execution Date" type="date" value={transactionDate} onChange={e => { const newDate = e.target.value; setTransactionDate(newDate); const newMonth = newDate.substring(0, 7); if (newMonth !== globalMonth) setGlobalMonth(newMonth); }} className="bg-indigo-300/40 dark:bg-slate-950/50 border-indigo-300/30" required />
                                                <div className="relative group/amt">
                                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-2.5 block">Credit Amount (₹)</label>
                                                    <div className="relative">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400 group-focus-within/amt:text-emerald-500 transition-colors">₹</div>
                                                        <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.00" className="w-full pl-10 pr-4 py-4 bg-indigo-300/40 dark:bg-slate-950/50 border-2 border-indigo-300/30 dark:border-white/5 rounded-2xl text-xl font-black text-slate-900 dark:text-slate-100 tracking-tighter focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800" required />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-1.5"><Info size={10} /> Allocation Purpose</label>
                                                <div className="relative group/carousel">
                                                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-indigo-300/40 dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity"></div>
                                                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-indigo-300/40 dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity"></div>

                                                    <div className="flex overflow-x-auto gap-4 pb-4 pt-1 px-1 custom-scrollbar scroll-smooth w-full">
                                                        {[
                                                            { id: 'deposit', n: 'Deposit', i: Wallet, c: 'emerald' },
                                                            { id: 'market', n: 'Market', i: ShoppingCart, c: 'sky' },
                                                            { id: 'gas', n: 'Gas', i: Flame, c: 'rose' },
                                                            { id: 'wifi', n: 'WiFi', i: Wifi, c: 'blue' },
                                                            { id: 'electric', n: 'Electric', i: Zap, c: 'amber' }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.id}
                                                                type="button"
                                                                onClick={() => setPaymentPurpose(opt.id)}
                                                                className={cn(
                                                                    "flex-shrink-0 min-w-[100px] p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-3 group/opt relative overflow-hidden snap-center",
                                                                    paymentPurpose === opt.id
                                                                        ? cn(
                                                                            "border-indigo-500 dark:border-indigo-400 bg-indigo-300/40 dark:bg-indigo-950/40 scale-[1.05] shadow-2xl shadow-indigo-500/20",
                                                                            opt.c === 'sky' && "ring-indigo-500/10",
                                                                            opt.c === 'rose' && "ring-indigo-500/10",
                                                                            opt.c === 'blue' && "ring-indigo-500/10"
                                                                        )
                                                                        : "border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-slate-950/50 text-slate-400 hover:border-indigo-300 hover:bg-indigo-300/40 dark:hover:bg-slate-900 shadow-sm"
                                                                )}
                                                            >
                                                                <opt.i size={20} className={cn("transition-all duration-500", paymentPurpose === opt.id ? "text-indigo-500" : "text-slate-300 opacity-40 group-hover/opt:scale-125 group-hover/opt:opacity-100")} />
                                                                <span className={cn("text-[10px] font-black uppercase tracking-[0.1em]", paymentPurpose === opt.id ? "text-slate-900 dark:text-slate-100" : "text-slate-400 group-hover:text-slate-600")}>{opt.n}</span>

                                                                {paymentPurpose === opt.id && (
                                                                    <motion.div layoutId="purpose-glow" className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 dark:via-white/2 dark:to-white/5 pointer-events-none" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full py-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-600 to-teal-700 hover:from-black hover:to-teal-800 text-white shadow-2xl shadow-emerald-500/30 active:scale-[0.98] transition-all font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs overflow-hidden relative group">
                                                <div className="relative z-10 flex items-center justify-center gap-3">Update Balance <ArrowRight size={18} /></div>
                                                <div className="absolute inset-0 bg-indigo-300/40 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
                                            </Button>
                                        </form>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {historyItems.length > 0 && (
                <div className="space-y-8 mt-12">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <History size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                            {isAdmin && activeTab === 'deposit' ? 'Recent Deposits' : 'Your Recent Entries'}
                        </h3>
                        <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-600 px-2 py-1 rounded-lg">
                            {historyItems.length} Records
                        </span>
                    </div>

                    <Card className="rb-card p-0 overflow-hidden border-indigo-300/30 dark:border-white/5 bg-indigo-300/10 dark:bg-slate-900/40 backdrop-blur-md">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-indigo-300/40 dark:bg-slate-900/80 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-slate-500 border-b border-indigo-300/20 dark:border-white/5">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-indigo-300/10 dark:divide-white/5">
                                    {historyItems.map(expense => (
                                        <tr key={expense._id || expense.id} className="group transition-colors hover:bg-white/40 dark:hover:bg-white/5">
                                            <td className="p-4 text-xs font-bold text-slate-500 tabular-nums">
                                                {expense.date}
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                                                    {expense.description || expense.title}
                                                </p>
                                                {isAdmin && activeTab === 'deposit' && (
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                        For: {getMemberName(expense.paidBy)}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={cn(
                                                    "text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest border flex items-center gap-1 w-fit",
                                                    expense.category === 'market' && "bg-blue-300/20 text-blue-600 border-blue-400/20",
                                                    expense.category === 'spices' && "bg-orange-300/20 text-orange-600 border-orange-400/20",
                                                    expense.category === 'rice' && "bg-emerald-300/20 text-emerald-600 border-emerald-400/20",
                                                    expense.category === 'deposit' && "bg-emerald-300/20 text-emerald-600 border-emerald-400/20",
                                                    expense.category === 'wifi' && "bg-blue-300/20 text-blue-600 border-blue-400/20",
                                                    expense.category === 'gas' && "bg-rose-300/20 text-rose-600 border-rose-400/20",
                                                    expense.category === 'electric' && "bg-amber-300/20 text-amber-600 border-amber-400/20",
                                                    (expense.category === 'others' || expense.category === 'other') && "bg-slate-300/20 text-slate-600 border-slate-400/20",
                                                    "bg-slate-300/20 text-slate-600 border-slate-400/20"
                                                )}>
                                                    {expense.category === 'market' && '🛒 Market'}
                                                    {expense.category === 'spices' && '🌶️ Spices'}
                                                    {expense.category === 'rice' && '🍚 Rice'}
                                                    {expense.category === 'deposit' && '💰 Deposit'}
                                                    {expense.category === 'wifi' && '🛜 WiFi'}
                                                    {expense.category === 'gas' && '🔥 Gas'}
                                                    {expense.category === 'electric' && '⚡ Electric'}
                                                    {(expense.category === 'others' || expense.category === 'other') && '📦 Other'}
                                                    {!['market', 'spices', 'rice', 'deposit', 'wifi', 'gas', 'electric', 'others', 'other'].includes(expense.category) && <span>{expense.category}</span>}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums">
                                                ₹{expense.amount}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Delete this entry permanently?')) {
                                                            deleteExpense(expense._id || expense.id);
                                                        }
                                                    }}
                                                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </motion.div>
    );
};

export default AddExpense;


