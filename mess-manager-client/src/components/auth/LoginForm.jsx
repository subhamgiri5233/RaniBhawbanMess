import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { UserCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const LoginForm = ({ onSuccess }) => {
    const { login } = useAuth();
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
            <div
                className="space-y-6"
            >
                    {/* Role Switcher */}
                    <div className="flex bg-indigo-50 dark:bg-indigo-950/30 p-1.5 rounded-2xl mb-10 relative border border-indigo-200/50 dark:border-indigo-500/30 backdrop-blur-md shadow-inner">
                        <div
                            className={cn(
                                "absolute top-1.5 bottom-1.5 bg-white dark:bg-indigo-500/20 shadow-sm dark:shadow-[0_0_20px_rgba(99,102,241,0.2)] rounded-xl border border-indigo-200 dark:border-indigo-400/30 transition-all duration-300",
                                role === 'admin' ? "left-1.5 right-[50%]" : "left-[50%] right-1.5"
                            )}
                        />
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl transition-all duration-300 relative z-10 ${role === 'admin'
                                ? 'text-indigo-900 dark:text-indigo-100 font-black uppercase tracking-widest text-[10px]'
                                : 'text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-indigo-600 dark:hover:text-indigo-200'
                                }`}
                            onClick={() => { setRole('admin'); setError(''); setUserId(''); setPassword(''); }}
                        >
                            <div
                                className={cn("transition-all duration-300", role === 'admin' && "scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]")}
                            >
                                <ShieldCheck size={20} />
                            </div>
                            Admin
                        </button>
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl transition-all duration-300 relative z-10 ${role === 'member'
                                ? 'text-indigo-900 dark:text-indigo-100 font-black uppercase tracking-widest text-[10px]'
                                : 'text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-indigo-600 dark:hover:text-indigo-200'
                                }`}
                            onClick={() => { setRole('member'); setError(''); setUserId(''); setPassword(''); }}
                        >
                            <div
                                className={cn("transition-all duration-300", role === 'member' && "scale-110 drop-shadow-[0_0_8px_rgba(147,51,234,0.8)]")}
                            >
                                <UserCircle2 size={20} />
                            </div>
                            Member
                        </button>
                    </div>

                    <form
                        onSubmit={handleLogin}
                        className="space-y-8"
                    >
                        <div>
                            <Input
                                label="User ID"
                                icon={UserCircle2}
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                label="Password"
                                icon={ShieldCheck}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div
                                className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 backdrop-blur-md animate-fade-in"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div>
                            <Button
                                className="w-full py-5 text-lg font-black bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 shadow-[0_10px_40px_rgba(99,102,241,0.3)] border border-indigo-500/20 rounded-[1.5rem] transform active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-xs"
                                size="lg"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-indigo-200/30 border-t-indigo-100 rounded-full animate-spin" />
                                        Logging in...
                                    </div>
                                ) : (
                                    `Login as ${role === 'admin' ? 'Admin' : 'Member'}`
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
        </div>
    );
};

export default LoginForm;


