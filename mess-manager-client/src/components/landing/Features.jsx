import {
    Users, Utensils, Calculator, Receipt, Clock,
    ShoppingCart, Bell, FileText, BarChart2, CreditCard,
    Calendar, Shield, Zap, CheckCircle2, Sparkles
} from 'lucide-react';
import Card from '../ui/Card';

const Features = () => {
    const keyHighlights = [
        {
            icon: Utensils,
            title: 'Daily Meal Tracking',
            desc: 'Turn lunch and dinner meals on/off anytime with easy guest meal options and instant kitchen counts.',
            tag: 'Daily Meals'
        },
        {
            icon: Calculator,
            title: 'Automatic Meal Rate Calculation',
            desc: 'Real-time computation of dynamic meal rates, bazaar shopping contributions, and remaining balances.',
            tag: 'Zero Math Errors'
        },
        {
            icon: ShoppingCart,
            title: 'Bazaar Duty Schedule',
            desc: 'Fair rotation system for daily grocery and bazaar shopping with date requests and expense tracking.',
            tag: 'Market Schedule'
        },
        {
            icon: FileText,
            title: 'Bengali PDF Monthly Bills',
            desc: 'Download clean, printable monthly summary statements formatted in Bengali fonts for all mess members.',
            tag: 'PDF Statements'
        }
    ];

    const featureMatrix = [
        {
            icon: Users,
            title: 'Member Profiles',
            desc: 'Keep track of all active residents, room numbers, contact phone numbers, and login credentials.',
            badge: 'Members'
        },
        {
            icon: Receipt,
            title: 'Clear Expense Categories',
            desc: 'Organized logs for Bazaar, Rice, Cooking Spices, Gas cylinder, WiFi bill, Electricity, and Room rent.',
            badge: 'Expenses'
        },
        {
            icon: CreditCard,
            title: 'Member Deposits & Payments',
            desc: 'Track advance deposits, bazaar shopping spends, and verified monthly payment receipts.',
            badge: 'Payments'
        },
        {
            icon: Calendar,
            title: 'Manager & Cook Roster',
            desc: 'Keep records of monthly appointed mess managers, cooking staff, and mess notices.',
            badge: 'Management'
        },
        {
            icon: Shield,
            title: 'Secure Device Login',
            desc: 'Safe single-device authentication keeping your mess account and balance secure.',
            badge: 'Security'
        },
        {
            icon: BarChart2,
            title: 'Monthly History Archives',
            desc: 'Access past months’ meal sheets, bills, and expense reports with historical accuracy.',
            badge: 'History'
        }
    ];

    return (
        <section id="features" className="max-w-[1600px] mx-auto px-4 sm:px-6 mb-28">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-[0.2em] mb-4">
                    <Sparkles size={12} className="text-emerald-400 animate-pulse" />
                    Built for Rani Bhawban Mess
                </div>
                <h2 className="text-3xl sm:text-5xl font-[950] text-white uppercase tracking-tight leading-tight">
                    Everything you need to <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-400">
                        Run Your Mess Smoothly
                    </span>
                </h2>
                <p className="text-slate-400 text-sm sm:text-base mt-4 font-medium leading-relaxed">
                    Designed specifically for student and bachelor messes to eliminate calculation disputes, track grocery spends, and keep everyone on the same page.
                </p>
            </div>

            {/* Split Visual Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16 p-6 sm:p-10 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
                <div className="lg:col-span-6 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest">
                        Daily Cooking & Bazaar Rotation
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                        Fair market duty assignment & transparent grocery receipts.
                    </h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Every rupee spent in the local market is logged with category tags. Members can request convenient shopping dates while admins ensure equal duty distribution across the month.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <div className="text-indigo-400 font-extrabold text-xs uppercase tracking-wider">Zero Disputes</div>
                            <div className="text-xs text-slate-300 font-medium">Bazaar expenses directly credit to the member's account.</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <div className="text-emerald-400 font-extrabold text-xs uppercase tracking-wider">Live Counts</div>
                            <div className="text-xs text-slate-300 font-medium">Cook knows exact meal count before preparing food.</div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-6 relative">
                    <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-slate-950 aspect-[16/11]">
                        <img 
                            src="/images/culinary-duty.jpg" 
                            alt="Cooking and Bazaar Duty Management" 
                            className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs font-extrabold text-white">Daily Kitchen & Market Sync</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">Rani Bhawban</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4 Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {keyHighlights.map((feat) => (
                    <div key={feat.title} className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-white/10 hover:border-indigo-500/30 backdrop-blur-xl transition-all group flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <feat.icon size={22} />
                            </div>
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 mb-3 inline-block">
                                {feat.tag}
                            </span>
                            <h3 className="text-lg font-extrabold text-white tracking-tight mb-2">{feat.title}</h3>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">
                                {feat.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 6 Capabilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featureMatrix.map((item) => (
                    <div key={item.title} className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/15 backdrop-blur-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 rounded-xl bg-white/5 text-slate-300">
                                <item.icon size={18} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                {item.badge}
                            </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mb-1.5">{item.title}</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Features;
