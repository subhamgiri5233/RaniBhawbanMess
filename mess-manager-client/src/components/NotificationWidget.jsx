import { useMemo, useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ShoppingCart, UtensilsCrossed, Cake } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';

const NotificationWidget = () => {
    const { user } = useAuth();
    const { marketSchedule, expenses, meals, members } = useData();
    const [permission, setPermission] = useState(() => 
        (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'default'
    );
    const [sentNotifs, setSentNotifs] = useState(new Set());

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(setPermission);
        }
    }, []);

    const triggerSystemNotification = (id, title, body) => {
        if (permission === 'granted' && !sentNotifs.has(id)) {
            const options = {
                body,
                icon: window.location.origin + '/icons/home.png?v=25',
                // Professional white silhouette house icon (SVG) for the status bar badge
                badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMCAyMHYtNmg0djZoNXYtOGgzTDEyIDMgMiAxMmgzdjh6Ii8+PC9zdmc+',
                vibrate: [200, 100, 200],
                tag: id 
            };

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options));
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

        const getName = (id) => (members || []).find(m => m._id === id || m.id === id)?.name || 'Someone';

        // 1. Market Checks
        const monthSchedule = marketSchedule[currentMonth] || [];
        const todayMarket = monthSchedule.find(m => m.date === todayStr && m.status === 'approved');
        const tomorrowMarket = monthSchedule.find(m => m.date === tomorrowStr && m.status === 'approved');
        
        // Tomorrow's Reminder
        if (tomorrowMarket) {
            const mId = tomorrowMarket.assignedMemberId;
            const isMe = mId === user?._id || mId === user?.id || mId === user?.userId;
            if (isMe || user?.role === 'admin') {
                const isAlreadyOnDuty = todayMarket && todayMarket.assignedMemberId === mId;
                if (!isAlreadyOnDuty) {
                    list.push({
                        id: `tomorrow-${mId}-${todayStr}`,
                        title: 'Market Duty Reminder',
                        message: isMe ? "From tomorrow, your market duty starts! 🛒" : `From tomorrow, ${getName(mId)}'s market starts.`,
                    });
                }
            }
        }

        // 2. Birthday Check (Public)
        (members || []).forEach(m => {
            if (m.dateOfBirth) {
                const dob = new Date(m.dateOfBirth);
                if (dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth()) {
                    const mId = m._id || m.id;
                    const isMe = mId === user?._id || mId === user?.id || mId === user?.userId || (m.userId && (m.userId === user?._id || m.userId === user?.id));
                    list.push({
                        id: `bday-${mId}-${todayStr}`,
                        title: isMe ? "Happy Birthday! 🎂" : "Birthday Celebration! 🎉",
                        message: isMe ? `Happy Birthday ${user.name}! Have a wonderful day! ✨` : `Today is ${m.name}'s birthday! Don't forget to wish them. 🎈`,
                    });
                }
            }
        });

        // Today's Duty Reminders
        if (todayMarket) {
            const mId = todayMarket.assignedMemberId;
            const isMe = mId === user?._id || mId === user?.id || mId === user?.userId;
            const mName = getName(mId);

            if (isMe || user?.role === 'admin') {
                // Last Day Check
                const isLastDay = !tomorrowMarket || tomorrowMarket.assignedMemberId !== mId;
                if (isLastDay) {
                    list.push({
                        id: `finished-${mId}-${todayStr}`,
                        title: 'Market Duty Finished',
                        message: isMe ? "মার্কেট শেষ ড্রাম টা ফেলে দিও! ✅" : `${mName} এর মার্কেট শেষ, ড্রাম টা ফেলে দিতে বলো।`,
                    });
                }

                // Missing Data Check
                const hasEntry = expenses.some(e => e.category === 'market' && (e.date === todayStr || e.date === format(today, 'dd-MM-yyyy')));
                if (!hasEntry) {
                    list.push({
                        id: `missing-${mId}-${todayStr}`,
                        title: 'Missing Market Data',
                        message: isMe ? `Hey ${user.name}, you haven't written today's market details yet!` : `${mName} has not written today's market details yet.`,
                    });
                }
            }
        }

        // 3. Meal Check (Private)
        if (user?.role === 'member') {
            const hasMeal = meals.some(m => {
                const mDate = String(m.date).includes('-') ? m.date : format(parseISO(m.date), 'yyyy-MM-dd');
                return mDate === todayStr && (m.memberId === user._id || m.memberId === user.id);
            });
            if (!hasMeal) {
                list.push({
                    id: `meal-${user?._id}-${todayStr}`,
                    title: 'Meal Check',
                    message: `${user.name}, do you have a meal today? Please update your status.`,
                });
            }
        }

        return list;
    }, [marketSchedule, expenses, meals, user, members]);

    useEffect(() => {
        notifications.forEach(n => triggerSystemNotification(n.id, n.title, n.message));
    }, [notifications]);

    return null;
};

export default NotificationWidget;
