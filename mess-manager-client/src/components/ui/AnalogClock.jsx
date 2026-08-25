import React, { memo } from 'react';

const AnalogClock = memo(({ hourAngle, minuteAngle, secondAngle, theme }) => {
    return (
        <div className="flex-shrink-0" role="img" aria-label="Analog clock">
            <div className={`relative w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/80 shadow-inner border-2 ${theme.border} transition-colors`}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`absolute w-1.5 h-1.5 ${theme.centerDot} rounded-full z-30`} />
                </div>

                {/* Hour markers (12, 3, 6, 9) */}
                {[0, 90, 180, 270].map((angle, i) => (
                    <div
                        key={i}
                        className={`absolute top-1/2 left-1/2 origin-left ${theme.mainMarker}`}
                        style={{
                            transform: `rotate(${angle - 90}deg) translateX(21px)`,
                            width: '4px',
                            height: '1.5px',
                            marginTop: '-0.75px',
                            marginLeft: '0px'
                        }}
                        aria-hidden="true"
                    />
                ))}

                {/* Clock hands */}
                <div
                    className={`absolute top-1/2 left-1/2 origin-left ${theme.hourHand} rounded-full transition-transform duration-500`}
                    style={{
                        transform: `rotate(${hourAngle}deg)`,
                        width: '14px',
                        height: '2.5px',
                        marginTop: '-1.25px',
                        marginLeft: '0px',
                        zIndex: 20
                    }}
                    aria-hidden="true"
                />
                <div
                    className={`absolute top-1/2 left-1/2 origin-left ${theme.minuteHand} rounded-full transition-transform duration-500`}
                    style={{
                        transform: `rotate(${minuteAngle}deg)`,
                        width: '19px',
                        height: '2px',
                        marginTop: '-1px',
                        marginLeft: '0px',
                        zIndex: 15
                    }}
                    aria-hidden="true"
                />
                <div
                    className={`absolute top-1/2 left-1/2 origin-left ${theme.secondHand} rounded-full transition-transform duration-200`}
                    style={{
                        transform: `rotate(${secondAngle}deg)`,
                        width: '21px',
                        height: '1px',
                        marginTop: '-0.5px',
                        marginLeft: '0px',
                        zIndex: 25
                    }}
                    aria-hidden="true"
                />
            </div>
        </div>
    );
});

AnalogClock.displayName = 'AnalogClock';

export default AnalogClock;


