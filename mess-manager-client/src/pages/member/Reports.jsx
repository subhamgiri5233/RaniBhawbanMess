import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, CheckCircle2, Clock, AlertCircle, Users,
    ShoppingBag, Wifi, Zap, Utensils, Flame,
    Home, Newspaper, UserRound, RefreshCw, Activity, PlusCircle, Coffee,
    Calendar, TrendingUp, TrendingDown, Coins, Download, FileText, Search
} from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { MESS_CONFIG } from '../../config';
import { addBengaliFont } from '../../utils/bengaliFont';

// ─── Status badge (Read Only for Members) ──────────────────────────────────
const STATUS_CONFIG = {
    clear: {
        label: 'Clear',
        icon: CheckCircle2,
        cls: 'bg-emerald-300/40 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/30 dark:border-emerald-500/20',
    },
    partial: {
        label: 'Partial',
        icon: AlertCircle,
        cls: 'bg-amber-300/40 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/30 dark:border-amber-500/20',
    },
    pending: {
        label: 'Pending',
        icon: Clock,
        cls: 'bg-rose-300/40 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300/30 dark:border-rose-500/20',
    },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon || AlertCircle;
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black uppercase tracking-wide ${cfg.cls}`}>
            <Icon size={12} />
            {cfg.label}
        </div>
    );
};

// ─── Member Card Component (Member View) ────────────────────────────────────
const MemberCard = memo(({ m, offM, dRate, dHead, dMinLimit, isCurrentUser }) => {
    const chargedRegMeals = m.chargedMeals || Math.max(dMinLimit, Number(m.regularMeals) || 0);
    const isMinApplied = chargedRegMeals > (Number(m.regularMeals) || 0);

    const lMCost = chargedRegMeals * dRate;
    const lGCost = (Number(m.guestMeals) || 0) * dRate;
    const totalContribution = Object.values(m.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0);

    const dMCost = Number(offM.mealCost ?? lMCost) || 0;
    const dGCost = Number(offM.guestMealCost ?? offM.guestCost ?? lGCost) || 0;

    // Finalized contribution (from stored record) vs live contribution
    const finalizedContribution = Number(offM.totalContribution ?? totalContribution); 
    const effectiveContribution = finalizedContribution;

    const dBal = ((dMCost + dGCost + (Number(dHead) || 0)) - effectiveContribution);

    // SMART BALANCE ENGINE: Match Admin Truth
    // If status is 'clear', balance is definitively 0.
    // Otherwise, it's the remaining balance after payments (submittedAmount).
    let rem = m.paymentStatus === 'clear' ? 0 : Math.round(dBal) - (Number(m.submittedAmount) || 0);

    // For Receivable (rem < 0), if it's already 'clear', it stays 0.
    if (m.paymentStatus === 'clear') rem = 0;

    return (
        <div className={cn(
            "p-6 sm:p-8 rounded-[2.5rem] border transition-all duration-300 group relative overflow-hidden",
            isCurrentUser
                ? "bg-indigo-300 dark:bg-slate-900 shadow-2xl shadow-primary-500/20 border-primary-500/40 ring-1 ring-primary-500/20"
                : "bg-indigo-300/40 dark:bg-slate-900/40 border-indigo-300/30 dark:border-white/5 hover:border-primary-500/20 backdrop-blur-md"
        )}>
            {isCurrentUser && (
                <div className="absolute top-0 right-0 p-6">
                    <span className="px-3 py-1 bg-primary-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-primary-500/30">Primary Identity</span>
                </div>
            )}

            <div className="absolute -right-10 -bottom-10 opacity-[0.02] dark:opacity-[0.04] group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                <UserRound size={180} />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white font-black text-xl shadow-2xl transition-transform group-hover:scale-105",
                        isCurrentUser ? "bg-gradient-to-br from-primary-500 to-indigo-600 shadow-primary-500/30" : "bg-slate-800 dark:bg-slate-700 shadow-none"
                    )}>
                        {(m.memberName || '?').charAt(0)}
                    </div>
                    <div>
                        <div className="text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-1">{m.memberName}</div>
                        <div className="flex items-center gap-3">
                            <div className="flex text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest items-center gap-1.5">
                                <Calendar size={12} className="text-primary-500/50" /> {m.marketDays || 0} Procurement Units
                            </div>
                            {m.marketDates?.length > 0 && (
                                <div className="px-2 py-0.5 bg-indigo-300/40 dark:bg-slate-800 rounded-lg text-[8px] font-mono text-indigo-700 dark:text-slate-400 border border-indigo-400/20">
                                    DATES: {m.marketDates.map(d => d.split('-')[2]).join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3">
                    <StatusBadge status={m.paymentStatus} />
                    {m.role === 'admin' && (
                        <span className="px-2 py-0.5 bg-indigo-300/40 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-[0.15em] rounded-lg border border-indigo-500/20">
                            Governance Administrator
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-indigo-300/40 dark:bg-black/20 border border-indigo-300/30 dark:border-white/5 rounded-2xl group/sub shadow-sm transition-all hover:shadow-md">
                    <div className="text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest leading-none">Standard Meal Cost</div>
                    <div className="flex flex-col gap-1">
                        <div className="text-lg font-black text-slate-900 dark:text-white leading-none">₹{Math.round(dMCost)}</div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter opacity-60">{chargedRegMeals} × {dRate.toFixed(1)}</span>
                    </div>
                </div>
                <div className="p-4 bg-indigo-300/40 dark:bg-black/20 border border-indigo-300/30 dark:border-white/5 rounded-2xl group/sub shadow-sm"><div className="text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest leading-none">Guest Adjustment</div><div className="text-lg font-black text-slate-900 dark:text-white leading-none">₹{Math.round(dGCost)}</div></div>
                <div className="p-4 bg-indigo-300/40 dark:bg-black/20 border border-indigo-300/30 dark:border-white/5 rounded-2xl group/sub shadow-sm"><div className="text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest leading-none">Shared Liability</div><div className="text-lg font-black text-slate-900 dark:text-white leading-none">₹{Math.round(dHead)}</div></div>
                <div className={cn(
                    "p-4 rounded-2xl border transition-all shadow-sm",
                    rem > 0 ? "bg-rose-300/40 dark:bg-rose-900/10 border-rose-300 dark:border-rose-900/20 shadow-rose-500/5 text-rose-700" : "bg-emerald-300/40 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-900/20 shadow-emerald-500/5 text-emerald-700"
                )}>
                    <div className={cn("text-[9px] font-black uppercase mb-2 tracking-widest leading-none", rem > 0 ? "text-rose-500" : "text-emerald-500")}>Outstanding</div>
                    <div className={cn("text-xl font-black tabular-nums tracking-tighter leading-none", rem > 0 ? "text-rose-700" : "text-emerald-700 dark:text-emerald-400")}>
                        {rem === 0 ? '₹ 0.00' : `₹ ${Math.abs(rem).toLocaleString()}`}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-y-4 py-5 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative group/meal">
                        <div className={cn(
                            "px-3 py-1.5 border rounded-2xl flex items-center gap-2 transition-all text-[11px] font-black uppercase tracking-widest",
                            isMinApplied
                                ? "bg-rose-300/40 dark:bg-rose-500/5 border-rose-300 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 shadow-sm"
                                : "bg-indigo-300/40 dark:bg-primary-500/5 border-indigo-300/30 dark:border-primary-500/20 text-indigo-800 dark:text-primary-300 shadow-sm"
                        )}>
                            <Utensils size={12} className={isMinApplied ? "text-rose-500" : "text-primary-500"} />
                            <span>{m.regularMeals} Active Meals</span>
                        </div>
                        {isMinApplied && (
                            <div className="absolute -top-3 -right-3 bg-rose-600 text-white text-[9px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-indigo-400/30 dark:border-slate-900 shadow-xl shadow-rose-500/30 scale-110">
                                {dMinLimit}+
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-6 border-t border-slate-100 dark:border-white/5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Auditable Contributions</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {(() => {
                        const isAdmin = m.role === 'admin';
                        const categories = isAdmin 
                            ? [
                                { k: 'rice', l: 'Rice', i: Newspaper, c: 'emerald' },
                                { k: 'spices', l: 'Spices', i: Flame, c: 'amber' },
                                { k: 'others', l: 'Other', i: Home, c: 'slate' }
                            ]
                            : [
                                { k: 'market', l: 'Market', i: ShoppingBag, c: 'indigo' },
                                { k: 'deposit', l: 'Deposit', i: Coins, c: 'emerald' },
                                { k: 'gas', l: 'Gas', i: Flame, c: 'amber' },
                                { k: 'wifi', l: 'Wifi', i: Wifi, c: 'blue' },
                                { k: 'electric', l: 'Electric', i: Zap, c: 'rose' }
                            ];

                        return categories
                            .map(cat => ({ ...cat, val: Number(m.expenses?.[cat.k]) || 0 }))
                            .filter(cat => cat.val > 0)
                            .map(cat => (
                                <div key={cat.k} className="p-3 rounded-2xl border border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-black/20 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <cat.i size={12} className="text-slate-400" />
                                        <span className="text-[8px] font-black uppercase tracking-tight text-slate-400">{cat.l}</span>
                                    </div>
                                    <div className="text-[13px] font-black text-slate-900 dark:text-slate-100 leading-none">₹{cat.val}</div>
                                </div>
                            ));
                    })()}
                </div>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Expenses</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">₹{Math.round(dMCost + dGCost + (Number(dHead) || 0))}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Contribution</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{Math.round(effectiveContribution)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.m === next.m && 
        prev.offM === next.offM &&
        prev.dRate === next.dRate &&
        prev.dHead === next.dHead &&
        prev.dMinLimit === next.dMinLimit &&
        prev.isCurrentUser === next.isCurrentUser
    );
});

const Reports = () => {
    const navigate = useNavigate();
    const { globalMonth } = useData();
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    }, [monthStr]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const stats = useMemo(() => {
        if (!data) return { rate: 0, head: 0, shared: 0, mkt: 0, rice: 0, gstM: 0, totalM: 0, minLimit: 40 };
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
                minLimit
            };
        }
        return { rate: 0, head: 0, shared: 0, mkt: 0, rice: 0, gstM: 0, totalM: 0, minLimit };
    }, [data]);

    const filteredMembers = useMemo(() => {
        if (!data || !data.members) return [];
        const members = data.members || [];
        return searchQuery.trim()
            ? members.filter(m => m.memberName?.toLowerCase().includes(searchQuery.toLowerCase()))
            : members;
    }, [data, searchQuery]);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            
            {/* Power Banner */}
            <div className="relative overflow-hidden bg-indigo-300/40 dark:bg-slate-900 shadow-sm p-8 rounded-[2.5rem] border border-indigo-300/30 dark:border-white/5 backdrop-blur-xl group mb-8 transition-all hover:shadow-xl hover:shadow-primary-500/5">
                <div className="absolute inset-0 opacity-10 dark:opacity-[0.03] pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={14} className="text-primary-500 animate-pulse" />
                            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em]">Institutional Grade Reporting</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
                            Member Reports
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-300/40 dark:bg-primary-950/50 text-[10px] font-black text-indigo-800 dark:text-primary-400 border border-indigo-300 dark:border-primary-900/50 uppercase tracking-widest">
                                {monthStr}
                            </span>
                        </h1>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                            Comprehensive financial ledger and dietary consumption trace
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <RefreshCw size={36} className="animate-spin mb-4 text-indigo-500" />
                    <p className="font-black text-xs uppercase tracking-widest">Syncing Database...</p>
                </div>
            ) : error ? (
                <div className="p-8 rounded-[2rem] bg-rose-300/40 dark:bg-rose-950/20 text-center flex flex-col items-center gap-4 border border-rose-300/30 dark:border-rose-900/30">
                    <AlertCircle className="text-rose-500" size={32} />
                    <h3 className="font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Sync Failed</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{error}</p>
                </div>
            ) : data && (
                <>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="p-0 overflow-hidden border-indigo-300/30 dark:border-white/10 bg-indigo-300/40 dark:bg-slate-900 shadow-xl">
                            <div className="p-4 sm:p-5 border-b border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-black/30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-300/40 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl shadow-inner border border-emerald-400/20"><Coins size={18} /></div>
                                    <div>
                                        <h2 className="text-[11px] sm:text-xs font-black text-slate-700 dark:text-emerald-200 uppercase tracking-tight">Financial Audit Trace</h2>
                                    </div>
                                </div>
                                <span className="text-[9px] font-black text-indigo-600 dark:text-slate-500 uppercase tracking-widest bg-indigo-300/50 dark:bg-black/60 px-2 py-1 rounded border border-indigo-400/30 dark:border-white/10 shadow-inner">Min {stats.minLimit} Meals</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-indigo-200/50 dark:divide-white/5">
                                {[
                                    { label: 'Total Market', val: stats.mkt > 0 ? `₹${stats.mkt.toLocaleString()}` : '₹00', color: 'text-blue-600' },
                                    { label: 'Rice Cost', val: stats.rice > 0 ? `₹${stats.rice.toLocaleString()}` : '₹00', color: 'text-amber-600' },
                                    { label: 'Guest Meals', val: stats.gstM > 0 ? stats.gstM : '00', color: 'text-rose-600' },
                                    { label: 'Total Meals', val: stats.totalM > 0 ? stats.totalM : '00', color: 'text-indigo-600' },
                                    { label: 'Meal Cost', val: stats.rate > 0 ? `₹${Number(stats.rate).toFixed(2)}` : '₹00', color: 'text-emerald-600' }
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 sm:p-6 text-center hover:bg-indigo-300/40 dark:hover:bg-white/5 transition-colors">
                                        <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</div>
                                        <div className={`text-xl font-black ${stat.color}`}>{stat.val}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    <Card className="p-0 overflow-hidden border-indigo-300/30 dark:border-white/10 bg-indigo-300/40 dark:bg-slate-900 mt-6 shadow-xl">
                        <div className="p-4 sm:p-5 border-b border-indigo-300/30 dark:border-white/5 bg-indigo-300/40 dark:bg-black/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-300/40 dark:bg-white/5 text-indigo-700 dark:text-slate-100 rounded-lg border border-indigo-400/20"><Home size={18} /></div>
                                <h2 className="text-[11px] sm:text-xs font-black text-slate-700 dark:text-slate-100 uppercase tracking-tight">Fixed Operational Bills</h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6">
                            {['gas', 'wifi', 'electric', 'paper', 'didi', 'houseRent', 'spices', 'others'].map(key => {
                                const val = (data?.sharedExpense?.bills || data?.liveBills || {})[key] || 0;
                                const config = {
                                    wifi: { icon: Wifi, label: 'WiFi', color: 'text-blue-500' },
                                    electric: { icon: Zap, label: 'Electric', color: 'text-yellow-600' },
                                    gas: { icon: Flame, label: 'Gas', color: 'text-rose-500' },
                                    paper: { icon: Newspaper, label: 'Paper', color: 'text-orange-500' },
                                    didi: { icon: UserRound, label: 'Didi', color: 'purple-500' },
                                    houseRent: { icon: Home, label: 'House Rent', color: 'text-indigo-500' },
                                    spices: { icon: Coffee, label: 'Spices', color: 'text-amber-600' },
                                    others: { icon: FileText, label: 'Others', color: 'text-slate-500' }
                                };
                                const item = config[key] || { icon: FileText, label: key.charAt(0).toUpperCase() + key.slice(1), color: 'text-slate-400' };
                                return (
                                    <div key={key} className="bg-indigo-300/40 dark:bg-black/40 p-4 rounded-2xl border border-indigo-400/30 dark:border-white/10 shadow-inner transition-all">
                                        <div className="flex items-center justify-between mb-1">
                                            <item.icon size={16} className={item.color} />
                                            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{item.label}</span>
                                        </div>
                                        <div className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                                            ₹{val > 0 ? Number(val).toLocaleString() : '00'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 bg-indigo-300/40 dark:bg-black/40 border-t border-indigo-300/30 dark:border-white/10 flex items-center justify-center gap-8">
                            <div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per Head:</span><span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{Math.round(stats.head)}</span></div>
                            <div className="w-px h-6 bg-indigo-300/30 dark:bg-white/10" /><div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Shared:</span><span className="text-base font-black text-indigo-600 dark:text-indigo-400">₹{Math.round(stats.shared)}</span></div>
                        </div>
                    </Card>

                    <div className="mt-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-300/40 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-xl"><Users size={18} /></div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Monthly Invoice List</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {filteredMembers.map(m => {
                                const isCurrentUser = String(m._id || m.memberId) === String(user.id || user._id);
                                const offM = (data?.sharedExpense?.memberBalances || []).find(mb => String(mb.memberId) === String(m._id || m.memberId)) || {};
                                return (
                                    <MemberCard
                                        key={m._id || m.memberId}
                                        m={m}
                                        offM={offM}
                                        dRate={stats.rate}
                                        dHead={stats.head}
                                        dMinLimit={stats.minLimit}
                                        isCurrentUser={isCurrentUser}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default Reports;
