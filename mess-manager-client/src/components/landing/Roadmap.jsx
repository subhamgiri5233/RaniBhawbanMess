import { Globe, CreditCard, Mail, Sparkles } from 'lucide-react';
import { memo } from 'react';

const roadmapItems = [
    {
        icon: Globe,
        title: 'Complete Bengali Language Support',
        status: 'In Progress',
        description: 'Full Bengali interface options for all buttons, menus, and monthly reports alongside English.',
        pct: 75,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10'
    },
    {
        icon: CreditCard,
        title: 'UPI & Instant QR Payments',
        status: 'Testing',
        description: 'Scan UPI QR codes to pay monthly deposits directly with instant payment receipt generation.',
        pct: 60,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10'
    },
    {
        icon: Mail,
        title: 'WhatsApp Monthly Bill Delivery',
        status: 'Coming Soon',
        description: 'Automatic monthly mess bill summary delivered straight to each member’s personal WhatsApp.',
        pct: 85,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10'
    }
];

const Roadmap = () => {
    return (
        <section id="roadmap" className="max-w-[1600px] mx-auto px-4 sm:px-6 mb-28">
            {/* Header */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest mb-4">
                    <Sparkles size={12} className="animate-pulse" />
                    Future Upgrades
                </div>
                <h2 className="text-3xl sm:text-5xl font-[950] text-white uppercase tracking-tight mb-4">
                    What’s Coming Next to{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
                        Rani Bhawban Mess
                    </span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl mx-auto">
                    New features designed to make mess accounts, payments, and bill sharing faster and easier for every resident.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roadmapItems.map((item) => (
                    <div key={item.title}>
                        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-white/10 hover:border-indigo-500/30 backdrop-blur-xl h-full flex flex-col justify-between group transition-all">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center border border-white/10`}>
                                        <item.icon className={item.color} size={22} />
                                    </div>
                                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                        {item.status}
                                    </span>
                                </div>

                                <h3 className="text-base font-extrabold text-white tracking-tight mb-2">{item.title}</h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                                    {item.description}
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Progress</span>
                                    <span className="text-[10px] font-mono font-bold text-indigo-400">{item.pct}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${item.pct}%` }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default memo(Roadmap);
