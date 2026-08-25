import { memo } from 'react';

const ThreeBackground = memo(() => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030712]">
            {/* Ambient Radial Lights */}
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/5 to-transparent blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute top-1/3 -left-40 w-[600px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none" />
            
            {/* Subtle Dot Grid Background */}
            <div 
                className="absolute inset-0 opacity-[0.10] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
                    backgroundSize: '28px 28px'
                }}
            />
        </div>
    );
});

export default ThreeBackground;
