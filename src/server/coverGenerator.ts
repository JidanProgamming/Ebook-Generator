import { GoogleGenAI } from '@google/genai';
import { AISettings } from '../types/index.js';

function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
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

import { executeAIPrompt } from './gemini.js';

export type CoverVisualStyle =
  | 'minimalist'
  | '3d_art'
  | 'photorealistic'
  | 'abstract'
  | 'cyber_tech'
  | 'editorial'
  | 'nature_warm';

export interface GenerateCoverParams {
  title: string;
  subtitle?: string;
  tagline?: string;
  idea?: string;
  visualStyle?: CoverVisualStyle;
  customPrompt?: string;
}

export interface GeneratePromptParams {
  title: string;
  subtitle?: string;
  tagline?: string;
  idea?: string;
  visualStyle?: CoverVisualStyle;
}

export interface PromptVariation {
  title: string;
  prompt: string;
  style: CoverVisualStyle;
}

export interface GeneratePromptResult {
  recommendedPrompt: string;
  variations: PromptVariation[];
}

export async function generateCoverPromptAI(
  params: GeneratePromptParams,
  aiSettings?: AISettings
): Promise<GeneratePromptResult> {
  const style = params.visualStyle || 'minimalist';
  const promptInput = `Anda adalah seorang desainer grafis dan art director cover buku profesional berkaliber internasional.
Tugas Anda: Rancang PROMPT IMAGE GENERATION yang sangat detail, memikat, dan spesifik untuk dijadikan gambar latar belakang sampul buku.

Informasi Buku:
- Judul Utama: "${params.title}"
- Subjudul: "${params.subtitle || 'Tidak ada'}"
- Tagline / Badge Edisi: "${params.tagline || 'Tidak ada'}"
- Ide/Topik Buku: "${params.idea || 'Panduan praktis berbobot'}"
- Preferensi Gaya: ${style}

Ketentuan Khusus:
1. Buat prompt dalam Bahasa Inggris yang deskriptif dan kaya (menyebutkan subjek visual simbolis/metafora, pencahayaan, palet warna, atmosfer, dan tekstur).
2. Wajib sertakan instruksi: "vertical portrait 3:4 aspect ratio, clean background artwork only, no text, no letters, no typography, generous negative space for title overlay, 8k resolution, award-winning book jacket art".
3. Buat 1 "recommendedPrompt" utama dan 3 "variations" (alternatif konsep sudut pandang visual berbeda: minimalis, 3D modern, dan sinematik/abstrak).

Balas HANYA dalam format JSON valid:
{
  "recommendedPrompt": "string prompt utama",
  "variations": [
    { "title": "Konsep 1: Minimalis & Elegan", "prompt": "string prompt...", "style": "minimalist" },
    { "title": "Konsep 2: 3D Modern & Futuristik", "prompt": "string prompt...", "style": "3d_art" },
    { "title": "Konsep 3: Sinematik & Atmosferik", "prompt": "string prompt...", "style": "photorealistic" }
  ]
}`;

  try {
    const rawResult = await executeAIPrompt(aiSettings, {
      prompt: promptInput,
      systemInstruction: 'Anda adalah art director perancang prompt gambar cover buku. Keluarkan HANYA JSON valid.',
      jsonMode: true,
    });

    const cleaned = rawResult.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.recommendedPrompt && Array.isArray(parsed.variations)) {
      return {
        recommendedPrompt: parsed.recommendedPrompt,
        variations: parsed.variations,
      };
    }
    return generateFallbackPrompts(params);
  } catch {
    return generateFallbackPrompts(params);
  }
}

function generateFallbackPrompts(params: GeneratePromptParams): GeneratePromptResult {
  const t = params.title;
  const s = params.subtitle ? ` about ${params.subtitle}` : '';
  const tag = params.tagline ? ` with ${params.tagline} theme` : '';

  return {
    recommendedPrompt: `A captivating vertical book cover background art for "${t}"${s}${tag}. Clean modern composition with elegant negative space, harmonious color gradients, dramatic lighting, vertical portrait 3:4 aspect ratio, high resolution, no text, no letters.`,
    variations: [
      {
        title: 'Konsep Minimalis & Simbolis',
        prompt: `Minimalist vertical book cover artwork for "${t}"${s}, refined geometric balance, gentle ambient lighting, luxury editorial palette, ample negative space for title, no text, 8k`,
        style: 'minimalist',
      },
      {
        title: 'Konsep 3D Modern & Berdimensi',
        prompt: `3D octane render book cover background for "${t}", floating smooth geometric shapes, translucent glassmorphism accents, soft depth of field, studio rim lighting, vertical 3:4 portrait, no text`,
        style: '3d_art',
      },
      {
        title: 'Konsep Sinematik & Inspiratif',
        prompt: `Cinematic dramatic landscape background for "${t}"${tag}, atmospheric horizon glow, ethereal clouds, rich color depth, inspiring mood, clean copy space for typography, no text, 8k`,
        style: 'photorealistic',
      },
    ],
  };
}

