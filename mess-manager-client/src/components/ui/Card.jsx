import { memo, useRef } from 'react';
import { cn } from "../../lib/utils";

const Card = memo(({ children, className, ...props }) => {
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className={cn(
                'group relative bg-indigo-300/40 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-indigo-400/30 dark:border-white/5 shadow-premium transition-all duration-500 overflow-hidden',
                'hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]',
                className
            )}
            {...props}
        >
            {/* Spotlight Overlay */}
            <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                 style={{
                     background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), transparent 40%)`
                 }}
            />
            
            {/* Content Wrapper */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
});

Card.displayName = 'Card';

export default Card;


