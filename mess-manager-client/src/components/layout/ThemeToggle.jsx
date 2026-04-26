import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500 active:scale-90 overflow-hidden group",
                "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                "hover:shadow-xl hover:shadow-primary-500/10 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            )}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="relative w-6 h-6 flex items-center justify-center">
                {/* Sun Icon */}
                <Sun 
                    className={cn(
                        "absolute transition-all duration-700 transform",
                        theme === 'dark' ? "translate-y-12 opacity-0 rotate-90" : "translate-y-0 opacity-100 rotate-0"
                    )} 
                    size={20} 
                    strokeWidth={2.5}
                />
                
                {/* Moon Icon */}
                <Moon 
                    className={cn(
                        "absolute transition-all duration-700 transform",
                        theme === 'light' ? "-translate-y-12 opacity-0 -rotate-90" : "translate-y-0 opacity-100 rotate-0"
                    )} 
                    size={20} 
                    strokeWidth={2.5}
                />
            </div>
            
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/0 via-primary-500/0 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>
    );
};

export default ThemeToggle;
