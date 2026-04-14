import { motion } from 'framer-motion';
import { Check, Users, Utensils, IndianRupee, ShieldCheck } from 'lucide-react';
import Card from '../ui/Card';

const Benefits = () => {
    const statCards = [
        { icon: Users, label: 'Active Members', value: '18', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-300/50 dark:bg-indigo-500/20', border: 'border-indigo-400/30' },
        { icon: Utensils, label: 'Meals This Month', value: '487', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-indigo-300/50 dark:bg-emerald-500/20', border: 'border-indigo-400/30' },
        { icon: IndianRupee, label: 'Avg. Meal Cost', value: '₹38.5', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-indigo-300/50 dark:bg-amber-500/20', border: 'border-indigo-400/30' },
        { icon: ShieldCheck, label: 'Uptime', value: '99.9%', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-indigo-300/50 dark:bg-rose-500/20', border: 'border-indigo-400/30' },
    ];

    return (
        <section id="benefits" className="container mx-auto px-6 mb-32">
            <motion.div
                initial={{ opacity: 0, y: 60, rotateX: 10, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                    duration: 1.5,
                    ease: [0.16, 1, 0.3, 1],
                    type: "spring",
                    stiffness: 30,
                    damping: 25
                }}
                className="bg-indigo-200/60 dark:bg-slate-900 border-0 rounded-[4rem] p-12 md:p-20 relative overflow-hidden shadow-premium"
                style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
            >
                <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-500 opacity-10 blur-[120px] rounded-full translate-x-1/2" />
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{
                            delay: 0.3,
                            duration: 0.9,
                            ease: [0.19, 1, 0.22, 1]
                        }}
                    >
                        <h2 className="text-4xl md:text-5xl font-[900] text-slate-900 dark:text-white mb-8 tracking-tighter uppercase leading-[0.9]">
                            Everything you need
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-500">to run a happy mess.</span>
                        </h2>
                        <div className="space-y-6">
                            {[
                                'Unmatched financial audit transparency',
                                'Precise Bengali PDF reporting engine',
                                'Secure role-based mess administration',
                                'Market duty logic with auto-collision detection'
                            ].map((benefit, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: 0.4 + i * 0.12,
                                        duration: 0.7,
                                        ease: [0.19, 1, 0.22, 1]
                                    }}
                                    className="flex items-center gap-4 text-slate-500 font-black uppercase tracking-widest text-[11px] opacity-70"
                                >
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20 dark:border-indigo-500/30">
                                        <Check size={14} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="font-semibold text-lg">{benefit}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 40, rotateY: -15 }}
                        whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{
                            delay: 0.5,
                            duration: 1.0,
                            ease: [0.19, 1, 0.22, 1],
                            type: "spring",
                            stiffness: 50,
                            damping: 15
                        }}
                        whileHover={{
                            scale: 1.04,
                            rotateY: 2,
                            rotateX: -2,
                            transition: {
                                duration: 0.6,
                                ease: [0.34, 1.56, 0.64, 1]
                            }
                        }}
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        <Card className="bg-indigo-300/50 dark:bg-slate-800/50 border border-indigo-400/30 dark:border-white/5 p-8 rounded-[1.5rem] shadow-premium transition-all">
                            {/* Real stats grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {statCards.map(({ icon: Icon, label, value, color, bg, border }, i) => (
                                    <motion.div
                                        key={label}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.6 + i * 0.08, duration: 0.5 }}
                                        className={`p-4 rounded-2xl ${bg} border ${border}`}
                                    >
                                        <Icon size={20} className={`${color} mb-3`} />
                                        <p className="text-slate-900 dark:text-white font-[900] text-2xl leading-none tracking-tighter">{value}</p>
                                        <p className="text-slate-400 text-[10px] font-black mt-2 uppercase tracking-widest opacity-60">{label}</p>
                                    </motion.div>
                                ))}
                            </div>
                            {/* Expense bar */}
                            <div className="space-y-2.5 mb-6">
                                {[
                                    { label: 'Market', pct: 60, color: 'bg-indigo-500' },
                                    { label: 'Utilities', pct: 25, color: 'bg-amber-500' },
                                    { label: 'Rent', pct: 15, color: 'bg-rose-500' },
                                ].map(bar => (
                                    <div key={bar.label} className="flex items-center gap-3">
                                        <span className="text-slate-500 text-[10px] font-bold w-14 shrink-0">{bar.label}</span>
                                        <div className="flex-1 h-1.5 bg-indigo-400/20 dark:bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${bar.pct}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                                className={`h-full ${bar.color} rounded-full`}
                                            />
                                        </div>
                                        <span className="text-slate-500 text-[10px] font-bold">{bar.pct}%</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6 border-t border-slate-100 dark:border-white/5 text-center">
                                <p className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">Modern Terminal Interface</p>
                                <p className="text-slate-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-widest">Enterprise Mess Management</p>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
};

export default Benefits;


