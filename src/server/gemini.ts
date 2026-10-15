import { GoogleGenAI } from '@google/genai';
import { AIAssistAction, AIAssistResponse, AISettings, OutlineResult } from '../types/index.js';

function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Universal AI Caller supporting Gemini, OpenRouter, OpenCode, Codex, and Custom OpenAI-compatible endpoints
export async function executeAIPrompt(
  settings: AISettings | undefined,
  options: {
    prompt: string;
    systemInstruction?: string;
    jsonMode?: boolean;
  }
): Promise<string> {
  const provider = settings?.provider || 'gemini';

  // 1. Google Gemini Provider
  if (provider === 'gemini') {
    const ai = getGeminiClient(settings?.apiKey);
    if (!ai) {
      throw new Error('Gemini API key tidak ditemukan.');
    }

    const modelName = settings?.model?.trim() || 'gemini-3.8-flash';
    const config: any = {
      systemInstruction: options.systemInstruction,
    };
    if (options.jsonMode) {
      config.responseMimeType = 'application/json';
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: options.prompt,
      config,
    });

    return (response.text || '').trim();
  }

  // 2. OpenRouter, OpenCode, Codex, or Custom OpenAI-Compatible Endpoints
  let endpoint = settings?.baseUrl?.trim();
  let defaultModel = 'gpt-4o-mini';
  let defaultKey = process.env.CUSTOM_AI_API_KEY || '';

  if (provider === 'openrouter') {
    endpoint = endpoint || 'https://openrouter.ai/api/v1';
    defaultModel = 'google/gemini-2.0-flash-001';
    defaultKey = process.env.OPENROUTER_API_KEY || '';
  } else if (provider === 'opencode') {
    endpoint = endpoint || 'https://api.openai.com/v1';
    defaultModel = 'opencode-v1';
  } else if (provider === 'codex') {
    endpoint = endpoint || 'https://api.openai.com/v1';
    defaultModel = 'code-davinci-002';
  } else {
    endpoint = endpoint || 'https://api.openai.com/v1';
  }

  // Ensure endpoint ends with /chat/completions if only base URL provided
  if (!endpoint.endsWith('/chat/completions')) {
    endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
  }

  const apiKey = settings?.apiKey || defaultKey;
  const model = settings?.model?.trim() || defaultModel;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://ai.google.dev';
    headers['X-Title'] = 'Ebook Generator AI';
  }

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }
  messages.push({ role: 'user', content: options.prompt });

  const payload: any = {
    model,
    messages,
    temperature: settings?.temperature ?? 0.7,
  };

  if (options.jsonMode && provider !== 'codex') {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status}: Gagal menghubungi endpoint API`;
    throw new Error(errorMsg);
  }

  const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
  if (!content) {
    throw new Error('Respons kosong dari penyedia model.');
  }

  return content.trim();
}

// Test connection endpoint for user settings
export async function testAIConnection(settings: AISettings): Promise<{ success: boolean; message: string; modelUsed: string }> {
  try {
    const testPrompt = 'Keluarkan jawaban singkat dalam format JSON: {"status":"success","message":"Koneksi API berhasil!"}';
    const rawResult = await executeAIPrompt(settings, {
      prompt: testPrompt,
      systemInstruction: 'Anda adalah tester koneksi API. Balas dalam format JSON yang valid.',
      jsonMode: true,
    });

    return {
      success: true,
      message: 'Koneksi ke API berhasil diverifikasi!',
      modelUsed: settings.model || (settings.provider === 'gemini' ? 'gemini-3.8-flash' : 'default'),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Koneksi gagal. Periksa endpoint dan kredensial Anda.',
      modelUsed: settings.model || 'unknown',
    };
  }
}

// Outline Generator
export async function generateOutlineAI(
  params: {
    idea: string;
    title?: string;
    targetAudience: string;
    purpose: string;
    language: string;
    tone: string;
    length: string;
    chapterCount: number;
    instructions?: string;
  },
  aiSettings?: AISettings
): Promise<OutlineResult> {
  const prompt = `Anda adalah seorang penerbit dan ghostwriter profesional terkemuka dengan keahlian menghasilkan ebook berkualitas tinggi dan diminati pasar.
Buat outline terstruktur dan komprehensif untuk ebook berikut:

- Topik/Ide Utama: ${params.idea}
- Judul yang Diinginkan (jika ada): ${params.title || 'Buatkan judul terbaik yang memikat dan menjual'}
- Target Pembaca: ${params.targetAudience}
- Tujuan Ebook: ${params.purpose}
- Bahasa: ${params.language}
- Gaya Bahasa (Tone): ${params.tone}
- Kedalaman Materi: ${params.length}
- Jumlah Bab yang Diharapkan: ${params.chapterCount} bab
- Instruksi Tambahan: ${params.instructions || 'Tidak ada'}

