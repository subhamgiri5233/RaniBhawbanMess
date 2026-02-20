import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Settings as SettingsIcon, Lock, Shield, Key, RefreshCw, Eye, EyeOff } from 'lucide-react';
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

    useEffect(() => {
        fetchSettings();
    }, []);

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
        const locations = {
            'clear_notifications_password': 'Notifications page → Purge System Ledger button',
            'clear_guests_password': 'Meals page → Clear All Guests button',
            'clear_all_meals_password': 'Meals page → Clear All Meals button',
            'clear_expenses_password': 'Expenses page → Clear All History button'
        };
        return locations[key] || 'System';
    };

    const getSettingDisplayName = (key) => {
        const names = {
            'clear_notifications_password': 'Clear Notification History',
            'clear_guests_password': 'Clear Guest Meals',
            'clear_all_meals_password': 'Clear All Meals',
            'clear_expenses_password': 'Clear Expense History'
        };
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

            {/* Password-Protected Features */}
            <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-6">Password-Protected Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {settings.map((setting) => (
                        <Card key={setting.key} className="p-6 border-indigo-100/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/40 backdrop-blur-lg shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl scale-110">
                                        {getSettingIcon(setting.category)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                            {setting.description || setting.key}
                                        </h3>

                                        {/* Current Password Display */}
                                        <div className="mt-3">
                                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Current Password</p>
                                            <div className="flex items-center gap-2 bg-[#f4f7ff] dark:bg-slate-900/80 px-4 py-2 rounded-xl border border-indigo-100/50 dark:border-white/5 w-fit">
                                                <code className="text-sm font-black font-mono text-primary-600 dark:text-primary-400">
                                                    {showPasswords[setting.key] ? setting.value : '••••••••'}
                                                </code>
                                                <button
                                                    onClick={() => toggleShowPassword(setting.key)}
                                                    className="text-slate-400 hover:text-primary-600 transition-colors ml-2"
                                                    title={showPasswords[setting.key] ? 'Hide password' : 'Show password'}
                                                >
                                                    {showPasswords[setting.key] ? (
                                                        <EyeOff size={16} />
                                                    ) : (
                                                        <Eye size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                <span className="uppercase tracking-widest opacity-50">Used in:</span> {getSettingLocation(setting.key)}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                Updated {new Date(setting.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {editingKey !== setting.key && (
                                    <button
                                        onClick={() => setEditingKey(setting.key)}
                                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-600 hover:text-white transition-all transform hover:scale-105"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {editingKey === setting.key && (
                                <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-950/20 rounded-2xl border-2 border-primary-200 dark:border-primary-800/50">
                                    <div className="space-y-4">
                                        <Input
                                            label="Verify Current Password"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                        <Input
                                            label="New Password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleUpdatePassword(setting.key)}
                                                disabled={updating}
                                                className="flex-1"
                                            >
                                                {updating ? 'Updating...' : 'Save New Password'}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setEditingKey(null);
                                                    setNewPassword('');
                                                    setCurrentPassword('');
                                                }}
                                                variant="outline"
                                                className="flex-1 bg-white dark:bg-slate-800"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>

            {/* Sensitive Information Vault */}
            <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-6 flex items-center gap-3">
                    <Shield size={24} className="text-red-600 dark:text-red-400" />
                    Sensitive Information Vault
                </h2>
                <Card className="p-0 overflow-hidden border-l-4 border-l-red-500 bg-white/90 dark:bg-slate-900/40 border-indigo-100/50 dark:border-white/5 backdrop-blur-xl">
                    <div className="p-4 bg-indigo-50/30 dark:bg-red-500/10 border-b border-indigo-100/50 dark:border-red-900/30">
                        <p className="text-[10px] text-slate-500 dark:text-red-400 font-black flex items-center gap-2 uppercase tracking-widest">
                            <Lock size={14} />
                            ⚠️ Critical Security Information - Keep these passwords confidential!
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-indigo-50/20 dark:bg-red-950/40 text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-red-300 border-b border-indigo-100/50 dark:border-red-900/50">
                                    <th className="p-5 font-black">Feature Area</th>
                                    <th className="p-5 font-black">Secure Password</th>
                                    <th className="p-5 font-black">System Location</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-red-900/20 font-bold">
                                {settings.map((setting) => (
                                    <tr key={setting.key} className="hover:bg-slate-50 dark:hover:bg-red-500/5 transition-all">
                                        <td className="p-5">
                                            <span className="text-slate-700 dark:text-slate-100">{getSettingDisplayName(setting.key)}</span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <code className="px-4 py-1.5 bg-[#f4f7ff] dark:bg-slate-900 border border-indigo-100/50 dark:border-red-800 rounded-xl font-black font-mono text-sm text-red-600 dark:text-red-400 shadow-sm">
                                                    {showVaultPasswords[setting.key] ? (setting.value || '••••••••') : '••••••••'}
                                                </code>
                                                <button
                                                    onClick={() => setShowVaultPasswords(prev => ({ ...prev, [setting.key]: !prev[setting.key] }))}
                                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                                    title={showVaultPasswords[setting.key] ? 'Hide password' : 'Show password'}
                                                >
                                                    {showVaultPasswords[setting.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-xs text-slate-400 dark:text-slate-400 italic">Used in {getSettingLocation(setting.key)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-orange-950/20 border-t border-slate-100 dark:border-orange-900/30">
                        <p className="text-[10px] text-slate-500 dark:text-orange-400 font-black uppercase tracking-widest flex items-center gap-2">
                            💡 Tip: These passwords are required for critical system deletions. You can change them using the Edit button above.
                        </p>
                    </div>
                </Card>
            </div>

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
