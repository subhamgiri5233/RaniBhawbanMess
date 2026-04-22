import { MessageCircle, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const Contact = ({ onLoginClick }) => {
    return (
        <section id="contact" className="container mx-auto px-6 mb-32">
            <div
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-5 uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <Sparkles size={13} /> Get In Touch
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                    Ready to join{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                        Rani Bhawban?
                    </span>
                </h2>
                <p className="text-slate-400 font-medium max-w-xl mx-auto">
                    Contact the mess admin to get your account set up, or login directly if you already have access.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Info card */}
                <div
                    className="p-10 md:p-14 rounded-[2.5rem] bg-indigo-200/40 dark:bg-indigo-300/5 border border-indigo-400/20 dark:border-white/5 backdrop-blur-xl space-y-8 flex flex-col justify-center"
                >
                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <MapPin size={22} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm mb-2">Location</p>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Rani Bhawban Mess, West Bengal, India</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <MessageCircle size={22} className="text-indigo-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm mb-2">WhatsApp</p>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Contact the admin for access credentials and onboarding support.</p>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-indigo-500/10 dark:border-white/5">
                        <p className="px-4 py-2 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/10 dark:border-white/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl inline-block">
                             AUTHORIZED ACCESS ONLY // SECURE_HANDSHAKE
                        </p>
                    </div>
                </div>

                {/* CTA card */}
                <div
                    className="relative p-10 md:p-14 rounded-[2.5rem] bg-indigo-200/40 dark:bg-slate-900 border border-indigo-400/20 dark:border-white/5 backdrop-blur-xl overflow-hidden flex flex-col justify-between gap-10 hover:-translate-y-1 transition-all duration-300"
                >
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
                    <div className="relative z-10 text-center lg:text-left">
                        <h3 className="text-3xl font-[950] text-slate-900 dark:text-white mb-4 tracking-tighter uppercase leading-none">Already a member?</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-relaxed opacity-80">
                            Access the terminal to monitor real-time nutrition loops, financial transparency, and regional market duty protocols.
                        </p>
                    </div>
                    <Button
                        onClick={onLoginClick}
                        className="relative z-10 w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 group shadow-2xl"
                    >
                        Initialize Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default Contact;


