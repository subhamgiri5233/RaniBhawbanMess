import React, { useMemo, useState, useRef, useEffect } from 'react';
import { getDaysInMonth, format, parseISO } from 'date-fns';
import { Check, X, Info, TrendingUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const MealCell = React.memo(({ day, memberId, type, getStatus, todayStr, onClick, onMouseEnter, onMouseLeave, isHoveredRowDay }) => {
    const hasStatus = getStatus(memberId, day.dateStr, type);
    const isToday = day.dateStr === todayStr;

    return (
        <td
            className={cn(
                "p-1 border-r border-slate-50 dark:border-white/5 text-center cursor-pointer transition-all relative group/cell",
                isToday && (type === 'lunch' ? "bg-primary-500/10 dark:bg-primary-500/5" : "bg-indigo-500/10 dark:bg-indigo-500/5"),
                !isToday && isHoveredRowDay && (type === 'lunch' ? "bg-primary-50 dark:bg-primary-500/5" : "bg-indigo-50 dark:bg-indigo-500/5")
            )}
            onClick={(e) => onClick(e, memberId, day.dateStr, type)}
            onMouseEnter={() => onMouseEnter({ dateStr: day.dateStr, type, dayNum: day.dayNum, memberId })}
            onMouseLeave={onMouseLeave}
        >
            <div className="flex justify-center">
                <div className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 relative z-10",
                    hasStatus
                        ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 scale-100"
                        : (!hasStatus && day.dateStr < todayStr)
                            ? "bg-rose-100 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 scale-100"
                            : "bg-slate-50 dark:bg-slate-900/50 text-slate-300 dark:text-slate-600 group-hover/cell:scale-110"
                )}>
                    {hasStatus ? <Check size={14} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                </div>
                {isToday && (
                    <div className={cn(
                        "absolute inset-y-0 left-0 right-0 border-x-2 pointer-events-none",
                        type === 'lunch' ? "border-primary-500/10" : "border-indigo-500/10"
                    )}></div>
                )}
            </div>
        </td>
    );
});

const MealRow = React.memo(({ member, type, days, getStatus, todayStr, calculateTotal, onCellClick, onCellMouseEnter, onCellMouseLeave, hoveredCell }) => {
    const mId = member._id || member.id;
    const total = useMemo(() => calculateTotal(mId, type), [mId, type, calculateTotal]);
    const isLunch = type === 'lunch';

    return (
        <tr className={cn(
            "border-b group hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors",
            isLunch ? "border-slate-50 dark:border-white/5" : "border-b-4 border-slate-100 dark:border-white/5"
        )}>
            <td className="p-4 border-r border-slate-50 dark:border-white/5 font-black text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-950 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col">
                    <span className="truncate max-w-[140px]">{member.name}</span>
                    <span className={cn(
                        "text-[8px] uppercase tracking-widest mt-1 flex items-center gap-1",
                        isLunch ? "text-primary-500 dark:text-primary-400" : "text-indigo-500 dark:text-indigo-400"
                    )}>
                        <div className={cn("w-1 h-1 rounded-full", isLunch ? "bg-primary-500" : "bg-indigo-500")}></div>
                        {isLunch ? '🌞 Lunch' : '🌙 Dinner'}
                    </span>
                </div>
            </td>
            {days.map(day => (
                <MealCell
                    key={`${type}-${day.dayNum}`}
                    day={day}
                    memberId={mId}
                    type={type}
                    getStatus={getStatus}
                    todayStr={todayStr}
                    onClick={onCellClick}
                    onMouseEnter={onCellMouseEnter}
                    onMouseLeave={onCellMouseLeave}
                    isHoveredRowDay={hoveredCell?.dayNum === day.dayNum}
                />
            ))}
            <td className={cn(
                "p-4 text-center font-black backdrop-blur-sm",
                isLunch ? "text-primary-600 dark:text-primary-400 bg-primary-50/20 dark:bg-primary-500/5" : "text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-500/5"
            )}>
                <div className="text-sm">{total}</div>
            </td>
        </tr>
    );
});

