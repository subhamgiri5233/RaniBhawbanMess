import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    ClipboardList, ChevronDown, X, Save, Crown,
    CheckCircle2, Clock, AlertCircle, Users,
    ShoppingBag, Wifi, Zap, User, Utensils,
    Coffee, FileText, Loader2, RefreshCw, Search, Download, Wallet, Home, Newspaper, UserRound, Calendar, Calculator
} from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import { MESS_CONFIG } from '../../config';
import { useData } from '../../context/DataContext';
import { addBengaliFont } from '../../utils/bengaliFont';

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
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Update Payment</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{member.memberName}</span>
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

                {/* Actions */}
                <div className="flex gap-3">
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

    // Split 'YYYY-MM' into [year, month]
    const [yearPart, monthPart] = globalMonth.split('-');
    const [selectedYear, setSelectedYear] = useState(parseInt(yearPart));
    const [selectedMonth, setSelectedMonth] = useState(parseInt(monthPart));

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [exportingId, setExportingId] = useState(null);
    const [exportingAdmin, setExportingAdmin] = useState(false);
    const [sharedExpenses, setSharedExpenses] = useState({ paper: 0, didi: 0, houseRent: 0, gas: 0, wifi: 0, electric: 0, spices: 0, others: 0 });

    const monthStr = `${selectedYear}-${pad(selectedMonth)}`;

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryRes, adminExpRes] = await Promise.all([
                api.get(`/summary/${monthStr}`),
                api.get(`/summary/${monthStr}/admin-expenses`)
            ]);
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
            setError(err.response?.data?.error || 'Failed to load summary.');
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

    // ── Export PDF Invoice (member) ────────────────────────────────────────────
    const exportInvoice = async (member) => {
        setExportingId(member.memberId);
        try {
            const snapshotM = data?.sharedExpense?.memberBalances?.find(mb => mb.memberId === member.memberId);
            const doc = new jsPDF();
            addBengaliFont(doc);

            doc.setFontSize(22);
            doc.setTextColor(40, 44, 52);
            doc.text(MESS_CONFIG.name, 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Monthly Summary Invoice · ${MONTHS[selectedMonth - 1]} ${selectedYear}`, 105, 28, { align: 'center' });

            doc.setDrawColor(200, 200, 200);
            doc.line(20, 35, 190, 35);

            doc.setFontSize(12);
            doc.setTextColor(40, 44, 52);
            doc.text(`Member: ${member.memberName}`, 20, 45);
            doc.text(`Month: ${MONTHS[selectedMonth - 1]} ${selectedYear}`, 190, 45, { align: 'right' });

            const rows = [
                ['Market Days', `${member.marketDays || 4} Days`, 'Count of days attended market'],
                ['Deposit (Monthly)', `₹${Math.round(member.expenses?.deposit || 0)}`, 'Initial contribution'],
                ['Market Cost', `₹${Math.round(snapshotM?.marketCost || 0)}`, 'Proportional market cost'],
                ['Gas Bill', `₹${Math.round(member.expenses?.gas || 0)}`, 'Shared gas cost'],
                ['WiFi Bill', `₹${Math.round(member.expenses?.wifi || 0)}`, 'Shared internet cost'],
                ['Electric Bill', `₹${Math.round(member.expenses?.electric || 0)}`, 'Shared electricity cost'],
                ['Meal Count', `${member.regularMeals} R + ${member.guestMeals} G`, 'Regular and guest meals'],
                ['Total Meal Cost', `₹${Math.round(snapshotM?.mealCost || 0)}`, 'Calculated based on meal rate'],
            ];

            autoTable(doc, {
                startY: 55,
                head: [['Description', 'Amount', 'Note']],
                body: rows,
                theme: 'striped',
                headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 5 },
            });

            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            const baseBalance = Math.round(snapshotM?.balance || 0);
            const typeText = snapshotM?.type === 'Pay' ? 'Total to Pay:' : 'Total to Get:';
            doc.text(`${typeText} ₹${baseBalance}`, 190, finalY, { align: 'right' });

            doc.save(`Invoice_${member.memberName}_${monthStr}.pdf`);
        } catch (err) {
            console.error('PDF export failed:', err);
            alert('Failed to generate PDF');
        } finally {
            setExportingId(null);
        }
    };

    // ── Export Admin Expenses PDF ──────────────────────────────────────────────
    const exportAdminExpensesPDF = async () => {
        setExportingAdmin(true);
        try {
            const res = await api.get(`/summary/${monthStr}/admin-expenses`);
            const adminExpenses = res.data;
            const doc = new jsPDF();
            addBengaliFont(doc);

            doc.setFontSize(20);
            doc.text('Admin Shared Expenses Breakdown', 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`${MONTHS[selectedMonth - 1]} ${selectedYear}`, 105, 28, { align: 'center' });

            const tableRows = adminExpenses.map(exp => [
                exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A',
                exp.itemName || 'Unnamed',
                `₹${exp.amount}`,
                exp.paidByMemberName || 'Admin'
            ]);

            autoTable(doc, {
                startY: 35,
                head: [['Date', 'Item Name', 'Amount', 'Paid By']],
                body: tableRows,
                headStyles: { fillColor: [156, 39, 176] },
            });

            const total = adminExpenses.reduce((sum, e) => sum + e.amount, 0);
            doc.text(`Total Official Admin Spending: ₹${total}`, 190, doc.lastAutoTable.finalY + 10, { align: 'right' });

            doc.save(`AdminExpenses_${monthStr}.pdf`);
        } catch (err) {
            console.error('Admin PDF failed:', err);
            alert('Failed to load admin expenses');
        } finally {
            setExportingAdmin(null);
        }
    };

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

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-1.5 shadow-sm">
                        <select
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className="bg-transparent border-none text-sm font-black text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer px-3"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                        <select
                            value={selectedYear}
                            onChange={handleYearChange}
                            className="bg-transparent border-none text-sm font-black text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer px-3"
                        >
                            {getYearOptions().map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
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

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 sm:p-6">
                            {/* WiFi */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                                    <Wifi size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400">WiFi</p>
                                    <p className={`text-2xl font-black ${sharedExpenses.wifi > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {sharedExpenses.wifi > 0 ? `₹${sharedExpenses.wifi}` : '—'}
                                    </p>
                                    {sharedExpenses.wifi > 0 && data.members.length > 0 && (
                                        <p className="text-[10px] font-bold text-blue-400 dark:text-blue-500 mt-0.5">
                                            ₹{Math.round(sharedExpenses.wifi / data.members.length)} / member
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Electric */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl">
                                    <Zap size={20} className="text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500 dark:text-yellow-400">Electric</p>
                                    <p className={`text-2xl font-black ${sharedExpenses.electric > 0 ? 'text-yellow-700 dark:text-yellow-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {sharedExpenses.electric > 0 ? `₹${sharedExpenses.electric}` : '—'}
                                    </p>
                                    {sharedExpenses.electric > 0 && data.members.length > 0 && (
                                        <p className="text-[10px] font-bold text-yellow-400 dark:text-yellow-500 mt-0.5">
                                            ₹{Math.round(sharedExpenses.electric / data.members.length)} / member
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Paper */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
                                    <Newspaper size={20} className="text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 dark:text-orange-400">Paper</p>
                                    <p className={`text-2xl font-black ${sharedExpenses.paper > 0 ? 'text-orange-700 dark:text-orange-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {sharedExpenses.paper > 0 ? `₹${sharedExpenses.paper}` : '—'}
                                    </p>
                                    {sharedExpenses.paper > 0 && data.members.length > 0 && (
                                        <p className="text-[10px] font-bold text-orange-400 dark:text-orange-500 mt-0.5">
                                            ₹{Math.round(sharedExpenses.paper / data.members.length)} / member
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Didi */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30">
                                <div className="p-3 bg-pink-100 dark:bg-pink-900/40 rounded-xl">
                                    <UserRound size={20} className="text-pink-600 dark:text-pink-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-pink-500 dark:text-pink-400">Didi</p>
                                    <p className={`text-2xl font-black ${sharedExpenses.didi > 0 ? 'text-pink-700 dark:text-pink-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {sharedExpenses.didi > 0 ? `₹${sharedExpenses.didi}` : '—'}
                                    </p>
                                    {sharedExpenses.didi > 0 && data.members.length > 0 && (
                                        <p className="text-[10px] font-bold text-pink-400 dark:text-pink-500 mt-0.5">
                                            ₹{Math.round(sharedExpenses.didi / data.members.length)} / member
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* House Rent */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                                <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
                                    <Home size={20} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 dark:text-violet-400">House Rent</p>
                                    <p className={`text-2xl font-black ${sharedExpenses.houseRent > 0 ? 'text-violet-700 dark:text-violet-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {sharedExpenses.houseRent > 0 ? `₹${sharedExpenses.houseRent}` : '—'}
                                    </p>
                                    {sharedExpenses.houseRent > 0 && data.members.length > 0 && (
                                        <p className="text-[10px] font-bold text-violet-400 dark:text-violet-500 mt-0.5">
                                            ₹{Math.round(sharedExpenses.houseRent / data.members.length)} / member
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Per Head Cost (Fixed) */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30">
                                <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-xl">
                                    <Calculator size={20} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-500 dark:text-primary-400">Fixed Cost / Per Head</p>
                                    <p className={`text-2xl font-black ${data?.sharedExpense?.results?.perHeadAmount > 0 ? 'text-primary-700 dark:text-primary-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {data?.sharedExpense?.results?.perHeadAmount > 0 ? `₹${Math.round(data.sharedExpense.results.perHeadAmount)}` : '—'}
                                    </p>
                                    {(data?.sharedExpense?.results?.perHeadAmount || 0) > 0 && (
                                        <p className="text-[10px] font-bold text-primary-400 dark:text-primary-500 mt-0.5 whitespace-nowrap">
                                            Total Official Snapshot
                                        </p>
                                    )}
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
                        { label: 'Rate', value: `₹${mealRate}`, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/20', icon: Utensils },
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
                            <button
                                onClick={exportAdminExpensesPDF}
                                disabled={exportingAdmin}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wide hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all border border-indigo-200/60 dark:border-indigo-800/30"
                            >
                                {exportingAdmin ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                Admin Exp. PDF
                            </button>
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
                                    <th className="px-4 py-3 text-center">Meals(₹)</th>
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
                                                    <td className="px-4 py-4 text-center font-black text-xs text-amber-600">₹{Math.round(snapshotM?.mealCost || 0)}</td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-2">
                                                                {remaining === 0 ? (
                                                                    <span className="text-[10px] font-black text-emerald-500">CLEAR</span>
                                                                ) : (
                                                                    <span className={`text-[10px] font-black ${snapshotM?.type === 'Pay' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                        ₹{remaining} {snapshotM?.type === 'Pay' ? 'PAY' : 'GET'}
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
                                                            <button
                                                                onClick={() => exportInvoice(member)}
                                                                className="text-[9px] font-black text-slate-400 hover:text-primary-500 uppercase flex items-center gap-1"
                                                            >
                                                                <Download size={10} /> Invoice
                                                            </button>
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
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <div className="text-[8px] font-black text-slate-400 uppercase">Meal Cost</div>
                                                <div className="text-xs font-black">₹{Math.round(snapshotM?.mealCost || 0)}</div>
                                            </div>
                                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <div className="text-[8px] font-black text-slate-400 uppercase">Balance</div>
                                                <div className={`text-xs font-black ${snapshotM?.type === 'Pay' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    ₹{remaining}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Snapshot Details</span>
                                            <button
                                                onClick={() => exportInvoice(member)}
                                                className="text-[10px] font-black text-primary-500 flex items-center gap-1"
                                            >
                                                <Download size={12} /> DEPOSIT ₹{Math.round(member.expenses?.deposit || 0)}
                                            </button>
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
