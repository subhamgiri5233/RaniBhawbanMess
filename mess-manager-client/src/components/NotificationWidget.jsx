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
                icon: window.location.origin + '/icons/home.png?v=25',
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
        const todayMarket = monthSchedule.find(m => m.date === todayStr && m.status === 'approved');
        const tomorrowMarket = monthSchedule.find(m => m.date === tomorrowStr && m.status === 'approved');
        
        // ONLY show "Starts Tomorrow" if they are NOT already on duty today
        if (tomorrowMarket) {
            const isAlreadyOnDutyToday = todayMarket && todayMarket.assignedMemberId === tomorrowMarket.assignedMemberId;
            
            if (!isAlreadyOnDutyToday) {
                const memberName = tomorrowMarket.assignedMemberName || getName(tomorrowMarket.assignedMemberId, 'Someone');
                const isMe = tomorrowMarket.assignedMemberId === user?._id || tomorrowMarket.assignedMemberId === user?.id || tomorrowMarket.assignedMemberId === user?.userId;
                
                const msg = isMe 
                    ? `From tomorrow, your market duty starts! 🛒`
                    : `From tomorrow, ${memberName}'s market starts.`;

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
        }

        // 2. Check for Birthdays Today
        const birthdayMembers = (members || []).filter(member => {
            if (!member.dateOfBirth) return false;
            const dob = new Date(member.dateOfBirth);
            return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
        });

        birthdayMembers.forEach(member => {
            const memberId = member._id || member.id;
            // Enhanced "Is it me?" check
            const isMe = memberId === user?._id || memberId === user?.id || memberId === user?.userId || (member.userId && (member.userId === user?._id || member.userId === user?.id));
            
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
        if (todayMarket) {
            const memberId = todayMarket.assignedMemberId;
            const isMe = memberId === user?._id || memberId === user?.id || memberId === user?.userId;
            const memberName = todayMarket.assignedMemberName || getName(memberId, 'Someone');

            // Check if today is the LAST day (tomorrow is either empty or someone else)
            const isLastDay = !tomorrowMarket || tomorrowMarket.assignedMemberId !== memberId;

            if (isLastDay) {
                const msg = isMe 
                    ? `মার্কেট শেষ ড্রাম টা ফেলে দিও! ✅`
                    : `${memberName} এর মার্কেট শেষ, ড্রাম টা ফেলে দিতে বলো।`;
                
                list.push({
                    id: `market-finished-${memberId}-${todayStr}`,
                    type: 'success',
                    icon: ShoppingCart,
                    message: msg,
                    title: 'Market Duty Finished',
                    color: 'text-emerald-600 dark:text-emerald-400',
                    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                    border: 'border-emerald-200 dark:border-emerald-900/30'
                });
            }

            const hasMarketExpense = expenses.some(e => 
                e.category === 'market' && 
                (e.date === todayStr || e.date === format(today, 'dd-MM-yyyy'))
            );
            
            if (!hasMarketExpense) {
                const msg = isMe 
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

    // Logic still runs, but we return null so nothing shows in the UI
    // as requested by the user. Only System Push Notifications will trigger.
    return null;
};

export default NotificationWidget;
