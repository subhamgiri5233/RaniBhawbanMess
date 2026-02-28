import { useData } from '../../context/DataContext';
import { Calendar, ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
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

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl">
                    <Calendar size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Global Timeline</h3>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Currently Viewing</p>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                    onClick={handlePreviousMonth}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm cursor-pointer"
                >
                    <ChevronLeft size={18} />
                </button>

                <select
                    value={globalMonth}
                    onChange={(e) => setGlobalMonth(e.target.value)}
                    className="appearance-none bg-transparent font-black text-slate-700 dark:text-slate-200 focus:outline-none text-center px-4 py-1 text-sm cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    style={{ textAlignLast: 'center' }}
                >
                    {getMonthOptions().map(opt => (
                        <option key={opt.value} value={opt.value} className="text-left font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {opt.label}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm cursor-pointer"
                    title="Next Month"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="flex items-center">
                <button
                    onClick={handleCurrentMonth}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-all border border-emerald-200/50 dark:border-emerald-800/30"
                >
                    <CalendarCheck size={14} />
                    Current
                </button>
            </div>
        </motion.div>
    );
};

export default GlobalMonthSelector;
