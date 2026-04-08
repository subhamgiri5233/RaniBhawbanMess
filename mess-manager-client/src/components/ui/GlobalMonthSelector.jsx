import { useData } from '../../context/DataContext';
import { Calendar, ChevronLeft, ChevronRight, CalendarCheck, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const GlobalMonthSelector = () => {
    const { globalMonth, setGlobalMonth } = useData();

    // Generate last 6 months and next 2 months for quick selection, plus current month
    const getMonthOptions = () => {
        const options = [];
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Show all months for 2024, 2025, 2026, and 2027
        for (let year = 2024; year <= 2027; year++) {
            for (let month = 0; month < 12; month++) {
                const monthNum = String(month + 1).padStart(2, '0');
                const value = `${year}-${monthNum}`;
                const label = `${monthNames[month]} ${year}`;
                options.push({ value, label });
            }
        }
        return options;
    };

    const handlePreviousMonth = () => {
        if (!globalMonth || typeof globalMonth !== 'string') return;
        const [year, month] = globalMonth.split('-').map(Number);
        const d = new Date(year, month - 2, 1); // month is 0-indexed in Date
        setGlobalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const handleNextMonth = () => {
        if (!globalMonth || typeof globalMonth !== 'string') return;
        const [year, month] = globalMonth.split('-').map(Number);
        const d = new Date(year, month, 1);
        setGlobalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const handleCurrentMonth = () => {
        const d = new Date();
        setGlobalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    if (!globalMonth || typeof globalMonth !== 'string') return null;

    const [currentYear, currentMonth] = globalMonth.split('-').map(Number);
    const formattedCurrentMonth = new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    const todayMonth = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    const isCurrentMonth = globalMonth === todayMonth;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-300/30 dark:bg-slate-900/60 backdrop-blur-md border border-indigo-400/30 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-2 sm:p-2.5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-indigo-500/5"
        >
            {/* Legend / Icon - Hidden on Mobile */}
            <div className="hidden lg:flex items-center gap-3 pl-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <Calendar size={18} />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none">Global Timeline</h3>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-bold mt-1">Application Scope</p>
                </div>
            </div>

            {/* Navigation & Pill */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
                <button
                    onClick={handlePreviousMonth}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-300/40 dark:bg-slate-800 border border-indigo-400/30 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:text-indigo-500 hover:dark:text-indigo-400 transition-all active:scale-90 shadow-sm"
                    title="Previous Month"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* The Premium Pill */}
                <div className="relative group flex-1 sm:flex-none max-w-[240px]">
                    <div className="flex items-center justify-center gap-3 bg-slate-900 dark:bg-black/60 border border-white/10 px-4 sm:px-8 py-2.5 rounded-full shadow-2xl hover:bg-slate-800 dark:hover:bg-slate-900 transition-all cursor-pointer ring-1 ring-white/5 backdrop-blur-xl">
                        <Calendar size={14} className="text-primary-500 hidden xs:block" />
                        <span className="text-[10px] sm:text-[11px] font-black text-white dark:text-slate-100 uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap">
                            {formattedCurrentMonth}
                        </span>
                        <ChevronDown size={12} className="text-slate-500 opacity-40 ml-1" />
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
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-300/40 dark:bg-slate-800 border border-indigo-400/30 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:text-indigo-500 hover:dark:text-indigo-400 transition-all active:scale-90 shadow-sm"
                    title="Next Month"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Today/Current Jumper */}
            <div className="w-full sm:w-auto flex items-center justify-center border-t sm:border-t-0 border-slate-200/50 dark:border-white/10 pt-3 sm:pt-0 pb-1 sm:pb-0">
                {!isCurrentMonth ? (
                    <button
                        onClick={handleCurrentMonth}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                        <CalendarCheck size={14} />
                        Go Current
                    </button>
                ) : (
                    <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:border-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LATEST DATA
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default GlobalMonthSelector;
