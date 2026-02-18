import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Card from '../ui/Card';

const Benefits = () => {
    return (
        <section className="container mx-auto px-6 mb-32">
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
                className="bg-white/5 border border-white/10 rounded-[4rem] p-12 md:p-20 relative overflow-hidden backdrop-blur-lg shadow-[0_30px_100px_rgba(99,102,241,0.2)]"
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
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">
                            Everything you need
                            <br />
                            <span className="text-indigo-400">to run a happy mess.</span>
                        </h2>
                        <div className="space-y-6">
                            {[
                                'Real-time automated calculations',
                                'Bengali & English calendar support',
                                'Secure role-based access control',
                                'Mobile-responsive professional UI'
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
                                    className="flex items-center gap-4 text-gray-300"
                                >
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                        <Check size={14} className="text-indigo-400" />
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
                        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                            <div className="space-y-4">
                                <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                                <div className="h-4 w-1/2 bg-white/10 rounded-full" />
                                <div className="h-32 w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-white/5" />
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-12 bg-white/5 rounded-xl" />
                                    <div className="h-12 bg-white/5 rounded-xl" />
                                    <div className="h-12 bg-white/5 rounded-xl" />
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/5 text-center">
                                <p className="text-indigo-300 font-bold mb-1">Modern & Secure</p>
                                <p className="text-gray-500 text-sm">Powered by modern MERN stack technology</p>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
};

export default Benefits;
