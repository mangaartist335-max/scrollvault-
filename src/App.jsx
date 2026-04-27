import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import DashboardScreen from './screens/DashboardScreen';
import WithdrawScreen from './screens/WithdrawScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import AuthCallbackScreen from './screens/AuthCallbackScreen';
import AdminScreen from './screens/AdminScreen';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingOrDashboard />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/auth/callback" element={<AuthCallbackScreen />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
        <Route path="/withdraw" element={<ProtectedRoute><WithdrawScreen /></ProtectedRoute>} />
        <Route path="/privacy" element={<PrivacyPolicyScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('sv_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function LandingOrDashboard() {
  const token = localStorage.getItem('sv_token');
  if (token) return <Navigate to="/dashboard" replace />;
  return <LandingScreen />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
