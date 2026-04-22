import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CreditCard, History, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const Payments = () => {
    const { user } = useAuth();
    const { members, expenses, globalMonth } = useData();

    // 1. Get payment expenses (deposits/bills) for this user, excluding market logs
    const myId = String(user.id || user.userId || user._id);
    const ledgerItems = expenses.filter(e =>
        String(e.paidBy) === myId && e.category !== 'market'
    ).map(e => ({
        ...e,
        itemType: 'expense',
        message: e.description,
        date: e.date,
        paymentAmount: e.amount,
        isPaid: true // Expenses are always recorded as "paid/settled"
    })).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Get current member's data
    const currentMember = members.find(m => (m._id === user.id || m.id === user.id));

    // Compute General Deposit for the selected month only
    const currentGeneralDeposit = (() => {
        if (!Array.isArray(expenses) || !currentMember) return 0;
        const memberId = currentMember._id || currentMember.id;
        return expenses
            .filter(e =>
                e.category === 'deposit' &&
                (e.paidBy === memberId || e.paidBy === String(memberId) ||
                    e.paidBy === currentMember?.userId || e.paidBy === currentMember?.name)
            )
            .reduce((sum, e) => sum + (e.amount || 0), 0);
    })();

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-300/40 dark:bg-slate-900 shadow-sm p-8 rounded-[1.5rem] border border-indigo-300/30 dark:border-white/5 backdrop-blur-xl">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Financial Hub</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                        Activity for <span className="text-indigo-600 bg-indigo-200/50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-300/30 dark:border-indigo-800/30 font-black">{globalMonth}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl">
                    <CreditCard size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">Secure Wallet</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none relative overflow-hidden group shadow-xl shadow-emerald-500/20">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity translate-x-4 -translate-y-4">
                        <CreditCard size={140} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-emerald-100 font-black text-[10px] uppercase tracking-widest">Liquidity Balance</p>
                        <h2 className="text-4xl font-black mt-2 tracking-tight">₹{currentGeneralDeposit.toLocaleString()}</h2>
                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-300/40 flex items-center justify-center">
                                <CheckCircle size={14} className="text-emerald-200" />
                            </div>
                            <p className="text-[10px] font-bold text-emerald-50 uppercase tracking-widest leading-none">Account Verified & Synced</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 shadow-sm border-indigo-200/50 bg-indigo-200/40 backdrop-blur-xl dark:bg-slate-900/40 relative overflow-hidden group h-full">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <History size={100} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-8 flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-300/40 dark:bg-emerald-950/40 rounded-xl">
                            <CreditCard size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Wallet Insights
                    </h2>
                    <div className="space-y-4 relative z-10">
                        <div className="p-4 bg-indigo-300/20 dark:bg-slate-950/40 rounded-2xl border border-indigo-300/30 dark:border-white/5">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Available Funds</p>
                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">₹{currentGeneralDeposit.toLocaleString()}</p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                            This ledger displays your verified mess contributions and bill settlements for the selected month.
                        </p>
                    </div>
                </Card>
            </div>

            <Card className="p-0 overflow-hidden shadow-sm border-indigo-200/50 bg-indigo-200/40 backdrop-blur-xl dark:bg-slate-900/40">
                <div className="p-8 border-b border-indigo-200/50 dark:border-white/5 bg-indigo-300/20 dark:bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-300/40 dark:bg-indigo-950/40 rounded-2xl shadow-sm">
                            <AlertCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Dues Ledger</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Summary of historical transactions</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-indigo-700 dark:text-slate-400 uppercase tracking-widest bg-indigo-300/40 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-indigo-300/30 dark:border-white/5 shadow-sm">
                            {ledgerItems.length} Entries
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {ledgerItems.length > 0 ? (
                            (ledgerItems || []).map((item, idx) => {
                                const itemId = item._id || item.id;
                                const amount = item.paymentAmount || 0;

                                return (
                                    <div
                                        key={itemId}
                                        className="p-8 hover:bg-indigo-300/40 transition-all group opacity-80"
                                    >
                                        <div className="flex items-start gap-6">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border bg-emerald-300/40 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-400/30 dark:border-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
                                                <CheckCircle size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                                                                Verified Settlement
                                                            </span>
                                                        </div>
                                                        <h4 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
                                                            ₹{Math.abs(amount).toLocaleString()}
                                                            <span className="ml-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                                                Added to balance
                                                            </span>
                                                        </h4>
                                                        <p className="text-slate-600 dark:text-slate-400 text-sm font-bold mt-1 leading-relaxed">{item.message}</p>
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{item.date}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                    ) : (
                        <div className="p-24 text-center">
                            <div className="w-20 h-20 bg-indigo-200/40 dark:bg-slate-950/40 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-dashed border-indigo-300/30 dark:border-white/10">
                                <CheckCircle size={32} className="text-slate-300 dark:text-slate-700" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">
                                No verified payments or deposit records found for this period.
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Payments;


