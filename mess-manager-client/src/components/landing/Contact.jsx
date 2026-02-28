import { motion } from 'framer-motion';
import { MessageCircle, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const Contact = ({ onLoginClick }) => {
    return (
        <section id="contact" className="container mx-auto px-6 mb-32">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-5 uppercase tracking-widest">
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
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Info card */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <MapPin size={18} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold mb-1">Location</p>
                            <p className="text-slate-400 text-sm font-medium">Rani Bhawban Mess, West Bengal, India</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <MessageCircle size={18} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold mb-1">WhatsApp</p>
                            <p className="text-slate-400 text-sm font-medium">Contact the admin for access credentials and onboarding support.</p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
                            Admin-approved access only · Secure login
                        </p>
                    </div>
                </motion.div>

                {/* CTA card */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -6, transition: { duration: 0.3 } }}
                    className="relative p-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-cyan-500/10 border border-emerald-500/25 backdrop-blur-xl overflow-hidden flex flex-col justify-between gap-8"
                >
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Already a member?</h3>
                        <p className="text-slate-300 font-medium leading-relaxed text-sm">
                            Log in to access your dashboard, track your meals, check dues, and view monthly summaries — all in one place.
                        </p>
                    </div>
                    <Button
                        onClick={onLoginClick}
                        className="relative z-10 w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 group"
                    >
                        Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>
            </div>
        </section>
    );
};

export default Contact;
