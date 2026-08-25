import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, X, Save, Crown,
    CheckCircle2, Clock, AlertCircle, Users,
    ShoppingBag, Wifi, Zap, Utensils, Flame,
    Coffee, FileText, Loader2, RefreshCw, Search, Newspaper, UserRound, Calculator, TrendingUp, TrendingDown,
    Calendar, ChevronLeft, ChevronRight, ChevronDown, Coins, Activity, Shield, PlusCircle,
    Download, FileDown
} from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { generateBillPDF } from '../../utils/pdfReport';

const HomeIcon = ({ size = 18, className }) => (
    <img src="/icons/home.png" alt="Home" className={cn("object-contain", className)} style={{ width: size, height: size }} />
);

// ─── Month/year helpers ─────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    clear: {
        label: 'Clear',
        icon: CheckCircle2,
        cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    },
    partial: {
        label: 'Partial',
        icon: AlertCircle,
        cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    },
    pending: {
        label: 'Pending',
        icon: Clock,
        cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    },
};

const StatusBadge = ({ status, onClick }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon || AlertCircle;
    return (
        <button
            onClick={onClick}
            title="Click to update payment status"
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-all hover:scale-105 active:scale-95",
                cfg.cls
            )}
        >
            <Icon size={12} />
            {cfg.label}
        </button>
    );
};

// ─── Member Card Component ──────────────────────────────────────────────────

