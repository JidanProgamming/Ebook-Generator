export type EbookStatus = 
  | 'draft' 
  | 'outline_ready' 
  | 'generating' 
  | 'editing' 
  | 'ready_to_export' 
  | 'completed';

export type ChapterStatus = 'pending' | 'generating' | 'completed' | 'failed';

export type EbookTone = 
  | 'santai' 
  | 'profesional' 
  | 'akademik' 
  | 'storytelling' 
  | 'persuasif';

export type EbookLength = 'singkat' | 'sedang' | 'mendalam';

export type AIProvider = 'gemini' | 'openrouter' | 'opencode' | 'codex' | 'custom';

export interface AISettings {
  provider: AIProvider;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  aiSettings?: AISettings;
  createdAt: string;
}

export interface CoverSettings {
  template?: 'minimalist' | 'editorial' | 'bold_modern' | 'dark_tech' | 'elegant_gradient' | 'warm_creative' | 'ai_generated';
  title: string;
  subtitle?: string;
  author: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  fontFamily: 'sans' | 'serif' | 'display' | 'mono';
  alignment: 'left' | 'center' | 'right';
  bgImageUrl?: string;
  imagePrompt?: string;
  imageStyle?: string;
  imageResolution?: '1K' | '2K' | '4K';
  editInstruction?: string;
  overlayOpacity?: number;
  showPattern?: boolean;
}

export interface Chapter {
  id: string;
  ebookId: string;
  title: string;
  summary: string;
  subtopics?: string[];
  content: string;
  position: number;
  status: ChapterStatus;
  wordCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ebook {
  id: string;
  userId: string;
  title: string;
  subtitle?: string;
  idea: string;
  targetAudience: string;
  purpose: string;
  language: string;
  tone: EbookTone;
  length: EbookLength;
  chapterCount: number;
  instructions?: string;
  conceptSummary?: string;
  introduction?: string;
  conclusion?: string;
  status: EbookStatus;
  coverSettings: CoverSettings;
  createdAt: string;
  updatedAt: string;
  chapters?: Chapter[];
}

export interface EbookExport {
  id: string;
  ebookId: string;
  format: 'pdf' | 'docx' | 'epub' | 'markdown';
  filePath?: string;
  fileSize?: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface AIGenerationLog {
  id: string;
  ebookId: string;
  chapterId?: string;
  operation: 'generate_outline' | 'generate_chapter' | 'ai_assist' | 'cover_idea';
  status: 'success' | 'failed';
  usageMetadata?: any;
  errorMessage?: string;
  createdAt: string;
}

export type AIAssistAction = 
  | 'improve' 
  | 'fix_grammar' 
  | 'rewrite' 
  | 'expand' 
  | 'summarize' 
  | 'change_tone' 
  | 'simplify' 
  | 'continue_writing';

export interface AIAssistRequest {
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
}

export interface AIAssistResponse {
  resultText: string;
  explanation: string;
}

export interface OutlineGeneratedChapter {
  title: string;
  summary: string;
  subtopics: string[];
}

export interface OutlineResult {
  title: string;
  subtitle: string;
  conceptSummary: string;
  introduction: string;
  conclusion: string;
  chapters: OutlineGeneratedChapter[];
  faqOrGlossary?: { term: string; explanation: string }[];
}
