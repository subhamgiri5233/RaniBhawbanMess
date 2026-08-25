import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Utensils,
    Receipt,
    Plus,
    Menu,
    X,
    Users,
    ShoppingBag,
    Calculator,
    UserCheck,
    ClipboardList,
    Settings,
    Trash2,
    FileText,
    CreditCard,
    ArrowUpRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

const BottomNav = ({ onOpenSidebar }) => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showQuickSheet, setShowQuickSheet] = useState(false);
    const sheetRef = useRef(null);

    if (!user) return null;

    const isAdmin = user.role === 'admin';

    // Close quick sheet on route change or outside click
    useEffect(() => {
        setShowQuickSheet(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sheetRef.current && !sheetRef.current.contains(e.target)) {
                setShowQuickSheet(false);
            }
        };
        if (showQuickSheet) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showQuickSheet]);

    // Admin primary bottom tabs
    const adminMainLinks = [
        { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/expenses', label: 'Expenses', icon: Receipt },
        // Center button handled separately
        { to: '/monthly-summary', label: 'Monthly Summary', icon: ClipboardList },
    ];

    // Member primary bottom tabs
    const memberMainLinks = [
        { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/member-expenses', label: 'Expenses', icon: Receipt },
        // Center button handled separately
        { to: '/reports', label: 'Monthly Summary', icon: ClipboardList },
    ];

    const mainLinks = isAdmin ? adminMainLinks : memberMainLinks;

    // Quick Action shortcuts for center '+' button
    const quickActions = isAdmin ? [
        { to: '/add-expense', label: 'Add Finance / Deposit', desc: 'Deposit, spice, rice, gas etc.', icon: CreditCard, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
        { to: '/meals', label: 'Record Meals', desc: 'Add lunch, dinner, guest meals', icon: Utensils, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
        { to: '/market', label: 'Market Schedule', desc: 'Assign & verify market duty', icon: ShoppingBag, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
        { to: '/calculator', label: 'Mess Calculator', desc: 'Real-time billing & rates', icon: Calculator, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    ] : [
        { to: '/add-expense', label: 'Add Market Expense', desc: 'Submit grocery or market bill', icon: ShoppingBag, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
        { to: '/member-meals', label: 'My Meals', desc: 'View and toggle meal entries', icon: Utensils, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
        { to: '/market', label: 'Market Duty Request', desc: 'Request or check shopping day', icon: ShoppingBag, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
        { to: '/reports', label: 'Monthly Report', desc: 'Download PDF / Excel statement', icon: FileText, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    ];

    const isCenterActive = location.pathname === '/add-expense';

    return (
        <>
            {/* Quick Action Bottom Sheet Modal */}
            {showQuickSheet && (
                <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300 flex items-end justify-center p-3 pb-20 animate-fade-in">
                    <div
                        ref={sheetRef}
                        className="w-full max-w-md bg-white dark:bg-slate-900 border border-indigo-100 dark:border-white/10 rounded-3xl p-4 shadow-2xl space-y-3.5"
                    >
                        <div className="flex items-center justify-between pb-2.5 border-b border-indigo-50 dark:border-white/5">
                            <div>
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                    Quick Action
                                </h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    Fast entry & direct navigation
                                </p>
                            </div>
                            <button
                                onClick={() => setShowQuickSheet(false)}
                                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {quickActions.map((action) => (
                                <button
                                    key={action.to}
                                    onClick={() => {
                                        navigate(action.to);
                                        setShowQuickSheet(false);
                                    }}
                                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-indigo-50/40 dark:bg-slate-800/60 hover:bg-indigo-100/60 dark:hover:bg-slate-800 border border-indigo-100/50 dark:border-white/5 transition-all text-left group active:scale-[0.98]"
                                >
                                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", action.color)}>
                                        <action.icon size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                            {action.label}
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                            {action.desc}
                                        </div>
                                    </div>
                                    <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Glassmorphic Mobile Navigation Bar - Compact */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-0.5 pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto">
                    <nav className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border border-white/10 dark:border-white/15 rounded-2xl px-2 py-1 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.5),0_0_16px_rgba(79,70,229,0.12)] flex items-center justify-around relative">
                        {/* Tab 1: Home */}
                        <NavLink
                            to={mainLinks[0].to}
                            className={({ isActive }) => cn(
                                "flex flex-col items-center justify-center gap-0.5 py-0.5 px-2 rounded-xl transition-all duration-200 select-none min-w-[50px]",
                                isActive
                                    ? "text-indigo-400 dark:text-indigo-300 scale-105 font-black"
                                    : "text-slate-400 hover:text-slate-200 font-bold opacity-80"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={cn(
                                        "p-1 rounded-lg transition-all",
                                        isActive && "bg-indigo-500/20 shadow-sm"
                                    )}>
                                        <LayoutDashboard size={16} />
                                    </div>
                                    <span className="text-[8px] uppercase tracking-wider">{mainLinks[0].label}</span>
                                </>
                            )}
                        </NavLink>

                        {/* Tab 2: Expenses (Exchanged from Meals) */}
                        <NavLink
                            to={mainLinks[1].to}
                            className={({ isActive }) => cn(
                                "flex flex-col items-center justify-center gap-0.5 py-0.5 px-2 rounded-xl transition-all duration-200 select-none min-w-[50px]",
                                isActive
                                    ? "text-indigo-400 dark:text-indigo-300 scale-105 font-black"
                                    : "text-slate-400 hover:text-slate-200 font-bold opacity-80"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={cn(
                                        "p-1 rounded-lg transition-all",
                                        isActive && "bg-indigo-500/20 shadow-sm"
                                    )}>
                                        <Receipt size={16} />
                                    </div>
                                    <span className="text-[8px] uppercase tracking-wider">{mainLinks[1].label}</span>
                                </>
                            )}
                        </NavLink>

                        {/* Center Action Button: Quick Add Action */}
                        <div className="relative -top-3 flex flex-col items-center">
                            <button
                                onClick={() => setShowQuickSheet(prev => !prev)}
                                aria-label="Quick Action"
                                className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 active:scale-90 border-2 border-slate-900 dark:border-slate-950 ring-2 ring-indigo-500/20",
                                    showQuickSheet || isCenterActive
                                        ? "bg-gradient-to-tr from-violet-600 to-indigo-500 rotate-45 scale-105"
                                        : "bg-gradient-to-tr from-indigo-600 to-violet-500 hover:scale-105"
                                )}
                            >
                                <Plus size={18} strokeWidth={2.6} />
                            </button>
                            <span className="text-[7.5px] font-black uppercase tracking-wider text-indigo-300 mt-0.5">
                                Add
                            </span>
                        </div>

                        {/* Tab 3: Monthly Summary (Replaces Meals in Exchanged Position) */}
                        <NavLink
                            to={mainLinks[2].to}
                            className={({ isActive }) => cn(
                                "flex flex-col items-center justify-center gap-0.5 py-0.5 px-1.5 rounded-xl transition-all duration-200 select-none min-w-[62px]",
                                isActive
                                    ? "text-indigo-400 dark:text-indigo-300 scale-105 font-black"
                                    : "text-slate-400 hover:text-slate-200 font-bold opacity-80"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={cn(
                                        "p-1 rounded-lg transition-all",
                                        isActive && "bg-indigo-500/20 shadow-sm"
                                    )}>
                                        <ClipboardList size={16} />
                                    </div>
                                    <span className="text-[7.5px] uppercase tracking-tight font-bold whitespace-nowrap text-center">{mainLinks[2].label}</span>
                                </>
                            )}
                        </NavLink>

                        {/* Tab 4: More / Menu Drawer */}
                        <button
                            onClick={onOpenSidebar}
                            aria-label="Open Navigation Menu"
                            className="flex flex-col items-center justify-center gap-0.5 py-0.5 px-2 rounded-xl text-slate-400 hover:text-slate-200 active:scale-95 transition-all select-none opacity-80 min-w-[50px]"
                        >
                            <div className="p-1 rounded-lg">
                                <Menu size={16} />
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-wider">Menu</span>
                        </button>
                    </nav>
                </div>
            </div>
        </>
    );
};

export default BottomNav;
