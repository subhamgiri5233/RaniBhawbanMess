import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Button from '../ui/Button';

const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Benefits', href: '#benefits' },
    { label: 'Contact', href: '#contact' },
];

const Navbar = ({ onLoginClick }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const sections = navLinks.map(l => l.href.slice(1));
        const observers = sections.map(id => {
            const el = document.getElementById(id);
            if (!el) return null;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
                { threshold: 0.35 }
            );
            obs.observe(el);
            return obs;
        });
        return () => observers.forEach(o => o && o.disconnect());
    }, []);

    const handleNavClick = (href) => {
        setMobileOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <nav className="fixed top-0 w-full z-40 bg-indigo-200/50 dark:bg-slate-950/40 backdrop-blur-2xl border-b border-indigo-400/30 dark:border-white/5 transition-all">
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
                {/* Logo */}
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => window.location.reload()}
                    title="Refresh Page"
                >
                    <div
                        className="w-10 h-10 bg-indigo-300/10 dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-indigo-400/20 overflow-hidden"
                    >
                        <img src="/icons/home.png" alt="Home" className="w-7 h-7 object-contain" />
                    </div>
                    <div className="flex overflow-hidden">
                        <span className="text-xl font-[900] bg-gradient-to-r from-slate-900 dark:from-white via-indigo-600 dark:via-indigo-400 to-indigo-900 dark:to-indigo-500 bg-clip-text text-transparent tracking-[-0.05em] uppercase">
                            Rani Bhawban
                        </span>
                    </div>
                </div>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map(link => (
                        <button
                            key={link.label}
                            onClick={() => handleNavClick(link.href)}
                            className={`relative px-4 py-2 text-[11px] font-[900] uppercase tracking-widest rounded-xl transition-all duration-300 ${activeSection === link.href.slice(1)
                                    ? 'text-indigo-600 dark:text-indigo-300'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white'
                                }`}
                        >
                            {link.label}
                            {activeSection === link.href.slice(1) && (
                                <div
                                    className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Right: Login + Mobile Toggle */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={onLoginClick}
                        className="rounded-2xl px-8 py-2.5 font-black uppercase tracking-[0.15em] text-xs shadow-xl shadow-indigo-400/20 dark:shadow-none hover:shadow-indigo-500/30 transition-all bg-indigo-600 text-white border-0"
                    >
                        Terminal Login
                    </Button>
                    <button
                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-300/40 dark:bg-white/5 border border-indigo-400/30 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        onClick={() => setMobileOpen(v => !v)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div
                    className="md:hidden border-t border-indigo-400/30 dark:border-white/5 bg-indigo-200/80 dark:bg-slate-950/90 backdrop-blur-2xl px-6 py-4 flex flex-col gap-1 shadow-2xl"
                >
                    {navLinks.map(link => (
                        <button
                            key={link.label}
                            onClick={() => handleNavClick(link.href)}
                            className="text-left px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-semibold text-sm transition-all"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;


