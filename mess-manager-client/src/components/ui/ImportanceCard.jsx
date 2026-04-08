import React, { memo } from 'react';
import { Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import Card from './Card';

// Category color mappings for the badge
const CATEGORY_COLORS = {
    'Bengali Festival': 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300 border-pink-200 dark:border-pink-500/30',
    'Indian National Day': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
    'Global Observance': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
    'Historical Event': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    'Famous Birth': 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-200 dark:border-green-500/30',
    'Famous Death': 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300 border-slate-200 dark:border-slate-500/30',
    'Science & Discovery': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
    'Sports & Achievement': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
    'Daily Thought': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
};

const ImportanceCard = memo(({ specialOccasion, todayImportance = [], dateInfo, loadingInfo }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (!todayImportance || !todayImportance.length) return;
        const textToCopy = `📅 ${dateInfo.month} ${dateInfo.date}, ${dateInfo.year}\n\n${todayImportance.map(item => `${item.icon} ${item.event ? `${item.event}: ` : ''}${item.text}`).join('\n')}\n\n— Mess Manager Dashboard`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isLoading = loadingInfo && todayImportance.length === 0;
    const hasOnlyFallback = todayImportance.length === 1 && !todayImportance[0].ai;

    return (
        <Card className="p-6 bg-indigo-300/40 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 border-2 border-indigo-400/30 dark:border-white/5 shadow-premium relative group">

            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl animate-pulse" aria-hidden="true">
                    {isLoading ? '🔍' : specialOccasion.emoji}
                </span>
                <div>
                    <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-400 tracking-tight uppercase leading-tight">
                        {isLoading ? 'Searching today\'s events...' : 'Why Today is Important'}
                    </h3>
                    {!isLoading && specialOccasion?.name && (
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 font-medium mt-0.5 line-clamp-1">
                            {specialOccasion.name}
                        </p>
                    )}
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {!isLoading && (
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 transition-all active:scale-95 opacity-0 group-hover:opacity-100"
                            title="Copy Day Info"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    )}
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-widest whitespace-nowrap">
                        {dateInfo.month} {dateInfo.date}
                    </span>
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={`sk-${i}`} className="flex items-start gap-4 p-4 bg-indigo-300/40 dark:bg-slate-900/50 rounded-2xl border border-indigo-400/30 dark:border-white/5 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800/30 flex-shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                                <div className="h-2.5 bg-emerald-100 dark:bg-emerald-800/30 rounded-full w-1/3" />
                                <div className="h-3 bg-emerald-100 dark:bg-emerald-800/30 rounded-full w-full" />
                                <div className="h-3 bg-emerald-100 dark:bg-emerald-800/30 rounded-full w-4/5" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Event Cards */}
            {!isLoading && todayImportance && Array.isArray(todayImportance) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {todayImportance.map((item, index) => {
                        if (!item) return null;
                        const categoryColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Global Observance'];

                        // Robust year deduplication
                        const eventTitle = String(item.event || '');
                        const eventYear = String(item.year || '');
                        const shouldShowYear = eventYear &&
                            eventYear !== 'null' &&
                            eventYear !== 'undefined' &&
                            !eventTitle.includes(eventYear);

                        return (
                            <div
                                key={`${dateInfo.key}-${index}`}
                                className="flex flex-col gap-2 p-4 bg-indigo-300/60 dark:bg-slate-900/80 rounded-2xl border border-indigo-400/30 dark:border-white/5 hover:bg-white/90 dark:hover:bg-slate-800 transition-all duration-300 shadow-sm hover:shadow-md group/card"
                            >
                                {/* Category badge + icon */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xl group-hover/card:scale-125 transition-transform duration-300" aria-hidden="true">{item.icon}</span>
                                    {item.category && (
                                        <span className={`text-[9px] font-black outline-none tracking-widest px-2 py-0.5 rounded-full border ${categoryColor}`}>
                                            {item.categoryDisplay || item.category}
                                        </span>
                                    )}
                                    {item.ai && (
                                        <span className="ml-auto flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest text-violet-500 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/20 px-1.5 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30 flex-shrink-0">
                                            <Sparkles size={8} />
                                            AI
                                        </span>
                                    )}
                                </div>

                                {/* Event name */}
                                {item.event && (
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-snug">
                                        {item.event} {shouldShowYear && (
                                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                ({item.year})
                                            </span>
                                        )}
                                    </p>
                                )}

                                {/* Explanation */}
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {item.text}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
});

ImportanceCard.displayName = 'ImportanceCard';

export default ImportanceCard;
