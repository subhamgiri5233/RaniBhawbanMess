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
    LogOut,
    ShoppingBag,
    CreditCard,
    Calculator,
    Settings as SettingsIcon,
    UserCheck,
    FileText,
    Sun,
    Moon,
    ClipboardList,
    Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import api from '../../lib/api';

const Sidebar = ({ isOpen, onClose, isCollapsed = false }) => {
    const { user, logout } = useAuth();
    const { members } = useData();
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


    if (!user) return null;

    const adminLinks = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/members', icon: Users, label: 'Members' },
        { to: '/market', icon: ShoppingBag, label: 'Market Duty' },
        { to: '/add-expense', icon: CreditCard, label: 'Finance' },
        { to: '/meals', icon: Utensils, label: 'Meals' },
        { to: '/expenses', icon: Receipt, label: 'Expenses' },
        { to: '/calculator', icon: Calculator, label: 'Calculator' },
        { to: '/management', icon: UserCheck, label: 'Management' },
        { to: '/monthly-summary', icon: ClipboardList, label: 'Monthly Summary' },
        { to: '/settings', icon: SettingsIcon, label: 'Settings' },
        { to: '/bin', icon: Trash2, label: 'Bin' },

    ];

    const memberLinks = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/market', icon: ShoppingBag, label: 'Market Duty' },
        { to: '/member-meals', icon: Utensils, label: 'Meals' },
        { to: '/add-expense', icon: CreditCard, label: 'Add Expense' },
        { to: '/member-expenses', icon: Receipt, label: 'Expenses' },
        { to: '/payments', icon: CreditCard, label: 'Payments' },
        { to: '/reports', icon: FileText, label: 'Reports' },
        { to: '/settings', icon: SettingsIcon, label: 'Settings' },
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
                "border-r border-slate-800/80",
                "bg-[#090d16]/95 dark:bg-slate-950/95 backdrop-blur-2xl text-slate-100",
                "shadow-[4px_0_32px_-4px_rgba(0,0,0,0.5)]",
                isCollapsed ? "w-16" : "w-64",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className={cn(
                    "border-b border-slate-800/80 flex items-center transition-all duration-300",
                    isCollapsed ? "p-3 justify-center" : "p-5 justify-between"
                )}>
                    {!isCollapsed && (
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shadow-inner border border-indigo-500/30 overflow-hidden">
                                    <img src="/icons/home.png" alt="Logo" className="w-5 h-5 object-contain" />
                                </div>
                                <h2 className="text-base font-black text-white tracking-tight">
                                    Rani Bhawban Mess
                                </h2>
                            </div>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                                {user.role === 'admin' ? (
                                    <>Manager • {currentManager ? currentManager.memberName.split(' ')[0] : user.name.split(' ')[0]}</>
                                ) : (
                                    <>Member • {user.name.split(' ')[0]}</>
                                )}
                            </p>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-500/40 shrink-0">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={user.name} className="w-full h-full" />
                            ) : (
                                <div className="w-full h-full bg-indigo-600/30 flex items-center justify-center text-white font-black text-xs">
                                    {(user.name || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto custom-scrollbar">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => window.innerWidth < 768 && onClose && onClose()}
                            title={isCollapsed ? link.label : undefined}
                            className={({ isActive }) => cn(
                                'flex items-center gap-3 rounded-xl text-sm font-bold transition-all duration-200 relative group border',
                                isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3.5 py-2.5',
                                isActive
                                    ? 'bg-indigo-600/20 text-white border-indigo-500/40 shadow-sm'
                                    : 'border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 hover:border-slate-800'
                            )}
                        >
                            <link.icon size={18} className="shrink-0 text-slate-400 group-hover:text-white" />
                            {!isCollapsed && (
                                <span className="flex-1 truncate">{link.label}</span>
                            )}
                            {/* Tooltip when collapsed */}
                            {isCollapsed && (
                                <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg border border-slate-800">
                                    {link.label}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Buttons */}
                <div className={cn(
                    "border-t border-slate-800/80 space-y-1",
                    isCollapsed ? "p-2" : "p-3.5"
                )}>
                    <button
                        onClick={toggleTheme}
                        title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        className={cn(
                            "w-full flex items-center rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors font-bold text-sm",
                            isCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"
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
                            "w-full flex items-center rounded-xl text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors font-bold text-sm",
                            isCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"
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


