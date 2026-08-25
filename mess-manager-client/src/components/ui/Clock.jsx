import { useState, useEffect, useMemo, useRef, memo } from 'react';
import Card from './Card';
import { formatBengaliDate } from '../../utils/bengaliCalendar';
import { useData } from '../../context/DataContext';
import AnalogClock from './AnalogClock';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';

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
        border: 'border-indigo-500/20 dark:border-indigo-400/20',
        centerDot: 'bg-indigo-600 dark:bg-indigo-400',
        mainMarker: 'bg-indigo-600 dark:bg-indigo-400',
        secondaryMarker: 'bg-slate-300 dark:bg-slate-700',
        hourHand: 'bg-slate-800 dark:bg-slate-200',
        minuteHand: 'bg-indigo-600 dark:bg-indigo-400',
        secondHand: 'bg-rose-500 dark:bg-rose-400'
    };

    return (
        <Card className="p-4 sm:p-6 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 backdrop-blur-xl shadow-sm rounded-2xl md:rounded-[1.5rem]">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
                
                {/* Live Digital Clock Section - Centered */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
                    <div className="shrink-0">
                        <AnalogClock
                            hourAngle={timeValues.hourAngle}
                            minuteAngle={timeValues.minuteAngle}
                            secondAngle={timeValues.secondAngle}
                            theme={analogTheme}
                        />
                    </div>
                    
                    <div className="flex flex-col items-center sm:items-start">
                        <div className="flex items-center gap-1.5 mb-1 justify-center sm:justify-start">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400">Live Time</span>
                        </div>
                        <div className="flex items-baseline justify-center sm:justify-start gap-1">
                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                                {digitalTime.hour}
                            </span>
                            <span className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 animate-pulse">:</span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                                {digitalTime.minute}
                            </span>
                            <span className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 animate-pulse">:</span>
                            <span className="text-lg sm:text-xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                                {digitalTime.second}
                            </span>
                            <span className="ml-1.5 px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase border border-indigo-500/20">
                                {digitalTime.ampm}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block h-12 w-px bg-slate-200/80 dark:bg-white/10" />

                {/* Dual Calendars: English & Bengali in sleek centered badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto lg:max-w-xl">
                    {/* Gregorian Calendar */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-white/5 flex items-center justify-center sm:justify-start gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-500/20 shrink-0">
                            <CalendarIcon size={16} />
                        </div>
                        <div className="min-w-0 text-left">
                            <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                {dateInfo.day}
                            </div>
                            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tracking-tight truncate">
                                {dateInfo.month} {dateInfo.date}, {dateInfo.year}
                            </p>
                        </div>
                    </div>

                    {/* Bengali Calendar */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-white/5 flex items-center justify-center sm:justify-start gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20 shrink-0">
                            <Sparkles size={16} />
                        </div>
                        <div className="min-w-0 text-left">
                            <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                {bengaliDate.day}
                            </div>
                            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tracking-tight truncate">
                                {bengaliDate.date} {bengaliDate.month}, {bengaliDate.year}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </Card>
    );
};

export default memo(Clock);
