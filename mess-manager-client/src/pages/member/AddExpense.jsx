import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Receipt, PlusCircle, History, Trash2, TrendingUp, ArrowRight, User, Wallet, Sparkles, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const AddExpense = () => {
    const { addExpense, expenses, members, updateMember, deleteExpense, clearAllAdminExpenses } = useData();
    const { user } = useAuth();

    const isAdmin = user?.role === 'admin';

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(isAdmin ? 'spices' : 'market'); // Admin defaults to spices, members to market

    // Admin Deposit State
    const [activeTab, setActiveTab] = useState('expense'); // 'expense' or 'deposit'
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [paymentPurpose, setPaymentPurpose] = useState('deposit'); // 'deposit', 'gas', 'wifi', etc.

    const purposeOptions = [
        { id: 'deposit', name: 'General Deposit', icon: Wallet },
        { id: 'gas', name: 'Gas Bill', icon: Info },
        { id: 'wifi', name: 'WiFi Bill', icon: Info },
        { id: 'electric', name: 'Electric Bill', icon: Info }
    ];

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        if (!title || !amount || !category) return;

        const result = await addExpense({
            description: title,
            amount: Number(amount),
            category,
            paidBy: isAdmin ? 'admin' : (user.id || user.userId),
            date: new Date().toISOString().split('T')[0],
            status: isAdmin ? 'approved' : 'pending'
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

        // 1. Update Member Deposit Balance
        const newTotal = (member.deposit || 0) + amountNum;
        await updateMember(selectedMemberId, { deposit: newTotal });

        // 2. Create an approved expense record for tracking and history
        const isGeneral = paymentPurpose === 'deposit';
        const purposeLabel = isGeneral
            ? 'General Deposit'
            : (purposeOptions.find(p => p.id === paymentPurpose)?.name || 'Shared Expense');

        await addExpense({
            description: `${purposeLabel} (By ${member.name})`,
            amount: Number(depositAmount),
            category: paymentPurpose, // 'deposit', 'gas', 'wifi', etc.
            paidBy: selectedMemberId,
            date: new Date().toISOString().split('T')[0],
            status: 'approved'
        });

        setDepositAmount('');
        setSelectedMemberId('');
        setPaymentPurpose('deposit');
        alert(`Transaction successful! ₹${depositAmount} ${isGeneral ? 'added to balance' : 'recorded as ' + paymentPurpose} for ${member.name}.`);
    };

    const handleDeletePayment = async (expense) => {
        const member = members.find(m => m.id === expense.paidBy || m._id === expense.paidBy);

        if (member) {
            const potentialBalance = (member.deposit || 0) - expense.amount;
            if (potentialBalance < 0) {
                alert(`❌ Cannot reverse this transaction. Member ${member.name}'s balance would become negative (₹${potentialBalance.toFixed(2)}).`);
                return;
            }
        }

        if (!window.confirm(`Reverse this transaction? ₹${expense.amount} will be deducted from the member's balance.`)) return;

        try {
            const member = members.find(m => m.id === expense.paidBy || m._id === expense.paidBy);
            if (member) {
                const newTotal = (member.deposit || 0) - expense.amount;
                await updateMember(member.id || member._id, { deposit: newTotal });
            }
            await deleteExpense(expense._id || expense.id);
            alert('Transaction reversed and record deleted.');
        } catch (error) {
            console.error('Failed to reverse transaction:', error);
            alert('Error reversing transaction.');
        }
    };

    // Filter history based on active tab
    const historyItems = expenses.filter(e => {
        if (isAdmin) {
            if (activeTab === 'deposit') {
                // Deposit tab: Show member payments (anything not 'admin' AND NOT 'market')
                return e.paidBy !== 'admin' && e.category !== 'market';
            } else {
                // Expense tab: Show admin fund expenses
                return e.paidBy === 'admin';
            }
        }

        // Members see their own logs
        return e.paidBy === (user.id || user.userId || user._id);
    }).reverse();

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/90 dark:bg-slate-900 shadow-sm p-8 rounded-[2rem] border border-indigo-100/50 dark:border-white/5 backdrop-blur-xl">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                        {isAdmin ? 'Financial Terminal' : 'Market Expense'}
                    </h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                        {isAdmin ? 'Manage mess funds and member deposits' : 'Submit your daily market spend logs'}
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        <button
                            className={cn(
                                "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                                activeTab === 'expense'
                                    ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                            onClick={() => setActiveTab('expense')}
                        >
                            Record Expense
                        </button>
                        <button
                            className={cn(
                                "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                                activeTab === 'deposit'
                                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                            onClick={() => setActiveTab('deposit')}
                        >
                            Manage Deposits
                        </button>
                    </div>
                )}
            </div>

            {/* Forms Section */}
            <div className="lg:col-span-1">
                <AnimatePresence mode="wait">
                    {(!isAdmin || activeTab === 'expense') ? (
                        <motion.div
                            key="expense-form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="p-8 shadow-sm border-indigo-100/50 bg-white/90 backdrop-blur-xl overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Wallet size={120} />
                                </div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 dark:bg-primary-950/40 rounded-xl">
                                        <PlusCircle size={20} className="text-primary-600 dark:text-primary-400" />
                                    </div>
                                    {isAdmin ? 'Expense Entry' : 'Market Purchase Log'}
                                </h2>
                                <form onSubmit={handleExpenseSubmit} className="space-y-6">
                                    <Input
                                        label="Item Description"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Total Amount (₹)"
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-2 block">Fund Category</label>
                                        {isAdmin ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                {['spices', 'rice', 'others'].map(cat => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => setCategory(cat)}
                                                        className={cn(
                                                            "p-3 rounded-xl border-2 transition-all font-black uppercase tracking-widest text-[9px]",
                                                            category === cat
                                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-600"
                                                                : "border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50 text-slate-400 hover:border-slate-200"
                                                        )}
                                                    >
                                                        {cat === 'spices' ? '🌶️ Spices' : cat === 'rice' ? '🍚 Rice' : '📦 Other'}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-3">
                                                <Sparkles size={16} className="text-indigo-500" />
                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">🛒 Market Collection Fund</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full py-6 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-xl shadow-primary-500/20 active:scale-95 transition-all font-black uppercase tracking-widest text-xs"
                                    >
                                        Log Transaction <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </form>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="deposit-form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="p-8 shadow-sm border-indigo-100/50 bg-white/90 backdrop-blur-xl overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <History size={120} />
                                </div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl">
                                        <Receipt size={20} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    Record Member Payment
                                </h2>
                                <form onSubmit={handleDepositSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2"><User size={10} /> Select Member Account</label>
                                        <select
                                            className="w-full p-4 bg-indigo-50/30 dark:bg-slate-950 border border-indigo-100/50 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100 font-bold transition-all appearance-none"
                                            value={selectedMemberId}
                                            onChange={e => setSelectedMemberId(e.target.value)}
                                            required
                                        >
                                            <option value="">Choose a member...</option>
                                            {members.filter(m => m.role === 'member').map(m => (
                                                <option key={m.id || m._id} value={m.id || m._id} className="dark:bg-slate-900">
                                                    {m.name} (Balance: ₹{m.deposit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <Input
                                        label="Amount Received (₹)"
                                        type="number"
                                        value={depositAmount}
                                        onChange={e => setDepositAmount(e.target.value)}
                                        required
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                            <Info size={10} /> For Which Purpose?
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {purposeOptions.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setPaymentPurpose(opt.id)}
                                                    className={cn(
                                                        "p-3 rounded-xl border-2 transition-all font-black uppercase tracking-widest text-[8px] text-center flex flex-col items-center gap-2 justify-center",
                                                        paymentPurpose === opt.id
                                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                                                            : "border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50 text-slate-400 hover:border-slate-200"
                                                    )}
                                                >
                                                    <opt.icon size={14} />
                                                    {opt.name.replace(' Bill', '')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full py-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all font-black uppercase tracking-widest text-xs"
                                    >
                                        Update Balance <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </form>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* History Section */}
            <div className="lg:col-span-1">
                <Card className="p-0 overflow-hidden shadow-sm border-indigo-100/50 bg-white/40 backdrop-blur-lg dark:bg-slate-900/40">
                    <div className="p-6 border-b border-indigo-100/50 dark:border-white/5 bg-indigo-50/20 dark:bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <History size={18} className="text-slate-500" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase text-xs tracking-widest">
                                {activeTab === 'deposit' ? 'Ref: Managed Deposits' : 'Ref: Admin Fund Log'}
                            </h3>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Audit</span>
                            </div>
                        )}
                    </div>

                    <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 scrollbar-hide">
                        {historyItems.map((expense, idx) => (
                            <motion.div
                                key={expense._id || expense.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-6 flex justify-between items-center hover:bg-white dark:hover:bg-white/5 transition-all group"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase text-sm">{expense.description || expense.title}</p>
                                        {expense.category && (
                                            <span className={cn(
                                                "text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest",
                                                expense.category === 'market' ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                                                    expense.category === 'spices' ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" :
                                                        expense.category === 'rice' ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                                                            expense.category === 'deposit' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                                                "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400"
                                            )}>
                                                {expense.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                        <TrendingUp size={10} />
                                        {expense.date || 'Today'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 dark:text-slate-50 text-lg">₹{expense.amount}</p>
                                        <div className="flex items-center justify-end gap-1.5 mt-1">
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                expense.status === 'approved' ? "bg-emerald-500" : "bg-amber-500"
                                            )}></span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {expense.status}
                                            </span>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={() => {
                                                if (activeTab === 'deposit') {
                                                    handleDeletePayment(expense);
                                                } else {
                                                    if (window.confirm('Erase this record from history?')) {
                                                        deleteExpense(expense._id || expense.id);
                                                    }
                                                }
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-all text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {historyItems.length === 0 && (
                            <div className="p-16 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">
                                Empty Vault Record
                            </div>
                        )}
                    </div>

                    {/* Clear All History Button (Admin Only) */}
                    {isAdmin && activeTab === 'expense' && historyItems.length > 0 && (
                        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/80">
                            <button
                                onClick={async () => {
                                    const password = prompt('Enter password to clear all admin expense history:');
                                    if (password === null) return; // User cancelled

                                    if (window.confirm(`Are you sure you want to delete ALL ${historyItems.length} admin expenses? This cannot be undone!`)) {
                                        const result = await clearAllAdminExpenses(password);
                                        if (result.success) {
                                            alert(`Successfully deleted ${result.deletedCount} admin expenses!`);
                                        } else {
                                            alert(`Error: ${result.error}`);
                                        }
                                    }
                                }}
                                className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                Clear All History
                            </button>
                        </div>
                    )}
                </Card>
            </div >
        </motion.div >
    );
};

export default AddExpense;
