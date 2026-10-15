import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import {
  findUserByEmail,
  findUserById,
  createUser,
  verifyUserPassword,
  updateUserPassword,
  getEbooksByUserId,
  getEbookById,
  createEbook,
  updateEbook,
  deleteEbook,
  duplicateEbook,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  logAIGeneration,
  logExport,
  getExportsByEbook,
  getUserAISettings,
  updateUserAISettings,
} from './db.js';
import {
  generateOutlineAI,
  generateChapterContentAI,
  aiWritingAssist,
  testAIConnection,
} from './gemini.js';
import {
  generateCoverImage,
  generateCoverPromptAI,
  CoverVisualStyle,
} from './coverGenerator.js';
import { AISettings } from '../types/index.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '25mb' }));

// Helper to extract AI settings from client request headers, falling back to DB and env vars
export function extractAISettings(req: Request, user?: any): AISettings {
  let fromHeader: Partial<AISettings> | null = null;
  const rawHeader = req.headers['x-ai-settings'] as string;
  if (rawHeader) {
    try {
      fromHeader = JSON.parse(decodeURIComponent(rawHeader));
    } catch {
      try {
        fromHeader = JSON.parse(rawHeader);
      } catch {
        // ignore parse error
      }
    }
  }

  const headerKey = req.headers['x-ai-key'] as string;
  const headerProvider = req.headers['x-ai-provider'] as string;
  const headerModel = req.headers['x-ai-model'] as string;
  const headerBaseUrl = req.headers['x-ai-base-url'] as string;

  const dbSettings = user?.id ? getUserAISettings(user.id) : undefined;

  const provider = (fromHeader?.provider || headerProvider || dbSettings?.provider || 'gemini') as any;
  const model = fromHeader?.model || headerModel || dbSettings?.model || (provider === 'gemini' ? 'gemini-3.8-flash' : 'gpt-4o-mini');
  const apiKey =
    fromHeader?.apiKey ||
    headerKey ||
    dbSettings?.apiKey ||
    (provider === 'gemini'
      ? process.env.GEMINI_API_KEY
      : provider === 'openrouter'
      ? process.env.OPENROUTER_API_KEY
      : process.env.CUSTOM_AI_API_KEY);
  const baseUrl = fromHeader?.baseUrl || headerBaseUrl || dbSettings?.baseUrl || process.env.CUSTOM_AI_BASE_URL;
  const temperature = fromHeader?.temperature ?? dbSettings?.temperature ?? 0.7;

  return {
    provider,
    model,
    apiKey,
    baseUrl,
    temperature,
  };
}

// Auth Middleware: extracts user from Bearer token or x-user-id header
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  let token = req.headers['authorization'];
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  } else {
    token = req.headers['x-user-id'] as string;
  }

  if (!token) {
    // Default to demo user for friction-free access if header missing
    const demoUser = findUserByEmail('demo@ebookgenerator.com');
    if (demoUser) {
      (req as any).user = demoUser;
      return next();
    }
    res.status(401).json({ error: 'Silakan login terlebih dahulu' });
    return;
  }

  const user = findUserById(token);
  if (!user) {
    const demoUser = findUserByEmail('demo@ebookgenerator.com');
    if (demoUser) {
      (req as any).user = demoUser;
      return next();
    }
    res.status(401).json({ error: 'Sesi login tidak valid' });
    return;
  }

  (req as any).user = user;
  next();
}

const apiRouter = express.Router();

