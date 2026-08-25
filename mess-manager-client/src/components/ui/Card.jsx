import { memo, useRef, useCallback } from 'react';
import { cn } from "../../lib/utils";

const Card = memo(({ children, className, innerClassName, style, ...props }) => {
    const cardRef = useRef(null);
    const rafId = useRef(null);

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        // Cancel any pending rAF to avoid queuing multiple frames
        if (rafId.current) cancelAnimationFrame(rafId.current);
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        rafId.current = requestAnimationFrame(() => {
            if (cardRef.current) {
                cardRef.current.style.setProperty('--mouse-x', `${x}px`);
                cardRef.current.style.setProperty('--mouse-y', `${y}px`);
            }
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (rafId.current) cancelAnimationFrame(rafId.current);
    }, []);

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={style}
            className={cn(
                'group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl md:rounded-[2rem] border border-slate-200/80 dark:border-white/[0.08] shadow-premium transition-all duration-300 overflow-hidden',
                'hover:shadow-premium-hover hover:border-indigo-300/50 dark:hover:border-white/20',
                className
            )}
            {...props}
        >
            {/* Spotlight Overlay */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.15), transparent 40%)`
                }}
            />

            {/* Content Wrapper — only used when innerClassName is provided */}
            {innerClassName ? (
                <div className={cn("relative z-10", innerClassName)}>
                    {children}
                </div>
            ) : (
                <div className="relative z-10 contents">
                    {children}
                </div>
            )}
        </div>
    );
});

Card.displayName = 'Card';

export default Card;
