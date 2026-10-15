import React from 'react';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers,
  Palette,
  Download,
  ShieldCheck,
  Zap,
  Users,
  Feather,
  ChevronRight,
} from 'lucide-react';

interface LandingPageProps {
  onStartCreating: () => void;
  onOpenDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartCreating, onOpenDemo }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-200/80 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Platform AI Ebook Generator Profesional #1
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Ubah Ide Sederhana Menjadi <br className="hidden sm:inline" />
            <span className="text-blue-600 bg-clip-text">Ebook Profesional Siap Terbit</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Dari input brief, outline terstruktur, penulisan konten per bab dengan AI cerdas,
            hingga desain cover dan ekspor instan ke format PDF, DOCX, & EPUB.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onStartCreating}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group"
            >
              Mulai Buat Ebook Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-sm sm:text-base border border-slate-200 transition-all flex items-center justify-center gap-2"
            >
              Lihat Contoh Ebook & Demo
            </button>
          </div>

          {/* Guarantees */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tanpa setup rumit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ekspor nyata PDF & DOCX
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Autosave & Riwayat Terjaga
            </span>
          </div>

          {/* Product UI Mockup Preview */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-slate-200/90 bg-slate-900/5 p-2 sm:p-3 shadow-xl">
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs text-left">
              {/* App Mockup Top bar */}
              <div className="h-10 bg-slate-100/90 border-b border-slate-200 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="ml-2 text-xs font-medium text-slate-500 hidden sm:inline">
                    Ebook Generator — Workspace Editor
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  Tersimpan otomatis
                </div>
              </div>

              {/* Mockup Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[340px]">
                {/* Left navigation */}
                <div className="md:col-span-3 border-r border-slate-200 p-3 bg-slate-50/50 space-y-1.5 hidden md:block text-xs">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Daftar Bab (5)
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200/60">
                    Bab 1: Menemukan Ide Segar
                  </div>
                  <div className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
                    Bab 2: Menulis Hook Kuat
                  </div>
                  <div className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
                    Bab 3: Alur Kerja Harian
                  </div>
                  <div className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
                    Bab 4: Monetisasi & Distribusi
                  </div>
                </div>

                {/* Center Editor */}
                <div className="md:col-span-6 p-5 sm:p-6 space-y-3">
                  <div className="h-6 w-3/4 bg-slate-200 rounded font-bold text-slate-800 flex items-center px-2 text-xs">
                    Bab 1: Menemukan Ide yang Tak Pernah Habis
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                    <p className="bg-slate-50 p-2 rounded border border-slate-100">
                      Kreator konten sering kali menghadapi tantangan terbesar yang sama: kehabisan topik saat harus memproduksi materi berkualitas secara konsisten...
                    </p>
                    <div className="p-2.5 bg-blue-50/60 rounded border-l-2 border-blue-600 text-blue-900 italic text-[11px]">
                      "Kreator hebat bukan mereka yang punya ide paling jenius, melainkan mereka yang paling konsisten menjawab rasa penasaran audiensnya."
                    </div>
                    <p className="text-slate-500">
                      Dalam bab ini, kita membedah framework 3 langkah menghasilkan bank ide konten...
                    </p>
                  </div>
                </div>

                {/* Right AI Assistant Panel */}
                <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-slate-200 p-3 bg-slate-50/80 text-xs space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    AI Writing Assistant
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 cursor-pointer shadow-2xs">
                      ✨ Perbaiki Gaya Tulisan
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 cursor-pointer shadow-2xs">
                      ✍️ Koreksi Tata Bahasa
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 cursor-pointer shadow-2xs">
                      📈 Perluas & Tambah Contoh
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Workflow Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-600 mb-2">
            Workflow Inti Terintegrasi
          </h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            5 Langkah Mudah dari Konsep hingga File Jadi
          </h3>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Alur kerja yang dirancang untuk menjaga fokus dan efisiensi Anda dalam membuat karya terbaik.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'Input Ide & Brief',
              desc: 'Tentukan topik, target pembaca, tujuan, gaya bahasa, dan jumlah bab yang diinginkan.',
              icon: Feather,
            },
            {
              step: '02',
              title: 'Generate Outline',
              desc: 'AI menyusun judul, konsep, dan bab terstruktur. Anda bebas mengedit dan menyetujui.',
              icon: Layers,
            },
            {
              step: '03',
              title: 'Generate Konten',
              desc: 'Hasilkan naskah bab per bab secara bertahap dengan konteks konsisten dan mendalam.',
              icon: Zap,
            },
            {
              step: '04',
              title: 'Edit & AI Assistant',
              desc: 'Poles naskah di rich editor dengan asisten perbaikan kalimat, grammar, dan autosave.',
              icon: FileText,
            },
            {
              step: '05',
              title: 'Desain Cover & Ekspor',
              desc: 'Pilih template cover dan unduh langsung dalam format PDF siap cetak, DOCX, atau EPUB.',
              icon: Download,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-black text-blue-600/40">{item.step}</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Target Audiences */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Dirancang untuk Siapa Saja yang Ingin Menulis
            </h3>
            <p className="mt-2 text-slate-600 text-sm">
              Membantu berbagai profesi memproduksi aset pengetahuan berkualitas tinggi dalam hitungan menit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Content Creator',
                desc: 'Ubah materi video atau konten media sosial Anda menjadi ebook lead magnet berharga tinggi.',
                badge: 'Lead Magnet & Fans',
              },
              {
                title: 'Pelajar & Mahasiswa',
                desc: 'Susun rangkuman mata kuliah, laporan riset, dan panduan belajar secara runtut dan sistematis.',
                badge: 'Akademik & Studi',
              },
              {
                title: 'Penulis & Ghostwriter',
                desc: 'Hancurkan writer’s block dan percepat draf pertama naskah hingga 5x lebih cepat.',
                badge: 'Produktivitas Penulis',
              },
              {
                title: 'Penjual Produk Digital',
                desc: 'Ciptakan panduan panduan praktis dan ebook komersial yang siap dipasarkan ke ribuan pembeli.',
                badge: 'Monetisasi Digital',
              },
            ].map((aud, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all text-left"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-200 mb-3">
                  {aud.badge}
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2">{aud.title}</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{aud.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Export Formats */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
          Format Ekspor Nyata & Kompatibel
        </h3>
        <p className="text-sm text-slate-600 max-w-xl mx-auto mb-10">
          File yang dihasilkan bukan sekadar preview, melainkan dokumen asli siap unduh dan baca di perangkat apa pun.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              format: 'PDF',
              sub: 'Layout Rapi & Cover',
              desc: 'Siap baca di laptop/smartphone dan dibagikan secara profesional.',
              color: 'text-red-600 bg-red-50 border-red-200',
            },
            {
              format: 'DOCX',
              sub: 'Microsoft Word',
              desc: 'Mudah diedit lebih lanjut dengan hierarki Heading standar.',
              color: 'text-blue-600 bg-blue-50 border-blue-200',
            },
            {
              format: 'EPUB',
              sub: 'Standard E-Reader',
              desc: 'Kompatibel dengan Apple Books, Kindle, Kobo, dan Google Play Books.',
              color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            },
            {
              format: 'Markdown',
              sub: 'Struktur Bersih (.md)',
              desc: 'Ideal untuk dokumentasi teknis, backup teks, atau import ke Notion.',
              color: 'text-purple-600 bg-purple-50 border-purple-200',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs text-left"
            >
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${item.color} mb-3`}>
                {item.format}
              </span>
              <h5 className="font-bold text-slate-900 text-sm mb-1">{item.sub}</h5>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-linear-to-r from-blue-700 to-indigo-700 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Siap Mewujudkan Ebook Pertama Anda?
            </h3>
            <p className="text-blue-100 text-sm sm:text-base mb-6">
              Mulai sekarang tanpa instalasi. Nikmati alur kerja terstruktur yang menghemat waktu dan menghasilkan karya berstandar tinggi.
            </p>
            <button
              onClick={onStartCreating}
              className="px-8 py-3.5 rounded-xl bg-white text-blue-800 font-bold text-sm sm:text-base hover:bg-blue-50 shadow-lg transition-all"
            >
              Mulai Buat Ebook Gratis
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <p>© 2026 Ebook Generator. Dirancang untuk kejelasan, produktivitas, dan standar penulisan profesional.</p>
      </footer>
    </div>
  );
};
