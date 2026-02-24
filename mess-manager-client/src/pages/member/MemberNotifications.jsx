import { useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { Bell, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const MemberNotifications = () => {
    const { notifications, members, markAllAsRead } = useData();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const userId = user.id || user._id || user.userId;
            if (userId) markAllAsRead(userId);
        }
    }, [user, notifications.length]);

    const myNotifications = notifications
        .filter(n => n.userId === (user.id || user._id || user.userId) || n.userId === 'all')
        .slice()
        .reverse();

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 shadow-premium p-8 rounded-[2rem] border border-slate-100 dark:border-white/5">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Notification Inbox</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Stay updated with mess announcements and duty syncs</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                    <Bell size={16} className="text-indigo-500" />
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{myNotifications.length} Active</span>
                </div>
            </div>

            <Card className="p-0 overflow-hidden shadow-premium border-white/5 bg-white dark:bg-slate-900/40">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/40 rounded-xl">
                        <Bell size={18} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-slate-50 uppercase tracking-[0.2em] text-[10px]">Transmission Log</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    <AnimatePresence mode="popLayout">
                        {myNotifications.map((n, idx) => (
                            <motion.div
                                key={n._id || n.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-8 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group flex gap-6"
                            >
                                <div className="mt-1">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200/50 dark:border-indigo-500/10 group-hover:rotate-12 transition-all duration-500">
                                        <Bell size={18} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-black text-slate-900 dark:text-slate-100 text-sm tracking-tight">System Broadcast</span>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{n.date}</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm font-bold leading-relaxed">{n.message}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {myNotifications.length === 0 && (
                        <div className="p-24 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-dashed border-emerald-200 dark:border-emerald-500/30 shadow-xl shadow-emerald-500/5"
                            >
                                <CheckCircle size={40} className="text-emerald-300 dark:text-emerald-800" />
                            </motion.div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">System Operational</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">No pending notifications required action</p>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

export default MemberNotifications;
