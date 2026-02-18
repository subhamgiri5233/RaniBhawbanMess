import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { UserCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginForm = ({ onSuccess }) => {
    const { login, notification, setNotification } = useAuth();
    const navigate = useNavigate();
    const [role, setRole] = useState('admin'); // 'admin' | 'member'
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await login(userId, password, role);
            if (success) {
                if (onSuccess) onSuccess();
                navigate('/dashboard');
            } else {
                setError('Invalid User ID or Password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl mb-10 relative border border-slate-200 dark:border-white/5 backdrop-blur-md">
                <motion.div
                    className="absolute top-1.5 bottom-1.5 bg-white dark:bg-indigo-500/20 shadow-sm dark:shadow-[0_0_20px_rgba(99,102,241,0.2)] rounded-xl border border-slate-200 dark:border-white/10"
                    initial={false}
                    animate={{
                        left: role === 'admin' ? '6px' : '50%',
                        right: role === 'admin' ? '50%' : '6px'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
                <button
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 relative z-10 ${role === 'admin'
                        ? 'text-indigo-600 dark:text-white font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    onClick={() => { setRole('admin'); setError(''); setUserId(''); setPassword(''); }}
                >
                    <motion.div
                        animate={{ scale: role === 'admin' ? 1.1 : 1, filter: role === 'admin' ? 'drop-shadow(0 0 8px rgba(99,102,241,0.8))' : 'none' }}
                        transition={{ duration: 0.3 }}
                    >
                        <ShieldCheck size={20} />
                    </motion.div>
                    Admin
                </button>
                <button
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 relative z-10 ${role === 'member'
                        ? 'text-indigo-600 dark:text-white font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    onClick={() => { setRole('member'); setError(''); setUserId(''); setPassword(''); }}
                >
                    <motion.div
                        animate={{ scale: role === 'member' ? 1.1 : 1, filter: role === 'member' ? 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.8))' : 'none' }}
                        transition={{ duration: 0.3 }}
                    >
                        <UserCircle2 size={20} />
                    </motion.div>
                    Member
                </button>
            </div>

            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="mb-8 p-6 bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl rounded-[2rem] flex flex-col items-center text-center gap-4 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform"></div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 rotate-3">
                            <AlertCircle className="text-white" size={24} />
                        </div>
                        <div>
                            <p className="text-amber-500 text-sm font-black uppercase tracking-widest mb-1">Security Alert</p>
                            <p className="text-slate-600 dark:text-slate-300 font-bold text-sm tracking-tight">{notification.message}</p>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="px-6 py-2.5 bg-amber-500/20 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/10"
                        >
                            Login Again
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.form
                    key={role}
                    initial={{ opacity: 0, x: role === 'admin' ? -50 : 50, rotateY: role === 'admin' ? -15 : 15 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    exit={{ opacity: 0, x: role === 'admin' ? 50 : -50, rotateY: role === 'admin' ? 15 : -15 }}
                    transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                    onSubmit={handleLogin}
                    className="space-y-8"
                    style={{ transformStyle: "preserve-3d" }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Input
                            label="User ID"
                            icon={UserCircle2}
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <Input
                            label="Password"
                            icon={ShieldCheck}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2 text-red-400 text-sm font-medium bg-red-500/10 p-4 rounded-2xl border border-red-500/20 backdrop-blur-md"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Button
                            className="w-full py-5 text-lg font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-[0_10px_40px_rgba(99,102,241,0.3)] border border-white/20 rounded-[1.5rem] transform active:scale-[0.98] transition-all duration-300"
                            size="lg"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Logging in...
                                </div>
                            ) : (
                                `Login as ${role === 'admin' ? 'Admin' : 'Member'}`
                            )}
                        </Button>
                    </motion.div>
                </motion.form>
            </AnimatePresence>


        </div>
    );
};

export default LoginForm;
