import { memo } from 'react';
import { cn } from "../../lib/utils";

const Button = memo(({ children, className, variant = 'primary', size = 'md', ...props }) => {
    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-600/20 active:bg-primary-800',
        secondary: 'bg-success-600 text-white hover:bg-success-700 shadow-md shadow-success-600/20 active:bg-success-800',
        outline: 'border-2 border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
        ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 active:bg-red-700',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
        icon: 'p-2',
    };

    return (
        <button
            className={cn(
                'rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
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
