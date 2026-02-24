import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
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
    Moon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import api from '../../lib/api';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { notifications } = useData();
    const { theme, toggleTheme } = useTheme();
    const [currentManager, setCurrentManager] = useState(null);

    // Fetch current manager
    useEffect(() => {
        const fetchCurrentManager = async () => {
            try {
                const response = await api.get('/managers');
                // Get the most recent manager record
                if (response.data.length > 0) {
                    setCurrentManager(response.data[0]); // Assuming the API returns sorted by date DESC
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
    // Logic: user sees notifications where userId is their ID OR 'all'
    const currentUserId = user?.id || user?._id || user?.userId;
    const unreadCount = notifications ? notifications.filter(n =>
        (n.userId === currentUserId || n.userId === 'all') && !n.isRead && n.type !== 'market_request'
    ).length : 0;

    if (!user) return null;

    const adminLinks = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/members', icon: Users, label: 'Members' },
        { to: '/market', icon: ShoppingBag, label: 'Market Duty' },
        { to: '/add-expense', icon: CreditCard, label: 'Finance' }, // New Admin Finance Link
        { to: '/meals', icon: Utensils, label: 'Meals' },
        { to: '/expenses', icon: Receipt, label: 'Expenses' },
        { to: '/calculator', icon: Calculator, label: 'Calculator' },
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
                "w-64 bg-white dark:bg-slate-950 border-r border-indigo-100/50 dark:border-slate-900 flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 bg-clip-text text-transparent tracking-tight">
                            Rani Bhawban Mess
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase tracking-widest">
                            {user.role === 'admin' ? (
                                <>Manager • {currentManager ? currentManager.memberName.split(' ')[0] : user.name.split(' ')[0]}</>
                            ) : (
                                <>Member • {user.name.split(' ')[0]}</>
                            )}
                        </p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => window.innerWidth < 768 && onClose && onClose()}
                            className={({ isActive }) => cn(
                                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 relative',
                                isActive
                                    ? 'bg-indigo-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                            )}
                        >
                            <link.icon size={18} />
                            <span className="flex-1">{link.label}</span>
                            {link.label === 'Notifications' && unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={toggleTheme}
                    >
                        {theme === 'light' ? (
                            <>
                                <Moon size={18} className="mr-3" />
                                Dark Mode
                            </>
                        ) : (
                            <>
                                <Sun size={18} className="mr-3 text-yellow-500" />
                                Light Mode
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={logout}
                    >
                        <LogOut size={18} />
                        Logout
                    </Button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
