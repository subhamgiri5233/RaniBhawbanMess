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

            {/* Mobile Header - Prominent Premium Glassmorphism */}
            <div className="md:hidden sticky top-0 z-[40] px-4 py-3 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 dark:border-white/10 flex items-center justify-between transition-all shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 dark:bg-white/5 flex items-center justify-center shadow-md border border-white/15 overflow-hidden shrink-0">
                        <img src="/icons/home.png" alt="Logo" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black text-white dark:text-slate-100 uppercase tracking-tight leading-tight">Rani Bhawban</h2>
                        <span className="text-[10px] font-bold text-indigo-300 dark:text-slate-400 leading-tight">Mess Manager</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 border border-slate-700" iconSize={17} />
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="w-9 h-9 flex items-center justify-center bg-slate-800 text-slate-200 rounded-xl transition-all active:scale-90 border border-slate-700 hover:bg-slate-700"
                        title="Open Menu"
                    >
                        <Menu size={18} />
                    </button>
                </div>
            </div>

            {/* Desktop toggle button */}
            <button
                onClick={() => setIsDesktopCollapsed(prev => !prev)}
                className={`hidden md:flex items-center justify-center fixed top-5 z-50 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-md text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all duration-300 ${isDesktopCollapsed ? 'left-[52px]' : 'left-[244px]'}`}
                title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {isDesktopCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>

            {/* Global Actions — desktop, top-right corner */}
            <div className="hidden md:flex items-center gap-3 fixed top-4 right-6 z-50">
                <ThemeToggle className="w-11 h-11 rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl" iconSize={19} />
            </div>

            <main
                className={`min-h-screen p-2 sm:p-4 md:p-8 pb-20 md:pb-8 transition-all duration-300 ${isDesktopCollapsed ? 'md:ml-16' : 'md:ml-64'}`}
            >
                <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 md:space-y-8">
                    <div className="sticky top-[58px] md:top-0 z-30 -mx-2 px-2 py-1.5 sm:-mx-4 sm:px-4 sm:py-2 md:-mx-8 md:px-8 md:py-4 bg-slate-50/80 dark:bg-[#090d16]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-white/5 transition-all">
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



