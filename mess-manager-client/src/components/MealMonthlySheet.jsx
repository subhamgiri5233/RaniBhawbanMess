import React, { useMemo, useState, useRef, useEffect } from 'react';
import { getDaysInMonth, format, parseISO } from 'date-fns';
import { Check, X, Info, TrendingUp, Sparkles, Drumstick } from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';

const MealCell = React.memo(({
    day,
    memberId,
    todayStr,
    onClick,
    onMouseEnter,
    onMouseLeave,
    isHoveredRowDay,
    isEditable,
    isMeatDay,
    lunchStatus,
    lunchNum,
    dinnerStatus,
    dinnerNum
}) => {
    const isToday = day.dateStr === todayStr;

    const handleAction = (e, type) => {
        if (!isEditable) return;
        onClick(e, memberId, day.dateStr, type);
    };

    return (
        <td
            className={cn(
                "p-1 border-r border-indigo-300/20 dark:border-white/5 text-center transition-all relative group/cell",
                isEditable ? "cursor-pointer" : "cursor-not-allowed opacity-40",
                isToday && "bg-primary-500/10 dark:bg-primary-500/5",
                !isToday && isHoveredRowDay && "bg-indigo-300/30 dark:bg-slate-800/20",
                !isToday && isMeatDay && "bg-orange-500/[0.04] dark:bg-orange-500/[0.03]",
                !isToday && !isMeatDay && format(parseISO(day.dateStr), 'i') === '7' && "bg-rose-500/[0.03] dark:bg-rose-500/[0.02]"
            )}
            onMouseEnter={() => onMouseEnter({ dateStr: day.dateStr, dayNum: day.dayNum, memberId })}
            onMouseLeave={onMouseLeave}
        >
            <div className="flex flex-col gap-1 items-center justify-center">
                {/* Lunch Indicator with Cumulative Running Number */}
                <div
                    onClick={(e) => handleAction(e, 'lunch')}
                    className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-[9.5px] font-black transition-all",
                        lunchStatus
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                            : (!lunchStatus && day.dateStr <= todayStr)
                                ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                                : "bg-slate-200/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                    title={`Lunch: ${lunchStatus ? `Meal #${lunchNum}` : 'Off'}`}
                >
                    {lunchStatus ? lunchNum : '✕'}
                </div>

                {/* Dinner Indicator with Cumulative Running Number */}
                <div
                    onClick={(e) => handleAction(e, 'dinner')}
                    className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-[9.5px] font-black transition-all",
                        dinnerStatus
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                            : (!dinnerStatus && day.dateStr <= todayStr)
                                ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                                : "bg-slate-200/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                    title={`Dinner: ${dinnerStatus ? `Meal #${dinnerNum}` : 'Off'}`}
                >
                    {dinnerStatus ? dinnerNum : '✕'}
                </div>
            </div>
        </td>
    );
});

