import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { ShoppingCart, Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Lock, X, Info, Utensils, Sparkles, TrendingUp, Inbox, User, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '../../lib/utils';
import Modal from '../../components/ui/Modal';

// Robust helper to check if two member IDs represent the same member
const isSameMember = (id1, id2, members = []) => {
    if (!id1 || !id2) return false;
    if (id1 === id2) return true;
    const str1 = id1.toString();
    const str2 = id2.toString();
    if (str1 === str2) return true;
    
    const m1 = members.find(m => m._id?.toString() === str1 || m.id?.toString() === str1 || m.userId === str1);
    const m2 = members.find(m => m._id?.toString() === str2 || m.id?.toString() === str2 || m.userId === str2);
    
    if (m1 && m2) {
        return (m1._id && m2._id && m1._id.toString() === m2._id.toString()) || (m1.userId && m2.userId && m1.userId === m2.userId);
    }
    if (m1) {
        return m1._id?.toString() === str2 || m1.userId === str2;
    }
    if (m2) {
        return m2._id?.toString() === str1 || m2.userId === str1;
    }
    return false;
};

const MarketDuty = () => {
    const {
        marketSchedule, allocateMarketDay, approveMarketRequest,
        rejectMarketRequest, clearMarketDate, members, managerAllocation,
        refreshMarket, globalMonth, setGlobalMonth, marketDutyLimits
    } = useData();
    const { user, isLoading } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModalDate, setSelectedModalDate] = useState(null);
    const [pendingActionIds, setPendingActionIds] = useState(new Set());

    // Sync currentDate with globalMonth
    useEffect(() => {
        const [y, m] = globalMonth.split('-').map(Number);
        if (currentDate.getFullYear() !== y || currentDate.getMonth() !== (m - 1)) {
            setCurrentDate(new Date(y, m - 1, 1));
        }
    }, [globalMonth]);

    // Ensure latest market data is loaded when visiting this page
    useEffect(() => {
        refreshMarket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Check if viewing current or past month
    const today = new Date();
    const todayMonthKey = format(today, 'yyyy-MM');
    const isCurrentMonth = monthKey === todayMonthKey;
    const isPastMonth = monthKey < todayMonthKey;

    // Calendar grid alignment
    const firstDayOfMonth = monthStart.getDay(); // 0 = Sunday
    const emptySlots = Array(firstDayOfMonth).fill(null);

    const currentMonthSchedule = marketSchedule[monthKey] || [];

    // Manager & Admin View Logic
    const currentManagerId = managerAllocation[monthKey];
    const isAdmin = user.role === 'admin';
    const isAssignedManager = currentManagerId && (
        isSameMember(user.id, currentManagerId, members) ||
        isSameMember(user.userId, currentManagerId, members) ||
        isSameMember(user._id, currentManagerId, members)
    );
    const isManager = isAssignedManager || isAdmin;
    const canManageSchedule = isAdmin || isManager;

    // Helper to see active entries on a date (excludes rejected)
    const getDaysInfo = (date) => {
        const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
        return currentMonthSchedule.filter(d => d.date === dateStr && d.status !== 'rejected');
    };

    const getMemberName = (id) => {
        if (!id) return 'Unknown';
        if (id === 'OFF_DAY') return 'Mess Holiday';
        const member = members.find(m => 
            m._id === id || 
            m.id === id || 
            m.userId === id || 
            m._id?.toString() === id?.toString()
        );
        return member ? member.name : (id === 'admin-1' ? 'Admin' : id);
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
        const member = members.find(m => m._id === id || m.id === id || m.userId === id || m._id?.toString() === id?.toString());
        const key = member?._id?.toString() || member?.userId || id || '';
        const hash = key.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        return colors[hash % colors.length];
    };

    // Calculate my requests (pending + approved) for dynamic limit
    const myLimit = marketDutyLimits[user.id] || marketDutyLimits[user.userId] || 4;
    const myRequestsThisMonth = currentMonthSchedule.filter(d => 
        (isSameMember(d.assignedMemberId, user.id, members) || isSameMember(d.memberId, user.id, members)) && 
        (d.status === 'pending' || d.status === 'approved')
    ).length;

    // Calculate my approved days
    const myDaysCount = currentMonthSchedule.filter(d => 
        (isSameMember(d.assignedMemberId, user.id, members) || isSameMember(d.memberId, user.id, members)) && 
        d.status === 'approved'
    ).length;

    // Pending Requests for Manager
    const pendingRequests = currentMonthSchedule.filter(d => d.status === 'pending');

    const handleDayClick = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayInfos = getDaysInfo(date);
        const approvedInfo = dayInfos.find(d => d.status === 'approved');

        // Prevent requests in past months
        if (isPastMonth) {
            alert('⚠️ Cannot request or modify days in past months');
            return;
        }

        // Admin & Manager view opens member management modal
        if (canManageSchedule) {
            setSelectedModalDate(date);
            setIsModalOpen(true);
            return;
        }

        // CUSTOMER/MEMBER LOGIC BELOW
        // If member clicks on their own pending or approved request, allow them to cancel it
        const myPendingRequest = dayInfos.find(d => isSameMember(d.assignedMemberId, user.id, members) && d.status === 'pending');
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

        // Check member-specific limit
        if (myRequestsThisMonth >= myLimit) {
            alert(`⚠️ You can only request maximum ${myLimit} days per month`);
            return;
        }

        // Members request
        allocateMarketDay(dateStr, user.id, 'request', currentManagerId);
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 md:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Market Duty</h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                        {canManageSchedule ? 'Manage and assign mess market duties' : 'Reserve your dates for mess collection'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {canManageSchedule && (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                            <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                                {isAdmin ? 'Admin Mode' : 'Manager Mode'}
                            </span>
                        </div>
                    )}
                    {!canManageSchedule && (
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Monthly Quota</span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{myRequestsThisMonth} / {myLimit} Slots Used</span>
                            </div>
                        </div>
                    )}
                    {!canManageSchedule && (
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Confirmed Days</span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{myDaysCount} Finalized</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Manager Request Handler */}
            {isManager && pendingRequests.length > 0 && (
                <div className="overflow-hidden">
                    <Card className="p-6 md:p-8 border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-900/10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <Inbox size={120} className="text-amber-500" />
                        </div>
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="font-extrabold text-amber-900 dark:text-amber-400 uppercase tracking-wider text-xs">Awaiting Approval ({pendingRequests.length})</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingRequests.map(req => (
                                <div
                                    key={req._id || req.id}
                                    className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/5 group/item transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-extrabold text-base border border-amber-500/20">
                                            {getMemberName(req.assignedMemberId)?.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-extrabold block text-slate-800 dark:text-slate-100 text-sm tracking-tight">{getMemberName(req.assignedMemberId)}</span>
                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                                <CalendarIcon size={10} /> {format(new Date(req.date), 'dd MMM yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        <button
                                            className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-500/10 transition-all active:scale-90 disabled:opacity-40"
                                            disabled={pendingActionIds.has(req._id || req.id)}
                                            title="Reject request"
                                            onClick={async () => {
                                                const id = req._id || req.id;
                                                setPendingActionIds(prev => new Set([...prev, id]));
                                                await rejectMarketRequest(id, req.date);
                                                setPendingActionIds(prev => { const n = new Set(prev); n.delete(id); return n; });
                                            }}
                                        >
                                            <X size={18} />
                                        </button>
                                        <button
                                            className="text-slate-400 hover:text-emerald-600 p-2 rounded-xl hover:bg-emerald-500/10 transition-all active:scale-90 disabled:opacity-40"
                                            disabled={pendingActionIds.has(req._id || req.id)}
                                            title="Approve request"
                                            onClick={async () => {
                                                const id = req._id || req.id;
                                                setPendingActionIds(prev => new Set([...prev, id]));
                                                await approveMarketRequest(id);
                                                setPendingActionIds(prev => { const n = new Set(prev); n.delete(id); return n; });
                                            }}
                                        >
                                            <Check size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            <Card className="p-4 md:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 w-full sm:w-auto justify-between sm:justify-start">
                            <button
                                onClick={goToPreviousMonth}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="px-3 sm:px-5 flex items-center gap-2">
                                <CalendarIcon className="text-indigo-600 dark:text-indigo-400 hidden sm:block" size={16} />
                                <h2 className="text-sm md:text-lg font-extrabold text-slate-900 dark:text-slate-50 tracking-tight whitespace-nowrap">
                                    {format(monthStart, 'MMMM yyyy')}
                                </h2>
                                {isPastMonth && <Lock size={13} className="text-slate-400" />}
                            </div>
                            <button
                                onClick={goToNextMonth}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        {!isCurrentMonth && (
                            <button
                                onClick={goToCurrentMonth}
                                className="w-full sm:w-auto px-3.5 py-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider rounded-xl hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
                            >
                                Current
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
                        {!canManageSchedule && (
                            <div className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20">
                                Requests: <span className="text-sm leading-none align-middle ml-1 font-black">{myRequestsThisMonth}</span>/{myLimit}
                            </div>
                        )}
                        {!canManageSchedule && (
                            <div className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                                Duties: <span className="text-sm leading-none align-middle ml-1 font-black">{myDaysCount}</span>
                            </div>
                        )}
                    </div>
                </div>

                {isPastMonth && (
                    <div className="mb-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-xl p-3 flex items-center gap-2">
                        <Lock size={15} className="text-slate-500" />
                        <span className="text-xs text-slate-600 dark:text-gray-400 font-bold uppercase tracking-wider">Read-only: Past month view</span>
                    </div>
                )}

                <div className="grid grid-cols-7 gap-1 md:gap-3 text-center mb-4">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={day} className={`text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider pb-2 border-b border-slate-200/80 dark:border-white/5 ${i === 0 || i === 6 ? 'text-rose-500' : 'text-slate-400'}`}>
                            <span className="hidden md:inline">
                                {i === 0 ? 'Sun' : i === 1 ? 'Mon' : i === 2 ? 'Tue' : i === 3 ? 'Wed' : i === 4 ? 'Thu' : i === 5 ? 'Fri' : 'Sat'}
                            </span>
                            <span className="md:hidden">{day}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 md:gap-2.5">
                    {emptySlots.map((_, idx) => (
                        <div key={`empty-${idx}`} className="h-16 md:h-28 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-200/40 dark:border-slate-800/30"></div>
                    ))}
                    {days.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayInfos = getDaysInfo(day);
                        const approvedInfo = dayInfos.find(d => d.status === 'approved');
                        const pendingInfos = dayInfos.filter(d => d.status === 'pending');

                        const isMineApproved = approvedInfo && isSameMember(approvedInfo.assignedMemberId, user.id, members);
                        const isMinePending = pendingInfos.some(p => isSameMember(p.assignedMemberId, user.id, members));
                        const isMine = isMineApproved || isMinePending;

                        // Status Logic
                        const isApproved = !!approvedInfo;
                        const isRequested = pendingInfos.length > 0;

                        return (
                            <button
                                key={dateStr}
                                onClick={() => handleDayClick(day)}
                                disabled={isPastMonth || (!canManageSchedule && approvedInfo && !isMine)}
                                className={cn(
                                    "h-16 md:h-28 p-2 md:p-3 rounded-xl md:rounded-2xl border transition-all flex flex-col items-start justify-between relative overflow-hidden group/day text-left",
                                    isToday(day) && "ring-2 ring-indigo-500/30 border-indigo-500 shadow-sm",
                                    // ME APPROVED
                                    isMineApproved && "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-transparent shadow-md shadow-indigo-500/25 active:scale-95",
                                    // ME PENDING
                                    isMinePending && "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/30 border-dashed animate-pulse-subtle",
                                    // OTHERS (manager/admin sees as editable/reassignable)
                                    isApproved && !isMineApproved && !canManageSchedule && "bg-slate-50 dark:bg-slate-950/40 text-slate-400 cursor-not-allowed border-slate-200/60 dark:border-white/5",
                                    isApproved && !isMineApproved && canManageSchedule && "bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/5 hover:border-indigo-400 cursor-pointer active:scale-95",
                                    isRequested && !isMinePending && !isApproved && "bg-amber-500/5 dark:bg-slate-950/10 text-amber-600/70 dark:text-slate-500 border-amber-500/20 dark:border-white/5 border-dashed",
                                    // EMPTY
                                    !isApproved && !isRequested && !isPastMonth && "bg-white dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm cursor-pointer active:scale-95",
                                    // PAST MONTH
                                    !isApproved && !isRequested && isPastMonth && "bg-slate-50/50 dark:bg-slate-950/60 text-slate-300 dark:text-slate-800 cursor-not-allowed border-slate-200/40 dark:border-slate-900/40"
                                )}
                            >
                                <div className="flex w-full justify-between items-center">
                                    <span className={cn(
                                        "text-xs md:text-sm font-extrabold transition-colors leading-none",
                                        (isMine && isApproved) ? "text-white" : isToday(day) ? "text-indigo-600 dark:text-indigo-400 font-black" : "text-slate-700 dark:text-slate-400 group-hover/day:text-indigo-600"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {isToday(day) && (
                                        <span className="flex items-center shrink-0">
                                            <span className="hidden md:inline-block bg-indigo-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                                Today
                                            </span>
                                            <span className="md:hidden flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400 shadow-sm"></span>
                                            </span>
                                        </span>
                                    )}
                                </div>

                                {isApproved || isRequested ? (
                                    (() => {
                                        const displayInfo = approvedInfo || pendingInfos[0];
                                        const memberColor = getMemberColor(displayInfo.assignedMemberId);
                                        const isDisplayMine = isSameMember(displayInfo.assignedMemberId, user.id, members);
                                        const isDisplayApproved = displayInfo.status === 'approved';
                                        const isOffDay = displayInfo.assignedMemberId === 'OFF_DAY';

                                        return (
                                            <div className="w-full">
                                                <div className="flex items-center gap-1.5 mt-1 min-w-0">
                                                    <div className={cn(
                                                        "w-5 h-5 md:w-7 md:h-7 rounded-lg flex items-center justify-center text-[8px] md:text-[10px] font-extrabold shadow-sm shrink-0",
                                                        (isDisplayMine && isDisplayApproved) ? "bg-white/20 text-white border border-white/30 backdrop-blur-md" : 
                                                        isOffDay ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-500/20" :
                                                        `${memberColor.bg} ${memberColor.text} border ${memberColor.border}`
                                                    )}>
                                                        {isOffDay ? <X size={12} className="text-rose-600" /> : getMemberName(displayInfo.assignedMemberId)?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn(
                                                            "text-[8px] md:text-[10px] font-extrabold truncate tracking-tight hidden sm:block",
                                                            (isDisplayMine && isDisplayApproved) ? "text-white" : "text-slate-900 dark:text-slate-100"
                                                        )}>
                                                            {getMemberName(displayInfo.assignedMemberId)}
                                                        </span>
                                                        {!isApproved && isRequested && (
                                                            <span className={cn(
                                                                "text-[6px] md:text-[7px] font-extrabold uppercase tracking-wider px-1 py-0.5 rounded-md w-fit mt-0.5",
                                                                isDisplayMine ? "bg-amber-400 text-amber-950 shadow-sm" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                            )}>
                                                                {isDisplayMine ? (window.innerWidth < 640 ? 'Mine' : 'Your Req') : `Reqs (${pendingInfos.length})`}
                                                            </span>
                                                        )}
                                                        {isApproved && (!isDisplayMine || canManageSchedule) && (
                                                            <span className={cn(
                                                                "text-[6px] md:text-[7px] font-extrabold uppercase tracking-wider mt-0.5 hidden sm:block",
                                                                approvedInfo.assignedMemberId === 'OFF_DAY' ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
                                                            )}>
                                                                {approvedInfo.assignedMemberId === 'OFF_DAY' ? 'Holiday' : 'Allocated'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="w-full self-center mt-1 opacity-0 group-hover/day:opacity-100 transition-all duration-200 flex flex-col items-center gap-0.5">
                                        <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                            <ShoppingCart size={14} />
                                        </div>
                                        <span className="text-[7px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                            {canManageSchedule ? 'Assign' : 'Reserve'}
                                        </span>
                                    </div>
                                )}

                                {isMineApproved && (
                                    <div className="absolute -top-1 -right-1">
                                        <div className="bg-indigo-400 p-1.5 rounded-bl-2xl shadow-sm">
                                            <Check size={12} className="text-white font-extrabold" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </Card>

            <div
                className="bg-white/80 dark:bg-slate-900/80 rounded-2xl md:rounded-[1.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-slate-200/80 dark:border-white/5 relative overflow-hidden group border-l-4 border-l-indigo-600"
            >
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm relative z-10 border border-indigo-500/20 shrink-0">
                    <Utensils size={28} />
                </div>

                <div className="relative z-10 text-center md:text-left flex-1">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <TrendingUp size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <h3 className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-[9px]">Mess Protocol</h3>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">Market Duty Management</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed max-w-lg">
                        Ensure all market duty requests are coordinated with the monthly <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Mess Manager</span>. Click on any date to assign, reassign, or remove allocated persons.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3 self-center md:self-end">
                    <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md shadow-indigo-500/20 cursor-default">
                        System Active
                    </div>
                </div>
            </div>

            {/* Member Selection & Management Modal for Admins / Managers */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Duty for ${selectedModalDate ? format(selectedModalDate, 'dd MMM yyyy') : ''}`}
            >
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Active Allocation Quick-Remove Section */}
                    {(() => {
                        const dayInfos = selectedModalDate ? getDaysInfo(selectedModalDate) : [];
                        const approvedInfo = dayInfos.find(d => d.status === 'approved');
                        if (!approvedInfo) return null;

                        const isOffDay = approvedInfo.assignedMemberId === 'OFF_DAY';
                        const assignedName = getMemberName(approvedInfo.assignedMemberId);

                        return (
                            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold shrink-0">
                                        {isOffDay ? <ShoppingCart size={18} /> : assignedName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block truncate">
                                            {isOffDay ? 'Mess Holiday Active' : 'Currently Allocated'}
                                        </span>
                                        <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate block">
                                            {assignedName}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (window.confirm(`Remove ${isOffDay ? 'Mess Holiday' : `allocation for ${assignedName}`} on this date?`)) {
                                            const idToRemove = approvedInfo._id || approvedInfo.id;
                                            const dateStr = format(selectedModalDate, 'yyyy-MM-dd');
                                            await rejectMarketRequest(idToRemove, dateStr);
                                            await clearMarketDate(dateStr);
                                            setIsModalOpen(false);
                                        }
                                    }}
                                    className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                                >
                                    <Trash2 size={15} />
                                    <span>Remove</span>
                                </button>
                            </div>
                        );
                    })()}

                    {/* Mess Holiday Toggle (Admin / Manager) */}
                    {canManageSchedule && (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500">
                                        <ShoppingCart size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">Mess Holiday</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">No market duty on this day</p>
                                    </div>
                                </div>
                                {(() => {
                                    const dayInfos = selectedModalDate ? getDaysInfo(selectedModalDate) : [];
                                    const offDayRecord = dayInfos.find(d => d.assignedMemberId === 'OFF_DAY');
                                    const dateStr = selectedModalDate ? format(selectedModalDate, 'yyyy-MM-dd') : '';
                                    return (
                                        <button
                                            onClick={async () => {
                                                if (offDayRecord) {
                                                    if (window.confirm('Remove Mess Holiday for this date?')) {
                                                        await rejectMarketRequest(offDayRecord._id || offDayRecord.id, dateStr);
                                                        await clearMarketDate(dateStr);
                                                        setIsModalOpen(false);
                                                    }
                                                } else {
                                                    if (window.confirm('Mark this day as Mess Holiday? This will clear any other assignment for this date.')) {
                                                        await allocateMarketDay(dateStr, 'OFF_DAY', 'manual_assign');
                                                        setIsModalOpen(false);
                                                    }
                                                }
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all active:scale-95 border",
                                                offDayRecord 
                                                    ? "bg-rose-500 text-white border-transparent" 
                                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500"
                                            )}
                                        >
                                            {offDayRecord ? 'Remove Holiday' : 'Set as Holiday'}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Select a member to assign, approve, or remove</p>

                    {members.map(member => {
                        const dayInfos = selectedModalDate ? getDaysInfo(selectedModalDate) : [];
                        const approvedInfo = dayInfos.find(d => d.status === 'approved');
                        const memberRequest = dayInfos.find(d => 
                            isSameMember(d.assignedMemberId, member._id || member.id || member.userId, members) ||
                            isSameMember(d.memberId, member._id || member.id || member.userId, members)
                        );
                        const isApprovedForThisDate = (approvedInfo && isSameMember(approvedInfo.assignedMemberId, member._id || member.id || member.userId, members)) || memberRequest?.status === 'approved';
                        const isPending = !isApprovedForThisDate && memberRequest?.status === 'pending';
                        const memberColor = getMemberColor(member._id || member.id || member.userId);

                        // Count how many approved duties this member already has this month
                        const memberApprovedDuties = currentMonthSchedule.filter(
                            d => isSameMember(d.assignedMemberId, member._id || member.id || member.userId, members) && d.status === 'approved'
                        ).length;
                        
                        const memberLimit = marketDutyLimits[member._id || member.id || member.userId] || 4;
                        const hasMaxDuties = memberApprovedDuties >= memberLimit && !isApprovedForThisDate;

                        return (
                            <button
                                key={member._id || member.id || member.userId}
                                onClick={async () => {
                                    if (isApprovedForThisDate) {
                                        // If already approved, clicking again removes the assignment
                                        if (window.confirm(`Remove assignment for ${member.name}?`)) {
                                            const idToReject = approvedInfo?._id || approvedInfo?.id || memberRequest?._id || memberRequest?.id;
                                            const dateStr = format(selectedModalDate, 'yyyy-MM-dd');
                                            await rejectMarketRequest(idToReject, dateStr);
                                            await clearMarketDate(dateStr);
                                            setIsModalOpen(false);
                                        }
                                    } else if (hasMaxDuties) {
                                        alert(`⚠️ Member "${member.name}" already has ${memberApprovedDuties} days duty this month. Current Limit: ${memberLimit}.`);
                                    } else if (isPending) {
                                        // Approve specific request
                                        await approveMarketRequest(memberRequest._id || memberRequest.id);
                                        setIsModalOpen(false);
                                    } else {
                                        // Manual assign
                                        await allocateMarketDay(format(selectedModalDate, 'yyyy-MM-dd'), member._id || member.id || member.userId, 'manual_assign');
                                        setIsModalOpen(false);
                                    }
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all active:scale-95 group",
                                    isApprovedForThisDate ? "bg-indigo-600 border-transparent shadow-md shadow-indigo-500/20" :
                                        isPending ? "bg-amber-500/10 border-amber-500/20" :
                                            hasMaxDuties ? "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60" :
                                                "bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/5 hover:bg-slate-100"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm",
                                        isApprovedForThisDate ? "bg-white/20 text-white" : `${memberColor.bg} ${memberColor.text}`
                                    )}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <p className={cn("font-extrabold text-sm", isApprovedForThisDate ? "text-white" : "text-slate-900 dark:text-white")}>{member.name}</p>
                                        {isPending && <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Has Pending Request</p>}
                                        {isApprovedForThisDate && <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Currently Assigned (Click to Remove)</p>}
                                        {hasMaxDuties && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{memberLimit} Days Duty — Limit Reached</p>}
                                    </div>
                                </div>
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    isApprovedForThisDate ? "bg-white/20 text-white" :
                                        hasMaxDuties ? "bg-rose-500/10 text-rose-500" :
                                            "bg-slate-200/60 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-600"
                                    )}
                                >
                                    {isApprovedForThisDate ? <Check size={16} /> : isPending ? <Sparkles size={16} /> : hasMaxDuties ? <X size={16} /> : <User size={16} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
};

export default MarketDuty;


