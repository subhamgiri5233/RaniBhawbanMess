import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Send, Bell, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

const Notifications = () => {
    const { members, sendNotification, notifications, approveMarketRequest, rejectMarketRequest, updateNotification, deleteNotification, markAllAsRead, refreshData } = useData();
    const { user } = useAuth();
    const [selectedUser, setSelectedUser] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            const userId = user.id || user._id || user.userId;
            if (userId) markAllAsRead(userId);
        }
    }, [user, notifications.length]); // Re-run if new notifications arrive (simple check)

    const handleSend = (e) => {
        e.preventDefault();
        if (!selectedUser || !message) return;

        sendNotification(selectedUser, message);
        setMessage('');
        alert('Notification Sent!');
    };

    const getMemberName = (id) => members.find(m => (m._id === id || m.id === id))?.name || 'Unknown';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 shadow-premium p-8 rounded-[2rem] border border-slate-100 dark:border-white/5">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Notification Center</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Broadcast messages and manage member requests</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                    <Bell size={16} className="text-indigo-500" />
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Dispatch Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Send Notification Card */}
                <Card className="p-8 shadow-premium border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Send size={120} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-8 flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/40 rounded-xl">
                            <Send size={20} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Broadcast Message
                    </h2>
                    <form onSubmit={handleSend} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Target Recipient</label>
                            <select
                                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-slate-900 dark:text-slate-100 font-bold transition-all appearance-none"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                required
                            >
                                <option value="" className="dark:bg-slate-900 text-slate-400">Select Member...</option>
                                <option value="all" className="dark:bg-slate-900 font-black">All Members</option>
                                {members.map(m => (
                                    <option key={m._id || m.id} value={m._id || m.id} className="dark:bg-slate-900">{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Message Payload</label>
                            <textarea
                                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none h-40 resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all font-bold"
                                placeholder="Broadcast your message to the mess members..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            ></textarea>
                        </div>
                        <Button type="submit" className="w-full py-6 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-xl shadow-primary-500/20 active:scale-95 transition-all font-black uppercase tracking-widest text-xs">
                            Secure Dispatch <Send size={16} className="ml-2" />
                        </Button>
                    </form>
                </Card>

                {/* Market Requests Notifications */}
                <Card className="p-0 overflow-hidden shadow-premium border-white/5 h-fit flex flex-col">
                    <div className="p-6 border-b border-white/10 bg-amber-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                                <Bell size={18} className="text-amber-600" />
                            </div>
                            <h3 className="font-black text-amber-900 dark:text-amber-500 uppercase tracking-[0.2em] text-[10px]">Supply Chain Validation</h3>
                        </div>
                        <span className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Pending Sync</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[500px] overflow-y-auto scrollbar-hide bg-white dark:bg-slate-900/40">
                        {notifications.filter(n => n.type === 'market_request').length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                {notifications.filter(n => n.type === 'market_request').slice().reverse().map((n, idx) => (
                                    <motion.div
                                        key={n._id || n.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-black text-xs text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                                                {getMemberName(n.metadata?.requesterId)} - MARKET REQUEST
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{n.date}</span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm font-bold mb-4 leading-relaxed">{n.message}</p>

                                        <div className="mt-2">
                                            {!n.status ? (
                                                <div className="flex gap-3">
                                                    <Button
                                                        size="xs"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-none py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                                                        onClick={async () => {
                                                            const date = n.metadata?.date;
                                                            if (date) {
                                                                await updateNotification(n._id, { status: 'approved' });
                                                                await approveMarketRequest(date, false);
                                                                refreshData();
                                                            }
                                                        }}
                                                    >
                                                        Validate
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        className="bg-rose-500 hover:bg-rose-600 text-white border-none py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
                                                        onClick={async () => {
                                                            const date = n.metadata?.date;
                                                            if (date) {
                                                                await rejectMarketRequest(date, false);
                                                                await deleteNotification(n._id);
                                                                refreshData();
                                                            }
                                                        }}
                                                    >
                                                        Decline
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm",
                                                    n.status === 'approved' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", n.status === 'approved' ? "bg-emerald-500" : "bg-rose-500")}></div>
                                                    {n.status === 'approved' ? 'Synchronized' : 'Revoked'}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="p-16 text-center">
                                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-amber-200 dark:border-amber-500/30">
                                    <Bell size={24} className="text-amber-300 dark:text-amber-800" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zero active requests</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* General History Record */}
            <Card className="p-0 overflow-hidden shadow-premium border-white/5 bg-white dark:bg-slate-900/40">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 rounded-2xl shadow-sm">
                            <Bell size={20} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Transmission Ledger</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Audit log of system-wide broadcasts</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                            {notifications.length} Records
                        </span>
                    </div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[600px] overflow-y-auto scrollbar-hide">
                    {notifications.filter(n => n.type !== 'market_request').length > 0 ? (
                        <AnimatePresence mode="popLayout">
                            {notifications.filter(n => n.type !== 'market_request').slice().reverse().map((n, idx) => (
                                <motion.div
                                    key={n._id || n.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="p-8 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-950/60 flex items-center justify-center font-black text-sm text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200/50 dark:border-indigo-500/10 group-hover:rotate-6 transition-all duration-500">
                                                {getMemberName(n.userId).charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm uppercase tracking-tight">
                                                    {getMemberName(n.userId)}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{n.date}</span>
                                                    {n.type && (
                                                        <span className="text-[8px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest rounded-md border border-slate-200/50 dark:border-white/5">
                                                            {n.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 text-sm font-bold leading-relaxed">{n.message}</p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="p-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950/40 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200 dark:border-white/10">
                                <Bell size={32} className="text-slate-300 dark:text-slate-800" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ledger empty</p>
                        </div>
                    )}
                </div>

                {/* Audit Purge */}
                {notifications.length > 0 && (
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-white/5">
                        <button
                            onClick={async () => {
                                const password = prompt('Enter protocol password to purge transmission history:');
                                if (password === null) return;
                                if (window.confirm(`ERASE ALL ${notifications.length} TRANSMISSION RECORDS? THIS IS IRREVERSIBLE.`)) {
                                    try {
                                        const response = await api.delete('/notifications/admin/clear-all', {
                                            data: { password }
                                        });
                                        if (response.status === 200) {
                                            alert(`Successfully purged ${response.data.deletedCount} records.`);
                                            refreshData();
                                        }
                                    } catch (error) {
                                        const message = error.response?.data?.message || 'Purge Failure.';
                                        alert(`Protocol Error: ${message}`);
                                        console.error(error);
                                    }
                                }
                            }}
                            className="w-full py-4 px-6 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-[1.5rem] transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 active:scale-95 shadow-lg shadow-rose-500/10"
                        >
                            <Trash2 size={16} />
                            Purge System Ledger
                        </button>
                    </div>
                )}
            </Card>
        </motion.div >
    );
};

export default Notifications;
