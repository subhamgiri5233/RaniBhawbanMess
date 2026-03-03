import { memo } from 'react';
import { cn } from "../../lib/utils";

const Card = memo(({ children, className, ...props }) => {
    return (
        <div
            className={cn(
                'bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-indigo-100 dark:border-white/5 shadow-[0_4px_24px_rgba(79,70,229,0.13),0_1px_4px_rgba(79,70,229,0.08)] dark:shadow-premium transition-all duration-300',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

export default Card;