Pastikan bab-bab disusun secara logis dan runtut (alur pembelajaran dari pengenalan, pemahaman inti, aksi/penerapan, studi kasus, hingga penutup).
Setiap bab harus memiliki ringkasan tujuan dan daftar 3-4 subbab spesifik.

Keluarkan dalam format JSON terstruktur yang ketat dengan skema:
{
  "title": "Judul Ebook yang menarik, menjual, dan relevan",
  "subtitle": "Subjudul yang memperjelas nilai tambah buku bagi pembaca",
  "conceptSummary": "Ringkasan konsep buku dalam 2-3 kalimat",
  "introduction": "Draf pembuka atau kata pengantar yang menyentuh pain point audiens",
  "conclusion": "Garis besar kesimpulan akhir dan pesan inspiratif untuk pembaca",
  "chapters": [
    {
      "title": "Bab 1: Judul Bab",
      "summary": "Tujuan dan poin penting yang akan dipelajari di bab ini",
      "subtopics": ["Subbab 1.1", "Subbab 1.2", "Subbab 1.3"]
    }
  ],
  "faqOrGlossary": [
    {
      "term": "Istilah Kunci",
      "explanation": "Penjelasan ringkas dan aplikatif"
    }
  ]
}`;

  try {
    const rawText = await executeAIPrompt(aiSettings, {
      prompt,
      systemInstruction: 'Anda adalah konsultan penerbitan buku dan perancang kurikulum ebook profesional. Berikan respons HANYA berupa JSON yang valid tanpa teks pembuka/penutup.',
      jsonMode: true,
    });

    const cleanedText = rawText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    if (!parsed.chapters || !Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
      throw new Error('Invalid outline generated');
    }

    return parsed as OutlineResult;
  } catch (err) {
    console.error('Error generating outline with active AI provider, using fallback:', err);
    return generateFallbackOutline(params);
  }
}

// Chapter Content Generator
export async function generateChapterContentAI(
  params: {
    ebookTitle: string;
    targetAudience: string;
    purpose: string;
    language: string;
    tone: string;
    chapterTitle: string;
    chapterSummary: string;
    subtopics: string[];
    position: number;
    totalChapters: number;
    previousChaptersSummary?: string;
    instructions?: string;
  },
  aiSettings?: AISettings
): Promise<string> {
  const prompt = `Anda adalah penulis buku profesional dan spesialis materi edukatif. Tuliskan naskah LENGKAP untuk satu bab ebook dengan standar penerbitan terbaik.

Konteks Buku:
- Judul Ebook: ${params.ebookTitle}
- Target Pembaca: ${params.targetAudience}
- Tujuan Ebook: ${params.purpose}
- Bahasa: ${params.language}
- Gaya Bahasa (Tone): ${params.tone}
- Posisi Bab: Bab ${params.position} dari ${params.totalChapters} bab
- Ringkasan Bab Sebelumnya: ${params.previousChaptersSummary || 'Ini adalah bab awal'}

