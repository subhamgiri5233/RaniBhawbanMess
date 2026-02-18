import React, { memo } from 'react';
import { Copy, Check } from 'lucide-react';
import Card from './Card';
import { toBengaliNumber } from '../../utils/bengaliCalendar';

const GitaCard = memo(({ gitaVerse, loadingInfo }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (!gitaVerse) return;
        const textToCopy = `🕉️ ${gitaVerse.chapterName} • শ্লোক ${toBengaliNumber(gitaVerse.verse)}\n\n"${gitaVerse.sanskrit}"\n\nসরলার্থ: ${gitaVerse.meaning_bn}\n\n— শ্রীমদ্ভগবদ্গীতা • যথাযথ`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="p-8 bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50 dark:from-orange-900/10 dark:via-amber-900/5 dark:to-yellow-900/10 border-orange-100 dark:border-white/5 shadow-premium text-center relative overflow-hidden group min-h-[200px] flex flex-col justify-center">
            {/* Decorative element */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-30"></div>

            {loadingInfo ? (
                <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-orange-200/50 dark:bg-orange-800/20 flex items-center justify-center text-2xl">🕉️</div>
                    <div className="h-4 w-48 bg-orange-200/50 dark:bg-orange-800/20 rounded-full"></div>
                </div>
            ) : gitaVerse ? (
                <>
                    <div className="absolute top-4 right-4 z-10">
                        <button
                            onClick={handleCopy}
                            className="p-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-500/20 transition-all active:scale-90"
                            title="Copy Verse"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>

                    <div className="mb-4">
                        <span className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.3em] mb-1 block px-3 py-1 bg-orange-500/10 rounded-full border border-orange-200/50 dark:border-orange-500/20 w-fit mx-auto">
                            {gitaVerse.chapterName} • শ্লোক {toBengaliNumber(gitaVerse.verse)}
                        </span>
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <div className="h-[1px] w-8 bg-orange-200 dark:bg-orange-800/40"></div>
                            <span className="text-xl">🕉️</span>
                            <div className="h-[1px] w-8 bg-orange-200 dark:bg-orange-800/40"></div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <p className="text-lg md:text-xl font-black text-slate-800 dark:text-orange-100 leading-relaxed font-serif italic mb-4">
                            "{gitaVerse.sanskrit}"
                        </p>

                        <div className="relative py-4 px-6 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-orange-100/50 dark:border-white/5">
                            <p className="text-sm md:text-md font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                <span className="text-orange-500 font-black mr-2">সরলার্থ:</span>
                                {gitaVerse.meaning_bn}
                            </p>
                        </div>
                    </div>

                    {/* Subtle footer */}
                    <p className="mt-6 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-60">
                        শ্রীমদ্ভগবদ্গীতা • যথাযথ
                    </p>
                </>
            ) : (
                <p className="text-sm text-slate-500">Failed to load Gita verse. Please try again later.</p>
            )}
        </Card>
    );
});

GitaCard.displayName = 'GitaCard';

export default GitaCard;
