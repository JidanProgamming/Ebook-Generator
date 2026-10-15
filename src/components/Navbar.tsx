import React from 'react';
import {
  BookOpen,
  Sparkles,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Plus,
  ArrowLeft,
  CheckCircle,
  Cpu,
} from 'lucide-react';
import { Ebook, UserProfile } from '../types/index.js';

export type WorkflowStepId = 'idea' | 'outline' | 'content' | 'editor' | 'cover' | 'export';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'workflow';
  workflowStep?: WorkflowStepId;
  activeEbook?: Ebook | null;
  user: UserProfile | null;
  onNavigateView: (view: 'landing' | 'dashboard') => void;
  onNavigateStep: (step: WorkflowStepId) => void;
  onOpenNewEbook: () => void;
  onOpenAuth: () => void;
  onOpenSettings: (tab?: 'profile' | 'ai_settings') => void;
  onLogout: () => void;
}

const STEPS: { id: WorkflowStepId; label: string; number: number }[] = [
  { id: 'idea', label: 'Ide', number: 1 },
  { id: 'outline', label: 'Outline', number: 2 },
  { id: 'content', label: 'Konten AI', number: 3 },
  { id: 'editor', label: 'Editor', number: 4 },
  { id: 'cover', label: 'Cover', number: 5 },
  { id: 'export', label: 'Ekspor', number: 6 },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  workflowStep = 'idea',
  activeEbook,
  user,
  onNavigateView,
  onNavigateStep,
  onOpenNewEbook,
  onOpenAuth,
  onOpenSettings,
  onLogout,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand or Back Button */}
        <div className="flex items-center gap-3">
          {currentView === 'workflow' ? (
            <button
              onClick={() => onNavigateView('dashboard')}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigateView(user ? 'dashboard' : 'landing')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-all">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
                  Ebook Generator
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-200">
                    AI
                  </span>
                </span>
              </div>
            </button>
          )}

          {/* If in workflow, show project title */}
          {currentView === 'workflow' && activeEbook && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 text-sm max-w-xs truncate">
              <span className="font-semibold text-slate-800 truncate" title={activeEbook.title}>
                {activeEbook.title}
              </span>
            </div>
          )}
        </div>

        {/* Center: Workflow Stepper Navigation (Desktop) */}
        {currentView === 'workflow' && (
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            {STEPS.map((step, idx) => {
              const isActive = workflowStep === step.id;
              const isPast =
                STEPS.findIndex((s) => s.id === workflowStep) > idx;

              return (
                <button
                  key={step.id}
                  onClick={() => onNavigateStep(step.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs font-semibold'
                      : isPast
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPast ? '✓' : step.number}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Actions and User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Quick AI API Configuration Button */}
              <button
                onClick={() => onOpenSettings('ai_settings')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-colors shrink-0"
                title="Atur Custom API (Codex, OpenCode, OpenRouter, Gemini)"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Custom API</span>
                <span className="sm:hidden text-[11px]">API</span>
              </button>

              {currentView !== 'workflow' && (
                <button
                  onClick={onOpenNewEbook}
                  className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Ebook Baru</span>
                </button>
              )}

              {/* User Avatar & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate">
                    {user.displayName}
                  </span>
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                      <div className="px-3.5 py-2.5 border-b border-slate-100">
                        <p className="font-semibold text-slate-800 truncate">{user.displayName}</p>
                        <p className="text-slate-500 truncate">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigateView('dashboard');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4 text-slate-500" />
                        Dashboard Saya
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenSettings('ai_settings');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-blue-700 font-semibold flex items-center gap-2"
                      >
                        <Cpu className="w-4 h-4 text-blue-600" />
                        Pengaturan Custom API
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenSettings('profile');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        Profil Akun
                      </button>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Keluar (Logout)
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Masuk
              </button>
              <button
                onClick={onOpenAuth}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-xs transition-all"
              >
                Mulai Gratis
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Workflow Stepper Sub-Bar (Preserves 100% desktop workflow parity on mobile) */}
      {currentView === 'workflow' && (
        <div className="lg:hidden bg-slate-50 border-t border-slate-200/90 px-3 py-1.5 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-1 min-w-max mx-auto justify-start sm:justify-center">
            {STEPS.map((step, idx) => {
              const isActive = workflowStep === step.id;
              const isPast = STEPS.findIndex((s) => s.id === workflowStep) > idx;

              return (
                <button
                  key={step.id}
                  onClick={() => onNavigateStep(step.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : isPast
                      ? 'text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80'
                      : 'text-slate-400 hover:text-slate-600 bg-transparent'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-white text-blue-600'
                        : isPast
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPast ? '✓' : step.number}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
