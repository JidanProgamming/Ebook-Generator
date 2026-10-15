# Ebook Generator AI (Custom API & Vercel Ready)

Aplikasi generator ebook cerdas dengan dukungan Custom API (Google Gemini, OpenRouter, OpenCode, Codex/OpenAI, Custom OpenAI-Compatible) dan siap dideploy langsung di **Vercel** dengan arsitektur Serverless Functions.

---

## 🚀 Fitur Unggulan

1. **Custom API & Multi-Model AI**:
   - **Google Gemini**: Bawaan Google AI Studio (`gemini-3.8-flash`, `gemini-3.1-pro-preview`, `gemini-nano-banana-2.1`).
   - **OpenRouter**: Hub ribuan model AI (DeepSeek, Llama 3.3, Claude, Mistral, dll.).
   - **Codex / OpenAI**: Model OpenAI standar (`gpt-4o-mini`, dll.).
   - **Custom Endpoint**: Endpoint OpenAI-compatible lokal/cloud (Ollama, vLLM, LM Studio, Groq).
   - **Client-Side Sync**: Kunci API dan endpoint yang diatur di browser otomatis disinkronkan ke serverless function Vercel di setiap request, sehingga tidak wajib menyetel variabel lingkungan server jika pengguna ingin menggunakan kuota API mereka sendiri!

2. **Cover Designer Multi-Engine**:
   - Pembuatan dan pengeditan gambar cover dengan model gambar Gemini Nano Banana 2.1 (`gemini-nano-banana-2.1`) dan Imagen 3.
   - Dukungan Custom AI endpoint untuk generasi gambar.
   - **Procedural Artwork Engine** (Zero-quota fallback): Menghasilkan background cover buku SVG ultra-high-definition beresolusi tinggi jika kuota API habis.

3. **Alur Kerja Penulisan Lengkap**:
   - Step 1: Input Ide & Konsep
   - Step 2: Perancangan Outline & Bab
   - Step 3: Generator Konten per Bab
   - Step 4: Editor Interaktif & AI Writing Assistant (Memperpanjang, memparafrase, merangkum, memperbaiki tata bahasa)
   - Step 5: Cover Designer (AI Prompt Generator, Nano Banana 2.1 & Procedural Art)
   - Step 6: Ekspor Dokumen Multi-Format (PDF, Word / DOCX, HTML, ZIP)

---

## ⚡ Panduan Deploy ke Vercel

### Metode 1: Melalui Dashboard Vercel (Rekomendasi)

1. Push atau import repositori ini ke akun GitHub/GitLab Anda.
2. Di dashboard [Vercel](https://vercel.com), klik **"Add New" > "Project"**.
3. Pilih repositori proyek ini.
4. Vercel akan otomatis mendeteksi:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. (Opsional) Tambahkan **Environment Variables** di menu *Settings > Environment Variables*:
   - `GEMINI_API_KEY`: Kunci API Google AI Studio Anda
   - `OPENROUTER_API_KEY`: (Opsional) Kunci API OpenRouter
   - `CUSTOM_AI_API_KEY`: (Opsional) Kunci API OpenAI/Codex
6. Klik **"Deploy"**. Selesai!

### Metode 2: Melalui Vercel CLI

Buka terminal di direktori proyek dan jalankan:

```bash
# Login ke Vercel
npx vercel login

# Deploy ke production
npx vercel --prod
```

---

## 📂 Struktur Serverless Vercel

- `vercel.json`: Mengatur routing otomatis untuk `/api/*` ke Serverless Function dan file statis frontend ke `dist/`.
- `api/index.ts`: Entry point Vercel Serverless Function yang menjalankan Express API.
- `src/server/app.ts`: Modular backend controller yang menangani seluruh endpoint auth, ebooks, chapters, custom AI, dan cover generator.
- `server.ts`: Entry point server lokal (Node.js/Express + Vite middlewares).

---

## ⚙️ Menjalankan di Komputer Lokal

```bash
# Install dependensi
npm install

# Jalankan development server
npm run dev

# Build untuk produksi
npm run build
```
Buka browser di `http://localhost:3000`.
