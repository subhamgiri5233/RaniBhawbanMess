import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

// Admin Pages
const Members = lazy(() => import('./pages/admin/Members'));
const Meals = lazy(() => import('./pages/admin/Meals'));
const Expenses = lazy(() => import('./pages/admin/Expenses'));
const Notifications = lazy(() => import('./pages/admin/Notifications'));
const Calculator = lazy(() => import('./pages/admin/Calculator'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Management = lazy(() => import('./pages/admin/Management'));

// Member Pages
const Market = lazy(() => import('./pages/member/Market'));
const AddExpense = lazy(() => import('./pages/member/AddExpense'));
const Payments = lazy(() => import('./pages/member/Payments'));
const MemberNotifications = lazy(() => import('./pages/member/MemberNotifications'));
const Reports = lazy(() => import('./pages/member/Reports'));
const SpicesAndOthers = lazy(() => import('./pages/member/SpicesAndOthers'));
const MemberMeals = lazy(() => import('./pages/member/MemberMeals'));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Initializing...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'admin') {
    // Members trying to access admin pages get redirected to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <DataProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Landing Page */}
                <Route path="/" element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                } />

                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />

                <Route element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  {/* Dashboard - accessible to all logged-in users */}
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Admin-only Routes */}
                  <Route path="/members" element={<AdminRoute><Members /></AdminRoute>} />
                  <Route path="/meals" element={<AdminRoute><Meals /></AdminRoute>} />
                  <Route path="/expenses" element={<AdminRoute><Expenses /></AdminRoute>} />
                  <Route path="/notifications" element={<AdminRoute><Notifications /></AdminRoute>} />
                  <Route path="/calculator" element={<AdminRoute><Calculator /></AdminRoute>} />
                  <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
                  <Route path="/management" element={<AdminRoute><Management /></AdminRoute>} />

                  {/* Shared Routes - both admin and members can add expenses */}
                  <Route path="/add-expense" element={<AddExpense />} />

                  {/* Member Routes - accessible to all */}
                  <Route path="/market" element={<Market />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/member-notifications" element={<MemberNotifications />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/spices-others" element={<SpicesAndOthers />} />
                  <Route path="/member-meals" element={<MemberMeals />} />
                </Route>

                {/* Catch all - redirect to landing page */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </DataProvider>
        </AuthProvider>
      </Router >
    </ThemeProvider>
  );
}

export default App;
