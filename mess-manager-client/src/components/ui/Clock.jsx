import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { formatBengaliDate } from '../../utils/bengaliCalendar';
import AnalogClock from './AnalogClock';
import { Calendar as CalendarIcon, Sparkles, Clock as ClockIcon } from 'lucide-react';

const Clock = () => {
    const [time, setTime] = useState(new Date());
    const [today, setToday] = useState(new Date());
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            const now = new Date();
            setTime(now);
            if (now.getDate() !== today.getDate()) {
                setToday(now);
            }
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [today]);

    // Angles for analog clock
    const timeValues = useMemo(() => {
        const seconds = time.getSeconds();
        const minutes = time.getMinutes();
        const hours = time.getHours() % 12;
        return {
            secondAngle: seconds * 6,
            minuteAngle: (minutes * 6) + (seconds * 0.1),
            hourAngle: (hours * 30) + (minutes * 0.5)
        };
    }, [time]);

    const digitalTime = useMemo(() => {
        let hours = time.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return {
            hour: String(hours).padStart(2, '0'),
            minute: String(time.getMinutes()).padStart(2, '0'),
            second: String(time.getSeconds()).padStart(2, '0'),
            ampm
        };
    }, [time]);

    const dateInfo = useMemo(() => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return {
            day: days[today.getDay()],
            date: today.getDate(),
            month: months[today.getMonth()],
            year: today.getFullYear()
        };
    }, [today]);

    const bengaliDate = useMemo(() => formatBengaliDate(today), [today]);

    const analogTheme = {
        border: 'border-indigo-400/30',
        centerDot: 'bg-indigo-400',
        mainMarker: 'bg-indigo-400',
        secondaryMarker: 'bg-slate-500',
        hourHand: 'bg-white',
        minuteHand: 'bg-indigo-400',
        secondHand: 'bg-rose-400'
    };

    return (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800/80 dark:border-white/10 shadow-lg shadow-indigo-950/20 text-white p-4 sm:p-6 transition-all">
            {/* Ambient Background Glows */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
                
                {/* Left: Time & Analog Dial */}
                <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto justify-center md:justify-start">
                    <div className="hidden xs:block shrink-0 ring-4 ring-white/5 rounded-full">
                        <AnalogClock
                            hourAngle={timeValues.hourAngle}
                            minuteAngle={timeValues.minuteAngle}
                            secondAngle={timeValues.secondAngle}
                            theme={analogTheme}
                        />
                    </div>

                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300/80">Live Mess Time</span>
                        </div>

                        <div className="flex items-baseline gap-1 font-mono">
                            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
                                {digitalTime.hour}
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-indigo-400 animate-pulse">:</span>
                            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
                                {digitalTime.minute}
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-indigo-400 animate-pulse">:</span>
                            <span className="text-xl sm:text-2xl font-black text-rose-400">
                                {digitalTime.second}
                            </span>
                            <span className="ml-2 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 text-[10px] font-black uppercase tracking-wider border border-indigo-400/30">
                                {digitalTime.ampm}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Subtle Vertical Divider on Large Screens */}
                <div className="hidden md:block h-12 w-px bg-white/10" />

                {/* Right: Dual Calendar Badges (English & Bengali) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full md:w-auto md:min-w-[340px]">
                    {/* Gregorian Date */}
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 backdrop-blur-md transition-all">
                        <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 shrink-0">
                            <CalendarIcon size={16} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[9.5px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">
                                {dateInfo.day}
                            </div>
                            <div className="text-xs font-black text-slate-100 tracking-tight truncate">
                                {dateInfo.month} {dateInfo.date}, {dateInfo.year}
                            </div>
                        </div>
                    </div>

                    {/* Bengali Calendar Date */}
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 backdrop-blur-md transition-all">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/20 shrink-0">
                            <Sparkles size={16} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[9.5px] font-black text-amber-300 uppercase tracking-widest leading-none mb-1">
                                {bengaliDate.day}
                            </div>
                            <div className="text-xs font-black text-slate-100 tracking-tight truncate">
                                {bengaliDate.date} {bengaliDate.month}, {bengaliDate.year}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default memo(Clock);
