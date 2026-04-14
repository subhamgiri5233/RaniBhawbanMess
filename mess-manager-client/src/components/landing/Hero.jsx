import { motion } from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import { Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';

const TypewriterText = ({ text, delay = 0 }) => {
    const [displayText, setDisplayText] = useState('');
    
    useEffect(() => {
        const timeout = setTimeout(() => {
            let i = 0;
            const timer = setInterval(() => {
                setDisplayText(text.slice(0, i));
                i++;
                if (i > text.length) clearInterval(timer);
            }, 30);
            return () => clearInterval(timer);
        }, delay);
        return () => clearTimeout(timeout);
    }, [text, delay]);

    return (
        <span className="relative">
            {displayText}
            <motion.span 
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-1 h-5 bg-indigo-500 ml-1 mb-[-4px]"
            />
        </span>
    );
};

const Hero = ({ onLoginClick }) => {
    const heroBadge = {
        initial: { opacity: 0, scale: 0.5, rotateZ: -90 },
        animate: { opacity: 1, scale: 1, rotateZ: 0 },
        transition: { duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }
    };

    const heroText = {
        initial: { opacity: 0, y: 40, rotateX: 20, scale: 0.95, z: -60 },
        animate: { opacity: 1, y: 0, rotateX: 0, scale: 1, z: 0 },
        transition: { duration: 1.6, ease: [0.19, 1, 0.22, 1], type: "spring", stiffness: 35, damping: 20 }
    };



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
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-emerald-500"
                        />
                        Rani Bhawban Terminal v4.0
                    </motion.div>
                    
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="text-5xl md:text-8xl font-[950] text-slate-900 dark:text-white mb-8 tracking-[-0.07em] uppercase leading-[0.85]"
                    >
                        Mess handled.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-800 dark:from-indigo-400 dark:via-primary-400 dark:to-indigo-300">
                            Stress cancelled.
                        </span>
                    </motion.h1>

                    <motion.div
                        variants={heroText}
                        className="mx-auto max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 font-medium leading-relaxed min-h-[4.5rem]"
                    >
                        <TypewriterText 
                            delay={1500}
                            text="The ultimate administrative backbone for Rani Bhawban Mess. Automate meal tracking, manage precise financial accounting, and generate audit-ready reports with institutional transparency."
                        />
                    </motion.div>

                    <motion.div
                        variants={heroText}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
                    >
                        <Button
                            onClick={onLoginClick}
                            size="lg"
                            className="w-full sm:w-auto px-10 py-5 text-lg font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white transition-all relative overflow-hidden group"
                        >
                            <motion.div 
                                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
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
            </div>
        </section>
    );
};

export default memo(Hero);


