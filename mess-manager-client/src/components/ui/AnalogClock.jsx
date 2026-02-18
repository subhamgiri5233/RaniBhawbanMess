import React, { memo } from 'react';

const AnalogClock = memo(({ hourAngle, minuteAngle, secondAngle, theme }) => {
    return (
        <div className="flex-shrink-0" role="img" aria-label="Analog clock">
            <div className={`relative w-28 h-28 rounded-full bg-white dark:bg-slate-900 shadow-xl border-4 ${theme.border} transition-colors`}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`absolute w-2 h-2 ${theme.centerDot} rounded-full`} style={{ zIndex: 50 }} />
                </div>

                {/* Hour markers */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) - 90;
                    const isMainHour = i % 3 === 0;
                    return (
                        <div
                            key={i}
                            className={`absolute top-1/2 left-1/2 origin-left ${isMainHour ? theme.mainMarker : theme.secondaryMarker}`}
                            style={{
                                transform: `rotate(${angle}deg) translateX(${isMainHour ? 44 : 46}px)`,
                                width: isMainHour ? '6px' : '3px',
                                height: '2px',
                                marginTop: '-1px',
                                marginLeft: '0px'
                            }}
                            aria-hidden="true"
                        />
                    );
                })}

                {/* Clock hands */}
                <div
                    className={`absolute top-1/2 left-1/2 origin-left ${theme.hourHand} rounded-full transition-transform duration-500`}
                    style={{
                        transform: `rotate(${hourAngle}deg)`,
                        width: '32px',
                        height: '4px',
                        marginTop: '-2px',
                        marginLeft: '0px',
                        zIndex: 30
                    }}
                    aria-hidden="true"
                />
                <div
                    className={`absolute top-1/2 left-1/2 origin-left ${theme.minuteHand} rounded-full transition-transform duration-500`}
                    style={{
                        transform: `rotate(${minuteAngle}deg)`,
                        width: '42px',
                        height: '3px',
                        marginTop: '-1.5px',
                        marginLeft: '0px',
                        zIndex: 20
                    }}
                    aria-hidden="true"
                />
                <div
                    className={`absolute top-1/2 left-1/2 origin-left ${theme.secondHand} rounded-full transition-transform duration-200`}
                    style={{
                        transform: `rotate(${secondAngle}deg)`,
                        width: '42px',
                        height: '1.5px',
                        marginTop: '-0.75px',
                        marginLeft: '0px',
                        zIndex: 10
                    }}
                    aria-hidden="true"
                />
            </div>
        </div>
    );
});

AnalogClock.displayName = 'AnalogClock';

export default AnalogClock;
