import React, { memo } from 'react';
import { toBengaliNumber } from '../../utils/bengaliCalendar';

const DigitalClock = memo(({ digitalTime, dateInfo, bengaliDate, variant, theme }) => {
    const isEnglish = variant === 'english';

    return (
        <div className="flex-1 min-w-[180px]">
            <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-4xl font-black ${theme.hourColor} tabular-nums`}>
                    {isEnglish ? digitalTime.hour : toBengaliNumber(digitalTime.hour)}
                </span>
                <span className={`text-4xl font-black ${theme.pulseColor} animate-pulse`}>:</span>
                <span className={`text-4xl font-black ${theme.minuteColor} tabular-nums`}>
                    {isEnglish ? digitalTime.minute : toBengaliNumber(digitalTime.minute)}
                </span>
                <span className={`text-4xl font-black ${theme.pulseColor2} animate-pulse`}>:</span>
                <span className={`text-4xl font-black ${theme.secondColor} tabular-nums`}>
                    {isEnglish ? digitalTime.second : toBengaliNumber(digitalTime.second)}
                </span>
                <span className={`text-xl font-black ${theme.ampmColor} ml-1 self-end uppercase`}>
                    {isEnglish ? digitalTime.ampm : (digitalTime.ampm === 'AM' ? 'পূর্বাহ্ণ' : 'অপরাহ্ণ')}
                </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                <p className="text-lg text-slate-800 dark:text-slate-100 mb-1" aria-label="day">
                    {isEnglish ? dateInfo.day : bengaliDate.day}
                </p>
                <p aria-label="date" className="uppercase tracking-widest">
                    {isEnglish
                        ? `${dateInfo.month} ${dateInfo.date}, ${dateInfo.year}`
                        : `${bengaliDate.date} ${bengaliDate.month}, ${bengaliDate.year}`
                    }
                </p>
            </div>
        </div>
    );
});

DigitalClock.displayName = 'DigitalClock';

export default DigitalClock;
