import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  KanbanSquare,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthShell: React.FC<{ subtitle: string; children: React.ReactNode }> = ({
  subtitle,
  children,
}) => (
  <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <section className="w-full max-w-md">
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-bncc-blue text-white shadow-sm ring-1 ring-bncc-blue/20">
          <KanbanSquare className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-bncc-navy">
            BNCC Proker Kanban
          </h1>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {/* Card Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {children}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400 font-medium">
        BNCC Proker · Bina Nusantara Computer Club
      </p>
    </section>
  </main>
);

const inputBase =
  'w-full rounded-lg border bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:bg-slate-100';

const validState =
  'border-slate-200 focus:border-bncc-blue focus:ring-2 focus:ring-bncc-blue/20';

const errorState =
  'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p className="mt-1 text-xs text-red-500 font-medium" role="alert">
      {message}
    </p>
  ) : null;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!password) next.password = 'Password is required.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setApiError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell subtitle="Masuk ke portal manajemen program kerja.">
      <h2 className="text-lg font-bold text-bncc-navy">Selamat Datang</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Masukkan kredensial akun BNCC Anda untuk mengelola board.
      </p>

      {apiError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
          <span>{apiError}</span>
        </div>
      )}

      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-semibold text-slate-700">
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@bncc.net"
              value={email}
              disabled={submitting}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`${inputBase} ${errors.email ? errorState : validState}`}
            />
          </div>
          <FieldError message={errors.email} />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              disabled={submitting}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={`${inputBase} pr-10 ${errors.password ? errorState : validState}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <FieldError message={errors.password} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-bncc-blue hover:bg-bncc-blue-dark py-2.5 text-xs font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-bncc-blue/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Memproses...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Masuk
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500 font-medium">
        Belum memiliki akun?{' '}
        <Link
          to="/register"
          className="font-bold text-bncc-blue hover:text-bncc-blue-dark transition-colors"
        >
          Daftar Sekarang
        </Link>
      </p>
    </AuthShell>
  );
}
