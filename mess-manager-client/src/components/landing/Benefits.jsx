import { CheckCircle2, ShieldCheck, FileCheck, Zap, TrendingUp, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import { memo } from 'react';

const Benefits = () => {
    return (
        <section id="benefits" className="max-w-[1600px] mx-auto px-4 sm:px-6 mb-28">
            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Big Card 1: Core Value Proposition (2 cols) */}
                <div className="lg:col-span-2 rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-900/90 border border-indigo-500/20 shadow-2xl backdrop-blur-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
                    
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest mb-6">
                            <Sparkles size={12} className="text-indigo-400" />
                            Reliable Mess Accounting
                        </div>

                        <h2 className="text-3xl sm:text-5xl font-[950] text-white tracking-tight uppercase leading-[0.95] mb-6 max-w-2xl">
                            Zero calculation errors. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
                                100% Honest & Fair.
                            </span>
                        </h2>

                        <p className="text-slate-400 text-sm sm:text-base font-medium max-w-xl leading-relaxed mb-8">
                            Manual khata registers and notebook calculations often cause lost bills, confusion, and arguments. Rani Bhawban Mess tracks every meal, deposit, and grocery spend with transparent math.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/10">
                        {[
                            'Real-Time Balance Updates',
                            'Clear Bengali PDF Monthly Bills',
                            'Fair Bazaar Duty Rotation',
                            'Past Month Expense Archives'
                        ].map((text, idx) => (
                            <div key={idx} className="flex items-center gap-2.5">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-300">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 2: Security & Privacy (1 col) */}
                <div className="rounded-3xl p-8 bg-slate-900/70 border border-white/10 shadow-xl backdrop-blur-2xl flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className="text-xl font-extrabold text-white tracking-tight uppercase mb-2">
                            Secure Member Access
                        </h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                            Single-device login protection, separate admin privileges, and encrypted passwords ensuring only verified mess residents access their accounts.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Session Status</span>
                            <span className="text-emerald-400 font-extrabold">Active</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Account Security</span>
                            <span className="text-indigo-400 font-extrabold">Verified</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default memo(Benefits);
