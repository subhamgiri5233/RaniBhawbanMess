import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

const ThemeToggle = ({ className, iconSize = 18 }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-500 active:scale-90 overflow-hidden group",
                "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                "hover:shadow-xl hover:shadow-primary-500/10 border border-transparent hover:border-slate-200 dark:hover:border-slate-700",
                className
            )}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="relative flex items-center justify-center" style={{ width: iconSize, height: iconSize }}>
                {/* Sun Icon */}
                <Sun 
                    className={cn(
                        "absolute transition-all duration-700 transform",
                        theme === 'dark' ? "translate-y-10 opacity-0 rotate-90" : "translate-y-0 opacity-100 rotate-0"
                    )} 
                    size={iconSize} 
                    strokeWidth={2.4}
                />
                
                {/* Moon Icon */}
                <Moon 
                    className={cn(
                        "absolute transition-all duration-700 transform",
                        theme === 'light' ? "-translate-y-10 opacity-0 -rotate-90" : "translate-y-0 opacity-100 rotate-0"
                    )} 
                    size={iconSize} 
                    strokeWidth={2.4}
                />
            </div>
            
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/0 via-primary-500/0 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>
    );
};

export default ThemeToggle;