// --- AUTH ROUTES ---
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      res.status(400).json({ error: 'Format email tidak valid. Harap gunakan alamat email yang benar.' });
      return;
    }

    if (cleanPassword.length < 6) {
      res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
      return;
    }

    const existing = findUserByEmail(cleanEmail);
    if (existing) {
      res.status(400).json({ error: 'Email sudah terdaftar. Silakan gunakan menu Masuk atau gunakan opsi Lupa Kata Sandi.' });
      return;
    }

    const user = createUser(cleanEmail, cleanPassword, displayName || 'Penulis');
    res.json({
      token: user.id,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mendaftar akun baru.' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    const user = findUserByEmail(cleanEmail);
    if (!user || !verifyUserPassword(user, cleanPassword)) {
      res.status(401).json({ error: 'Email atau kata sandi tidak cocok. Silakan periksa kembali atau gunakan opsi Reset Kata Sandi.' });
      return;
    }

    res.json({
      token: user.id,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal masuk akun.' });
  }
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (newPassword || '').trim();

    if (!cleanEmail || !cleanPassword) {
      res.status(400).json({ error: 'Email dan kata sandi baru wajib diisi.' });
      return;
    }

    if (cleanPassword.length < 6) {
      res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    const user = updateUserPassword(cleanEmail, cleanPassword);
    if (!user) {
      res.status(404).json({ error: 'Akun dengan alamat email ini tidak ditemukan. Silakan daftar akun baru.' });
      return;
    }

    res.json({
      message: 'Kata sandi berhasil diperbarui! Silakan masuk menggunakan kata sandi baru Anda.',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memperbarui kata sandi.' });
  }
});

apiRouter.get('/auth/me', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  });
});

