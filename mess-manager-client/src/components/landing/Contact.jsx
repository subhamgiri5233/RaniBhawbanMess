import { MessageCircle, MapPin, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

const Contact = ({ onLoginClick }) => {
    return (
        <section id="contact" className="max-w-[1600px] mx-auto px-4 sm:px-6 mb-28">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest mb-4">
                    <Sparkles size={12} className="text-emerald-400" /> 
                    Mess Resident Portal
                </div>
                <h2 className="text-3xl sm:text-5xl font-[950] text-white tracking-tight uppercase mb-3">
                    Ready to access{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400">
                        Rani Bhawban Mess?
                    </span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-lg mx-auto">
                    Sign in to your member account to turn your meals on or off, check your bazaar duty date, or download this month's PDF bill.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Info Card */}
                <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl space-y-6 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <MapPin size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-white font-extrabold text-sm mb-0.5">Mess Location</p>
                                <p className="text-slate-400 text-xs font-medium">Rani Bhawban Mess, West Bengal, India</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                <MessageCircle size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-white font-extrabold text-sm mb-0.5">Manager & Support</p>
                                <p className="text-slate-400 text-xs font-medium">Contact the Mess Manager for login credentials or new room onboarding.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                        <ShieldCheck size={14} />
                        Authorized Hostel Member Portal
                    </div>
                </div>

                {/* Direct Action Card */}
                <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-slate-900/80 to-slate-900 border border-indigo-500/20 backdrop-blur-xl flex flex-col justify-between gap-6 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                    
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Member Login</h3>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">
                            Log in to view daily meal counts, track your personal grocery spending, and download your monthly mess bill with one click.
                        </p>
                    </div>

                    <Button
                        onClick={onLoginClick}
                        className="relative z-10 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/25 active:scale-95 transition-all"
                    >
                        Login To Account <ArrowRight size={16} />
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default Contact;
