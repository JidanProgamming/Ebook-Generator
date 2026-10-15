import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Eye,
  FileText,
  Loader2,
  Pause,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Chapter, Ebook } from '../types/index.js';
import { ebookApi } from '../lib/api.js';
import { useToast } from './Toast.js';

interface ContentGeneratorStepProps {
  ebook: Ebook;
  onOpenEditor: (chapterId?: string) => void;
  onRefreshEbook: () => Promise<void>;
}

export const ContentGeneratorStep: React.FC<ContentGeneratorStepProps> = ({
  ebook,
  onOpenEditor,
  onRefreshEbook,
}) => {
  const [chapters, setChapters] = useState<Chapter[]>(ebook.chapters || []);
  const [batchRunning, setBatchRunning] = useState(false);
  const [currentGeneratingId, setCurrentGeneratingId] = useState<string | null>(null);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [customPromptModalId, setCustomPromptModalId] = useState<string | null>(null);
  const [customPromptText, setCustomPromptText] = useState('');

  const { showToast } = useToast();

  const completedCount = chapters.filter((c) => c.status === 'completed').length;
  const progressPercent = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

  // Single Chapter Generator
  const generateSingleChapter = async (chapterId: string, customInstruction?: string) => {
    setCurrentGeneratingId(chapterId);
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, status: 'generating' } : c))
    );

    try {
      const updated = await ebookApi.generateChapter(chapterId, customInstruction);
      setChapters((prev) =>
        prev.map((c) => (c.id === chapterId ? updated : c))
      );
      showToast(`Konten "${updated.title}" berhasil dibuat!`, 'success');
      await onRefreshEbook();
    } catch (err: any) {
      setChapters((prev) =>
        prev.map((c) => (c.id === chapterId ? { ...c, status: 'failed' } : c))
      );
      showToast(err.message || 'Gagal menghasilkan bab', 'error');
    } finally {
      setCurrentGeneratingId(null);
    }
  };

  // Batch Sequential Generator
  const generateAllSequential = async () => {
    setBatchRunning(true);
    const pendingChapters = chapters.filter((c) => c.status !== 'completed');

    if (pendingChapters.length === 0) {
      showToast('Semua bab sudah selesai dibuat!', 'info');
      setBatchRunning(false);
      return;
    }

    for (const ch of pendingChapters) {
      setCurrentGeneratingId(ch.id);
      setChapters((prev) =>
        prev.map((c) => (c.id === ch.id ? { ...c, status: 'generating' } : c))
      );

      try {
        const updated = await ebookApi.generateChapter(ch.id);
        setChapters((prev) =>
          prev.map((c) => (c.id === ch.id ? updated : c))
        );
      } catch (err: any) {
        setChapters((prev) =>
          prev.map((c) => (c.id === ch.id ? { ...c, status: 'failed' } : c))
        );
        showToast(`Bab "${ch.title}" terhenti atau gagal. Anda dapat mencobanya kembali.`, 'error');
        // Stop batch on failure so user can retry or adjust
        break;
      }
    }

    setBatchRunning(false);
    setCurrentGeneratingId(null);
    await onRefreshEbook();
    showToast('Proses penulisan batch selesai!', 'success');
  };

  const getStatusIcon = (status: Chapter['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'generating':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />;
      default:
        return <Clock className="w-5 h-5 text-slate-300 shrink-0" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            Langkah 3 dari 6
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            AI Content Generator per Bab
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Hasilkan naskah mendalam bab demi bab secara terarah dengan menjaga kontinuitas gaya bahasa dan konteks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={generateAllSequential}
            disabled={batchRunning || currentGeneratingId !== null}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all disabled:opacity-50 shrink-0"
          >
            {batchRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sedang Menulis Bab...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Generate Semua Bab Otomatis
              </>
            )}
          </button>

          <button
            onClick={() => onOpenEditor()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all shrink-0"
          >
            Buka Editor Naskah
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Progres Pembuatan Konten: {completedCount} dari {chapters.length} Bab Selesai
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap bab disimpan otomatis ke database segera setelah selesai dibuat.
            </p>
          </div>
          <span className="text-xl font-extrabold text-blue-600">{progressPercent}%</span>
        </div>

        {/* Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Chapters Generation List */}
      <div className="space-y-3.5">
        {chapters.map((chapter, idx) => {
          const isGenerating = currentGeneratingId === chapter.id || (batchRunning && chapter.status === 'generating');
          const isExpanded = expandedChapterId === chapter.id;

          return (
            <div
              key={chapter.id}
              className={`bg-white rounded-2xl border transition-all ${
                isGenerating
                  ? 'border-blue-400 ring-2 ring-blue-500/10 shadow-md'
                  : chapter.status === 'completed'
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="pt-0.5">{getStatusIcon(chapter.status)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Bab {idx + 1}</span>
                      {chapter.status === 'completed' && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          {chapter.wordCount || 0} Kata
                        </span>
                      )}
                      {chapter.status === 'generating' && (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 animate-pulse">
                          AI Sedang Menulis...
                        </span>
                      )}
                      {chapter.status === 'failed' && (
                        <span className="text-[10px] font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
                          Gagal / Timeout
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-0.5 truncate">
                      {chapter.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{chapter.summary}</p>
                  </div>
                </div>

                {/* Chapter Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {chapter.status === 'completed' ? (
                    <>
                      <button
                        onClick={() => setExpandedChapterId(isExpanded ? null : chapter.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isExpanded ? 'Tutup Preview' : 'Pratinjau'}
                      </button>

                      <button
                        onClick={() => onOpenEditor(chapter.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Edit di Editor
                      </button>

                      <button
                        onClick={() => {
                          setCustomPromptModalId(chapter.id);
                          setCustomPromptText('');
                        }}
                        disabled={isGenerating || batchRunning}
                        title="Tulis Ulang dengan AI"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => generateSingleChapter(chapter.id)}
                        disabled={isGenerating || batchRunning}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Menulis...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate Bab Ini
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Collapsible Preview Box */}
              {isExpanded && chapter.content && (
                <div className="border-t border-slate-100 bg-slate-50/70 p-5 rounded-b-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Pratinjau Hasil Naskah</span>
                    <span>{chapter.wordCount} kata</span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-slate-800 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs max-h-80 overflow-y-auto leading-relaxed text-xs sm:text-sm"
                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom CTA when chapters completed */}
      {completedCount > 0 && (
        <div className="mt-8 p-5 bg-blue-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-blue-950 text-sm">Naskah Siap Dipoles di Ebook Editor</h4>
            <p className="text-xs text-blue-800 mt-0.5">
              Anda dapat mengedit tata letak, merevisi kata, menggunakan asisten AI perbaikan kalimat, atau mengatur cover.
            </p>
          </div>
          <button
            onClick={() => onOpenEditor()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0"
          >
            Lanjut ke Ebook Editor
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal: Regenerate Chapter with custom prompt */}
      {customPromptModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full animate-in zoom-in-95">
            <h4 className="font-bold text-slate-900 text-base mb-1">Tulis Ulang Bab Ini dengan AI</h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Konten bab sebelumnya akan ditimpa dengan naskah baru. Masukkan instruksi khusus jika diperlukan.
            </p>

            <textarea
              rows={3}
              value={customPromptText}
              onChange={(e) => setCustomPromptText(e.target.value)}
              placeholder="Contoh: Buat penjelasan lebih singkat, tambahkan analogi mobil balap, dan berikan 3 langkah aksi..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCustomPromptModalId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const id = customPromptModalId;
                  setCustomPromptModalId(null);
                  generateSingleChapter(id, customPromptText);
                }}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
              >
                Tulis Ulang Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
