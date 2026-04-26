import React, { useMemo, useState, useRef, useEffect } from 'react';
import { getDaysInMonth, format, parseISO } from 'date-fns';
import { Check, X, Info, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

const MealCell = React.memo(({ day, memberId, getStatus, todayStr, onClick, onMouseEnter, onMouseLeave, isHoveredRowDay, isEditable }) => {
    const lunchStatus = getStatus(memberId, day.dateStr, 'lunch');
    const dinnerStatus = getStatus(memberId, day.dateStr, 'dinner');
    const isToday = day.dateStr === todayStr;

    const handleAction = (e, type) => {
        if (!isEditable) return;
        onClick(e, memberId, day.dateStr, type);
    };

    return (
        <td
            className={cn(
                "p-1.5 border-r border-indigo-300/20 dark:border-white/5 text-center transition-all relative group/cell",
                isEditable ? "cursor-pointer" : "cursor-not-allowed opacity-40",
                isToday && "bg-primary-500/10 dark:bg-primary-500/5",
                !isToday && isHoveredRowDay && "bg-indigo-300/30 dark:bg-slate-800/20",
                !isToday && format(parseISO(day.dateStr), 'i') === '7' && "bg-rose-500/[0.03] dark:bg-rose-500/[0.02]"
            )}
            onMouseEnter={() => onMouseEnter({ dateStr: day.dateStr, dayNum: day.dayNum, memberId })}
            onMouseLeave={onMouseLeave}
        >
            <div className="flex flex-col gap-1.5 items-center justify-center">
                {/* Lunch Indicator */}
                <div
                    onClick={(e) => handleAction(e, 'lunch')}
                    className={cn(
                        "w-5 h-5 rounded-[0.4rem] flex items-center justify-center transition-all duration-300 relative z-10",
                        lunchStatus
                            ? "bg-emerald-400/30 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            : (!lunchStatus && day.dateStr < todayStr)
                                ? "bg-rose-400/30 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"
                                : "bg-indigo-400/20 dark:bg-slate-900/50 text-indigo-500/60 dark:text-slate-600 hover:scale-125 hover:bg-indigo-400/30"
                    )}
                    title="Lunch"
                >
                    {lunchStatus ? <Check size={10} strokeWidth={3} /> : <X size={8} strokeWidth={3} />}
                </div>
                {/* Dinner Indicator */}
                <div
                    onClick={(e) => handleAction(e, 'dinner')}
                    className={cn(
                        "w-5 h-5 rounded-[0.4rem] flex items-center justify-center transition-all duration-300 relative z-10",
                        dinnerStatus
                            ? "bg-indigo-400/30 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400"
                            : (!dinnerStatus && day.dateStr < todayStr)
                                ? "bg-rose-400/30 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"
                                : "bg-indigo-400/20 dark:bg-slate-900/50 text-indigo-500/60 dark:text-slate-600 hover:scale-125 hover:bg-indigo-400/30"
                    )}
                    title="Dinner"
                >
                    {dinnerStatus ? <Check size={10} strokeWidth={3} /> : <X size={8} strokeWidth={3} />}
                </div>
            </div>
        </td>
    );
});

const MealRow = React.memo(({ member, days, getStatus, todayStr, total, onCellClick, onCellMouseEnter, onCellMouseLeave, hoveredCell, editableMemberId }) => {
    const mId = member._id || member.id;
    const isEditable = !editableMemberId || String(editableMemberId) === String(mId);

    return (
        <tr className={cn(
            "border-b group transition-colors border-indigo-300/20 dark:border-white/5",
            isEditable ? "hover:bg-indigo-300/30 dark:hover:bg-white/5" : "opacity-40 grayscale-[0.3]"
        )}>
            <td className={cn(
                "p-4 min-w-[170px] border-r border-indigo-400/30 dark:border-white/5 font-black sticky left-0 z-20 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.08)] transition-colors",
                isEditable 
                    ? "bg-indigo-300/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100" 
                    : "bg-indigo-300/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-500 cursor-not-allowed"
            )}>
                <div className="flex flex-col">
                    <span className="font-black">{member.name}</span>
                    <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">L & D Registry</span>
                </div>
            </td>
            {days.map(day => (
                <MealCell
                    key={`${mId}-${day.dayNum}`}
                    day={day}
                    memberId={mId}
                    getStatus={getStatus}
                    todayStr={todayStr}
                    onClick={onCellClick}
                    onMouseEnter={onCellMouseEnter}
                    onMouseLeave={onCellMouseLeave}
                    isHoveredRowDay={hoveredCell?.dayNum === day.dayNum}
                    isEditable={isEditable}
                />
            ))}
            <td className="p-4 text-center font-black backdrop-blur-sm bg-indigo-300/30 dark:bg-indigo-500/5">
                <div className="text-sm text-indigo-600 dark:text-indigo-400">{total}</div>
                <div className="text-[7px] font-black text-slate-400 uppercase tracking-tight mt-0.5">Total meals</div>
            </td>
        </tr>
    );
});

const MealMonthlySheet = ({ members, meals, selectedDate, onToggleMeal, editableMemberId }) => {
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

    // 4. Calculate All Member Totals in ONE PASS (O(N + M))
    const currentMonthStr = useMemo(() => format(currentDate, 'yyyy-MM'), [currentDate]);
    
    const { memberTotals, monthlyGrandTotal } = useMemo(() => {
        const totals = {};
        let grandTotal = 0;
        const currentMemberIds = new Set((members || []).map(m => m._id || m.id));
        
        // Initialize totals
        currentMemberIds.forEach(id => totals[id] = 0);
        
        // Single pass on meals
        (meals || []).forEach(m => {
            if (m && m.memberId && m.date && m.date.startsWith(currentMonthStr)) {
                if (totals[m.memberId] !== undefined) {
                    totals[m.memberId]++;
                    grandTotal++;
                }
            }
        });
        
        return { memberTotals: totals, monthlyGrandTotal: grandTotal };
    }, [meals, currentMonthStr, members]);

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

    // Sort members: editableMemberId first
    const sortedMembers = useMemo(() => {
        if (!editableMemberId || !members) return members;
        return [...members].sort((a, b) => {
            const aId = a._id || a.id;
            const bId = b._id || b.id;
            if (String(aId) === String(editableMemberId)) return -1;
            if (String(bId) === String(editableMemberId)) return 1;
            return 0;
        });
    }, [members, editableMemberId]);

    // 5. MEMOIZED GRID - THIS IS THE CRITICAL UI PERFORMANCE FIX
    // We isolate the grid so it only re-renders when data (meals/members) changes,
    // not when the 'activeCell' (popup) state changes.
    const MealGrid = useMemo(() => {
        return (
            <table className="w-full text-[10px] md:text-xs border-collapse bg-transparent transition-colors">
                <thead>
                    <tr className="bg-indigo-300/40 dark:bg-slate-900/80 backdrop-blur-md border-b border-indigo-300/30 dark:border-white/5 sticky top-0 z-20">
                        <th className="p-4 border-r border-indigo-400/30 dark:border-white/5 text-left min-w-[180px] sticky left-0 bg-indigo-300/60 dark:bg-slate-900 z-30 font-black uppercase tracking-widest text-indigo-800/60 dark:text-slate-400">Inventory Registry</th>
                        {days.map(day => {
                            const isToday = day.dateStr === todayStr;
                            return (
                                <th
                                    key={day.dayNum}
                                    className={cn(
                                        "p-1 border-r border-indigo-300/30 dark:border-white/5 w-10 font-black transition-all relative",
                                        isToday
                                            ? 'bg-primary-600 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                            : hoveredCell?.dayNum === day.dayNum
                                                ? 'bg-primary-500 text-white'
                                                : 'text-indigo-600/60 dark:text-slate-500 bg-indigo-300/30 dark:bg-slate-950/40'
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-0">
                                        <span className={cn(
                                            "text-[6px] uppercase font-black tracking-tighter mb-[2px]",
                                            format(parseISO(day.dateStr), 'i') === '7' ? "text-rose-500 dark:text-rose-400 opacity-100" : "opacity-60"
                                        )}>
                                            {format(parseISO(day.dateStr), 'EEE')}
                                        </span>
                                        <span className={cn(
                                            "flex items-center justify-center w-5 h-5 rounded-full transition-all",
                                            format(parseISO(day.dateStr), 'i') === '7' && !isToday && "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                        )}>
                                            {day.dayNum}
                                        </span>
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
                        <th className="p-4 min-w-[100px] font-black bg-indigo-300/60 dark:bg-slate-900 text-primary-600 dark:text-primary-400 uppercase tracking-widest text-center">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {(sortedMembers || []).map(member => (
                        <MealRow
                            key={member._id || member.id}
                            member={member}
                            days={days}
                            getStatus={getStatus}
                            todayStr={todayStr}
                            total={memberTotals[member._id || member.id] || 0}
                            onCellClick={handleCellClick}
                            onCellMouseEnter={setHoveredCell}
                            onCellMouseLeave={() => setHoveredCell(null)}
                            hoveredCell={hoveredCell}
                            editableMemberId={editableMemberId}
                        />
                    ))}
                </tbody>
            </table>
        );
    }, [sortedMembers, days, getStatus, todayStr, memberTotals, handleCellClick, hoveredCell, editableMemberId]);

    // Pre-calculate popup labels - extremely fast
    const popupLabel = useMemo(() => {
        if (!activeCell) return null;
        const member = (members || []).find(m => (m._id || m.id) === activeCell.memberId);
        return {
            name: member?.name || 'User',
            date: format(parseISO(activeCell.date), 'dd MMMM yyyy'),
            type: activeCell.type === 'lunch' ? '🌞 Lunch' : '🌙 Dinner'
        };
    }, [activeCell, members]);

    return (
        <div className="bg-indigo-300/40 dark:bg-slate-900/50 backdrop-blur-xl border border-indigo-400/30 dark:border-white/5 rounded-[1.5rem] shadow-[0_4px_24px_rgba(79,70,229,0.13)] dark:shadow-premium-dark flex flex-col relative max-h-[700px]">
            <div className="overflow-auto custom-scrollbar flex-1 rounded-t-[2rem]">
                {MealGrid}
            </div>

            <div className="p-6 bg-indigo-300/30 dark:bg-slate-900/80 backdrop-blur-md border-t border-indigo-300/40 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 rounded-b-[2rem] z-20 relative">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-400/30 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Check size={14} className="text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Active Presence</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-400/30 dark:bg-white/5 flex items-center justify-center">
                            <X size={14} className="text-indigo-600/60" />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Absence Registry</span>
                    </div>
                </div>

                <div className="flex items-center gap-8 bg-indigo-300/40 dark:bg-slate-950 p-2 pl-6 pr-2 rounded-2xl border border-indigo-300/40 dark:border-white/5 shadow-sm">
                    <div>
                        <p className="text-[8px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em] text-right">My Meals This Month</p>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tighter text-right">{monthlyGrandTotal} <span className="text-[10px] font-bold text-slate-500 ml-1 tracking-normal">MEALS</span></p>
                    </div>
                    <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <TrendingUp size={20} className="text-white" />
                    </div>
                </div>
            </div>

                {activeCell && popupLabel && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                        <div
                            onClick={() => setActiveCell(null)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <div
                            ref={popoverRef}
                            className="relative w-full max-w-sm"
                        >
                            <div className="bg-indigo-50 dark:bg-slate-900 shadow-2xl rounded-[1.5rem] border border-indigo-200 dark:border-white/10 p-8 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                    <TrendingUp size={120} className="text-primary-500" />
                                </div>

                                <div className="text-center mb-8">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Sparkles size={16} className="text-primary-500" />
                                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.3em]">Logistics Update</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                                        {popupLabel.name}'s {popupLabel.type}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                                        Recording for {popupLabel.date}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleSelectStatus(true)}
                                        className="flex flex-col items-center justify-center gap-4 p-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl transition-all active:scale-95 shadow-xl shadow-emerald-500/20 group/btn"
                                    >
                                        <div className="p-3 bg-indigo-900/40 rounded-2xl group-hover/btn:scale-110 transition-transform">
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
                                    className="w-full mt-6 py-4 bg-indigo-200/50 dark:bg-slate-800 text-indigo-700 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-300/50 dark:hover:bg-slate-700 transition-all active:scale-95"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default MealMonthlySheet;