const MealRow = React.memo(({ member, days, getStatus, todayStr, total, onCellClick, onCellMouseEnter, onCellMouseLeave, hoveredCell, editableMemberId, meatDaysSet }) => {
    const mId = member._id || member.id;
    const isEditable = !editableMemberId || String(editableMemberId) === String(mId);

    // Compute cumulative running meal numbers for this member across the month
    let runningCount = 0;
    const dayMealData = days.map(day => {
        const lunchStatus = getStatus(mId, day.dateStr, 'lunch');
        let lunchNum = null;
        if (lunchStatus) {
            runningCount++;
            lunchNum = runningCount;
        }

        const dinnerStatus = getStatus(mId, day.dateStr, 'dinner');
        let dinnerNum = null;
        if (dinnerStatus) {
            runningCount++;
            dinnerNum = runningCount;
        }

        return {
            lunchStatus,
            lunchNum,
            dinnerStatus,
            dinnerNum
        };
    });

    return (
        <tr className={cn(
            "border-b group transition-colors border-indigo-300/20 dark:border-white/5",
            isEditable ? "hover:bg-indigo-300/30 dark:hover:bg-white/5" : "opacity-40 grayscale-[0.3]"
        )}>
            <td className={cn(
                "p-2 sm:p-4 min-w-[120px] sm:min-w-[170px] border-r border-indigo-400/30 dark:border-white/5 font-black sticky left-0 z-20 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.08)] transition-colors text-xs sm:text-sm",
                isEditable 
                    ? "bg-indigo-300/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100" 
                    : "bg-indigo-300/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-500 cursor-not-allowed"
            )}>
                <div className="flex flex-col">
                    <span className="font-black truncate">{member.name}</span>
                    <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Cumulative Meals</span>
                </div>
            </td>
            {days.map((day, idx) => {
                const parsedDate = parseISO(day.dateStr);
                const dayNameFull = format(parsedDate, 'EEEE').toLowerCase();
                const dayNameShort = format(parsedDate, 'EEE').toLowerCase();
                const isMeatDay = meatDaysSet.has(dayNameFull) || meatDaysSet.has(dayNameShort);
                const mealData = dayMealData[idx];

                return (
                    <MealCell
                        key={`${mId}-${day.dayNum}`}
                        day={day}
                        memberId={mId}
                        todayStr={todayStr}
                        onClick={onCellClick}
                        onMouseEnter={onCellMouseEnter}
                        onMouseLeave={onCellMouseLeave}
                        isHoveredRowDay={hoveredCell?.dayNum === day.dayNum}
                        isEditable={isEditable}
                        isMeatDay={isMeatDay}
                        lunchStatus={mealData.lunchStatus}
                        lunchNum={mealData.lunchNum}
                        dinnerStatus={mealData.dinnerStatus}
                        dinnerNum={mealData.dinnerNum}
                    />
                );
            })}
            <td className="p-4 text-center font-black backdrop-blur-sm bg-indigo-300/30 dark:bg-indigo-500/5">
                <div className="text-sm text-indigo-600 dark:text-indigo-400">{total}</div>
                <div className="text-[7px] font-black text-slate-400 uppercase tracking-tight mt-0.5">Total meals</div>
            </td>
        </tr>
    );
});

