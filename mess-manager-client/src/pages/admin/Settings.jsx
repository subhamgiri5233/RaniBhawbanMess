import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Settings as SettingsIcon, Lock, Shield, Key, RefreshCw, Eye, EyeOff, Database, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';

import MemberSettings from '../member/MemberSettings';

const Settings = () => {
    const { user } = useAuth();
    if (user && user.role !== 'admin') {
        return <MemberSettings />;
    }

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
                <RefreshCw className="animate-spin text-primary-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
                        <SettingsIcon size={26} className="text-indigo-600 dark:text-indigo-400" />
                        Admin Settings
                    </h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                        Security preferences, administrator credentials, and monthly resets
                    </p>
                </div>
            </div>

            {/* Account Information */}
            <Card className="p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-white/5 border-l-4 border-l-indigo-600">
                <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <Shield size={18} className="text-indigo-600 dark:text-indigo-400" />
                    Account Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-white/5">
                        <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider block mb-1">Logged in as</span> 
                        <span className="text-slate-900 dark:text-slate-100 font-extrabold text-sm">{user?.name || 'Admin'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-white/5">
                        <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider block mb-1">Username</span> 
                        <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">{user?.username || 'Admin'}</span>
                    </div>
                </div>
            </Card>

            {/* Change Admin Login Credentials */}
            <Card className="p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-white/5 border-l-4 border-l-emerald-600">
                <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <Key size={18} className="text-emerald-600 dark:text-emerald-400" />
                    Change Admin Login Credentials
                </h2>
                <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Update your administrator username and password for authentication.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleAdminPasswordChange}
                            disabled={adminUpdating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm"
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
                            className="px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider"
                        >
                            Clear Form
                        </Button>
                    </div>

                     <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-extrabold uppercase tracking-wider flex items-center gap-2">
                            ⚠️ Note: After changing credentials, you will need to log in again using the updated password.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Monthly Data Management */}
            <Card className="p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-white/5 border-l-4 border-l-rose-600">
                <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-50">
                    <Database size={18} className="text-rose-600 dark:text-rose-400" />
                    Monthly Data Management
                </h2>
                <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Select a specific month to preview and purge records if required.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Target Month</label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="month"
                                    value={deleteMonth}
                                    onChange={(e) => setDeleteMonth(e.target.value)}
                                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-extrabold uppercase tracking-wider outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
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
                        <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-white/5 relative">
                            {loadingPreview && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                                    <RefreshCw className="animate-spin text-indigo-600" size={18} />
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Month Snapshot: {deleteMonth}</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider leading-none mb-0.5">Items Found</div>
                                        <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">{previewStats?.totalItems || 0}</div>
                                    </div>
                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                                    <div className="text-right">
                                        <div className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider leading-none mb-0.5">Space to Free</div>
                                        <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">{previewStats?.totalSizeFormatted || '0 KB'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {previewStats?.stats.map((stat) => (
                                    <div key={stat.name} className="group p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-sm">
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
                                                {stat.name.replace(/([A-Z])/g, ' $1').trim()}
                                            </div>
                                            {stat.count > 0 && (
                                                <button
                                                    onClick={() => {
                                                        if (!deletePassword) {
                                                            alert('Please enter your admin password first');
                                                            return;
                                                        }
                                                        if (window.confirm(`Are you sure you want to delete all ${stat.name.replace(/([A-Z])/g, ' $1').trim()} for ${deleteMonth}?`)) {
                                                            const handleClearCategoryData = async () => {
                                                                try {
                                                                    setDeleting(true);
                                                                    const result = await clearMonthlyData(deleteMonth, deletePassword, stat.name);
                                                                    if (result.success) {
                                                                        alert(`Successfully cleared ${stat.name} for ${deleteMonth}!`);
                                                                        fetchPreview();
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
                                                            handleClearCategoryData();
                                                        }
                                                    }}
                                                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                    title={`Delete ${stat.name}`}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">{stat.count}</span>
                                            <span className="text-[9px] font-bold text-slate-400">records</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        {!showDeleteConfirm ? (
                            <Button
                                onClick={() => {
                                    if (!deletePassword) {
                                        alert('Please enter your admin password first');
                                        return;
                                    }
                                    setShowDeleteConfirm(true);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold uppercase tracking-wider text-xs py-2.5 px-6 rounded-xl shadow-sm flex items-center justify-center gap-2"
                            >
                                <Trash2 size={14} />
                                Initialize Month Cleanup
                            </Button>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                                <Button
                                    onClick={handleClearMonthData}
                                    disabled={deleting}
                                    className="bg-rose-700 hover:bg-rose-800 text-white font-extrabold uppercase tracking-wider text-xs py-2.5 px-6 rounded-xl shadow-sm flex items-center justify-center gap-2 flex-[2]"
                                >
                                    {deleting ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            Wiping Data...
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={14} />
                                            CONFIRM PERMANENT DELETE FOR {deleteMonth}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    variant="secondary"
                                    className="flex-1 font-extrabold uppercase tracking-wider text-xs py-2.5 rounded-xl"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <p className="text-[10px] text-rose-800 dark:text-rose-300 font-bold leading-relaxed flex gap-2">
                            <AlertTriangle size={18} className="shrink-0 text-rose-600" />
                            <span>
                                <strong>Safety Warning:</strong> This operation clears logs, meals, market entries, and expenses for the target month. Member identities remain intact.
                            </span>
                        </p>
                    </div>
                </div>
            </Card>

            {/* Security Best Practices */}
            <Card className="p-6 shadow-sm border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Lock size={16} className="text-amber-500" />
                    Security Best Practices
                </h3>
                <ul className="text-xs font-bold text-slate-600 dark:text-slate-400 space-y-1.5">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Use strong, unique passwords for administrator access</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Change passwords regularly to maintain data integrity</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Never share administrator credentials with unauthorized users</li>
                </ul>
            </Card>
        </div>
    );
};

export default Settings;


