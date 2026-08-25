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
                <Card className="p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 shadow-sm rounded-2xl md:rounded-[1.5rem] backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                            <Megaphone size={16} />
                        </div>
                        <div>
                            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Post Official Notice</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Visible to all mess members in live feed</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handlePostNotice} className="space-y-3">
                        <textarea
                            value={newNotice}
                            onChange={(e) => setNewNotice(e.target.value)}
                            placeholder="Write official mess announcement here..."
                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                            rows={3}
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={posting || !newNotice.trim()}
                                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all"
                            >
                                {posting ? 'Posting...' : 'Post Notice'}
                                <Send size={12} />
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Notices List */}
            {notices.length > 0 && (
                <div className="space-y-3">
                    {!isAdminView && (
                        <div className="flex items-center gap-2 px-1">
                            <Bell className="text-indigo-600 dark:text-indigo-400" size={14} />
                            <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mess Announcements</h3>
                        </div>
                    )}
                    
                    {notices.map((notice) => (
                        <div 
                            key={notice._id || notice.id}
                            className="relative overflow-hidden group"
                        >
                            <Card className="p-4 sm:p-5 border border-slate-200/80 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-sm backdrop-blur-xl">
                                <div className="flex items-start gap-3 relative z-10">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
                                        <Bell size={16} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-extrabold uppercase tracking-wider rounded-md">Notice</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Calendar size={10} /> {format(new Date(notice.createdAt), 'MMM dd, hh:mm a')}
                                                </span>
                                            </div>
                                            {isAdminView && (
                                                <button 
                                                    onClick={() => handleDeleteNotice(notice._id || notice.id)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
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
