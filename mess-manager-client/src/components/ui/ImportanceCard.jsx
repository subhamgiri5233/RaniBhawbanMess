import React, { memo } from 'react';
import { Copy, Check } from 'lucide-react';
import Card from './Card';

const ImportanceCard = memo(({ specialOccasion, todayImportance, dateInfo }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (!todayImportance.length) return;
        const textToCopy = `📅 ${dateInfo.month} ${dateInfo.date}, ${dateInfo.year}\n\n${todayImportance.map(item => `${item.icon} ${item.text}`).join('\n')}\n\n— Mess Manager Dashboard`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 border-2 border-emerald-200 dark:border-white/5 shadow-premium relative group">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl animate-pulse" aria-hidden="true">{specialOccasion.emoji}</span>
                <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-400 tracking-tight uppercase">
                    {specialOccasion.name.includes('Regular Day')
                        ? 'Today is a New Day!'
                        : 'Why Today is Important'}
                </h3>
                <div className="ml-auto flex items-center gap-3">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 transition-all active:scale-95 opacity-0 group-hover:opacity-100"
                        title="Copy Day Info"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-widest whitespace-nowrap">
                        {dateInfo.month} {dateInfo.date}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayImportance.map((item, index) => (
                    <div
                        key={`${dateInfo.key}-${index}`}
                        className="flex items-start gap-4 p-4 bg-white/70 dark:bg-slate-900/80 rounded-2xl border border-emerald-100 dark:border-white/5 hover:bg-white/90 dark:hover:bg-slate-800 transition-all duration-300 shadow-sm hover:shadow-md group"
                    >
                        <span className="text-2xl flex-shrink-0 mt-0.5 group-hover:scale-125 transition-transform duration-300" aria-hidden="true">{item.icon}</span>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{item.text}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
});

ImportanceCard.displayName = 'ImportanceCard';

export default ImportanceCard;
