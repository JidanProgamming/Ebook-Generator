import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Loader2,
  Eye,
  Type,
  Layers,
  Clock,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Bookmark,
  CheckCircle2,
  HelpCircle,
  Menu,
  Edit3,
  Cpu,
  Layout,
  ListChecks,
  ExternalLink,
} from 'lucide-react';
import { AIAssistAction, Chapter, Ebook } from '../types/index.js';
import { ebookApi } from '../lib/api.js';
import { useToast } from './Toast.js';

interface EditorStepProps {
  ebook: Ebook;
  initialChapterId?: string;
  onNavigateToCover: () => void;
  onRefreshEbook: () => Promise<void>;
  onOpenAISettings?: () => void;
}

export const EditorStep: React.FC<EditorStepProps> = ({
  ebook,
  initialChapterId,
  onNavigateToCover,
  onRefreshEbook,
  onOpenAISettings,
}) => {
  const [chapters, setChapters] = useState<Chapter[]>(ebook.chapters || []);
  const [activeChapterId, setActiveChapterId] = useState<string>(
    initialChapterId || (ebook.chapters?.[0]?.id ?? '')
  );

  // Active chapter state
  const activeChapter = chapters.find((c) => c.id === activeChapterId) || chapters[0];
  const activeChapterIndex = chapters.findIndex((c) => c.id === activeChapterId);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'failed'>('saved');
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Editor content & title
  const editorRef = useRef<HTMLDivElement>(null);
  const [chapterTitle, setChapterTitle] = useState(activeChapter?.title || '');
  const [wordCount, setWordCount] = useState(activeChapter?.wordCount || 0);

  // Typography settings
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Real-time Page Preview Mode toggle
  const [previewPageMode, setPreviewPageMode] = useState(false);

  // Left sidebar & right AI panel toggle (Responsive state)
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Dedicated Chapter Outline Panel State (Expanded by default to show outline context)
  const [showOutlineRef, setShowOutlineRef] = useState(true);

  // Edit Outline Dialog for active chapter
  const [showEditOutlineModal, setShowEditOutlineModal] = useState(false);
  const [editOutlineTitle, setEditOutlineTitle] = useState('');
  const [editOutlineSummary, setEditOutlineSummary] = useState('');
  const [editOutlineSubtopics, setEditOutlineSubtopics] = useState<string[]>([]);
  const [newSubtopicInput, setNewSubtopicInput] = useState('');
  const [savingOutline, setSavingOutline] = useState(false);

  // Full Book Outline modal & sidebar tab
  const [showFullOutlineModal, setShowFullOutlineModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chapters' | 'book_outline'>('chapters');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  // AI Assistant states
  const [aiAction, setAiAction] = useState<AIAssistAction>('improve');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiScope, setAiScope] = useState<'selected' | 'chapter'>('chapter');
  const [selectedText, setSelectedText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResultText, setAiResultText] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const { showToast } = useToast();

  // Sync editor inner HTML when active chapter changes
  useEffect(() => {
    if (activeChapter && editorRef.current) {
      setChapterTitle(activeChapter.title);
      editorRef.current.innerHTML = activeChapter.content || `<p>${activeChapter.summary || 'Mulai menulis bab...'}</p>`;
      updateWordCount();
      setAiResultText(null);
      setAiExplanation(null);
    }
  }, [activeChapterId]);

  const updateWordCount = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  };

  // Debounced Autosave
  const triggerAutosave = useCallback(
    (newContent: string, newTitle: string) => {
      setSaveStatus('saving');
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          if (!activeChapterId) return;
          const updated = await ebookApi.updateChapter(activeChapterId, {
            title: newTitle,
            content: newContent,
            status: 'completed',
          });
          setChapters((prev) =>
            prev.map((c) => (c.id === activeChapterId ? updated : c))
          );
          setSaveStatus('saved');
        } catch (err) {
          console.error('Autosave error:', err);
          setSaveStatus('failed');
        }
      }, 1000);
    },
    [activeChapterId]
  );

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    updateWordCount();
    const content = editorRef.current.innerHTML;
    triggerAutosave(content, chapterTitle);
  };

  const handleTitleChange = (newTitle: string) => {
    setChapterTitle(newTitle);
    if (editorRef.current) {
      triggerAutosave(editorRef.current.innerHTML, newTitle);
    }
  };

  // Text selection listener for AI Assistant
  const handleEditorSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      setSelectedText(sel.toString().trim());
      setAiScope('selected');
    }
  };

  // Rich Text Formatting commands
  const execCmd = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleEditorInput();
    }
  };

  const formatBlock = (tag: string) => {
    document.execCommand('formatBlock', false, tag);
    if (editorRef.current) {
      editorRef.current.focus();
      handleEditorInput();
    }
  };

  // Helper: Insert a subtopic from outline directly into the editor as H2
  const handleInsertSubtopicToEditor = (subtopic: string) => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const cleanSubtopic = subtopic.replace(/^[0-9.]+\s*/, '');
    const toInsert = `<h2>${subtopic}</h2><p>Tuliskan ulasan dan pembahasan mendalam mengenai ${cleanSubtopic} di sini...</p>`;
    
    editorRef.current.innerHTML = currentHtml + '\n' + toInsert;
    handleEditorInput();
    showToast(`Subbab "${subtopic}" disisipkan ke naskah`, 'success');
  };

  // Helper: Insert full standard outline layout with H1, lead paragraph, H2 subtopics, body paragraphs, and chapter summary
  const handleInsertFullOutlineTemplate = () => {
    if (!editorRef.current || !activeChapter) return;
    const subs =
      activeChapter.subtopics && activeChapter.subtopics.length > 0
        ? activeChapter.subtopics
        : ['Pengenalan Masalah & Latar Belakang', 'Prinsip Kunci & Solusi Terarah', 'Langkah Implementasi Bertahap'];

    const subSectionsHtml = subs
      .map((sub, sIdx) => {
        const cleanSub = sub.replace(/^[0-9.]+\s*/, '');
        return `<h2>${activeChapterIndex + 1}.${sIdx + 1} ${cleanSub}</h2>
<p>Memahami <strong>${cleanSub}</strong> secara menyeluruh akan memberikan landasan kuat dalam mencapai sasaran bab ini. Mulailah dengan menelaah prinsip dasarnya sebelum melangkah ke eksekusi mendalam.</p>
<blockquote>Poin kunci: Fokus pada pemahaman fundamental dan penerapan konsisten di lapangan nyata.</blockquote>
<p>Berikut adalah 3 aspek krusial yang perlu diperhatikan:</p>
<ul>
<li><strong>Aspek Pertama:</strong> Identifikasi sasaran spesifik yang ingin dicapai pada bagian ini.</li>
<li><strong>Aspek Kedua:</strong> Siapkan instrumen dan langkah kerja terukur.</li>
<li><strong>Aspek Ketiga:</strong> Evaluasi hasil secara berkala dan sesuaikan sesuai kondisi.</li>
</ul>`;
      })
      .join('\n\n');

    const templateHtml = `<h1>${chapterTitle || activeChapter.title}</h1>
<p><em>${
      activeChapter.summary ||
      'Bab ini menyajikan panduan terstruktur dan wawasan aplikatif untuk membantu Anda memahami serta menguasai materi secara mendalam.'
    }</em></p>
<p>Dalam bab ini, pembahasan dibagi ke dalam beberapa pokok bahasan yang saling melengkapi agar Anda memperoleh pemahaman holistik dari konsep awal hingga aplikasi nyata.</p>

${subSectionsHtml}

<h2>${activeChapterIndex + 1}.${subs.length + 1} Rangkuman Bab & Rencana Aksi</h2>
<p>Kita telah mengulas konsep-konsep kunci dalam bab ini. Untuk memastikan pemahaman Anda bertransformasi menjadi hasil nyata, lakukan langkah-langkah berikut:</p>
<ol>
<li>Pilih satu strategi dari bab ini yang paling mendesak untuk situasi Anda saat ini.</li>
<li>Jadwalkan eksekusi nyata dalam 24 jam ke depan.</li>
<li>Catat evaluasi dan pembelajaran sebelum melanjutkan ke bab berikutnya.</li>
</ol>`;

    editorRef.current.innerHTML = templateHtml;
    handleEditorInput();
    showToast('Tata letak outline lengkap berhasil diterapkan ke naskah editor!', 'success');
  };

  // Helper: Insert structured paragraph snippet
  const handleInsertParagraphTemplate = (type: 'lead' | 'body' | 'quote' | 'list') => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    let snippet = '';

    if (type === 'lead') {
      snippet = `<p><em>Sebagai pengantar bab ini, pembahasan berikut membedah fondasi esensial yang menjadi penentu keberhasilan naskah Anda.</em></p>`;
    } else if (type === 'body') {
      snippet = `<p>Penjelasan mendalam: Setiap langkah memerlukan eksekusi terukur dan perhatian terhadap detail praktis. Ketika prinsip ini diterapkan secara konsisten, hasil yang diperoleh akan jauh lebih stabil dan bertahan dalam jangka panjang.</p>`;
    } else if (type === 'quote') {
      snippet = `<blockquote>Keberhasilan yang berkelanjutan dibangun di atas pemahaman yang kuat dan eksekusi yang konsisten setiap hari.</blockquote>`;
    } else if (type === 'list') {
      snippet = `<ul>
<li><strong>Poin Utama:</strong> Identifikasi sasaran terpenting.</li>
<li><strong>Langkah Eksekusi:</strong> Mulai dari tindakan terukur terkecil.</li>
<li><strong>Evaluasi:</strong> Tinjau pencapaian dan perbaiki proses secara adaptif.</li>
</ul>`;
    }

    editorRef.current.innerHTML = currentHtml + '\n' + snippet;
    handleEditorInput();
    showToast('Template paragraf berhasil disisipkan!', 'success');
  };

  // Outline Editing Handlers
  const handleOpenEditOutline = () => {
    if (!activeChapter) return;
    setEditOutlineTitle(chapterTitle || activeChapter.title);
    setEditOutlineSummary(activeChapter.summary || '');
    setEditOutlineSubtopics([...(activeChapter.subtopics || [])]);
    setNewSubtopicInput('');
    setShowEditOutlineModal(true);
  };

  const handleAddSubtopic = () => {
    const trimmed = newSubtopicInput.trim();
    if (!trimmed) return;
    setEditOutlineSubtopics((prev) => [...prev, trimmed]);
    setNewSubtopicInput('');
  };

  const handleRemoveSubtopic = (index: number) => {
    setEditOutlineSubtopics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveOutlineChanges = async () => {
    if (!activeChapterId) return;
    setSavingOutline(true);
    try {
      const updated = await ebookApi.updateChapter(activeChapterId, {
        title: editOutlineTitle.trim() || activeChapter.title,
        summary: editOutlineSummary.trim(),
        subtopics: editOutlineSubtopics.filter((s) => s.trim().length > 0),
      });

      setChapters((prev) =>
        prev.map((c) => (c.id === activeChapterId ? updated : c))
      );
      setChapterTitle(updated.title);
      setShowEditOutlineModal(false);
      showToast('Outline bab berhasil diperbarui!', 'success');
      await onRefreshEbook();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan outline bab', 'error');
    } finally {
      setSavingOutline(false);
    }
  };

  // AI Assistant trigger
  const handleRunAiAssist = async () => {
    if (!editorRef.current) return;
    setAiLoading(true);
    setAiResultText(null);
    setAiExplanation(null);

    const fullText = editorRef.current.innerHTML;
    const targetText = aiScope === 'selected' && selectedText ? selectedText : fullText;

    try {
      const res = await ebookApi.aiAssist({
        action: aiAction,
        selectedText: aiScope === 'selected' ? selectedText : undefined,
        fullChapterText: aiScope === 'chapter' ? fullText : undefined,
        ebookContext: {
          title: ebook.title,
          targetAudience: ebook.targetAudience,
          tone: ebook.tone,
          chapterTitle: chapterTitle,
        },
        customInstruction: aiCustomPrompt,
      });

      setAiResultText(res.resultText);
      setAiExplanation(res.explanation);
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses bantuan AI', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Apply proposed AI edits safely without silent overwrites
  const handleApplyAiResult = () => {
    if (!aiResultText || !editorRef.current) return;

    if (aiScope === 'selected' && selectedText) {
      const currentHtml = editorRef.current.innerHTML;
      const replaced = currentHtml.replace(selectedText, aiResultText);
      editorRef.current.innerHTML = replaced;
    } else {
      editorRef.current.innerHTML = aiResultText;
    }

    handleEditorInput();
    setAiResultText(null);
    setAiExplanation(null);
    setShowAiPanel(false);
    showToast('Revisi AI berhasil diterapkan ke naskah!', 'success');
  };

  // Chapter management actions
  const handleAddChapter = async () => {
    try {
      const nextPos = chapters.length + 1;
      const created = await ebookApi.addChapter(ebook.id, {
        title: `Bab ${nextPos}: Bab Baru`,
        summary: 'Ringkasan sasaran materi bab...',
        subtopics: ['Pengenalan materi', 'Langkah implementasi', 'Rangkuman & Aksi'],
        content: `<h1>Bab ${nextPos}: Bab Baru</h1><p>Mulai menulis bab di sini...</p>`,
        position: nextPos,
      });
      setChapters((prev) => [...prev, created]);
      setActiveChapterId(created.id);
      showToast('Bab baru berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan bab', 'error');
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (chapters.length <= 1) {
      showToast('Ebook harus memiliki minimal 1 bab', 'error');
      return;
    }
    try {
      await ebookApi.deleteChapter(id);
      const remaining = chapters.filter((c) => c.id !== id);
      setChapters(remaining);
      if (activeChapterId === id) {
        setActiveChapterId(remaining[0]?.id ?? '');
      }
      showToast('Bab berhasil dihapus', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus bab', 'error');
    }
  };

  const handleMoveChapter = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= chapters.length) return;

    const newOrder = [...chapters];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setChapters(newOrder);

    try {
      await ebookApi.reorderChapters(
        ebook.id,
        newOrder.map((c) => c.id)
      );
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah urutan', 'error');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 text-slate-900 overflow-hidden relative">
      {/* Top Toolbar - Mobile-optimized horizontal scrollbar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 shrink-0 z-20 shadow-2xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-0.5">
          {/* Left: Navigation Buttons & Status */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle Chapter List Drawer */}
            <button
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showLeftSidebar
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Daftar Bab & Struktur Buku"
            >
              <Menu className="w-4 h-4 sm:hidden" />
              <Layers className="w-4 h-4 hidden sm:inline" />
              <span className="hidden sm:inline">Daftar Bab</span>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                {activeChapterIndex + 1}/{chapters.length}
              </span>
            </button>

            {/* Toggle Outline Reference Panel */}
            <button
              onClick={() => setShowOutlineRef(!showOutlineRef)}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showOutlineRef
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Tampilkan/Sembunyikan Outline Bab"
            >
              <Bookmark className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Outline Bab</span>
              <span className="sm:hidden text-[11px]">Outline</span>
            </button>

            {/* Autosave Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 shrink-0">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span className="text-slate-500 font-medium">Menyimpan...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Tersimpan</span>
                </>
              )}
              {saveStatus === 'failed' && (
                <>
                  <X className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-red-600 font-medium">Gagal simpan</span>
                </>
              )}
            </div>
          </div>

          {/* Center: Formatting Toolbar */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => execCmd('bold')}
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900 transition-colors"
              title="Tebal"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('italic')}
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900 transition-colors"
              title="Miring"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('underline')}
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900 transition-colors"
              title="Garis Bawah"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

            <button
              type="button"
              onClick={() => formatBlock('H1')}
              className="px-2 py-1 text-xs font-bold rounded hover:bg-white text-slate-700 hover:text-slate-900"
              title="Judul Bab (H1)"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => formatBlock('H2')}
              className="px-2 py-1 text-xs font-bold rounded hover:bg-white text-slate-700 hover:text-slate-900"
              title="Subbab (H2)"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => formatBlock('H3')}
              className="px-2 py-1 text-xs font-bold rounded hover:bg-white text-slate-700 hover:text-slate-900"
              title="Poin Detail (H3)"
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => formatBlock('P')}
              className="px-2 py-1 text-xs font-medium rounded hover:bg-white text-slate-700 hover:text-slate-900"
              title="Paragraf Normal"
            >
              P
            </button>

            <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => formatBlock('BLOCKQUOTE')}
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900"
              title="Kutipan"
            >
              <Quote className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

            <button
              type="button"
              onClick={() => execCmd('undo')}
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('redo')}
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

            {/* Tata Letak & Template Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                className="p-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 flex items-center gap-1 text-xs font-semibold transition-colors shadow-2xs"
                title="Pilihan Tata Letak Judul & Paragraf"
              >
                <Layout className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Tata Letak</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showTemplateMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowTemplateMenu(false)}
                  />
                  <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pola Tata Letak Bab
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTemplateMenu(false);
                        handleInsertFullOutlineTemplate();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-amber-950 font-semibold flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Kerangka Lengkap Outline
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pola Paragraf Cepat
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTemplateMenu(false);
                        handleInsertParagraphTemplate('lead');
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Paragraf Pengantar (Lead)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTemplateMenu(false);
                        handleInsertParagraphTemplate('body');
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <Type className="w-3.5 h-3.5 text-slate-500" />
                      Paragraf Penjelasan Mendalam
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTemplateMenu(false);
                        handleInsertParagraphTemplate('quote');
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <Quote className="w-3.5 h-3.5 text-slate-500" />
                      Kutipan Prinsip Utama
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTemplateMenu(false);
                        handleInsertParagraphTemplate('list');
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <List className="w-3.5 h-3.5 text-slate-500" />
                      Daftar Checklist Tindakan
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: AI Assistant & Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Font selector */}
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as any)}
              className="hidden sm:inline-block text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-medium"
            >
              <option value="serif">Serif (Buku)</option>
              <option value="sans">Sans-serif (Modern)</option>
              <option value="mono">Mono (Kode)</option>
            </select>

            {/* AI Assistant Toggle Button */}
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showAiPanel
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-400 group-hover:text-white" />
              <span className="hidden sm:inline">AI Assistant</span>
              <span className="sm:hidden text-[11px]">AI</span>
            </button>

            {/* Continue to Cover */}
            <button
              onClick={onNavigateToCover}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              <span className="hidden sm:inline">Cover</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PANEL 1: Left Chapter Navigator (Responsive Overlay Drawer on Mobile / Docked on Desktop) */}
        {showLeftSidebar && (
          <>
            {/* Mobile Backdrop */}
            <div
              className="lg:hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-2xs transition-opacity"
              onClick={() => setShowLeftSidebar(false)}
            />

            <aside className="fixed lg:static top-0 bottom-0 left-0 w-72 sm:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0 z-40 lg:z-10 shadow-2xl lg:shadow-none animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                {/* Tab Switcher */}
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('chapters')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      sidebarTab === 'chapters'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Struktur Bab ({chapters.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('book_outline')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      sidebarTab === 'book_outline'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Outline Buku
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {sidebarTab === 'chapters' && (
                    <button
                      onClick={handleAddChapter}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah
                    </button>
                  )}
                  <button
                    onClick={() => setShowLeftSidebar(false)}
                    className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sidebar Content Body */}
              {sidebarTab === 'chapters' ? (
                /* TAB 1: Chapters List */
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {chapters.map((ch, idx) => {
                    const isActive = ch.id === activeChapterId;

                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setActiveChapterId(ch.id);
                          if (window.innerWidth < 1024) setShowLeftSidebar(false);
                        }}
                        className={`group p-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-start justify-between gap-2 border ${
                          isActive
                            ? 'bg-blue-50/90 border-blue-200 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-500/10'
                            : 'border-transparent hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded text-[10px] bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="truncate">{ch.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 pl-5 flex items-center gap-2">
                            <span>{ch.wordCount || 0} kata</span>
                            {ch.subtopics && ch.subtopics.length > 0 && (
                              <span>• {ch.subtopics.length} subtopik</span>
                            )}
                          </div>
                        </div>

                        {/* Reorder & Delete Actions */}
                        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleMoveChapter(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-20"
                            title="Geser ke Atas"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveChapter(idx, 'down')}
                            disabled={idx === chapters.length - 1}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-20"
                            title="Geser ke Bawah"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteChapter(ch.id)}
                            className="p-1 hover:bg-red-100 text-red-500 rounded"
                            title="Hapus Bab"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* TAB 2: Full Book Outline View in Sidebar */
                <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                  <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200">
                    <span className="font-bold text-blue-900 block truncate">{ebook.title}</span>
                    {ebook.subtitle && (
                      <span className="text-[11px] text-blue-700 block mt-0.5 italic">{ebook.subtitle}</span>
                    )}
                    {ebook.conceptSummary && (
                      <p className="text-[10px] text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                        {ebook.conceptSummary}
                      </p>
                    )}
                  </div>

                  {ebook.introduction && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 text-[11px] block">Pendahuluan Buku:</span>
                      <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-3 leading-relaxed font-serif italic">
                        "{ebook.introduction}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                      Daftar Bab & Pokok Bahasan:
                    </span>
                    {chapters.map((ch, idx) => (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setActiveChapterId(ch.id);
                          if (window.innerWidth < 1024) setShowLeftSidebar(false);
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          ch.id === activeChapterId
                            ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold ring-1 ring-amber-400/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs truncate">
                          Bab {idx + 1}: {ch.title}
                        </div>
                        {ch.summary && (
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {ch.summary}
                          </p>
                        )}
                        {ch.subtopics && ch.subtopics.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {ch.subtopics.map((st, stIdx) => (
                              <span
                                key={stIdx}
                                className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                              >
                                {st}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {ebook.conclusion && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 text-[11px] block">Kesimpulan Buku:</span>
                      <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-3 leading-relaxed font-serif italic">
                        "{ebook.conclusion}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Quick Book Overview */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-xs">
                <span className="font-semibold text-slate-700 block truncate">{ebook.title}</span>
                <span className="text-[10px] text-slate-400">Gaya Bahasa: {ebook.tone}</span>
              </div>
            </aside>
          </>
        )}

        {/* PANEL 2: Center Editor Workspace */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-100/70">
          <div className="max-w-3xl w-full mx-auto p-3 sm:p-6 md:p-8 flex-1 flex flex-col">
            {/* Chapter Header Box: Judul Bab & Metadata */}
            <div className="bg-white rounded-t-2xl border-x border-t border-slate-200/90 p-4 sm:p-6 md:p-8 pb-4">
              {/* Top Tag Row: Position, Read time, Word count */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Bab {activeChapterIndex + 1} dari {chapters.length}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    ~{Math.max(1, Math.round(wordCount / 180))} mnt baca
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{wordCount} kata</span>
                  {saveStatus === 'saving' && <span className="text-[10px] text-blue-600 animate-pulse font-medium">Menyimpan...</span>}
                  {saveStatus === 'saved' && <span className="text-[10px] text-emerald-600 font-medium">Tersimpan</span>}
                </div>
              </div>

              {/* Chapter Title Input - Responsive Typography */}
              <div>
                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Masukkan Judul Bab..."
                  className="w-full text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 border-none outline-none focus:ring-0 p-0 placeholder-slate-300 leading-tight"
                />
              </div>

              {/* DEDICATED CHAPTER OUTLINE REFERENCE BAR (Requested by user) */}
              {activeChapter && (
                <div className="mt-4 pt-3.5 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOutlineRef(!showOutlineRef)}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-950 hover:text-amber-800 py-1 transition-colors"
                    >
                      <Bookmark className="w-4 h-4 text-amber-600" />
                      <span>Outline & Tata Letak Pokok Bahasan Bab</span>
                      {showOutlineRef ? (
                        <ChevronUp className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={handleOpenEditOutline}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/90 hover:bg-amber-200 text-amber-900 font-semibold text-[11px] transition-colors border border-amber-300/80 shadow-2xs"
                        title="Edit judul sasaran dan subbab outline ini"
                      >
                        <Edit3 className="w-3 h-3 text-amber-700" />
                        <span>Edit Outline Bab</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowFullOutlineModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] transition-colors border border-slate-200 shadow-2xs"
                        title="Lihat seluruh outline buku dari Bab 1 sampai akhir"
                      >
                        <BookOpen className="w-3 h-3 text-slate-500" />
                        <span className="hidden sm:inline">Seluruh Outline Buku</span>
                        <span className="sm:hidden">Semua Outline</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Chapter Outline Box */}
                  {showOutlineRef && (
                    <div className="mt-2.5 p-3.5 sm:p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-3 text-xs animate-in fade-in duration-150">
                      {/* Judul & Tujuan Paragraf */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            Tata Letak Paragraf Tujuan & Ringkasan Bab:
                          </span>
                          <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                            {(activeChapter.subtopics || []).length} Subbab Terjadwal
                          </span>
                        </div>

                        <div className="bg-white/85 border border-amber-200/80 p-3 rounded-xl text-amber-900 leading-relaxed text-[11px] sm:text-xs shadow-2xs">
                          <p className="font-serif italic">
                            "{activeChapter.summary || 'Belum ada ringkasan sasaran bab. Klik tombol Edit Outline untuk menambahkan.'}"
                          </p>
                        </div>
                      </div>

                      {/* Subtopics Checklist & Quick Insert */}
                      <div>
                        <span className="font-bold text-amber-950 block mb-1.5 text-xs">
                          📌 Subbab Outline (Klik untuk sisipkan H2 & Paragraf ke naskah):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeChapter.subtopics && activeChapter.subtopics.length > 0
                            ? activeChapter.subtopics
                            : ['Pengenalan materi', 'Prinsip utama', 'Langkah implementasi', 'Rangkuman & aksi nyata']
                          ).map((sub, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleInsertSubtopicToEditor(sub)}
                              title="Klik untuk sisipkan subbab ini ke dalam editor"
                              className="group inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-950 px-2.5 py-1.5 rounded-lg border border-amber-300/80 shadow-2xs text-[11px] font-semibold transition-all hover:scale-102 cursor-pointer text-left"
                            >
                              <span className="w-4 h-4 rounded bg-amber-100 text-amber-800 text-[10px] flex items-center justify-center font-bold">
                                {sIdx + 1}
                              </span>
                              <span>{sub}</span>
                              <Plus className="w-3 h-3 text-amber-600 group-hover:scale-125 transition-transform" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action Row: Apply Full Outline Template */}
                      <div className="pt-2.5 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-amber-800">
                          💡 Belum mulai menulis? Sisipkan naskah lengkap bab ini secara otomatis:
                        </span>
                        <button
                          type="button"
                          onClick={handleInsertFullOutlineTemplate}
                          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs text-xs transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Terapkan Tata Letak Outline Standar ke Naskah</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rich Content Editable Writing Canvas (Tata Letak Judul & Paragraf) */}
            <div
              className={`bg-white rounded-b-2xl border-x border-b border-slate-200/90 p-4 sm:p-6 md:p-10 pb-20 flex-1 shadow-xs transition-all ${
                previewPageMode
                  ? 'max-w-[720px] mx-auto shadow-md border-slate-300 ring-1 ring-slate-200'
                  : ''
              }`}
            >
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                onMouseUp={handleEditorSelection}
                onKeyUp={handleEditorSelection}
                className={`outline-none min-h-[420px] ebook-editor-body transition-all ${
                  fontFamily === 'serif'
                    ? 'font-serif'
                    : fontFamily === 'mono'
                    ? 'font-mono'
                    : 'font-sans'
                } ${
                  fontSize === 'sm'
                    ? 'text-sm'
                    : fontSize === 'lg'
                    ? 'text-lg leading-loose'
                    : 'text-base leading-relaxed'
                }`}
                style={{
                  minHeight: '450px',
                }}
              />
            </div>
          </div>
        </main>

        {/* PANEL 3: Right AI Writing Assistant (Slide-over on Mobile / Docked on Desktop) */}
        {showAiPanel && (
          <>
            {/* Mobile Backdrop for AI Assistant */}
            <div
              className="lg:hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-2xs transition-opacity"
              onClick={() => setShowAiPanel(false)}
            />

            <aside className="fixed lg:static top-0 bottom-0 right-0 w-80 sm:w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 z-40 lg:z-10 shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-200">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">AI Writing Assistant</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {onOpenAISettings && (
                    <button
                      type="button"
                      onClick={onOpenAISettings}
                      className="text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200"
                      title="Atur Custom API & Model AI"
                    >
                      ⚙️ Custom API
                    </button>
                  )}
                  <button
                    onClick={() => setShowAiPanel(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Target Scope Switcher */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                    Target Naskah
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAiScope('chapter')}
                      className={`py-1.5 font-semibold rounded-lg transition-all ${
                        aiScope === 'chapter' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Seluruh Bab
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiScope('selected')}
                      className={`py-1.5 font-semibold rounded-lg transition-all ${
                        aiScope === 'selected' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Teks Terpilih {selectedText ? '✓' : ''}
                    </button>
                  </div>
                  {aiScope === 'selected' && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      {selectedText
                        ? `"${selectedText.slice(0, 45)}..."`
                        : 'Sorot/pilih teks di editor untuk direvisi'}
                    </p>
                  )}
                </div>

                {/* AI Actions Select */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                    Pilih Aksi AI
                  </label>
                  <div className="space-y-1">
                    {[
                      { id: 'improve', label: '✨ Perbaiki Kualitas Tulisan', desc: 'Tingkatkan alur & kosakata' },
                      { id: 'fix_grammar', label: '✍️ Perbaiki Tata Bahasa & Typo', desc: 'Koreksi ejaan dan tanda baca' },
                      { id: 'rewrite', label: '🔄 Tulis Ulang (Rewrite)', desc: 'Gaya penyampaian lebih segar' },
                      { id: 'expand', label: '📈 Perluas & Tambah Contoh', desc: 'Perdalam dengan analogi & contoh' },
                      { id: 'summarize', label: '✂️ Buat Ringkasan Singkat', desc: 'Sajikan intisari poin penting' },
                      { id: 'change_tone', label: '🎭 Sesuaikan Tone Bahasa', desc: 'Ubah gaya bahasa pembaca' },
                      { id: 'simplify', label: '💡 Sederhanakan untuk Pemula', desc: 'Gunakan analogi mudah dipahami' },
                      { id: 'continue_writing', label: '⏩ Lanjutkan Paragraf', desc: 'Teruskan narasi bab ini' },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setAiAction(act.id as AIAssistAction)}
                        className={`w-full text-left p-2 rounded-xl transition-all border ${
                          aiAction === act.id
                            ? 'bg-blue-50 border-blue-200 text-blue-950 font-bold'
                            : 'border-slate-100 hover:border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>{act.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{act.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Custom Instruction */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider">
                    Instruksi Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    placeholder="Contoh: Buat lebih lugas dan to-the-point..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Run Action Button */}
                <button
                  type="button"
                  onClick={handleRunAiAssist}
                  disabled={aiLoading || (aiScope === 'selected' && !selectedText)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI Sedang Memproses...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Jalankan Asisten AI
                    </>
                  )}
                </button>

                {/* AI Proposed Changes Preview Diff */}
                {aiResultText && (
                  <div className="mt-4 p-3.5 bg-blue-50/90 rounded-2xl border border-blue-200 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 text-xs">Pratinjau Hasil AI:</span>
                      <span className="text-[10px] text-blue-600 font-medium">Belum diterapkan</span>
                    </div>

                    {aiExplanation && (
                      <p className="text-[11px] text-blue-800 bg-white/70 p-2 rounded-lg border border-blue-100">
                        💡 {aiExplanation}
                      </p>
                    )}

                    <div
                      className="p-3 bg-white rounded-xl border border-blue-200/80 max-h-48 overflow-y-auto text-slate-800 leading-relaxed text-[11px]"
                      dangerouslySetInnerHTML={{ __html: aiResultText }}
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAiResultText(null);
                          setAiExplanation(null);
                        }}
                        className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyAiResult}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs"
                      >
                        Terapkan ke Naskah
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </>
        )}
      </div>

      {/* MODAL 1: Edit Chapter Outline */}
      {showEditOutlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/60 shrink-0">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Edit Outline Bab {activeChapterIndex + 1}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditOutlineModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider">
                  Judul Bab (H1)
                </label>
                <input
                  type="text"
                  value={editOutlineTitle}
                  onChange={(e) => setEditOutlineTitle(e.target.value)}
                  placeholder="Masukkan judul bab..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider">
                  Tata Letak Paragraf Tujuan & Sasaran Bab
                </label>
                <textarea
                  rows={3}
                  value={editOutlineSummary}
                  onChange={(e) => setEditOutlineSummary(e.target.value)}
                  placeholder="Deskripsikan tujuan dan intisari yang ingin disampaikan dalam bab ini..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 leading-relaxed font-sans"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Paragraf ini menjadi acuan utama AI dan panduan arah penulisan Anda.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                    Daftar Subbab Outline (H2)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {editOutlineSubtopics.length} Subbab
                  </span>
                </div>

                <div className="space-y-1.5 mb-2.5 max-h-48 overflow-y-auto pr-1">
                  {editOutlineSubtopics.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg"
                    >
                      <span className="w-4 h-4 rounded bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {sIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={sub}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditOutlineSubtopics((prev) =>
                            prev.map((item, idx) => (idx === sIdx ? val : item))
                          );
                        }}
                        className="flex-1 bg-transparent border-none p-0 text-xs text-slate-800 focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtopic(sIdx)}
                        className="text-slate-400 hover:text-red-500 p-0.5"
                        title="Hapus subbab"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtopicInput}
                    onChange={(e) => setNewSubtopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtopic();
                      }
                    }}
                    placeholder="Tambah subbab baru..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtopic}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditOutlineModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveOutlineChanges}
                disabled={savingOutline}
                className="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingOutline ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Simpan Perubahan Outline
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Book Outline Viewer */}
      {showFullOutlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Seluruh Outline Ebook: {ebook.title}
                  </h3>
                  {ebook.subtitle && (
                    <p className="text-[11px] text-slate-500 italic">{ebook.subtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullOutlineModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {ebook.conceptSummary && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-950">
                  <span className="font-bold block mb-1">💡 Ringkasan Konsep Ebook:</span>
                  <p className="leading-relaxed">{ebook.conceptSummary}</p>
                </div>
              )}

              {ebook.introduction && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                  <span className="font-bold block mb-1">📖 Pendahuluan Ebook:</span>
                  <p className="leading-relaxed font-serif italic">"{ebook.introduction}"</p>
                </div>
              )}

              <div className="space-y-3">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                  Daftar Keseluruhan Bab & Outline:
                </span>

                {chapters.map((ch, idx) => {
                  const isCurrent = ch.id === activeChapterId;

                  return (
                    <div
                      key={ch.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                              Bab {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{ch.title}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                Sedang Diedit
                              </span>
                            )}
                          </div>
                          {ch.summary && (
                            <p className="text-slate-600 mt-1.5 leading-relaxed italic text-[11px]">
                              🎯 {ch.summary}
                            </p>
                          )}
                        </div>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChapterId(ch.id);
                              setShowFullOutlineModal(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] shrink-0"
                          >
                            Buka Bab Ini
                          </button>
                        )}
                      </div>

                      {ch.subtopics && ch.subtopics.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {ch.subtopics.map((st, stIdx) => (
                            <span
                              key={stIdx}
                              className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {ebook.conclusion && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                  <span className="font-bold block mb-1">🏁 Kesimpulan Ebook:</span>
                  <p className="leading-relaxed font-serif italic">"{ebook.conclusion}"</p>
                </div>
              )}
            </div>

            <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowFullOutlineModal(false)}
                className="px-4 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl"
              >
                Tutup Outline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
