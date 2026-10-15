import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Calendar,
  Layers,
  Copy,
  Trash2,
  ExternalLink,
  MoreVertical,
  CheckCircle,
  Clock,
  Sparkles,
  FileDown,
  Loader2,
  Filter,
  CheckCircle2,
  BookMarked,
  FileText,
  Cpu,
} from 'lucide-react';
import { Ebook, EbookStatus, UserProfile } from '../types/index.js';
import { ebookApi } from '../lib/api.js';
import { useToast } from './Toast.js';

interface DashboardProps {
  user: UserProfile;
  ebooks: Ebook[];
  loading: boolean;
  onSelectEbook: (ebook: Ebook) => void;
  onCreateNew: () => void;
  onRefreshEbooks: () => Promise<void>;
  onOpenAISettings?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  ebooks,
  loading,
  onSelectEbook,
  onCreateNew,
  onRefreshEbooks,
  onOpenAISettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'chapters'>('recent');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { showToast } = useToast();

  // Filter and sort ebooks
  const filteredEbooks = useMemo(() => {
    return ebooks
      .filter((ebook) => {
        const matchesSearch =
          ebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ebook.idea.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ebook.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        } else if (sortBy === 'chapters') {
          return (b.chapters?.length || 0) - (a.chapters?.length || 0);
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [ebooks, searchQuery, statusFilter, sortBy]);

  // Handle duplicate
  const handleDuplicate = async (e: React.MouseEvent, ebookId: string) => {
    e.stopPropagation();
    setActionLoadingId(ebookId);
    try {
      const duplicated = await ebookApi.duplicate(ebookId);
      showToast(`Ebook "${duplicated.title}" berhasil digandakan`, 'success');
      await onRefreshEbooks();
    } catch (err: any) {
      showToast(err.message || 'Gagal menggandakan ebook', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle delete
  const handleDelete = async (e: React.MouseEvent, ebookId: string) => {
    e.stopPropagation();
    setActionLoadingId(ebookId);
    try {
      await ebookApi.delete(ebookId);
      showToast('Ebook berhasil dihapus', 'success');
      setDeleteConfirmId(null);
      await onRefreshEbooks();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus ebook', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: EbookStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-700">Draf Awal</span>;
      case 'outline_ready':
        return <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-amber-100 text-amber-800">Outline Siap</span>;
      case 'generating':
        return <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-blue-100 text-blue-800 animate-pulse">Menulis Bab</span>;
      case 'editing':
        return <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-purple-100 text-purple-800">Tahap Editing</span>;
      case 'ready_to_export':
      case 'completed':
        return <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-emerald-100 text-emerald-800">Siap Ekspor</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  // Compute stats
  const totalEbooks = ebooks.length;
  const inProgress = ebooks.filter((e) => e.status !== 'completed' && e.status !== 'ready_to_export').length;
  const readyEbooks = ebooks.filter((e) => e.status === 'completed' || e.status === 'ready_to_export' || e.status === 'editing').length;
  const totalWords = ebooks.reduce((acc, eb) => {
    const wordsInBook = (eb.chapters || []).reduce((chAcc, c) => chAcc + (c.wordCount || 0), 0);
    return acc + wordsInBook;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Top Banner / Sapaan Pengguna */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace Aktif</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Halo, {user.displayName} 👋
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Kelola naskah ebook Anda atau mulai draf baru dengan panduan AI.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              {onOpenAISettings && (
                <button
                  type="button"
                  onClick={onOpenAISettings}
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200/90 active:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all text-xs sm:text-sm shrink-0"
                  title="Atur API Key sendiri (Codex, OpenCode, OpenRouter, Gemini)"
                >
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Pengaturan Custom API</span>
                </button>
              )}

              <button
                onClick={onCreateNew}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs hover:shadow transition-all text-xs sm:text-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Ebook Baru</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar - Responsive 2x2 grid on mobile, 4-col on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-6 sm:mt-8">
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/80">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500">Total Proyek</span>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5">{totalEbooks}</p>
            </div>
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/80">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500">Dalam Pengerjaan</span>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-0.5">{inProgress}</p>
            </div>
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/80">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500">Editing & Siap Terbit</span>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600 mt-0.5">{readyEbooks}</p>
            </div>
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/80">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500">Total Kata Tersimpan</span>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5">{totalWords.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Search, Filter, and Sort Bar - Fully Mobile-Friendly */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul atau ide buku..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draf Awal</option>
              <option value="outline_ready">Outline Siap</option>
              <option value="generating">Proses Penulisan</option>
              <option value="editing">Tahap Editing</option>
              <option value="ready_to_export">Siap Ekspor</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="recent">Terbaru Diperbarui</option>
              <option value="title">Judul A-Z</option>
              <option value="chapters">Jumlah Bab</option>
            </select>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Memuat daftar ebook Anda...</p>
          </div>
        ) : filteredEbooks.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {searchQuery ? 'Tidak ada ebook yang sesuai pencarian' : 'Belum Ada Ebook yang Dibuat'}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {searchQuery
                ? 'Coba gunakan kata kunci lain atau ubah filter status proyek Anda.'
                : 'Mulai buat ebook profesional pertama Anda sekarang. AI akan membantu merancang outline, menghasilkan naskah per bab, hingga menyusun cover dan ekspor.'}
            </p>
            <div className="mt-6">
              <button
                onClick={onCreateNew}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs hover:shadow text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Buat Ebook Sekarang
              </button>
            </div>
          </div>
        ) : (
          /* Ebook Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredEbooks.map((ebook) => {
              const chapters = ebook.chapters || [];
              const completedChapters = chapters.filter((c) => c.status === 'completed').length;
              const progressPercent = chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0;
              const totalWordCount = chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);

              const coverBg = ebook.coverSettings?.primaryColor || '#0f172a';
              const coverImg = ebook.coverSettings?.bgImageUrl;

              return (
                <div
                  key={ebook.id}
                  onClick={() => onSelectEbook(ebook)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Card Top: Cover Thumbnail Banner */}
                    <div
                      className="h-28 sm:h-32 relative p-3.5 sm:p-4 flex flex-col justify-between transition-opacity group-hover:opacity-95 bg-cover bg-center text-white"
                      style={{
                        backgroundColor: coverBg,
                        backgroundImage: coverImg ? `url(${coverImg})` : undefined,
                      }}
                    >
                      {/* Dark overlay for contrast */}
                      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                      <div className="flex items-start justify-between gap-2 z-10">
                        <span className="text-[10px] font-bold tracking-wider uppercase opacity-90 px-2 py-0.5 rounded bg-black/25">
                          {ebook.language} • {ebook.tone}
                        </span>
                        {getStatusBadge(ebook.status)}
                      </div>

                      <div className="z-10">
                        <h4 className="font-bold text-sm sm:text-base line-clamp-1">{ebook.title}</h4>
                        <p className="text-[11px] opacity-80 truncate">{ebook.coverSettings?.author || 'Penulis'}</p>
                      </div>

                      {/* Subtle background decoration */}
                      <div className="absolute right-3 -bottom-4 opacity-15 text-white">
                        <BookOpen className="w-24 h-24" />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {ebook.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {ebook.conceptSummary || ebook.idea}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {completedChapters}/{chapters.length || ebook.chapterCount} Bab Selesai
                          </span>
                          <span className="font-bold text-slate-800">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{totalWordCount.toLocaleString('id-ID')} kata</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ebook.updatedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div
                    className="px-4 sm:px-5 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onSelectEbook(ebook)}
                      className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 py-1"
                    >
                      Buka & Edit
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDuplicate(e, ebook.id)}
                        disabled={actionLoadingId === ebook.id}
                        title="Gandakan Ebook"
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(ebook.id);
                        }}
                        disabled={actionLoadingId === ebook.id}
                        title="Hapus Ebook"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full animate-in zoom-in-95">
            <h4 className="font-bold text-slate-900 text-base">Hapus Proyek Ebook Ini?</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Seluruh bab, naskah, dan pengaturan cover untuk buku ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={(e) => handleDelete(e, deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
