import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    ClipboardList, CheckCircle2, Clock, AlertCircle, Users,
    ShoppingBag, Wifi, Zap, User, Utensils,
    Coffee, FileText, Loader2, RefreshCw, Wallet, Home, Newspaper, Calendar, Download
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

const StatusBadge = React.memo(({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black uppercase tracking-wide ${cfg.cls}`}>
            <Icon size={12} />
            {cfg.label}
        </div>
    );
});

// ─── Stat chip ────────────────────────────────────────────────────────────────
const Chip = React.memo(({ icon: Icon, value, label, color }) => (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${color} transition-all`}>
        <div className="flex items-center gap-1.5 mb-1">
            <Icon size={14} className="opacity-70" />
            <span className="text-sm font-black tracking-tight">{value}</span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 text-center">{label}</span>
    </div>
));

// ─── Sub-components for better performance ──────────────────────────────────
const ReportHeader = React.memo(({ data, selectedMonth, selectedYear, loading, onRefresh }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
                <FileText size={28} className="text-indigo-500" />
                Monthly Report
            </h1>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                {data?.sharedExpense
                    ? `Your official finalized bill for ${MONTHS[selectedMonth - 1]} ${selectedYear}.`
                    : `Live tabular breakdown for ${MONTHS[selectedMonth - 1]} ${selectedYear} (Not finalized).`}
            </p>
        </div>

        <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-950/40 transition-all disabled:opacity-50"
        >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
        </button>
    </div>
));

