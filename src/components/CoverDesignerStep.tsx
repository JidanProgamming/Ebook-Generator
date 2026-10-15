import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Rotate3d,
  RefreshCw,
  Upload,
  Trash2,
  Sliders,
  Wand2,
  Copy,
  Lightbulb,
  FileText,
} from 'lucide-react';
import { CoverSettings, Ebook } from '../types/index.js';
import { ebookApi } from '../lib/api.js';
import { useToast } from './Toast.js';
import { CoverVisualStyle } from '../server/coverGenerator.js';

interface CoverDesignerStepProps {
  ebook: Ebook;
  onNavigateToExport: () => void;
  onRefreshEbook: () => Promise<void>;
}

interface PromptVariationItem {
  title: string;
  prompt: string;
  style: string;
}

const STYLE_CHIPS = [
  { label: '+ Minimalis Bersih', append: ', minimalist modern style, clean negative space, sophisticated aesthetic' },
  { label: '+ 3D Octane Render', append: ', 3D octane render, floating geometric shapes, soft ambient lighting' },
  { label: '+ Sinematik 8K', append: ', cinematic photographic lighting, dramatic atmosphere, 8k resolution' },
  { label: '+ Abstrak Fluida', append: ', contemporary abstract art, fluid color gradients, modern fine art' },
  { label: '+ Cyberpunk Neon', append: ', futuristic dark cyberpunk, glowing neon cyan and emerald accents' },
  { label: '+ Tanpa Teks', append: ', background illustration only, no text, no letters, no typography' },
];

