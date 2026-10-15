import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { authApi } from '../lib/api.js';
import { UserProfile } from '../types/index.js';
import { useToast } from './Toast.js';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Alamat email wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        if (!cleanPassword) {
          setError('Kata sandi wajib diisi.');
          setLoading(false);
          return;
        }

        const res = await authApi.login(cleanEmail, cleanPassword);
        showToast(`Selamat datang kembali, ${res.user.displayName}!`, 'success');
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          setError('Nama lengkap wajib diisi.');
          setLoading(false);
          return;
        }
        if (cleanPassword.length < 6) {
          setError('Kata sandi minimal 6 karakter.');
          setLoading(false);
          return;
        }
        if (cleanPassword !== confirmPassword.trim()) {
          setError('Konfirmasi kata sandi tidak cocok.');
          setLoading(false);
          return;
        }

        const res = await authApi.register(cleanEmail, cleanPassword, displayName.trim());
        showToast(`Akun berhasil dibuat! Selamat datang, ${res.user.displayName}`, 'success');
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === 'forgot') {
        if (cleanPassword.length < 6) {
          setError('Kata sandi baru minimal 6 karakter.');
          setLoading(false);
          return;
        }
        if (cleanPassword !== confirmPassword.trim()) {
          setError('Konfirmasi kata sandi baru tidak cocok.');
          setLoading(false);
          return;
        }

        const res = await authApi.resetPassword(cleanEmail, cleanPassword);
        setSuccessMsg(res.message || 'Kata sandi berhasil diubah! Silakan masuk.');
        showToast('Kata sandi berhasil diperbarui!', 'success');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat otentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await authApi.login('demo@ebookgenerator.com', 'demo123');
      showToast(`Masuk sebagai ${res.user.displayName}`, 'success');
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal masuk akun demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'login'
                ? 'Masuk ke Ebook Generator'
                : mode === 'register'
                ? 'Buat Akun Baru'
                : 'Atur Ulang Kata Sandi'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {mode === 'login'
                ? 'Kelola dan lanjutkan pembuatan buku Anda dengan aman.'
                : mode === 'register'
                ? 'Mulai buat ebook profesional dengan bantuan AI hari ini.'
                : 'Masukkan email dan kata sandi baru untuk akun Anda.'}
            </p>
          </div>

          {/* Quick Demo Login Banner */}
          <div className="mb-5 p-3.5 bg-blue-50/80 rounded-xl border border-blue-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="text-left text-xs">
              <p className="font-semibold text-blue-900">Mau coba langsung tanpa mendaftar?</p>
              <p className="text-blue-700 text-[11px]">Gunakan akun demo dengan 1-klik</p>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-all shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              Coba Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Baru
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'forgot' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reset Sandi
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <span className="font-bold text-red-600 shrink-0">✕</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Rian Pratama"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  {mode === 'forgot' ? 'Kata Sandi Baru' : 'Kata Sandi'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' || mode === 'forgot' ? 'Minimal 6 karakter' : 'Masukkan kata sandi'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {(mode === 'register' || mode === 'forgot') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ulangi Kata Sandi</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi yang sama"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : mode === 'login' ? (
                'Masuk Sekarang'
              ) : mode === 'register' ? (
                'Buat Akun Saya'
              ) : (
                'Simpan Kata Sandi & Masuk'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
