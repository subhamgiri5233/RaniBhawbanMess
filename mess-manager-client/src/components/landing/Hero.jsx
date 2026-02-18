import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
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
                        Version 2.0 is now live
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
            </div>
        </section>
    );
};

export default Hero;
