import LoginForm from '../components/auth/LoginForm';
import Card from '../components/ui/Card';

const Login = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] p-4 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <Card className="w-full max-w-md p-8 sm:p-10 border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                        RB
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Rani Bhawban Mess
                    </h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                        Executive Mess Management System
                    </p>
                </div>

                <LoginForm />
            </Card>
        </div>
    );
};

export default Login;



