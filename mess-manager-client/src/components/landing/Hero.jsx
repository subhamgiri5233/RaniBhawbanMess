import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronRight, Users, Utensils, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';

const Hero = ({ onLoginClick }) => {
    // ... existing variants
    const heroBadge = {
        initial: {
            opacity: 0,
            scale: 0.5,
            rotateZ: -90
        },
        animate: {
            opacity: 1,
            scale: 1,
            rotateZ: 0
        },
        transition: {
            duration: 1,
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.3
        }
    };

    const heroText = {
        initial: {
            opacity: 0,
            y: 40,
            rotateX: 20,
            scale: 0.95,
            z: -60
        },
        animate: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            z: 0
        },
        transition: {
            duration: 1.6,
            ease: [0.19, 1, 0.22, 1],
            type: "spring",
            stiffness: 35,
            damping: 20
        }
    };

    const stats = [
        { icon: Users, label: 'Members', value: '20+' },
        { icon: Utensils, label: 'Meals / Month', value: '500+' },
        { icon: TrendingUp, label: 'Features', value: '13' },
    ];

    return (
        <section className="max-w-[1600px] mx-auto px-6 mb-24 relative" style={{ perspective: "1500px" }}>
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                <motion.div
                    initial="initial"
                    whileInView="animate"
                    viewport={{ margin: "-150px", amount: 0.3 }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="w-full"
                >
                    <motion.div
                        variants={heroBadge}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-bold mb-8 backdrop-blur-md"
                    >
                        <Sparkles size={16} />
                        🚀 Version 3.0 is now live
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-tight"
                    >
                        Mess Management
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                            Without the Stress
                        </span>
                    </motion.h1>
                    <motion.p
                        variants={heroText}
                        transition={{ delay: 0.2 }}
                        className="mx-auto max-w-2xl text-xl text-slate-300 mb-12 font-medium leading-relaxed"
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    >
                        A premium, all-in-one solution to manage meals, expenses, and payments with professional-grade reporting and total transparency.
                    </motion.p>
                    <motion.div
                        variants={heroText}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button
                            onClick={onLoginClick}
                            size="lg"
                            className="w-full sm:w-auto px-10 py-5 text-lg font-bold rounded-2xl shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20 transition-all relative overflow-hidden group"
                        >
                            <div className="relative z-10 flex items-center justify-center">
                                Get Started Now <ArrowRight className="ml-2" size={20} />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </Button>
                        <motion.a
                            href="#features"
                            className="w-full sm:w-auto px-8 py-5 text-slate-400 font-bold hover:text-indigo-400 transition-colors flex items-center justify-center group"
                        >
                            See features <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" size={20} />
                        </motion.a>
                    </motion.div>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-16 flex flex-wrap justify-center gap-6 w-full"
                >
                    {stats.map(({ icon: Icon, label, value }, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
                        >
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                                <Icon size={18} className="text-indigo-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-black text-lg leading-none">{value}</p>
                                <p className="text-slate-500 text-xs font-semibold mt-0.5">{label}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Dashboard Preview Card */}
                <motion.div
                    initial={{ opacity: 0, y: 50, rotateX: 12 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
                    className="mt-12 w-full max-w-2xl"
                >
                    <div className="relative rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl shadow-indigo-500/10 overflow-hidden backdrop-blur-xl p-6">
                        {/* Faint glow */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-32 bg-indigo-500/15 blur-3xl rounded-full pointer-events-none" />
                        {/* Top bar */}
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                            <div className="ml-auto text-xs font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                Dashboard — February 2026
                            </div>
                        </div>
                        {/* Mini stat cards */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[
                                { label: 'Total Meals', value: '487', color: 'from-indigo-500/20 to-purple-500/10', border: 'border-indigo-500/20', text: 'text-indigo-300' },
                                { label: 'Members', value: '18', color: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/20', text: 'text-emerald-300' },
                                { label: 'Due Amount', value: '₹ 320', color: 'from-rose-500/20 to-pink-500/10', border: 'border-rose-500/20', text: 'text-rose-300' },
                            ].map(card => (
                                <div key={card.label} className={`rounded-2xl bg-gradient-to-br ${card.color} border ${card.border} p-4`}>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{card.label}</p>
                                    <p className={`${card.text} font-black text-lg leading-none`}>{card.value}</p>
                                </div>
                            ))}
                        </div>
                        {/* Fake progress bars */}
                        <div className="space-y-2.5">
                            {[
                                { label: 'Market', pct: '72%', color: 'bg-indigo-500' },
                                { label: 'Gas & Utilities', pct: '45%', color: 'bg-amber-500' },
                                { label: 'House Rent', pct: '90%', color: 'bg-emerald-500' },
                            ].map(bar => (
                                <div key={bar.label} className="flex items-center gap-3">
                                    <span className="text-slate-500 text-[10px] font-bold w-20 shrink-0 text-left">{bar.label}</span>
                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: bar.pct }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.2, delay: 1, ease: [0.16, 1, 0.3, 1] }}
                                            className={`h-full ${bar.color} rounded-full`}
                                        />
                                    </div>
                                    <span className="text-slate-500 text-[10px] font-bold w-8 text-right">{bar.pct}</span>
                                </div>
                            ))}
                        </div>
                        {/* Bottom label */}
                        <p className="text-center text-slate-600 text-[10px] font-bold mt-5 uppercase tracking-widest">
                            Live Dashboard Preview · Rani Bhawban Mess
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
