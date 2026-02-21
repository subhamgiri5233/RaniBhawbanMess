import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CreditCard, History, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const Payments = () => {
    const { user } = useAuth();
    const { notifications, markPaymentAsPaid, members, expenses } = useData();
    const [processingPayment, setProcessingPayment] = useState(null);

    // 1. Get payment notifications for this user
    const paymentNotifications = notifications.filter(n => {
        const notifUserId = String(n.userId || n.user?._id || n.user);
        const currentUserId = String(user.id || user._id);
        return notifUserId === currentUserId && n.type === 'payment';
    }).map(n => ({ ...n, itemType: 'notification' }));

    // 2. Get payment expenses (deposits/bills) for this user, excluding market logs
    const myId = String(user.id || user.userId || user._id);
    const paymentExpenses = expenses.filter(e =>
        String(e.paidBy) === myId && e.category !== 'market'
    ).map(e => ({
        ...e,
        itemType: 'expense',
        message: e.description,
        date: e.date,
        paymentAmount: e.amount,
        isPaid: true // Expenses are always recorded as "paid/settled"
    }));

    // 3. Combine and sort by date descending
    const ledgerItems = [...paymentNotifications, ...paymentExpenses].sort((a, b) => {
        return new Date(b.date || 0) - new Date(a.date || 0);
    });

    const handleMarkAsPaid = async (notificationId) => {
        try {
            setProcessingPayment(notificationId);
            const result = await markPaymentAsPaid(notificationId);
            if (result.success) {
                // Success - the notification will be updated via refreshData
            } else {
                alert(`Failed to mark payment: ${result.error}`);
            }
        } catch (error) {
            console.error('Error marking payment:', error);
            alert('Failed to mark payment as complete');
        } finally {
            setProcessingPayment(null);
        }
    };

    // Get current member's data
    const currentMember = members.find(m => (m._id === user.id || m.id === user.id));
    const currentDeposit = currentMember?.deposit || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/90 dark:bg-slate-900 shadow-sm p-8 rounded-[2rem] border border-indigo-100/50 dark:border-white/5 backdrop-blur-xl">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Financial Hub</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Monitor your deposits and clear pending dues</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <CreditCard size={16} className="text-emerald-500" />
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Secure Wallet</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none relative overflow-hidden group shadow-xl shadow-emerald-500/20">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity translate-x-4 -translate-y-4">
                        <CreditCard size={140} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-emerald-100 font-black text-[10px] uppercase tracking-widest">Liquidity Balance</p>
                        <h2 className="text-4xl font-black mt-2 tracking-tight">₹{currentDeposit.toLocaleString()}</h2>
                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                                <CheckCircle size={14} className="text-emerald-200" />
                            </div>
                            <p className="text-[10px] font-bold text-emerald-50 uppercase tracking-widest leading-none">Account Verified & Synced</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 shadow-sm border-indigo-100/50 bg-white/90 backdrop-blur-xl dark:bg-slate-900/40 relative overflow-hidden group h-full">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <History size={100} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-8 flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl">
                            <CreditCard size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Wallet Insights
                    </h2>
                    <div className="space-y-4 relative z-10">
                        <div className="p-4 bg-indigo-50/30 dark:bg-slate-950/40 rounded-2xl border border-indigo-100/50 dark:border-white/5">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Available Funds</p>
                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">₹{currentDeposit}</p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                            Payment requests are historical records of mess contributions. Clear them to maintain a healthy account balance.
                        </p>
                    </div>
                </Card>
            </div>

            <Card className="p-0 overflow-hidden shadow-sm border-indigo-100/50 bg-white/90 backdrop-blur-xl dark:bg-slate-900/40">
                <div className="p-8 border-b border-indigo-100/50 dark:border-white/5 bg-indigo-50/20 dark:bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 rounded-2xl shadow-sm">
                            <AlertCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Dues Ledger</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Summary of pending and historical transactions</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                            {ledgerItems.length} Entries
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {ledgerItems.length > 0 ? (
                        <AnimatePresence mode="popLayout">
                            {(ledgerItems || []).map((item, idx) => {
                                const itemId = item._id || item.id;
                                const amount = item.paymentAmount || 0;
                                const isPaid = item.isPaid;
                                const isPositive = amount >= 0;
                                const isExpense = item.itemType === 'expense';

                                return (
                                    <motion.div
                                        key={itemId}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={cn(
                                            "p-8 hover:bg-indigo-50/20 dark:hover:bg-white/5 transition-all group",
                                            isPaid && "opacity-60"
                                        )}
                                    >
                                        <div className="flex items-start gap-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border group-hover:scale-110 transition-transform duration-500",
                                                isPaid
                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/10"
                                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/10"
                                            )}>
                                                {isPaid ? <CheckCircle size={20} /> : <History size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                                                isPaid ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                                            )}>
                                                                {isPaid ? (isExpense ? 'Wallet Deposit' : 'Settled') : 'Pending Verification'}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
                                                            ₹{Math.abs(amount).toLocaleString()}
                                                            <span className={cn(
                                                                "ml-2 text-[10px] font-bold uppercase tracking-widest",
                                                                isExpense ? "text-emerald-500" : (isPositive ? "text-rose-500" : "text-emerald-500")
                                                            )}>
                                                                {isExpense ? 'Added to balance' : (isPositive ? 'to contribute' : 'to receive')}
                                                            </span>
                                                        </h4>
                                                        <p className="text-slate-600 dark:text-slate-400 text-sm font-bold mt-1 leading-relaxed">{item.message}</p>
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{item.date}</p>
                                                    </div>
                                                    {!isPaid && !isExpense && isPositive && (
                                                        <Button
                                                            size="sm"
                                                            className="rounded-2xl px-6 py-4 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest h-auto border-none shadow-premium"
                                                            onClick={() => handleMarkAsPaid(itemId)}
                                                            disabled={processingPayment === itemId}
                                                        >
                                                            {processingPayment === itemId ? (
                                                                <span className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                                                    Processing...
                                                                </span>
                                                            ) : 'Confirm Settlement'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    ) : (
                        <div className="p-24 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-20 h-20 bg-slate-50 dark:bg-slate-950/40 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200 dark:border-white/10"
                            >
                                <CheckCircle size={32} className="text-slate-300 dark:text-slate-700" />
                            </motion.div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">
                                No historical dues or payment records found.<br />Your account is currently balanced.
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

export default Payments;
