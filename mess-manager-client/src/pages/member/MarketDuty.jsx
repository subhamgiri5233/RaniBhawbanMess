import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { ShoppingCart, Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Lock, X, Info, Utensils, Sparkles, TrendingUp, Inbox } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils'; // Assuming cn is imported from utils

const MarketDuty = () => {
    const {
        marketSchedule, allocateMarketDay, approveMarketRequest,
        rejectMarketRequest, members, managerAllocation,
        refreshData, globalMonth, setGlobalMonth
    } = useData();
    const { user, isLoading } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Sync currentDate with globalMonth
    useEffect(() => {
        const [y, m] = globalMonth.split('-').map(Number);
        if (currentDate.getFullYear() !== y || currentDate.getMonth() !== (m - 1)) {
            setCurrentDate(new Date(y, m - 1, 1));
        }
    }, [globalMonth]);

    // Ensure latest data is loaded when visiting this page
    useEffect(() => {
        refreshData();
    }, []);

    if (isLoading || !user) {
        return <div className="flex items-center justify-center min-h-[500px] text-slate-500">Loading Market Data...</div>;
    }

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const monthKey = format(monthStart, 'yyyy-MM');
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Month navigation handlers
    const updateGlobalMonthFromDate = (date) => {
        const newMonthKey = format(date, 'yyyy-MM');
        setGlobalMonth(newMonthKey);
    };

    const goToPreviousMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        updateGlobalMonthFromDate(newDate);
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
        updateGlobalMonthFromDate(newDate);
    };

    const goToCurrentMonth = () => {
        const today = new Date();
        updateGlobalMonthFromDate(today);
    };

    // Check if viewing current or past month - use a stable reference
    const today = new Date();
    const todayMonthKey = format(today, 'yyyy-MM');
    const isCurrentMonth = monthKey === todayMonthKey;
    const isPastMonth = monthKey < todayMonthKey;

    // Calendar grid alignment - add empty cells before first day
    const firstDayOfMonth = monthStart.getDay(); // 0 = Sunday
    const emptySlots = Array(firstDayOfMonth).fill(null);

    const currentMonthSchedule = marketSchedule[monthKey] || [];

    // Manager View Logic
    const currentManagerId = managerAllocation[monthKey];
    const isAdmin = user.role === 'admin';
    // isManager: actual assigned manager OR admin (both can approve/reject requests)
    const isAssignedManager = currentManagerId && user.id === currentManagerId;
    const isManager = isAssignedManager || isAdmin;
    // isReadOnlyAdmin: admin who is NOT the actual manager cannot manually assign days on calendar
    const isReadOnlyAdmin = isAdmin && !isAssignedManager;

    // Helper to see who has a date
    const getDayInfo = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return currentMonthSchedule.find(d => d.date === dateStr);
    };

    const handleDayClick = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayInfo = getDayInfo(date);

        // Prevent requests in past months
        if (isPastMonth) {
            alert('⚠️ Cannot request days in past months');
            return;
        }

        // If member clicks on their own pending request, allow them to cancel it
        if (dayInfo && dayInfo.assignedMemberId === user.id && dayInfo.status === 'pending' && !isManager) {
            if (window.confirm('Cancel your pending request for this date?')) {
                rejectMarketRequest(dateStr);
            }
            return;
        }

        // Don't allow clicking on already assigned/approved dates or others' requests
        if (dayInfo) {
            return;
        }

        // Check 4-day limit for members
        if (!isManager && myRequestsThisMonth >= 4) {
            alert('⚠️ You can only request maximum 4 days per month');
            return;
        }

        // Admin view is read-only unless they are the active manager
        if (isReadOnlyAdmin) {
            return;
        }

        if (isManager) {
            // Managers assign directly
            allocateMarketDay(dateStr, user.id, 'manual_assign');
        } else {
            // Members request
            allocateMarketDay(dateStr, user.id, 'request', currentManagerId);
        }
    };

    const getMemberName = (id) => members.find(m => (m._id === id || m.id === id))?.name;

    const getMemberColor = (id) => {
        const colors = [
            { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-500/20', border: 'border-indigo-200 dark:border-indigo-500/30' },
            { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/30' },
            { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/20', border: 'border-rose-200 dark:border-rose-500/30' },
            { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/30' },
            { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/20', border: 'border-purple-200 dark:border-purple-500/30' },
            { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-500/20', border: 'border-sky-200 dark:border-sky-500/30' },
            { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/20', border: 'border-orange-200 dark:border-orange-500/30' },
            { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-500/20', border: 'border-pink-200 dark:border-pink-500/30' }
        ];
        // Simple hash for consistent coloring per member
        const hash = (id || '').toString().split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        return colors[hash % colors.length];
    };

    // Calculate my requests (pending + approved) for 4-day limit
    const myRequestsThisMonth = currentMonthSchedule.filter(d => d.assignedMemberId === user.id).length;
    const canRequestMore = myRequestsThisMonth < 4 && !isPastMonth;

    // Calculate my approved days
    const myDaysCount = currentMonthSchedule.filter(d => d.assignedMemberId === user.id && d.status === 'approved').length;

    // Pending Requests for Manager
    const pendingRequests = currentMonthSchedule.filter(d => d.status === 'pending');

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/90 dark:bg-slate-900 border-l-8 border-l-indigo-600 shadow-sm p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-indigo-100/50 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Market Duty</h1>
                    <p className="text-[10px] md:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Reserve your dates for mess collection</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {isAdmin && !isManager && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-500/10 border border-slate-500/20 rounded-2xl">
                            <Lock size={16} className="text-slate-500" />
                            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Admin Read-Only</span>
                        </div>
                    )}
                    {!isAdmin && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Monthly Quota</span>
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">{myRequestsThisMonth} / 4 Slots Used</span>
                            </div>
                        </div>
                    )}
                    {!isAdmin && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Confirmed Days</span>
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{myDaysCount} Finalized</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Manager Request Handler */}
            {/* Manager Request Handler */}
            <AnimatePresence>
                {isManager && pendingRequests.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="p-8 border-l-8 border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 shadow-xl shadow-amber-500/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Inbox size={120} className="text-amber-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                                    <Sparkles size={20} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-black text-amber-900 dark:text-amber-500 uppercase tracking-[0.2em] text-xs">Awaiting Approval</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pendingRequests.map(req => (
                                    <motion.div
                                        key={req.date}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-premium border border-amber-100 dark:border-amber-500/10 group/item hover:scale-[1.02] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-lg shadow-sm border border-amber-200/50 dark:border-amber-500/20">
                                                {getMemberName(req.assignedMemberId)?.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-black block text-slate-800 dark:text-slate-100 text-sm tracking-tight">{getMemberName(req.assignedMemberId)}</span>
                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                    <CalendarIcon size={10} /> {format(new Date(req.date), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="text-slate-300 hover:text-rose-500 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-90"
                                                onClick={() => rejectMarketRequest(req.date)}
                                            >
                                                <X size={20} />
                                            </button>
                                            <button
                                                className="text-slate-300 hover:text-emerald-500 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all active:scale-90"
                                                onClick={() => approveMarketRequest(req.date)}
                                            >
                                                <Check size={20} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Card className="p-4 md:p-8 border-slate-200/60 dark:border-white/5 dark:bg-slate-900/50 shadow-sm bg-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl md:p-1.5 md:rounded-2xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-between sm:justify-start">
                            <button
                                onClick={goToPreviousMonth}
                                className="p-1.5 md:p-2 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg md:rounded-xl transition-all shadow-sm hover:shadow-md"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="px-3 md:px-6 flex items-center gap-2">
                                <CalendarIcon className="text-primary-500 hidden sm:block" size={18} />
                                <h2 className="text-sm md:text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight whitespace-nowrap">
                                    {format(monthStart, 'MMMM yyyy')}
                                </h2>
                                {isPastMonth && <Lock size={14} className="text-slate-400 -mt-1" />}
                            </div>
                            <button
                                onClick={goToNextMonth}
                                className="p-1.5 md:p-2 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg md:rounded-xl transition-all shadow-sm hover:shadow-md"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        {!isCurrentMonth && (
                            <button
                                onClick={goToCurrentMonth}
                                className="w-full sm:w-auto px-4 py-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-all border border-primary-200/50 dark:border-primary-500/30"
                            >
                                Current
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-center md:justify-end">
                        {!isAdmin && (
                            <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl border border-amber-200 dark:border-amber-500/30">
                                Requests: <span className="text-sm md:text-lg leading-none align-middle ml-1">{myRequestsThisMonth}</span>/4
                            </div>
                        )}
                        {!isAdmin && (
                            <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                                Duties: <span className="text-sm md:text-lg leading-none align-middle ml-1">{myDaysCount}</span>
                            </div>
                        )}
                    </div>
                </div>

                {isPastMonth && (
                    <div className="mb-4 bg-gray-100 border border-gray-300 rounded-lg p-3 flex items-center gap-2">
                        <Lock size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-600 font-medium">Read-only: Past month view</span>
                    </div>
                )}

                <div className="grid grid-cols-7 gap-1 md:gap-4 text-center mb-6">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={day} className={`text-[9px] md:text-[11px] font-black uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-white/5 ${i === 0 || i === 6 ? 'text-rose-400 dark:text-rose-500/40' : 'text-slate-300 dark:text-slate-600'}`}>
                            <span className="hidden md:inline">
                                {i === 0 ? 'Sun' : i === 1 ? 'Mon' : i === 2 ? 'Tue' : i === 3 ? 'Wed' : i === 4 ? 'Thu' : i === 5 ? 'Fri' : 'Sat'}
                            </span>
                            <span className="md:hidden">{day}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 md:gap-3">
                    {/* Empty cells for calendar alignment */}
                    {emptySlots.map((_, idx) => (
                        <div key={`empty-${idx}`} className="h-20 md:h-32 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl md:rounded-2xl border border-slate-100/50 dark:border-slate-800/30"></div>
                    ))}
                    {days.map((day, dayIdx) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const info = getDayInfo(day);
                        const isMine = info?.assignedMemberId === user.id;

                        // Status Logic
                        const isApproved = info?.status === 'approved';
                        const isRequested = info?.status === 'pending';
                        const isTaken = isApproved && !isMine; // Taken by others
                        const isPending = isRequested && !isMine; // Pending by others

                        return (
                            <motion.button
                                key={dateStr}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: dayIdx * 0.01 }}
                                onClick={() => handleDayClick(day)}
                                disabled={isPastMonth || (info && !(info.assignedMemberId === user.id && info.status === 'pending' && !isManager))}
                                className={cn(
                                    "h-20 md:h-32 p-2 md:p-4 rounded-xl md:rounded-3xl border-2 flex flex-col items-start justify-between transition-all relative overflow-hidden group/day",
                                    isToday(day) && "ring-2 md:ring-4 ring-primary-500/20 border-primary-500/50 shadow-lg md:shadow-xl shadow-primary-500/10",
                                    // ME
                                    isMine && isApproved && "bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-transparent shadow-xl md:shadow-2xl shadow-indigo-500/30 active:scale-95",
                                    isMine && isRequested && "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 border-dashed animate-pulse-subtle",
                                    // OTHERS
                                    isTaken && "bg-slate-50 dark:bg-slate-950/20 text-slate-300 dark:text-slate-700 cursor-not-allowed border-slate-100 dark:border-white/5",
                                    isPending && "bg-slate-50/50 dark:bg-slate-950/10 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-white/5 border-dashed",
                                    // EMPTY
                                    !info && !isPastMonth && "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-xl md:hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-1.5 cursor-pointer active:scale-95",
                                    // PAST MONTH
                                    !info && isPastMonth && "bg-slate-100/50 dark:bg-slate-950/40 text-slate-200 dark:text-slate-800 cursor-not-allowed border-slate-50 dark:border-slate-900/40"
                                )}
                            >
                                <div className="flex w-full justify-between items-start">
                                    <span className={cn(
                                        "text-sm font-black transition-colors",
                                        (isMine && isApproved) ? "text-white" : isToday(day) ? "text-primary-600 dark:text-primary-400" : "text-slate-700 dark:text-slate-400 group-hover/day:text-primary-500"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {isToday(day) && (
                                        <div className="bg-primary-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary-500/50">
                                            Today
                                        </div>
                                    )}
                                </div>

                                {info ? (
                                    (() => {
                                        const memberColor = getMemberColor(info.assignedMemberId);
                                        return (
                                            <div className="w-full">
                                                <div className="flex items-center gap-1.5 md:gap-2 mt-1 min-w-0">
                                                    <div className={cn(
                                                        "w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center text-[8px] md:text-[10px] font-black shadow-sm group-hover/day:scale-110 transition-transform duration-500",
                                                        (isMine && isApproved) ? "bg-white/20 text-white border border-white/30 backdrop-blur-md" : `${memberColor.bg} ${memberColor.text} border ${memberColor.border}`
                                                    )}>
                                                        {getMemberName(info.assignedMemberId)?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn(
                                                            "text-[8px] md:text-[10px] font-black truncate transition-colors tracking-tight hidden sm:block",
                                                            (isMine && isApproved) ? "text-white" : "text-slate-900 dark:text-slate-100"
                                                        )}>
                                                            {getMemberName(info.assignedMemberId)}
                                                        </span>
                                                        {isRequested && (
                                                            <span className={cn(
                                                                "text-[6px] md:text-[7px] font-black uppercase tracking-widest px-1 md:px-1.5 py-0.5 rounded-md w-fit mt-0.5",
                                                                isMine ? "bg-amber-400 text-amber-950 shadow-sm animate-pulse" : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500"
                                                            )}>
                                                                {isMine ? (window.innerWidth < 640 ? 'Mine' : 'Your Req') : 'Pending'}
                                                            </span>
                                                        )}
                                                        {isApproved && !isMine && (
                                                            <span className="text-[6px] md:text-[7px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mt-0.5 hidden sm:block">
                                                                Reserved
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="w-full self-center mt-2 opacity-0 group-hover/day:opacity-100 transition-all duration-300 flex flex-col items-center gap-1 scale-75 group-hover/day:scale-100">
                                        <div className="p-2 bg-primary-50 dark:bg-primary-950/40 rounded-xl">
                                            <ShoppingCart size={16} className="text-primary-500" />
                                        </div>
                                        <span className="text-[8px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Reserve</span>
                                    </div>
                                )}

                                {isMine && isApproved && (
                                    <div className="absolute -top-1 -right-1">
                                        <div className="bg-indigo-400 p-2 rounded-bl-3xl shadow-lg border-b border-l border-white/20">
                                            <Check size={14} className="text-white font-black" />
                                        </div>
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </Card>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-slate-900/50 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-sm border border-slate-200/50 dark:border-white/10 relative overflow-hidden group border-l-8 border-l-indigo-600"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-all duration-1000"></div>

                <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-white/5 backdrop-blur-md flex items-center justify-center shadow-sm relative z-10 border border-indigo-100 dark:border-white/20">
                    <Utensils className="text-indigo-600 dark:text-white/80" size={42} />
                </div>

                <div className="relative z-10 text-center md:text-left flex-1">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <h3 className="font-black text-indigo-900 dark:text-white uppercase tracking-[0.3em] text-[10px]">Mess Protocol</h3>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Market Duty</h2>
                    <p className="text-sm text-slate-500 dark:text-indigo-100/70 font-bold leading-relaxed max-w-lg">
                        Ensure all market duty requests are coordinated with the monthly <span className="text-indigo-600 dark:text-white underline decoration-indigo-400 decoration-2 underline-offset-4">Mess Manager</span>. Approved duties are final and essential for system transparency.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3 self-center md:self-end">
                    <div className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:-translate-y-1 transition-all cursor-default">
                        System Active
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MarketDuty;
