import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Settings as SettingsIcon, Lock, Shield, Key, RefreshCw, Eye, EyeOff, Database, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';

const Settings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingKey, setEditingKey] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [updating, setUpdating] = useState(false);
    const [showPasswords, setShowPasswords] = useState({});
    const [showVaultPasswords, setShowVaultPasswords] = useState({});

    // Admin password change state
    const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
    const [adminNewUsername, setAdminNewUsername] = useState('');
    const [adminNewPassword, setAdminNewPassword] = useState('');
    const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
    const [adminUpdating, setAdminUpdating] = useState(false);

    // Monthly data deletion state
    const { globalMonth, clearMonthlyData, getMonthlyDataPreview } = useData();
    const [deleteMonth, setDeleteMonth] = useState(globalMonth);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [previewStats, setPreviewStats] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (deleteMonth) {
            fetchPreview();
        }
    }, [deleteMonth]);

    const fetchPreview = async () => {
        try {
            setLoadingPreview(true);
            const result = await getMonthlyDataPreview(deleteMonth);
            if (result.success) {
                setPreviewStats(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch preview:', error);
        } finally {
            setLoadingPreview(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleShowPassword = (key) => {
        setShowPasswords(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleUpdatePassword = async (key) => {
        if (!newPassword) {
            alert('Please enter a new password');
            return;
        }

        if (!currentPassword) {
            alert('Please enter the current password to verify');
            return;
        }

        try {
            setUpdating(true);
            await api.put(`/settings/${key}`, {
                value: newPassword,
                currentPassword
            });

            alert('Password updated successfully!');
            setEditingKey(null);
            setNewPassword('');
            setCurrentPassword('');
            fetchSettings();
        } catch (error) {
            alert(`Failed to update password: ${error.response?.data?.message || 'Unknown error'}`);
        } finally {
            setUpdating(false);
        }
    };

    const getSettingIcon = (category) => {
        switch (category) {
            case 'security':
                return <Shield size={20} className="text-red-600" />;
            case 'feature':
                return <Key size={20} className="text-indigo-600" />;
            default:
                return <Lock size={20} className="text-gray-600" />;
        }
    };

    const getSettingLocation = (key) => {
        const locations = {};
        return locations[key] || 'System';
    };

    const getSettingDisplayName = (key) => {
        const names = {};
        return names[key] || key;
    };

    const handleAdminPasswordChange = async () => {
        if (!adminCurrentPassword) {
            alert('Please enter your current password');
            return;
        }

        if (!adminNewPassword) {
            alert('Please enter a new password');
            return;
        }

        if (adminNewPassword !== adminConfirmPassword) {
            alert('New passwords do not match');
            return;
        }

        if (adminNewPassword.length < 6) {
            alert('New password must be at least 6 characters long');
            return;
        }

        try {
            setAdminUpdating(true);
            const response = await api.put('/admin/change-password', {
                currentPassword: adminCurrentPassword,
                newUsername: adminNewUsername || undefined,
                newPassword: adminNewPassword
            });

            alert(`Admin credentials updated successfully! ${adminNewUsername ? `New username: ${adminNewUsername}` : ''}`);
            setAdminCurrentPassword('');
            setAdminNewUsername('');
            setAdminNewPassword('');
            setAdminConfirmPassword('');
        } catch (error) {
            alert(`Failed to update credentials: ${error.response?.data?.message || 'Unknown error'}`);
        } finally {
            setAdminUpdating(false);
        }
    };

    const handleClearMonthData = async () => {
        if (!deletePassword) {
            alert('Please enter your admin password');
            return;
        }

        if (!window.confirm(`⚠️ CRITICAL WARNING: You are about to PERMANENTLY DELETE all data for ${deleteMonth}.\n\nThis includes:\n- Regular Meals\n- Guest Meals\n- Expenses\n- Market Requests\n- Cooking Records\n- Manager Records\n\nARE YOU ABSOLUTELY SURE?`)) {
            return;
        }

        try {
            setDeleting(true);
            const result = await clearMonthlyData(deleteMonth, deletePassword);
            if (result.success) {
                alert(`Successfully cleared all data for ${deleteMonth}!\nTotal records deleted: ${result.data.totalDeleted}`);
                setDeletePassword('');
                setShowDeleteConfirm(false);
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Deletion error:', error);
            alert('An unexpected error occurred during deletion.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <RefreshCw className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
                    <SettingsIcon size={28} className="text-primary-600 dark:text-primary-400" />
                    Admin Settings
                </h1>
            </div>

            {/* Account Information */}
            <Card className="p-6 border-l-4 border-l-primary-500 bg-white/90 dark:bg-slate-900/40 border-indigo-100/50 dark:border-white/5 backdrop-blur-xl">
                <h2 className="text-lg font-black text-slate-900 dark:text-primary-100 tracking-tight mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-primary-600 dark:text-primary-400" />
                    Account Information
                </h2>
                <div className="space-y-2 text-sm font-bold">
                    <p><span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest block mb-1">Logged in as</span> <span className="text-slate-900 dark:text-slate-100">{user?.name || 'Admin'}</span></p>
                    <p><span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest block mb-1">Username</span> <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">{user?.username || 'Admin'}</span></p>
                    <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-6 uppercase tracking-widest font-black">
                        ⚠️ Keep your passwords secure and change them regularly
                    </p>
                </div>
            </Card>

            {/* Change Admin Login Credentials */}
            <Card className="p-6 border-l-4 border-l-emerald-500 bg-white/90 dark:bg-slate-900/40 border-indigo-100/50 dark:border-white/5 backdrop-blur-xl">
                <h2 className="text-lg font-black text-slate-900 dark:text-emerald-50 tracking-tight mb-4 flex items-center gap-2">
                    <Key size={20} className="text-emerald-600 dark:text-emerald-400" />
                    Change Admin Login Credentials
                </h2>
                <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-600 dark:text-emerald-400 mb-6">
                        Update your admin login username and password. You will need these credentials to log in.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Current Password"
                            type="password"
                            value={adminCurrentPassword}
                            onChange={(e) => setAdminCurrentPassword(e.target.value)}
                            required
                        />

                        <Input
                            label="New Username (optional)"
                            type="text"
                            value={adminNewUsername}
                            onChange={(e) => setAdminNewUsername(e.target.value)}
                        />

                        <Input
                            label="New Password"
                            type="password"
                            value={adminNewPassword}
                            onChange={(e) => setAdminNewPassword(e.target.value)}
                            required
                        />

                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={adminConfirmPassword}
                            onChange={(e) => setAdminConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-3 mt-4">
                        <Button
                            onClick={handleAdminPasswordChange}
                            disabled={adminUpdating}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {adminUpdating ? 'Updating...' : 'Update Admin Credentials'}
                        </Button>
                        <Button
                            onClick={() => {
                                setAdminCurrentPassword('');
                                setAdminNewUsername('');
                                setAdminNewPassword('');
                                setAdminConfirmPassword('');
                            }}
                            variant="secondary"
                        >
                            Clear Form
                        </Button>
                    </div>

                    <div className="mt-6 p-4 bg-emerald-100/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                        <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-black uppercase tracking-widest flex items-center gap-2">
                            ⚠️ <strong>Warning:</strong> After changing credentials, you will need to use the new username and password to log in next time.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Monthly Data Management */}
            <Card className="p-6 border-l-4 border-l-rose-500 bg-white/90 dark:bg-slate-900/40 border-indigo-100/50 dark:border-white/5 backdrop-blur-xl">
                <h2 className="text-lg font-black text-slate-900 dark:text-rose-50 tracking-tight mb-4 flex items-center gap-2">
                    <Database size={20} className="text-rose-600 dark:text-rose-400" />
                    Monthly Data Management
                </h2>
                <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-600 dark:text-rose-400 mb-6 font-mono border-b border-rose-100/30 pb-2">
                        Use this feature to clear all records for a specific business month. This is useful for monthly resets or data cleanup.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Select Target Month</label>
                            <div className="relative group">
                                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="month"
                                    value={deleteMonth}
                                    onChange={(e) => setDeleteMonth(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <Input
                            label="Admin Password to Confirm"
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter password..."
                        />
                    </div>

                    {/* Preview Stats */}
                    {deleteMonth && (
                        <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden relative">
                            {loadingPreview && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                                    <RefreshCw className="animate-spin text-primary-500" size={20} />
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Month Snapshot: {deleteMonth}</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">Items Found</div>
                                        <div className="text-xl font-black text-slate-900 dark:text-white leading-none">{previewStats?.totalItems || 0}</div>
                                    </div>
                                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10" />
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Space to Free</div>
                                        <div className="text-xl font-black text-slate-900 dark:text-white leading-none">{previewStats?.totalSizeFormatted || '0 KB'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {previewStats?.stats.map((stat) => (
                                    <div key={stat.name} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">
                                            {stat.name.replace(/([A-Z])/g, ' $1').trim()}
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-black text-slate-700 dark:text-slate-200">{stat.count}</span>
                                            <span className="text-[9px] font-bold text-slate-400">rec.</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        {!showDeleteConfirm ? (
                            <Button
                                onClick={() => {
                                    if (!deletePassword) {
                                        alert('Please enter your admin password first');
                                        return;
                                    }
                                    setShowDeleteConfirm(true);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 font-black uppercase tracking-widest text-[10px] py-4 shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2 px-8"
                            >
                                <Trash2 size={16} />
                                Initialize Month Cleanup
                            </Button>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Button
                                    onClick={handleClearMonthData}
                                    disabled={deleting}
                                    className="bg-red-700 hover:bg-red-800 font-black uppercase tracking-widest text-[10px] py-4 shadow-xl shadow-red-500/40 flex items-center justify-center gap-2 flex-[2]"
                                >
                                    {deleting ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Wiping Data...
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={16} />
                                            CONFIRM PERMANENT DELETE FOR {deleteMonth}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    variant="secondary"
                                    className="flex-1 font-black uppercase tracking-widest text-[10px] py-4"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-rose-100/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl">
                        <p className="text-[11px] text-rose-800 dark:text-rose-300 font-bold leading-relaxed flex gap-3 italic">
                            <AlertTriangle size={24} className="shrink-0 text-rose-500" />
                            <span>
                                <strong>Safety Warning:</strong> This operation will clear all meals, guest records, market assignments, cooking duties, and expenses for the selected month. The members themselves and their profiles will NOT be deleted.
                            </span>
                        </p>
                    </div>
                </div>
            </Card>

            {/* Sensitive Information Vault - REMOVED for safety */}

            {/* Info Card */}
            <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30">
                <h3 className="font-black text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2 tracking-tight">
                    <Lock size={18} className="text-amber-600 dark:text-amber-400" />
                    Security Best Practices
                </h3>
                <ul className="text-sm font-bold text-amber-800 dark:text-amber-300/80 space-y-2">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Use strong, unique passwords for each feature</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Change passwords regularly to maintain security</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Never share your administrator passwords with others</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Keep a secure, encrypted backup of all system keys</li>
                </ul>
            </Card>
        </div>
    );
};

export default Settings;
