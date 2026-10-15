import {
  AIAssistRequest,
  AIAssistResponse,
  Chapter,
  Ebook,
  EbookExport,
  OutlineResult,
  UserProfile,
} from '../types/index.js';

const TOKEN_KEY = 'ebook_auth_token';
const USER_KEY = 'ebook_user_profile';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Terjadi kesalahan (${response.status})`);
  }

  return data as T;
}

// Auth API
export const authApi = {
  async register(email: string, password: string, displayName: string) {
    const res = await request<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    setAuthToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async login(email: string, password: string) {
    const res = await request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async getMe(): Promise<UserProfile> {
    const user = await request<UserProfile>('/api/auth/me');
    setStoredUser(user);
    return user;
  },

  logout() {
    clearAuth();
  },
};

// Ebook API
export const ebookApi = {
  async getAll(): Promise<Ebook[]> {
    return request<Ebook[]>('/api/ebooks');
  },

  async getById(id: string): Promise<Ebook> {
    return request<Ebook>(`/api/ebooks/${id}`);
  },

  async create(data: {
    title?: string;
    idea: string;
    targetAudience: string;
    purpose: string;
    language: string;
    tone: string;
    length: string;
    chapterCount: number;
    instructions?: string;
  }): Promise<Ebook> {
    return request<Ebook>('/api/ebooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, updates: Partial<Ebook>): Promise<Ebook> {
    return request<Ebook>(`/api/ebooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/ebooks/${id}`, {
      method: 'DELETE',
    });
  },

  async duplicate(id: string): Promise<Ebook> {
    return request<Ebook>(`/api/ebooks/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async generateOutline(
    id: string,
    customInstructions?: string
  ): Promise<{ ebook: Ebook; outlineResult: OutlineResult; chapters: Chapter[] }> {
    return request(`/api/ebooks/${id}/outline`, {
      method: 'POST',
      body: JSON.stringify({ customInstructions }),
    });
  },

  async generateCoverPrompt(
    id: string,
    data: {
      title: string;
      subtitle?: string;
      tagline?: string;
      visualStyle?: string;
    }
  ): Promise<{
    recommendedPrompt: string;
    variations: { title: string; prompt: string; style: string }[];
  }> {
    return request(`/api/ebooks/${id}/cover/generate-prompt`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateCoverImage(
    id: string,
    data: {
      title: string;
      subtitle?: string;
      tagline?: string;
      visualStyle?: string;
      customPrompt?: string;
    }
  ): Promise<{
    imageUrl: string;
    promptUsed: string;
    styleUsed: string;
    provider: string;
    coverSettings: any;
  }> {
    return request(`/api/ebooks/${id}/cover/generate-image`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Chapter operations
  async addChapter(
    ebookId: string,
    data: { title: string; summary?: string; subtopics?: string[]; content?: string; position?: number }
  ): Promise<Chapter> {
    return request<Chapter>(`/api/ebooks/${ebookId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateChapter(chapterId: string, updates: Partial<Chapter>): Promise<Chapter> {
    return request<Chapter>(`/api/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteChapter(chapterId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/chapters/${chapterId}`, {
      method: 'DELETE',
    });
  },

  async reorderChapters(ebookId: string, chapterIds: string[]): Promise<Chapter[]> {
    return request<Chapter[]>(`/api/ebooks/${ebookId}/chapters/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ chapterIds }),
    });
  },

  async generateChapter(chapterId: string, customInstructions?: string): Promise<Chapter> {
    return request<Chapter>(`/api/chapters/${chapterId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ customInstructions }),
    });
  },

  // AI Assist
  async aiAssist(params: AIAssistRequest): Promise<AIAssistResponse> {
    return request<AIAssistResponse>('/api/ai/assist', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Exports
  async getExports(ebookId: string): Promise<EbookExport[]> {
    return request<EbookExport[]>(`/api/ebooks/${ebookId}/exports`);
  },

  async logExport(
    ebookId: string,
    data: { format: string; fileSize?: number; filePath?: string }
  ): Promise<EbookExport> {
    return request<EbookExport>(`/api/ebooks/${ebookId}/exports`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// AI Settings API
export const settingsApi = {
  async getAISettings(): Promise<{
    provider: string;
    model: string;
    baseUrl: string;
    hasCustomApiKey: boolean;
    temperature: number;
  }> {
    return request('/api/settings/ai');
  },

  async updateAISettings(data: {
    provider: string;
    model: string;
    baseUrl?: string;
    apiKey?: string;
    temperature?: number;
  }): Promise<{
    provider: string;
    model: string;
    baseUrl: string;
    hasCustomApiKey: boolean;
    temperature: number;
  }> {
    return request('/api/settings/ai', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async testConnection(data: {
    provider: string;
    model: string;
    baseUrl?: string;
    apiKey?: string;
    temperature?: number;
  }): Promise<{
    success: boolean;
    message: string;
    modelUsed: string;
  }> {
    return request('/api/ai/test-connection', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

