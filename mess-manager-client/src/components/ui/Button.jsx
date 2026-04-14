import { memo } from 'react';
import { cn } from "../../lib/utils";

const Button = memo(({ children, className, variant = 'primary', size = 'md', ...props }) => {
    const variants = {
        primary: 'bg-indigo-600 font-black uppercase tracking-wider text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:bg-indigo-800',
        secondary: 'bg-emerald-600 font-black uppercase tracking-wider text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:bg-emerald-800',
        outline: 'border-2 border-indigo-200 dark:border-white/10 bg-transparent hover:bg-indigo-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold',
        ghost: 'bg-transparent hover:bg-indigo-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold',
        danger: 'bg-rose-500 font-black uppercase tracking-wider text-white hover:bg-rose-600 shadow-xl shadow-rose-500/20 active:bg-rose-700',
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


