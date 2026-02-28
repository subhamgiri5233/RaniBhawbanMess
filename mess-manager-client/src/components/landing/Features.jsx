import { motion } from 'framer-motion';
import {
    Users, Utensils, Calculator, Receipt, Clock, Sparkles,
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
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            glow: 'shadow-indigo-500/10',
        },
        {
            icon: Utensils,
            title: 'Meal Tracking',
            description: 'Daily lunch/dinner logging per member with guest meal support, individual deletions, and real-time updates.',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            glow: 'shadow-emerald-500/10',
        },
        {
            icon: ShoppingCart,
            title: 'Market Duty',
            description: 'Members request market dates, admins approve with a single click. Auto-rejects conflicting requests. Up to 4 days/month per member.',
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            glow: 'shadow-amber-500/10',
        },
        {
            icon: Receipt,
            title: 'Expense Tracker',
            description: 'Categorized expenses: Market, Spices, Rice, Gas, Wifi, Electricity, House Rent, and more — with approval workflows.',
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
            glow: 'shadow-orange-500/10',
        },
        {
            icon: Calculator,
            title: 'Monthly Calculator',
            description: 'Auto-calculates per-member meal costs, expenses, and dues. Generates professional PDF reports with Bengali font support.',
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            glow: 'shadow-purple-500/10',
        },
        {
            icon: FileText,
            title: 'Monthly Summary PDF',
            description: 'Downloadable monthly summary per member — market totals, meal counts, deposits, and due amounts. Fully exportable.',
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20',
            glow: 'shadow-cyan-500/10',
        },
        {
            icon: Bell,
            title: 'Smart Notifications',
            description: 'Real-time notifications for market requests, payment dues, and admin approvals. Bulk WhatsApp payment alerts supported.',
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            glow: 'shadow-rose-500/10',
        },
        {
            icon: CreditCard,
            title: 'Payment Tracking',
            description: 'Track who has paid, who owes, and send automated payment reminders. Mark payments as received from the dashboard.',
            color: 'text-teal-400',
            bg: 'bg-teal-500/10',
            border: 'border-teal-500/20',
            glow: 'shadow-teal-500/10',
        },
        {
            icon: Calendar,
            title: 'Management Records',
            description: 'Assign monthly Mess Managers and track cooking duty records. Full history with add/delete controls.',
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            glow: 'shadow-blue-500/10',
        },
        {
            icon: BarChart2,
            title: 'Deposit Snapshot',
            description: 'Monthly deposit balance snapshots — a historical record so past dues don\'t shift when future data is updated.',
            color: 'text-lime-400',
            bg: 'bg-lime-500/10',
            border: 'border-lime-500/20',
            glow: 'shadow-lime-500/10',
        },
        {
            icon: Clock,
            title: 'Cultural Integration',
            description: 'Interactive Bengali digit clock and daily spiritual messages from the Bhagavad Gita. Festival particle effects for Durga Puja & Diwali.',
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            glow: 'shadow-yellow-500/10',
        },
        {
            icon: Shield,
            title: 'Secure & Fast',
            description: 'JWT auth, single-device sessions, rate limiting, MongoDB indexes, in-memory caching, and useCallback-optimized React for peak performance.',
            color: 'text-pink-400',
            bg: 'bg-pink-500/10',
            border: 'border-pink-500/20',
            glow: 'shadow-pink-500/10',
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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-5 uppercase tracking-widest">
                    <Zap size={13} /> Version 3.0 Features
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                    Everything you need to run your mess,{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        perfectly.
                    </span>
                </h2>
                <p className="text-slate-400 font-medium max-w-2xl mx-auto">
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
                        <Card className={`h-full p-6 border ${feature.border} bg-white/5 shadow-2xl ${feature.glow} hover:bg-white/10 transition-all duration-500 group rounded-3xl backdrop-blur-2xl`}>
                            <div className={`w-12 h-12 ${feature.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
                                <feature.icon className={feature.color} size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{feature.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed font-medium">{feature.description}</p>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
};

export default Features;
