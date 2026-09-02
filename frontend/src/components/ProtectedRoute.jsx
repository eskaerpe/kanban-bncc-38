import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Full-screen loading fallback while the auth session is being checked.
export const AuthSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" aria-hidden="true" />
    <span className="text-sm text-slate-500">Loading...</span>
  </div>
);

// Gate used for private pages (Dashboard, board views, etc.).
// When it renders as a layout route (<Route element={<ProtectedRoute />}>),
// the authenticated <Outlet /> takes care of rendering nested routes.
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthSpinner />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

// Gate used for auth pages (login / register): if the user is already
// signed in they are redirected to the app root instead.
export function PublicRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AuthSpinner />;
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
