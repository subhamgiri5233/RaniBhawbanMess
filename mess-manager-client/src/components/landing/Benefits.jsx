import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, memo, useState } from 'react';
import { Check, Users, Utensils, IndianRupee, ShieldCheck, Activity, BarChart3, Globe } from 'lucide-react';
import Card from '../ui/Card';

const Counter = ({ value, duration = 2 }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest * 10) / 10);
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const controls = animate(count, value, { duration });
        return controls.stop;
    }, [value, duration, count]);

    useEffect(() => {
        return rounded.onChange(v => setDisplay(v));
    }, [rounded]);

    return <span>{display}</span>;
};

const Benefits = () => {
    const statCards = [
        { icon: Users, label: 'Active Members', value: 18, suffix: '', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-300/50 dark:bg-indigo-500/10', border: 'border-indigo-400/30' },
        { icon: Utensils, label: 'Meals Monthly', value: 487, suffix: '+', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-indigo-300/50 dark:bg-emerald-500/10', border: 'border-indigo-400/30' },
    ];

    const secondaryStats = [
        { icon: IndianRupee, label: 'Avg Meal Rate', value: 38.5, suffix: ' ₹', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-indigo-300/50 dark:bg-amber-500/10', border: 'border-indigo-400/30' },
        { icon: ShieldCheck, label: 'System Uptime', value: 99.9, suffix: '%', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-indigo-300/50 dark:bg-rose-500/10', border: 'border-indigo-400/30' },
    ];

    return (
        <section id="benefits" className="container mx-auto px-6 mb-32">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-[240px]">
                
                {/* Main Bento Card - 7 Columns */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="md:col-span-12 lg:col-span-7 row-span-2"
                >
                    <Card className="h-full bg-indigo-200/40 dark:bg-slate-900 border-0 p-10 md:p-16 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                        
                        <motion.h2 className="text-4xl md:text-5xl font-[950] text-slate-900 dark:text-white mb-10 tracking-tighter uppercase leading-[0.9] relative z-20">
                            Everything you <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-primary-500">Need to run a happy mess.</span>
                        </motion.h2>

                        <div className="space-y-5 relative z-20">
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
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                        <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[13px]">{benefit}</span>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                </motion.div>

                {/* Stat Bento 1 - 5 Columns */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-6 lg:col-span-5 row-span-1"
                >
                    <Card className="h-full p-8 flex flex-col justify-between border-indigo-400/20">
                        <div className="flex justify-between items-start">
                             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                 <Utensils className="text-emerald-500" size={24} />
                             </div>
                             <div className="text-right">
                                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Success Rate</p>
                                 <Activity className="text-emerald-500 ml-auto" size={16} />
                             </div>
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-[950] text-5xl tracking-tighter mb-2">
                                <Counter value={487} />+
                            </p>
                            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest opacity-80 decoration-emerald-500/30 underline underline-offset-4 decoration-2">Monthly Meals Served</p>
                        </div>
                    </Card>
                </motion.div>

                {/* Stat Bento 2 - Half Width */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-6 lg:col-span-2 row-span-1"
                >
                    <Card className="h-full p-8 flex flex-col justify-center text-center bg-indigo-600/10 border-indigo-600/20">
                        <Users className="text-indigo-500 mx-auto mb-4" size={32} />
                        <p className="text-slate-900 dark:text-white font-[950] text-4xl tracking-tighter mb-1"><Counter value={18} /></p>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Active Members</p>
                    </Card>
                </motion.div>

                {/* Chart Bento - 3 Columns */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="md:col-span-12 lg:col-span-3 row-span-1"
                >
                    <Card className="h-full p-8 flex flex-col justify-center border-indigo-400/20">
                        <div className="flex items-center gap-3 mb-6">
                            <BarChart3 className="text-indigo-500" size={20} />
                            <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">Efficiency Audit</span>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Audit Precision', pct: 99.9, color: 'bg-indigo-500' },
                                { label: 'System Uptime', pct: 99.5, color: 'bg-emerald-500' },
                            ].map(bar => (
                                <div key={bar.label}>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 px-1 opacity-70">
                                        <span>{bar.label}</span>
                                        <span>{bar.pct}%</span>
                                    </div>
                                    <div className="h-2 bg-indigo-500/10 rounded-full overflow-hidden border border-indigo-500/10">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            whileInView={{ width: `${bar.pct}%` }} 
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className={`h-full ${bar.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </div>
        </section>
    );
};

export default memo(Benefits);