export const CoverDesignerStep: React.FC<CoverDesignerStepProps> = ({
  ebook,
  onNavigateToExport,
  onRefreshEbook,
}) => {
  const [cover, setCover] = useState<CoverSettings>(() => {
    const existing = ebook.coverSettings || {};
    return {
      template: 'ai_generated',
      title: existing.title || ebook.title,
      subtitle: existing.subtitle !== undefined ? existing.subtitle : (ebook.subtitle || 'Panduan Komprehensif'),
      author: existing.author || 'Penulis',
      tagline: existing.tagline !== undefined ? existing.tagline : 'Edisi Lengkap 2026',
      fontFamily: existing.fontFamily || 'serif',
      alignment: existing.alignment || 'center',
      bgImageUrl: existing.bgImageUrl,
      imagePrompt: existing.imagePrompt || '',
      imageStyle: existing.imageStyle || 'minimalist',
      overlayOpacity: existing.overlayOpacity !== undefined ? existing.overlayOpacity : 0.35,
    };
  });

  // Prompt state - initialized with stored prompt or generated from book info
  const [promptText, setPromptText] = useState<string>(() => {
    if (cover.imagePrompt) return cover.imagePrompt;
    const sub = cover.subtitle ? ` (${cover.subtitle})` : '';
    const tag = cover.tagline ? ` [${cover.tagline}]` : '';
    return `Vertical book cover background artwork for "${cover.title}"${sub}${tag}. Modern artistic concept, elegant composition with generous negative space for title typography, vertical portrait 3:4 aspect ratio, no text, no letters, high aesthetic quality.`;
  });

  const [promptVariations, setPromptVariations] = useState<PromptVariationItem[]>([]);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [is3DView, setIs3DView] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const { showToast } = useToast();

  // Handler: Generate Prompt with AI based on Main Title, Subtitle (optional), Tagline (optional)
  const handleGeneratePromptWithAI = async () => {
    if (!cover.title.trim()) {
      showToast('Judul utama wajib diisi agar AI dapat membuat prompt yang relevan', 'warning');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const res = await ebookApi.generateCoverPrompt(ebook.id, {
        title: cover.title,
        subtitle: cover.subtitle || undefined,
        tagline: cover.tagline || undefined,
        visualStyle: cover.imageStyle || 'minimalist',
      });

      if (res.recommendedPrompt) {
        setPromptText(res.recommendedPrompt);
        setCover((prev) => ({
          ...prev,
          imagePrompt: res.recommendedPrompt,
        }));
      }

      if (res.variations && res.variations.length > 0) {
        setPromptVariations(res.variations);
      }

      showToast('Prompt berhasil dirancang oleh AI berdasarkan judul, subjudul & tagline!', 'success');
    } catch (err: any) {
      console.error('Failed to generate prompt with AI:', err);
      showToast(err.message || 'Gagal membuat prompt dengan AI', 'error');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Handler: Generate Cover Image from Prompt
  const handleGenerateImageFromPrompt = async () => {
    if (!promptText.trim()) {
      showToast('Harap masukkan prompt terlebih dahulu atau gunakan bantuan AI untuk membuatnya', 'warning');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const res = await ebookApi.generateCoverImage(ebook.id, {
        title: cover.title,
        subtitle: cover.subtitle,
        tagline: cover.tagline,
        customPrompt: promptText.trim(),
        visualStyle: (cover.imageStyle as CoverVisualStyle) || 'minimalist',
      });

      setCover((prev) => ({
        ...prev,
        bgImageUrl: res.imageUrl,
        imagePrompt: promptText.trim(),
        imageStyle: res.styleUsed,
        template: 'ai_generated',
      }));

      showToast('Gambar cover berhasil digenerate dari prompt!', 'success');
    } catch (err: any) {
      console.error('Failed to generate cover image:', err);
      showToast(err.message || 'Gagal menghasilkan gambar cover', 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handler: Apply variation to prompt box
  const handleSelectVariation = (variation: PromptVariationItem) => {
    setPromptText(variation.prompt);
    setCover((prev) => ({
      ...prev,
      imagePrompt: variation.prompt,
      imageStyle: variation.style || prev.imageStyle,
    }));
    showToast(`Konsep "${variation.title}" diterapkan ke kotak prompt`, 'info');
  };

  // Handler: Append style booster chip to prompt
  const handleAppendChip = (chipText: string) => {
    setPromptText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}${chipText}` : chipText.replace(/^,\s*/, '');
    });
  };

  // Handler: Custom image upload (fallback / manual preference)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (PNG, JPG, WebP)', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCover((prev) => ({
        ...prev,
        bgImageUrl: result,
      }));
      showToast('Gambar kustom berhasil diunggah', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCover((prev) => ({
      ...prev,
      bgImageUrl: undefined,
    }));
    showToast('Gambar cover dihapus', 'info');
  };

  const handleSaveCover = async () => {
    setSaving(true);
    try {
      await ebookApi.update(ebook.id, {
        coverSettings: {
          ...cover,
          imagePrompt: promptText,
        },
        status: 'ready_to_export',
      });
      showToast('Desain cover berhasil disimpan!', 'success');
      await onRefreshEbook();
      onNavigateToExport();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan cover', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            Langkah 5 dari 6
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Desainer Cover Ebook AI
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Generate gambar cover menggunakan prompt, dengan bantuan AI yang otomatis merancang prompt berdasarkan judul utama, subjudul, dan tagline buku.
          </p>
        </div>

        <button
          onClick={handleSaveCover}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all disabled:opacity-50 w-full sm:w-auto shrink-0 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          Simpan & Lanjut ke Ekspor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: AI Prompt Generator, Prompt Box & Typography (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: BANTUAN AI UNTUK MEMBUAT PROMPT GAMBAR COVER */}
          <div className="bg-linear-to-br from-indigo-50/70 via-blue-50/40 to-white rounded-2xl border border-blue-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bantuan AI: Pembuat Prompt Gambar
                  </h3>
                  <p className="text-xs text-slate-500">
                    AI merumuskan prompt visual berdasarkan judul, subjudul & tagline
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGeneratePromptWithAI}
                disabled={isGeneratingPrompt}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all disabled:opacity-60 cursor-pointer shrink-0"
              >
                {isGeneratingPrompt ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Merancang Prompt AI...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Buat Prompt dengan AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Context Badge Summary */}
            <div className="bg-white/80 rounded-xl p-3 border border-blue-100/80 text-xs space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Dasar Pembentukan Prompt AI:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Judul Utama:</span>
                  <span className="font-semibold text-slate-800 line-clamp-1">{cover.title || ebook.title}</span>
                </div>
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Subjudul:</span>
                  <span className="font-semibold text-slate-800 line-clamp-1">{cover.subtitle || '(Tidak ada)'}</span>
                </div>
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Tagline/Badge:</span>
                  <span className="font-semibold text-slate-800 line-clamp-1">{cover.tagline || '(Tidak ada)'}</span>
                </div>
              </div>
            </div>

            {/* Prompt Variations (If Generated by AI) */}
            {promptVariations.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Pilih Variasi Konsep Visual AI (Klik untuk Terapkan):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {promptVariations.map((v, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectVariation(v)}
                      className="p-2.5 rounded-xl border border-blue-200/70 bg-white hover:bg-blue-50/60 hover:border-blue-400 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <span className="text-[11px] font-bold text-blue-900 line-clamp-1 block group-hover:text-blue-600">
                        {v.title}
                      </span>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-tight">
                        {v.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: KOTAK PROMPT & GENERATE GAMBAR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Prompt Gambar Cover <span className="text-slate-400 font-normal lowercase">(bisa diedit)</span>
              </label>

              {cover.bgImageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Gambar
                </button>
              )}
            </div>

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Masukkan prompt gambar cover di sini, atau klik tombol 'Buat Prompt dengan AI' di atas untuk merancangnya secara otomatis..."
                className="w-full p-3.5 text-xs font-mono text-slate-800 bg-slate-50/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none leading-relaxed transition-all resize-none"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-sans pointer-events-none">
                {promptText.length} karakter
              </span>
            </div>

            {/* Quick Style Booster Chips */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Sisipkan Pengaya Visual Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAppendChip(chip.append)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Button: Generate Image from Prompt */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleGenerateImageFromPrompt}
                disabled={isGeneratingImage || !promptText.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-60 cursor-pointer"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Membuat Gambar dari Prompt...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{cover.bgImageUrl ? 'Generate Ulang Gambar dari Prompt' : 'Generate Gambar Cover dari Prompt'}</span>
                  </>
                )}
              </button>

              <label className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Unggah Gambar</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Overlay Darkness / Readability Slider (if image exists) */}
            {cover.bgImageUrl && (
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    Kontras Gelap Teks (Overlay)
                  </span>
                  <span className="font-mono text-slate-500">
                    {Math.round((cover.overlayOpacity ?? 0.35) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.85"
                  step="0.05"
                  value={cover.overlayOpacity ?? 0.35}
                  onChange={(e) =>
                    setCover({ ...cover, overlayOpacity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  Geser untuk memastikan judul dan teks terlihat tajam dan mudah dibaca di atas gambar latar.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 3: TEXT CONTENT (Judul Utama, Subjudul, Tagline/Badge, Penulis) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-blue-600" />
              Teks Sampul Buku
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Judul Utama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cover.title}
                onChange={(e) => setCover({ ...cover, title: e.target.value })}
                placeholder="Judul buku Anda..."
                className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Subjudul <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={cover.subtitle || ''}
                  onChange={(e) => setCover({ ...cover, subtitle: e.target.value })}
                  placeholder="Penjelasan nilai buku..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Penulis / Brand
                </label>
                <input
                  type="text"
                  value={cover.author}
                  onChange={(e) => setCover({ ...cover, author: e.target.value })}
                  placeholder="Nama Penulis..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tagline / Badge Edisi <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={cover.tagline || ''}
                onChange={(e) => setCover({ ...cover, tagline: e.target.value })}
                placeholder="Contoh: Edisi Lengkap 2026 atau Panduan Praktis Kreator"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* SECTION 4: FONT STYLE & TEXT ALIGNMENT (PRESERVED) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-blue-600" />
              Tipografi & Perataan Teks
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Font Family Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Gaya Font
                </label>
                <select
                  value={cover.fontFamily}
                  onChange={(e) => setCover({ ...cover, fontFamily: e.target.value as any })}
                  className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="serif">Serif (Elegan, Sastra & Buku Klasik)</option>
                  <option value="sans">Sans-serif (Modern, Bersih & Profesional)</option>
                  <option value="display">Display (Tebal, Tegas & Menonjol)</option>
                  <option value="mono">Monospace (Teknis, IT & Digital)</option>
                </select>
              </div>

              {/* Text Alignment Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Perataan Teks
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCover({ ...cover, alignment: 'left' })}
                    className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      cover.alignment === 'left'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Kiri</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCover({ ...cover, alignment: 'center' })}
                    className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      cover.alignment === 'center'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                    <span>Tengah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCover({ ...cover, alignment: 'right' })}
                    className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      cover.alignment === 'right'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                    <span>Kanan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live High-Fidelity Cover Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-center">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-700">Pratinjau Sampul Nyata</span>
              <button
                type="button"
                onClick={() => setIs3DView(!is3DView)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Rotate3d className="w-3.5 h-3.5" />
                {is3DView ? 'Tampilan 2D Datar' : 'Tampilan 3D Mockup'}
              </button>
            </div>

            {/* Mockup Canvas */}
            <div className="flex items-center justify-center p-4 min-h-[480px] bg-slate-100 rounded-xl overflow-hidden">
              <div
                className={`w-[260px] sm:w-[285px] h-[390px] sm:h-[430px] rounded-lg p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden select-none bg-slate-900 text-white ${
                  is3DView
                    ? 'transform perspective-[900px] rotate-y-[-18deg] rotate-x-[6deg] shadow-[-20px_25px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/20'
                    : ''
                }`}
                style={{
                  textAlign: cover.alignment,
                }}
              >
                {/* Background Cover Image or Default Stylized Gradient */}
                {cover.bgImageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                    style={{ backgroundImage: `url(${cover.bgImageUrl})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-b from-slate-900 via-indigo-950 to-slate-950 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                  </div>
                )}

                {/* Overlay layer for readable text contrast */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={{
                    backgroundColor: `rgba(0, 0, 0, ${cover.overlayOpacity ?? 0.35})`,
                  }}
                />

                {/* Decorative border frame */}
                <div className="absolute inset-2 border border-white/25 pointer-events-none rounded" />

                {/* Spine shadow for 3D mockup */}
                {is3DView && (
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-linear-to-r from-black/60 to-transparent pointer-events-none" />
                )}

                {/* Top Badge: Tagline / Edition (Optional) */}
                <div className="z-10">
                  {cover.tagline ? (
                    <span
                      className="inline-block text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded backdrop-blur-xs shadow-xs border border-white/20 bg-black/40 text-white"
                    >
                      {cover.tagline}
                    </span>
                  ) : (
                    <span className="inline-block text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded text-white/70">
                      EDISI DIGITAL
                    </span>
                  )}
                </div>

                {/* Title & Subtitle in Center */}
                <div className="z-10 my-auto py-4">
                  <h3
                    className={`leading-tight drop-shadow-md text-white ${
                      cover.fontFamily === 'serif'
                        ? 'font-serif text-xl sm:text-2xl font-bold tracking-tight'
                        : cover.fontFamily === 'mono'
                        ? 'font-mono text-lg font-bold'
                        : cover.fontFamily === 'display'
                        ? 'font-black text-xl sm:text-2xl uppercase tracking-tight'
                        : 'font-sans text-xl sm:text-2xl font-extrabold'
                    }`}
                  >
                    {cover.title || ebook.title}
                  </h3>

                  {cover.subtitle && (
                    <p className="text-xs text-white/90 mt-2 font-light italic leading-snug drop-shadow-sm">
                      {cover.subtitle}
                    </p>
                  )}
                </div>

                {/* Bottom Author & Stamp */}
                <div className="z-10 pt-3 border-t border-white/25">
                  <p className="text-xs font-bold tracking-wide drop-shadow-xs">
                    {cover.author || 'Penulis'}
                  </p>
                  <p className="text-[9px] text-white/75 mt-0.5">
                    Diterbitkan Secara Digital
                  </p>
                </div>
              </div>
            </div>

            {/* Hint & Status */}
            <div className="mt-3 text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[11px] text-slate-600 flex items-start gap-1.5">
                <span className="text-blue-600 font-bold shrink-0">ℹ</span>
                <span>
                  {cover.bgImageUrl
                    ? 'Gambar cover telah aktif dan akan otomatis disertakan sebagai halaman muka di file PDF dan EPUB.'
                    : 'Gunakan bantuan AI di atas untuk membuat prompt dari judul dan subjudul, lalu klik "Generate Gambar Cover dari Prompt".'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
