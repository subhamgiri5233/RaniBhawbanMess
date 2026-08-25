import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AvatarPicker, { getAvatarUrl } from '../../components/ui/AvatarPicker';
import { Lock, Eye, EyeOff, CheckCircle2, Shield, User, Moon, Sun, KeyRound, Sparkles, AlertCircle, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

const MemberSettings = () => {
    const { user } = useAuth();
    const { members, refreshData } = useData();
    const { theme, toggleTheme } = useTheme();

    const myId = String(user?.id || user?._id || '').trim();
    const myUserId = String(user?.userId || user?.username || '').toLowerCase().trim();
    const myName = String(user?.name || '').toLowerCase().trim();

    const currentMember = members?.find(m => {
        const mId = String(m._id || m.id || '').trim();
        const mUserId = String(m.userId || m.username || '').toLowerCase().trim();
        const mName = String(m.name || '').toLowerCase().trim();
        return (myId && mId === myId) || (myUserId && mUserId === myUserId) || (myName && mName === myName);
    });

    const [avatarSeed, setAvatarSeed] = useState(null);

    const contactDisplay = currentMember?.mobile || currentMember?.phone || user?.mobile || user?.phone || currentMember?.email || user?.email || 'Not Provided';

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwStatus, setPwStatus] = useState(null);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwStatus(null);

        if (newPassword.length < 4) {
            setPwStatus({ type: 'error', message: 'New password must be at least 4 characters.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPwStatus({ type: 'error', message: 'New passwords do not match.' });
            return;
        }

        setPwLoading(true);
        try {
            const res = await api.patch('/auth/change-password', { currentPassword, newPassword });
            setPwStatus({ type: 'success', message: res.data.message || 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPwStatus({ type: 'error', message: err.response?.data?.message || 'Failed to change password.' });
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Account & Security</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Settings Terminal</h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                        Manage your profile avatar, password credentials & theme preferences
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl self-start md:self-auto shadow-sm">
                    <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Verified Profile</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: User Profile Info with interactive AvatarPicker */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex flex-col items-center text-center">
                            {/* Interactive Avatar Picker */}
                            <div className="relative mb-3 flex flex-col items-center">
                                <AvatarPicker
                                    currentAvatar={currentMember?.avatar || avatarSeed}
                                    memberId={currentMember?._id || currentMember?.id || user?.id || user?._id}
                                    onSaved={(seed) => {
                                        setAvatarSeed(seed);
                                        refreshData();
                                    }}
                                />
                                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-2.5 flex items-center gap-1">
                                    <Camera size={11} /> Click Avatar To Change
                                </span>
                            </div>

                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                                {user?.name || currentMember?.name || 'Mess Resident'}
                            </h3>
                            <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-0.5">
                                {user?.role === 'admin' ? 'System Administrator' : 'Active Mess Member'}
                            </p>

                            <div className="w-full mt-6 pt-5 border-t border-slate-200/80 dark:border-white/5 space-y-3 text-left">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Username ID</span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{user?.userId || user?.username || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Mobile</span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{contactDisplay}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Email</span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{currentMember?.email || user?.email || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Room Number</span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{currentMember?.roomNo || currentMember?.room || 'Resident'}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Theme & Display Card */}
                    <Card className="p-6">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Sun size={16} className="text-amber-500" />
                            Interface Theme
                        </h4>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5">
                            <div>
                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                    {theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    Switch visual color scheme
                                </p>
                            </div>
                            <Button
                                onClick={toggleTheme}
                                variant="secondary"
                                size="sm"
                                className="rounded-xl flex items-center gap-1.5 font-extrabold text-xs"
                            >
                                {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-400" />}
                                {theme === 'dark' ? 'Light' : 'Dark'}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right 2 cols: Change Password Card */}
                <div className="lg:col-span-2">
                    <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5">
                        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/5 flex items-center gap-3 bg-slate-50/60 dark:bg-slate-900/50">
                            <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-500/20 shadow-sm">
                                <KeyRound size={18} />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Security & Credentials</h2>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Update your personal account password</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordChange} className="p-5 sm:p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPw ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        placeholder="Enter current password"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/70 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPw ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            placeholder="Min 4 characters"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/70 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPw(!showNewPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                                        >
                                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Confirm New Password</label>
                                    <input
                                        type={showNewPw ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="Re-enter new password"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/70 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            {pwStatus && (
                                <div className={cn(
                                    "text-xs font-extrabold px-4 py-3 rounded-xl border flex items-center gap-2",
                                    pwStatus.type === 'success'
                                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                        : "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20"
                                )}>
                                    {pwStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    {pwStatus.message}
                                </div>
                            )}

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={pwLoading}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
                                >
                                    {pwLoading ? 'Updating Password...' : 'Update Password'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MemberSettings;