Materi Bab yang Harus Ditulis:
- Judul Bab: ${params.chapterTitle}
- Ringkasan Tujuan Bab: ${params.chapterSummary}
- Subbab / Poin Utama yang Harus Dibahas:
${params.subtopics.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

Instruksi Penulisan:
1. Format output menggunakan format HTML rapi yang siap ditampilkan di rich text editor (gunakan tag <h1> untuk judul bab, <h2> untuk subbab, <p> untuk paragraf, <blockquote> untuk kutipan/highlight inspiratif, <ul> atau <ol> untuk poin praktis atau langkah-langkah).
2. Tulis naskah secara mendalam, jelas, dan mengalir enak dibaca (hindari kalimat kaku atau sekadar daftar pendek).
3. Sertakan contoh nyata, analogi sederhana, panduan langkah demi langkah (step-by-step), dan tips pencegahan kesalahan umum.
4. Jangan mengulang penjelasan dari bab sebelumnya. Pertahankan konsistensi gaya bahasa dan sapaan target pembaca.
5. Akhiri bab dengan subbab "Rangkuman Bab & Langkah Aksi" yang memberi tugas praktis atau refleksi bagi pembaca.
${params.instructions ? `6. Instruksi khusus tambahan: ${params.instructions}` : ''}

Tulis naskah bab ini sekarang:`;

  try {
    const content = await executeAIPrompt(aiSettings, {
      prompt,
      systemInstruction: 'Anda adalah penulis buku non-fiksi berkaliber internasional yang ahli dalam menyajikan wawasan berbobot dengan gaya bahasa yang memikat, runtut, dan mudah diterapkan.',
      jsonMode: false,
    });

    if (!content) {
      throw new Error('Empty response from model');
    }

    return content;
  } catch (err) {
    console.error(`Error generating chapter ${params.position} with active AI provider:`, err);
    return generateFallbackChapterContent(params);
  }
}

// AI Writing Assistant
export async function aiWritingAssist(
  params: {
    action: AIAssistAction;
    selectedText?: string;
    fullChapterText?: string;
    ebookContext?: {
      title: string;
      targetAudience: string;
      tone: string;
      chapterTitle: string;
    };
    customInstruction?: string;
  },
  aiSettings?: AISettings
): Promise<AIAssistResponse> {
  const textToProcess = (params.selectedText || params.fullChapterText || '').trim();
  if (!textToProcess) {
    return {
      resultText: '',
      explanation: 'Tidak ada teks yang dipilih untuk diproses.',
    };
  }

  const actionInstructions: Record<AIAssistAction, string> = {
    improve: 'Tingkatkan kualitas penulisan agar lebih memikat, mengalir halus, memiliki kosakata yang kaya, dan lebih berdampak pada pembaca.',
    fix_grammar: 'Perbaiki tata bahasa, ejaan, tanda baca, dan kesalahan tipografi tanpa mengubah esensi dan maksud asli teks.',
    rewrite: 'Tulis ulang teks ini dengan struktur kalimat yang segar, variatif, dan dinamis, menjadikannya lebih mudah dipahami.',
    expand: 'Kembangkan dan perdalam isi teks ini dengan menambahkan detail penjelasan, contoh konkret yang relevan, serta langkah aplikatif.',
    summarize: 'Rangkum teks ini menjadi intisari yang ringkas, tajam, dan mudah diingat oleh pembaca.',
    change_tone: `Sesuaikan gaya bahasa teks ini menjadi lebih sesuai dengan tone: ${params.ebookContext?.tone || 'profesional'} dan target pembaca ${params.ebookContext?.targetAudience || 'umum'}.`,
    simplify: 'Sederhanakan teks ini agar sangat mudah dipahami oleh pemula, gunakan bahasa bersahabat dan analogi sederhana.',
    continue_writing: 'Lanjutkan penulisan dari paragraf terakhir ini secara alami, konsisten dengan alur berpikir dan gaya penulisannya.',
  };

  const prompt = `Anda adalah asisten editor naskah dan writing coach profesional.
Lakukan tugas berikut pada teks yang diberikan:

Tindakan: ${actionInstructions[params.action]}
${params.customInstruction ? `Instruksi Khusus dari Penulis: ${params.customInstruction}` : ''}

Konteks Buku:
- Judul Ebook: ${params.ebookContext?.title || 'Umum'}
- Bab: ${params.ebookContext?.chapterTitle || 'Bab'}
- Target Pembaca: ${params.ebookContext?.targetAudience || 'Umum'}
- Gaya Bahasa: ${params.ebookContext?.tone || 'profesional'}

Teks Asli:
"""
${textToProcess}
"""

Format Respons:
Berikan output dalam JSON dengan format:
{
  "resultText": "Teks hasil revisi lengkap (pertahankan format HTML jika teks asli menggunakan HTML seperti <p>, <h2>, <ul>, dsb)",
  "explanation": "Penjelasan singkat dalam 1-2 kalimat mengenai apa saja perbaikan atau penyesuaian yang dilakukan"
}`;

  try {
    const rawResult = await executeAIPrompt(aiSettings, {
      prompt,
      systemInstruction: 'Anda adalah asisten editor naskah. Berikan respons HANYA dalam JSON yang valid.',
      jsonMode: true,
    });

    const parsed = JSON.parse(rawResult.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim());
    return {
      resultText: parsed.resultText || textToProcess,
      explanation: parsed.explanation || 'Revisi berhasil diselesaikan.',
    };
  } catch (err) {
    console.error('AI Writing Assist error:', err);
    return {
      resultText: textToProcess,
      explanation: 'Gagal memproses bantuan AI saat ini. Silakan coba kembali.',
    };
  }
}

// Fallback Generators
function generateFallbackOutline(params: {
  idea: string;
  title?: string;
  targetAudience: string;
  purpose: string;
  language: string;
  tone: string;
  length: string;
  chapterCount: number;
}): OutlineResult {
  const count = Math.max(3, Math.min(params.chapterCount || 5, 10));
  const bookTitle = params.title || `Panduan Praktis: ${params.idea.slice(0, 45)}`;

  const chapters: OutlineResult['chapters'] = [];
  const titles = [
    'Fondasi Utama dan Pemahaman Dasar',
    'Menemukan Strategi dan Pendekatan Efektif',
    'Langkah-Langkah Implementasi Praktis',
    'Mengatasi Kendala dan Solusi Nyata',
    'Optimasi, Scaling, dan Hasil Jangka Panjang',
    'Studi Kasus Nyata dan Pembelajaran Kunci',
    'Alat Bantu, Otomasi, dan Tips Efisiensi',
    'Roadmap Aksi Menuju Keberhasilan Mandiri',
  ];

  for (let i = 0; i < count; i++) {
    const titleName = titles[i] || `Eksplorasi Mendalam Bagian ${i + 1}`;
    chapters.push({
      title: `Bab ${i + 1}: ${titleName}`,
      summary: `Membahas prinsip kunci dan panduan langsung mengenai ${titleName.toLowerCase()} untuk ${params.targetAudience}.`,
      subtopics: [
        `Pengenalan ${titleName.toLowerCase()}`,
        `Strategi eksekusi bertahap`,
        `Kesalahan umum yang harus dihindari`,
        `Langkah aksi mandiri`,
      ],
    });
  }

  return {
    title: bookTitle,
    subtitle: `Solusi Nyata dan Strategi Teruji untuk ${params.targetAudience}`,
    conceptSummary: `Ebook ini dirancang khusus untuk mewujudkan tujuan: ${params.purpose}, dengan menyajikan materi terstruktur dari dasar hingga mahir.`,
    introduction: `Selamat datang di buku ini! Di tengah derasnya informasi saat ini, menemukan panduan yang terarah, praktis, dan dapat langsung dipraktikkan adalah sebuah kebutuhan mendesak. Buku ini hadir untuk menemani perjalanan Anda.`,
    conclusion: `Perjalanan Anda tidak berakhir saat membaca halaman terakhir buku ini. Kunci utama keberhasilan adalah konsistensi tindakan kecil setiap hari. Mulailah dari langkah pertama hari ini.`,
    chapters,
    faqOrGlossary: [
      {
        term: 'Prinsip Pareto 80/20',
        explanation: 'Fokus pada 20% upaya terpenting yang menghasilkan 80% dampak terbesar.',
      },
      {
        term: 'Iterasi Bertahap',
        explanation: 'Menerapkan perbaikan terus-menerus tanpa menunggu kesempurnaan di awal.',
      },
    ],
  };
}

function generateFallbackChapterContent(params: {
  chapterTitle: string;
  chapterSummary: string;
  subtopics: string[];
  position: number;
  totalChapters: number;
}): string {
  return `<h1>${params.chapterTitle}</h1>
<p>${params.chapterSummary}</p>
<p>Dalam bab ini, kita akan membahas secara mendalam bagaimana menerapkan langkah-langkah nyata yang dirancang untuk memberikan hasil terukur. Setiap bagian disusun berurutan agar Anda dapat mengikutinya dengan mudah.</p>

${params.subtopics
  .map(
    (sub, idx) => `<h2>${params.position}.${idx + 1} ${sub}</h2>
<p>Memahami <strong>${sub}</strong> merupakan fondasi esensial. Banyak orang sering kali melewatkan aspek penting ini karena terburu-buru menginginkan hasil instan.</p>
<blockquote>Keberhasilan yang berkelanjutan dibangun di atas pemahaman yang kuat dan eksekusi yang konsisten.</blockquote>
<p>Berikut adalah 3 hal utama yang perlu Anda perhatikan:</p>
<ul>
<li><strong>Fokus pada Kualitas:</strong> Luangkan waktu untuk menguji setiap konsep dalam lingkungan kerja nyata Anda.</li>
<li><strong>Evaluasi Berkala:</strong> Catat metrik dan kemajuan yang Anda peroleh setiap pekan.</li>
<li><strong>Penyesuaian Adaptif:</strong> Lakukan perbaikan kecil secara konstan berdasarkan respons yang Anda terima.</li>
</ul>`
  )
  .join('\n')}

<h2>${params.position}.${params.subtopics.length + 1} Rangkuman Bab & Aksi Nyata</h2>
<p>Sebagai rangkuman, Anda telah mempelajari poin-poin utama dalam bab ini. Sekarang giliran Anda mengambil tindakan nyata:</p>
<ol>
<li>Pilih satu konsep dari bab ini yang paling mendesak untuk situasi Anda saat ini.</li>
<li>Terapkan dalam 24 jam ke depan untuk membuktikan dampaknya.</li>
<li>Simpan catatan evaluasi Anda sebelum melanjutkan ke bab berikutnya.</li>
</ol>`;
}
