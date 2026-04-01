import { cn } from '../../lib/utils';

/**
 * A shimmering skeleton loader component to provide visual feedback during data fetching.
 */
const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-200 dark:bg-slate-800/80",
                className
            )}
            {...props}
        />
    );
};

/**
 * Pre-defined skeleton variants for common UI patterns.
 */
Skeleton.Card = ({ className }) => (
    <div className={cn("p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-4", className)}>
        <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-24 h-4 rounded-full" />
        </div>
        <Skeleton className="w-20 h-10 rounded-xl" />
    </div>
);

Skeleton.Row = () => (
    <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-32 h-4 rounded-full" />
        </div>
        <div className="flex gap-4">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-16 h-8 rounded-lg" />
        </div>
    </div>
);

Skeleton.Table = ({ rows = 5 }) => (
    <div className="w-full space-y-0">
        {[...Array(rows)].map((_, i) => (
            <Skeleton.Row key={i} />
        ))}
    </div>
);

export default Skeleton;
