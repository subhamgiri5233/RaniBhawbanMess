import { memo } from 'react';
import { cn } from "../../lib/utils";

const Card = memo(({ children, className, ...props }) => {
    return (
        <div
            className={cn(
                'bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-premium-dark p-6 transition-all duration-300',
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
