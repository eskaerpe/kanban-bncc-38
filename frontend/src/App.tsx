import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BoardDetailPage from './pages/BoardDetailPage';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';

export default function App() {
  const { logout } = useAuth();

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/boards/:id" element={<BoardDetailPage />} />
      </Route>

      <Route path="/logout" element={<LogoutAndRedirect logout={logout} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function LogoutAndRedirect({ logout }: { logout: () => void }) {
  logout();
  return <Navigate to="/login" replace />;
}