const MealMonthlySheet = ({ members, meals, selectedDate, onToggleMeal, editableMemberId }) => {
    const { settings } = useData();

    // Get weekly meat day from system settings (default: Sunday)
    const meatDaysSet = useMemo(() => {
        if (!settings || !Array.isArray(settings)) return new Set(['sunday', 'sun']);
        const s = settings.find(item => item.key === 'weekly_meat_day');
        const raw = s?.value || 'Sunday';
        const list = raw.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
        return new Set(list.length > 0 ? list : ['sunday', 'sun']);
    }, [settings]);

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

    // 3. Optimized Meal Lookup using a Map
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

    // 4. Calculate All Member Totals in ONE PASS
    const currentMonthStr = useMemo(() => format(currentDate, 'yyyy-MM'), [currentDate]);
    
    const { memberTotals, monthlyGrandTotal } = useMemo(() => {
        const totals = {};
        let grandTotal = 0;
        const currentMemberIds = new Set((members || []).map(m => m._id || m.id));
        
        currentMemberIds.forEach(id => totals[id] = 0);
        
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

    const handleCellClick = (e, memberId, date, type) => {
        setActiveCell({
            memberId,
            date,
            type,
            currentStatus: getStatus(memberId, date, type)
        });
    };

    const handleSelectStatus = async (status) => {
        if (!activeCell) return;
        const { memberId, date, type } = activeCell;
        setActiveCell(null);
        await onToggleMeal(memberId, date, type, status);
    };

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

    // Memoized Grid
    const MealGrid = useMemo(() => {
        return (
            <table className="w-full text-[10px] md:text-xs border-collapse bg-transparent transition-colors">
                <thead>
                    <tr className="bg-indigo-300/40 dark:bg-slate-900/80 backdrop-blur-md border-b border-indigo-300/30 dark:border-white/5 sticky top-0 z-20">
                        <th className="p-4 border-r border-indigo-400/30 dark:border-white/5 text-left min-w-[180px] sticky left-0 bg-indigo-300/60 dark:bg-slate-900 z-30 font-black uppercase tracking-widest text-indigo-800/60 dark:text-slate-400">Member Attendance</th>
                        {days.map(day => {
                            const isToday = day.dateStr === todayStr;
                            const parsedDate = parseISO(day.dateStr);
                            const dayNameFull = format(parsedDate, 'EEEE').toLowerCase();
                            const dayNameShort = format(parsedDate, 'EEE').toLowerCase();
                            const isMeatDay = meatDaysSet.has(dayNameFull) || meatDaysSet.has(dayNameShort);
                            const isSunday = format(parsedDate, 'i') === '7';

                            return (
                                <th
                                    key={day.dayNum}
                                    className={cn(
                                        "p-1 border-r border-indigo-300/30 dark:border-white/5 w-10 font-black transition-all relative",
                                        isToday
                                            ? 'bg-primary-600 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                            : hoveredCell?.dayNum === day.dayNum
                                                ? 'bg-primary-500 text-white'
                                                : isMeatDay
                                                    ? 'bg-orange-500/10 dark:bg-orange-500/5 text-orange-600 dark:text-orange-400'
                                                    : 'text-indigo-600/60 dark:text-slate-500 bg-indigo-300/30 dark:bg-slate-950/40'
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-0">
                                        <span className={cn(
                                            "text-[6px] uppercase font-black tracking-tighter mb-[2px]",
                                            isMeatDay 
                                                ? "text-orange-500 dark:text-orange-400 opacity-100 font-extrabold" 
                                                : isSunday 
                                                    ? "text-rose-500 dark:text-rose-400 opacity-100" 
                                                    : "opacity-60"
                                        )}>
                                            {format(parsedDate, 'EEE')}
                                        </span>
                                        <span className={cn(
                                            "flex items-center justify-center w-5 h-5 rounded-full transition-all text-[9.5px]",
                                            isMeatDay && !isToday && "bg-orange-500 text-white shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/40",
                                            !isMeatDay && isSunday && !isToday && "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
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
                            meatDaysSet={meatDaysSet}
                        />
                    ))}
                </tbody>
            </table>
        );
    }, [sortedMembers, days, getStatus, todayStr, memberTotals, handleCellClick, hoveredCell, editableMemberId, meatDaysSet]);

    // Pre-calculate popup labels
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

            <div className="p-5 sm:p-6 bg-indigo-300/30 dark:bg-slate-900/80 backdrop-blur-md border-t border-indigo-300/40 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 rounded-b-[2rem] z-20 relative">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-[10px]">
                            1
                        </div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Lunch (#Count)</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px]">
                            2
                        </div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Dinner (#Count)</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-[11px]">
                            ✕
                        </div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Meal Off</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
                            <Drumstick size={13} />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">Weekly Meat Day</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-indigo-300/40 dark:bg-slate-950 p-2 pl-5 pr-2 rounded-2xl border border-indigo-300/40 dark:border-white/5 shadow-sm">
                    <div>
                        <p className="text-[8px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Total Meals This Month</p>
                        <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tighter text-right">{monthlyGrandTotal} <span className="text-[10px] font-bold text-slate-500 ml-1 tracking-normal">MEALS</span></p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 shrink-0">
                        <TrendingUp size={18} className="text-white" />
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
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.3em]">Attendance Update</span>
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
                                    <span className="font-extrabold text-sm uppercase tracking-wider">Meal Taken</span>
                                </button>

                                <button
                                    onClick={() => handleSelectStatus(false)}
                                    className="flex flex-col items-center justify-center gap-4 p-6 bg-rose-500 hover:bg-rose-600 text-white rounded-3xl transition-all active:scale-95 shadow-xl shadow-rose-500/20 group/btn"
                                >
                                    <div className="p-3 bg-indigo-900/40 rounded-2xl group-hover/btn:scale-110 transition-transform">
                                        <X size={28} strokeWidth={3} />
                                    </div>
                                    <span className="font-extrabold text-sm uppercase tracking-wider">Meal Off</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MealMonthlySheet;