const SharedExpenseGrid = React.memo(({ loading, data, sharedExpenses, member }) => {
    if (loading || !data || !member) return null;
    const hasShared = data.sharedExpense || sharedExpenses.isSnapshot || Object.values(sharedExpenses).some(v => typeof v === 'number' && v > 0);
    if (!hasShared) return null;

    const totalCount = data.sharedExpense?.memberBalances?.length || data.totalMembersCount || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
        >
            <Card className="p-0 overflow-hidden border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40">
                <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-3">
                    <div className="p-2 bg-violet-100 dark:bg-violet-950/40 rounded-xl">
                        <Wallet size={18} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Shared Expenses</h2>
                            <span className={`px-1.5 py-0.5 rounded-md ${sharedExpenses.isSnapshot ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'} text-[8px] font-black uppercase tracking-widest border`}>
                                {sharedExpenses.isSnapshot ? 'Official Snapshot' : 'Live Data Fallback'}
                            </span>
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
                            {sharedExpenses.gas > 0 && totalCount > 0 && (
                                <p className="text-[10px] font-bold text-rose-400 dark:text-rose-500 mt-0.5">
                                    ₹{Math.round(sharedExpenses.gas / totalCount)} / member
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
                            {sharedExpenses.wifi > 0 && totalCount > 0 && (
                                <p className="text-[10px] font-bold text-blue-400 dark:text-blue-500 mt-0.5">
                                    ₹{Math.round(sharedExpenses.wifi / totalCount)} / member
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
                            {sharedExpenses.electric > 0 && totalCount > 0 && (
                                <p className="text-[10px] font-bold text-yellow-400 dark:text-yellow-500 mt-0.5">
                                    ₹{Math.round(sharedExpenses.electric / totalCount)} / member
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
                            {sharedExpenses.paper > 0 && totalCount > 0 && (
                                <p className="text-[10px] font-bold text-orange-400 dark:text-orange-500 mt-0.5">
                                    ₹{Math.round(sharedExpenses.paper / totalCount)} / member
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Didi */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30">
                        <div className="p-3 bg-pink-100 dark:bg-pink-900/40 rounded-xl">
                            <User size={20} className="text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-pink-500 dark:text-pink-400">Didi</p>
                            <p className={`text-2xl font-black ${sharedExpenses.didi > 0 ? 'text-pink-700 dark:text-pink-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                {sharedExpenses.didi > 0 ? `₹${sharedExpenses.didi}` : '—'}
                            </p>
                            {sharedExpenses.didi > 0 && totalCount > 0 && (
                                <p className="text-[10px] font-bold text-pink-400 dark:text-pink-500 mt-0.5">
                                    ₹{Math.round(sharedExpenses.didi / totalCount)} / member
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
                            {sharedExpenses.houseRent > 0 && totalCount > 0 && (
                                <p className="text-[10px] font-bold text-violet-400 dark:text-violet-500 mt-0.5">
                                    ₹{Math.round(sharedExpenses.houseRent / totalCount)} / member
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {/* Total Shared footer bar */}
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
    );
});

const MemberReportTable = React.memo(({ member, snapshotM, exportingId, onExport }) => {
    if (!member) return null;

    return (
        <Card className="p-0 overflow-hidden border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1050px]">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-white/5">
                            <th className="px-5 py-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight sticky left-0 top-0 z-20 bg-slate-50 dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Member</th>
                            <th className="px-4 py-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">Deposit<br /><span className="text-[9px] font-black text-violet-500/70 lowercase opacity-60">(finances)</span></th>
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
                            <motion.tr
                                key={member.memberId}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                            >
                                {/* Member name */}
                                <td className="px-5 py-4 sticky left-0 z-10 bg-white dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm uppercase">
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

                                {/* Deposit */}
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
                                    <span className={`font-black text-sm ${(snapshotM?.marketCost || member.expenses?.market || 0) > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {(snapshotM?.marketCost || member.expenses?.market || 0) > 0 ? `₹${Math.round(snapshotM?.marketCost || member.expenses?.market || 0)}` : '—'}
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

                                {/* Status */}
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
                                                    <StatusBadge status={member.paymentStatus} />
                                                </div>
                                                <button
                                                    onClick={() => onExport(member)}
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
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
                <motion.div
                    key={member.memberId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white dark:bg-slate-900/40"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-black text-sm uppercase">
                                {(member.memberName || '?').charAt(0)}
                            </div>
                            <div>
                                <div className="font-black text-slate-900 dark:text-white text-sm">{member.memberName}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-white/5">
                                        <Utensils size={8} /> {member.regularMeals < 40 ? 40 : member.regularMeals} Meals
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase tracking-tighter bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-100/50 dark:border-amber-800/20">
                                        <Users size={8} /> {member.guestMeals} Guest
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            {(() => {
                                if (!snapshotM) return <span className="text-slate-300 text-[10px]">No Snapshot</span>;
                                const baseBalance = Math.round(snapshotM.balance) || 0;
                                const submitted = member.submittedAmount || 0;
                                const remaining = Math.max(0, baseBalance - submitted);

                                if (remaining === 0) {
                                    return <span className="text-emerald-500 font-black uppercase tracking-widest text-[9px] bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200/50">✓ Clear</span>;
                                }
                                if (snapshotM.type === 'Pay') {
                                    return (
                                        <div className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest text-[9px] ring-1 ring-rose-500/20">
                                            ₹{remaining} Pay
                                        </div>
                                    );
                                }
                                return (
                                    <div className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-[9px] ring-1 ring-emerald-500/20">
                                        ₹{remaining} Get
                                    </div>
                                );
                            })()}
                            <StatusBadge status={member.paymentStatus} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Deposit</p>
                            <p className="font-black text-xs text-emerald-600">₹{Math.round(member.expenses?.deposit || 0)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Market</p>
                            <p className="font-black text-xs text-blue-600">₹{Math.round(snapshotM?.marketCost || member.expenses?.market || 0)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Meal Cost</p>
                            <p className="font-black text-xs text-amber-600">₹{Math.round(snapshotM?.mealCost || 0)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Gas</p>
                            <p className="font-black text-xs text-rose-600">₹{Math.round(member.expenses?.gas || 0)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">WiFi</p>
                            <p className="font-black text-xs text-cyan-600">₹{Math.round(member.expenses?.wifi || 0)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Electric</p>
                            <p className="font-black text-xs text-yellow-600">₹{Math.round(member.expenses?.electric || 0)}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            {member.submittedAmount > 0 && (
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                    {snapshotM?.type === 'Pay' ? 'Paid' : 'Got'}: <span className="text-slate-600 dark:text-slate-300">₹{member.submittedAmount}</span>
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => onExport(member)}
                            disabled={exportingId === member.memberId}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all"
                        >
                            <Download size={10} />
                            {exportingId === member.memberId ? 'Exporting...' : 'Invoice'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </Card>
    );
});

// ─── Main page ────────────────────────────────────────────────────────────────
const Reports = () => {
    const { globalMonth } = useData();

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
    const [exportingId, setExportingId] = useState(null);

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
    const [sharedExpenses, setSharedExpenses] = useState({ paper: 0, didi: 0, houseRent: 0, gas: 0, wifi: 0, electric: 0, spices: 0, others: 0 });

    const monthStr = `${selectedYear}-${pad(selectedMonth)}`;

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const summaryRes = await api.get(`/summary/${monthStr}`);
            setData(summaryRes.data);
            const snapshot = summaryRes.data.sharedExpense;
            const liveBills = summaryRes.data.liveBills;

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
            } else if (liveBills) {
                setSharedExpenses({
                    paper: liveBills.paper || 0,
                    didi: liveBills.didi || 0,
                    houseRent: liveBills.houseRent || 0,
                    gas: liveBills.gas || 0,
                    wifi: liveBills.wifi || 0,
                    electric: liveBills.electric || 0,
                    spices: liveBills.spices || 0,
                    others: liveBills.others || 0,
                    isSnapshot: false
                });
            } else {
                setSharedExpenses({
                    paper: 0, didi: 0, houseRent: 0, gas: 0, wifi: 0, electric: 0, spices: 0, others: 0,
                    isSnapshot: false
                });
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load report.');
        } finally {
            setLoading(false);
        }
    }, [monthStr]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    // ── Export PDF Invoice (member) ────────────────────────────────────────────
    const exportInvoice = async (memberData) => {
        setExportingId(memberData.memberId);
        try {
            const res = await api.get(`/summary/${monthStr}/invoice/${memberData.memberId}`);
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
                    didParseCell(dataCell) {
                        if (dataCell.section === 'body' && dataCell.row.index === totalRowIdx) {
                            dataCell.cell.styles.fillColor = [16, 185, 129];
                            dataCell.cell.styles.textColor = [255, 255, 255];
                            dataCell.cell.styles.fontStyle = 'bold';
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

            // ── Guest meals (detailed) ──
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
                    startY: y, head: [['Description', 'Amount (Rs.)']],
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
            const payableBase = snapshotM ? (snapshotM.totalCost - snapshotM.marketCost) : (pmt?.depositBalance || inv.member.deposit || 0);
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
            alert('Failed to export invoice.');
        } finally {
            setExportingId(null);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    // Derived member data (only logic for the single member viewing this)
    const member = data?.members?.[0]; // Backend only returns their own row
    const snapshotM = member ? data?.sharedExpense?.memberBalances?.find(mb => mb.memberId === member.memberId) : null;

    // Total Members logic is handled in snapshot calculation. The members array we receive is just Length 1.
    // However, the snapshot's shared costs were calculated based on the total members recorded in the snapshot.
    // The "snapshotTotalMembers" is technically available inside sharedExpense if we need it, but the per-member cost is sufficient directly.

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-12 overflow-hidden"
        >
            <ReportHeader
                data={data}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                loading={loading}
                onRefresh={fetchSummary}
            />

            <SharedExpenseGrid
                loading={loading}
                data={data}
                sharedExpenses={sharedExpenses}
                member={member}
            />

            <MemberReportTable
                member={member}
                snapshotM={snapshotM}
                exportingId={exportingId}
                onExport={exportInvoice}
            />
        </motion.div>
    );
};

export default Reports;
