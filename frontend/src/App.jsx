import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';

// Placeholder until a dashboard exists.
const DashboardPlaceholder = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950 p-4 text-center">
    <h1 className="text-2xl font-bold text-white">BNCC Proker Kanban</h1>
    <p className="text-slate-400 text-sm">Dashboard is on the way.</p>
  </div>
);

export default function App() {
  const { logout } = useAuth();

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPlaceholder />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/logout" element={<LogoutAndRedirect logout={logout} />} />
    </Routes>
  );
}

function LogoutAndRedirect({ logout }) {
  logout();
  return <Navigate to="/login" replace />;
}
