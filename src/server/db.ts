import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Chapter, CoverSettings, Ebook, EbookExport, AIGenerationLog, AISettings } from '../types/index.js';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  aiSettings?: AISettings;
  createdAt: string;
}

interface DatabaseSchema {
  profiles: UserRecord[];
  ebooks: Ebook[];
  chapters: Chapter[];
  ebook_exports: EbookExport[];
  ai_generations: AIGenerationLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'ebook_salt_2026').digest('hex');
}

function getDefaultCoverSettings(title: string, author: string = 'Penulis'): CoverSettings {
  return {
    template: 'minimalist',
    title: title || 'Judul Ebook',
    subtitle: 'Panduan Komprehensif & Praktis',
    author: author,
    tagline: 'Edisi Lengkap',
    primaryColor: '#1e3a8a',
    secondaryColor: '#3b82f6',
    textColor: '#ffffff',
    fontFamily: 'serif',
    alignment: 'center',
    showPattern: true,
  };
}

function initializeDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        profiles: parsed.profiles || [],
        ebooks: parsed.ebooks || [],
        chapters: parsed.chapters || [],
        ebook_exports: parsed.ebook_exports || [],
        ai_generations: parsed.ai_generations || [],
      };
    } catch (err) {
      console.error('Error reading existing DB, recreating:', err);
    }
  }

  // Initial seed with demo user
  const demoUserId = 'usr_demo_101';
  const initialData: DatabaseSchema = {
    profiles: [
      {
        id: demoUserId,
        email: 'demo@ebookgenerator.com',
        displayName: 'Demo Creator',
        passwordHash: hashPassword('demo123'),
        createdAt: new Date().toISOString(),
      },
    ],
    ebooks: [
      {
        id: 'ebk_starter_01',
        userId: demoUserId,
        title: 'Mastering AI untuk Kreator Konten',
        subtitle: 'Langkah Praktis Menghasilkan Karya Berkualitas Tinggi',
        idea: 'Panduan praktis bagi kreator digital untuk memanfaatkan AI dalam riset ide, penulisan naskah, dan pembuatan konten visual tanpa kehilangan keaslian suara kreatif mereka.',
        targetAudience: 'Content creator pemula hingga menengah, penulis online, dan pegiat media sosial',
        purpose: 'Memberikan strategi teruji dan alur kerja harian pemanfaatan AI yang efisien dan etis',
        language: 'Bahasa Indonesia',
        tone: 'santai',
        length: 'singkat',
        chapterCount: 3,
        instructions: 'Gunakan contoh nyata media sosial masa kini dan format to-the-point.',
        conceptSummary: 'Buku ini memandu pembaca merancang sistem kreatif berbasis AI yang mempercepat produksi konten hingga 3x lipat.',
        introduction: 'Selamat datang di era kreasi konten modern! Kecerdasan buatan bukan lagi ancaman, melainkan asisten cerdas terbaik Anda. Di buku ini, Anda akan mempelajari bagaimana mengintegrasikan AI ke dalam alur kerja harian tanpa mengorbankan kualitas maupun orisinalitas.',
        conclusion: 'Konsistensi dan sentuhan manusiawi adalah pembeda utama. Jadikan AI sebagai pengungkit kreativitas Anda.',
        status: 'editing',
        coverSettings: {
          template: 'bold_modern',
          title: 'Mastering AI untuk Kreator Konten',
          subtitle: 'Langkah Praktis Menghasilkan Karya Berkualitas Tinggi',
          author: 'Demo Creator',
          tagline: 'Panduan Creator 2026',
          primaryColor: '#0f172a',
          secondaryColor: '#2563eb',
          textColor: '#ffffff',
          fontFamily: 'sans',
          alignment: 'center',
          showPattern: true,
        },
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    chapters: [
      {
        id: 'chp_01',
        ebookId: 'ebk_starter_01',
        title: 'Bab 1: Menemukan Ide yang Tak Pernah Habis',
        summary: 'Menggunakan AI sebagai mitra brainstorming ide konten viral dan riset audiens target.',
        subtopics: ['Riset pain point audiens', 'Prompt efektif untuk brainstorming ide', 'Validasi tren'],
        content: `<h1>Bab 1: Menemukan Ide yang Tak Pernah Habis</h1>
<p>Kreator konten sering kali menghadapi tantangan terbesar yang sama: <em>writer's block</em> atau kehabisan topik segar saat harus posting setiap hari.</p>
<h2>1.1 Mengubah Sudut Pandang terhadap Ide</h2>
<p>Ide bukanlah sesuatu yang harus ditunggu datang dari langit. Ide dapat disintesis dari masalah nyata yang dihadapi oleh audiens Anda. Saat Anda membuka platform seperti YouTube, TikTok, atau LinkedIn, audiens Anda sedang bertanya ratusan pertanyaan di kolom komentar.</p>
<blockquote>Kreator hebat bukan mereka yang punya ide paling jenius, melainkan mereka yang paling konsisten menjawab rasa penasaran audiensnya.</blockquote>
<h2>1.2 Kerangka Prompt Brainstorming 3 Langkah</h2>
<p>Gunakan formula prompt berikut saat meminta bantuan AI:</p>
<ul>
<li><strong>Konteks:</strong> Siapa audiens Anda dan masalah spesifik apa yang mereka hadapi.</li>
<li><strong>Tujuan:</strong> Format konten yang diinginkan (contoh: 5 ide carousel edukatif).</li>
<li><strong>Karakteristik:</strong> Sudut pandang unik yang jarang dibahas orang lain.</li>
</ul>
<h2>1.3 Ringkasan Bab</h2>
<p>Dengan sistem brainstorming yang tepat, Anda tidak akan pernah kehabisan amunisi konten. Simpan ide-ide ini ke dalam bank konten mingguan Anda.</p>`,
        position: 1,
        status: 'completed',
        wordCount: 175,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'chp_02',
        ebookId: 'ebk_starter_01',
        title: 'Bab 2: Menulis Hook yang Menahan Perhatian',
        summary: 'Teknik menyusun 3 detik pertama naskah agar audiens berhenti scrolling.',
        subtopics: ['Psikologi rasa ingin tahu', '5 Formula Hook Teruji', 'Studi Kasus'],
        content: `<h1>Bab 2: Menulis Hook yang Menahan Perhatian</h1>
<p>Di era rentang perhatian yang semakin pendek, hook adalah penentu hidup dan mati sebuah konten. Sebaik apa pun isi konten Anda, tidak ada yang akan membacanya jika kalimat pertamanya membosankan.</p>
<h2>2.1 Anatomi Hook yang Berhasil</h2>
<p>Sebuah hook yang efektif biasanya memenuhi satu dari tiga kriteria ini:</p>
<ol>
<li>Membantah mitos umum yang diyakini banyak orang.</li>
<li>Menyajikan angka atau data kontras yang mengejutkan.</li>
<li>Menyentuh rasa takut kehilangan kesempatan (FOMO) secara relevan.</li>
</ol>
<p>Cobalah menyusun 5 variasi hook untuk setiap naskah yang Anda buat, lalu pilih yang paling tajam.</p>`,
        position: 2,
        status: 'completed',
        wordCount: 110,
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'chp_03',
        ebookId: 'ebk_starter_01',
        title: 'Bab 3: Alur Kerja Harian Menuju Konsistensi',
        summary: 'Membangun rutinitas produksi konten dari riset hingga jadwal posting terjadwal.',
        subtopics: ['Time-blocking untuk kreator', 'Otomasi dan jadwal', 'Evaluasi analitik'],
        content: `<h1>Bab 3: Alur Kerja Harian Menuju Konsistensi</h1>
<p>Konsistensi adalah mata uang paling berharga di dunia digital. Memiliki sistem produksi yang jelas akan mencegah Anda dari kelelahan mental (burnout).</p>
<h2>3.1 Membagi Waktu: Batching vs Daily</h2>
<p>Jangan membuat konten hari ini untuk ditayangkan hari ini. Luangkan satu hari dalam sepekan khusus untuk riset dan penulisan draf sekaligus (batch creation).</p>`,
        position: 3,
        status: 'completed',
        wordCount: 75,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    ebook_exports: [],
    ai_generations: [],
  };

  saveDatabase(initialData);
  return initialData;
}

let dbCache: DatabaseSchema | null = null;

export function getDatabase(): DatabaseSchema {
  if (!dbCache) {
    dbCache = initializeDatabase();
  }
  return dbCache;
}

export function saveDatabase(data: DatabaseSchema): void {
  dbCache = data;
  try {
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// User Helpers
export function findUserByEmail(email: string): UserRecord | undefined {
  const db = getDatabase();
  return db.profiles.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): UserRecord | undefined {
  const db = getDatabase();
  return db.profiles.find((u) => u.id === id);
}

export function createUser(email: string, password: string, displayName: string): UserRecord {
  const db = getDatabase();
  const newUser: UserRecord = {
    id: 'usr_' + crypto.randomUUID().slice(0, 8),
    email: email.toLowerCase().trim(),
    displayName: displayName.trim() || 'Penulis',
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  db.profiles.push(newUser);
  saveDatabase(db);
  return newUser;
}

export function verifyUserPassword(user: UserRecord, password: string): boolean {
  return user.passwordHash === hashPassword(password);
}

export function getUserAISettings(userId: string): AISettings {
  const user = findUserById(userId);
  if (user?.aiSettings) {
    return user.aiSettings;
  }
  return {
    provider: 'gemini',
    model: 'gemini-3.8-flash',
  };
}

export function updateUserAISettings(userId: string, settings: Partial<AISettings>): AISettings {
  const db = getDatabase();
  const user = db.profiles.find((u) => u.id === userId);
  if (!user) {
    throw new Error('User tidak ditemukan');
  }

  const current = user.aiSettings || {
    provider: 'gemini',
    model: 'gemini-3.8-flash',
  };

  const updated: AISettings = {
    ...current,
    ...settings,
  };

  user.aiSettings = updated;
  saveDatabase(db);
  return updated;
}

// Ebook Helpers
export function getEbooksByUserId(userId: string): Ebook[] {
  const db = getDatabase();
  const userEbooks = db.ebooks
    .filter((e) => e.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Attach chapters
  return userEbooks.map((ebook) => {
    const chapters = db.chapters
      .filter((c) => c.ebookId === ebook.id)
      .sort((a, b) => a.position - b.position);
    return { ...ebook, chapters };
  });
}

export function getEbookById(id: string, userId?: string): Ebook | undefined {
  const db = getDatabase();
  const ebook = db.ebooks.find((e) => e.id === id && (!userId || e.userId === userId));
  if (!ebook) return undefined;

  const chapters = db.chapters
    .filter((c) => c.ebookId === ebook.id)
    .sort((a, b) => a.position - b.position);

  return { ...ebook, chapters };
}

export function createEbook(
  userId: string,
  params: {
    title?: string;
    idea: string;
    targetAudience: string;
    purpose: string;
    language: string;
    tone: Ebook['tone'];
    length: Ebook['length'];
    chapterCount: number;
    instructions?: string;
  }
): Ebook {
  const db = getDatabase();
  const id = 'ebk_' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  const user = findUserById(userId);
  const authorName = user ? user.displayName : 'Penulis';

  const newEbook: Ebook = {
    id,
    userId,
    title: params.title || 'Draf Ebook Baru',
    idea: params.idea,
    targetAudience: params.targetAudience,
    purpose: params.purpose,
    language: params.language || 'Bahasa Indonesia',
    tone: params.tone || 'profesional',
    length: params.length || 'sedang',
    chapterCount: params.chapterCount || 5,
    instructions: params.instructions || '',
    status: 'draft',
    coverSettings: getDefaultCoverSettings(params.title || 'Draf Ebook Baru', authorName),
    createdAt: now,
    updatedAt: now,
  };

  db.ebooks.push(newEbook);
  saveDatabase(db);
  return { ...newEbook, chapters: [] };
}

export function updateEbook(
  id: string,
  userId: string,
  updates: Partial<Omit<Ebook, 'id' | 'userId' | 'createdAt'>>
): Ebook | undefined {
  const db = getDatabase();
  const index = db.ebooks.findIndex((e) => e.id === id && e.userId === userId);
  if (index === -1) return undefined;

  const existing = db.ebooks[index];
  const updated: Ebook = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  db.ebooks[index] = updated;
  saveDatabase(db);

  const chapters = db.chapters
    .filter((c) => c.ebookId === id)
    .sort((a, b) => a.position - b.position);

  return { ...updated, chapters };
}

export function deleteEbook(id: string, userId: string): boolean {
  const db = getDatabase();
  const initialLength = db.ebooks.length;
  db.ebooks = db.ebooks.filter((e) => !(e.id === id && e.userId === userId));

  if (db.ebooks.length < initialLength) {
    db.chapters = db.chapters.filter((c) => c.ebookId !== id);
    db.ebook_exports = db.ebook_exports.filter((x) => x.ebookId !== id);
    db.ai_generations = db.ai_generations.filter((a) => a.ebookId !== id);
    saveDatabase(db);
    return true;
  }
  return false;
}

export function duplicateEbook(id: string, userId: string): Ebook | undefined {
  const source = getEbookById(id, userId);
  if (!source) return undefined;

  const db = getDatabase();
  const newId = 'ebk_' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  const duplicatedEbook: Ebook = {
    ...source,
    id: newId,
    title: `${source.title} (Salinan)`,
    createdAt: now,
    updatedAt: now,
    coverSettings: {
      ...source.coverSettings,
      title: `${source.title} (Salinan)`,
    },
  };

  db.ebooks.push(duplicatedEbook);

  const duplicatedChapters: Chapter[] = (source.chapters || []).map((ch) => ({
    ...ch,
    id: 'chp_' + crypto.randomUUID().slice(0, 8),
    ebookId: newId,
    createdAt: now,
    updatedAt: now,
  }));

  db.chapters.push(...duplicatedChapters);
  saveDatabase(db);

  return { ...duplicatedEbook, chapters: duplicatedChapters };
}

// Chapter Helpers
export function createChapter(
  ebookId: string,
  params: {
    title: string;
    summary?: string;
    subtopics?: string[];
    content?: string;
    position?: number;
    status?: Chapter['status'];
  }
): Chapter {
  const db = getDatabase();
  const existingChapters = db.chapters.filter((c) => c.ebookId === ebookId);
  const position = params.position ?? existingChapters.length + 1;
  const now = new Date().toISOString();

  const wordCount = (params.content || '').trim().split(/\s+/).filter(Boolean).length;

  const chapter: Chapter = {
    id: 'chp_' + crypto.randomUUID().slice(0, 8),
    ebookId,
    title: params.title,
    summary: params.summary || '',
    subtopics: params.subtopics || [],
    content: params.content || '',
    position,
    status: params.status || 'pending',
    wordCount,
    createdAt: now,
    updatedAt: now,
  };

  db.chapters.push(chapter);

  // Update ebook updatedAt
  const ebook = db.ebooks.find((e) => e.id === ebookId);
  if (ebook) {
    ebook.updatedAt = now;
  }

  saveDatabase(db);
  return chapter;
}

export function updateChapter(
  id: string,
  updates: Partial<Omit<Chapter, 'id' | 'ebookId' | 'createdAt'>>
): Chapter | undefined {
  const db = getDatabase();
  const index = db.chapters.findIndex((c) => c.id === id);
  if (index === -1) return undefined;

  const existing = db.chapters[index];
  const now = new Date().toISOString();

  let wordCount = existing.wordCount;
  if (updates.content !== undefined) {
    wordCount = updates.content.trim().split(/\s+/).filter(Boolean).length;
  }

  const updated: Chapter = {
    ...existing,
    ...updates,
    wordCount,
    updatedAt: now,
  };

  db.chapters[index] = updated;

  const ebook = db.ebooks.find((e) => e.id === existing.ebookId);
  if (ebook) {
    ebook.updatedAt = now;
  }

  saveDatabase(db);
  return updated;
}

export function deleteChapter(id: string): boolean {
  const db = getDatabase();
  const target = db.chapters.find((c) => c.id === id);
  if (!target) return false;

  const ebookId = target.ebookId;
  db.chapters = db.chapters.filter((c) => c.id !== id);

  // Re-index positions
  const remaining = db.chapters
    .filter((c) => c.ebookId === ebookId)
    .sort((a, b) => a.position - b.position);

  remaining.forEach((c, idx) => {
    c.position = idx + 1;
  });

  const ebook = db.ebooks.find((e) => e.id === ebookId);
  if (ebook) {
    ebook.updatedAt = new Date().toISOString();
  }

  saveDatabase(db);
  return true;
}

export function reorderChapters(ebookId: string, chapterIdsInOrder: string[]): Chapter[] {
  const db = getDatabase();
  chapterIdsInOrder.forEach((id, idx) => {
    const ch = db.chapters.find((c) => c.id === id && c.ebookId === ebookId);
    if (ch) {
      ch.position = idx + 1;
      ch.updatedAt = new Date().toISOString();
    }
  });

  const ebook = db.ebooks.find((e) => e.id === ebookId);
  if (ebook) {
    ebook.updatedAt = new Date().toISOString();
  }

  saveDatabase(db);
  return db.chapters
    .filter((c) => c.ebookId === ebookId)
    .sort((a, b) => a.position - b.position);
}

// AI Generation Logs
export function logAIGeneration(log: Omit<AIGenerationLog, 'id' | 'createdAt'>): void {
  const db = getDatabase();
  db.ai_generations.push({
    id: 'aig_' + crypto.randomUUID().slice(0, 8),
    ...log,
    createdAt: new Date().toISOString(),
  });
  saveDatabase(db);
}

// Exports
export function logExport(exportData: Omit<EbookExport, 'id' | 'createdAt'>): EbookExport {
  const db = getDatabase();
  const record: EbookExport = {
    id: 'exp_' + crypto.randomUUID().slice(0, 8),
    ...exportData,
    createdAt: new Date().toISOString(),
  };
  db.ebook_exports.push(record);
  saveDatabase(db);
  return record;
}

export function getExportsByEbook(ebookId: string): EbookExport[] {
  const db = getDatabase();
  return db.ebook_exports
    .filter((x) => x.ebookId === ebookId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
