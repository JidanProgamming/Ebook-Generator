import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Loader2,
  Lightbulb,
  Check,
} from 'lucide-react';
import { Ebook, EbookLength, EbookTone } from '../types/index.js';
import { ebookApi } from '../lib/api.js';
import { useToast } from './Toast.js';

interface IdeaInputStepProps {
  initialEbook?: Ebook | null;
  onOutlineGenerated: (ebook: Ebook) => void;
  onCancel: () => void;
}

const TEMPLATE_IDEAS = [
  {
    label: 'Kreator Konten & AI',
    idea: 'Panduan praktis bagi kreator digital untuk memanfaatkan AI dalam riset ide, penulisan skrip, dan produksi konten tanpa kehilangan keaslian karya.',
    target: 'Content creator pemula hingga menengah, podcaster, penulis',
    purpose: 'Membangun sistem kerja kreatif harian yang menghemat waktu 3x lipat',
    tone: 'santai' as EbookTone,
  },
  {
    label: 'Mindset Produktivitas',
    idea: 'Strategi mengalahkan prokrastinasi dan membangun fokus mendalam (deep work) di era distraksi notifikasi smartphone.',
    target: 'Pekerja profesional, freelancer, mahasiswa tingkat akhir',
    purpose: 'Meningkatkan output kerja berkualitas tanpa mengalami burnout',
    tone: 'profesional' as EbookTone,
  },
  {
    label: 'Bisnis & UMKM Digital',
    idea: 'Langkah praktis mendirikan bisnis digital dari rumah bermodalkan smartphone dan riset pasar valid.',
    target: 'Calon wirausahawan, ibu rumah tangga, pegiat UMKM',
    purpose: 'Memberikan roadmap langkah demi langkah dari validasi produk hingga penjualan pertama',
    tone: 'persuasif' as EbookTone,
  },
  {
    label: 'Pemrograman Pemula',
    idea: 'Dasar-dasar logika pemrograman dan Python praktis dengan studi kasus otomasi tugas harian.',
    target: 'Pemula non-IT, mahasiswa, profesional yang ingin belajar coding',
    purpose: 'Memahami konsep logika coding tanpa rasa takut dan langsung membuat proyek kecil pertama',
    tone: 'akademik' as EbookTone,
  },
];

export const IdeaInputStep: React.FC<IdeaInputStepProps> = ({
  initialEbook,
  onOutlineGenerated,
  onCancel,
}) => {
  const [idea, setIdea] = useState(initialEbook?.idea || '');
  const [title, setTitle] = useState(initialEbook?.title || '');
  const [targetAudience, setTargetAudience] = useState(initialEbook?.targetAudience || '');
  const [purpose, setPurpose] = useState(initialEbook?.purpose || '');
  const [language, setLanguage] = useState(initialEbook?.language || 'Bahasa Indonesia');
  const [tone, setTone] = useState<EbookTone>(initialEbook?.tone || 'profesional');
  const [length, setLength] = useState<EbookLength>(initialEbook?.length || 'sedang');
  const [chapterCount, setChapterCount] = useState<number>(initialEbook?.chapterCount || 5);
  const [instructions, setInstructions] = useState(initialEbook?.instructions || '');

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Merancang Outline dengan AI...');

  const { showToast } = useToast();

  const applyTemplate = (tpl: typeof TEMPLATE_IDEAS[0]) => {
    setIdea(tpl.idea);
    setTargetAudience(tpl.target);
    setPurpose(tpl.purpose);
    setTone(tpl.tone);
    showToast(`Template "${tpl.label}" diterapkan`, 'info');
  };

  const handleLengthChange = (val: EbookLength) => {
    setLength(val);
    if (val === 'singkat') setChapterCount(4);
    else if (val === 'sedang') setChapterCount(6);
    else if (val === 'mendalam') setChapterCount(9);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      showToast('Ide atau topik ebook wajib diisi', 'error');
      return;
    }

    setLoading(true);
    setLoadingMessage('Menyimpan draf brief ebook...');

    try {
      let activeBook: Ebook;

      if (initialEbook) {
        activeBook = await ebookApi.update(initialEbook.id, {
          title: title.trim() || initialEbook.title,
          idea,
          targetAudience,
          purpose,
          language,
          tone,
          length,
          chapterCount,
          instructions,
        });
      } else {
        activeBook = await ebookApi.create({
          title: title.trim() || undefined,
          idea,
          targetAudience,
          purpose,
          language,
          tone,
          length,
          chapterCount,
          instructions,
        });
      }

      setLoadingMessage('AI sedang menyusun bab, subbab, dan konsep buku...');
      const outlineRes = await ebookApi.generateOutline(activeBook.id, instructions);

      showToast('Outline berhasil dihasilkan oleh AI!', 'success');
      onOutlineGenerated(outlineRes.ebook);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghasilkan outline', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          Langkah 1 dari 6
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Masukkan Ide & Brief Ebook Anda
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Semakin jelas konteks yang Anda berikan, semakin relevan dan tajam outline buku yang akan dirumuskan oleh AI.
        </p>
      </div>

      {/* Quick Inspiration Chips */}
      <div className="mb-8 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Butuh Inspirasi Cepat? Pilih Salah Satu Topik Populer:
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_IDEAS.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-colors"
            >
              + {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Field 1: Ide / Topik (Wajib) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Ide atau Topik Ebook <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Jelaskan gagasan utama buku Anda secara bebas. Contoh: Panduan komprehensif bagi pemula untuk memulai investasi reksadana dan saham secara aman dengan modal terjangkau..."
            className="w-full p-3.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Ceritakan topik utama, latar belakang masalah yang ingin diselesaikan, atau poin unik yang ingin disampaikan.
          </p>
        </div>

        {/* Field 2: Judul Ebook (Opsional) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Judul Ebook <span className="text-slate-400 font-normal lowercase">(opsional - AI dapat menyarankannya jika dikosongkan)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Menjadi Finansial Cerdas Sebelum 30 Tahun"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* 2-Column: Target Pembaca & Tujuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Pembaca
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Contoh: Fresh graduate, karyawan muda, pemula"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Tujuan Ebook
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Contoh: Memberikan panduan aksi praktis langkah demi langkah"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>

        {/* 3-Column: Bahasa, Gaya Bahasa (Tone), Kedalaman/Panjang */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Bahasa Penulisan
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="English">English</option>
              <option value="Bahasa Melayu">Bahasa Melayu</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Gaya Bahasa (Tone)
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as EbookTone)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="santai">Santai & Menyenangkan</option>
              <option value="profesional">Profesional & Berbobot</option>
              <option value="akademik">Akademik & Formal</option>
              <option value="storytelling">Storytelling & Inspiratif</option>
              <option value="persuasif">Persuasif & Menjual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Panjang Ebook
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {(['singkat', 'sedang', 'mendalam'] as EbookLength[]).map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => handleLengthChange(len)}
                  className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    length === len ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jumlah Bab & Instruksi Tambahan */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Jumlah Bab
            </label>
            <input
              type="number"
              min={3}
              max={12}
              value={chapterCount}
              onChange={(e) => setChapterCount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-center font-bold"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Instruksi Tambahan <span className="text-slate-400 font-normal lowercase">(opsional)</span>
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Contoh: Sertakan contoh studi kasus nyata dan daftar cek di setiap akhir bab..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-center"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingMessage}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Outline dengan AI
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
