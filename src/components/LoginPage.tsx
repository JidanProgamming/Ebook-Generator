import React, { useState } from 'react';
import {
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
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { authApi } from '../lib/api.js';
import { UserProfile } from '../types/index.js';
import { useToast } from './Toast.js';

interface LoginPageProps {
  initialMode?: 'login' | 'register' | 'forgot';
  onLoginSuccess: (user: UserProfile) => void;
  onNavigateBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialMode = 'login',
  onLoginSuccess,
  onNavigateBack,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { showToast } = useToast();

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
        onLoginSuccess(res.user);
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
        onLoginSuccess(res.user);
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
        setSuccessMsg(res.message || 'Kata sandi berhasil diubah! Silakan masuk dengan kata sandi baru.');
        showToast('Kata sandi berhasil diperbarui!', 'success');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat otentikasi. Silakan periksa kembali.');
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
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Gagal masuk akun demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-100/40 rounded-full blur-2xl pointer-events-none"></div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Left Side: Brand & Benefits Presentation */}
        <div className="md:col-span-5 bg-linear-to-br from-blue-700 via-blue-800 to-indigo-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>

          <div className="relative z-10">
            <button
              type="button"
              onClick={onNavigateBack}
              className="inline-flex items-center gap-2 text-xs font-medium text-blue-200 hover:text-white transition-colors mb-8 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-inner">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight">Ebook Generator AI</span>
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-white leading-snug mb-3">
              Kreativitas Menulis Kini Lebih Cepat & Terstruktur.
            </h3>
            <p className="text-sm text-blue-100/90 leading-relaxed mb-6">
              Platform all-in-one untuk merancang naskah berkualitas tinggi dari ide awal hingga ekspor PDF & EPUB profesional.
            </p>

            <div className="space-y-3 text-xs text-blue-100/90">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Generator Bab Konten AI Cerdas & Bebas Repetisi</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Desainer Cover Ebook Artistik Berbasis AI Prompt</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Dukungan Ekspor Multi-Format: PDF, DOCX, & EPUB</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 mt-6 border-t border-white/10 flex items-center gap-2 text-xs text-blue-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Penyimpanan aman & privasi naskah terjaga</span>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mode === 'login'
                ? 'Selamat Datang Kembali'
                : mode === 'register'
                ? 'Daftar Akun Baru'
                : 'Atur Ulang Kata Sandi'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {mode === 'login'
                ? 'Masukkan kredensial Anda untuk melanjutkan proyek ebook.'
                : mode === 'register'
                ? 'Lengkapi data berikut untuk mulai membuat ebook hari ini.'
                : 'Masukkan email dan buat kata sandi baru untuk akun Anda.'}
            </p>
          </div>

          {/* Quick Demo Access Button */}
          <div className="mb-6 p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 flex items-center justify-between gap-3">
            <div className="text-left text-xs">
              <p className="font-semibold text-blue-900">Ingin eksplorasi instan tanpa mendaftar?</p>
              <p className="text-blue-700 text-[11px]">Gunakan akun demo dengan 1-klik</p>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              Coba Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                mode === 'register'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                mode === 'forgot'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reset Sandi
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in duration-150">
              <span className="font-bold text-red-600 shrink-0">✕</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Rian Pratama"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all"
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
                  placeholder={
                    mode === 'register' || mode === 'forgot'
                      ? 'Minimal 6 karakter'
                      : 'Masukkan kata sandi'
                  }
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {(mode === 'register' || mode === 'forgot') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ulangi Kata Sandi
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi yang sama"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

          {/* Footer note */}
          <div className="mt-6 text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <p>
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Daftar akun gratis
                </button>
              </p>
            ) : (
              <p>
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Masuk di sini
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
