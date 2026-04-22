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
                'group relative bg-indigo-300/40 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-indigo-400/30 dark:border-white/5 shadow-premium transition-all duration-500 overflow-hidden',
                'hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]',
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
