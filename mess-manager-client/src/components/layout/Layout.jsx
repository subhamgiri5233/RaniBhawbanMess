import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import AnimatedRoutes from '../transitions/AnimatedRoutes';

import GlobalMonthSelector from '../ui/GlobalMonthSelector';

import { useState } from 'react';
import { Menu, Sun, Moon, PanelLeftClose, PanelLeftOpen, RefreshCw } from 'lucide-react';

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
        <div className="min-h-screen bg-gradient-to-br from-indigo-100/80 via-[#eceaff] to-violet-100/60 dark:bg-none dark:bg-slate-950 transition-colors duration-300">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isDesktopCollapsed}
            />

            {/* Mobile Header - Premium Floating Glassmorphism */}
            <div className="md:hidden sticky top-0 z-[40] px-4 py-3 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between transition-all shadow-sm shadow-indigo-500/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <span className="text-white text-[10px] font-black italic">RB</span>
                    </div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Rani Bhawban</h2>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-90"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-primary-500' : ''} />
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-90"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-amber-500" />}
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2.5 ml-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all shadow-inner active:scale-90 border border-indigo-100 dark:border-indigo-500/20"
                    >
                        <Menu size={22} />
                    </button>
                </div>
            </div>

            {/* Desktop toggle button */}
            <button
                onClick={() => setIsDesktopCollapsed(prev => !prev)}
                className={`hidden md:flex items-center justify-center fixed top-5 z-50 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 transition-all duration-300 ${isDesktopCollapsed ? 'left-[52px]' : 'left-[244px]'}`}
                title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {isDesktopCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>

            {/* Global Refresh Button — desktop, top-right corner */}
            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                title={isRefreshing ? 'Refreshing...' : 'Refresh all data'}
                className="hidden md:flex items-center gap-2 fixed top-4 right-6 z-50 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 hover:shadow-lg transition-all duration-200 text-xs font-black uppercase tracking-widest disabled:opacity-60"
            >
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-primary-500' : ''} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <main
                className={`min-h-screen p-4 md:p-8 transition-all duration-300 ${isDesktopCollapsed ? 'md:ml-16' : 'md:ml-64'}`}
            >
                <div className="max-w-6xl mx-auto space-y-8">
                    <GlobalMonthSelector />
                    <AnimatedRoutes>
                        <Outlet />
                    </AnimatedRoutes>
                </div>
            </main>


        </div>
    );
};

export default Layout;