const MealMonthlySheet = ({ members, meals, selectedDate, onToggleMeal }) => {
    // 1. Get days in the month
    const currentDate = useMemo(() => parseISO(selectedDate), [selectedDate]);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);

    // 2. Generate array of days - Memoized
    const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month, i + 1);
        return {
            dateStr: format(date, 'yyyy-MM-dd'),
            dayNum: i + 1
        };
    }), [year, month, daysInMonth]);

    // Today's date string for highlighting - Memoized
    const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

    // 3. Optimized Meal Lookup using a Map (O(1) instead of O(N))
    const mealsMap = useMemo(() => {
        const map = new Map();
        (meals || []).forEach(m => {
            if (m && m.memberId && m.date && m.type) {
                const key = `${m.memberId}|${m.date}|${m.type}`;
                map.set(key, true);
            }
        });
        return map;
    }, [meals]);

    const getStatus = (memberId, dateStr, type) => {
        return mealsMap.has(`${memberId}|${dateStr}|${type}`);
    };

    // 4. Calculate Totals - Memoized per month/year
    const currentMonthStr = useMemo(() => format(currentDate, 'yyyy-MM'), [currentDate]);

    const calculateTotal = useMemo(() => (memberId, type) => {
        return (meals || []).filter(m => m && m.memberId === memberId && m.date && m.date.startsWith(currentMonthStr) && m.type === type).length;
    }, [meals, currentMonthStr]);

    // Calculate Grand Total for the month
    const monthlyGrandTotal = useMemo(() => {
        return (meals || []).filter(m => m && m.date && m.date.startsWith(currentMonthStr)).length;
    }, [meals, currentMonthStr]);

    // Interaction Logic
    const [activeCell, setActiveCell] = useState(null);
    const [hoveredCell, setHoveredCell] = useState(null);
    const popoverRef = useRef(null);

    // Close popover when clicking outside
    useEffect(() => {
        if (!activeCell) return;
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setActiveCell(null);
            }
        };
        const timerId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);
        return () => {
            clearTimeout(timerId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeCell]);

    const handleCellClick = (e, memberId, dateStr, type) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveCell({ memberId, date: dateStr, type });
    };

    const handleSelectStatus = (status) => {
        if (!activeCell) return;
        onToggleMeal(activeCell.memberId, activeCell.date, activeCell.type, status);
        setActiveCell(null);
    };

    return (
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-[2rem] shadow-premium dark:shadow-premium-dark flex flex-col relative max-h-[700px]">
            <div className="overflow-auto custom-scrollbar flex-1 rounded-t-[2rem]">
                <table className="w-full text-[10px] md:text-xs border-collapse bg-transparent transition-colors">
                    <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 sticky top-0 z-20">
                            <th className="p-4 border-r border-slate-100 dark:border-white/5 text-left min-w-[180px] sticky left-0 bg-slate-50 dark:bg-slate-900 z-30 font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Inventory Registry</th>
                            {days.map(day => {
                                const isToday = day.dateStr === todayStr;
                                return (
                                    <th
                                        key={day.dayNum}
                                        className={cn(
                                            "p-1 border-r border-slate-100 dark:border-white/5 w-10 font-black transition-all relative",
                                            isToday
                                                ? 'bg-primary-600 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                                : hoveredCell?.dayNum === day.dayNum
                                                    ? 'bg-primary-500 text-white'
                                                    : 'text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-950/40'
                                        )}
                                    >
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span>{day.dayNum}</span>
                                            {isToday && (
                                                <span className="text-[6px] text-white/80 font-black tracking-tighter animate-pulse">
                                                    NOW
                                                </span>
                                            )}
                                        </div>
                                        {isToday && (
                                            <div className="absolute inset-0 border-x-2 border-primary-400/30 pointer-events-none"></div>
                                        )}
                                    </th>
                                );
                            })}
                            <th className="p-4 min-w-[100px] font-black bg-slate-50 dark:bg-slate-900 text-primary-600 dark:text-primary-400 uppercase tracking-widest text-center">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(members || []).map(member => (
                            <React.Fragment key={member._id || member.id}>
                                <MealRow
                                    member={member}
                                    type="lunch"
                                    days={days}
                                    getStatus={getStatus}
                                    todayStr={todayStr}
                                    calculateTotal={calculateTotal}
                                    onCellClick={handleCellClick}
                                    onCellMouseEnter={setHoveredCell}
                                    onCellMouseLeave={() => setHoveredCell(null)}
                                    hoveredCell={hoveredCell}
                                />
                                <MealRow
                                    member={member}
                                    type="dinner"
                                    days={days}
                                    getStatus={getStatus}
                                    todayStr={todayStr}
                                    calculateTotal={calculateTotal}
                                    onCellClick={handleCellClick}
                                    onCellMouseEnter={setHoveredCell}
                                    onCellMouseLeave={() => setHoveredCell(null)}
                                    hoveredCell={hoveredCell}
                                />
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 rounded-b-[2rem] z-20 relative">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Presence</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/5 flex items-center justify-center">
                            <X size={14} className="text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Absence Registry</span>
                    </div>
                </div>

                <div className="flex items-center gap-8 bg-white dark:bg-slate-950 p-2 pl-6 pr-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Aggregate Throughput</p>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tighter text-right">{monthlyGrandTotal} <span className="text-[10px] font-bold text-slate-400 ml-1 tracking-normal">MEALS</span></p>
                    </div>
                    <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <TrendingUp size={20} className="text-white" />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {activeCell && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveCell(null)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            ref={popoverRef}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-sm"
                        >
                            <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-[2.5rem] border border-slate-100 dark:border-white/10 p-8 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                    <TrendingUp size={120} className="text-primary-500" />
                                </div>

                                <div className="text-center mb-8">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Sparkles size={16} className="text-primary-500" />
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Logistics Update</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                                        {(members || []).find(m => (m._id || m.id) === activeCell?.memberId)?.name}'s {activeCell?.type === 'lunch' ? '🌞 Lunch' : '🌙 Dinner'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                                        Recording for {activeCell?.date ? format(parseISO(activeCell.date), 'dd MMMM yyyy') : 'Loading...'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleSelectStatus(true)}
                                        className="flex flex-col items-center justify-center gap-4 p-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl transition-all active:scale-95 shadow-xl shadow-emerald-500/20 group/btn"
                                    >
                                        <div className="p-3 bg-white/20 rounded-2xl group-hover/btn:scale-110 transition-transform">
                                            <Check size={28} strokeWidth={3} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Record Presence</span>
                                    </button>
                                    <button
                                        onClick={() => handleSelectStatus(false)}
                                        className="flex flex-col items-center justify-center gap-4 p-6 bg-rose-500 hover:bg-rose-600 text-white rounded-3xl transition-all active:scale-95 shadow-xl shadow-rose-500/20 group/btn"
                                    >
                                        <div className="p-3 bg-white/20 rounded-2xl group-hover/btn:scale-110 transition-transform">
                                            <X size={28} strokeWidth={3} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Record Absence</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => setActiveCell(null)}
                                    className="w-full mt-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MealMonthlySheet;
