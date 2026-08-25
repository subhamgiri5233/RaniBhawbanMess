import { useData } from '../../context/DataContext';
import { ChevronLeft, ChevronRight, Calendar, CalendarCheck, ChevronDown } from 'lucide-react';
import { memo } from 'react';

const GlobalMonthSelector = () => {
    const { globalMonth, setGlobalMonth } = useData();

    const handlePreviousMonth = () => {
        const [year, month] = globalMonth.split('-').map(Number);
        let newYear = year;
        let newMonth = month - 1;
        if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }
        setGlobalMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
    };

    const handleNextMonth = () => {
        const [year, month] = globalMonth.split('-').map(Number);
        let newYear = year;
        let newMonth = month + 1;
        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        }
        setGlobalMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
    };

    const handleCurrentMonth = () => {
        const d = new Date();
        setGlobalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const formattedCurrentMonth = (() => {
        if (!globalMonth) return '';
        const [year, month] = globalMonth.split('-');
        const date = new Date(year, month - 1, 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    })();

    const todayMonth = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    const isCurrentMonth = globalMonth === todayMonth;

    return (
        <div
            className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-[1.5rem] p-1.5 sm:p-2.5 flex items-center justify-center lg:justify-between gap-2 shadow-sm relative"
        >
            {/* Legend / Icon - Left side on desktop */}
            <div className="hidden lg:flex items-center gap-3 pl-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/15">
                    <Calendar size={18} />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none">Active Month</h3>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-bold mt-1">Mess Records</p>
                </div>
            </div>

            {/* Centered Navigation & Month Pill */}
            <div className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none">
                <button
                    onClick={handlePreviousMonth}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all active:scale-90 shadow-sm shrink-0"
                    title="Previous Month"
                >
                    <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                </button>

                {/* The Premium Month Pill */}
                <div className="relative group max-w-[240px]">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-3 bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-white/10 px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-full shadow-md hover:bg-slate-800 dark:hover:bg-slate-900 transition-all cursor-pointer ring-1 ring-white/10 backdrop-blur-xl">
                        <Calendar size={13} className="text-primary-400 hidden xs:block shrink-0" />
                        <span className="text-[10px] sm:text-[11px] font-black text-white dark:text-slate-100 uppercase tracking-wider whitespace-nowrap truncate">
                            {formattedCurrentMonth}
                        </span>
                        <ChevronDown size={11} className="text-slate-400 opacity-60 ml-0.5 shrink-0" />
                    </div>

                    <input
                        type="month"
                        value={globalMonth}
                        onChange={(e) => setGlobalMonth(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                </div>

                <button
                    onClick={handleNextMonth}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all active:scale-90 shadow-sm shrink-0"
                    title="Next Month"
                >
                    <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                </button>
            </div>

            {/* Today Jumper when browsing other months */}
            {!isCurrentMonth && (
                <div className="flex items-center shrink-0 sm:static absolute right-2 top-1/2 -translate-y-1/2 sm:translate-y-0">
                    <button
                        onClick={handleCurrentMonth}
                        className="flex items-center justify-center gap-1 px-3 sm:px-5 py-1.5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                        <CalendarCheck size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">Today</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default memo(GlobalMonthSelector);
