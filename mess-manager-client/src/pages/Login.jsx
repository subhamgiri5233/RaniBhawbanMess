import LoginForm from '../components/auth/LoginForm';
import Card from '../components/ui/Card';

const Login = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md p-8 animate-in fade-in zoom-in duration-300 border-none shadow-2xl shadow-gray-200">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tighter">
                        Rani Bhawban
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Welcome back! Please login to continue.</p>
                </div>

                <LoginForm />
            </Card>
        </div>
    );
};

export default Login;

