import { useAuth } from '../context/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import MemberDashboard from './member/MemberDashboard';

const Dashboard = () => {
    const { user } = useAuth();

    if (user?.role === 'admin') {
        return <AdminDashboard />;
    }

    return <MemberDashboard />;
};

export default Dashboard;
