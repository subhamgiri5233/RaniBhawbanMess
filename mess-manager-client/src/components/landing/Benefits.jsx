import { Check } from 'lucide-react';
import Card from '../ui/Card';

import { motion } from 'framer-motion';
import { memo } from 'react';

const Benefits = () => {

    return (
        <section id="benefits" className="container mx-auto px-6 mb-32">
            <div className="flex justify-center">
                {/* Main Bento Card - Full Width Centered */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="w-full"
                >
                    <Card className="bg-indigo-300/40 dark:bg-slate-900 border-0 p-10 md:p-20 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[480px]">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 via-transparent to-primary-500/5 pointer-events-none" />
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                        
                        <motion.h2 className="text-4xl md:text-6xl font-[950] text-slate-900 dark:text-white mb-10 tracking-tighter uppercase leading-[0.85] relative z-20 max-w-3xl">
                            Everything you <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-primary-500">Need to run a happy mess.</span>
                        </motion.h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 relative z-20 max-w-4xl w-full">
                            {[
                                'Unmatched financial audit transparency',
                                'Precise Bengali PDF reporting engine',
                                'Secure role-based mess administration',
                                'Market duty logic with auto-collision detection',
                                'Real-time balance synchronization',
                                'Automated monthly reset protocols'
                            ].map((benefit, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-4 group justify-start md:justify-start"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                                        <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[11px] text-left">{benefit}</span>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </div>
        </section>
    );
};

export default memo(Benefits);


