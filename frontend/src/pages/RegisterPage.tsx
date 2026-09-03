import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  KanbanSquare,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from './LoginPage';

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

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) {
      next.name = 'Full name is required.';
    }

    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }

    if (!password) {
      next.password = 'Password is required.';
    } else if (password.length < 6) {
      next.password = 'Password must be at least 6 characters long.';
    }

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
      await register(name.trim(), email.trim(), password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell subtitle="Buat akun pengurus / anggota BNCC baru.">
      <h2 className="text-lg font-bold text-bncc-navy">Buat Akun Baru</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Lengkapi formulir di bawah untuk mendaftar.
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
        {/* Name */}
        <div className="space-y-1">
          <label htmlFor="name" className="text-xs font-semibold text-slate-700">
            Nama Lengkap
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              disabled={submitting}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`${inputBase} ${errors.name ? errorState : validState}`}
            />
          </div>
          <FieldError message={errors.name} />
        </div>

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
            Password (minimal 6 karakter)
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
              autoComplete="new-password"
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
              Membuat Akun...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Daftar Akun
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500 font-medium">
        Sudah memiliki akun?{' '}
        <Link
          to="/login"
          className="font-bold text-bncc-blue hover:text-bncc-blue-dark transition-colors"
        >
          Masuk Sekarang
        </Link>
      </p>
    </AuthShell>
  );
}
