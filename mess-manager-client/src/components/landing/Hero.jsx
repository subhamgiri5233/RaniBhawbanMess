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
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-300/40 dark:bg-indigo-500/20 border border-indigo-400/30 dark:border-white/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8 backdrop-blur-md"
                    >
                        <Sparkles size={14} className="text-amber-500" />
                        Rani Bhawban Financial Terminal
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="text-5xl md:text-8xl font-[950] text-slate-900 dark:text-white mb-8 tracking-[-0.07em] uppercase leading-[0.85]"
                    >
                        Precision Mess
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-800 dark:from-indigo-400 dark:via-primary-400 dark:to-indigo-300">
                            Management.
                        </span>
                    </motion.h1>
                    <motion.p
                        variants={heroText}
                        transition={{ delay: 0.2 }}
                        className="mx-auto max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 font-medium leading-relaxed"
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    >
                        The ultimate administrative backbone for Rani Bhawban Mess. Automate meal tracking, manage precise financial accounting, and generate audit-ready reports with institutional transparency.
                    </motion.p>
                    <motion.div
                        variants={heroText}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button
                            onClick={onLoginClick}
                            size="lg"
                            className="w-full sm:w-auto px-10 py-5 text-lg font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white transition-all relative overflow-hidden group"
                        >
                            <div className="relative z-10 flex items-center justify-center">
                                Launch Terminal <ArrowRight className="ml-2" size={20} />
                            </div>
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
                            className="flex items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-indigo-200/40 dark:bg-slate-900 border border-indigo-300/30 dark:border-white/10 shadow-premium"
                        >
                            <div className={`w-10 h-10 rounded-xl ${i === 0 ? 'bg-blue-500/10' : i === 1 ? 'bg-orange-500/10' : 'bg-emerald-500/10'} flex items-center justify-center`}>
                                <Icon size={20} className={i === 0 ? 'text-blue-500' : i === 1 ? 'text-orange-500' : 'text-emerald-500'} />
                            </div>
                            <div className="text-left">
                                <p className="text-slate-900 dark:text-white font-[900] text-xl leading-none tracking-tighter">{value}</p>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">{label}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;


