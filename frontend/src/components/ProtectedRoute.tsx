import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthSpinner: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" aria-hidden="true" />
    <span className="text-sm text-slate-500">Loading...</span>
  </div>
);

export default function ProtectedRoute(): React.ReactElement {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthSpinner />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function PublicRoute(): React.ReactElement {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AuthSpinner />;
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
