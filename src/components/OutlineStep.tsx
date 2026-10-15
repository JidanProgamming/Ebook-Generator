import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Edit2,
  Check,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { Chapter, Ebook } from '../types/index.js';
import { ebookApi } from '../lib/api.js';
import { useToast } from './Toast.js';

interface OutlineStepProps {
  ebook: Ebook;
  onOutlineApproved: (updatedEbook: Ebook) => void;
  onBackToIdea: () => void;
}

export const OutlineStep: React.FC<OutlineStepProps> = ({
  ebook,
  onOutlineApproved,
  onBackToIdea,
}) => {
  const [chapters, setChapters] = useState<Chapter[]>(ebook.chapters || []);
  const [title, setTitle] = useState(ebook.title);
  const [subtitle, setSubtitle] = useState(ebook.subtitle || '');
  const [conceptSummary, setConceptSummary] = useState(ebook.conceptSummary || '');
  const [introduction, setIntroduction] = useState(ebook.introduction || '');
  const [conclusion, setConclusion] = useState(ebook.conclusion || '');

  // Editing state
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editSubtopics, setEditSubtopics] = useState('');

  // Regenerate modal
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);

  // Approve loading
  const [approveLoading, setApproveLoading] = useState(false);

  const { showToast } = useToast();

  const handleStartEdit = (chapter: Chapter) => {
    setEditingChapterId(chapter.id);
    setEditTitle(chapter.title);
    setEditSummary(chapter.summary);
    setEditSubtopics((chapter.subtopics || []).join('\n'));
  };

  const handleSaveEdit = async () => {
    if (!editingChapterId) return;
    const subtopicsArr = editSubtopics
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const updated = await ebookApi.updateChapter(editingChapterId, {
        title: editTitle,
        summary: editSummary,
        subtopics: subtopicsArr,
      });

      setChapters((prev) => prev.map((c) => (c.id === editingChapterId ? updated : c)));
      setEditingChapterId(null);
      showToast('Perubahan bab berhasil disimpan', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan perubahan bab', 'error');
    }
  };

  const handleAddChapter = async () => {
    try {
      const newIndex = chapters.length + 1;
      const created = await ebookApi.addChapter(ebook.id, {
        title: `Bab ${newIndex}: Topik Baru`,
        summary: 'Ringkasan materi yang akan dibahas pada bab ini.',
        subtopics: ['Subtopik 1', 'Subtopik 2', 'Langkah Aksi'],
        position: newIndex,
      });
      setChapters((prev) => [...prev, created]);
      showToast('Bab baru berhasil ditambahkan', 'success');
      handleStartEdit(created);
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan bab', 'error');
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (chapters.length <= 1) {
      showToast('Ebook minimal harus memiliki 1 bab', 'error');
      return;
    }
    try {
      await ebookApi.deleteChapter(id);
      const remaining = chapters
        .filter((c) => c.id !== id)
        .map((c, idx) => ({ ...c, position: idx + 1 }));
      setChapters(remaining);
      showToast('Bab berhasil dihapus', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus bab', 'error');
    }
  };

  const handleMoveChapter = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const newOrder = [...chapters];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setChapters(newOrder);

    try {
      const ids = newOrder.map((c) => c.id);
      await ebookApi.reorderChapters(ebook.id, ids);
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui urutan bab', 'error');
    }
  };

  const handleRegenerateOutline = async () => {
    setRegenLoading(true);
    try {
      const res = await ebookApi.generateOutline(ebook.id, regenInstructions);
      setTitle(res.ebook.title);
      setSubtitle(res.ebook.subtitle || '');
      setConceptSummary(res.ebook.conceptSummary || '');
      setIntroduction(res.ebook.introduction || '');
      setConclusion(res.ebook.conclusion || '');
      setChapters(res.chapters);
      setShowRegenModal(false);
      showToast('Outline berhasil disusun ulang oleh AI!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghasilkan ulang outline', 'error');
    } finally {
      setRegenLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproveLoading(true);
    try {
      // Save top level edits
      const updatedEbook = await ebookApi.update(ebook.id, {
        title,
        subtitle,
        conceptSummary,
        introduction,
        conclusion,
        status: 'generating',
      });
      showToast('Outline disetujui! Memulai pembuatan naskah bab...', 'success');
      onOutlineApproved({ ...updatedEbook, chapters });
    } catch (err: any) {
      showToast(err.message || 'Gagal menyetujui outline', 'error');
    } finally {
      setApproveLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            Langkah 2 dari 6
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Review & Setujui Outline Ebook
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Periksa susunan bab, sesuaikan topik, atau minta AI menghasilkan ulang sebelum membuat naskah lengkap.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowRegenModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate Outline
          </button>
          <button
            onClick={handleApprove}
            disabled={approveLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all disabled:opacity-50 shrink-0"
          >
            {approveLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Setujui Outline & Buat Konten
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Book Concept (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Informasi Utama Buku
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Judul Buku</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subjudul</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Subjudul penjelas buku"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ringkasan Konsep</label>
              <textarea
                rows={3}
                value={conceptSummary}
                onChange={(e) => setConceptSummary(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{chapters.length} Bab Terdaftar</span>
              <span>Gaya: {ebook.tone}</span>
            </div>
          </div>

          {/* Introduction & Conclusion preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pendahuluan (Intro)</label>
              <textarea
                rows={3}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kesimpulan (Outro)</label>
              <textarea
                rows={3}
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Structured Chapters List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Struktur Bab & Subbab ({chapters.length})
            </h3>
            <button
              onClick={handleAddChapter}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Bab
            </button>
          </div>

          {/* Chapters Cards */}
          <div className="space-y-3">
            {chapters.map((chapter, idx) => {
              const isEditing = editingChapterId === chapter.id;

              return (
                <div
                  key={chapter.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all"
                >
                  {isEditing ? (
                    /* Edit Form for Chapter */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Judul Bab</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tujuan / Ringkasan Bab</label>
                        <textarea
                          rows={2}
                          value={editSummary}
                          onChange={(e) => setEditSummary(e.target.value)}
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Subbab (satu baris per subtopik)
                        </label>
                        <textarea
                          rows={3}
                          value={editSubtopics}
                          onChange={(e) => setEditSubtopics(e.target.value)}
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl leading-relaxed font-mono text-[11px]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingChapterId(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Display */
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                              {chapter.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {chapter.summary}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleMoveChapter(idx, 'up')}
                            disabled={idx === 0}
                            title="Pindah ke Atas"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveChapter(idx, 'down')}
                            disabled={idx === chapters.length - 1}
                            title="Pindah ke Bawah"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(chapter)}
                            title="Edit Bab"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteChapter(chapter.id)}
                            title="Hapus Bab"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Subtopics Pills */}
                      {chapter.subtopics && chapter.subtopics.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {chapter.subtopics.map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[11px] font-medium bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/80"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom CTA Button */}
          <div className="pt-6 flex items-center justify-between">
            <button
              onClick={onBackToIdea}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100"
            >
              ← Kembali ke Input Ide
            </button>
            <button
              onClick={handleApprove}
              disabled={approveLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all disabled:opacity-50"
            >
              {approveLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Setujui Outline & Mulai Menulis Konten
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Regenerate Outline with AI */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-lg w-full animate-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-lg">Regenerate Outline dengan AI</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Berikan arahan baru atau sudut pandang spesifik untuk AI agar merumuskan ulang struktur outline bab Anda.
            </p>

            <textarea
              rows={4}
              value={regenInstructions}
              onChange={(e) => setRegenInstructions(e.target.value)}
              placeholder="Contoh: Fokuskan lebih banyak pada langkah aksi praktis, tambahkan bab mengenai kesalahan umum pemula, dan buat bab penutup lebih menjual..."
              className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 mb-4"
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowRegenModal(false)}
                disabled={regenLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleRegenerateOutline}
                disabled={regenLoading}
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs flex items-center gap-2"
              >
                {regenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Ulang Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
