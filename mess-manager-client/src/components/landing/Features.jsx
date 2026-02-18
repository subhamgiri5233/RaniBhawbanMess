import { motion } from 'framer-motion';
import { Users, Utensils, Calculator, Receipt, Clock, Sparkles } from 'lucide-react';
import Card from '../ui/Card';

const Features = () => {
    const fadeUp = {
        initial: {
            opacity: 0,
            y: 40,
            rotateX: 15,
            scale: 0.96,
            z: -40
        },
        animate: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            z: 0
        },
        transition: {
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1],
            type: "spring",
            stiffness: 40,
            damping: 25
        }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const features = [
        {
            icon: Users,
            title: 'Member Management',
            description: 'Efficiently track deposits, monthly balances, and personal details with real-time updates.',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            span: 'md:col-span-1'
        },
        {
            icon: Utensils,
            title: 'Advanced Meal Tracking',
            description: 'Log daily lunch/dinner with guest support and password-protected "Clear All" functionality for admins.',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            span: 'md:col-span-1'
        },
        {
            icon: Calculator,
            title: 'Monthly PDF Reports',
            description: 'Generate professional monthly calculators with full Bengali font support, shareable with all members.',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            span: 'md:col-span-1'
        },
        {
            icon: Receipt,
            title: 'Expense Tracker+',
            description: 'Categorized tracking for Bazar, Chal, and Utilities with specialized themes and approval workflows.',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            span: 'md:col-span-1'
        },
        {
            icon: Clock,
            title: 'Cultural Integration',
            description: 'Interactive Bengali digits clock and daily spiritual messages from the Bhagavad Gita.',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            span: 'md:col-span-1'
        },
        {
            icon: Sparkles,
            title: 'Visual Aesthetics',
            description: 'Dynamic particle effects for festivals like Durga Puja, Diwali, and member birthdays.',
            color: 'text-pink-600',
            bg: 'bg-pink-50',
            span: 'md:col-span-1'
        }
    ];

    return (
        <section id="features" className="container mx-auto px-6 mb-32">
            <motion.div
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, amount: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                style={{ perspective: "1200px" }}
            >
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        variants={fadeUp}
                        className={`${feature.span}`}
                        whileHover={{
                            y: -12,
                            rotateY: 3,
                            rotateX: -3,
                            scale: 1.03,
                            transition: {
                                duration: 0.5,
                                ease: [0.34, 1.56, 0.64, 1]
                            }
                        }}
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        <Card className="h-full p-8 border border-white/10 bg-white/5 shadow-2xl shadow-indigo-500/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-700 group rounded-[2.5rem] backdrop-blur-2xl" style={{ transform: "translateZ(20px)" }}>
                            <div className={`w-14 h-14 ${feature.bg} dark:bg-opacity-10 rounded-2xl flex items-center justify-center mb-6 border border-white dark:border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                                <feature.icon className={feature.color} size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-slate-300 leading-relaxed font-medium">
                                {feature.description}
                            </p>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
};

export default Features;
