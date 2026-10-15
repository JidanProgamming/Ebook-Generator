import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast.js';
import { Navbar, WorkflowStepId } from './components/Navbar.js';
import { LandingPage } from './components/LandingPage.js';
import { LoginPage } from './components/LoginPage.js';
import { AuthModal } from './components/AuthModal.js';
import { Dashboard } from './components/Dashboard.js';
import { IdeaInputStep } from './components/IdeaInputStep.js';
import { OutlineStep } from './components/OutlineStep.js';
import { ContentGeneratorStep } from './components/ContentGeneratorStep.js';
import { EditorStep } from './components/EditorStep.js';
import { CoverDesignerStep } from './components/CoverDesignerStep.js';
import { ExportStep } from './components/ExportStep.js';
import { AccountModal } from './components/AccountModal.js';
import { Ebook, UserProfile } from './types/index.js';
import { authApi, ebookApi, getAuthToken, getStoredUser } from './lib/api.js';

function MainApp() {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard' | 'workflow'>('landing');
  const [workflowStep, setWorkflowStep] = useState<WorkflowStepId>('idea');
  const [activeEbook, setActiveEbook] = useState<Ebook | null>(null);
  const [editorInitialChapterId, setEditorInitialChapterId] = useState<string | undefined>(undefined);

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loadingEbooks, setLoadingEbooks] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'profile' | 'ai_settings'>('profile');

  const { showToast } = useToast();

  // Load current user profile and ebooks on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          setCurrentView('dashboard');
        } catch {
          // Token expired or invalid
          authApi.logout();
          setUser(null);
          setCurrentView('landing');
        }
      } else {
        // Not logged in: show landing page
        setUser(null);
      }
    };
    initAuth();
  }, []);

  // Fetch ebooks whenever user is present and view is dashboard
  const refreshEbooks = useCallback(async () => {
    if (!user) return;
    setLoadingEbooks(true);
    try {
      const list = await ebookApi.getAll();
      setEbooks(list);
    } catch (err: any) {
      console.error('Failed to load ebooks', err);
    } finally {
      setLoadingEbooks(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && (currentView === 'dashboard' || currentView === 'workflow')) {
      refreshEbooks();
    }
  }, [user, currentView, refreshEbooks]);

  // Refresh active ebook details
  const refreshActiveEbook = useCallback(async () => {
    if (!activeEbook) return;
    try {
      const updated = await ebookApi.getById(activeEbook.id);
      setActiveEbook(updated);
    } catch (err) {
      console.error('Failed to refresh active ebook', err);
    }
  }, [activeEbook]);

  // Handler: Select Ebook from Dashboard
  const handleSelectEbook = (ebook: Ebook) => {
    setActiveEbook(ebook);
    setCurrentView('workflow');

    // Route to appropriate workflow step based on ebook status
    if (ebook.status === 'draft') {
      setWorkflowStep('idea');
    } else if (ebook.status === 'outline_ready') {
      setWorkflowStep('outline');
    } else if (ebook.status === 'generating') {
      setWorkflowStep('content');
    } else if (ebook.status === 'ready_to_export' || ebook.status === 'completed') {
      setWorkflowStep('export');
    } else {
      setWorkflowStep('editor');
    }
  };

  // Handler: Create New Ebook
  const handleCreateNewEbook = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setActiveEbook(null);
    setCurrentView('workflow');
    setWorkflowStep('idea');
  };

  // Handler: Auth success
  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setCurrentView('dashboard');
    refreshEbooks();
  };

  // Handler: Logout
  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setActiveEbook(null);
    setCurrentView('landing');
    showToast('Anda telah berhasil keluar.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        workflowStep={workflowStep}
        activeEbook={activeEbook}
        user={user}
        onNavigateView={(view) => setCurrentView(view)}
        onNavigateStep={(step) => {
          if (!activeEbook && step !== 'idea') {
            showToast('Silakan selesaikan input ide terlebih dahulu', 'info');
            return;
          }
          setWorkflowStep(step);
        }}
        onOpenNewEbook={handleCreateNewEbook}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'login');
          setAuthModalOpen(true);
        }}
        onOpenSettings={(tab) => {
          setAccountModalTab(tab || 'profile');
          setAccountModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {/* VIEW 1: LANDING PAGE */}
        {currentView === 'landing' && (
          <LandingPage
            onStartCreating={() => {
              if (user) {
                setCurrentView('dashboard');
              } else {
                setAuthModalMode('register');
                setCurrentView('login');
              }
            }}
            onOpenDemo={async () => {
              try {
                const demoRes = await authApi.login('demo@ebookgenerator.com', 'demo123');
                showToast(`Masuk sebagai ${demoRes.user.displayName}`, 'success');
                handleAuthSuccess(demoRes.user);
              } catch {
                setAuthModalMode('login');
                setAuthModalOpen(true);
              }
            }}
          />
        )}

        {/* VIEW 2: DEDICATED LOGIN / REGISTER PAGE */}
        {currentView === 'login' && (
          <LoginPage
            initialMode={authModalMode}
            onLoginSuccess={handleAuthSuccess}
            onNavigateBack={() => setCurrentView('landing')}
          />
        )}

        {/* VIEW 3: DASHBOARD */}
        {currentView === 'dashboard' && user && (
          <Dashboard
            user={user}
            ebooks={ebooks}
            loading={loadingEbooks}
            onSelectEbook={handleSelectEbook}
            onCreateNew={handleCreateNewEbook}
            onRefreshEbooks={refreshEbooks}
            onOpenAISettings={() => {
              setAccountModalTab('ai_settings');
              setAccountModalOpen(true);
            }}
          />
        )}

        {/* VIEW 3: WORKFLOW */}
        {currentView === 'workflow' && (
          <div className="flex-1 flex flex-col">
            {/* STEP 1: INPUT IDE */}
            {workflowStep === 'idea' && (
              <IdeaInputStep
                initialEbook={activeEbook}
                onOutlineGenerated={(generatedEbook) => {
                  setActiveEbook(generatedEbook);
                  setWorkflowStep('outline');
                  refreshEbooks();
                }}
                onCancel={() => setCurrentView('dashboard')}
              />
            )}

            {/* STEP 2: OUTLINE */}
            {workflowStep === 'outline' && activeEbook && (
              <OutlineStep
                ebook={activeEbook}
                onOutlineApproved={(approvedEbook) => {
                  setActiveEbook(approvedEbook);
                  setWorkflowStep('content');
                  refreshEbooks();
                }}
                onBackToIdea={() => setWorkflowStep('idea')}
              />
            )}

            {/* STEP 3: CONTENT GENERATOR */}
            {workflowStep === 'content' && activeEbook && (
              <ContentGeneratorStep
                ebook={activeEbook}
                onOpenEditor={(chapterId) => {
                  setEditorInitialChapterId(chapterId);
                  setWorkflowStep('editor');
                }}
                onRefreshEbook={refreshActiveEbook}
              />
            )}

            {/* STEP 4: EDITOR */}
            {workflowStep === 'editor' && activeEbook && (
              <EditorStep
                ebook={activeEbook}
                initialChapterId={editorInitialChapterId}
                onNavigateToCover={() => setWorkflowStep('cover')}
                onRefreshEbook={refreshActiveEbook}
                onOpenAISettings={() => {
                  setAccountModalTab('ai_settings');
                  setAccountModalOpen(true);
                }}
              />
            )}

            {/* STEP 5: COVER DESIGNER */}
            {workflowStep === 'cover' && activeEbook && (
              <CoverDesignerStep
                ebook={activeEbook}
                onNavigateToExport={() => setWorkflowStep('export')}
                onRefreshEbook={refreshActiveEbook}
              />
            )}

            {/* STEP 6: DESIGN & EXPORT */}
            {workflowStep === 'export' && activeEbook && (
              <ExportStep
                ebook={activeEbook}
                onRefreshEbook={refreshActiveEbook}
                onBackToEditor={() => setWorkflowStep('editor')}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {user && (
        <AccountModal
          isOpen={accountModalOpen}
          user={user}
          totalEbooks={ebooks.length}
          initialTab={accountModalTab}
          onClose={() => setAccountModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
