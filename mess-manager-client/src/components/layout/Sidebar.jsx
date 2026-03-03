import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import { getAvatarUrl } from '../ui/AvatarPicker';
import {
    LayoutDashboard,
    Users,
    Utensils,
    Receipt,
    Bell,
    LogOut,
    ShoppingBag,
    CreditCard,
    Calculator,
    Settings as SettingsIcon,
    UserCheck,
    FileText,
    Sun,
    Moon,
    ClipboardList
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import api from '../../lib/api';

const Sidebar = ({ isOpen, onClose, isCollapsed = false }) => {
    const { user, logout } = useAuth();
    const { notifications, members } = useData();
    const { theme, toggleTheme } = useTheme();
    const [currentManager, setCurrentManager] = useState(null);

    // Get current member's avatar
    const currentMember = members?.find(m => m._id === user?.id || m.id === user?.id);
    const avatarSeed = currentMember?.avatar;
    const avatarUrl = user?.role === 'member' && avatarSeed ? getAvatarUrl(avatarSeed) : null;

    // Fetch current manager
    useEffect(() => {
        const fetchCurrentManager = async () => {
            try {
                const response = await api.get('/managers');
                if (response.data.length > 0) {
                    setCurrentManager(response.data[0]);
                }
            } catch (error) {
                console.error('Error fetching manager:', error);
            }
        };

        if (user?.role === 'admin') {
            fetchCurrentManager();
        }
    }, [user]);

    // Calculate unread notifications
    const currentUserId = user?.id || user?._id || user?.userId;
    const unreadCount = notifications ? notifications.filter(n =>
        (n.userId === currentUserId || n.userId === 'all') && !n.isRead && n.type !== 'market_request'
    ).length : 0;

    if (!user) return null;

    const adminLinks = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/members', icon: Users, label: 'Members' },
        { to: '/market', icon: ShoppingBag, label: 'Market Duty' },
        { to: '/add-expense', icon: CreditCard, label: 'Finance' },
        { to: '/meals', icon: Utensils, label: 'Meals' },
        { to: '/expenses', icon: Receipt, label: 'Expenses' },
        { to: '/calculator', icon: Calculator, label: 'Calculator' },
        { to: '/monthly-summary', icon: ClipboardList, label: 'Monthly Summary' },
        { to: '/settings', icon: SettingsIcon, label: 'Settings' },
        { to: '/management', icon: UserCheck, label: 'Management' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
    ];

    const memberLinks = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/member-meals', icon: Utensils, label: 'Meals' },
        { to: '/market', icon: ShoppingBag, label: 'Market Duty' },
        { to: '/add-expense', icon: Receipt, label: 'Add Expense' },
        { to: '/payments', icon: CreditCard, label: 'Payments' },
        { to: '/spices-others', icon: ShoppingBag, label: 'Spices & Others' },
        { to: '/reports', icon: FileText, label: 'Reports' },
        { to: '/member-notifications', icon: Bell, label: 'Notifications' },
    ];

    const links = user.role === 'admin' ? adminLinks : memberLinks;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 md:translate-x-0",
                "border-r border-indigo-900/20 dark:border-slate-900",
                "bg-gradient-to-b from-indigo-700 via-indigo-800 to-violet-900 dark:bg-none dark:bg-slate-950",
                "shadow-[4px_0_32px_-4px_rgba(79,70,229,0.35)] dark:shadow-none",
                isCollapsed ? "w-16" : "w-64",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className={cn(
                    "border-b border-white/10 dark:border-slate-900 flex items-center transition-all duration-300",
                    isCollapsed ? "p-3 justify-center" : "p-5 justify-between"
                )}>
                    {!isCollapsed && (
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight">
                                Rani Bhawban Mess
                            </h2>
                            <p className="text-xs text-indigo-200 dark:text-slate-500 mt-0.5 font-bold uppercase tracking-widest">
                                {user.role === 'admin' ? (
                                    <>Manager • {currentManager ? currentManager.memberName.split(' ')[0] : user.name.split(' ')[0]}</>
                                ) : (
                                    <>Member • {user.name.split(' ')[0]}</>
                                )}
                            </p>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="w-8 h-8 rounded-xl overflow-hidden border-2 border-white/30 dark:border-indigo-900/40">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={user.name} className="w-full h-full" />
                            ) : (
                                <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-black text-xs">
                                    {(user.name || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto custom-scrollbar">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => window.innerWidth < 768 && onClose && onClose()}
                            title={isCollapsed ? link.label : undefined}
                            className={({ isActive }) => cn(
                                'flex items-center gap-3 rounded-xl text-sm font-bold transition-all duration-200 relative group',
                                isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-4 py-2.5',
                                isActive
                                    ? 'bg-white/20 dark:bg-primary-500/10 text-white dark:text-primary-400 shadow-sm'
                                    : 'text-indigo-200 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-slate-900 hover:text-white dark:hover:text-slate-200'
                            )}
                        >
                            <link.icon size={18} className="shrink-0" />
                            {!isCollapsed && (
                                <span className="flex-1 truncate">{link.label}</span>
                            )}
                            {/* Unread badge */}
                            {link.label === 'Notifications' && unreadCount > 0 && (
                                <span className={cn(
                                    "bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center",
                                    isCollapsed ? "absolute top-1 right-1 px-1 py-0" : "px-1.5 py-0.5"
                                )}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                            {/* Tooltip when collapsed */}
                            {isCollapsed && (
                                <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg">
                                    {link.label}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Buttons */}
                <div className={cn(
                    "border-t border-white/10 dark:border-gray-800 space-y-1",
                    isCollapsed ? "p-2" : "p-4"
                )}>
                    <button
                        onClick={toggleTheme}
                        title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        className={cn(
                            "w-full flex items-center rounded-xl text-indigo-200 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-gray-800 hover:text-white transition-colors font-bold text-sm",
                            isCollapsed ? "justify-center p-2.5" : "gap-3 px-4 py-2.5"
                        )}
                    >
                        {theme === 'light'
                            ? <Moon size={18} className={isCollapsed ? '' : 'mr-0'} />
                            : <Sun size={18} className={cn("text-yellow-400", isCollapsed ? '' : 'mr-0')} />
                        }
                        {!isCollapsed && (theme === 'light' ? 'Dark Mode' : 'Light Mode')}
                    </button>
                    <button
                        onClick={logout}
                        title="Logout"
                        className={cn(
                            "w-full flex items-center rounded-xl text-red-300 dark:text-red-500 hover:bg-red-500/20 dark:hover:bg-red-950/20 hover:text-red-100 transition-colors font-bold text-sm",
                            isCollapsed ? "justify-center p-2.5" : "gap-3 px-4 py-2.5"
                        )}
                    >
                        <LogOut size={18} />
                        {!isCollapsed && 'Logout'}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
