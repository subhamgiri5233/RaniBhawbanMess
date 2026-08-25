import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Receipt, PlusCircle, History, Trash2, TrendingUp, ArrowRight, User, Wallet, Sparkles, Info, X, ShoppingBag, Flame, Wifi, Zap, Package, Calendar, ShoppingCart, Utensils, Filter, Search } from 'lucide-react';
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
        <div className="space-y-6 sm:space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Mess Expenses & Deposits</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                        {isAdmin ? 'Add Mess Expense & Deposit' : 'Add Bazaar Expense'}
                    </h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                        {isAdmin ? 'Record mess expenses and member deposits' : 'Submit your bazaar shopping bill'}
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5 rounded-2xl backdrop-blur-sm self-start lg:self-center">
                        <button
                            className={cn(
                                "px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2",
                                activeTab === 'expense'
                                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-white/10"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                            )}
                            onClick={() => setActiveTab('expense')}
                        >
                            <PlusCircle size={15} className={activeTab === 'expense' ? "text-indigo-600 dark:text-indigo-400" : "opacity-40"} />
                            Add Expense
                        </button>
                            <button
                                className={cn(
                                    "px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2",
                                    activeTab === 'deposit'
                                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-white/10"
                                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                                )}
                                onClick={() => setActiveTab('deposit')}
                            >
                                <Receipt size={15} className={activeTab === 'deposit' ? "text-emerald-600 dark:text-emerald-400" : "opacity-40"} />
                                Manage Deposits
                            </button>
                        </div>
                    )}
                </div>

            <div className="grid grid-cols-1 gap-8 items-start">
                <div className="space-y-6">
                    {(!isAdmin || activeTab === 'expense') ? (
                        <div key="expense-form">
                                <Card className="p-6 sm:p-8 relative group overflow-hidden shadow-sm">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                                                <PlusCircle size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                                                    {isAdmin ? 'Expense Entry' : 'Market Purchase Log'}
                                                </h2>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                    Submit verified mess expenditure
                                                </p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleExpenseSubmit} className="space-y-4 sm:space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input label="Transaction Date" type="date" value={transactionDate} onChange={e => { const newDate = e.target.value; setTransactionDate(newDate); const newMonth = newDate.substring(0, 7); if (newMonth !== globalMonth) setGlobalMonth(newMonth); }} required />
                                                <Input label="Item Description" placeholder="e.g. Mustard oil, Onion 5kg, LPG Cylinder..." value={title} onChange={e => setTitle(e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5 mb-1.5 block">Total Amount (₹) <span className="text-rose-500">*</span></label>
                                                <div className="relative">
                                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400">₹</div>
                                                    <input type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400/80" required />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5 block">Fund Category Allocation</label>
                                                {isAdmin ? (
                                                    <div className="grid grid-cols-3 gap-3 w-full">
                                                        {[
                                                            { id: 'spices', n: 'Spices & Oil', i: Flame },
                                                            { id: 'rice', n: 'Rice & Grains', i: ShoppingBag },
                                                            { id: 'others', n: 'Other Spends', i: Package }
                                                        ].map(cat => (
                                                            <button
                                                                key={cat.id}
                                                                type="button"
                                                                onClick={() => setCategory(cat.id)}
                                                                className={cn(
                                                                    "p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5",
                                                                    category === cat.id
                                                                        ? "border-indigo-600 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm"
                                                                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-indigo-400"
                                                                )}
                                                            >
                                                                <cat.i size={18} className={category === cat.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"} />
                                                                <span className="text-[10px] font-extrabold uppercase tracking-wider">{cat.n}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-indigo-600"><Sparkles size={16} /></div>
                                                            <div>
                                                                <p className="text-[9px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Fund Bucket</p>
                                                                <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight">🛒 Mess Market Collection</p>
                                                            </div>
                                                        </div>
                                                        <div className="p-1.5 text-indigo-500"><Info size={15} /></div>
                                                    </div>
                                                )}
                                            </div>
                                            <Button type="submit" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-[0.98] transition-all font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 border-0">
                                                Finalize Transaction <ArrowRight size={15} />
                                            </Button>
                                        </form>
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <div key="deposit-form">
                                <Card className="p-6 sm:p-8 relative group overflow-hidden shadow-sm">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Deposit Registry</h2>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Internal Member Credit Interface</p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleDepositSubmit} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5"><User size={12} /> Select Member Account</label>
                                                <select className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100 font-extrabold tracking-tight transition-all cursor-pointer text-xs uppercase" value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} required >
                                                    <option value="">AWAITING SELECTION...</option>
                                                    {members.filter(m => m.role === 'member').map(m => (
                                                        <option key={m.id || m._id} value={m.id || m._id} className="dark:bg-slate-900">{m.name.toUpperCase()} (AVL: ₹{getMemberGeneralDeposit(m)})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                                <Input label="Execution Date" type="date" value={transactionDate} onChange={e => { const newDate = e.target.value; setTransactionDate(newDate); const newMonth = newDate.substring(0, 7); if (newMonth !== globalMonth) setGlobalMonth(newMonth); }} required />
                                                <div>
                                                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 mb-1.5 block">Credit Amount (₹)</label>
                                                    <div className="relative">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-extrabold text-slate-400">₹</div>
                                                        <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.00" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400" required />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5"><Info size={12} /> Allocation Purpose</label>
                                                <div className="flex overflow-x-auto gap-2.5 pb-2 custom-scrollbar w-full">
                                                    {[
                                                        { id: 'deposit', n: 'Deposit', i: Wallet },
                                                        { id: 'market', n: 'Market', i: ShoppingCart },
                                                        { id: 'gas', n: 'Gas', i: Flame },
                                                        { id: 'wifi', n: 'WiFi', i: Wifi },
                                                        { id: 'electric', n: 'Electric', i: Zap }
                                                    ].map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => setPaymentPurpose(opt.id)}
                                                            className={cn(
                                                                "flex-1 min-w-[80px] p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5",
                                                                paymentPurpose === opt.id
                                                                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                                                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-emerald-400"
                                                            )}
                                                        >
                                                            <opt.i size={16} className={paymentPurpose === opt.id ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
                                                            <span className="text-[10px] font-extrabold uppercase tracking-wider">{opt.n}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                                                Update Balance <ArrowRight size={16} />
                                            </Button>
                                        </form>
                                    </div>
                                </Card>
                            </div>
                        )}
                </div>

            </div>

            {historyItems.length > 0 && (
                <div className="space-y-4 mt-8">
                    <div className="flex items-center gap-2.5 px-1">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <History size={15} />
                        </div>
                        <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                            {isAdmin && activeTab === 'deposit' ? 'Recent Deposits' : 'Your Recent Entries'}
                        </h3>
                        <span className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-md">
                            {historyItems.length} Records
                        </span>
                    </div>

                    <Card className="p-0 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/95 dark:bg-slate-900/95 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-white/5">
                                    <tr>
                                        <th className="p-3.5">Date</th>
                                        <th className="p-3.5">Description</th>
                                        <th className="p-3.5">Category</th>
                                        <th className="p-3.5 text-right">Amount</th>
                                        <th className="p-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {historyItems.map(expense => (
                                        <tr key={expense._id || expense.id} className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-white/5">
                                            <td className="p-3.5 text-xs font-bold text-slate-500 tabular-nums">
                                                {expense.date}
                                            </td>
                                            <td className="p-3.5">
                                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                                    {expense.description || expense.title}
                                                </p>
                                                {isAdmin && activeTab === 'deposit' && (
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                        For: {getMemberName(expense.paidBy)}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-3.5">
                                                <span className={cn(
                                                    "text-[9px] px-2 py-0.5 rounded-lg font-extrabold uppercase tracking-wider border flex items-center gap-1 w-fit",
                                                    expense.category === 'market' && "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
                                                    expense.category === 'spices' && "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
                                                    expense.category === 'rice' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
                                                    expense.category === 'deposit' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
                                                    expense.category === 'wifi' && "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
                                                    expense.category === 'gas' && "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
                                                    expense.category === 'electric' && "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
                                                    (expense.category === 'others' || expense.category === 'other') && "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20"
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
        </div>
    );
};

export default AddExpense;


