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
    const effectiveContribution = Object.keys(offM).length > 0 ? finalizedContribution : 0;

    const dBal = Object.keys(offM).length > 0 ? (signedOffBal || ((dMCost + dGCost + (Number(dHead) || 0)) - effectiveContribution)) : 0;

    // SMART BALANCE ENGINE: Match Admin Truth
    // If status is 'clear', balance is definitively 0.
    // Otherwise, it's the remaining balance after payments (submittedAmount).
    let rem = m.paymentStatus === 'clear' ? 0 : Math.round(dBal) - (Number(m.submittedAmount) || 0);

    // For Receivable (rem < 0), if it's already 'clear', it stays 0.
    if (m.paymentStatus === 'clear') rem = 0;

    return (
        <div className={cn(
            "p-4 sm:p-6 rounded-[2rem] border transition-all group relative overflow-hidden",
            isCurrentUser
                ? "bg-primary-50/30 dark:bg-primary-500/5 border-primary-500/40 shadow-lg shadow-primary-500/5 ring-1 ring-primary-500/20"
                : "bg-slate-50 dark:bg-black/30 border-slate-100 dark:border-white/10 hover:border-primary-500/20"
        )}>
            {isCurrentUser && (
                <div className="absolute top-0 right-0 p-4">
                    <span className="px-2 py-0.5 bg-primary-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">My Account</span>
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg",
                        isCurrentUser ? "bg-primary-600 dark:bg-primary-500 shadow-primary-500/30" : "bg-slate-400 dark:bg-slate-700 shadow-none"
                    )}>
                        {(m.memberName || '?').charAt(0)}
                    </div>
                    <div>
                        <div className="text-base font-black text-slate-900 dark:text-slate-100 leading-none mb-1">{m.memberName}</div>
                        <div className="flex items-center gap-2">
                            <div className="flex text-[9px] font-black text-slate-400 uppercase tracking-widest items-center gap-1 leading-none">
                                <Calendar size={10} /> {m.marketDays || 0} Market Days
                                {m.marketDates?.length > 0 && (
                                    <span className="text-[8px] opacity-60 normal-case font-mono ml-1">({m.marketDates.map(d => d.split('-')[2]).join(', ')})</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={m.paymentStatus} />
                    {m.role === 'admin' && <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[7px] font-black uppercase rounded-lg">Mess Admin</span>}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-indigo-50 dark:bg-black/40 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl">
                    <div className="text-[8px] font-black text-indigo-400 mb-0.5 uppercase tracking-widest">Meal Cost</div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black text-indigo-500/60 leading-none">{chargedRegMeals} × {dRate.toFixed(2)}</span>
                        <div className="text-base font-black text-indigo-600 dark:text-indigo-300 leading-none">₹{Math.round(dMCost)}</div>
                    </div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-black/40 border border-amber-100 dark:border-amber-500/10 rounded-2xl"><div className="text-[8px] font-black text-amber-500 mb-0.5 uppercase tracking-widest">Guest</div><div className="text-base font-black text-amber-600 dark:text-amber-400">₹{Math.round(dGCost)}</div></div>
                <div className="p-3 bg-emerald-50 dark:bg-black/40 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl"><div className="text-[8px] font-black text-emerald-500 mb-0.5 uppercase tracking-widest">Shared Cost</div><div className="text-base font-black text-emerald-600 dark:text-emerald-300">₹{Math.round(dHead)}</div></div>
                <div className={cn(
                    "p-3 rounded-2xl border transition-all",
                    rem > 0 ? "bg-rose-50 dark:bg-black/40 border-rose-100 dark:border-rose-500/10" : "bg-emerald-50 dark:bg-black/40 border-emerald-100 dark:border-emerald-500/10"
                )}>
                    <div className={cn("text-[8px] font-black uppercase mb-0.5 tracking-widest", rem > 0 ? "text-rose-400" : "text-emerald-400")}>Balance</div>
                    <div className={cn("text-base font-black", rem > 0 ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400")}>₹{rem === 0 ? '0' : Math.abs(rem)}</div>
                </div>
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
                    <div className="flex items-center gap-1.5"><TrendingUp size={12} className="text-emerald-500" /> <span className="opacity-70 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Audit Ready</span></div>
                </div>
            </div>

            {/* Your Contributions Grid (Synchronized with Pro Audit Logic) */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Auditable Contributions</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
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
                                <div key={cat.k} className={cn(
                                    "p-2.5 rounded-[1.2rem] border transition-all bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 shadow-sm"
                                )}>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <cat.i size={11} className={cn(
                                            cat.c === 'indigo' && "text-indigo-500",
                                            cat.c === 'emerald' && "text-emerald-500",
                                            cat.c === 'amber' && "text-amber-500",
                                            cat.c === 'blue' && "text-blue-500",
                                            cat.c === 'rose' && "text-rose-500",
                                            cat.c === 'slate' && "text-slate-500"
                                        )} />
                                        <span className="text-[8px] font-black uppercase tracking-tight text-slate-400">{cat.l}</span>
                                    </div>
                                    <div className="text-[12px] font-black text-slate-900 dark:text-slate-100 leading-none">₹{cat.val}</div>
                                </div>
                            ));
                    })()}
                </div>
            </div>

            {/* Summary Footer */}
            <div className="mt-4 pt-4 border-t-2 border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-3 flex-grow max-w-[240px]">
                    <div className="flex items-center justify-between group/exp hover:translate-x-1 transition-transform">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider whitespace-nowrap">Total Expenses</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-rose-600 dark:text-rose-400">₹{Math.round(dMCost + dGCost + (Number(dHead) || 0))}</span>
                            <span className="text-[8px] text-slate-400 font-bold opacity-50">({Math.round(dMCost)}+{Math.round(dGCost)}+{Math.round(dHead || 0)})</span>
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

                <div className="flex items-center gap-3 bg-white dark:bg-black/40 p-2 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm transition-all hover:scale-105">
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            {rem > 0 ? 'Payable Balance' : rem < 0 ? 'Receivable Balance' : 'Clear Status'}
                        </span>
                        <span className={cn(
                            "text-lg font-black leading-none",
                            rem > 0 ? "text-rose-600" : rem < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                        )}>₹{Math.abs(rem)}</span>
                    </div>
                    <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform",
                        rem > 0 ? "bg-rose-500 shadow-rose-500/20" : rem < 0 ? "bg-emerald-500 shadow-emerald-500/20" : "bg-slate-200 dark:bg-slate-700 shadow-none"
                    )}>
                        {rem > 0 ? <TrendingDown size={16} className="text-white" /> : rem < 0 ? <TrendingUp size={16} className="text-white" /> : <CheckCircle2 size={16} className="text-slate-500" />}
                    </div>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    // Optimized comparison to avoid redundant re-renders
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
        const members = (data.members || []);
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

        // RESTRICTED MODE: If no finalized sharedExpense is found, show zero stats
        return { 
            rate: 0, head: 0, shared: 0, mkt: 0, rice: 0, gstM: 0, totalM: 0, 
            minLimit 
        };
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
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/20"><ClipboardList className="text-white" size={24} /></div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Summary Dashboard</h1>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 leading-none">Trace for {monthStr}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchSummary} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 shadow-sm active:scale-95 transition-all hover:rotate-180"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <RefreshCw size={36} className="animate-spin mb-4 text-indigo-500" />
                    <p className="font-black text-xs uppercase tracking-widest">Syncing Database...</p>
                </div>
            ) : error ? (
                <div className="p-8 rounded-[2rem] bg-rose-50 dark:bg-rose-950/20 text-center flex flex-col items-center gap-4 border border-rose-200 dark:border-rose-900/30">
                    <AlertCircle className="text-rose-500" size={32} />
                    <h3 className="font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Sync Failed</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{error}</p>
                </div>
            ) : data && (
                <>
                    <AnimatePresence>
                        {!data.sharedExpense && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2">
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
                                    </div>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-emerald-50 dark:bg-black/60 px-2 py-1 rounded border border-emerald-100 dark:border-white/10">Min {stats.minLimit} Meals</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/5">
                                {[
                                    { label: 'Total Market', val: stats.mkt > 0 ? `₹${stats.mkt.toLocaleString()}` : '₹00', color: 'text-blue-600' },
                                    { label: 'Rice Cost', val: stats.rice > 0 ? `₹${stats.rice.toLocaleString()}` : '₹00', color: 'text-amber-600' },
                                    { label: 'Guest Meals', val: stats.gstM > 0 ? stats.gstM : '00', color: 'text-rose-600' },
                                    { label: 'Total Meals', val: stats.totalM > 0 ? stats.totalM : '00', color: 'text-indigo-600' },
                                    { label: 'Meal Cost', val: stats.rate > 0 ? `₹${Number(stats.rate).toFixed(2)}` : '₹00', color: 'text-emerald-600' }
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 sm:p-6 text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</div>
                                        <div className={`text-xl font-black ${stat.color}`}>{stat.val}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    <Card className="p-0 overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 mt-6 shadow-xl">
                        <div className="p-4 sm:p-5 border-b border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-black/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-lg"><Home size={18} /></div>
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
                                    didi: { icon: UserRound, label: 'Didi', color: 'text-purple-500' },
                                    houseRent: { icon: Home, label: 'House Rent', color: 'text-indigo-500' },
                                    spices: { icon: Coffee, label: 'Spices', color: 'text-amber-600' },
                                    others: { icon: FileText, label: 'Others', color: 'text-slate-500' }
                                };
                                const item = config[key] || { icon: FileText, label: key.charAt(0).toUpperCase() + key.slice(1), color: 'text-slate-400' };
                                return (
                                    <div key={key} className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all">
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
                        <div className="p-4 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/10 flex items-center justify-center gap-8">
                            <div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per Head:</span><span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{Math.round(stats.head)}</span></div>
                            <div className="w-px h-6 bg-slate-200 dark:bg-white/10" /><div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Shared:</span><span className="text-base font-black text-indigo-600 dark:text-indigo-400">₹{Math.round(stats.shared)}</span></div>
                        </div>
                    </Card>

                    <div className="mt-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><Users size={18} /></div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Monthly Invoice List</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {filteredMembers.map(m => {
                                const isCurrentUser = String(m._id || m.memberId) === String(user.id || user._id);
                                const offM = (data?.sharedExpense?.members || []).find(om => String(om.memberId) === String(m._id || m.memberId)) || {};
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
