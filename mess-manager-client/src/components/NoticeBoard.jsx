import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Card from './ui/Card';
import { Bell, Megaphone, Trash2, Calendar, Send, ShieldAlert, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';
import { cn } from '../lib/utils';

const NoticeBoard = ({ isAdminView = false }) => {
    const { user } = useAuth();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newNotice, setNewNotice] = useState('');
    const [posting, setPosting] = useState(false);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/notifications?userId=all&limit=5');
            setNotices(response.data);
        } catch (error) {
            console.error('Error fetching notices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handlePostNotice = async (e) => {
        e.preventDefault();
        if (!newNotice.trim() || posting) return;

        setPosting(true);
        try {
            await api.post('/notifications', {
                userId: 'all',
                message: newNotice,
                type: 'notice',
                metadata: {
                    postedBy: user.name,
                    postedAt: new Date().toISOString()
                }
            });
            setNewNotice('');
            fetchNotices();
            // This will trigger the system notification because NotificationWidget watches these
        } catch (error) {
            console.error('Error posting notice:', error);
            alert('Failed to post notice');
        } finally {
            setPosting(false);
        }
    };

    const handleDeleteNotice = async (id) => {
        if (!window.confirm('Delete this notice?')) return;
        try {
            await api.delete(`/notifications/${id}`);
            fetchNotices();
        } catch (error) {
            console.error('Error deleting notice:', error);
        }
    };

    if (loading && notices.length === 0) return null;

    return (
        <div className="space-y-6">
            {/* Admin Post Box */}
            {isAdminView && user?.role === 'admin' && (
                <Card className="rb-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 shadow-xl shadow-indigo-500/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                            <Megaphone size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Post Official Notice</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Will be visible to all members & trigger alerts</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handlePostNotice} className="space-y-4">
                        <textarea
                            value={newNotice}
                            onChange={(e) => setNewNotice(e.target.value)}
                            placeholder="Write your announcement here..."
                            className="w-full p-5 bg-white dark:bg-slate-950 border-2 border-indigo-100 dark:border-white/5 rounded-[1.5rem] text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                            rows={3}
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={posting || !newNotice.trim()}
                                className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all group"
                            >
                                {posting ? 'Posting...' : 'Post Announcement'}
                                <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Notices List */}
            {notices.length > 0 && (
                <div className="space-y-4">
                    {!isAdminView && (
                        <div className="flex items-center gap-3 mb-2 px-1">
                            <Bell className="text-indigo-500 animate-pulse" size={16} />
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Institutional Notices</h3>
                        </div>
                    )}
                    
                    {notices.map((notice) => (
                        <div 
                            key={notice._id || notice.id}
                            className="relative overflow-hidden group"
                        >
                            <Card className="rb-card p-6 border-indigo-200/50 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md hover:border-indigo-500/40 transition-all duration-500">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-indigo-500 pointer-events-none group-hover:scale-150 transition-transform duration-1000">
                                    <ShieldAlert size={120} />
                                </div>

                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/5 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <Bell size={24} />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-600/20">Official</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Calendar size={10} /> {format(new Date(notice.createdAt), 'MMM dd, hh:mm a')}
                                                </span>
                                            </div>
                                            {isAdminView && (
                                                <button 
                                                    onClick={() => handleDeleteNotice(notice._id || notice.id)}
                                                    className="p-2 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                                            {notice.message}
                                        </p>
                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[8px] font-black text-indigo-600 dark:text-indigo-400">
                                                {notice.metadata?.postedBy?.charAt(0) || 'A'}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                By {notice.metadata?.postedBy || 'Admin'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NoticeBoard;
