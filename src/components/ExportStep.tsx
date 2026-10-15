import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Loader2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings2,
} from 'lucide-react';
import { Ebook, EbookExport } from '../types/index.js';
import { downloadEbookFile, ExportOptions } from '../lib/exportUtils.js';
import { ebookApi } from '../lib/api.js';
import { useToast } from './Toast.js';

interface ExportStepProps {
  ebook: Ebook;
  onRefreshEbook: () => Promise<void>;
  onBackToEditor: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({
  ebook,
  onRefreshEbook,
  onBackToEditor,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'epub' | 'markdown'>('pdf');
  const [options, setOptions] = useState<ExportOptions>({
    includeCover: true,
    includeToc: true,
    pageSize: 'a4',
    includePageNumbers: true,
  });

  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<EbookExport[]>([]);
  const [previewChapterIdx, setPreviewChapterIdx] = useState(0);

  const { showToast } = useToast();

  const chapters = (ebook.chapters || []).sort((a, b) => a.position - b.position);
  const activePreviewChapter = chapters[previewChapterIdx] || chapters[0];

  useEffect(() => {
    loadExports();
  }, [ebook.id]);

  const loadExports = async () => {
    try {
      const history = await ebookApi.getExports(ebook.id);
      setExportHistory(history);
    } catch (err) {
      console.error('Failed to load export history', err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      showToast(`Sedang memproses dokumen ${selectedFormat.toUpperCase()}...`, 'info');
      const { size } = await downloadEbookFile(ebook, selectedFormat, options);

      // Log export record to backend
      await ebookApi.logExport(ebook.id, {
        format: selectedFormat,
        fileSize: size,
        filePath: `${ebook.title}.${selectedFormat}`,
      });

      await ebookApi.update(ebook.id, { status: 'completed' });
      await loadExports();
      await onRefreshEbook();

      showToast(`File ${selectedFormat.toUpperCase()} berhasil diunduh ke perangkat Anda!`, 'success');
    } catch (err: any) {
      console.error('Export error:', err);
      showToast(err.message || 'Gagal mengekspor file', 'error');
    } finally {
      setExporting(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            Langkah 6 dari 6 • Selesai
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Desain Final & Ekspor Ebook
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Periksa pratinjau buku dan unduh naskah dalam format pilihan Anda secara instan.
          </p>
        </div>

        <button
          onClick={onBackToEditor}
          className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all self-start sm:self-center"
        >
          ← Kembali ke Editor Naskah
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Export Configuration & Download (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Format Selection Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-blue-600" />
              Pilih Format Dokumen
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'pdf', title: 'PDF', desc: 'Siap baca & cetak', tag: 'Prioritas Utama', color: 'border-red-200 text-red-600' },
                { id: 'docx', title: 'DOCX', desc: 'Microsoft Word', tag: 'Dapat Diedit', color: 'border-blue-200 text-blue-600' },
                { id: 'epub', title: 'EPUB', desc: 'Apple/Kindle reader', tag: 'Standard E-Reader', color: 'border-emerald-200 text-emerald-600' },
                { id: 'markdown', title: 'Markdown', desc: 'Clean raw text (.md)', tag: 'Backup Teks', color: 'border-purple-200 text-purple-600' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setSelectedFormat(fmt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedFormat === fmt.id
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-extrabold text-slate-900">{fmt.title}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {fmt.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">{fmt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Export Options Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-blue-600" />
              Opsi Tata Letak & Dokumen
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-slate-100">
                <span className="font-semibold text-slate-700">Sertakan Sampul (Cover Page)</span>
                <input
                  type="checkbox"
                  checked={options.includeCover}
                  onChange={(e) => setOptions({ ...options, includeCover: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-slate-100">
                <span className="font-semibold text-slate-700">Sertakan Daftar Isi (TOC)</span>
                <input
                  type="checkbox"
                  checked={options.includeToc}
                  onChange={(e) => setOptions({ ...options, includeToc: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-slate-100">
                <span className="font-semibold text-slate-700">Sertakan Nomor Halaman</span>
                <input
                  type="checkbox"
                  checked={options.includePageNumbers}
                  onChange={(e) => setOptions({ ...options, includePageNumbers: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-700">Ukuran Kertas (PDF)</span>
                <select
                  value={options.pageSize}
                  onChange={(e) => setOptions({ ...options, pageSize: e.target.value as any })}
                  className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1"
                >
                  <option value="a4">Standar A4</option>
                  <option value="digest">Digest Ebook (6" x 9")</option>
                </select>
              </div>
            </div>

            {/* Primary Download Button */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menghasilkan File {selectedFormat.toUpperCase()}...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Unduh Dokumen {selectedFormat.toUpperCase()} Sekarang
                </>
              )}
            </button>
          </div>

          {/* Export History Card */}
          {exportHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                Riwayat Unduhan Buku Ini
              </h3>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
                {exportHistory.map((hist) => (
                  <div key={hist.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 uppercase">{hist.format}</span>
                      <p className="text-[10px] text-slate-400">
                        {new Date(hist.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {formatFileSize(hist.fileSize)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Interactive Reader Preview (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pratinjau Hasil Akhir
                </span>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">{ebook.title}</h4>
              </div>

              {/* Chapter Pager */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewChapterIdx(Math.max(0, previewChapterIdx - 1))}
                  disabled={previewChapterIdx === 0}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                  title="Bab Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-slate-600 px-1">
                  Bab {previewChapterIdx + 1} dari {chapters.length}
                </span>
                <button
                  onClick={() => setPreviewChapterIdx(Math.min(chapters.length - 1, previewChapterIdx + 1))}
                  disabled={previewChapterIdx === chapters.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                  title="Bab Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulated Page Frame */}
            <div className="bg-slate-50/70 p-4 sm:p-6 rounded-xl border border-slate-200/80 min-h-[500px] flex flex-col justify-between">
              {activePreviewChapter ? (
                <div>
                  <div className="text-center pb-4 mb-5 border-b border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                      Bab {activePreviewChapter.position}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mt-1">
                      {activePreviewChapter.title}
                    </h3>
                  </div>

                  <div
                    className="prose prose-sm max-w-none font-serif text-slate-800 leading-relaxed text-xs sm:text-sm max-h-[380px] overflow-y-auto p-2"
                    dangerouslySetInnerHTML={{
                      __html: activePreviewChapter.content || `<p>${activePreviewChapter.summary}</p>`,
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400">Belum ada bab yang dibuat.</div>
              )}

              {/* Page Footer Simulator */}
              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{ebook.title}</span>
                <span>Halaman {previewChapterIdx + 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
