import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';

// Direct page imports for instantaneous navigation
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';

// Admin Pages
import Members from './pages/admin/Members';
import Meals from './pages/admin/Meals';
import Expenses from './pages/admin/Expenses';
import Calculator from './pages/admin/Calculator';
import Settings from './pages/admin/Settings';
import Management from './pages/admin/Management';
import MonthlySummary from './pages/admin/MonthlySummary';
import Bin from './pages/admin/Bin';

// Member Pages
import Market from './pages/member/MarketDuty';
import AddExpense from './pages/member/AddExpense';
import MemberExpenses from './pages/member/MemberExpenses';
import Payments from './pages/member/Payments';
import Reports from './pages/member/Reports';
import MemberMeals from './pages/member/MemberMeals';

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
                  <Route path="/calculator" element={<AdminRoute><Calculator /></AdminRoute>} />
                  <Route path="/management" element={<AdminRoute><Management /></AdminRoute>} />
                  <Route path="/monthly-summary" element={<AdminRoute><MonthlySummary /></AdminRoute>} />
                  <Route path="/bin" element={<AdminRoute><Bin /></AdminRoute>} />

                  {/* Shared Routes - accessible to both admin and members */}
                  <Route path="/add-expense" element={<AddExpense />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* Member Routes - accessible to all */}
                  <Route path="/market" element={<Market />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/member-expenses" element={<MemberExpenses />} />
                  <Route path="/reports" element={<Reports />} />
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


