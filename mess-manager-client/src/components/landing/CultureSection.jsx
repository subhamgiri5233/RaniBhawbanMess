import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const CultureSection = () => {
    return (
        <section id="culture" className="container mx-auto px-6 mb-32">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                className="relative p-12 md:p-16 rounded-[4rem] overflow-hidden bg-white/5 border border-white/10 backdrop-blur-lg"
            >
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold mb-6"
                        >
                            <Sparkles size={16} />
                            Experience the Culture
                        </motion.div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                            More than just a <span className="text-amber-400">Utility</span>.
                            <br />
                            It's a lifestyle.
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-slate-400 mb-8 font-medium">
                            We've integrated ancient wisdom and regional traditions into your daily routine. From a clock that speaks your language to daily verses from the Bhagavad Gita, your dashboard is built to inspire.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                                <h4 className="text-amber-400 font-bold mb-2">Bhagavad Gita</h4>
                                <p className="text-sm text-slate-400">701 verses with sequential daily updates and Bengali meanings.</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                                <h4 className="text-amber-400 font-bold mb-2">Bengali Clock</h4>
                                <p className="text-sm text-slate-400">Native digit support for a truly localized time-keeping experience.</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 flex justify-center">
                        <motion.div
                            animate={{
                                y: [0, -20, 0],
                                rotate: [0, 2, 0]
                            }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[3rem] shadow-2xl flex items-center justify-center p-8 group"
                        >
                            <div className="absolute inset-4 border-2 border-white/20 rounded-[2rem] group-hover:inset-2 transition-all duration-700" />
                            <div className="text-center text-white">
                                <div className="text-6xl md:text-7xl mb-4">🕉️</div>
                                <p className="font-bold text-xl mb-1">Gita Verse</p>
                                <p className="text-amber-100 text-sm opacity-80 italic">of the Day</p>
                            </div>

                            {/* Decorative circles */}
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/30 blur-2xl rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-400/20 blur-3xl rounded-full" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default CultureSection;
