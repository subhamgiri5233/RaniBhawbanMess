import { memo } from 'react';
import { cn } from "../../lib/utils";

const Button = memo(({ children, className, variant = 'primary', size = 'md', ...props }) => {
    const variants = {
        primary: 'bg-gradient-to-r from-indigo-600 to-indigo-700 font-extrabold uppercase tracking-wider text-white hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-600/25 active:from-indigo-700 active:to-indigo-800 border border-indigo-500/30',
        secondary: 'bg-gradient-to-r from-emerald-600 to-emerald-700 font-extrabold uppercase tracking-wider text-white hover:from-emerald-500 hover:to-emerald-600 shadow-md shadow-emerald-600/25 active:from-emerald-700 active:to-emerald-800 border border-emerald-500/30',
        outline: 'border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-bold backdrop-blur-md shadow-sm',
        ghost: 'bg-transparent hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold',
        danger: 'bg-gradient-to-r from-rose-500 to-rose-600 font-extrabold uppercase tracking-wider text-white hover:from-rose-400 hover:to-rose-500 shadow-md shadow-rose-500/25 active:from-rose-600 active:to-rose-700 border border-rose-400/30',
    };

    const sizes = {
        sm: 'px-4 py-2 text-[10px]',
        md: 'px-6 py-2.5 text-xs',
        lg: 'px-10 py-4 text-sm',
        icon: 'p-3',
    };

    return (
        <button
            className={cn(
                'rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;


