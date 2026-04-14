import { motion } from 'framer-motion';
import { Globe, CreditCard, Mail, Zap, Terminal, Cpu, Database } from 'lucide-react';
import { memo } from 'react';
import Card from '../ui/Card';

const roadmapItems = [
    {
        icon: Globe,
        title: 'Global Ready',
        status: 'In Development',
        description: 'Multi-region localization support with dynamic currency conversion for international mess management.',
        pct: 65,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        icon: CreditCard,
        title: 'Seamless Payments',
        status: 'Architecture Phase',
        description: 'Integrated payment gateways (Stripe/PayPal) for automated dutes collection and digital receipts.',
        pct: 40,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10'
    },
    {
        icon: Mail,
        title: 'Email Notifications',
        status: 'Beta Testing',
        description: 'Automated email alerts for market duties, monthly balance resets, and transaction confirmations.',
        pct: 85,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
    }
];

const Roadmap = () => {
    return (
        <section id="roadmap" className="container mx-auto px-6 mb-32">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    <Terminal size={14} className="animate-pulse" /> Deployment Pipeline
                </div>
                <h2 className="text-4xl md:text-5xl font-[950] text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
                    V5.0 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-primary-500">Roadmap.</span>
                </h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs opacity-60">The future of Rani Bhawban Mess management.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roadmapItems.map((item, i) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-8 h-full flex flex-col border-indigo-500/10 bg-indigo-200/40 dark:bg-slate-900/40 group relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Cpu size={120} />
                            </div>

                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center border border-indigo-500/10`}>
                                    <item.icon className={item.color} size={28} />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-1">Status</span>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{item.status}</span>
                                </div>
                            </div>

                            <div className="relative z-10 flex-grow">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">{item.title}</h3>
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8 opacity-80 min-h-[4rem]">
                                    {item.description}
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="relative z-10 mt-auto pt-6 border-t border-indigo-500/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Initialization</span>
                                    <span className="text-[10px] font-mono text-indigo-400">{item.pct}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-indigo-500/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${item.pct}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-indigo-500"
                                    />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Bottom Footer Callout */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-12 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <Database size={20} className="text-indigo-500" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Backend Infrastructure Synced with V5 Protocols</span>
                </div>
                <div className="flex items-center gap-2">
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-emerald-500"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Engine Stable</span>
                </div>
            </motion.div>
        </section>
    );
};

export default memo(Roadmap);
