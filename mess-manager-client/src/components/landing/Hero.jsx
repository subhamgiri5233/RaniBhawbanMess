import { useState, memo } from 'react';
import { ArrowRight, Sparkles, Utensils, ShoppingBag, ShieldCheck, Wallet, ChevronRight, Check, Calendar, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';

const Hero = ({ onLoginClick }) => {
    // Interactive demo state for the right-side live simulator card
    const [demoLunch, setDemoLunch] = useState(true);
    const [demoDinner, setDemoDinner] = useState(true);

    return (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-24 pt-2 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                
                {/* Left Column: Natural, human-friendly mess intro (6 cols) */}
                <div className="lg:col-span-6 flex flex-col items-start text-left">
                    {/* Announcement Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-6 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Rani Bhawban Mess Management</span>
                    </div>
                    
                    {/* Professional, Clear Headline */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-white mb-5 tracking-tight leading-[1.15]">
                        Smart hostel dining & mess accounts,{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400">
                            made simple and transparent.
                        </span>
                    </h1>

                    {/* Human Subtitle */}
                    <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed max-w-xl font-normal">
                        Easily record daily lunch and dinner meals, manage bazaar duty turns, calculate dynamic meal rates automatically, and download monthly Bengali PDF bills with total trust.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                        <Button
                            onClick={onLoginClick}
                            size="lg"
                            className="px-7 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 bg-indigo-600 hover:bg-indigo-500 text-white transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            Member Login <ArrowRight size={16} />
                        </Button>
                        <a
                            href="#features"
                            className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-400 hover:text-white rounded-xl border border-slate-700/60 hover:border-slate-500 bg-slate-900/40 backdrop-blur-md transition-all flex items-center justify-center gap-1.5"
                        >
                            Explore Features <ChevronRight size={15} />
                        </a>
                    </div>

                    {/* Key Assurance Badges */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-5 mt-10 pt-6 border-t border-white/10 text-slate-400 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                            <Check size={14} className="text-emerald-400" />
                            <span>100% Accurate Calculations</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Check size={14} className="text-emerald-400" />
                            <span>Secure Single Device Login</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Check size={14} className="text-emerald-400" />
                            <span>Instant Bengali PDF Bills</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: High-End Live Interactive Preview Card (6 cols) */}
                <div className="lg:col-span-6 relative">
                    {/* Soft ambient glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-emerald-500/15 rounded-3xl blur-2xl opacity-60 pointer-events-none" />
                    
                    <div className="relative rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-2xl p-5 sm:p-6 space-y-5">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                                <div>
                                    <h3 className="text-sm font-extrabold text-white">Rani Bhawban Mess</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hostel Dashboard • August 2026</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-extrabold text-emerald-400 uppercase">
                                Online
                            </div>
                        </div>

                        {/* Top 3 Real-time Metric Matrix */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">
                                    <Utensils size={12} className="text-indigo-400" />
                                    <span>Meals Today</span>
                                </div>
                                <div className="text-lg sm:text-xl font-black text-white">
                                    {(demoLunch ? 38 : 0) + (demoDinner ? 36 : 0)}
                                </div>
                                <span className="text-[9px] text-emerald-400 font-bold">● Kitchen synced</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">
                                    <TrendingUp size={12} className="text-emerald-400" />
                                    <span>Meal Rate</span>
                                </div>
                                <div className="text-lg sm:text-xl font-black text-emerald-400">
                                    ₹48.50
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold">Auto-calculated</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">
                                    <Wallet size={12} className="text-amber-400" />
                                    <span>Mess Balance</span>
                                </div>
                                <div className="text-lg sm:text-xl font-black text-white">
                                    ₹24,800
                                </div>
                                <span className="text-[9px] text-indigo-400 font-bold">Verified cash</span>
                            </div>
                        </div>

                        {/* Interactive Meal Toggle Simulation */}
                        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span className="text-xs font-black text-white uppercase tracking-wider">Try Daily Meal Toggle</span>
                                </div>
                                <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                                    Click To Test
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Lunch Toggle Button */}
                                <button
                                    onClick={() => setDemoLunch(!demoLunch)}
                                    className={`p-3 rounded-xl border flex items-center justify-between transition-all select-none ${
                                        demoLunch 
                                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                    }`}
                                >
                                    <div className="text-left">
                                        <div className="text-xs font-extrabold">Lunch (দুপুর)</div>
                                        <div className="text-[9px] opacity-70">12:30 PM Shift</div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                        demoLunch ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                        {demoLunch ? 'Taking (1)' : 'Off (0)'}
                                    </span>
                                </button>

                                {/* Dinner Toggle Button */}
                                <button
                                    onClick={() => setDemoDinner(!demoDinner)}
                                    className={`p-3 rounded-xl border flex items-center justify-between transition-all select-none ${
                                        demoDinner 
                                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                    }`}
                                >
                                    <div className="text-left">
                                        <div className="text-xs font-extrabold">Dinner (রাত)</div>
                                        <div className="text-[9px] opacity-70">08:30 PM Shift</div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                        demoDinner ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                        {demoDinner ? 'Taking (1)' : 'Off (0)'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Duty Schedule & Recent Activity */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                                        <ShoppingBag size={15} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-extrabold text-white">Today's Bazaar Duty</div>
                                        <div className="text-[10px] text-slate-400">Assigned Member: Subham Giri</div>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    Scheduled
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                        <ShieldCheck size={15} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-extrabold text-white">Monthly Summary Bills</div>
                                        <div className="text-[10px] text-slate-400">Bengali PDF Statement Ready</div>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    Ready
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};

export default memo(Hero);
