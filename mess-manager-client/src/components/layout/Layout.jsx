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

            {/* Mobile Header */}
            <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-30 flex items-center justify-between transition-colors">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Rani Bhawban Mess</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Refresh data"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-primary-500' : ''} />
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-500" />}
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
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

