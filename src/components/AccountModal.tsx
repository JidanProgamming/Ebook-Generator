import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Server,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Cpu,
  Sliders,
  Globe,
  Cloud,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { AIProvider, AISettings, UserProfile } from '../types/index.js';
import { settingsApi } from '../lib/api.js';
import { useToast } from './Toast.js';

interface AccountModalProps {
  isOpen: boolean;
  user: UserProfile;
  totalEbooks: number;
  initialTab?: 'profile' | 'ai_settings' | 'vercel';
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  user,
  totalEbooks,
  initialTab = 'profile',
  onClose,
  onSettingsSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai_settings' | 'vercel'>(initialTab);

  // AI Configuration State
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [model, setModel] = useState('gemini-3.8-flash');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);

  // Loading states
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; modelUsed?: string } | null>(null);

  const [copiedEnv, setCopiedEnv] = useState<string | null>(null);

  const { showToast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEnv(label);
    showToast(`${label} disalin ke clipboard!`, 'info');
    setTimeout(() => setCopiedEnv(null), 2500);
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoadingConfig(true);
    setTestResult(null);
    try {
      const data = await settingsApi.getAISettings();
      setProvider((data.provider as AIProvider) || 'gemini');
      setModel(data.model || 'gemini-3.8-flash');
      setBaseUrl(data.baseUrl || '');
      setHasStoredKey(data.hasCustomApiKey);
      if (data.cachedKey) {
        setApiKey(data.cachedKey);
      } else {
        setApiKey('');
      }
    } catch (err) {
      console.error('Failed to load AI settings', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Provider change preset helpers
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setTestResult(null);

    if (newProvider === 'gemini') {
      setModel('gemini-3.8-flash');
      setBaseUrl('');
    } else if (newProvider === 'openrouter') {
      setModel('google/gemini-2.0-flash-001');
      setBaseUrl('https://openrouter.ai/api/v1');
    } else if (newProvider === 'opencode') {
      setModel('opencode-v1');
      setBaseUrl('https://api.opencode.ai/v1');
    } else if (newProvider === 'codex') {
      setModel('code-davinci-002');
      setBaseUrl('https://api.openai.com/v1');
    } else if (newProvider === 'custom') {
      setModel('gpt-4o-mini');
      setBaseUrl('https://api.openai.com/v1');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    try {
      const res = await settingsApi.testConnection({
        provider,
        model,
        baseUrl: baseUrl.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
      });
      setTestResult(res);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Koneksi gagal diverifikasi';
      setTestResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);

    try {
      await settingsApi.updateAISettings({
        provider,
        model: model.trim(),
        baseUrl: baseUrl.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
      });

      showToast('Konfigurasi API AI berhasil disimpan!', 'success');
      setHasStoredKey(!!apiKey || hasStoredKey);
      setApiKey('');
      if (onSettingsSaved) onSettingsSaved();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan konfigurasi AI', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">{user.displayName}</h3>
              <p className="text-[11px] text-slate-500">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-4 pt-2 gap-2 text-xs font-semibold shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            Profil Akun
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_settings')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ai_settings'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Custom API & AI
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vercel')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'vercel'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Deploy Vercel
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs">
          {activeTab === 'profile' ? (
            /* TAB 1: User Profile & Metrics */
            <div className="space-y-4">
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" /> Total Proyek Ebook
                  </span>
                  <span className="font-bold text-slate-900">{totalEbooks} Buku</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> Tanggal Bergabung
                  </span>
                  <span className="font-semibold text-slate-700">
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Status Akses
                  </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Aktif & Terverifikasi
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900 leading-relaxed">
                <span className="font-bold">Keamanan & Privasi:</span> Semua draf ebook, outline, dan naskah Anda disimpan secara privat dalam database akun Anda.
              </div>
            </div>
          ) : activeTab === 'ai_settings' ? (
            /* TAB 2: Custom API & Multi-Provider Settings */
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {loadingConfig ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Memuat pengaturan AI...
                </div>
              ) : (
                <>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="font-bold text-slate-800 block mb-1">
                      Kustomisasi Model & API Sendiri
                    </span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Pilih penyedia AI default (Gemini) atau hubungkan model Anda sendiri melalui OpenRouter, OpenCode, Codex, maupun endpoint OpenAI-compatible lokal/cloud.
                    </p>
                  </div>

                  {/* Provider Radio Pills */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                      Penyedia AI (Provider)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'gemini', name: 'Google Gemini', desc: 'Bawaan AI Studio' },
                        { id: 'openrouter', name: 'OpenRouter', desc: 'Multi-Model Hub' },
                        { id: 'opencode', name: 'OpenCode', desc: 'Open Coding AI' },
                        { id: 'codex', name: 'Codex / OpenAI', desc: 'OpenAI Protocol' },
                        { id: 'custom', name: 'Custom Endpoint', desc: 'Ollama / vLLM / Proxy' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleProviderChange(item.id as AIProvider)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            provider === item.id
                              ? 'bg-blue-50/80 border-blue-600 text-blue-950 font-bold ring-1 ring-blue-500/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold text-xs truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Provider Info Banner */}
                  {provider === 'gemini' && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Aktif otomatis:</span> Google Gemini terhubung secara server-side melalui AI Studio Build. Anda tidak perlu memasukkan API key kecuali ingin menggunakan kuota custom.
                      </div>
                    </div>
                  )}

                  {/* Base URL (if not gemini) */}
                  {provider !== 'gemini' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider">
                        Endpoint Base URL
                      </label>
                      <input
                        type="url"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder={
                          provider === 'openrouter'
                            ? 'https://openrouter.ai/api/v1'
                            : 'https://api.openai.com/v1 atau http://localhost:11434/v1'
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 font-mono text-[11px]"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Alamat URL endpoint API yang mendukung standar OpenAI Chat Completions.
                      </span>
                    </div>
                  )}

                  {/* Model ID Field */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider">
                      Nama Model (Model ID)
                    </label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={
                        provider === 'gemini'
                          ? 'gemini-3.8-flash'
                          : provider === 'openrouter'
                          ? 'google/gemini-2.0-flash-001'
                          : 'gpt-4o-mini'
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 font-mono text-[11px]"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[10px] text-slate-400">Pilihan cepat:</span>
                      {provider === 'gemini' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModel('gemini-3.8-flash')}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                          >
                            gemini-3.8-flash
                          </button>
                          <button
                            type="button"
                            onClick={() => setModel('gemini-3.1-pro-preview')}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                          >
                            gemini-3.1-pro-preview
                          </button>
                        </>
                      )}
                      {provider === 'openrouter' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModel('google/gemini-2.0-flash-001')}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                          >
                            gemini-flash
                          </button>
                          <button
                            type="button"
                            onClick={() => setModel('meta-llama/llama-3.3-70b-instruct')}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                          >
                            llama-3.3-70b
                          </button>
                          <button
                            type="button"
                            onClick={() => setModel('deepseek/deepseek-chat')}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                          >
                            deepseek-chat
                          </button>
                        </>
                      )}
                      {provider === 'codex' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModel('code-davinci-002')}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                          >
                            code-davinci-002
                          </button>
                          <button
                            type="button"
                            onClick={() => setModel('gpt-4o-mini')}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                          >
                            gpt-4o-mini
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* API Key / Token input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                        {provider === 'gemini' ? 'Custom Gemini API Key (Opsional)' : 'API Key / Bearer Token'}
                      </label>
                      {hasStoredKey && (
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Key tersimpan di server
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={showKeyText ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={
                          hasStoredKey
                            ? '•••••••••••••••••••••••• (Isi untuk mengganti)'
                            : provider === 'openrouter'
                            ? 'sk-or-v1-...'
                            : 'Masukkan API Key Anda...'
                        }
                        className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyText(!showKeyText)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Disimpan secara aman di backend server dan tidak pernah dipaparkan ke client/publik.
                    </span>
                  </div>

                  {/* Test Connection Result Box */}
                  {testResult && (
                    <div
                      className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2.5 ${
                        testResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-red-50 border-red-200 text-red-900'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold block">
                          {testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal:'}
                        </span>
                        <span>{testResult.message}</span>
                        {testResult.modelUsed && (
                          <span className="block mt-0.5 opacity-80 font-mono text-[10px]">
                            Model: {testResult.modelUsed}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="px-3.5 py-2.5 sm:py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {testingConnection ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          Menguji...
                        </>
                      ) : (
                        <>
                          <Server className="w-3.5 h-3.5 text-slate-500" />
                          Uji Koneksi
                        </>
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="px-5 py-2.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                    >
                      {savingConfig ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        'Simpan Konfigurasi AI'
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            /* TAB 3: Vercel Deployment Guide */
            <div className="space-y-4">
              <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm">Status Deploy Vercel: Siap Digunakan</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Website ini telah dikonfigurasi penuh dengan arsitektur <strong>Vercel Serverless Functions</strong> (<code className="text-emerald-300 font-mono text-[10px]">api/index.ts</code>) dan frontend Vite (<code className="text-emerald-300 font-mono text-[10px]">vercel.json</code>).
                </p>
              </div>

              {/* Readiness Checklist */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Komponen Vercel Terpasang:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>vercel.json</strong> (Konfigurasi routing)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>api/index.ts</strong> (Serverless API Handler)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Custom API Sync</strong> (LocalStorage + Headers)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Zero-Quota Fallback</strong> (Cover Art Generator)</span>
                  </div>
                </div>
              </div>

              {/* Steps to Deploy */}
              <div className="space-y-2.5">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Langkah Deploy ke Vercel:
                </div>

                {/* Step 1 */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
                    Hubungkan ke Vercel
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Push repositori ini ke GitHub/GitLab, lalu pilih <strong>Add New &gt; Project</strong> di dashboard Vercel Anda.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
                    Environment Variables di Vercel (Opsional / Rekomendasi)
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Di menu <em>Settings &gt; Environment Variables</em> Vercel, tambahkan variabel berikut:
                  </p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                      <div>
                        <span className="text-blue-700 font-semibold">GEMINI_API_KEY</span>
                        <span className="text-slate-400 text-[10px] block font-sans">Kunci Google AI Studio untuk generate outline & cover</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('GEMINI_API_KEY', 'Nama ENV')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-700 flex items-center gap-1"
                      >
                        {copiedEnv === 'Nama ENV' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        Salin
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                      <div>
                        <span className="text-purple-700 font-semibold">OPENROUTER_API_KEY</span>
                        <span className="text-slate-400 text-[10px] block font-sans">Opsional: Jika ingin model DeepSeek, Llama, Claude</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('OPENROUTER_API_KEY', 'OpenRouter ENV')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-700 flex items-center gap-1"
                      >
                        {copiedEnv === 'OpenRouter ENV' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        Salin
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">3</span>
                    Deploy via CLI (Terminal)
                  </div>
                  <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] flex items-center justify-between">
                    <code>npx vercel --prod</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('npx vercel --prod', 'Perintah CLI')}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copiedEnv === 'Perintah CLI' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Fleksibilitas Custom API:</strong> Pengguna aplikasi dapat langsung memasukkan API key mereka sendiri di tab <em>"Custom API & AI"</em>. Pengaturan disimpan di browser pengguna dan otomatis dikirimkan ke serverless function Vercel pada setiap pembuatan buku!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
