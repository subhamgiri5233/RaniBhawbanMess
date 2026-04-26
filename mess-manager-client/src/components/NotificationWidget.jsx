import { useMemo, useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Bell, AlertCircle, ShoppingCart, UtensilsCrossed, Info, Cake } from 'lucide-react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { cn } from '../lib/utils';

const NotificationWidget = () => {
    const { user } = useAuth();
    const { marketSchedule, expenses, meals, members } = useData();
    const [permission, setPermission] = useState(() => 
        (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'default'
    );
    const [sentNotifs, setSentNotifs] = useState(new Set());

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(setPermission);
            }
        }
    }, []);

    const triggerSystemNotification = (id, title, body) => {
        if (permission === 'granted' && !sentNotifs.has(id)) {
            const options = {
                body: body,
                icon: '/icons/home.png?v=10',
                badge: '/icons/home.png?v=10',
                vibrate: [200, 100, 200],
                tag: id 
            };

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                });
            } else {
                new Notification(title, options);
            }

            setSentNotifs(prev => new Set([...prev, id]));
        }
    };

    const notifications = useMemo(() => {
        const list = [];
        const today = new Date();
        const tomorrow = addDays(today, 1);
        const todayStr = format(today, 'yyyy-MM-dd');
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
        const currentMonth = format(today, 'yyyy-MM');

        // Helper to get name from ID
        const getName = (id, fallback) => {
            const member = (members || []).find(m => m._id === id || m.id === id);
            return member ? member.name : fallback;
        };

        // 1. Check Tomorrow's Market
        const monthSchedule = marketSchedule[currentMonth] || [];
        const tomorrowMarket = monthSchedule.find(m => m.date === tomorrowStr && m.status === 'approved');
        
        if (tomorrowMarket) {
            const memberName = tomorrowMarket.assignedMemberName || getName(tomorrowMarket.assignedMemberId, 'Someone');
            const msg = `From tomorrow, ${memberName}'s market starts.`;
            list.push({
                id: 'tomorrow-market',
                type: 'info',
                icon: ShoppingCart,
                message: msg,
                title: 'Market Duty Reminder',
                color: 'text-indigo-600 dark:text-indigo-400',
                bg: 'bg-indigo-50 dark:bg-indigo-950/30',
                border: 'border-indigo-200 dark:border-indigo-900/30'
            });
        }

        // 2. Check for Birthdays Today
        const birthdayMembers = (members || []).filter(member => {
            if (!member.dateOfBirth) return false;
            const dob = new Date(member.dateOfBirth);
            return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
        });

        birthdayMembers.forEach(member => {
            const memberId = member._id || member.id;
            const isMe = memberId === user?._id || memberId === user?.id;
            const title = isMe ? "Happy Birthday! 🎂" : "Birthday Celebration! 🎉";
            const msg = isMe 
                ? `Happy Birthday ${user.name}! Have a wonderful day filled with joy! ✨`
                : `Today is ${member.name}'s birthday! Don't forget to wish them. 🎈`;
            
            list.push({
                id: `birthday-${memberId}`,
                type: 'info',
                icon: Cake,
                message: msg,
                title: title,
                color: 'text-pink-600 dark:text-pink-400',
                bg: 'bg-pink-50 dark:bg-pink-950/30',
                border: 'border-pink-200 dark:border-pink-900/30'
            });
        });

        // 3. Check Today's Market Entry
        const todayMarket = monthSchedule.find(m => m.date === todayStr && m.status === 'approved');
        if (todayMarket) {
            const hasMarketExpense = expenses.some(e => 
                e.category === 'market' && 
                (e.date === todayStr || e.date === format(today, 'dd-MM-yyyy'))
            );
            
            if (!hasMarketExpense) {
                const memberName = todayMarket.assignedMemberName || getName(todayMarket.assignedMemberId, 'Someone');
                const isAssigned = user?._id === todayMarket.assignedMemberId || user?.id === todayMarket.assignedMemberId;
                const msg = isAssigned 
                        ? `Hey ${user.name}, you haven't written today's market details yet!`
                        : `${memberName} has not written today's market details yet.`;
                
                list.push({
                    id: 'missing-market',
                    type: 'warning',
                    icon: AlertCircle,
                    message: msg,
                    title: 'Missing Market Data',
                    color: 'text-amber-600 dark:text-amber-400',
                    bg: 'bg-amber-50 dark:bg-amber-950/30',
                    border: 'border-amber-200 dark:border-amber-900/30'
                });
            }
        }

        // 4. Check Today's Meal Entry (For Members only)
        if (user?.role === 'member') {
            const hasTodayMeal = meals.some(m => {
                const mDate = String(m.date).includes('-') ? m.date : format(parseISO(m.date), 'yyyy-MM-dd');
                return mDate === todayStr && (m.memberId === user._id || m.memberId === user.id);
            });

            if (!hasTodayMeal) {
                const msg = `${user.name}, do you have a meal today? Please update your status.`;
                list.push({
                    id: 'missing-meal',
                    type: 'prompt',
                    icon: UtensilsCrossed,
                    message: msg,
                    title: 'Meal Check',
                    color: 'text-rose-600 dark:text-rose-400',
                    bg: 'bg-rose-50 dark:bg-rose-950/30',
                    border: 'border-rose-200 dark:border-rose-900/30'
                });
            }
        }

        return list;
    }, [marketSchedule, expenses, meals, user, members]);

    // Side Effect: Trigger System Notifications when the list changes
    useEffect(() => {
        if (notifications.length > 0) {
            notifications.forEach(notif => {
                triggerSystemNotification(notif.id, notif.title, notif.message);
            });
        }
    }, [notifications]);

    if (notifications.length === 0) return null;

    return (
        <div className="grid grid-cols-1 gap-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {notifications.map((notif) => (
                <div 
                    key={notif.id}
                    className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md",
                        notif.bg,
                        notif.border
                    )}
                >
                    <div className={cn("p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm shrink-0", notif.color)}>
                        <notif.icon size={20} />
                    </div>
                    <div className="flex-1">
                        <p className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider", notif.color)}>
                            Notice Board
                        </p>
                        <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                            {notif.message}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationWidget;
