import { Check } from 'lucide-react';
import Card from '../ui/Card';

import { motion } from 'framer-motion';
import { memo } from 'react';

const Benefits = () => {

    return (
        <section id="benefits" className="container mx-auto px-6 mb-32">
            <div className="w-full">
                {/* Main Bento Card - Full Frame */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="w-full"
                >
                    <Card className="bg-indigo-200/40 dark:bg-slate-900 border-0 p-10 md:p-20 flex flex-col justify-center relative overflow-hidden min-h-[500px]">
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
            </div>
        </section>
    );
};

export default memo(Benefits);


