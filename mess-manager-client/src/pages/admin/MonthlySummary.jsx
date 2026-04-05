import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, X, Save, Crown,
    CheckCircle2, Clock, AlertCircle, Users,
    ShoppingBag, Wifi, Zap, Utensils, Flame,
    Coffee, FileText, Loader2, RefreshCw, Search, Home, Newspaper, UserRound, Calculator, TrendingUp,
    Calendar, ChevronLeft, ChevronRight, ChevronDown, Coins, Activity, Shield
} from 'lucide-react';
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
        cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    },
    partial: {
        label: 'Partial',
        icon: AlertCircle,
        cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    },
    pending: {
        label: 'Pending',
        icon: Clock,
        cls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-5 md:p-8 w-full max-w-md shadow-3xl shadow-black relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Update Payment</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{member.memberName}</span>
                            <span className="px-1.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wide border border-emerald-200 dark:border-emerald-500/20">Gen: ₹{Math.round(member.expenses?.deposit || 0)}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"><X size={18} className="text-slate-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6 scrollbar-hide">
                    <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest ${member.snapshotType === 'Get' ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'} mb-1 block`}>{member.snapshotType === 'Get' ? 'Amount to Return (₹)' : 'Amount to Pay (₹)'}</label>
                        <input type="number" value={depositBalance === '0' ? '' : depositBalance} onChange={e => setDepositBalance(e.target.value.replace(/^0+(?!$)/, ''))} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Payment Date</label>
                        <input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none" />
                    </div>
                    <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest ${member.snapshotType === 'Get' ? 'text-emerald-500' : 'text-blue-500'} mb-1 block`}>{member.snapshotType === 'Get' ? 'Total Returned (₹)' : 'Total Paid (₹)'}</label>
                        <input type="number" value={submittedAmount === '0' ? '' : submittedAmount} onChange={e => setSubmittedAmount(e.target.value.replace(/^0+(?!$)/, ''))} className={`w-full px-4 py-2.5 border rounded-xl text-sm font-bold outline-none transition-all ${member.snapshotType === 'Get' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'}`} />
                    </div>
                    {balance > 0 && <div className={`px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 ${autoStatus === 'clear' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : autoStatus === 'partial' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'}`}>{autoStatus === 'clear' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}{autoStatus === 'clear' ? 'Balanced' : `₹${remaining} Pending`}</div>}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Status Override</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <button key={key} onClick={() => setStatus(key)} className={`p-2 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${status === key ? cfg.cls + ' border-current' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>{cfg.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-white/10 flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white font-black text-xs disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const MonthlySummary = () => {
    const { globalMonth } = useData();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sharedExpenses, setSharedExpenses] = useState({ paper: 0, didi: 0, houseRent: 0, gas: 0, wifi: 0, electric: 0, spices: 0, others: 0 });

    const monthStr = useMemo(() => globalMonth || new Date().toISOString().slice(0, 7), [globalMonth]);

    const fetchSummary = useCallback(async () => {
        if (!monthStr) return;
        setLoading(true);
        setError(null);
        try {
            const summaryRes = await api.get(`/summary/${monthStr}`);
            setData(summaryRes.data || {});
            const snapshot = summaryRes.data?.sharedExpense || {};
            if (snapshot.bills) {
                setSharedExpenses({ ...snapshot.bills });
            } else if (summaryRes.data?.liveBills) {
                setSharedExpenses({ ...summaryRes.data.liveBills });
            }
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
                members: (prev.members || []).map(m => m.memberId === updatedMember.memberId ? { ...m, ...updatedMember } : m)
            };
        });
    };

    const filteredMembers = useMemo(() => {
        if (!data || !data.members) return [];
        const members = data.members || [];
        return searchQuery.trim() ? members.filter(m => m.memberName?.toLowerCase().includes(searchQuery.toLowerCase())) : members;
    }, [data, searchQuery]);

    // Titanium Shield Calculation Engine - Updated with Minimum Meal Policy
    const stats = useMemo(() => {
        if (!data) return { mkt: 0, rice: 0, shared: 0, regM: 0, gstM: 0, totalM: 0, rate: 0, head: 0, mCount: 1, minLimit: 40 };

        const lb = (data.liveBills || {});
        const members = (data.members || []);
        const mCount = members.length || 1;
        const minLimit = Number(data.minMealsLimit) || 40;

        const mkt = Number(lb.market) || 0;
        const rice = Number(lb.rice) || 0;
        const shared = Object.entries(lb)
            .filter(([k]) => k !== 'market' && k !== 'deposit')
            .reduce((sum, [, val]) => sum + (Number(val) || 0), 0);

        const regM = members.reduce((sum, m) => sum + (Number(m.regularMeals) || 0), 0);
        const gstM = members.reduce((sum, m) => sum + (Number(m.guestMeals) || 0), 0);
        const totalM = regM + gstM;
        const rate = totalM > 0 ? mkt / totalM : 0;
        const head = shared / mCount;

        return { mkt, rice, shared, regM, gstM, totalM, rate, head, mCount, minLimit };
    }, [data]);

    const offI = data?.sharedExpense?.mealInputs || {};
    const offR = data?.sharedExpense?.results || {};

    const dMkt = offI.totalMarket ?? stats.mkt;
    const dRice = offI.rice ?? stats.rice;
    const dGst = offI.guest ?? stats.gstM;
    const dTot = offI.totalMeal ?? stats.totalM;
    const dRate = offR.mealCharge ?? offR.mealRate ?? stats.rate;
    const dHead = offR.perHeadAmount ?? stats.head;
    const dMinLimit = stats.minLimit;

    const counts = useMemo(() => {
        const mems = data?.members || [];
        return {
            clear: mems.filter(m => m.paymentStatus === 'clear').length,
            pending: mems.filter(m => m.paymentStatus === 'pending').length,
            partial: mems.filter(m => m.paymentStatus === 'partial').length
        };
    }, [data]);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/20"><ClipboardList className="text-white" size={24} /></div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Summary Dashboard</h1>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 leading-none">Trace for {monthStr}</p>
                    </div>
                </div>
                <button onClick={fetchSummary} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 shadow-sm active:scale-95 transition-all hover:rotate-180"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={36} className="animate-spin mb-4 text-primary-500" />
                    <p className="font-bold text-sm tracking-tight uppercase">Syncing Database...</p>
                </div>
            )}

            {error && !loading && (
                <div className="p-8 rounded-[2rem] bg-rose-50 dark:bg-rose-950/20 text-center flex flex-col items-center gap-4 border border-rose-200 dark:border-rose-900/30">
                    <AlertCircle className="text-rose-500" size={32} />
                    <h3 className="font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Sync Failed</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{error}</p>
                </div>
            )}

            {!loading && !error && data && (
                <>
                    <AnimatePresence>
                        {!data.sharedExpense && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-2"
                            >
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-amber-500 rounded-lg"><AlertCircle size={14} className="text-white" /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">Live Calculation Mode</p>
                                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-tighter uppercase">Data not finalized. Current trace reflects live database records.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest animate-pulse">
                                        Draft Trace
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="p-0 overflow-hidden border-emerald-200/50 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                            <div className="p-4 sm:p-5 border-b border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-black/30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-inner"><Coins size={18} /></div>
                                    <div>
                                        <h2 className="text-[11px] sm:text-xs font-black text-slate-700 dark:text-emerald-200 uppercase tracking-tight">Financial Audit Trace</h2>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {data.sharedExpense ? (
                                                <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase"><CheckCircle2 size={10} /> Finalized Snapshot</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase"><RefreshCw size={10} className="animate-spin" /> Live Syncing...</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-emerald-50 dark:bg-black/60 px-2 py-1 rounded border border-emerald-100 dark:border-white/10">Policy: Min {dMinLimit} Meals</span>
                                    <Activity size={12} className="text-emerald-400 animate-pulse" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-0 divide-x divide-slate-100 dark:divide-white/5">
                                {[
                                    { label: 'Total Market', val: `₹${dMkt}`, color: 'text-blue-600 dark:text-blue-400' },
                                    { label: 'Rice Cost', val: `₹${dRice}`, color: 'text-amber-600 dark:text-amber-400' },
                                    { label: 'Guest Meals', val: dGst, color: 'text-rose-600 dark:text-rose-400' },
                                    { label: 'Total Meals', val: dTot, color: 'text-indigo-600 dark:text-indigo-400' },
                                    { label: 'Meal Cost', val: `₹${Number(dRate || 0).toFixed(2)}`, color: 'text-emerald-600 dark:text-emerald-400' },
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 sm:p-6 text-center hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <div className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">{stat.label}</div>
                                        <div className={`text-xl sm:text-2xl font-black ${stat.color} tracking-tight`}>{stat.val}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/10 flex items-center justify-center gap-8">
                                <div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per Head:</span><span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{Math.round(dHead)}</span></div>
                                <div className="w-px h-6 bg-slate-200 dark:bg-white/10" /><div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Shared:</span><span className="text-base font-black text-indigo-600 dark:text-indigo-400">₹{Math.round(dHead * stats.mCount)}</span></div>
                            </div>
                        </Card>
                    </motion.div>

                    <Card className="p-0 overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
                        <div className="p-4 sm:p-5 border-b border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-black/30 flex items-center justify-between">
                            <div className="flex items-center gap-3"><div className="p-2 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-lg"><ShoppingBag size={18} /></div><h2 className="text-[11px] sm:text-xs font-black text-slate-700 dark:text-slate-100 uppercase tracking-tight">Fixed Operational Bills</h2></div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6">
                            {[
                                { id: 'wifi', icon: Wifi, label: 'WiFi', val: sharedExpenses.wifi, color: 'text-blue-500' },
                                { id: 'elec', icon: Zap, label: 'Electric', val: sharedExpenses.electric, color: 'text-yellow-600' },
                                { id: 'gas', icon: Flame, label: 'Gas', val: sharedExpenses.gas, color: 'text-rose-500' },
                                { id: 'paper', icon: Newspaper, label: 'Paper', val: sharedExpenses.paper, color: 'text-orange-500' },
                                { id: 'didi', icon: UserRound, label: 'Didi', val: sharedExpenses.didi, color: 'text-pink-500' },
                                { id: 'rent', icon: Home, label: 'Rent', val: sharedExpenses.houseRent, color: 'text-violet-500' },
                                { id: 'spice', icon: Coffee, label: 'Spices', val: sharedExpenses.spices, color: 'text-amber-600' },
                                { id: 'other', icon: FileText, label: 'Others', val: sharedExpenses.others, color: 'text-slate-500' },
                            ].map(item => (
                                <div key={item.id} className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center justify-between mb-1"><item.icon size={16} className={item.color} /><span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{item.label}</span></div>
                                    <div className={`text-xl font-black ${item.color}`}>₹{item.val || 0}</div>
                                    <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 opacity-80">₹{Math.round((item.val || 0) / stats.mCount)}/head</div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { label: 'Cleared', v: counts.clear, c: 'text-emerald-600 dark:text-emerald-400', i: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-500/10', b: 'border-emerald-200 dark:border-emerald-500/20' },
                            { label: 'Pending', v: counts.pending, c: 'text-rose-600 dark:text-rose-400', i: Clock, bg: 'bg-rose-50 dark:bg-rose-500/10', b: 'border-rose-200 dark:border-rose-500/20' },
                            { label: 'Partial', v: counts.partial, c: 'text-amber-600 dark:text-amber-400', i: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-500/10', b: 'border-amber-200 dark:border-amber-500/20' },
                        ].map(s => (
                            <Card key={s.label} className={`p-5 ${s.bg} border ${s.b} flex flex-col items-center gap-3 shadow-lg shadow-black/5`}>
                                <s.i size={24} className={s.c} /><div className="text-center"><div className={`text-2xl font-black ${s.c}`}>{s.v}</div><div className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">{s.label} Status</div></div>
                            </Card>
                        ))}
                    </div>

                    <Card className="p-0 overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                        <div className="p-4 sm:p-5 border-b border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-black/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3"><div className="p-2 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-lg"><Users size={18} /></div><h2 className="text-[11px] sm:text-xs font-black text-slate-700 dark:text-white uppercase tracking-tight">Member Breakdown</h2></div>
                            <div className="relative w-full sm:max-w-xs">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none" />
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 space-y-4">
                            {filteredMembers.map(m => {
                                const offM = (data?.sharedExpense?.memberBalances || []).find(mb => mb.memberId === m.memberId) || {};

                                // Enforce minimum meal logic in individual breakdown
                                const chargedRegMeals = m.chargedMeals || Math.max(dMinLimit, Number(m.regularMeals) || 0);
                                const isMinApplied = chargedRegMeals > (Number(m.regularMeals) || 0);

                                const lMCost = chargedRegMeals * dRate;
                                const lGCost = (Number(m.guestMeals) || 0) * dRate;
                                const lMktC = Number(m.expenses?.market) || 0;
                                const lBal = (lMCost + lGCost + dHead) - lMktC;

                                const dMCost = offM.mealCost ?? lMCost;
                                const dGCost = offM.guestMealCost ?? offM.guestCost ?? lGCost;
                                const dMktC = offM.marketCost ?? lMktC;
                                const dBal = offM.balance ?? lBal;
                                const rem = Math.max(0, Math.round(dBal) - (m.submittedAmount || 0));

                                return (
                                    <div key={m.memberId} className="p-4 sm:p-6 bg-slate-50 dark:bg-black/30 border border-slate-100 dark:border-white/10 rounded-[2rem] transition-all group hover:border-primary-500/30">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-primary-600 dark:bg-primary-500/80 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary-500/20">{(m.memberName || '?').charAt(0)}</div>
                                                <div>
                                                    <div className="text-base font-black text-slate-900 dark:text-slate-100 leading-none mb-1">{m.memberName}</div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
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
                                            <div className="p-3 bg-indigo-50 dark:bg-black/40 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl"><div className="text-[8px] font-black text-indigo-400 mb-0.5">Meal Cost</div><div className="text-base font-black text-indigo-600 dark:text-indigo-300">₹{Math.round(dMCost)}</div></div>
                                            <div className="p-3 bg-amber-50 dark:bg-black/40 border border-amber-100 dark:border-amber-500/10 rounded-2xl"><div className="text-[8px] font-black text-amber-500 mb-0.5 uppercase tracking-widest">Guest</div><div className="text-base font-black text-amber-600 dark:text-amber-400">₹{Math.round(dGCost)}</div></div>
                                            <div className="p-3 bg-blue-50 dark:bg-black/40 border border-blue-100 dark:border-blue-500/10 rounded-2xl"><div className="text-[8px] font-black text-blue-400 mb-0.5 uppercase tracking-widest">Market</div><div className="text-base font-black text-blue-600 dark:text-blue-300">₹{Math.round(dMktC)}</div></div>
                                            <div className={`p-3 rounded-2xl border transition-all ${(offM.type === 'Pay' || dBal > 0) ? 'bg-rose-50 dark:bg-black/40 border-rose-100 dark:border-rose-500/10' : 'bg-emerald-50 dark:bg-black/40 border-emerald-100 dark:border-emerald-500/10'}`}><div className={`text-[8px] font-black uppercase mb-0.5 tracking-widest ${(offM.type === 'Pay' || dBal > 0) ? 'text-rose-400' : 'text-emerald-400'}`}>Balance</div><div className={`text-base font-black ${(offM.type === 'Pay' || dBal > 0) ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>₹{rem}</div></div>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between gap-y-3 py-3 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="relative group/meal">
                                                    <div className={cn(
                                                        "px-2 py-1 border rounded-lg flex items-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-tight",
                                                        isMinApplied
                                                            ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400"
                                                            : "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                                                    )}>
                                                        <ClipboardList size={10} className={isMinApplied ? "text-rose-500" : "text-indigo-500"} />
                                                        <span>{m.regularMeals} REG</span>
                                                    </div>

                                                    {isMinApplied && (
                                                        <div className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white text-[8px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg shadow-rose-500/30 scale-110">
                                                            {dMinLimit}+
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg flex items-center gap-1.5">
                                                    <Users size={10} className="text-amber-500" />
                                                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-tight">{m.guestMeals} GUEST</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5"><TrendingUp size={12} className="text-emerald-500" /> <span className="opacity-70 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Audit Ready</span></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden mt-6 border-orange-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                        <div className="p-4 sm:p-5 border-b border-orange-100 dark:border-white/5 bg-orange-50/10 dark:bg-black/30 flex items-center justify-between">
                            <div className="flex items-center gap-3"><div className="p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-xl"><Users size={18} /></div><h2 className="text-[11px] sm:text-xs font-black text-orange-900 dark:text-orange-200 uppercase tracking-tight">Guest Archive</h2></div>
                            <span className="text-[10px] font-black text-orange-500 uppercase bg-orange-50 dark:bg-black/60 px-2.5 py-1 rounded-lg border border-orange-100">{(data.guestRecords || []).length} Records</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead><tr className="bg-slate-50 dark:bg-black/40 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border-b border-slate-100 dark:border-white/5"><th className="p-4">Date</th><th className="p-4">Member</th><th className="p-4 text-center">Session</th><th className="p-4 text-right font-mono">Amount (₹)</th></tr></thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {!(data.guestRecords || []).length ? (<tr><td colSpan="4" className="p-16 text-center text-slate-400 font-black italic uppercase text-xs opacity-60">No records found.</td></tr>) : (
                                        (data.guestRecords || []).map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4 text-[11px] font-bold text-slate-500 font-mono tracking-tighter">{r.date}</td>
                                                <td className="p-4 text-sm font-black text-slate-900 dark:text-slate-100">{r.memberName}</td>
                                                <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-inner ${r.mealTime === 'lunch' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'}`}>{r.mealTime}</span></td>
                                                <td className="p-4 text-right font-black text-sm text-slate-900 dark:text-slate-200 font-mono tracking-tighter">₹{r.amount}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            <AnimatePresence>
                {editingMember && <PaymentModal member={editingMember} month={monthStr} onClose={() => setEditingMember(null)} onSaved={handlePaymentSaved} />}
            </AnimatePresence>
        </motion.div>
    );
};

export default MonthlySummary;
