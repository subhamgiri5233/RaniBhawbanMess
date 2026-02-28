import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AnimatedRoutes from '../transitions/AnimatedRoutes';
import JarvisAssistant from '../ui/JarvisAssistant';
import GlobalMonthSelector from '../ui/GlobalMonthSelector';

import { useState } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';

const Layout = () => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!user) {
        return <Outlet />; // Render Login page directly if not authenticated
    }

    return (
        <div className="min-h-screen bg-[#f4f7ff] dark:bg-slate-950 transition-colors duration-300">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Header */}
            <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-30 flex items-center justify-between transition-colors">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Rani Bhawban Mess</h2>
                <div className="flex items-center gap-2">
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

            <main className="md:ml-64 min-h-screen p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <GlobalMonthSelector />
                    <AnimatedRoutes>
                        <Outlet />
                    </AnimatedRoutes>
                </div>
            </main>

            {/* JARVIS — Global AI Voice Assistant */}
            <JarvisAssistant />
        </div>
    );
};

export default Layout;
