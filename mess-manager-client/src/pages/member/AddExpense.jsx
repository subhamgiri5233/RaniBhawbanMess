import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Receipt, PlusCircle, History, Trash2, TrendingUp, ArrowRight, User, Wallet, Sparkles, Info, X, ShoppingBag, Flame, Wifi, Zap, Package, Calendar, ShoppingCart } from 'lucide-react';
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
    const [filterCategory, setFilterCategory] = useState('all'); 

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

    const historyItems = expenses.filter(e => {
        if (isAdmin) {
            // Unified View: Show actual purchases (admin-paid) in the list if filtering,
            // but hide redundant 'payment' records which are now summarized in pills.
            const isPurchase = e.paidBy === 'admin';
            const isPayment = e.paidBy !== 'admin';

            if (activeTab === 'deposit') {
                const matchesFilter = filterCategory === 'all' || e.category === filterCategory;
                // Only show purchases in the list when viewing a specific category,
                // hide payments because they are in the pills.
                if (filterCategory !== 'all') {
                    return isPurchase && matchesFilter;
                }
                // In 'All' view, we can show everything or just purchases. 
                // Given the user request, focus on purchases.
                return isPurchase;
            } else {
                return isPurchase;
            }
        }
        // For members, show their own records AND collective market procurement
        const isMine = e.paidBy === (user.id || user.userId || user._id) || e.paidBy === user.name;
        const isCollectiveMarket = e.paidBy === 'admin' && (e.category === 'market' || e.category === 'rice' || e.category === 'spices');
        return isMine || isCollectiveMarket;
    }).reverse();

    const categoryTotal = historyItems.reduce((sum, e) => sum + (e.amount || 0), 0);

    const contributorTotals = useMemo(() => {
        if (!expenses) return [];
        // Find all member-paid records for the current category
        const memberPayments = expenses.filter(e => {
            const isPayment = e.paidBy !== 'admin';
            const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
            return isPayment && matchesCategory;
        });

        const totalsByPayer = {};
        memberPayments.forEach(e => {
            const payer = e.paidBy;
            if (!totalsByPayer[payer]) totalsByPayer[payer] = 0;
            totalsByPayer[payer] += (e.amount || 0);
        });

        return Object.entries(totalsByPayer)
            .map(([payerId, total]) => {
                const member = members.find(m => m.id === payerId || m._id === payerId || m.userId === payerId || m.name === payerId);
                return {
                    name: member?.name || (payerId === 'admin' ? 'Admin Fund' : payerId),
                    amount: total,
                    id: payerId
                };
            })
            .filter(item => item.amount > 0)
            .sort((a, b) => b.amount - a.amount);
    }, [expenses, members, filterCategory]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="relative overflow-hidden bg-white/90 dark:bg-slate-900 shadow-sm p-6 sm:p-10 rounded-[2.5rem] border border-indigo-100/50 dark:border-white/5 backdrop-blur-xl group">
                <div className="absolute inset-0 opacity-10 dark:opacity-[0.03] pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-primary-500 animate-pulse" />
                            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em]">Institutional Grade Audit</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-50 tracking-tighter leading-none">
                            {isAdmin ? 'Financial Terminal' : 'Market Terminal'}
                        </h1>
                        <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-4 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
                            {isAdmin ? 'Manage Mess Vault & Member Records' : 'Log Daily Procurement Logs'}
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 rounded-[1.5rem] backdrop-blur-sm self-start lg:self-center">
                            <button
                                className={cn(
                                    "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                    activeTab === 'expense'
                                        ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-[0_8px_20px_rgba(99,102,241,0.15)] scale-[1.02]"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-[0_8px_20px_rgba(16,185,129,0.15)] scale-[1.02]"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-8">
                    <AnimatePresence mode="wait">
                        {(!isAdmin || activeTab === 'expense') ? (
                            <motion.div
                                key="expense-form"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card className="p-6 sm:p-10 shadow-sm border-indigo-100/50 bg-white/90 backdrop-blur-xl overflow-hidden relative group rounded-[2.5rem]">
                                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary-500/20 transition-all"></div>
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <ShoppingBag size={140} strokeWidth={1} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="p-3 bg-primary-100 dark:bg-primary-950/40 rounded-2xl shadow-inner">
                                                <PlusCircle size={24} className="text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase leading-none mb-1">
                                                    {isAdmin ? 'Expense Entry' : 'Market Purchase Log'}
                                                </h2>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Authorized Transaction Interface</p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleExpenseSubmit} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <Input label="Transaction Date" type="date" value={transactionDate} onChange={e => { const newDate = e.target.value; setTransactionDate(newDate); const newMonth = newDate.substring(0, 7); if (newMonth !== globalMonth) setGlobalMonth(newMonth); }} className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200/50" required />
                                                <Input label="Item Description" placeholder="e.g. 5kg Rice or Gas Refill" value={title} onChange={e => setTitle(e.target.value)} className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200/50" required />
                                            </div>
                                            <div className="relative pt-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-3 block">Total Amount (₹)</label>
                                                <div className="relative group/amt">
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 group-focus-within/amt:text-primary-500 transition-colors">₹</div>
                                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-16 pr-8 py-8 bg-slate-50/50 dark:bg-slate-950/80 border-2 border-slate-100 dark:border-white/5 rounded-3xl text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-slate-800" required />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 block">Fund Category Allocation</label>
                                                {isAdmin ? (
                                                    <div className="relative group/carousel-admin">
                                                        {/* Fade Masks */}
                                                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel-admin:opacity-100 transition-opacity"></div>
                                                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel-admin:opacity-100 transition-opacity"></div>

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
                                                                        "flex-shrink-0 min-w-[120px] p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 group/cat relative overflow-hidden snap-center", 
                                                                        category === cat.id 
                                                                            ? cn(
                                                                                "border-primary-500 dark:border-primary-400 bg-white dark:bg-primary-950/40 scale-[1.05] shadow-2xl shadow-primary-500/20", 
                                                                                cat.c === 'orange' && "ring-orange-500/10", 
                                                                                cat.c === 'emerald' && "ring-emerald-500/10", 
                                                                                cat.c === 'indigo' && "ring-indigo-500/10"
                                                                            ) 
                                                                            : "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 hover:border-slate-200 hover:bg-white dark:hover:bg-slate-900 shadow-sm"
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
                                                    <div className="p-6 rounded-[2rem] bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-between group/market">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover/market:rotate-12 transition-transform"><Sparkles size={20} className="text-indigo-500" /></div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Authenticated Category</p>
                                                                <p className="text-sm font-black text-indigo-900 dark:text-slate-100 uppercase tracking-tighter leading-none">🛒 Mess Market Collection Fund</p>
                                                            </div>
                                                        </div>
                                                        <div className="p-2 bg-indigo-500/10 rounded-lg"><Info size={16} className="text-indigo-500 animate-pulse" /></div>
                                                    </div>
                                                )}
                                            </div>
                                            <Button type="submit" className="w-full py-8 rounded-3xl bg-gradient-to-r from-slate-900 via-primary-600 to-indigo-700 hover:from-black hover:to-indigo-800 text-white shadow-2xl shadow-primary-500/30 active:scale-[0.98] transition-all font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs overflow-hidden relative group">
                                                <div className="relative z-10 flex items-center justify-center gap-3">Finalize Transaction <ArrowRight size={18} /></div>
                                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
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
                                <Card className="p-6 sm:p-10 shadow-sm border-indigo-100/50 bg-white/90 backdrop-blur-xl overflow-hidden relative group rounded-[2.5rem]">
                                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Receipt size={140} strokeWidth={1} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl shadow-inner">
                                                <TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase leading-none mb-1">Deposit Registry</h2>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Internal Member Credit Interface</p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleDepositSubmit} className="space-y-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-1.5"><User size={10} /> Select Member Account</label>
                                                <div className="relative group/sel">
                                                    <select className="w-full p-6 bg-slate-50/50 dark:bg-slate-950/80 border-2 border-slate-100 dark:border-white/5 rounded-3xl focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100 font-black tracking-tight transition-all appearance-none cursor-pointer" value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} required >
                                                        <option value="">AWAITING SELECTION...</option>
                                                        {members.filter(m => m.role === 'member').map(m => (
                                                            <option key={m.id || m._id} value={m.id || m._id} className="dark:bg-slate-900">{m.name.toUpperCase()} (AVL: ₹{getMemberGeneralDeposit(m)})</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/sel:rotate-180 transition-transform"><ArrowRight size={20} className="rotate-90" /></div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <Input label="Execution Date" type="date" value={transactionDate} onChange={e => { const newDate = e.target.value; setTransactionDate(newDate); const newMonth = newDate.substring(0, 7); if (newMonth !== globalMonth) setGlobalMonth(newMonth); }} className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200/50" required />
                                                <div className="relative group/amt">
                                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-2.5 block">Credit Amount (₹)</label>
                                                    <div className="relative">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400 group-focus-within/amt:text-emerald-500 transition-colors">₹</div>
                                                        <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.00" className="w-full pl-10 pr-4 py-4 bg-slate-50/50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl text-xl font-black text-slate-900 dark:text-slate-100 tracking-tighter focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-slate-800" required />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-1.5"><Info size={10} /> Allocation Purpose</label>
                                                <div className="relative group/carousel">
                                                    {/* Fade Masks */}
                                                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity"></div>
                                                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity"></div>

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
                                                                    "flex-shrink-0 min-w-[100px] p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group/opt relative overflow-hidden snap-center", 
                                                                    paymentPurpose === opt.id 
                                                                        ? cn(
                                                                            "border-emerald-500 dark:border-emerald-400 bg-white dark:bg-emerald-950/40 scale-[1.05] shadow-2xl shadow-emerald-500/20", 
                                                                            opt.c === 'sky' && "ring-sky-500/10", 
                                                                            opt.c === 'rose' && "ring-rose-500/10", 
                                                                            opt.c === 'blue' && "ring-blue-500/10"
                                                                        ) 
                                                                        : "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 hover:border-slate-200 hover:bg-white dark:hover:bg-slate-900 shadow-sm"
                                                                )}
                                                            >
                                                                <opt.i size={20} className={cn("transition-all duration-500", paymentPurpose === opt.id ? (opt.c === 'emerald' ? "text-emerald-500" : opt.c === 'sky' ? "text-sky-500" : opt.c === 'rose' ? "text-rose-500" : opt.c === 'blue' ? "text-blue-500" : "text-amber-500") : "text-slate-300 opacity-40 group-hover/opt:scale-125 group-hover/opt:opacity-100")} />
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
                                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
                                            </Button>
                                        </form>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="space-y-8 lg:mt-0 mt-8">
                    <Card className="p-0 overflow-hidden shadow-sm border-indigo-100/50 bg-white/40 backdrop-blur-lg dark:bg-slate-900/40 rounded-[2.5rem]">
                        <div className="p-6 sm:p-8 border-b border-indigo-100/50 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-y-6 gap-x-8">
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner"><History size={20} className="text-slate-500" /></div>
                                <div>
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase text-sm leading-tight">{activeTab === 'deposit' ? 'Managed Deposits' : 'Terminal Audit Log'}</h3>
                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        {isRefreshing ? (
                                            <span className="text-primary-500 animate-pulse flex items-center gap-1"><TrendingUp size={8} /> Syncing Vault...</span>
                                        ) : (
                                            "Authorized Transaction Stream"
                                        )}
                                    </p>
                                </div>
                            </div>
                            
                            {activeTab === 'deposit' && (
                                <div className="flex flex-col gap-6 flex-1 sm:max-w-md">
                                    <div className="relative group/carousel-filters">
                                        {/* Fade Masks */}
                                        {/* Permanent Fade Masks for Mobile Visibility */}
                                        <div className="absolute left-0 top-0 bottom-10 w-12 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none transition-opacity"></div>
                                        <div className="absolute right-0 top-0 bottom-10 w-12 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none transition-opacity"></div>

                                        <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar scroll-smooth px-1 w-full">
                                            {[
                                                { id: 'all',      label: 'All',      active: 'bg-gradient-to-r from-slate-700 to-slate-900 text-white border-transparent shadow-[0_8px_20px_rgba(15,23,42,0.4)] scale-110' },
                                                { id: 'deposit',  label: 'Deposit',  active: 'bg-gradient-to-r from-blue-500 to-blue-700 text-white border-transparent shadow-[0_8px_20px_rgba(59,130,246,0.5)] scale-110' },
                                                { id: 'market',   label: 'Market',   active: 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_8px_20px_rgba(99,102,241,0.5)] scale-110' },
                                                { id: 'gas',      label: 'Gas',      active: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-transparent shadow-[0_8px_20px_rgba(245,158,11,0.5)] scale-110' },
                                                { id: 'wifi',     label: 'WiFi',     active: 'bg-gradient-to-r from-cyan-400 to-sky-500 text-white border-transparent shadow-[0_8px_20px_rgba(6,182,212,0.5)] scale-110' },
                                                { id: 'electric', label: 'Electric', active: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-transparent shadow-[0_8px_20px_rgba(244,63,94,0.5)] scale-110' },
                                            ].map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setFilterCategory(cat.id)}
                                                    className={cn(
                                                        "flex-shrink-0 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border snap-center relative overflow-hidden",
                                                        filterCategory === cat.id
                                                            ? cat.active
                                                            : "bg-white/50 dark:bg-slate-800/40 text-slate-400 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-600 dark:hover:text-slate-200"
                                                    )}
                                                >
                                                    <span className="relative z-10">{cat.label}</span>
                                                    {filterCategory === cat.id && (
                                                        <motion.div layoutId="filter-glow-active" className="absolute inset-0 bg-white/10" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* Shared Contributor Breakdown - Visible to Admin & Members */}
                        {contributorTotals.length > 0 && (
                            <div className="px-6 sm:px-8 py-6 bg-slate-50/30 dark:bg-slate-900/40 border-b border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500"><User size={12} /></div>
                                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{filterCategory === 'all' ? 'Contribution Stream' : `${filterCategory} Breakdown`}</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {contributorTotals.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group/pill hover:scale-[1.02]"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/20">
                                                {item.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate">{item.name}</span>
                                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">₹{item.amount.toLocaleString()}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                        <div className="max-h-[700px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 custom-scrollbar">
                            {historyItems.map((expense, idx) => (
                                <motion.div key={expense._id || expense.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="p-6 sm:p-8 flex justify-between items-center hover:bg-white dark:hover:bg-white/5 transition-all group relative overflow-hidden" >
                                    <div className="relative z-10 flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2.5">
                                            <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase text-[13px]">{expense.description || expense.title}</p>
                                            {expense.category && (
                                                <span className={cn(
                                                    "text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest",
                                                    expense.category === 'market'   ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" :
                                                    expense.category === 'spices'   ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" :
                                                    expense.category === 'rice'     ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                                    expense.category === 'deposit'  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                                                    expense.category === 'gas'      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                                                    expense.category === 'wifi'     ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400" :
                                                    expense.category === 'electric' ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" :
                                                    "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400"
                                                )}>
                                                    {expense.category === 'gas'      && '🔥 '}
                                                    {expense.category === 'wifi'     && '📶 '}
                                                    {expense.category === 'electric' && '⚡ '}
                                                    {expense.category === 'deposit'  && '💰 '}
                                                    {expense.category === 'market'   && '🛒 '}
                                                    {expense.category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest"><Calendar size={10} className="opacity-50" />{expense.date || 'Today'}</div>
                                            {expense.paidBy === 'admin' && <div className="text-[10px] text-primary-500 font-black uppercase tracking-widest flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary-500"></div>Admin Fund</div>}
                                        </div>
                                    </div>
                                    <div className="relative z-10 flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="font-black text-slate-900 dark:text-slate-50 text-2xl tracking-tighter">₹{expense.amount.toLocaleString()}</p>
                                        </div>
                                        <button onClick={async () => { if (window.confirm('Delete this expense permanently?')) { const res = await deleteExpense(expense._id || expense.id); if (res && !res.success) alert(res.error || 'Failed to delete'); } }} className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm shadow-rose-500/10 active:scale-90 flex-shrink-0" title="Delete Expense"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="absolute top-1/2 right-[-2.5%] -translate-y-1/2 opacity-0 group-hover:opacity-[0.05] transition-opacity pointer-events-none -rotate-12 scale-150">
                                        <History size={120} strokeWidth={1} />
                                    </div>
                                </motion.div>
                            ))}
                            {historyItems.length === 0 && (<div className="p-24 text-center"><div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-30 shadow-inner"><Sparkles size={24} className="text-slate-400" /></div><p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Vault Records Clear</p></div>)}
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};

export default AddExpense;
