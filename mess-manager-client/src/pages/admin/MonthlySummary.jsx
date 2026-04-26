import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, X, Save, Crown,
    CheckCircle2, Clock, AlertCircle, Users,
    ShoppingBag, Wifi, Zap, Utensils, Flame,
    Coffee, FileText, Loader2, RefreshCw, Search, Newspaper, UserRound, Calculator, TrendingUp, TrendingDown,
    Calendar, ChevronLeft, ChevronRight, ChevronDown, Coins, Activity, Shield, PlusCircle
} from 'lucide-react';

const HomeIcon = ({ size = 18, className }) => (
    <img src="/icons/home.png" alt="Home" className={cn("object-contain", className)} style={{ width: size, height: size }} />
);
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';

// ─── Month/year helpers ─────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    clear: {
        label: 'Clear',
        icon: CheckCircle2,
        cls: 'bg-emerald-300/40 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20',
    },
    partial: {
        label: 'Partial',
        icon: AlertCircle,
        cls: 'bg-amber-300/40 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/20',
    },
    pending: {
        label: 'Pending',
        icon: Clock,
        cls: 'bg-rose-300/40 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/20',
    },
};

const StatusBadge = ({ status, onClick }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon || AlertCircle;
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
        <div className={cn(
            "rb-card p-4 sm:p-6 transition-all group relative overflow-hidden",
            m.paymentStatus === 'clear' ? 'rb-shadow-emerald' : m.paymentStatus === 'partial' ? 'rb-shadow-orange' : 'rb-shadow-rose'
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600 dark:bg-primary-500/80 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary-500/20">{(m.memberName || '?').charAt(0)}</div>
                    <div>
                    <div className="text-base rb-header !normal-case mb-1">{m.memberName}</div>
                        <div className="flex flex-col gap-1">
                            <div className="flex text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest items-center gap-1.5 leading-none">
                                <Calendar size={10} /> {m.marketDays || 0} Market Days
                                {m.marketDates?.length > 0 && (
                                    <span className="text-[8px] opacity-60 normal-case font-mono">({m.marketDates.map(d => d.split('-')[2]).join(', ')})</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <StatusBadge status={m.paymentStatus} onClick={() => setEditingMember({ ...m, finalBalance: Math.round(dBal), snapshotType: offM.type || (dBal > 0 ? 'Pay' : 'Get') })} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-indigo-300/40 dark:bg-black/40 border border-indigo-300/30 dark:border-indigo-500/10 rounded-2xl">
                    <div className="text-[8px] font-black text-indigo-400 mb-0.5 uppercase tracking-widest">Meal Cost</div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[11px] font-black text-indigo-500/60 leading-none">{chargedRegMeals} × {dRate.toFixed(2)}</span>
                        <div className="text-base font-black text-indigo-700 dark:text-indigo-300 leading-none">₹{Math.round(dMCost)}</div>
                    </div>
                </div>
                <div className="p-3 bg-amber-300/40 dark:bg-black/40 border border-amber-300/30 dark:border-amber-500/10 rounded-2xl"><div className="text-[8px] font-black text-amber-500 mb-0.5 uppercase tracking-widest">Guest</div><div className="text-base font-black text-amber-700 dark:text-amber-400">₹{Math.round(dGCost)}</div></div>
                <div className="p-3 bg-emerald-300/40 dark:bg-black/40 border border-emerald-300/30 dark:border-emerald-500/10 rounded-2xl"><div className="text-[8px] font-black text-emerald-500 mb-0.5 uppercase tracking-widest">Shared Cost</div><div className="text-base font-black text-emerald-700 dark:text-emerald-300">₹{Math.round(dHead)}</div></div>
                <div className={cn(
                    "p-3 rounded-2xl border transition-all",
                    rem > 0 ? "bg-rose-300/40 dark:bg-black/40 border-rose-300/30 dark:border-rose-500/10" :
                        rem < 0 ? "bg-emerald-300/40 dark:bg-black/40 border-emerald-300/30 dark:border-emerald-500/10" :
                            "bg-indigo-300/40 dark:bg-black/40 border-indigo-300/30 dark:border-white/5"
                )}>
                    <div className={cn(
                        "text-[8px] font-black uppercase mb-0.5 tracking-widest",
                        rem > 0 ? "text-rose-400" : rem < 0 ? "text-emerald-400" : "text-slate-400"
                    )}>Balance</div>
                    <div className={cn(
                        "text-base font-black",
                        rem > 0 ? "text-rose-600" : rem < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    )}>₹{rem === 0 ? '0' : Math.abs(rem)}</div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-y-3 py-3 border-t border-indigo-300/30 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <div className="relative group/meal">
                        <div className={cn(
                            "px-2 py-1 border rounded-lg flex items-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-tight",
                            isMinApplied
                                ? "bg-rose-300/40 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
                                : "bg-indigo-300/40 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-300"
                        )}>
                            <ClipboardList size={10} className={isMinApplied ? "text-rose-500" : "text-indigo-500"} />
                            <span>{m.regularMeals} REG</span>
                        </div>

                        {isMinApplied && (
                            <div className="absolute -top-2.5 -right-2.5 bg-rose-600 text-white text-[8px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-indigo-300/30 dark:border-slate-900 shadow-lg shadow-rose-500/30 scale-110">
                                {dMinLimit}+
                            </div>
                        )}
                    </div>

                    <div className="px-2 py-1 bg-amber-300/40 dark:bg-amber-500/10 border border-amber-300/30 dark:border-amber-500/20 rounded-lg flex items-center gap-1.5">
                        <Users size={10} className="text-amber-500" />
                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-tight">{m.guestMeals} GUEST</span>
                    </div>
                    <div className="flex items-center gap-1.5"><TrendingUp size={12} className="text-emerald-500" /> <span className="opacity-70 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Audit Ready</span></div>
                </div>
            </div>
            {/* Your Contributions Grid (Necessary Items) */}
            <div className="mt-4 pt-4 border-t border-indigo-300/30 dark:border-white/5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Your Contributions</p>
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
                                        ? "bg-indigo-300/40 dark:bg-black/40 border-indigo-300/30 dark:border-white/10 shadow-sm"
                                        : "bg-indigo-300/20 dark:bg-white/[0.02] border-transparent opacity-40"
                                )}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <cat.i size={10} className={cn(
                                            cat.c === 'indigo' && "text-indigo-500",
                                            cat.c === 'emerald' && "text-emerald-500",
                                            cat.c === 'amber' && "text-amber-500",
                                            cat.c === 'blue' && "text-blue-500",
                                            cat.c === 'rose' && "text-rose-500"
                                        )} />
                                        <span className="text-[7px] font-black uppercase tracking-tighter text-slate-400">{cat.l}</span>
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900 dark:text-slate-100 leading-none">₹{val}</div>
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* Summary Footer (The Math Behind the Balance) */}
            <div className="mt-4 pt-4 border-t-2 border-indigo-300/30 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-3 flex-grow max-w-[240px]">
                    <div className="flex items-center justify-between group/exp hover:translate-x-1 transition-transform">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider whitespace-nowrap">Total Expenses</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-rose-600 dark:text-rose-400">₹{Math.round(dMCost + dGCost + dHead)}</span>
                            <span className="text-[8px] text-slate-400 font-bold opacity-50">({Math.round(dMCost)}+{Math.round(dGCost)}+{Math.round(dHead)})</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between group/con hover:translate-x-1 transition-transform">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider whitespace-nowrap">Total Contribution</span>
                        </div>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{Math.round(effectiveContribution)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-indigo-300/40 dark:bg-black/40 p-2 rounded-2xl border border-indigo-300/30 dark:border-white/5 shadow-sm transition-all hover:scale-105">
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            {rem > 0 ? 'Payable Balance' : rem < 0 ? 'Receivable Balance' : 'Clear Status'}
                        </span>
                        <span className={cn(
                            "text-lg font-black leading-none",
                            rem > 0 ? "text-rose-600" : rem < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                        )}>₹{Math.abs(rem)}</span>
                    </div>
                    <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform",
                        rem > 0 ? "bg-rose-500 shadow-rose-500/20" : rem < 0 ? "bg-emerald-500 shadow-emerald-500/20" : "bg-indigo-300/40 dark:bg-slate-700 shadow-none"
                    )}>
                        {rem > 0 ? <TrendingDown size={16} className="text-white" /> : rem < 0 ? <TrendingUp size={16} className="text-white" /> : <CheckCircle2 size={16} className="text-slate-500" />}
                    </div>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    // Optimized comparison to avoid expensive JSON.stringify
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/80 backdrop-blur-sm px-4" onClick={onClose}>
            <div className="bg-indigo-300/40 dark:bg-slate-900 border border-indigo-400/30 dark:border-white/10 rounded-[1.5rem] p-5 md:p-8 w-full max-w-md shadow-3xl shadow-indigo-900/50 relative overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Update Payment</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{member.memberName}</span>
                            <span className="px-1.5 py-0.5 rounded-lg bg-emerald-300/40 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wide border border-emerald-300/30 dark:border-emerald-500/20">Gen: ₹{Math.round(member.expenses?.deposit || 0)}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-indigo-400/40 dark:hover:bg-white/10 rounded-xl transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6 scrollbar-hide">
                    <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest ${member.snapshotType === 'Get' ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'} mb-1 block`}>{member.snapshotType === 'Get' ? 'Amount to Return (₹)' : 'Amount to Pay (₹)'}</label>
                        <input type="number" value={depositBalance === '0' ? '' : depositBalance} onChange={e => setDepositBalance(e.target.value.replace(/^0+(?!$)/, ''))} className="w-full px-4 py-2.5 bg-indigo-300/40 dark:bg-black/40 border border-indigo-300/30 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Payment Date</label>
                        <input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} className="w-full px-4 py-2.5 bg-indigo-300/40 dark:bg-black/40 border border-indigo-300/30 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none" />
                    </div>
                    <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest ${member.snapshotType === 'Get' ? 'text-emerald-500' : 'text-blue-500'} mb-1 block`}>{member.snapshotType === 'Get' ? 'Total Returned (₹)' : 'Total Paid (₹)'}</label>
                        <input type="number" value={submittedAmount === '0' ? '' : submittedAmount} onChange={e => setSubmittedAmount(e.target.value.replace(/^0+(?!$)/, ''))} className={`w-full px-4 py-2.5 border rounded-xl text-sm font-bold outline-none transition-all ${member.snapshotType === 'Get' ? 'bg-emerald-300/40 dark:bg-emerald-500/10 border-emerald-300/30 dark:border-emerald-500/20' : 'bg-blue-300/40 dark:bg-blue-500/10 border-blue-300/30 dark:border-blue-500/20'}`} />
                    </div>
                    {balance > 0 && <div className={`px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 ${autoStatus === 'clear' ? 'bg-emerald-300/40 dark:bg-emerald-500/10 text-emerald-700' : autoStatus === 'partial' ? 'bg-amber-300/40 dark:bg-amber-500/10 text-amber-700' : 'bg-rose-300/40 dark:bg-rose-500/10 text-rose-700'}`}>{autoStatus === 'clear' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}{autoStatus === 'clear' ? 'Balanced' : `₹${remaining} Pending`}</div>}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Status Override</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <button key={key} onClick={() => setStatus(key)} className={`p-2 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${status === key ? cfg.cls + ' border-current' : 'border-indigo-300/30 dark:border-slate-800 text-slate-400'}`}>{cfg.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-6 pt-5 border-t border-indigo-300/30 dark:border-white/10 flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-indigo-300/30 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs hover:bg-rose-300/40 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-black text-xs disabled:opacity-60 shadow-lg shadow-primary-500/20">{saving ? 'Saving...' : 'Save Changes'}</button>
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
    const [searchQuery, setSearchQuery] = useState('');

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

        if (data.sharedExpense) {
            return {
                rate: offR.mealCharge || 0,
                head: offR.perHeadAmount || 0,
                shared: offR.totalSharedAmount || 0,
                mkt: offI.totalMarket || 0,
                rice: offI.rice || 0,
                gstM: offI.guest || 0,
                totalM: offI.totalMeal || 0,
                mCount,
                minLimit
            };
        }

        // RESTRICTED MODE: If no finalized sharedExpense is found, show zero/null stats
        return { 
            rate: 0, head: 0, shared: 0, mkt: 0, rice: 0, gstM: 0, totalM: 0, 
            mCount, 
            minLimit: minLimit 
        };
    }, [data]);

    const categoryProviders = useMemo(() => {
        if (!data || !data.members) return {};
        const allCategories = ['gas', 'wifi', 'electric', 'paper', 'didi', 'houseRent', 'spices', 'others', 'market', 'rice', 'deposit'];
        const providers = {};
        allCategories.forEach(cat => {
            const payers = data.members
                .filter(m => m.expenses && (Number(m.expenses[cat]) || 0) > 0)
                .map(m => ({ id: m.memberId || m._id, name: m.memberName, amount: Number(m.expenses[cat]) }));
            if (payers.length > 0) providers[cat] = payers;
        });
        return providers;
    }, [data]);

    const filteredMembers = useMemo(() => {
        if (!data || !data.members) return [];
        const mems = data.members || [];
        return searchQuery.trim() ? mems.filter(m => m.memberName?.toLowerCase().includes(searchQuery.toLowerCase())) : mems;
    }, [data, searchQuery]);

    const counts = useMemo(() => {
        const mems = data?.members || [];
        return {
            clear: mems.filter(m => m.paymentStatus === 'clear').length,
            pending: mems.filter(m => m.paymentStatus === 'pending').length,
            partial: mems.filter(m => m.paymentStatus === 'partial').length
        };
    }, [data]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/20"><ClipboardList className="text-white" size={24} /></div>
                    <div>
                        <h1 className="text-xl sm:text-2xl rb-header">Summary Dashboard</h1>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 leading-none">Trace for {monthStr}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchSummary} className="p-3 bg-indigo-300/40 dark:bg-slate-900 border border-indigo-300/30 dark:border-white/10 rounded-2xl text-indigo-500 shadow-sm active:scale-95 transition-all hover:rotate-180"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={36} className="animate-spin mb-4 text-primary-500" />
                    <p className="font-bold text-sm tracking-tight uppercase">Syncing Database...</p>
                </div>
            ) : error ? (
                <div className="p-8 rounded-[1.5rem] bg-rose-300/40 dark:bg-rose-950/20 text-center flex flex-col items-center gap-4 border border-rose-300 dark:border-rose-900/30">
                    <AlertCircle className="text-rose-500" size={32} />
                    <h3 className="font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Sync Failed</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{error}</p>
                </div>
            ) : data && (
                <>
                    {!data.sharedExpense && (
                        <div className="mb-2">
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-rose-500 rounded-lg"><AlertCircle size={14} className="text-white" /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Summary Not Finalized</p>
                                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-tighter uppercase">Trace restricted to finalized records only.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                                        No Record
                                    </div>
                                </div>
                            </div>
                        )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                        {[
                            { label: 'Cleared Accounts', val: counts.clear, icon: CheckCircle2, color: 'emerald', bg: 'bg-emerald-300/40', border: 'border-emerald-300/20', text: 'text-emerald-700' },
                            { label: 'Pending Payments', val: counts.pending, icon: Clock, color: 'rose', bg: 'bg-rose-300/40', border: 'border-rose-300/20', text: 'text-rose-700' },
                            { label: 'Partial Payments', val: counts.partial, icon: Activity, color: 'amber', bg: 'bg-amber-300/40', border: 'border-amber-300/20', text: 'text-amber-700' }
                        ].map((card, i) => (
                            <div key={i} className={cn("rb-card p-4 flex items-center justify-between", card.bg === 'bg-emerald-500/10' ? 'rb-shadow-emerald' : card.label.includes('Pending') ? 'rb-shadow-rose' : 'rb-shadow-orange')}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-xl text-white shadow-lg", i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-rose-500' : 'bg-amber-500')}>
                                        <card.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">{card.label}</p>
                                        <p className={cn("text-xl rb-header !normal-case mt-1", card.text)}>{card.val}</p>
                                    </div>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Members</div>
                            </div>
                        ))}
                    </div>

                    <Card className="p-0 overflow-hidden rb-card rb-shadow-emerald mt-4">
                        <div className="p-4 sm:p-5 border-b border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-black/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-300/40 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl shadow-inner"><Coins size={18} /></div>
                                <div><h2 className="text-[11px] sm:text-xs rb-header opacity-70">Financial Audit Trace</h2></div>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-indigo-300/40 dark:bg-black/60 px-2 py-1 rounded border border-indigo-300 dark:border-white/10">Min {stats.minLimit} Meals</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 divide-x divide-indigo-300/30 dark:divide-white/5">
                            {[
                                { label: 'Total Market', val: stats.mkt > 0 ? `₹${stats.mkt.toLocaleString()}` : '₹00', color: 'text-blue-600' },
                                { label: 'Rice Cost', val: stats.rice > 0 ? `₹${stats.rice.toLocaleString()}` : '₹00', color: 'text-amber-600' },
                                { label: 'Guest Meals', val: stats.gstM > 0 ? stats.gstM : '00', color: 'text-rose-600' },
                                { label: 'Total Meals', val: stats.totalM > 0 ? stats.totalM : '00', color: 'text-indigo-600' },
                                { label: 'Meal Cost', val: stats.rate > 0 ? `₹${Number(stats.rate).toFixed(2)}` : '₹00', color: 'text-emerald-600' }
                            ].map((stat, i) => (
                                <div key={i} className="p-4 sm:p-6 text-center hover:bg-indigo-300/40 dark:hover:bg-white/5 transition-colors">
                                    <div className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-1">{stat.label}</div>
                                    <div className={`text-xl rb-header !normal-case ${stat.color}`}>{stat.val}</div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden rb-card rb-shadow-indigo mt-8">
                        <div className="p-4 sm:p-5 border-b border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-black/30 flex items-center justify-between">
                            <div className="flex items-center gap-3"><div className="p-2 bg-indigo-300/40 dark:bg-white/5 text-slate-500 rounded-lg"><HomeIcon size={18} /></div><h2 className="text-[11px] sm:text-xs rb-header opacity-70">Fixed Operational Bills</h2></div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6">
                            {['gas', 'wifi', 'electric', 'paper', 'didi', 'houseRent', 'spices', 'others'].map(key => {
                                const val = (data?.sharedExpense?.bills || {})[key] || 0;
                                const config = {
                                    wifi: { icon: Wifi, label: 'WiFi', color: 'text-blue-500' },
                                    electric: { icon: Zap, label: 'Electric', color: 'text-yellow-600' },
                                    gas: { icon: Flame, label: 'Gas', color: 'text-rose-500' },
                                    paper: { icon: Newspaper, label: 'Paper', color: 'text-orange-500' },
                                    didi: { icon: UserRound, label: 'Didi', color: 'text-purple-500' },
                                    houseRent: { icon: HomeIcon, label: 'House Rent', color: 'text-indigo-500' },
                                    spices: { icon: Coffee, label: 'Spices', color: 'text-amber-600' },
                                    others: { icon: FileText, label: 'Others', color: 'text-slate-500' }
                                };
                                const item = config[key];
                                return (
                                    <div key={key} className="bg-indigo-300/40 dark:bg-black/40 p-4 rounded-2xl border border-indigo-300/30 dark:border-white/10 group hover:shadow-lg transition-all">
                                        <div className="flex items-center justify-between mb-1"><item.icon size={16} className={item.color} /><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</span></div>
                                        <div className="text-lg rb-header !normal-case opacity-80 group-hover:opacity-100">₹{val > 0 ? Number(val).toLocaleString() : '00'}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 bg-indigo-300/40 dark:bg-black/40 border-t border-indigo-300/30 dark:border-white/10 flex items-center justify-center gap-8">
                            <div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per Head:</span><span className="text-base font-black text-emerald-600">₹{Math.round(stats.head)}</span></div>
                            <div className="w-px h-6 bg-indigo-400/30" /><div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Shared:</span><span className="text-base font-black text-indigo-600">₹{Math.round(stats.shared)}</span></div>
                        </div>
                    </Card>

                    <div className="mt-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-300/40 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><Users size={18} /></div>
                                <h3 className="text-lg rb-header">Monthly Invoice List</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {filteredMembers.map(m => {
                                const offM = (data?.sharedExpense?.memberBalances || []).find(mb => mb.memberId === (m._id || m.memberId)) || {};
                                return (
                                    <MemberCard 
                                        key={m._id || m.memberId} 
                                        m={m} offM={offM} 
                                        dRate={stats.rate} dHead={stats.head} dMinLimit={stats.minLimit} 
                                        setEditingMember={setEditingMember} mCount={stats.mCount}
                                        bills={data?.sharedExpense?.bills || data?.liveBills}
                                        categoryProviders={categoryProviders}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {editingMember && <PaymentModal member={editingMember} month={monthStr} onClose={() => setEditingMember(null)} onSaved={handlePaymentSaved} />}
        </div>
    );
};

export default MonthlySummary;


