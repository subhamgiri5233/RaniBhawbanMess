import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import AnimatedRoutes from '../transitions/AnimatedRoutes';

import GlobalMonthSelector from '../ui/GlobalMonthSelector';

import { useState } from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationWidget from '../NotificationWidget';

const Layout = () => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { refreshData } = useData();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            await refreshData();
        } finally {
            setIsRefreshing(false);
        }
    };

    if (!user) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen bg-transparent dark:bg-none dark:bg-slate-950 transition-colors duration-300">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isDesktopCollapsed}
            />

            {/* Mobile Header - Compact Premium Floating Glassmorphism */}
            <div className="md:hidden sticky top-0 z-[40] px-3.5 py-2.5 bg-indigo-950/70 dark:bg-slate-950/80 backdrop-blur-xl border-b border-indigo-900/40 dark:border-white/10 flex items-center justify-between transition-all shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/10 dark:bg-white/5 flex items-center justify-center shadow-md border border-white/10 overflow-hidden">
                        <img src="/icons/home.png" alt="Logo" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-xs font-black text-indigo-100 dark:text-slate-100 uppercase tracking-tight leading-none">Rani Bhawban</h2>
                        <span className="text-[9px] font-bold text-indigo-300/80 dark:text-slate-400 leading-tight">Mess Manager</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <ThemeToggle />
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-indigo-900/60 dark:bg-indigo-500/10 text-indigo-100 dark:text-indigo-400 rounded-xl transition-all active:scale-90 border border-indigo-800/30 dark:border-indigo-500/20"
                        title="Open Menu"
                    >
                        <Menu size={18} />
                    </button>
                </div>
            </div>

            {/* Desktop toggle button */}
            <button
                onClick={() => setIsDesktopCollapsed(prev => !prev)}
                className={`hidden md:flex items-center justify-center fixed top-5 z-50 w-7 h-7 rounded-full bg-indigo-100 dark:bg-slate-900 border border-indigo-200/50 dark:border-white/10 shadow-md text-indigo-600 dark:text-slate-500 hover:text-primary-700 dark:hover:text-primary-400 hover:border-primary-400 transition-all duration-300 ${isDesktopCollapsed ? 'left-[52px]' : 'left-[244px]'}`}
                title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {isDesktopCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>

            {/* Global Actions — desktop, top-right corner */}
            <div className="hidden md:flex items-center gap-3 fixed top-4 right-6 z-50">
                <ThemeToggle />
            </div>

            <main
                className={`min-h-screen p-2.5 sm:p-4 md:p-8 pb-24 md:pb-8 transition-all duration-300 ${isDesktopCollapsed ? 'md:ml-16' : 'md:ml-64'}`}
            >
                <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
                    <div className="sticky top-[49px] md:top-0 z-30 -mx-2.5 px-2.5 py-1.5 sm:-mx-4 sm:px-4 sm:py-2 md:-mx-8 md:px-8 md:py-4 bg-slate-50/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-indigo-100/60 dark:border-white/5 transition-all">
                        <GlobalMonthSelector />
                    </div>
                    
                    <NotificationWidget />

                    <AnimatedRoutes>
                        <Outlet />
                    </AnimatedRoutes>
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <BottomNav onOpenSidebar={() => setIsSidebarOpen(true)} />
        </div>
    );
};

export default Layout;



