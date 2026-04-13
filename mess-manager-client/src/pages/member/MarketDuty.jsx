import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { ShoppingCart, Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Lock, X, Info, Utensils, Sparkles, TrendingUp, Inbox, User } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils'; // Assuming cn is imported from utils
import Modal from '../../components/ui/Modal';

const MarketDuty = () => {
    const {
        marketSchedule, allocateMarketDay, approveMarketRequest,
        rejectMarketRequest, members, managerAllocation,
        refreshData, globalMonth, setGlobalMonth, marketDutyLimits
    } = useData();
    const { user, isLoading } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModalDate, setSelectedModalDate] = useState(null);

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
    const getDaysInfo = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return currentMonthSchedule.filter(d => d.date === dateStr);
    };

    const handleDayClick = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayInfos = getDaysInfo(date);
        const approvedInfo = dayInfos.find(d => d.status === 'approved');

        // Prevent requests in past months
        if (isPastMonth) {
            alert('⚠️ Cannot request days in past months');
            return;
        }

        // Admin view opens member selection modal
        if (isAdmin) {
            setSelectedModalDate(date);
            setIsModalOpen(true);
            return;
        }

        // CUSTOMER/MEMBER LOGIC BELOW
        // If member clicks on their own pending request, allow them to cancel it
        const myPendingRequest = dayInfos.find(d => d.assignedMemberId === user.id && d.status === 'pending');
        if (myPendingRequest) {
            if (window.confirm('Cancel your pending request for this date?')) {
                rejectMarketRequest(myPendingRequest._id || myPendingRequest.id);
            }
            return;
        }

        // Don't allow clicking on already assigned/approved dates or others' requests
        if (approvedInfo) {
            return;
        }

        // Check member-specific limit (default 4)
        const myLimit = marketDutyLimits[user.id] || 4;
        if (myRequestsThisMonth >= myLimit) {
            alert(`⚠️ You can only request maximum ${myLimit} days per month`);
            return;
        }

        // Members request
        allocateMarketDay(dateStr, user.id, 'request', currentManagerId);
    };

    const getMemberName = (id) => {
        if (!id) return 'Unknown';
        if (id === 'OFF_DAY') return 'Mess Holiday';
        const member = members.find(m => (m._id === id || m.id === id));
        return member ? member.name : 'Unknown Member';
    };

    const getMemberColor = (id) => {
        if (id === 'OFF_DAY') {
            return { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-300/40 dark:bg-slate-500/20', border: 'border-slate-300/30 dark:border-slate-500/30' };
        }
        const colors = [
            { text: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-300/40 dark:bg-indigo-500/20', border: 'border-indigo-300/30 dark:border-indigo-500/30' },
            { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-300/40 dark:bg-emerald-500/20', border: 'border-emerald-300/30 dark:border-emerald-500/30' },
            { text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-300/40 dark:bg-rose-500/20', border: 'border-rose-300/30 dark:border-rose-500/30' },
            { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-300/40 dark:bg-amber-500/20', border: 'border-amber-300/30 dark:border-amber-500/30' },
            { text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-300/40 dark:bg-purple-500/20', border: 'border-purple-300/30 dark:border-purple-500/30' },
            { text: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-300/40 dark:bg-sky-500/20', border: 'border-sky-300/30 dark:border-sky-500/30' },
            { text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-300/40 dark:bg-orange-500/20', border: 'border-orange-300/30 dark:border-orange-500/30' },
            { text: 'text-pink-700 dark:text-pink-400', bg: 'bg-pink-300/40 dark:bg-pink-500/20', border: 'border-pink-300/30 dark:border-pink-500/30' }
        ];
        // Simple hash for consistent coloring per member
        const hash = (id || '').toString().split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        return colors[hash % colors.length];
    };

    // Calculate my requests (pending + approved) for dynamic limit
    const myLimit = marketDutyLimits[user.id] || 4;
    const myRequestsThisMonth = currentMonthSchedule.filter(d => 
        (d.assignedMemberId === user.id || d.memberId === user.id) && 
        (d.status === 'pending' || d.status === 'approved')
    ).length;
    const canRequestMore = myRequestsThisMonth < myLimit && !isPastMonth;

    // Calculate my approved days
    const myDaysCount = currentMonthSchedule.filter(d => 
        (d.assignedMemberId === user.id || d.memberId === user.id) && 
        d.status === 'approved'
    ).length;

    // Pending Requests for Manager
    const pendingRequests = currentMonthSchedule.filter(d => d.status === 'pending');

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-300/40 dark:bg-slate-900 border-l-8 border-l-indigo-600 shadow-sm p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-indigo-300/30 dark:border-white/5 backdrop-blur-xl transition-colors">
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
                                <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">{myRequestsThisMonth} / {myLimit} Slots Used</span>
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
                        <Card className="p-8 border-l-8 border-amber-500 bg-amber-300/40 dark:bg-amber-900/10 shadow-xl shadow-amber-500/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Inbox size={120} className="text-amber-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-amber-200 dark:bg-amber-900/40 rounded-xl">
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
                                        className="flex items-center justify-between bg-indigo-300/40 dark:bg-slate-900 p-5 rounded-3xl shadow-premium border border-amber-300/40 dark:border-amber-500/10 group/item hover:scale-[1.02] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300/40 to-amber-300/20 dark:from-amber-900 dark:to-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-lg shadow-sm border border-amber-300/30 dark:border-amber-500/20">
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
                                                className="text-slate-400 hover:text-rose-600 p-2.5 rounded-xl hover:bg-rose-300/40 dark:hover:bg-rose-500/10 transition-all active:scale-90"
                                                onClick={() => rejectMarketRequest(req._id || req.id)}
                                            >
                                                <X size={20} />
                                            </button>
                                            <button
                                                className="text-slate-400 hover:text-emerald-600 p-2.5 rounded-xl hover:bg-emerald-300/40 dark:hover:bg-emerald-500/10 transition-all active:scale-90"
                                                onClick={() => approveMarketRequest(req._id || req.id)}
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

            <Card className="p-4 md:p-8 border border-indigo-300/30 dark:border-white/5 dark:bg-slate-900/50 shadow-sm bg-indigo-300/40">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center bg-indigo-300/40 dark:bg-slate-800 p-1 rounded-xl md:p-1.5 md:rounded-2xl border border-indigo-300/30 dark:border-slate-700 w-full sm:w-auto justify-between sm:justify-start">
                            <button
                                onClick={goToPreviousMonth}
                                className="p-1.5 md:p-2 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-indigo-300/40 dark:hover:bg-slate-700 rounded-lg md:rounded-xl transition-all shadow-sm hover:shadow-md"
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
                                className="p-1.5 md:p-2 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-indigo-200 dark:hover:bg-slate-700 rounded-lg md:rounded-xl transition-all shadow-sm hover:shadow-md"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        {!isCurrentMonth && (
                            <button
                                onClick={goToCurrentMonth}
                                className="w-full sm:w-auto px-4 py-2 bg-indigo-300/40 dark:bg-primary-500/10 text-indigo-700 dark:text-primary-400 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-300 dark:hover:bg-primary-500/20 transition-all border border-indigo-400/30 dark:border-primary-500/30"
                            >
                                Current
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-center md:justify-end">
                        {!isAdmin && (
                            <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl border border-amber-200 dark:border-amber-500/30">
                                Requests: <span className="text-sm md:text-lg leading-none align-middle ml-1">{myRequestsThisMonth}</span>/{myLimit}
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
                    <div className="mb-4 bg-indigo-300/40 dark:bg-slate-800 border border-indigo-300/30 dark:border-gray-700 rounded-lg p-3 flex items-center gap-2">
                        <Lock size={16} className="text-indigo-500" />
                        <span className="text-sm text-indigo-600 dark:text-gray-400 font-medium">Read-only: Past month view</span>
                    </div>
                )}

                <div className="grid grid-cols-7 gap-1 md:gap-4 text-center mb-6">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={day} className={`text-[9px] md:text-[11px] font-black uppercase tracking-widest pb-3 border-b border-indigo-300/30 dark:border-white/5 ${i === 0 || i === 6 ? 'text-rose-400 dark:text-rose-500/40' : 'text-slate-300 dark:text-slate-600'}`}>
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
                        <div key={`empty-${idx}`} className="h-20 md:h-32 bg-indigo-300/40 dark:bg-slate-900/20 rounded-xl md:rounded-2xl border border-indigo-300/30 dark:border-slate-800/30"></div>
                    ))}
                    {days.map((day, dayIdx) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayInfos = getDaysInfo(day);
                        const approvedInfo = dayInfos.find(d => d.status === 'approved');
                        const pendingInfos = dayInfos.filter(d => d.status === 'pending');
                        const isMine = approvedInfo?.assignedMemberId === user.id || pendingInfos.some(p => p.assignedMemberId === user.id);

                        // Status Logic
                        const isApproved = !!approvedInfo;
                        const isRequested = pendingInfos.length > 0;
                        const isMineApproved = approvedInfo?.assignedMemberId === user.id;
                        const isMinePending = pendingInfos.some(p => p.assignedMemberId === user.id);

                        return (
                            <motion.button
                                key={dateStr}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: dayIdx * 0.01 }}
                                onClick={() => handleDayClick(day)}
                                disabled={isPastMonth || (!isAdmin && approvedInfo && approvedInfo.assignedMemberId !== user.id)}
                                className={cn(
                                    "h-20 md:h-32 p-2 md:p-4 rounded-xl md:rounded-3xl border-2 flex flex-col items-start justify-between transition-all relative overflow-hidden group/day",
                                    isToday(day) && "ring-2 md:ring-4 ring-primary-500/20 border-primary-500/50 shadow-lg md:shadow-xl shadow-primary-500/10",
                                    // ME
                                    isMineApproved && "bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-transparent shadow-xl md:shadow-2xl shadow-indigo-500/30 active:scale-95",
                                    isMinePending && "bg-amber-300/40 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border-amber-300 dark:border-amber-500/30 border-dashed animate-pulse-subtle",
                                    // OTHERS (admin sees it as reassignable, others see it as taken)
                                    isApproved && !isMineApproved && !isAdmin && "bg-indigo-100/30 dark:bg-slate-950/40 text-indigo-400/50 dark:text-slate-700 cursor-not-allowed border-indigo-200/30 dark:border-white/5",
                                    isApproved && !isMineApproved && isAdmin && "bg-indigo-100/30 dark:bg-slate-950/40 text-indigo-400/50 dark:text-slate-700 border-indigo-200/30 dark:border-white/5 hover:border-primary-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer active:scale-95",
                                    isRequested && !isMinePending && !isApproved && "bg-amber-50/30 dark:bg-slate-950/10 text-amber-400/50 dark:text-slate-600 border-amber-200/30 dark:border-white/5 border-dashed",
                                    // EMPTY
                                    !isApproved && !isRequested && !isPastMonth && "bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800/80 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-xl md:hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-1.5 cursor-pointer active:scale-95",
                                    // PAST MONTH
                                    !isApproved && !isRequested && isPastMonth && "bg-slate-100/50 dark:bg-slate-950/60 text-slate-300 dark:text-slate-800 cursor-not-allowed border-slate-200/50 dark:border-slate-900/40"
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

                                {isApproved || isRequested ? (
                                    (() => {
                                        const displayInfo = approvedInfo || pendingInfos[0];
                                        const memberColor = getMemberColor(displayInfo.assignedMemberId);
                                        const isMine = displayInfo.assignedMemberId === user.id;
                                        const isDisplayApproved = displayInfo.status === 'approved';
                                        const isOffDay = displayInfo.assignedMemberId === 'OFF_DAY';

                                        return (
                                            <div className="w-full">
                                                <div className="flex items-center gap-1.5 md:gap-2 mt-1 min-w-0">
                                                    <div className={cn(
                                                        "w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center text-[8px] md:text-[10px] font-black shadow-sm group-hover/day:scale-110 transition-transform duration-500",
                                                        (isMine && isDisplayApproved) ? "bg-indigo-300/40 text-white border border-white/30 backdrop-blur-md" : 
                                                        isOffDay ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-500/20" :
                                                        `${memberColor.bg} ${memberColor.text} border ${memberColor.border}`
                                                    )}>
                                                        {isOffDay ? <X size={window.innerWidth < 640 ? 10 : 14} className="text-rose-600" /> : getMemberName(displayInfo.assignedMemberId)?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn(
                                                            "text-[8px] md:text-[10px] font-black truncate transition-colors tracking-tight hidden sm:block",
                                                            (isMine && isDisplayApproved) ? "text-white" : "text-slate-900 dark:text-slate-100"
                                                        )}>
                                                            {getMemberName(displayInfo.assignedMemberId)}
                                                        </span>
                                                        {!isApproved && isRequested && (
                                                            <span className={cn(
                                                                "text-[6px] md:text-[7px] font-black uppercase tracking-widest px-1 md:px-1.5 py-0.5 rounded-md w-fit mt-0.5",
                                                                isMine ? "bg-amber-400 text-amber-950 shadow-sm animate-pulse" : "bg-indigo-300/40 dark:bg-slate-800 text-slate-500 dark:text-slate-500"
                                                            )}>
                                                                {isMine ? (window.innerWidth < 640 ? 'Mine' : 'Your Req') : `Reqs (${pendingInfos.length})`}
                                                            </span>
                                                        )}
                                                        {isApproved && (approvedInfo.assignedMemberId !== user.id || !isMine) && (
                                                            <span className={cn(
                                                                "text-[6px] md:text-[7px] font-black uppercase tracking-widest mt-0.5 hidden sm:block",
                                                                approvedInfo.assignedMemberId === 'OFF_DAY' ? 'text-rose-500' : 'text-slate-400 dark:text-slate-600'
                                                            )}>
                                                                {approvedInfo.assignedMemberId === 'OFF_DAY' ? 'Holiday' : 'Reserved'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="w-full self-center mt-2 opacity-0 group-hover/day:opacity-100 transition-all duration-300 flex flex-col items-center gap-1 scale-75 group-hover/day:scale-100">
                                        <div className="p-2 bg-indigo-300/40 dark:bg-primary-950/40 rounded-xl border border-indigo-400/20">
                                            <ShoppingCart size={16} className="text-indigo-600" />
                                        </div>
                                        <span className="text-[8px] font-black text-indigo-700 dark:text-primary-400 uppercase tracking-widest">{isAdmin ? 'Assign' : 'Reserve'}</span>
                                    </div>
                                )}

                                {isMineApproved && (
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
                className="bg-indigo-300/40 dark:bg-slate-900/50 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-sm border border-indigo-300/30 dark:border-white/10 relative overflow-hidden group border-l-8 border-l-indigo-600"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-all duration-1000"></div>

                <div className="w-24 h-24 rounded-3xl bg-indigo-300/40 dark:bg-white/5 backdrop-blur-md flex items-center justify-center shadow-sm relative z-10 border border-indigo-400/30 dark:border-white/20">
                    <Utensils className="text-indigo-700 dark:text-white/80" size={42} />
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

            {/* Member Selection Modal for Admins */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Duty for ${selectedModalDate ? format(selectedModalDate, 'dd MMM yyyy') : ''}`}
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Mess Holiday Toggle (Admin Only) */}
                    {isAdmin && (
                        <div className="mb-6 p-4 rounded-[1.5rem] bg-indigo-300/40 dark:bg-slate-900/50 border border-indigo-300/30 dark:border-white/5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        <ShoppingCart size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">Mess Holiday</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">No market on this day</p>
                                    </div>
                                </div>
                                {(() => {
                                    const dayInfos = selectedModalDate ? getDaysInfo(selectedModalDate) : [];
                                    const offDayRecord = dayInfos.find(d => d.assignedMemberId === 'OFF_DAY');
                                    return (
                                        <button
                                            onClick={() => {
                                                if (offDayRecord) {
                                                    if (window.confirm('Remove Mess Holiday for this date?')) {
                                                        rejectMarketRequest(offDayRecord._id || offDayRecord.id);
                                                        setIsModalOpen(false);
                                                    }
                                                } else {
                                                    if (window.confirm('Mark this day as Mess Holiday? This will reject all pending requests.')) {
                                                        allocateMarketDay(format(selectedModalDate, 'yyyy-MM-dd'), 'OFF_DAY', 'manual_assign');
                                                        setIsModalOpen(false);
                                                    }
                                                }
                                            }}
                                            className={cn(
                                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border-2 shadow-sm",
                                                offDayRecord 
                                                    ? "bg-rose-500 text-white border-transparent shadow-rose-500/20" 
                                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary-500"
                                            )}
                                        >
                                            {offDayRecord ? 'Remove Holiday' : 'Set as Holiday'}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Select a member to assign or approve</p>

                    {members.map(member => {
                        const dayInfos = selectedModalDate ? getDaysInfo(selectedModalDate) : [];
                        const memberRequest = dayInfos.find(d => 
                            (d.assignedMemberId === (member._id || member.id)) || 
                            (d.memberId === (member._id || member.id))
                        );
                        const isApprovedForThisDate = memberRequest?.status === 'approved';
                        const isPending = memberRequest?.status === 'pending';
                        const memberColor = getMemberColor(member._id || member.id);

                        // Count how many approved duties this member already has this month
                        const memberApprovedDuties = currentMonthSchedule.filter(
                            d => d.assignedMemberId === (member._id || member.id) && d.status === 'approved'
                        ).length;
                        
                        const memberLimit = marketDutyLimits[member._id || member.id] || 4;
                        const hasMaxDuties = memberApprovedDuties >= memberLimit && !isApprovedForThisDate;

                        return (
                            <button
                                key={member._id || member.id}
                                onClick={() => {
                                    if (isApprovedForThisDate) {
                                        // If already approved, clicking again removes the assignment
                                        if (window.confirm(`Remove assignment for ${member.name}?`)) {
                                            rejectMarketRequest(memberRequest._id || memberRequest.id);
                                            setIsModalOpen(false);
                                        }
                                    } else if (hasMaxDuties) {
                                        // Dynamic duty limit warning
                                        alert(`⚠️ Member "${member.name}" already has ${memberApprovedDuties} days duty this month. Current Limit: ${memberLimit}.`);
                                    } else if (isPending) {
                                        // Approve specific request
                                        approveMarketRequest(memberRequest._id || memberRequest.id);
                                        setIsModalOpen(false);
                                    } else {
                                        // Manual assign - passing type 'manual_assign'
                                        allocateMarketDay(format(selectedModalDate, 'yyyy-MM-dd'), member._id || member.id, 'manual_assign');
                                        setIsModalOpen(false);
                                    }
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-95 group",
                                    isApprovedForThisDate ? "bg-indigo-600 border-transparent shadow-lg shadow-indigo-500/20" :
                                        isPending ? "bg-amber-200 dark:bg-amber-900/10 border-amber-300 dark:border-amber-500/20" :
                                            hasMaxDuties ? "bg-indigo-300/40 dark:bg-slate-800/50 border-indigo-400 dark:border-slate-700 opacity-70" :
                                                "bg-indigo-300/40 dark:bg-slate-900 border-indigo-300/30 dark:border-white/5"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                                        isApprovedForThisDate ? "bg-white/20 text-white" : `${memberColor.bg} ${memberColor.text}`
                                    )}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <p className={cn("font-black text-sm", isApprovedForThisDate ? "text-white" : "text-slate-900 dark:text-white")}>{member.name}</p>
                                        {isPending && <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Has Pending Request</p>}
                                        {isApprovedForThisDate && <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Currently Assigned</p>}
                                        {hasMaxDuties && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{memberLimit} Days Duty — Limit Reached</p>}
                                    </div>
                                </div>
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isApprovedForThisDate ? "bg-white/20 text-white" :
                                        hasMaxDuties ? "bg-rose-300/40 dark:bg-rose-900/20 text-rose-500" :
                                            "bg-indigo-300/40 dark:bg-slate-800 text-indigo-400 group-hover:text-primary-500"
                                )}>
                                    {isApprovedForThisDate ? <Check size={18} /> : isPending ? <Sparkles size={18} /> : hasMaxDuties ? <X size={18} /> : <User size={18} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Modal>
        </motion.div>
    );
};

export default MarketDuty;
