import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    ClipboardList, ChevronDown, X, Save, Crown,
    CheckCircle2, Clock, AlertCircle, Users,
    ShoppingBag, Wifi, Zap, User, Utensils,
    Coffee, FileText, Loader2, RefreshCw, Search, Download, Wallet, Home, Newspaper, UserRound, Calendar
} from 'lucide-react';
import api from '../../lib/api';
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
        setDepositBalance(val.toString());
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
                        value={depositBalance}
                        onChange={e => handleBalanceChange(e.target.value)}
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
                        value={submittedAmount}
                        onChange={e => setSubmittedAmount(e.target.value)}
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
    const { globalMonth, setGlobalMonth } = useData();

    // Sync local selection with global selection
    // Parse globalMonth safely
    const [year, month] = useMemo(() => {
        if (!globalMonth || typeof globalMonth !== 'string') {
            const now = new Date();
            return [now.getFullYear(), now.getMonth() + 1];
        }
        const parts = globalMonth.split('-').map(Number);
        return parts.length === 2 ? parts : [new Date().getFullYear(), new Date().getMonth() + 1];
    }, [globalMonth]);

    const [selectedYear, setSelectedYear] = useState(year);
    const [selectedMonth, setSelectedMonth] = useState(month);

    useEffect(() => {
        if (globalMonth && typeof globalMonth === 'string' && globalMonth.includes('-')) {
            const [y, m] = globalMonth.split('-').map(Number);
            setSelectedYear(y || new Date().getFullYear());
            setSelectedMonth(m || new Date().getMonth() + 1);
        }
    }, [globalMonth]);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [exportingId, setExportingId] = useState(null);
    const [exportingAdmin, setExportingAdmin] = useState(false);
    const [sharedExpenses, setSharedExpenses] = useState({ paper: 0, didi: 0, houseRent: 0, gas: 0, wifi: 0, electric: 0 });

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
                // FALLBACK REMOVED: strictly use snapshot
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

    const handlePaymentSaved = ({ memberId, paymentStatus, amountPaid, submittedAmount, receivedAmount, depositBalance, depositDate, depositBalanceLocked, note }) => {
        setData(prev => ({
            ...prev,
            members: prev.members.map(m =>
                m.memberId === memberId
                    ? { ...m, paymentStatus, amountPaid, submittedAmount: submittedAmount || 0, receivedAmount: receivedAmount || 0, depositBalance, depositDate, depositBalanceLocked: true, note }
                    : m
            )
        }));
    };

    // ── Export PDF Invoice (member) ────────────────────────────────────────────
    const exportInvoice = async (member) => {
        setExportingId(member.memberId);
        try {
            const res = await api.get(`/summary/${monthStr}/invoice/${member.memberId}`);
            const inv = res.data;
            const monthLabel = MONTHS[selectedMonth - 1] ? `${MONTHS[selectedMonth - 1]} ${selectedYear}` : `${selectedYear}-${selectedMonth}`;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pw = doc.internal.pageSize.getWidth();

            // ── Banner ──
            doc.setFillColor(67, 56, 202);
            doc.rect(0, 0, pw, 28, 'F');
            doc.setFillColor(99, 102, 241);
            doc.rect(0, 24, pw, 4, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('RANI BHAWBAN MESS', pw / 2, 12, { align: 'center' });
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('MONTHLY INVOICE', pw / 2, 19, { align: 'center' });

            // ── Meta ──
            let y = 36;
            doc.setFontSize(9); doc.setTextColor(30, 30, 60); doc.setFont('helvetica', 'bold');
            doc.text(`Month: ${monthLabel}`, 14, y);
            doc.text(`Member: ${inv.member.name}`, pw / 2, y, { align: 'center' });
            doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pw - 14, y, { align: 'right' });
            y += 5;
            doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 120);
            doc.text(`Manager(s): ${inv.managers.join(', ') || 'N/A'}`, 14, y);
            y += 8;

            const sectionHeader = (label, r, g, b) => {
                doc.setFillColor(r, g, b);
                doc.roundedRect(14, y, pw - 28, 7, 1, 1, 'F');
                doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
                doc.text(label, 18, y + 4.8);
                y += 10;
            };

            const pmt = inv.payment;
            const submittedAmt = pmt?.submittedAmount || pmt?.amountPaid || 0;
            const depositBalance = pmt?.depositBalance || inv.member.deposit || 0;
            const payStatus = pmt?.paymentStatus || 'pending';
            const note = pmt?.note || '';

            // ── Market expenses ──
            const marketExpenses = inv.memberExpenses.filter(e => e.category === 'market');
            const otherExpenses = inv.memberExpenses.filter(e => e.category !== 'market');
            const marketTotal = marketExpenses.reduce((s, e) => s + (e.amount || 0), 0);

            sectionHeader('MARKET EXPENSES', 16, 185, 129);
            if (marketExpenses.length === 0) {
                autoTable(doc, {
                    startY: y, head: [['Date', 'Description', 'Amount (Rs.)']],
                    body: [['—', 'No market expenses', '—']], theme: 'grid',
                    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 60] },
                    margin: { left: 14, right: 14 },
                });
            } else {
                const marketRows = marketExpenses.map(e => [e.date, e.description, `Rs.${e.amount || 0}`]);
                marketRows.push(['', 'Market Total', `Rs.${marketTotal}`]);
                const totalRowIdx = marketRows.length - 1;
                autoTable(doc, {
                    startY: y, head: [['Date', 'Description', 'Amount (Rs.)']],
                    body: marketRows, theme: 'grid',
                    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 60] },
                    alternateRowStyles: { fillColor: [236, 253, 245] },
                    margin: { left: 14, right: 14 }, tableLineColor: [200, 240, 220], tableLineWidth: 0.2,
                    didParseCell(data) {
                        if (data.section === 'body' && data.row.index === totalRowIdx) {
                            data.cell.styles.fillColor = [16, 185, 129];
                            data.cell.styles.textColor = [255, 255, 255];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                });
            }
            y = doc.lastAutoTable.finalY + 6;

            // ── Other member expenses ──
            if (otherExpenses.length > 0) {
                sectionHeader('OTHER EXPENSES', 100, 116, 139);
                const otherRows = otherExpenses.map(e => [e.date, e.description, `Rs.${e.amount || 0}`]);
                autoTable(doc, {
                    startY: y, head: [['Date', 'Description', 'Amount (Rs.)']],
                    body: otherRows, theme: 'grid',
                    headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 60] },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    margin: { left: 14, right: 14 }, tableLineColor: [220, 220, 230], tableLineWidth: 0.2,
                });
                y = doc.lastAutoTable.finalY + 8;
            } else {
                y = doc.lastAutoTable.finalY + 8;
            }


            // ── Regular meals (count only) ──
            sectionHeader('REGULAR MEALS', 245, 158, 11);
            const lunchCount = inv.regularMeals.filter(m => m.type === 'lunch').length;
            const dinnerCount = inv.regularMeals.filter(m => m.type === 'dinner').length;
            autoTable(doc, {
                startY: y, head: [['Lunch Count', 'Dinner Count', 'Total Meals']],
                body: [[lunchCount, dinnerCount, inv.regularMeals.length]],
                theme: 'grid',
                headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                bodyStyles: { fontSize: 8, textColor: [30, 30, 60], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [255, 251, 235] },
                margin: { left: 14, right: 14 },
            });
            y = doc.lastAutoTable.finalY + 8;

            // ── Guest meals (detailed: date, type, time, amount) ──
            if (inv.guestMeals.length > 0) {
                sectionHeader('GUEST MEALS', 168, 85, 247);
                const guestPrices = MESS_CONFIG.GUEST_CONFIG.PRICES;
                const guestRows = inv.guestMeals.map(g => {
                    const price = g.amount || guestPrices[g.guestMealType] || 0;
                    return [
                        g.date,
                        (g.guestMealType || '—').charAt(0).toUpperCase() + (g.guestMealType || '').slice(1),
                        g.mealTime ? (g.mealTime.charAt(0).toUpperCase() + g.mealTime.slice(1)) : '—',
                        `Rs.${price}`
                    ];
                });
                const guestTotal = inv.guestMeals.reduce((s, g) => s + (g.amount || guestPrices[g.guestMealType] || 0), 0);
                guestRows.push(['', '', 'Total', `Rs.${guestTotal}`]);
                autoTable(doc, {
                    startY: y, head: [['Date', 'Meal Type', 'Meal Time', 'Amount (Rs.)']],
                    body: guestRows, theme: 'grid',
                    headStyles: { fillColor: [168, 85, 247], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 60] },
                    alternateRowStyles: { fillColor: [250, 245, 255] },
                    margin: { left: 14, right: 14 },
                });
                y = doc.lastAutoTable.finalY + 8;
            }


            // ── Monthly Charges (Snapshot) ──
            const snapshotM = data?.sharedExpense?.memberBalances?.find(mb => mb.memberId === inv.member.memberId);
            if (snapshotM) {
                sectionHeader('MONTHLY CHARGES (OFFICIAL)', 67, 56, 202);
                autoTable(doc, {
                    startY: y,
                    head: [['Description', 'Amount (Rs.)']],
                    body: [
                        ['Meal Cost', `Rs.${snapshotM.mealCost}`],
                        ['Shared/Fixed Cost', `Rs.${snapshotM.sharedCost}`],
                        ['Guest Adjustment', `Rs.${snapshotM.guestCost}`],
                        ['TOTAL GROSS CHARGE', `Rs.${snapshotM.totalCost}`],
                        ['Market Paid (Deducted)', `Rs.${snapshotM.marketCost}`]
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 60] },
                    margin: { left: 14, right: 14 },
                });
                y = doc.lastAutoTable.finalY + 8;
            }

            // ── Payment summary ──
            sectionHeader('PAYMENT SUMMARY', 239, 68, 68);
            const statusColors = { clear: [16, 185, 129], partial: [245, 158, 11], pending: [239, 68, 68] };
            const sc = statusColors[payStatus] || statusColors.pending;

            // Due logic: (TotalCost - MarketPaid) - CashReceived
            const payableBase = snapshotM ? (snapshotM.totalCost - snapshotM.marketCost) : Math.round(depositBalance);
            const cashReceived = (inv.payment?.receivedAmount || 0);

            autoTable(doc, {
                startY: y,
                head: [['Payable Base (Rs.)', 'Confirmed Paid (Rs.)', 'Due (Rs.)', 'Payment Status', 'Note']],
                body: [[
                    `Rs.${Math.round(payableBase)}`,
                    `Rs.${Math.round(cashReceived)}`,
                    `Rs.${Math.round(Math.max(0, payableBase - cashReceived))}`,
                    payStatus.toUpperCase(),
                    note || '—'
                ]],
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                bodyStyles: { fontSize: 8, textColor: [30, 30, 60] },
                columnStyles: { 3: { fontStyle: 'bold', textColor: sc } },
                margin: { left: 14, right: 14 },
            });

            // ── Footer ──
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7); doc.setTextColor(160, 160, 180);
                doc.text(`Rani Bhawban Mess  •  Page ${i} of ${pageCount}`, pw / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
            }
            doc.save(`Invoice_${inv.member.name}_${monthLabel.replace(' ', '_')}.pdf`);
        } catch (err) {
            console.error('Invoice export error:', err);
            alert('Failed to export invoice. Please try again.');
        } finally {
            setExportingId(null);
        }
    };

    // ── Export Admin Expenses PDF ─────────────────────────────────────────────
    const exportAdminExpensesPDF = async () => {
        setExportingAdmin(true);
        try {
            const res = await api.get(`/summary/${monthStr}/admin-expenses`);
            const { adminExpenses, totalMembers, managers } = res.data;
            const monthLabel = MONTHS[selectedMonth - 1] ? `${MONTHS[selectedMonth - 1]} ${selectedYear}` : `${selectedYear}-${selectedMonth}`;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pw = doc.internal.pageSize.getWidth();

            // ── Banner ──
            doc.setFillColor(99, 102, 241);
            doc.rect(0, 0, pw, 28, 'F');
            doc.setFillColor(129, 140, 248);
            doc.rect(0, 24, pw, 4, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(255, 255, 255);
            doc.text('RANI BHAWBAN MESS', pw / 2, 12, { align: 'center' });
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            doc.text('ADMIN / SHARED EXPENSES — ' + monthLabel.toUpperCase(), pw / 2, 19, { align: 'center' });

            let y = 36;
            doc.setFontSize(9); doc.setTextColor(30, 30, 60); doc.setFont('helvetica', 'bold');
            doc.text(`Month: ${monthLabel}`, 14, y);
            doc.text(`Total Members: ${totalMembers}`, pw / 2, y, { align: 'center' });
            doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pw - 14, y, { align: 'right' });
            y += 5;
            doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 120);
            doc.text(`Manager(s): ${managers.join(', ') || 'N/A'}`, 14, y);
            y += 10;

            doc.setFillColor(99, 102, 241);
            doc.roundedRect(14, y, pw - 28, 7, 1, 1, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
            doc.text('SHARED EXPENSES', 18, y + 4.8);
            y += 10;

            const rows = adminExpenses.length === 0
                ? [['—', 'No admin expenses recorded', '—', '—', '—']]
                : adminExpenses.map(e => {
                    const total = e.amount || 0;
                    const share = Math.round(total / (totalMembers || 1));
                    return [e.date, e.description, e.category, `Rs.${total}`, `Rs.${share}`];
                });
            if (adminExpenses.length > 0) {
                const grandTotal = adminExpenses.reduce((s, e) => s + (e.amount || 0), 0);
                const grandShare = Math.round(grandTotal / (totalMembers || 1));
                rows.push(['', '', 'TOTAL', `Rs.${grandTotal}`, `Rs.${grandShare}/member`]);
            }

            autoTable(doc, {
                startY: y,
                head: [['Date', 'Description', 'Category', 'Total (Rs.)', `Per Member (÷${totalMembers})`]],
                body: rows, theme: 'grid',
                headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                bodyStyles: { fontSize: 7.5, textColor: [30, 30, 60] },
                alternateRowStyles: { fillColor: [238, 237, 255] },
                margin: { left: 14, right: 14 },
                tableLineColor: [200, 200, 240], tableLineWidth: 0.2,
            });

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7); doc.setTextColor(160, 160, 180);
                doc.text(`Rani Bhawban Mess  •  Page ${i} of ${pageCount}`, pw / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
            }
            doc.save(`AdminExpenses_${monthLabel.replace(' ', '_')}.pdf`);
        } catch (err) {
            console.error('Admin expenses export error:', err);
            alert('Failed to export admin expenses. Please try again.');
        } finally {
            setExportingAdmin(false);
        }
    };

    // Summary stats
    const totalMembers = data?.members?.length || 0;
    const clearedCount = data?.members?.filter(m => m.paymentStatus === 'clear').length || 0;
    const pendingCount = data?.members?.filter(m => m.paymentStatus === 'pending').length || 0;
    const partialCount = data?.members?.filter(m => m.paymentStatus === 'partial').length || 0;
    const totalMeals = data?.members?.reduce((s, m) => s + (m.regularMeals || 0) + (m.guestMeals || 0), 0) || 0;
    const totalMealCharge = Math.round(data?.sharedExpense?.memberBalances?.reduce((s, m) => s + (m.mealCost || 0), 0) || 0);
    const mealRate = totalMeals > 0 ? (totalMealCharge / totalMeals).toFixed(2) : '0';
    const totalMarket = data?.sharedExpense?.memberBalances?.reduce((s, m) => s + (m.marketCost || 0), 0) ||
        data?.members?.reduce((s, m) => s + (m.expenses?.market || 0), 0) || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-12"
        >
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
                        <ClipboardList size={28} className="text-primary-500" />
                        Monthly Summary
                    </h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                        Complete breakdown of member activity for the selected month.
                    </p>
                </div>

                {/* Refresh button */}
                <button
                    onClick={fetchSummary}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-100 dark:hover:bg-primary-950/40 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* ── Timeline Info ── */}
            <Card className="p-4 bg-white/90 dark:bg-slate-900/40 border-indigo-100/50 dark:border-white/5">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950/20 rounded-xl border border-primary-200/50 dark:border-primary-800/30">
                        <Calendar size={16} className="text-primary-500" />
                        <span className="text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                            Viewing: {MONTHS[selectedMonth - 1] || '---'} {selectedYear}
                        </span>
                    </div>

                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 max-w-[200px]">
                        Data below is synced with the global timeline at the top.
                    </p>

                    {/* Manager display */}
                    {data?.managers && data.managers.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/30 ml-auto">
                            <Crown size={14} className="text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                Manager{data.managers.length > 1 ? 's' : ''}:
                            </span>
                            <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                                {data.managers.join(', ')}
                            </span>
                        </div>
                    )}
                </div>
            </Card>

            {/* ── Submission Warning ── */}
            {data && !data.sharedExpense && !loading && (
                <Card className="p-6 border-amber-200/50 dark:border-amber-800/20 bg-amber-50 dark:bg-amber-950/10 text-center">
                    <AlertCircle size={32} className="text-amber-500 mx-auto mb-3" />
                    <h2 className="text-lg font-black text-amber-700 dark:text-amber-400">Official Report Not Submitted</h2>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-500 mt-1 max-w-md mx-auto">
                        This month's official summary hasn't been finalized yet. Please go to the
                        <a href="/calculator" className="mx-1 underline hover:text-amber-700">Calculator</a>
                        and click "Submit to report" to generate this summary.
                    </p>
                </Card>
            )}

            {/* ── Shared Expenses Panel (Paper, Didi, House Rent) ── */}
            {!loading && data && data.sharedExpense && Object.keys(data.sharedExpense).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="p-0 overflow-hidden border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-950/40 rounded-xl">
                                <Wallet size={18} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-black text-slate-900 dark:text-white">Shared Expenses</h2>
                                    {sharedExpenses.isSnapshot && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800/50">
                                            Official Snapshot
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bills · Paper · Didi · Rent — from approved expenses</p>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Gas */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-xl">
                                    <AlertCircle size={20} className="text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400">Gas</p>
                                    <p className={`text-2xl font-black ${sharedExpenses.gas > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {sharedExpenses.gas > 0 ? `₹${sharedExpenses.gas}` : '—'}
                                    </p>
                                    {sharedExpenses.gas > 0 && data.members.length > 0 && (
                                        <p className="text-[10px] font-bold text-rose-400 dark:text-rose-500 mt-0.5">
                                            ₹{Math.round(sharedExpenses.gas / data.members.length)} / member
                                        </p>
                                    )}
                                </div>
                            </div>
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
                        </div>
                        {(sharedExpenses.paper + sharedExpenses.didi + sharedExpenses.houseRent) > 0 && (
                            <div className="px-6 pb-5">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Shared</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white">
                                        ₹{sharedExpenses.paper + sharedExpenses.didi + sharedExpenses.houseRent + sharedExpenses.gas + sharedExpenses.wifi + sharedExpenses.electric}
                                    </span>
                                </div>
                            </div>
                        )}
                    </Card>
                </motion.div>
            )}

            {/* ── Stats overview ── */}
            {data && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Cleared', value: clearedCount, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: CheckCircle2 },
                        { label: 'Pending', value: pendingCount, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/20', icon: Clock },
                        { label: 'Partial', value: partialCount, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: AlertCircle },
                        { label: 'Meal Rate', value: `₹${mealRate}/meal`, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/20', icon: Utensils },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <Card className={`p-4 flex items-center gap-3 ${stat.bg} border-0`}>
                                <stat.icon size={18} className={stat.color} />
                                <div>
                                    <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{stat.label}</div>
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
                                <div>
                                    <h2 className="text-base font-black text-slate-900 dark:text-white">Member Breakdown</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Click payment badge to update status</p>
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
                            {/* Admin Expenses PDF button */}
                            <button
                                onClick={exportAdminExpensesPDF}
                                disabled={exportingAdmin}
                                title="Download Admin Expenses PDF for this month"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wide hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all disabled:opacity-50 border border-indigo-200/60 dark:border-indigo-800/30"
                            >
                                {exportingAdmin ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                Admin Expenses
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1050px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-white/5">
                                    <th className="px-5 py-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight sticky left-0 top-0 z-20 bg-slate-50 dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Member</th>
                                    <th className="px-4 py-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">Deposit<br /><span className="text-[9px] font-black text-violet-500/70 lowercase opacity-60">(monthly)</span></th>
                                    <th className="px-4 py-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">Market<br /><span className="text-[9px] font-black text-blue-500/70 lowercase opacity-60">(paid)</span></th>
                                    <th className="px-4 py-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">Gas</th>
                                    <th className="px-4 py-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">WiFi</th>
                                    <th className="px-4 py-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">Electric</th>
                                    <th className="px-4 py-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">Meals<br /><span className="text-[9px] font-black text-amber-500/70 lowercase opacity-60">(count)</span></th>
                                    <th className="px-4 py-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">Meals<br /><span className="text-[9px] font-black text-amber-500/70 lowercase opacity-60">(cost)</span></th>
                                    <th className="px-4 py-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight italic sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {(() => {
                                        const filtered = searchQuery.trim()
                                            ? data.members.filter(m =>
                                                m.memberName.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            : data.members;

                                        if (filtered.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan="12" className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm font-bold italic">
                                                        {searchQuery ? `No member found matching "${searchQuery}"` : 'No members found.'}
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return filtered.map((member, idx) => {
                                            const snapshotM = data?.sharedExpense?.memberBalances?.find(mb => mb.memberId === member.memberId);
                                            return (
                                                <motion.tr
                                                    key={member.memberId}
                                                    layout
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                                                >
                                                    {/* Member name */}
                                                    <td className="px-5 py-4 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black text-sm shadow-sm uppercase">
                                                                {(member.memberName || '?').charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-slate-900 dark:text-white text-sm">{member.memberName}</div>
                                                                {member.note && (
                                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 italic">{member.note}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Deposit — from General Deposit expenses this month */}
                                                    <td className="px-4 py-4 text-center">
                                                        {(() => {
                                                            const genDep = member.expenses?.deposit || 0;
                                                            return genDep > 0 ? (
                                                                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                                                                    ₹{Math.round(genDep)}
                                                                </span>
                                                            ) : (
                                                                <span className="font-black text-sm text-slate-300 dark:text-slate-600">₹0</span>
                                                            );
                                                        })()}
                                                    </td>

                                                    {/* Market */}
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`font-black text-sm ${(snapshotM?.marketCost || 0) > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                            {(snapshotM?.marketCost || 0) > 0 ? `₹${Math.round(snapshotM.marketCost)}` : '—'}
                                                        </span>
                                                    </td>

                                                    {/* Gas */}
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`font-black text-sm ${(member.expenses?.gas || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                            {(member.expenses?.gas || 0) > 0 ? `₹${Math.round(member.expenses.gas)}` : '—'}
                                                        </span>
                                                    </td>

                                                    {/* WiFi */}
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`font-black text-sm ${(member.expenses?.wifi || 0) > 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                            {(member.expenses?.wifi || 0) > 0 ? `₹${Math.round(member.expenses.wifi)}` : '—'}
                                                        </span>
                                                    </td>

                                                    {/* Electric */}
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`font-black text-sm ${(member.expenses?.electric || 0) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                            {(member.expenses?.electric || 0) > 0 ? `₹${Math.round(member.expenses.electric)}` : '—'}
                                                        </span>
                                                    </td>

                                                    {/* Meals — Count */}
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-black text-sm text-slate-600 dark:text-slate-300">
                                                                {member.regularMeals < 40 ? (
                                                                    <span className="flex items-center gap-1">
                                                                        40
                                                                        <span className="text-[10px] text-slate-400 font-bold">({member.regularMeals})</span>
                                                                    </span>
                                                                ) : member.regularMeals}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-tighter">
                                                                {member.guestMeals} Guest
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Meals — Amount */}
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="font-black text-sm text-amber-600 dark:text-amber-400">
                                                            ₹{Number(snapshotM?.mealCost || 0).toFixed(2)}
                                                        </span>
                                                    </td>



                                                    {/* Status = {amount} received or pay */}
                                                    <td className="px-4 py-4 text-center">
                                                        {(() => {
                                                            if (!snapshotM) return <span className="text-slate-300">—</span>;

                                                            const baseBalance = Math.round(snapshotM.balance) || 0;
                                                            const submitted = member.submittedAmount || 0;
                                                            const remaining = Math.max(0, baseBalance - submitted);

                                                            return (
                                                                <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                                                                    {remaining === 0 ? (
                                                                        <span className="text-emerald-500 font-black uppercase tracking-widest text-[10px]">✓ Clear</span>
                                                                    ) : snapshotM.type === 'Pay' ? (
                                                                        <div className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest text-[10px] shadow-sm ring-1 ring-rose-500/20">
                                                                            ₹{remaining} Pay
                                                                        </div>
                                                                    ) : (
                                                                        <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-[10px] shadow-sm ring-1 ring-emerald-500/20">
                                                                            ₹{remaining} Get
                                                                        </div>
                                                                    )}
                                                                    <div className="mt-1 flex flex-col items-center gap-1">
                                                                        <StatusBadge
                                                                            status={member.paymentStatus}
                                                                            onClick={() => setEditingMember({
                                                                                ...member,
                                                                                finalBalance: baseBalance, // Keep the modal's target amount un-shrunk
                                                                                snapshotType: snapshotM.type
                                                                            })}
                                                                        />
                                                                        {submitted > 0 && (
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                                                {snapshotM.type === 'Pay' ? 'Paid' : 'Got'} ₹{submitted}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => exportInvoice(member)}
                                                                        disabled={exportingId === member.memberId}
                                                                        className="flex items-center gap-1 text-slate-400 hover:text-emerald-500 transition-colors font-black text-[9px] uppercase tracking-tighter mt-1"
                                                                    >
                                                                        <Download size={10} />
                                                                        {exportingId === member.memberId ? '...' : 'Invoice'}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                </motion.tr>
                                            );
                                        });
                                    })()}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer totals */}
                    {data.members.length > 0 && (
                        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap gap-4 text-xs font-black">
                            <span className="text-slate-500 dark:text-slate-400 uppercase tracking-widest">Totals:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                                Market: ₹{Math.round(data.sharedExpense?.memberBalances?.reduce((s, m) => s + (m.marketCost || 0), 0) || data.members.reduce((s, m) => s + (m.expenses?.market || 0), 0))}
                            </span>
                            <span className="text-cyan-600 dark:text-cyan-400">
                                WiFi: ₹{Math.round(sharedExpenses.wifi || 0)}
                            </span>
                            <span className="text-yellow-600 dark:text-yellow-400">
                                Electric: ₹{Math.round(sharedExpenses.electric || 0)}
                            </span>
                            <span className="text-amber-600 dark:text-amber-400">
                                Guest Meals: {data.members.reduce((s, m) => s + (m.guestMeals || 0), 0)}
                            </span>
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
