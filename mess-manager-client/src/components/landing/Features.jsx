import {
    Users, Utensils, Calculator, Receipt, Clock,
    ShoppingCart, Bell, FileText, BarChart2, Smartphone, CreditCard,
    Calendar, Shield, Zap, Gift
} from 'lucide-react';
import Card from '../ui/Card';

const Features = () => {


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
            <div
                className="text-center mb-14"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-300/40 dark:bg-indigo-500/20 border border-indigo-400/30 dark:border-white/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-5">
                    <Zap size={13} className="animate-pulse" /> RB Protocol v4.0.51
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight uppercase">
                    Core System{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-primary-500 to-indigo-400">
                        Capabilities.
                    </span>
                </h2>
                <p className="text-slate-500 dark:text-slate-500 font-bold max-w-2xl mx-auto text-sm uppercase tracking-widest opacity-80">
                    Deployed as a distributed administrative layer for total regional transparency.
                </p>
            </div>


            <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="hover:-translate-y-2 transition-transform duration-300"
                    >
                        <Card className="h-full p-8 border border-indigo-400/20 bg-indigo-200/40 dark:bg-slate-900/40 shadow-premium group rounded-[2rem] relative overflow-hidden flex flex-col">
                            {/* Feature Numbering */}
                            <div className="absolute top-6 right-8 font-mono text-[10px] font-black opacity-20 group-hover:opacity-40 transition-opacity text-indigo-500">
                                0{index + 1} // SYS_FEATURE
                            </div>

                            <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500`}>
                                <feature.icon className={feature.color} size={28} />
                            </div>
                            
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 tracking-tighter uppercase leading-none">{feature.title}</h3>
                            <p className="text-slate-600 dark:text-slate-500 text-[11px] leading-relaxed font-bold uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity flex-grow">{feature.description}</p>
                            
                            {/* Bottom Scanner Line */}
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500/0 group-hover:bg-indigo-500/30 transition-all overflow-hidden">
                                <div 
                                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-shimmer" 
                                />
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Features;


