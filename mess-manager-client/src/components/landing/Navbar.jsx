import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import Button from '../ui/Button';

const Navbar = ({ onLoginClick }) => {
    return (
        <nav className="fixed top-0 w-full z-40 bg-slate-950/40 backdrop-blur-2xl border-b border-white/5 transition-all">
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => window.location.reload()}
                    title="Refresh Page"
                >
                    <motion.div
                        initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                        animate={{ rotate: 0, scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20"
                    >
                        <Home className="text-white fill-current" size={24} />
                    </motion.div>
                    <div className="flex overflow-hidden">
                        <span className="text-xl font-black bg-gradient-to-r from-white via-indigo-400 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                            Rani Bhawban
                        </span>
                    </div>
                </div>
                <Button
                    onClick={onLoginClick}
                    className="rounded-full px-8 py-2.5 font-bold shadow-xl shadow-indigo-100 dark:shadow-none hover:shadow-indigo-200 transition-all"
                >
                    Login
                </Button>
            </div>
        </nav>
    );
};

export default Navbar;
