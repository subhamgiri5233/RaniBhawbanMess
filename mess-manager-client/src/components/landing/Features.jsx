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
            title: 'Daily Meal Roster & Shift Accounting',
            desc: 'Instant meal logging with guest meal multipliers, daily toggles, and live kitchen counts.',
            tag: 'Real-Time Sync'
        },
        {
            icon: Calculator,
            title: 'Autonomous Audit & Meal Rate Engine',
            desc: 'Real-time computation of dynamic meal rates, market contribution offsets, and exact dues.',
            tag: 'Zero Margin Error'
        },
        {
            icon: ShoppingCart,
            title: 'Market Duty Procurement & Collision Logic',
            desc: 'Automated date request approval system preventing duty clashes and tracking grocery funds.',
            tag: 'Smart Duty Engine'
        },
        {
            icon: FileText,
            title: 'Official Bengali Statement & PDF Exports',
            desc: 'Download institutional monthly balance sheets formatted in Bengali fonts for all mess residents.',
            tag: 'Instant Export'
        }
    ];

    const featureMatrix = [
        {
            icon: Users,
            title: 'Resident Management',
            description: 'Maintain secure member profiles, room records, contact logs, and single-device security credentials.',
            badge: 'Admin & Member'
        },
        {
            icon: Receipt,
            title: 'Categorized Expense Audit',
            description: 'Itemized tracking for Market, Rice, Spices, Gas cylinders, WiFi bills, Electricity, and House Rent.',
            badge: 'Verified Ledger'
        },
        {
            icon: CreditCard,
            title: 'Liquidity & Deposit Vault',
            description: 'Track member monthly advances, duty shopping contributions, and verified payment histories.',
            badge: 'Financial Terminal'
        },
        {
            icon: Calendar,
            title: 'Manager & Cooking Records',
            description: 'Monthly rotation of mess managers, chef records, and audit history logs with full traceability.',
            badge: 'Governance'
        },
        {
            icon: Shield,
            title: 'Single-Device Verification',
            description: 'Institutional-grade session authentication ensuring only verified residents interact with their ledger.',
            badge: 'Security v4'
        },
        {
            icon: BarChart2,
            title: 'Historical Ledger Snapshots',
            description: 'Monthly immutable snapshots preventing retrospective calculation drift across past billing cycles.',
            badge: 'Audit Snapshots'
        }
    ];

    return (
        <section id="features" className="max-w-[1600px] mx-auto px-4 sm:px-6 mb-28">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-[0.2em] mb-4">
                    <Sparkles size={12} className="text-emerald-400 animate-pulse" />
                    Built For Institutional Precision
                </div>
                <h2 className="text-3xl sm:text-5xl font-[950] text-white uppercase tracking-tight leading-tight">
                    Comprehensive Suite for <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-400">
                        Modern Mess Operations
                    </span>
                </h2>
                <p className="text-slate-400 text-sm sm:text-base mt-4 font-medium leading-relaxed">
                    Designed specifically for student hostels and communal mess establishments to eliminate calculation discrepancies and streamline daily administrative tasks.
                </p>
            </div>

            {/* Visual Feature Spotlight: Split Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 items-stretch">
                {/* Left: Interactive Spotlight Cards (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                    {keyHighlights.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div 
                                key={idx}
                                className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-indigo-500/40 backdrop-blur-xl transition-all hover:translate-x-1 group shadow-sm"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
                                        <Icon size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-black text-white tracking-tight">{item.title}</h4>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                                        <span className="inline-block mt-2 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            {item.tag}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Rich Showcase Artwork (7 cols) */}
                <div className="lg:col-span-7 rounded-3xl p-3 bg-gradient-to-b from-white/10 to-white/5 border border-white/15 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-hidden relative group">
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950">
                        <img 
                            src="/images/culinary-duty.jpg" 
                            alt="Culinary Procurement and Market Duty Management" 
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        />
                        
                        {/* Overlay Glass Card */}
                        <div className="absolute inset-x-4 bottom-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/15 shadow-xl flex items-center justify-between gap-4">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-0.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    Culinary Logistics Module
                                </div>
                                <h4 className="text-sm font-black text-white">Smart Market Duty & Grocery Auditing</h4>
                                <p className="text-[11px] text-slate-400 font-medium">Automatic expense allocation linked with member shopping duty</p>
                            </div>
                            <div className="hidden sm:block px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black shrink-0">
                                Automated
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6-Grid Core Capabilities Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featureMatrix.map((feat, i) => {
                    const FeatIcon = feat.icon;
                    return (
                        <div 
                            key={i}
                            className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/30 backdrop-blur-xl transition-all hover:-translate-y-1 group shadow-sm flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:border-emerald-500/40 transition-all">
                                        <FeatIcon size={20} />
                                    </div>
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                        {feat.badge}
                                    </span>
                                </div>
                                <h3 className="text-base font-extrabold text-white tracking-tight mb-2">
                                    {feat.title}
                                </h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                    {feat.description}
                                </p>
                            </div>
                            <div className="pt-4 mt-4 border-t border-white/5 flex items-center text-[10px] font-black uppercase tracking-wider text-emerald-400 group-hover:text-emerald-300">
                                Included in v4.0 <CheckCircle2 size={12} className="ml-1" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default Features;