// --- EBOOK CRUD ROUTES ---
apiRouter.get('/ebooks', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ebooks = getEbooksByUserId(user.id);
    res.json(ebooks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ebooks', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, idea, targetAudience, purpose, language, tone, length, chapterCount, instructions } = req.body;

    if (!idea) {
      res.status(400).json({ error: 'Ide atau topik ebook wajib diisi' });
      return;
    }

    const ebook = createEbook(user.id, {
      title,
      idea,
      targetAudience: targetAudience || 'Pembaca umum',
      purpose: purpose || 'Memberikan wawasan terstruktur',
      language: language || 'Bahasa Indonesia',
      tone: tone || 'profesional',
      length: length || 'sedang',
      chapterCount: Number(chapterCount) || 5,
      instructions,
    });

    res.json(ebook);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/ebooks/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ebook = getEbookById(req.params.id, user.id);
    if (!ebook) {
      res.status(404).json({ error: 'Ebook tidak ditemukan' });
      return;
    }
    res.json(ebook);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/ebooks/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const updated = updateEbook(req.params.id, user.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Ebook tidak ditemukan atau gagal diperbarui' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/ebooks/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const success = deleteEbook(req.params.id, user.id);
    if (!success) {
      res.status(404).json({ error: 'Ebook tidak ditemukan' });
      return;
    }
    res.json({ message: 'Ebook berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ebooks/:id/duplicate', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const duplicated = duplicateEbook(req.params.id, user.id);
    if (!duplicated) {
      res.status(404).json({ error: 'Ebook tidak ditemukan untuk diduplikasi' });
      return;
    }
    res.json(duplicated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- WORKFLOW: STEP 2 - OUTLINE GENERATOR ---
apiRouter.post('/ebooks/:id/outline', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ebook = getEbookById(req.params.id, user.id);
    if (!ebook) {
      res.status(404).json({ error: 'Ebook tidak ditemukan' });
      return;
    }

    const { customInstructions } = req.body;
    const aiSettings = extractAISettings(req, user);

    const outlineResult = await generateOutlineAI(
      {
        idea: ebook.idea,
        title: ebook.title,
        targetAudience: ebook.targetAudience,
        purpose: ebook.purpose,
        language: ebook.language,
        tone: ebook.tone,
        length: ebook.length,
        chapterCount: ebook.chapterCount,
        instructions: customInstructions || ebook.instructions,
      },
      aiSettings
    );

    logAIGeneration({
      ebookId: ebook.id,
      operation: 'generate_outline',
      status: 'success',
      usageMetadata: { chaptersCount: outlineResult.chapters.length },
    });

    // Delete previous chapters if any
    (ebook.chapters || []).forEach((c) => deleteChapter(c.id));

    // Create new chapters from outline
    const createdChapters = outlineResult.chapters.map((ch, idx) =>
      createChapter(ebook.id, {
        title: ch.title,
        summary: ch.summary,
        subtopics: ch.subtopics,
        position: idx + 1,
        status: 'pending',
      })
    );

    // Update ebook metadata with generated outline details
    const updatedEbook = updateEbook(ebook.id, user.id, {
      title: outlineResult.title || ebook.title,
      subtitle: outlineResult.subtitle || ebook.subtitle,
      conceptSummary: outlineResult.conceptSummary,
      introduction: outlineResult.introduction,
      conclusion: outlineResult.conclusion,
      status: 'outline_ready',
      coverSettings: {
        ...ebook.coverSettings,
        title: outlineResult.title || ebook.title,
        subtitle: outlineResult.subtitle || ebook.subtitle || 'Panduan Lengkap',
      },
    });

    res.json({
      ebook: updatedEbook,
      outlineResult,
      chapters: createdChapters,
    });
  } catch (err: any) {
    console.error('Outline generation route error:', err);
    res.status(500).json({ error: err.message || 'Gagal menghasilkan outline' });
  }
});

// --- CHAPTERS MANAGEMENT ---
apiRouter.post('/ebooks/:id/chapters', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ebook = getEbookById(req.params.id, user.id);
    if (!ebook) {
      res.status(404).json({ error: 'Ebook tidak ditemukan' });
      return;
    }

    const { title, summary, subtopics, content, position } = req.body;
    const newChapter = createChapter(ebook.id, {
      title: title || `Bab ${(ebook.chapters || []).length + 1}`,
      summary,
      subtopics,
      content,
      position,
      status: content ? 'completed' : 'pending',
    });

    res.json(newChapter);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/chapters/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const updated = updateChapter(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Bab tidak ditemukan' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/chapters/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const success = deleteChapter(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Bab tidak ditemukan' });
      return;
    }
    res.json({ message: 'Bab berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/ebooks/:id/chapters/reorder', authMiddleware, (req: Request, res: Response) => {
  try {
    const { chapterIds } = req.body;
    if (!Array.isArray(chapterIds)) {
      res.status(400).json({ error: 'chapterIds harus berupa array' });
      return;
    }
    const chapters = reorderChapters(req.params.id, chapterIds);
    res.json(chapters);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- WORKFLOW: STEP 3 - CONTENT GENERATOR PER CHAPTER ---
apiRouter.post('/chapters/:id/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const chapterId = req.params.id;
    const { customInstructions } = req.body;

    const db = await import('./db.js');
    const allDb = db.getDatabase();
    const chapter = allDb.chapters.find((c) => c.id === chapterId);
    if (!chapter) {
      res.status(404).json({ error: 'Bab tidak ditemukan' });
      return;
    }

    const ebook = getEbookById(chapter.ebookId, user.id);
    if (!ebook) {
      res.status(404).json({ error: 'Ebook tidak ditemukan' });
      return;
    }

    // Set chapter status to generating
    updateChapter(chapterId, { status: 'generating' });

    // Build context from previous chapters
    const previousChapters = (ebook.chapters || [])
      .filter((c) => c.position < chapter.position)
      .map((c) => `${c.title}: ${c.summary || c.title}`)
      .join('\n');

    try {
      const aiSettings = extractAISettings(req, user);
      const generatedHtml = await generateChapterContentAI(
        {
          ebookTitle: ebook.title,
          targetAudience: ebook.targetAudience,
          purpose: ebook.purpose,
          language: ebook.language,
          tone: ebook.tone,
          chapterTitle: chapter.title,
          chapterSummary: chapter.summary,
          subtopics: chapter.subtopics || [],
          position: chapter.position,
          totalChapters: (ebook.chapters || []).length || 5,
          previousChaptersSummary: previousChapters,
          instructions: customInstructions || ebook.instructions,
        },
        aiSettings
      );

      const updatedChapter = updateChapter(chapterId, {
        content: generatedHtml,
        status: 'completed',
      });

      logAIGeneration({
        ebookId: ebook.id,
        chapterId: chapter.id,
        operation: 'generate_chapter',
        status: 'success',
      });

      const allChapters = getEbookById(ebook.id, user.id)?.chapters || [];
      const completedCount = allChapters.filter((c) => c.status === 'completed').length;
      if (completedCount === allChapters.length) {
        updateEbook(ebook.id, user.id, { status: 'editing' });
      } else {
        updateEbook(ebook.id, user.id, { status: 'generating' });
      }

      res.json(updatedChapter);
    } catch (genErr: any) {
      updateChapter(chapterId, { status: 'failed' });
      logAIGeneration({
        ebookId: ebook.id,
        chapterId: chapter.id,
        operation: 'generate_chapter',
        status: 'failed',
        errorMessage: genErr.message,
      });
      throw genErr;
    }
  } catch (err: any) {
    console.error('Chapter generation error:', err);
    res.status(500).json({ error: err.message || 'Gagal menghasilkan konten bab' });
  }
});

// --- WORKFLOW: STEP 4 - AI WRITING ASSISTANT ---
apiRouter.post('/ai/assist', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { action, selectedText, fullChapterText, ebookContext, customInstruction } = req.body;
    if (!action) {
      res.status(400).json({ error: 'Aksi AI wajib disertakan' });
      return;
    }

    const aiSettings = extractAISettings(req, user);
    const result = await aiWritingAssist(
      {
        action,
        selectedText,
        fullChapterText,
        ebookContext,
        customInstruction,
      },
      aiSettings
    );

    res.json(result);
  } catch (err: any) {
    console.error('AI Assist error:', err);
    res.status(500).json({ error: err.message || 'Gagal memproses bantuan AI' });
  }
});

// --- CUSTOM AI SETTINGS & TEST CONNECTION ---
apiRouter.get('/settings/ai', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const settings = getUserAISettings(user.id);
    res.json({
      provider: settings.provider,
      model: settings.model,
      baseUrl: settings.baseUrl || '',
      hasCustomApiKey: !!settings.apiKey,
      temperature: settings.temperature ?? 0.7,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/settings/ai', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { provider, model, baseUrl, apiKey, temperature } = req.body;

    const updated = updateUserAISettings(user.id, {
      provider,
      model,
      baseUrl,
      ...(apiKey ? { apiKey } : {}),
      temperature,
    });

    res.json({
      provider: updated.provider,
      model: updated.model,
      baseUrl: updated.baseUrl || '',
      hasCustomApiKey: !!updated.apiKey,
      temperature: updated.temperature ?? 0.7,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ai/test-connection', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { provider, model, baseUrl, apiKey, temperature } = req.body;

    const currentSettings = getUserAISettings(user.id);
    const keyToUse = apiKey || currentSettings.apiKey;

    const result = await testAIConnection({
      provider: provider || 'gemini',
      model: model || '',
      baseUrl,
      apiKey: keyToUse,
      temperature,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengetes koneksi AI' });
  }
});

// --- COVER PROMPT GENERATION (AI ASSISTANT) ---
apiRouter.post('/ebooks/:id/cover/generate-prompt', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ebook = getEbookById(req.params.id, user.id);
    if (!ebook) {
      res.status(404).json({ error: 'Ebook tidak ditemukan' });
      return;
    }

    const { title, subtitle, tagline, visualStyle } = req.body;
    const aiSettings = extractAISettings(req, user);

    const result = await generateCoverPromptAI(
      {
        title: title || ebook.title,
        subtitle: subtitle !== undefined ? subtitle : ebook.subtitle,
        tagline: tagline !== undefined ? tagline : ebook.coverSettings?.tagline,
        idea: ebook.idea,
        visualStyle: visualStyle as CoverVisualStyle,
      },
      aiSettings
    );

    res.json(result);
  } catch (err: any) {
    console.error('Cover prompt generation error:', err);
    res.status(500).json({ error: err.message || 'Gagal merancang ide prompt cover' });
  }
});

// --- COVER IMAGE GENERATION ---
apiRouter.post('/ebooks/:id/cover/generate-image', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ebook = getEbookById(req.params.id, user.id);
    if (!ebook) {
      res.status(404).json({ error: 'Ebook tidak ditemukan' });
      return;
    }

    const { title, subtitle, tagline, visualStyle, customPrompt, imageSize } = req.body;
    const aiSettings = extractAISettings(req, user);

    const result = await generateCoverImage(
      {
        title: title || ebook.title,
        subtitle: subtitle !== undefined ? subtitle : ebook.subtitle,
        tagline: tagline !== undefined ? tagline : ebook.coverSettings?.tagline,
        idea: ebook.idea,
        visualStyle: visualStyle as CoverVisualStyle,
        customPrompt,
        imageSize,
      },
      aiSettings
    );

    const updatedCoverSettings = {
      ...ebook.coverSettings,
      title: title || ebook.title,
      subtitle: subtitle !== undefined ? subtitle : (ebook.subtitle || ''),
      tagline: tagline !== undefined ? tagline : (ebook.coverSettings?.tagline || ''),
      bgImageUrl: result.imageUrl,
      imagePrompt: result.promptUsed,
      imageStyle: result.styleUsed,
      template: 'ai_generated' as const,
    };

    updateEbook(ebook.id, user.id, {
      coverSettings: updatedCoverSettings,
    });

    logAIGeneration({
      ebookId: ebook.id,
      operation: 'cover_idea',
      status: 'success',
      usageMetadata: { style: result.styleUsed, provider: result.provider },
    });

    res.json({
      imageUrl: result.imageUrl,
      promptUsed: result.promptUsed,
      styleUsed: result.styleUsed,
      provider: result.provider,
      coverSettings: updatedCoverSettings,
    });
  } catch (err: any) {
    console.error('Cover image generation error:', err);
    res.status(500).json({ error: err.message || 'Gagal menghasilkan gambar cover' });
  }
});

// --- COVER IMAGE EDIT WITH NANO BANANA 2.1 ---
apiRouter.post('/ebooks/:id/cover/edit-image', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ebook = getEbookById(req.params.id, user.id);
    if (!ebook) {
      res.status(404).json({ error: 'Ebook tidak ditemukan' });
      return;
    }

    const { imageToEdit, editInstruction, visualStyle, imageSize } = req.body;
    if (!imageToEdit) {
      res.status(400).json({ error: 'Gambar referensi (imageToEdit) wajib disertakan' });
      return;
    }

    const aiSettings = extractAISettings(req, user);

    const result = await generateCoverImage(
      {
        title: ebook.title,
        subtitle: ebook.subtitle,
        visualStyle: visualStyle as CoverVisualStyle,
        imageToEdit,
        editInstruction: editInstruction || 'Modifikasi gambar cover ini dengan komposisi visual yang lebih menarik',
        imageSize,
      },
      aiSettings
    );

    const updatedCoverSettings = {
      ...ebook.coverSettings,
      bgImageUrl: result.imageUrl,
      imagePrompt: result.promptUsed,
      imageStyle: result.styleUsed,
      template: 'ai_generated' as const,
    };

    updateEbook(ebook.id, user.id, {
      coverSettings: updatedCoverSettings,
    });

    logAIGeneration({
      ebookId: ebook.id,
      operation: 'cover_idea',
      status: 'success',
      usageMetadata: { mode: 'edit_image', style: result.styleUsed, provider: result.provider },
    });

    res.json({
      imageUrl: result.imageUrl,
      promptUsed: result.promptUsed,
      styleUsed: result.styleUsed,
      provider: result.provider,
      coverSettings: updatedCoverSettings,
    });
  } catch (err: any) {
    console.error('Cover image edit error:', err);
    res.status(500).json({ error: err.message || 'Gagal memodifikasi gambar cover' });
  }
});

// --- EXPORT HISTORY & STORAGE LOGS ---
apiRouter.get('/ebooks/:id/exports', authMiddleware, (req: Request, res: Response) => {
  try {
    const exportsList = getExportsByEbook(req.params.id);
    res.json(exportsList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ebooks/:id/exports', authMiddleware, (req: Request, res: Response) => {
  try {
    const { format, fileSize, filePath } = req.body;
    const log = logExport({
      ebookId: req.params.id,
      format: format || 'pdf',
      fileSize: fileSize || 0,
      filePath: filePath || '',
      status: 'completed',
    });
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mount router on '/api' and also on root fallback (for Vercel serverless functions)
app.use('/api', apiRouter);
app.use('/', (req: Request, res: Response, next: NextFunction) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/assets') || req.url.includes('.')) {
    return next();
  }
  return apiRouter(req, res, next);
});

export default app;
