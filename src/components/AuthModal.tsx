import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (token: string, user: User, message: string) => void;
}

export function AuthModal({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && !fullName.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.login(email.trim(), password);
        onSuccess(res.token, res.user, res.message);
      } else {
        const res = await api.register(fullName.trim(), email.trim(), password);
        onSuccess(res.token, res.user, res.message);
      }
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memproses permintaan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="auth-modal-title"
              className="font-display text-xl font-bold text-zinc-950"
            >
              {mode === 'login' ? 'Masuk ke CARISAJI' : 'Daftar Akun Baru'}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {mode === 'login'
                ? 'Masuk untuk menulis ulasan atau mengelola data restoran.'
                : 'Buat akun Pencari Kuliner untuk berbagi ulasan.'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup jendela autentikasi"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Segmented Tabs: Masuk / Daftar */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`rounded-md py-2 text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`rounded-md py-2 text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Daftar
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-fullname"
                className="block text-sm font-medium text-zinc-700"
              >
                Nama Lengkap
              </label>
              <input
                id="auth-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-600 focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-sm font-medium text-zinc-700"
            >
              Alamat Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-sm font-medium text-zinc-700"
            >
              Kata Sandi
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === 'register' ? 'Minimal 6 karakter' : 'Masukkan kata sandi'
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-600 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {loading
              ? 'Memproses...'
              : mode === 'login'
              ? 'Masuk Sekarang'
              : 'Daftar Akun'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-5 border-t border-zinc-200 pt-4">
            <p className="text-xs font-medium text-zinc-500">
              Akses cepat akun contoh (untuk pengujian lokal):
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@carisaji.id', 'admin123')}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <span className="block font-semibold text-zinc-900">
                  Isi Akun Admin
                </span>
                <span className="block text-zinc-500 truncate">
                  admin@carisaji.id
                </span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('rizky.pkp@gmail.com', 'user123')}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <span className="block font-semibold text-zinc-900">
                  Isi Akun Pengguna
                </span>
                <span className="block text-zinc-500 truncate">
                  rizky.pkp@gmail.com
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