export async function generateCoverImage(
  params: GenerateCoverParams,
  aiSettings?: AISettings
): Promise<{ imageUrl: string; promptUsed: string; styleUsed: string; provider: 'gemini' | 'generative_art' }> {
  const style = params.visualStyle || 'minimalist';
  const styleKeywords: Record<CoverVisualStyle, string> = {
    minimalist: 'minimalist modern book cover background, elegant negative space, clean typography layout, subtle gradient lighting, sophisticated aesthetic',
    '3d_art': '3D render book cover background, octane render, smooth geometric shapes, glassmorphism, soft ambient shadows, vibrant studio lighting',
    photorealistic: 'cinematic photographic book cover background, dramatic atmosphere, high dynamic range, depth of field, award-winning photography',
    abstract: 'contemporary abstract art book cover background, harmonious fluid color gradients, modern fine art, expressive strokes',
    cyber_tech: 'futuristic dark technology book cover background, glowing cybernetic lines, deep obsidian with neon cyan and emerald, data particles',
    editorial: 'premium editorial magazine book cover art, bauhaus geometry, sophisticated high-end print design, textured canvas',
    nature_warm: 'warm tranquil nature book cover background, serene sunrise golden hour lighting, organic silhouettes, soothing tones',
  };

  const baseDescription = styleKeywords[style] || styleKeywords.minimalist;
  const prompt = params.customPrompt?.trim()
    ? `${params.customPrompt.trim()}, ${baseDescription}, vertical portrait 3:4 book cover background art without text, 8k resolution`
    : `A captivating vertical book cover background for a book titled "${params.title}"${params.subtitle ? ` (${params.subtitle})` : ''}${params.tagline ? ` with badge "${params.tagline}"` : ''}. Visual style: ${baseDescription}. Aesthetic background illustration only, high aesthetic quality, clean portrait aspect ratio.`;

  // 1. Call Google AI Studio Image Generation Model ONLY if custom apiKey is configured
  if (aiSettings?.apiKey) {
    const ai = getGeminiClient(aiSettings.apiKey);
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: prompt,
          config: {
            imageConfig: {
              aspectRatio: '3:4',
            },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p) => p.inlineData && p.inlineData.data);
        if (imagePart && imagePart.inlineData) {
          const mimeType = imagePart.inlineData.mimeType || 'image/png';
          const base64Data = imagePart.inlineData.data;
          return {
            imageUrl: `data:${mimeType};base64,${base64Data}`,
            promptUsed: prompt,
            styleUsed: style,
            provider: 'gemini',
          };
        }
      } catch {
        // Fall through to procedural engine
      }
    }
  }

  // 2. High-Fidelity Procedural Artistic Cover Engine (100% Free, zero-quota dependencies)
  const proceduralSvg = generateProceduralCoverSvg({
    title: params.title,
    subtitle: params.subtitle,
    tagline: params.tagline,
    style,
    customPrompt: params.customPrompt,
  });

  const base64Svg = Buffer.from(proceduralSvg).toString('base64');
  return {
    imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
    promptUsed: prompt,
    styleUsed: style,
    provider: 'generative_art',
  };
}

