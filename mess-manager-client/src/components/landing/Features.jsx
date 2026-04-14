import { motion } from 'framer-motion';
import {
    Users, Utensils, Calculator, Receipt, Clock,
    ShoppingCart, Bell, FileText, BarChart2, Smartphone, CreditCard,
    Calendar, Shield, Zap, Gift
} from 'lucide-react';
import Card from '../ui/Card';

const Features = () => {
    const fadeUp = {
        initial: { opacity: 0, y: 40, rotateX: 15, scale: 0.96, z: -40 },
        animate: { opacity: 1, y: 0, rotateX: 0, scale: 1, z: 0 },
        transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1], type: "spring", stiffness: 40, damping: 25 }
    };

    const staggerContainer = {
        animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
    };

    const features = [
        {
            icon: Users,
            title: 'Member Management',
            description: 'Add, update, and remove members. Track deposits, balances, and personal profiles with single-device secure login.',
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
            border: 'border-indigo-500/20',
            glow: 'shadow-indigo-500/5 dark:shadow-indigo-500/10',
        },
        {
            icon: Utensils,
            title: 'Meal Tracking',
            description: 'Daily lunch/dinner logging per member with guest meal support, individual deletions, and real-time updates.',
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            border: 'border-emerald-500/20',
            glow: 'shadow-emerald-500/5 dark:shadow-emerald-500/10',
        },
        {
            icon: ShoppingCart,
            title: 'Market Duty',
            description: 'Members request market dates, admins approve with a single click. Auto-rejects conflicting requests. Up to 4 days/month per member.',
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10 dark:bg-amber-500/20',
            border: 'border-amber-500/20',
            glow: 'shadow-amber-500/5 dark:shadow-amber-500/10',
        },
        {
            icon: Receipt,
            title: 'Expense Tracker',
            description: 'Categorized expenses: Market, Spices, Rice, Gas, Wifi, Electricity, House Rent, and more — with approval workflows.',
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-500/10 dark:bg-orange-500/20',
            border: 'border-orange-500/20',
            glow: 'shadow-orange-500/5 dark:shadow-orange-500/10',
        },
        {
            icon: Calculator,
            title: 'Audit Engine',
            description: 'Auto-calculates precise meal rates and member dues with zero margin for error. Supports Bengali formatting for local reporting.',
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500/10 dark:bg-purple-500/20',
            border: 'border-purple-500/20',
            glow: 'shadow-purple-500/5 dark:shadow-purple-500/10',
        },
        {
            icon: FileText,
            title: 'Monthly Summary PDF',
            description: 'Downloadable monthly summary per member — market totals, meal counts, deposits, and due amounts. Fully exportable.',
            color: 'text-cyan-600 dark:text-cyan-400',
            bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
            border: 'border-cyan-500/20',
            glow: 'shadow-cyan-500/5 dark:shadow-cyan-500/10',
        },
        {
            icon: CreditCard,
            title: 'Payment Ledger',
            description: 'Maintain a clear history of your mess contributions and bill settlements. Track your specialized wallet balance in real-time.',
            color: 'text-teal-600 dark:text-teal-400',
            bg: 'bg-teal-500/10 dark:bg-teal-500/20',
            border: 'border-teal-500/20',
            glow: 'shadow-teal-500/5 dark:shadow-teal-500/10',
        },
        {
            icon: Shield,
            title: 'Personal Expenses',
            description: 'Dedicated personal expense logger for members. Track your own contributions such as Gas, Wifi, and Market spends with admin verification.',
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-500/10 dark:bg-rose-500/20',
            border: 'border-rose-500/20',
            glow: 'shadow-rose-500/5 dark:shadow-rose-500/10',
        },
        {
            icon: Calendar,
            title: 'Management Records',
            description: 'Assign monthly Mess Managers and track cooking duty records. Full historical transparency for all administrative actions.',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10 dark:bg-blue-500/20',
            border: 'border-blue-500/20',
            glow: 'shadow-blue-500/5 dark:shadow-blue-500/10',
        },
        {
            icon: BarChart2,
            title: 'Audit Transparency',
            description: 'Monthly balance snapshots — a secure historical record of your financial state, ensuring past dues remain accurate indefinitely.',
            color: 'text-lime-600 dark:text-lime-400',
            bg: 'bg-lime-500/10 dark:bg-lime-500/20',
            border: 'border-lime-500/20',
            glow: 'shadow-lime-500/5 dark:shadow-lime-500/10',
        },
        {
            icon: Clock,
            title: 'Attendance History',
            description: 'Comprehensive historical logs of meal attendance and guest records, ensuring no discrepancies in monthly audits.',
            color: 'text-yellow-600 dark:text-yellow-400',
            bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
            border: 'border-yellow-500/20',
            glow: 'shadow-yellow-500/5 dark:shadow-yellow-500/10',
        },
        {
            icon: Shield,
            title: 'Secure & Fast',
            description: 'JWT auth, single-device sessions, rate limiting, MongoDB indexes, in-memory caching, and useCallback-optimized React for peak performance.',
            color: 'text-pink-600 dark:text-pink-400',
            bg: 'bg-pink-500/10 dark:bg-pink-500/20',
            border: 'border-pink-500/20',
            glow: 'shadow-pink-500/5 dark:shadow-pink-500/10',
        },
    ];

    return (
        <section id="features" className="container mx-auto px-6 mb-32">
            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-14"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-300/40 dark:bg-indigo-500/20 border border-indigo-400/30 dark:border-white/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-5">
                    <Zap size={13} /> Version 3.0 Features
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
                    Everything you need to run your mess,{' '}
                    <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        perfectly.
                    </span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
                    12 powerful features built for real mess management — from daily meals to monthly reports.
                </p>
            </motion.div>


            <motion.div
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, amount: 0.05 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
                style={{ perspective: "1200px" }}
            >
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        variants={fadeUp}
                        whileHover={{ y: -10, scale: 1.03, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } }}
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        <Card className={`h-full p-10 border border-indigo-400/30 bg-indigo-300/40 dark:bg-slate-900 shadow-premium transition-all duration-500 group rounded-[1.5rem] relative overflow-hidden`}>
                            {/* Hover accent shadow */}
                            <div className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${feature.bg.split(' ')[0]}`} />
                            
                            <div className={`w-16 h-16 ${feature.bg} rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>
                                <feature.icon className={feature.color} size={32} />
                            </div>
                            <h3 className="text-xl font-[900] text-slate-900 dark:text-white mb-4 tracking-tighter uppercase leading-none">{feature.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed font-black uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">{feature.description}</p>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
};

export default Features;


