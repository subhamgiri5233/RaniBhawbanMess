import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, ChevronDown, X, Save, Crown,
    CheckCircle2, Clock, AlertCircle, Users,
    ShoppingBag, Wifi, Zap, User, Utensils, Flame,
    Coffee, FileText, Loader2, RefreshCw, Search, Wallet, Home, Newspaper, UserRound, Calendar, Calculator, TrendingUp
} from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import { MESS_CONFIG } from '../../config';
import { useData } from '../../context/DataContext';

// ─── Month/year helpers ─────────────────────────────────────────────────────

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // 1-indexed

const getYearOptions = () => {
    const years = [];
    for (let y = currentYear; y >= currentYear - 3; y--) years.push(y);
    return years;
};

const pad = (n) => String(n).padStart(2, '0');

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    clear: {
        label: 'Clear',
        icon: CheckCircle2,
        cls: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    },
    partial: {
        label: 'Partial',
        icon: AlertCircle,
        cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    },
    pending: {
        label: 'Pending',
        icon: Clock,
        cls: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50',
    },
};

const StatusBadge = ({ status, onClick }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <button
            onClick={onClick}
            title="Click to update payment status"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black uppercase tracking-wide transition-all hover:scale-105 active:scale-95 ${cfg.cls}`}
        >
            <Icon size={12} />
            {cfg.label}
        </button>
    );
};

// ─── Payment edit modal ───────────────────────────────────────────────────────

const PaymentModal = ({ member, month, onClose, onSaved }) => {
    const [depositBalance, setDepositBalance] = useState((member.finalBalance ?? member.depositBalance ?? 0).toString());
    const [submittedAmount, setSubmittedAmount] = useState((member.submittedAmount ?? 0).toString());
    const [depositDate, setDepositDate] = useState(member.depositDate || new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState(member.note || '');
    const [saving, setSaving] = useState(false);

    // Auto-derive status from submitted vs deposit balance
    const submitted = Number(submittedAmount) || 0;
    const balance = Number(depositBalance) || 0;
    const autoStatus = submitted >= balance && balance > 0 ? 'clear' : submitted > 0 ? 'partial' : 'pending';
    const remaining = Math.max(0, balance - submitted);
    const [status, setStatus] = useState(member.paymentStatus || autoStatus);

    // Keep status in sync when submitted/balance changes
    useEffect(() => {
        setStatus(autoStatus);
    }, [autoStatus]);

    const handleBalanceChange = (val) => {
        const cleanVal = val.toString().replace(/^0+(?!$)/, '');
        setDepositBalance(cleanVal);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/summary/${month}/payment`, {
                memberId: member.memberId,
                memberName: member.memberName,
                paymentStatus: status,
                amountPaid: submitted,
                submittedAmount: submitted,
                receivedAmount: submitted,
                depositBalance: balance,
                depositDate,
                note
            });
            onSaved({
                memberId: member.memberId,
                paymentStatus: status,
                amountPaid: submitted,
                submittedAmount: submitted,
                receivedAmount: submitted,
                depositBalance: balance,
                depositDate,
                depositBalanceLocked: true,
                note
            });
            onClose();
        } catch (err) {
            console.error('Failed to save payment status:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 md:p-8 w-full max-w-md shadow-3xl shadow-black/40 border border-slate-200 dark:border-white/10 relative overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Update Payment</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{member.memberName}</span>
                            <span className="px-1.5 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 text-[9px] font-black uppercase tracking-wide border border-violet-200/50 dark:border-violet-800/30">
                                Gen: ₹{Math.round(member.expenses?.deposit || 0)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 -mr-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent space-y-6">

                    {/* Deposit Balance for this month */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${member.snapshotType === 'Get' ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                {member.snapshotType === 'Get' ? 'Amount to Return (₹)' : 'Amount to Pay (₹)'}
                            </label>
                            {member.expenses?.deposit > 0 && member.snapshotType !== 'Get' && (
                                <button
                                    type="button"
                                    onClick={() => handleBalanceChange(Math.round(member.expenses.deposit))}
                                    className="text-[9px] font-black uppercase tracking-tighter text-primary-500 hover:text-primary-600 transition-colors"
                                >
                                    Fill from profile (₹{Math.round(member.expenses.deposit)})
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">
                            {member.snapshotType === 'Get' ? 'The total amount the mess needs to return to this member.' : 'The total amount this member needs to pay this month.'}
                        </p>
                        <input
                            type="number"
                            value={depositBalance === '0' ? '' : depositBalance}
                            onChange={e => handleBalanceChange(e.target.value)}
                            onFocus={e => e.target.select()}
                            onWheel={e => e.target.blur()}
                            min="0"
                            className="w-full px-4 py-2.5 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/50 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all"
                            placeholder="0"
                        />
                    </div>

                    {/* Deposit Date */}
                    <div className="mb-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Payment Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={depositDate}
                                onChange={e => setDepositDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all"
                            />
                            <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Input for the amount they are paying or getting right now */}
                    <div className="mb-4">
                        <label className={`text-[10px] font-black uppercase tracking-widest ${member.snapshotType === 'Get' ? 'text-emerald-500' : 'text-blue-500'} mb-1 block`}>
                            {member.snapshotType === 'Get' ? 'Total Returned This Month (₹)' : 'Total Paid This Month (₹)'}
                        </label>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 leading-tight">
                            Enter the cumulative amount submitted so far. If adding a new payment, add it to the existing number.
                        </p>
                        <input
                            type="number"
                            value={submittedAmount === '0' ? '' : submittedAmount}
                            onChange={e => setSubmittedAmount(e.target.value.replace(/^0+(?!$)/, ''))}
                            onFocus={e => e.target.select()}
                            onWheel={e => e.target.blur()}
                            min="0"
                            className={`w-full px-4 py-2.5 ${member.snapshotType === 'Get' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 focus:ring-emerald-500/30 focus:border-emerald-500' : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 text-slate-900 dark:text-white focus:ring-blue-500/30 focus:border-blue-500'} border rounded-xl text-sm font-bold outline-none transition-all`}
                            placeholder="0"
                        />
                    </div>
                    {/* Status indicator based on submitted amount */}
                    {balance > 0 && (
                        <div className={`mb-4 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 ${submitted > balance
                            ? 'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400'
                            : autoStatus === 'clear'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                                : autoStatus === 'partial'
                                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                                    : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                            }`}>
                            {submitted > balance
                                ? <><AlertCircle size={13} /> {member.snapshotType === 'Get' ? `Over-returning by ₹${submitted - balance}!` : `Overpaying by ₹${submitted - balance}!`}</>
                                : autoStatus === 'clear'
                                    ? <><CheckCircle2 size={13} /> {member.snapshotType === 'Get' ? 'Fully returned' : 'Fully received'} — cleared!</>
                                    : autoStatus === 'partial'
                                        ? <><AlertCircle size={13} /> ₹{remaining} still pending ({member.snapshotType === 'Get' ? 'returned' : 'received'} ₹{submitted} of ₹{balance})</>
                                        : <><Clock size={13} /> Full amount of ₹{balance} is due</>
                            }
                        </div>
                    )}

                    {/* Manual status override */}
                    <div className="mb-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Payment Status <span className="normal-case text-slate-400">(auto-set · override if needed)</span></label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                const Icon = cfg.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setStatus(key)}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-wide ${status === key
                                            ? cfg.cls + ' scale-105 shadow-md'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <Icon size={18} />
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Note */}
                    <div className="mb-5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Note (optional)</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all resize-none"
                            placeholder="Any note..."
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-white/5 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Stat chip ────────────────────────────────────────────────────────────────

const Chip = ({ icon: Icon, value, label, color }) => (
    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${color}`}>
        <Icon size={11} />
        <span>{value}</span>
        <span className="text-[10px] opacity-70">{label}</span>
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const MonthlySummary = () => {
    const { globalMonth, setGlobalMonth, settings } = useData();

    // Sync local state with global context whenever globalMonth changes
    const [yearPart, monthPart] = globalMonth.split('-');
    const [selectedYear, setSelectedYear] = useState(parseInt(yearPart));
    const [selectedMonth, setSelectedMonth] = useState(parseInt(monthPart));

    useEffect(() => {
        const [y, m] = globalMonth.split('-').map(Number);
        if (y && m) {
            setSelectedYear(y);
            setSelectedMonth(m);
        }
    }, [globalMonth]);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sharedExpenses, setSharedExpenses] = useState({ paper: 0, didi: 0, houseRent: 0, gas: 0, wifi: 0, electric: 0, spices: 0, others: 0 });

    const monthStr = `${selectedYear}-${pad(selectedMonth)}`;

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        setData(null); // Clear previous data so we don't show old stats
        try {
            const summaryRes = await api.get(`/summary/${monthStr}`);
            setData(summaryRes.data);
            const snapshot = summaryRes.data.sharedExpense;

            if (snapshot && snapshot.bills) {
                setSharedExpenses({
                    paper: snapshot.bills.paper || 0,
                    didi: snapshot.bills.didi || 0,
                    houseRent: snapshot.bills.houseRent || 0,
                    gas: snapshot.bills.gas || 0,
                    wifi: snapshot.bills.wifi || 0,
                    electric: snapshot.bills.electric || 0,
                    spices: snapshot.bills.spices || 0,
                    others: snapshot.bills.others || 0,
                    isSnapshot: true
                });
            } else {
                setSharedExpenses({
                    paper: 0, didi: 0, houseRent: 0, gas: 0, wifi: 0, electric: 0, spices: 0, others: 0,
                    isSnapshot: false
                });
            }
        } catch (err) {
            console.error('Summary fetch error:', err);
            setError(err.response?.data?.error || 'Failed to load summary. Data might not be initialized for this month.');
        } finally {
            setLoading(false);
        }
    }, [monthStr]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const handleMonthChange = (e) => {
        const m = parseInt(e.target.value);
        setSelectedMonth(m);
        setGlobalMonth(`${selectedYear}-${pad(m)}`);
    };

    const handleYearChange = (e) => {
        const y = parseInt(e.target.value);
        setSelectedYear(y);
        setGlobalMonth(`${y}-${pad(selectedMonth)}`);
    };

    const handlePaymentSaved = (updatedMember) => {
        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                members: prev.members.map(m =>
                    m.memberId === updatedMember.memberId
                        ? { ...m, ...updatedMember }
                        : m
                )
            };
        });
    };

    const filteredMembers = useMemo(() => {
        if (!data || !data.members) return [];
        return searchQuery.trim()
            ? data.members.filter(m =>
                m.memberName.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : data.members;
    }, [data, searchQuery]);


    const mealRate = data?.sharedExpense?.results?.mealRate || data?.mealRate || 0;
    const clearedCount = data?.members?.filter(m => m.paymentStatus === 'clear').length || 0;
    const pendingCount = data?.members?.filter(m => m.paymentStatus === 'pending').length || 0;
    const partialCount = data?.members?.filter(m => m.paymentStatus === 'partial').length || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
        >
            {/* Header / Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/20">
                        <ClipboardList className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            Monthly Summary
                            <span className="px-2 py-0.5 rounded-lg bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-[10px] uppercase font-black border border-primary-200 dark:border-primary-800/30">
                                Official Snapshot
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Final accounting for the month</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        {/* Premium Calendar Pill Selector */}
                        <div className="flex items-center gap-4 bg-slate-900 dark:bg-black/40 border border-slate-200/20 dark:border-white/10 px-6 py-3 rounded-full shadow-2xl hover:bg-slate-800 dark:hover:bg-white/5 transition-all cursor-pointer ring-1 ring-white/5 backdrop-blur-md">
                            <Calendar size={18} className="text-primary-500" />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-white dark:text-slate-100 uppercase tracking-[0.2em] px-1">
                                    {MONTHS[selectedMonth - 1]}, {selectedYear}
                                </span>
                            </div>
                            <Calendar size={14} className="text-slate-600 dark:text-slate-500 opacity-40 ml-2" />
                        </div>

                        <input
                            type="month"
                            value={globalMonth}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setGlobalMonth(e.target.value);
                                }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            title="Click to change month"
                        />
                    </div>
                    <button
                        onClick={fetchSummary}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 hover:text-primary-500 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── SHARED EXPENSES CARDS ── */}
            {!loading && data && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="p-0 overflow-hidden border-indigo-200/50 dark:border-white/5 bg-white dark:bg-slate-900/40">
                        <div className="p-4 sm:p-6 border-b border-indigo-50 dark:border-white/5 bg-indigo-50/30 dark:bg-indigo-900/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                                    <ShoppingBag size={18} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="text-sm sm:text-base font-black text-indigo-900 dark:text-indigo-300">Shared Bills & Managed Expenses</h2>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-[10px] font-black text-indigo-600 border border-indigo-200 text-center">
                                DIVIDED BY {data.members.length} MEMBERS
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-6">
                            {/* WiFi */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Wifi size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400">WiFi</p>
                                    <p className="text-2xl font-black text-blue-700 dark:text-blue-300">₹{sharedExpenses.wifi || 0}</p>
                                    <p className="text-[10px] font-bold text-blue-400 dark:text-blue-500 mt-0.5">₹{Math.round((sharedExpenses.wifi || 0) / data.members.length)} / member</p>
                                </div>
                            </div>

                            {/* Electric */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl text-yellow-600 dark:text-yellow-400">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500 dark:text-yellow-400">Electric</p>
                                    <p className="text-2xl font-black text-yellow-700 dark:text-yellow-300">₹{sharedExpenses.electric || 0}</p>
                                    <p className="text-[10px] font-bold text-yellow-400 dark:text-yellow-500 mt-0.5">₹{Math.round((sharedExpenses.electric || 0) / data.members.length)} / member</p>
                                </div>
                            </div>

                            {/* Gas */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400">
                                    <Flame size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400">Gas</p>
                                    <p className="text-2xl font-black text-rose-700 dark:text-rose-300">₹{sharedExpenses.gas || 0}</p>
                                    <p className="text-[10px] font-bold text-rose-400 dark:text-rose-500 mt-0.5">₹{Math.round((sharedExpenses.gas || 0) / data.members.length)} / member</p>
                                </div>
                            </div>

                            {/* Paper */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-xl text-orange-600 dark:text-orange-400">
                                    <Newspaper size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 dark:text-orange-400">Paper</p>
                                    <p className="text-2xl font-black text-orange-700 dark:text-orange-300">₹{sharedExpenses.paper || 0}</p>
                                    <p className="text-[10px] font-bold text-orange-400 dark:text-orange-500 mt-0.5">₹{Math.round((sharedExpenses.paper || 0) / data.members.length)} / member</p>
                                </div>
                            </div>

                            {/* Second Row */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30">
                                <div className="p-3 bg-pink-100 dark:bg-pink-900/40 rounded-xl text-pink-600 dark:text-pink-400">
                                    <UserRound size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-pink-500 dark:text-pink-400">Didi</p>
                                    <p className="text-2xl font-black text-pink-700 dark:text-pink-300">₹{sharedExpenses.didi || 0}</p>
                                    <p className="text-[10px] font-bold text-pink-400 dark:text-pink-500 mt-0.5">₹{Math.round((sharedExpenses.didi || 0) / data.members.length)} / member</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                                <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-xl text-violet-600 dark:text-violet-400">
                                    <Home size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 dark:text-violet-400">House Rent</p>
                                    <p className="text-2xl font-black text-violet-700 dark:text-violet-300">₹{sharedExpenses.houseRent || 0}</p>
                                    <p className="text-[10px] font-bold text-violet-400 dark:text-violet-500 mt-0.5">₹{Math.round((sharedExpenses.houseRent || 0) / data.members.length)} / member</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
                                    <Coffee size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400">Spices</p>
                                    <p className="text-2xl font-black text-amber-700 dark:text-amber-300">₹{sharedExpenses.spices || 0}</p>
                                    <p className="text-[10px] font-bold text-amber-400 dark:text-amber-500 mt-0.5">₹{Math.round((sharedExpenses.spices || 0) / data.members.length)} / member</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Others</p>
                                    <p className="text-2xl font-black text-slate-700 dark:text-white">₹{sharedExpenses.others || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">₹{Math.round((sharedExpenses.others || 0) / data.members.length)} / member</p>
                                </div>
                            </div>
                        </div>

                        {/* EMPHASIZED FIXED COST / HEAD */}
                        <div className="mx-6 mb-6 p-6 bg-gradient-to-br from-primary-600/10 via-indigo-600/10 to-violet-600/10 border border-primary-200/50 dark:border-primary-800/30 rounded-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-primary-600/10 dark:bg-primary-400/10 rounded-2xl">
                                    <Calculator size={32} className="text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-primary-900 dark:text-primary-100">Total Fixed Cost / Head</h3>
                                    <p className="text-xs font-bold text-primary-500/70 uppercase tracking-widest">Base snapshot calculation (Official)</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-primary-600 tracking-tighter">₹{Math.round(data?.sharedExpense?.results?.perHeadAmount || 0)}</div>
                                <div className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-full border border-indigo-200/50 inline-block mt-2">
                                    Total Bills: ₹{Math.round(data?.sharedExpense?.results?.totalSharedAmount || 0)}
                                </div>
                            </div>
                        </div>

                        {/* MARKET INPUTS - THE 4 PARTS FROM DB */}
                        <div className="bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-white/5 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 rounded-full bg-indigo-500"></div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Monthly Market Dynamics (Database Stats)</h3>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-1">
                                        <ShoppingBag size={14} className="text-blue-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Total Market</span>
                                    </div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">₹{data?.sharedExpense?.mealInputs?.totalMarket || 0}</div>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-1">
                                        <Utensils size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Rice Cost</span>
                                    </div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">₹{data?.sharedExpense?.mealInputs?.rice || 0}</div>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-1">
                                        <Crown size={14} className="text-amber-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Guest Total</span>
                                    </div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">₹{data?.sharedExpense?.results?.totalGuestMealCost || data?.sharedExpense?.mealInputs?.guest || 0}</div>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-1">
                                        <ClipboardList size={14} className="text-violet-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Total Meals</span>
                                    </div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">{data?.sharedExpense?.mealInputs?.totalMeal || 0}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/50 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Real-time Snapshot Enabled</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Meal Rate:</span>
                                    <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-black text-slate-900 dark:text-white border border-slate-200/50 dark:border-white/5">
                                        ₹{data?.sharedExpense?.results?.mealCharge?.toFixed(4) || '0.0000'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* ── Stats overview ── */}
            {data && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Cleared', value: clearedCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: CheckCircle2 },
                        { label: 'Pending', value: pendingCount, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20', icon: Clock },
                        { label: 'Partial', value: partialCount, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: AlertCircle },
                        { label: 'Official Rate', value: `₹${mealRate}`, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/20', icon: Utensils },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <Card className={`p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 ${stat.bg} border-0`}>
                                <stat.icon size={18} className={stat.color} />
                                <div className="text-center sm:text-left">
                                    <div className={`text-sm sm:text-lg font-black ${stat.color}`}>{stat.value}</div>
                                    <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{stat.label}</div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Loading / Error ── */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={36} className="animate-spin mb-4 text-primary-500" />
                    <p className="font-bold text-sm">Loading summary...</p>
                </div>
            )}

            {error && !loading && (
                <Card className="p-8 text-center border-rose-200/50 dark:border-rose-800/20 bg-rose-50 dark:bg-rose-950/10">
                    <AlertCircle size={36} className="text-rose-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
                </Card>
            )}

            {/* ── Main Table ── */}
            {!loading && data && (
                <Card className="p-0 overflow-hidden border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40">
                    <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 dark:bg-primary-950/40 rounded-xl">
                                    <Users size={18} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-base font-black text-slate-900 dark:text-white">Member Breakdown</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Calculated from snapshot</p>
                                </div>
                            </div>
                            {/* Member search bar */}
                            <div className="flex-1 relative sm:max-w-xs">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search member name..."
                                    className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left min-w-[1050px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-white/5">
                                    <th className="px-5 py-3 sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Member</th>
                                    <th className="px-4 py-3 text-center">M. Duty(d)</th>
                                    <th className="px-4 py-3 text-center">Deposit</th>
                                    <th className="px-4 py-3 text-center">Market</th>
                                    <th className="px-4 py-3 text-center">Gas</th>
                                    <th className="px-4 py-3 text-center">WiFi</th>
                                    <th className="px-4 py-3 text-center">Electric</th>
                                    <th className="px-4 py-3 text-center">Meals(n)</th>
                                    <th className="px-4 py-3 text-center text-amber-600">Guest(₹)</th>
                                    <th className="px-4 py-3 text-center text-indigo-600">Meals(₹)</th>
                                    <th className="px-5 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {(!filteredMembers || filteredMembers.length === 0) ? (
                                        <tr>
                                            <td colSpan="13" className="py-16 text-center text-slate-400 text-sm font-bold italic">
                                                {searchQuery ? `No match for "${searchQuery}"` : 'No members found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMembers.map((member, idx) => {
                                            const snapshotM = data?.sharedExpense?.memberBalances?.find(mb => mb.memberId === member.memberId);
                                            const baseBalance = snapshotM ? Math.round(snapshotM.balance) : 0;
                                            const submitted = member.submittedAmount || 0;
                                            const remaining = Math.max(0, baseBalance - submitted);

                                            return (
                                                <motion.tr
                                                    key={member.memberId}
                                                    layout
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.02 }}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                                                >
                                                    <td className="px-5 py-4 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-black text-xs">
                                                                {(member.memberName || '?').charAt(0)}
                                                            </div>
                                                            <div className="font-black text-slate-900 dark:text-white text-sm">{member.memberName}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-black text-xs text-indigo-500">{member.marketDays || 4}</td>
                                                    <td className="px-4 py-4 text-center font-black text-xs text-emerald-600">₹{Math.round(member.expenses?.deposit || 0)}</td>
                                                    <td className="px-4 py-4 text-center font-black text-xs text-blue-600">₹{Math.round(snapshotM?.marketCost || 0)}</td>
                                                    <td className="px-4 py-4 text-center font-black text-xs text-rose-500">₹{Math.round(member.expenses?.gas || 0)}</td>
                                                    <td className="px-4 py-4 text-center font-black text-xs text-cyan-500">₹{Math.round(member.expenses?.wifi || 0)}</td>
                                                    <td className="px-4 py-4 text-center font-black text-xs text-amber-500">₹{Math.round(member.expenses?.electric || 0)}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-black text-xs">{member.regularMeals < 40 ? 40 : member.regularMeals} R</span>
                                                            <span className="text-[9px] font-bold text-slate-400">{member.guestMeals} G</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-black text-xs text-amber-600">₹{Math.round(snapshotM?.guestMealCost || snapshotM?.guestCost || 0)}</td>
                                                    <td className="px-4 py-4 text-center font-black text-xs text-indigo-600">₹{Math.round(snapshotM?.mealCost || 0)}</td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            {remaining > 0 && (
                                                                <span className={`text-[10px] font-black ${snapshotM?.type === 'Pay' ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'} px-2 py-0.5 rounded-md border border-current opacity-80`}>
                                                                    ₹{remaining}
                                                                </span>
                                                            )}
                                                            <StatusBadge
                                                                status={member.paymentStatus}
                                                                onClick={() => setEditingMember({
                                                                    ...member,
                                                                    finalBalance: baseBalance,
                                                                    snapshotType: snapshotM?.type
                                                                })}
                                                            />
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            )
                                        })
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredMembers.map((member, idx) => {
                                const snapshotM = data?.sharedExpense?.memberBalances?.find(mb => mb.memberId === member.memberId);
                                const baseBalance = snapshotM ? Math.round(snapshotM.balance) : 0;
                                const submitted = member.submittedAmount || 0;
                                const remaining = Math.max(0, baseBalance - submitted);

                                return (
                                    <motion.div
                                        key={member.memberId}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-white dark:bg-slate-900"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-black text-xs">
                                                    {(member.memberName || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm">{member.memberName}</div>
                                                    <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{member.marketDays || 0} Market Days</div>
                                                </div>
                                            </div>
                                            <StatusBadge
                                                status={member.paymentStatus}
                                                onClick={() => setEditingMember({
                                                    ...member,
                                                    finalBalance: baseBalance,
                                                    snapshotType: snapshotM?.type
                                                })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                                                <div className="text-[8px] font-black text-blue-500 uppercase tracking-tighter mb-0.5">Market Cost</div>
                                                <div className="text-sm font-black text-blue-700 dark:text-blue-300">₹{Math.round(snapshotM?.marketCost || 0)}</div>
                                            </div>
                                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
                                                <div className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter mb-0.5">Initial Deposit</div>
                                                <div className="text-sm font-black text-indigo-700 dark:text-indigo-300">₹{Math.round(member.expenses?.deposit || 0)}</div>
                                            </div>
                                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl">
                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Meal Cost</div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white">₹{Math.round(snapshotM?.mealCost || 0)}</div>
                                            </div>
                                            <div className={cn(
                                                "p-2.5 border rounded-xl",
                                                snapshotM?.type === 'Pay'
                                                    ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30"
                                                    : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
                                            )}>
                                                <div className={cn(
                                                    "text-[8px] font-black uppercase tracking-tighter mb-0.5",
                                                    snapshotM?.type === 'Pay' ? "text-rose-500" : "text-emerald-500"
                                                )}>Balance</div>
                                                <div className={cn(
                                                    "text-sm font-black",
                                                    snapshotM?.type === 'Pay' ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"
                                                )}>₹{remaining}</div>
                                            </div>
                                        </div>

                                        {/* Bill Details */}
                                        <div className="mb-4">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1">Itemized Shared Bills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { label: 'WiFi', val: member.expenses?.wifi, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-500/10' },
                                                    { label: 'Gas', val: member.expenses?.gas, color: 'text-rose-500', bg: 'bg-rose-50/50 dark:bg-rose-500/10' },
                                                    { label: 'Elec', val: member.expenses?.electric, color: 'text-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-500/10' },
                                                    { label: 'Spices', val: member.expenses?.spices || 0, color: 'text-orange-500', bg: 'bg-orange-50/50 dark:bg-orange-500/10' },
                                                    { label: 'Other', val: member.expenses?.others || 0, color: 'text-slate-500', bg: 'bg-slate-50/50 dark:bg-slate-500/10' },
                                                    { label: 'Paper', val: member.expenses?.paper, color: 'text-orange-500', bg: 'bg-orange-50/50 dark:bg-orange-500/10' },
                                                    { label: 'Didi', val: member.expenses?.didi, color: 'text-pink-500', bg: 'bg-pink-50/50 dark:bg-pink-500/10' },
                                                    { label: 'Rent', val: member.expenses?.houseRent, color: 'text-violet-500', bg: 'bg-violet-50/50 dark:bg-violet-500/10' },
                                                ].filter(b => b.val > 0).map(b => (
                                                    <div key={b.label} className={cn("px-2 py-1 rounded-lg border border-slate-100 dark:border-white/5 flex items-center gap-1.5", b.bg)}>
                                                        <span className={cn("text-[8px] font-black uppercase", b.color)}>{b.label}:</span>
                                                        <span className="text-[9px] font-black text-slate-700 dark:text-slate-200">₹{Math.round(b.val)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white-[0.02] -mx-4 px-4 mt-auto">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Meal Count</span>
                                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                                                        {member.regularMeals < 40 ? 40 : member.regularMeals} R + {member.guestMeals} G
                                                        <span className="ml-2 text-amber-500">(₹{Math.round(snapshotM?.guestMealCost || snapshotM?.guestCost || 0)})</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg">
                                                    <TrendingUp size={12} className="text-emerald-500" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-500 uppercase">Growth Tracked</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Totals Footer */}
                    {data.members.length > 0 && (
                        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">Totals:</span>
                            <span className="text-indigo-600">Market: ₹{Math.round(data?.sharedExpense?.results?.totalMarketCost || 0)}</span>
                            <span className="text-emerald-600">Fixed Cost: ₹{Math.round(data?.sharedExpense?.results?.totalSharedExpense || 0)}</span>
                            <span className="text-amber-600">Meals: {data.members.reduce((s, m) => s + (m.regularMeals < 40 ? 40 : m.regularMeals) + m.guestMeals, 0)}</span>
                        </div>
                    )}
                </Card>
            )}

            {/* ── Payment modal ── */}
            <AnimatePresence>
                {editingMember && (
                    <PaymentModal
                        member={editingMember}
                        month={monthStr}
                        onClose={() => setEditingMember(null)}
                        onSaved={handlePaymentSaved}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MonthlySummary;