const MemberCard = memo(({ m, offM, dRate, dHead, dMinLimit, setEditingMember, mCount, bills, categoryProviders }) => {
    const chargedRegMeals = m.chargedMeals || Math.max(dMinLimit, Number(m.regularMeals) || 0);
    const isMinApplied = chargedRegMeals > (Number(m.regularMeals) || 0);

    const lMCost = chargedRegMeals * dRate;
    const lGCost = (Number(m.guestMeals) || 0) * dRate;
    const totalContribution = Object.values(m.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0);

    const dMCost = Number(offM.mealCost ?? lMCost) || 0;
    const dGCost = Number(offM.guestMealCost ?? offM.guestCost ?? lGCost) || 0;

    // Signed Balance logic
    const rawOffBal = Number(offM.balance) || 0;
    const signedOffBal = offM.type === 'Get' ? -rawOffBal : rawOffBal;
    
    // STRICT MODE: If finalized data (offM) is missing, hide live stats.
    const hasFinalizedData = Object.keys(offM).length > 0;
    
    // Finalized contribution (from stored record) vs live contribution
    const finalizedContribution = Number(offM.totalContribution ?? totalContribution); 
    const effectiveContribution = finalizedContribution;

    const dBal = signedOffBal || ((dMCost + dGCost + Number(dHead)) - effectiveContribution);

    const rem = Math.round(dBal) - (Number(m.submittedAmount) || 0);

    return (
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 sm:p-6 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 shadow-sm transition-all group relative overflow-hidden backdrop-blur-xl">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">{(m.memberName || '?').charAt(0)}</div>
                    <div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">{m.memberName}</div>
                        <div className="flex flex-col gap-1">
                            <div className="flex text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider items-center gap-1.5 leading-none">
                                <Calendar size={10} /> {m.marketDays || 0} Market Days
                                {m.marketDates?.length > 0 && (
                                    <span className="text-[8px] opacity-60 font-mono">({m.marketDates.map(d => d.split('-')[2]).join(', ')})</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <StatusBadge status={m.paymentStatus} onClick={() => setEditingMember({ ...m, finalBalance: Math.round(dBal), snapshotType: offM.type || (dBal > 0 ? 'Pay' : 'Get') })} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 rounded-xl">
                    <div className="text-[8px] font-extrabold text-slate-400 mb-0.5 uppercase tracking-wider">Meal Cost</div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold text-slate-400 leading-none">{chargedRegMeals} × {dRate.toFixed(2)}</span>
                        <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">₹{Math.round(dMCost)}</div>
                    </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 rounded-xl">
                    <div className="text-[8px] font-extrabold text-slate-400 mb-0.5 uppercase tracking-wider">Guest</div>
                    <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">₹{Math.round(dGCost)}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 rounded-xl">
                    <div className="text-[8px] font-extrabold text-slate-400 mb-0.5 uppercase tracking-wider">Shared Cost</div>
                    <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">₹{Math.round(dHead)}</div>
                </div>
                <div className={cn(
                    "p-3 rounded-xl border transition-all",
                    rem > 0 ? "bg-rose-500/10 border-rose-500/20" :
                        rem < 0 ? "bg-emerald-500/10 border-emerald-500/20" :
                            "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/5"
                )}>
                    <div className={cn(
                        "text-[8px] font-extrabold uppercase mb-0.5 tracking-wider",
                        rem > 0 ? "text-rose-500" : rem < 0 ? "text-emerald-500" : "text-slate-400"
                    )}>Balance</div>
                    <div className={cn(
                        "text-base font-extrabold",
                        rem > 0 ? "text-rose-600 dark:text-rose-400" : rem < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    )}>₹{rem === 0 ? '0' : Math.abs(rem)}</div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-y-2 py-2.5 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <div className="relative group/meal">
                        <div className={cn(
                            "px-2 py-0.5 border rounded-lg flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-tight",
                            isMinApplied
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
                                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                        )}>
                            <ClipboardList size={10} className={isMinApplied ? "text-rose-500" : "text-indigo-500"} />
                            <span>{m.regularMeals} REG</span>
                        </div>

                        {isMinApplied && (
                            <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                                {dMinLimit}+
                            </div>
                        )}
                    </div>

                    <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-1.5">
                        <Users size={10} className="text-amber-500" />
                        <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-tight">{m.guestMeals} GUEST</span>
                    </div>
                    <div className="flex items-center gap-1"><TrendingUp size={11} className="text-emerald-500" /> <span className="opacity-70 text-[9px] font-extrabold uppercase text-slate-400">Audit Ready</span></div>
                </div>
            </div>

            {/* Contributions Grid */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/5">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Your Contributions</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(() => {
                        const cats = [
                            { k: 'market', l: 'Market', i: ShoppingBag, c: 'indigo' },
                            { k: 'deposit', l: 'Deposit', i: Coins, c: 'emerald' },
                            { k: 'gas', l: 'Gas', i: Flame, c: 'amber' },
                            { k: 'wifi', l: 'Wifi', i: Wifi, c: 'blue' },
                            { k: 'electric', l: 'Electric', i: Zap, c: 'rose' },
                            { k: 'spices', l: 'Spices', i: Flame, c: 'orange' },
                            { k: 'rice', l: 'Rice', i: ShoppingBag, c: 'emerald' }
                        ];
                        return cats.map(cat => {
                            const val = Number(m.expenses?.[cat.k]) || 0;
                            return (
                                <div key={cat.k} className={cn(
                                    "p-2 rounded-xl border transition-all",
                                    val > 0
                                        ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/10"
                                        : "bg-slate-50/50 dark:bg-white/[0.02] border-transparent opacity-40"
                                    )}>
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <cat.i size={10} className={cn(
                                            cat.c === 'indigo' && "text-indigo-500",
                                            cat.c === 'emerald' && "text-emerald-500",
                                            cat.c === 'amber' && "text-amber-500",
                                            cat.c === 'blue' && "text-blue-500",
                                            cat.c === 'rose' && "text-rose-500"
                                        )} />
                                        <span className="text-[7px] font-extrabold uppercase tracking-tight text-slate-400">{cat.l}</span>
                                    </div>
                                    <div className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">₹{val}</div>
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* Summary Footer */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-2 flex-grow max-w-[240px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Expenses</span>
                        </div>
                        <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">₹{Math.round(dMCost + dGCost + dHead)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Contribution</span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">₹{Math.round(effectiveContribution)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => generateBillPDF({
                            name: m.memberName,
                            meals: m.regularMeals || 0,
                            mealCharge: dRate,
                            mealCost: dMCost,
                            guestMeals: m.guestMeals || 0,
                            fixedCost: dHead,
                            marketContribution: effectiveContribution,
                            deposit: m.submittedAmount || 0,
                            balance: rem
                        }, { month: bills?.month || 'Current Month' })}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white rounded-xl transition-all flex items-center gap-1.5 border border-slate-200/80 dark:border-white/10"
                        title="Download PDF Bill"
                    >
                        <FileDown size={13} />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider">PDF Bill</span>
                    </button>
                    <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/5">
                        <div className="text-right flex flex-col items-end">
                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">
                                {rem > 0 ? 'Payable' : rem < 0 ? 'Receivable' : 'Settled'}
                            </span>
                            <span className={cn(
                                "text-sm font-extrabold leading-none",
                                rem > 0 ? "text-rose-600" : rem < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                            )}>₹{Math.abs(rem)}</span>
                        </div>
                        <div className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center",
                            rem > 0 ? "bg-rose-500 text-white" : rem < 0 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                        )}>
                            {rem > 0 ? <TrendingDown size={13} /> : rem < 0 ? <TrendingUp size={13} /> : <CheckCircle2 size={13} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.m === next.m && 
        prev.dRate === next.dRate &&
        prev.dHead === next.dHead &&
        prev.dMinLimit === next.dMinLimit &&
        prev.mCount === next.mCount &&
        prev.bills === next.bills &&
        prev.categoryProviders === next.categoryProviders &&
        prev.offM === next.offM
    );
});

// ─── Payment edit modal ───────────────────────────────────────────────────────

const PaymentModal = ({ member, month, onClose, onSaved }) => {
    const [depositBalance, setDepositBalance] = useState((member.finalBalance ?? member.depositBalance ?? 0).toString());
    const [submittedAmount, setSubmittedAmount] = useState((member.submittedAmount ?? 0).toString());
    const [depositDate, setDepositDate] = useState(member.depositDate || new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState(member.note || '');
    const [saving, setSaving] = useState(false);

    const submitted = Number(submittedAmount) || 0;
    const balance = Number(depositBalance) || 0;
    const autoStatus = submitted >= balance && balance > 0 ? 'clear' : submitted > 0 ? 'partial' : 'pending';
    const remaining = Math.max(0, balance - submitted);
    const [status, setStatus] = useState(member.paymentStatus || autoStatus);

    useEffect(() => {
        setStatus(autoStatus);
    }, [autoStatus]);

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
            onSaved({ memberId: member.memberId, paymentStatus: status, amountPaid: submitted, submittedAmount: submitted, receivedAmount: submitted, depositBalance: balance, depositDate, depositBalanceLocked: true, note });
            onClose();
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save payment status.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Update Payment</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{member.memberName}</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-extrabold uppercase border border-emerald-500/20">Gen: ₹{Math.round(member.expenses?.deposit || 0)}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                    <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">
                            {member.snapshotType === 'Get' ? 'Amount to Return (₹)' : 'Amount to Pay (₹)'}
                        </label>
                        <input type="number" value={depositBalance === '0' ? '' : depositBalance} onChange={e => setDepositBalance(e.target.value.replace(/^0+(?!$)/, ''))} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Payment Date</label>
                        <input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">
                            {member.snapshotType === 'Get' ? 'Total Returned (₹)' : 'Total Paid (₹)'}
                        </label>
                        <input type="number" value={submittedAmount === '0' ? '' : submittedAmount} onChange={e => setSubmittedAmount(e.target.value.replace(/^0+(?!$)/, ''))} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-extrabold outline-none text-slate-900 dark:text-white" />
                    </div>
                    {balance > 0 && (
                        <div className={cn(
                            "px-3 py-2 rounded-xl text-[10px] font-extrabold flex items-center gap-2 border",
                            autoStatus === 'clear' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : autoStatus === 'partial' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                        )}>
                            {autoStatus === 'clear' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {autoStatus === 'clear' ? 'Balanced' : `₹${remaining} Pending`}
                        </div>
                    )}
                    <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Status Override</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <button key={key} onClick={() => setStatus(key)} className={cn("p-2 rounded-xl border text-[10px] font-extrabold uppercase transition-all", status === key ? cfg.cls + ' ring-2 ring-indigo-500' : 'border-slate-200 dark:border-slate-800 text-slate-400')}>{cfg.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-white/10 flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-extrabold text-xs hover:bg-slate-100 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs disabled:opacity-60 shadow-sm">{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </div>
        </div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const MonthlySummary = () => {
    const navigate = useNavigate();
    const { globalMonth } = useData();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [selectedMemberId, setSelectedMemberId] = useState('');

    const monthStr = useMemo(() => globalMonth || new Date().toISOString().slice(0, 7), [globalMonth]);

    const fetchSummary = useCallback(async () => {
        if (!monthStr) return;
        setLoading(true);
        setError(null);
        try {
            const summaryRes = await api.get(`/summary/${monthStr}`);
            setData(summaryRes.data || {});
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    }, [monthStr]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const handlePaymentSaved = (updatedMember) => {
        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                members: (prev.members || []).map(m => (m._id || m.memberId) === updatedMember.memberId ? { ...m, ...updatedMember } : m)
            };
        });
    };

    const stats = useMemo(() => {
        if (!data) return { rate: 0, head: 0, shared: 0, mkt: 0, rice: 0, gstM: 0, totalM: 0, mCount: 1, minLimit: 40 };

        const lb = (data.liveBills || {});
        const members = (data.members || []);
        const mCount = members.length || 1;
        const minLimit = Number(data.minMealsLimit) || 40;

        const offR = data?.sharedExpense?.results || {};
        const offI = data?.sharedExpense?.mealInputs || {};
        const balances = data?.sharedExpense?.memberBalances || [];

        const adjustedTotalM = balances.reduce((sum, mb) => sum + Math.max(minLimit, mb.meals || 0), 0);

        if (data.sharedExpense) {
            return {
                rate: offR.mealCharge || 0,
                head: offR.perHeadAmount || 0,
                shared: offR.totalSharedAmount || 0,
                mkt: offI.totalMarket || 0,
                rice: offI.rice || 0,
                gstM: offI.guest || 0,
                totalM: offI.totalMeal || 0,
                adjustedTotalM,
                mCount,
                minLimit
            };
        }

        return { 
            rate: 0, head: 0, shared: 0, mkt: 0, rice: 0, gstM: 0, totalM: 0, adjustedTotalM: 0,
            mCount, 
            minLimit: minLimit 
        };
    }, [data]);

    const categoryProviders = useMemo(() => {
        if (!data || !data.members) return {};
        const allCategories = ['gas', 'wifi', 'electric', 'paper', 'didi', 'houseRent', 'spices', 'others', 'market', 'rice', 'deposit', 'fund'];
        const providers = {};
        allCategories.forEach(cat => {
            const payers = data.members
                .filter(m => m.expenses && (Number(m.expenses[cat]) || 0) > 0)
                .map(m => ({ id: m.memberId || m._id, name: m.memberName, amount: Number(m.expenses[cat]) }));
            if (payers.length > 0) providers[cat] = payers;
        });
        return providers;
    }, [data]);

    const allMembers = useMemo(() => {
        if (!data || !data.members) return [];
        return data.members;
    }, [data]);

    const selectedMember = useMemo(() => {
        if (!selectedMemberId) return null;
        return allMembers.find(m => (m._id || m.memberId) === selectedMemberId) || null;
    }, [allMembers, selectedMemberId]);

    const counts = useMemo(() => {
        const mems = data?.members || [];
        return {
            clear: mems.filter(m => m.paymentStatus === 'clear').length,
            pending: mems.filter(m => m.paymentStatus === 'pending').length,
            partial: mems.filter(m => m.paymentStatus === 'partial').length
        };
    }, [data]);

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                        <ClipboardList size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Summary Dashboard</h1>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest">Financial trace for {monthStr}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            filteredMembers.forEach((m, index) => {
                                setTimeout(() => {
                                    const offM = (data?.sharedExpense?.memberBalances || []).find(mb => mb.memberId === (m._id || m.memberId)) || {};
                                    const chargedRegMeals = m.chargedMeals || Math.max(stats.minLimit, Number(m.regularMeals) || 0);
                                    const lMCost = chargedRegMeals * stats.rate;
                                    const lGCost = (Number(m.guestMeals) || 0) * stats.rate;
                                    const totalContribution = Object.values(m.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0);
                                    const finalizedContribution = Number(offM.totalContribution ?? totalContribution); 
                                    const dMCost = Number(offM.mealCost ?? lMCost) || 0;
                                    const dGCost = Number(offM.guestMealCost ?? offM.guestCost ?? lGCost) || 0;
                                    const signedOffBal = offM.type === 'Get' ? -Number(offM.balance) : Number(offM.balance);
                                    const dBal = signedOffBal || ((dMCost + dGCost + Number(stats.head)) - finalizedContribution);
                                    const rem = Math.round(dBal) - (Number(m.submittedAmount) || 0);

                                    generateBillPDF({
                                        name: m.memberName,
                                        meals: m.regularMeals || 0,
                                        mealCharge: stats.rate,
                                        mealCost: dMCost,
                                        guestMeals: m.guestMeals || 0,
                                        fixedCost: stats.head,
                                        marketContribution: finalizedContribution,
                                        deposit: m.submittedAmount || 0,
                                        balance: rem
                                    }, { month: data?.sharedExpense?.bills?.month || 'Current Month' });
                                }, index * 800);
                            });
                        }}
                        className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all"
                        title="Download All Member Bills as PDF"
                    >
                        <Download size={14} />
                        Download Invoices
                    </button>
                    <button onClick={fetchSummary} className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={32} className="animate-spin mb-3 text-indigo-600" />
                    <p className="font-bold text-xs uppercase tracking-wider">Syncing Database...</p>
                </div>
            ) : error ? (
                <div className="p-6 rounded-2xl bg-rose-500/10 text-center flex flex-col items-center gap-3 border border-rose-500/20">
                    <AlertCircle className="text-rose-500" size={28} />
                    <h3 className="font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-sm">Sync Failed</h3>
                    <p className="text-xs font-bold text-slate-500">{error}</p>
                </div>
            ) : data && (
                <>
                    {!data.sharedExpense && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-rose-500 rounded-lg text-white"><AlertCircle size={14} /></div>
                                <div>
                                    <p className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Summary Not Finalized</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Run and submit the calculator to lock monthly snapshot.</p>
                                </div>
                            </div>
                            <div className="px-2.5 py-1 bg-rose-500/10 rounded-lg text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                Unfinalized
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Cleared Accounts', val: counts.clear, icon: CheckCircle2, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', iconColor: 'text-emerald-600' },
                            { label: 'Pending Payments', val: counts.pending, icon: Clock, bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-700 dark:text-rose-400', iconColor: 'text-rose-600' },
                            { label: 'Partial Payments', val: counts.partial, icon: Activity, bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-700 dark:text-amber-400', iconColor: 'text-amber-600' }
                        ].map((card, i) => (
                            <div key={i} className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-xl border", card.bg, card.border, card.iconColor)}>
                                        <card.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">{card.label}</p>
                                        <p className={cn("text-xl font-extrabold mt-0.5", card.text)}>{card.val}</p>
                                    </div>
                                </div>
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Members</div>
                            </div>
                        ))}
                    </div>

                    <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20"><Coins size={16} /></div>
                                <h2 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Monthly Financial Breakdown</h2>
                            </div>
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10">Min {stats.minLimit} Meals</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-white/5">
                            {[
                                { label: 'Total Market', val: stats.mkt > 0 ? `₹${stats.mkt.toLocaleString()}` : '₹0', color: 'text-indigo-600 dark:text-indigo-400' },
                                { label: 'Rice Cost', val: stats.rice > 0 ? `₹${stats.rice.toLocaleString()}` : '₹0', color: 'text-amber-600 dark:text-amber-400' },
                                { label: 'Guest Meals', val: stats.gstM > 0 ? stats.gstM : '0', color: 'text-rose-600 dark:text-rose-400' },
                                { label: 'Total Meals', val: stats.totalM > 0 ? stats.totalM : '0', subVal: stats.adjustedTotalM > 0 ? stats.adjustedTotalM : null, color: 'text-indigo-600 dark:text-indigo-400' },
                                { label: 'Meal Cost', val: stats.rate > 0 ? `₹${Number(stats.rate).toFixed(2)}` : '₹0', color: 'text-emerald-600 dark:text-emerald-400' }
                            ].map((stat, i) => (
                                <div key={i} className="p-4 text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <div className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1">{stat.label}</div>
                                    <div className="flex items-end justify-center gap-1.5">
                                        <div className={cn("text-lg font-extrabold", stat.subVal && stat.subVal !== stat.val ? 'text-rose-600' : stat.color)}>{stat.val}</div>
                                        {stat.subVal && stat.subVal !== stat.val && (
                                            <div className="text-base font-extrabold text-emerald-600" title="Total Adjusted Meals">{stat.subVal}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20"><HomeIcon size={16} /></div>
                                <h2 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Fixed Operational Bills</h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 sm:p-5">
                            {['gas', 'wifi', 'electric', 'paper', 'didi', 'houseRent', 'spices', 'fund', 'others'].map(key => {
                                const val = (data?.sharedExpense?.bills || {})[key] || 0;
                                const config = {
                                    wifi: { icon: Wifi, label: 'WiFi', color: 'text-blue-500' },
                                    electric: { icon: Zap, label: 'Electric', color: 'text-yellow-600' },
                                    gas: { icon: Flame, label: 'Gas', color: 'text-rose-500' },
                                    paper: { icon: Newspaper, label: 'Paper', color: 'text-orange-500' },
                                    didi: { icon: UserRound, label: 'Didi', color: 'text-purple-500' },
                                    houseRent: { icon: HomeIcon, label: 'House Rent', color: 'text-indigo-500' },
                                    spices: { icon: Coffee, label: 'Spices', color: 'text-amber-600' },
                                    fund: { icon: Coins, label: 'Fund', color: 'text-teal-500' },
                                    others: { icon: FileText, label: 'Others', color: 'text-slate-500' }
                                };
                                const item = config[key];
                                return (
                                    <div key={key} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-white/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <item.icon size={15} className={item.color} />
                                            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">{item.label}</span>
                                        </div>
                                        <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">₹{val > 0 ? Number(val).toLocaleString() : '0'}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-white/10 flex items-center justify-center gap-6">
                            <div className="flex items-center gap-1.5"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Per Head:</span><span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">₹{Math.round(stats.head)}</span></div>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                            <div className="flex items-center gap-1.5"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Shared:</span><span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">₹{Math.round(stats.shared)}</span></div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        {/* Section Header */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20"><Users size={16} /></div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50">Monthly Invoice</h3>
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                                {allMembers.length} Members
                            </span>
                        </div>

                        {/* Member Dropdown Selector */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                                <UserRound size={16} className="text-indigo-500" />
                            </div>
                            <select
                                value={selectedMemberId}
                                onChange={e => setSelectedMemberId(e.target.value)}
                                className="w-full pl-10 pr-10 py-3.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl text-sm font-extrabold text-slate-700 dark:text-slate-200 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500"
                            >
                                <option value="" className="font-bold text-slate-400">— Select a member to view invoice —</option>
                                <option value="__all__">📋 All Members — Audit View</option>
                                {allMembers.map(m => {
                                    const mid = m._id || m.memberId;
                                    const statusEmoji = m.paymentStatus === 'clear' ? '✅' : m.paymentStatus === 'partial' ? '🟡' : '🔴';
                                    return (
                                        <option key={mid} value={mid} className="font-bold">
                                            {statusEmoji} {m.memberName}
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <ChevronDown size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                        </div>

                        {/* All Members Audit View / Single Member Card / Empty State */}
                        {selectedMemberId === '__all__' ? (
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                                {/* Audit Header */}
                                <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className="text-indigo-500" />
                                        <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Audit Sheet — {monthStr}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"/>Meal</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Shared</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"/>Contrib</span>
                                    </div>
                                </div>

                                {/* Audit Rows */}
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {allMembers.map((m, idx) => {
                                        const offM = (data?.sharedExpense?.memberBalances || []).find(mb => mb.memberId === (m._id || m.memberId)) || {};
                                        const chargedRegMeals = m.chargedMeals || Math.max(stats.minLimit, Number(m.regularMeals) || 0);
                                        const lMCost = chargedRegMeals * stats.rate;
                                        const lGCost = (Number(m.guestMeals) || 0) * stats.rate;
                                        const totalContrib = Object.values(m.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0);
                                        const dMCost = Number(offM.mealCost ?? lMCost) || 0;
                                        const dGCost = Number(offM.guestMealCost ?? offM.guestCost ?? lGCost) || 0;
                                        const finalContrib = Number(offM.totalContribution ?? totalContrib);
                                        const rawOffBal = Number(offM.balance) || 0;
                                        const signedOffBal = offM.type === 'Get' ? -rawOffBal : rawOffBal;
                                        const dBal = signedOffBal || ((dMCost + dGCost + Number(stats.head)) - finalContrib);
                                        const rem = Math.round(dBal) - (Number(m.submittedAmount) || 0);
                                        const isGet = rem < 0;
                                        const isSettled = rem === 0;

                                        const CAT_META = [
                                            { k: 'market',    l: 'Market',   color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20' },
                                            { k: 'deposit',   l: 'Deposit',  color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
                                            { k: 'gas',       l: 'Gas',      color: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20' },
                                            { k: 'wifi',      l: 'WiFi',     color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' },
                                            { k: 'electric',  l: 'Electric', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20' },
                                            { k: 'spices',    l: 'Spices',   color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' },
                                            { k: 'rice',      l: 'Rice',     color: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20' },
                                            { k: 'paper',     l: 'Paper',    color: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-400/20' },
                                            { k: 'didi',      l: 'Didi',     color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' },
                                            { k: 'houseRent', l: 'Rent',     color: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20' },
                                            { k: 'fund',      l: 'Fund',     color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20' },
                                            { k: 'others',    l: 'Others',   color: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-400/20' },
                                        ];
                                        const activeCats = CAT_META.filter(c => Number(m.expenses?.[c.k]) > 0);

                                        return (
                                            <div key={m._id || m.memberId} className={cn(
                                                "px-4 sm:px-5 py-3.5 flex flex-col gap-2.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]",
                                                idx % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-white/[0.01]'
                                            )}>
                                                {/* Row 1: Index + Name + Formula + Status */}
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                    {/* Index + Name */}
                                                    <div className="flex items-center gap-2.5 min-w-[170px]">
                                                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 w-4 text-right tabular-nums">{idx + 1}.</span>
                                                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                                            {(m.memberName || '?').charAt(0)}
                                                        </div>
                                                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">{m.memberName}</span>
                                                    </div>

                                                    {/* Formula */}
                                                    <div className="flex-1 flex flex-wrap items-center gap-1 font-mono text-[11px] leading-none pl-9 sm:pl-0">
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{chargedRegMeals}</span>
                                                        <span className="text-slate-300 dark:text-slate-600">×</span>
                                                        <span className="text-indigo-500 dark:text-indigo-300 font-bold">{stats.rate.toFixed(2)}</span>
                                                        <span className="text-slate-400 font-bold">+</span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{Math.round(stats.head)}</span>
                                                        {dGCost > 0 && (
                                                            <>
                                                                <span className="text-slate-400 font-bold">+</span>
                                                                <span className="text-amber-600 dark:text-amber-400 font-extrabold">{Math.round(dGCost)}</span>
                                                            </>
                                                        )}
                                                        <span className="text-slate-400 font-bold">−</span>
                                                        <span className="text-rose-600 dark:text-rose-400 font-extrabold">{Math.round(finalContrib)}</span>
                                                        <span className="text-slate-300 dark:text-slate-600">=</span>
                                                        <span className={cn(
                                                            "font-black text-sm",
                                                            isGet ? 'text-emerald-600 dark:text-emerald-400' : isSettled ? 'text-slate-400' : 'text-rose-600 dark:text-rose-400'
                                                        )}>₹{Math.abs(rem)}</span>
                                                    </div>

                                                    {/* Status pill */}
                                                    <div className="pl-9 sm:pl-0 shrink-0">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border",
                                                            isGet ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                                                            isSettled ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/10' :
                                                            'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                                                        )}>
                                                            {isGet ? <TrendingUp size={9}/> : isSettled ? <CheckCircle2 size={9}/> : <TrendingDown size={9}/>}
                                                            {isGet ? 'Get' : isSettled ? 'Clear' : 'Pay'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Row 2: Per-category contribution pills */}
                                                {activeCats.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5 pl-9 sm:pl-[2.75rem]">
                                                        {activeCats.map(cat => (
                                                            <span key={cat.k} className={cn(
                                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider",
                                                                cat.color
                                                            )}>
                                                                {cat.l}: ₹{Number(m.expenses[cat.k]).toLocaleString()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="pl-9 sm:pl-[2.75rem]">
                                                        <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider italic">No contributions recorded</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Audit Footer */}
                                <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-white/5 flex items-center gap-4 flex-wrap">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rate: <span className="text-indigo-500">₹{stats.rate.toFixed(2)}/meal</span></span>
                                    <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Per Head: <span className="text-emerald-500">₹{Math.round(stats.head)}</span></span>
                                    <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Min Meals: <span className="text-amber-500">{stats.minLimit}</span></span>
                                </div>
                            </div>
                        ) : selectedMember ? (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <MemberCard
                                    key={selectedMember._id || selectedMember.memberId}
                                    m={selectedMember}
                                    offM={(data?.sharedExpense?.memberBalances || []).find(mb => mb.memberId === (selectedMember._id || selectedMember.memberId)) || {}}
                                    dRate={stats.rate} dHead={stats.head} dMinLimit={stats.minLimit}
                                    setEditingMember={setEditingMember} mCount={stats.mCount}
                                    bills={data?.sharedExpense?.bills || data?.liveBills}
                                    categoryProviders={categoryProviders}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-14 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-dashed border-slate-200 dark:border-white/10 rounded-2xl gap-3 text-slate-400">
                                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <Users size={28} className="text-indigo-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-extrabold text-slate-600 dark:text-slate-300 tracking-tight">No member selected</p>
                                    <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Pick a member from the dropdown above</p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {editingMember && <PaymentModal member={editingMember} month={monthStr} onClose={() => setEditingMember(null)} onSaved={handlePaymentSaved} />}
        </div>
    );
};

export default MonthlySummary;