// Procedural SVG artwork generator matching title & style & prompt
function generateProceduralCoverSvg(params: {
  title: string;
  subtitle?: string;
  tagline?: string;
  style: CoverVisualStyle;
  customPrompt?: string;
}): string {
  // Infer style from custom prompt keywords if specified
  let effectiveStyle = params.style;
  const pLower = (params.customPrompt || '').toLowerCase();
  if (pLower.includes('cyber') || pLower.includes('neon') || pLower.includes('tech') || pLower.includes('code')) {
    effectiveStyle = 'cyber_tech';
  } else if (pLower.includes('3d') || pLower.includes('octane') || pLower.includes('render') || pLower.includes('sphere')) {
    effectiveStyle = '3d_art';
  } else if (pLower.includes('photo') || pLower.includes('cinematic') || pLower.includes('landscape') || pLower.includes('mountain')) {
    effectiveStyle = 'photorealistic';
  } else if (pLower.includes('abstract') || pLower.includes('fluid') || pLower.includes('gradient')) {
    effectiveStyle = 'abstract';
  } else if (pLower.includes('editorial') || pLower.includes('bauhaus') || pLower.includes('magazine')) {
    effectiveStyle = 'editorial';
  } else if (pLower.includes('nature') || pLower.includes('warm') || pLower.includes('sun') || pLower.includes('sunrise')) {
    effectiveStyle = 'nature_warm';
  }

  const w = 900;
  const h = 1200;

  // Color schemes based on visual style
  switch (effectiveStyle) {
    case 'cyber_tech':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <defs>
          <radialGradient id="cyberGlow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.4"/>
            <stop offset="60%" stop-color="#0f172a" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#030712"/>
          </radialGradient>
          <linearGradient id="neonLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="50%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
          <pattern id="grid" width="45" height="45" patternUnits="userSpaceOnUse">
            <path d="M 45 0 L 0 0 0 45" fill="none" stroke="#1e293b" stroke-width="1.2" stroke-opacity="0.6"/>
          </pattern>
        </defs>
        <rect width="${w}" height="${h}" fill="#030712"/>
        <rect width="${w}" height="${h}" fill="url(#cyberGlow)"/>
        <rect width="${w}" height="${h}" fill="url(#grid)"/>
        <g opacity="0.6">
          <circle cx="450" cy="480" r="260" fill="none" stroke="url(#neonLine)" stroke-width="3" stroke-dasharray="8 12"/>
          <circle cx="450" cy="480" r="180" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-opacity="0.5"/>
          <circle cx="450" cy="480" r="340" fill="none" stroke="#3b82f6" stroke-width="1" stroke-opacity="0.3"/>
          <path d="M150 480 H750 M450 180 V780" stroke="#06b6d4" stroke-width="0.8" stroke-opacity="0.3"/>
        </g>
        <g fill="none" stroke="url(#neonLine)" stroke-width="2" opacity="0.4">
          <polygon points="450,280 620,380 620,580 450,680 280,580 280,380"/>
        </g>
        <rect x="0" y="800" width="${w}" height="400" fill="url(#neonLine)" opacity="0.08"/>
      </svg>`;

    case '3d_art':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <defs>
          <linearGradient id="bg3d" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="50%" stop-color="#312e81"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <radialGradient id="sphere1" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#f43f5e"/>
            <stop offset="60%" stop-color="#881337"/>
            <stop offset="100%" stop-color="#4c0519"/>
          </radialGradient>
          <radialGradient id="sphere2" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="70%" stop-color="#1d4ed8"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </radialGradient>
          <radialGradient id="sphere3" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="80%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#78350f"/>
          </radialGradient>
          <filter id="glass" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18"/>
          </filter>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#bg3d)"/>
        <!-- Ambient orbs -->
        <circle cx="700" cy="280" r="160" fill="url(#sphere1)" opacity="0.8"/>
        <circle cx="240" cy="520" r="210" fill="url(#sphere2)" opacity="0.85"/>
        <circle cx="620" cy="740" r="130" fill="url(#sphere3)" opacity="0.75"/>
        <!-- Torus / Geometric rings -->
        <ellipse cx="450" cy="460" rx="320" ry="140" fill="none" stroke="#e0e7ff" stroke-width="4" stroke-opacity="0.3" transform="rotate(-25 450 460)"/>
        <ellipse cx="450" cy="460" rx="260" ry="100" fill="none" stroke="#f43f5e" stroke-width="2" stroke-opacity="0.4" transform="rotate(-25 450 460)"/>
      </svg>`;

    case 'photorealistic':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#090d16"/>
            <stop offset="40%" stop-color="#1e293b"/>
            <stop offset="70%" stop-color="#c2410c"/>
            <stop offset="100%" stop-color="#f97316"/>
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="65%" r="45%">
            <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9"/>
            <stop offset="40%" stop-color="#f97316" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#skyGrad)"/>
        <circle cx="450" cy="620" r="180" fill="url(#sunGlow)"/>
        <!-- Mountain Layers -->
        <path d="M0,720 L180,630 L360,680 L520,590 L700,670 L900,610 L900,1200 L0,1200 Z" fill="#0f172a" opacity="0.9"/>
        <path d="M0,780 L220,700 L440,750 L640,680 L820,740 L900,720 L900,1200 L0,1200 Z" fill="#020617"/>
        <circle cx="320" cy="240" r="2.5" fill="#ffffff" opacity="0.8"/>
        <circle cx="580" cy="180" r="2" fill="#ffffff" opacity="0.7"/>
        <circle cx="740" cy="260" r="3" fill="#ffffff" opacity="0.9"/>
        <circle cx="160" cy="320" r="2.5" fill="#ffffff" opacity="0.6"/>
      </svg>`;

    case 'abstract':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <defs>
          <linearGradient id="abs1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4f46e5"/>
            <stop offset="50%" stop-color="#9333ea"/>
            <stop offset="100%" stop-color="#ec4899"/>
          </linearGradient>
          <linearGradient id="abs2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="#0f172a"/>
        <path d="M-100,200 C200,50 400,450 700,300 C900,200 1000,500 1000,800 L-100,1200 Z" fill="url(#abs1)" opacity="0.8"/>
        <path d="M-50,600 C300,500 500,800 800,650 C1000,550 950,900 950,1200 L-50,1200 Z" fill="url(#abs2)" opacity="0.6"/>
        <circle cx="450" cy="420" r="160" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-opacity="0.35"/>
        <circle cx="450" cy="420" r="210" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.2"/>
      </svg>`;

    case 'editorial':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <defs>
          <linearGradient id="editBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#18181b"/>
            <stop offset="100%" stop-color="#09090b"/>
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#editBg)"/>
        <!-- Framing Border -->
        <rect x="40" y="40" width="${w - 80}" height="${h - 80}" fill="none" stroke="#3f3f46" stroke-width="1.5"/>
        <rect x="55" y="55" width="${w - 110}" height="${h - 110}" fill="none" stroke="#27272a" stroke-width="1"/>
        <!-- Bauhaus color blocks -->
        <rect x="120" y="220" width="280" height="340" fill="#dc2626" opacity="0.85"/>
        <circle cx="580" cy="440" r="160" fill="#d97706" opacity="0.85"/>
        <path d="M420,540 L740,540 L580,780 Z" fill="#2563eb" opacity="0.75"/>
        <line x1="80" y1="840" x2="820" y2="840" stroke="#52525b" stroke-width="2"/>
      </svg>`;

    case 'nature_warm':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <defs>
          <linearGradient id="warmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#451a03"/>
            <stop offset="40%" stop-color="#78350f"/>
            <stop offset="80%" stop-color="#b45309"/>
            <stop offset="100%" stop-color="#1c1917"/>
          </linearGradient>
          <radialGradient id="warmSun" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.8"/>
            <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#78350f" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#warmGrad)"/>
        <circle cx="450" cy="400" r="220" fill="url(#warmSun)"/>
        <ellipse cx="450" cy="620" rx="360" ry="120" fill="#292524" opacity="0.8"/>
        <ellipse cx="450" cy="740" rx="420" ry="160" fill="#1c1917"/>
      </svg>`;

    case 'minimalist':
    default:
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <defs>
          <linearGradient id="minGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="50%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
          <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#minGrad)"/>
        <!-- Thin geometric elegance -->
        <rect x="45" y="45" width="${w - 90}" height="${h - 90}" fill="none" stroke="#334155" stroke-width="1.5" rx="8"/>
        <circle cx="450" cy="460" r="220" fill="none" stroke="url(#goldAccent)" stroke-width="2.5" opacity="0.7"/>
        <circle cx="450" cy="460" r="140" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="6 8" opacity="0.5"/>
        <path d="M250,460 H650" stroke="url(#goldAccent)" stroke-width="1.5" opacity="0.6"/>
        <circle cx="450" cy="460" r="10" fill="url(#goldAccent)"/>
        <!-- Soft background wave -->
        <path d="M0,850 Q225,780 450,850 T900,850 L900,1200 L0,1200 Z" fill="#020617" opacity="0.6"/>
      </svg>`;
  }
}
