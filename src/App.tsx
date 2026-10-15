import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast.js';
import { Navbar, WorkflowStepId } from './components/Navbar.js';
import { LandingPage } from './components/LandingPage.js';
import { Dashboard } from './components/Dashboard.js';
import { IdeaInputStep } from './components/IdeaInputStep.js';
import { OutlineStep } from './components/OutlineStep.js';
import { ContentGeneratorStep } from './components/ContentGeneratorStep.js';
import { EditorStep } from './components/EditorStep.js';
import { CoverDesignerStep } from './components/CoverDesignerStep.js';
import { ExportStep } from './components/ExportStep.js';
import { AccountModal } from './components/AccountModal.js';
import { Ebook, UserProfile } from './types/index.js';
import { authApi, ebookApi, getAuthToken, setAuthToken, getStoredUser, setStoredUser } from './lib/api.js';

function MainApp() {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'workflow'>('landing');
  const [workflowStep, setWorkflowStep] = useState<WorkflowStepId>('idea');
  const [activeEbook, setActiveEbook] = useState<Ebook | null>(null);
  const [editorInitialChapterId, setEditorInitialChapterId] = useState<string | undefined>(undefined);

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loadingEbooks, setLoadingEbooks] = useState(false);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'profile' | 'ai_settings' | 'vercel'>('profile');

  const { showToast } = useToast();

  // Initialize author session on mount without any login requirement
  useEffect(() => {
    const initSession = async () => {
      try {
        const profile = await authApi.getMe();
        setUser(profile);
        setStoredUser(profile);
        setAuthToken(profile.id);
      } catch (err) {
        // Fallback default author profile if offline or starting clean
        const defaultProfile: UserProfile = {
          id: 'usr_demo_101',
          email: 'demo@ebookgenerator.com',
          displayName: 'Penulis Ebook',
          createdAt: new Date().toISOString(),
        };
        setUser(defaultProfile);
        setStoredUser(defaultProfile);
        setAuthToken(defaultProfile.id);
      }
    };
    initSession();
  }, []);

  // Fetch ebooks whenever view is dashboard or workflow
  const refreshEbooks = useCallback(async () => {
    setLoadingEbooks(true);
    try {
      const list = await ebookApi.getAll();
      setEbooks(list);
    } catch (err: any) {
      console.error('Gagal memuat daftar ebook', err);
    } finally {
      setLoadingEbooks(false);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'dashboard' || currentView === 'workflow') {
      refreshEbooks();
    }
  }, [currentView, refreshEbooks]);

  // Refresh active ebook details
  const refreshActiveEbook = useCallback(async () => {
    if (!activeEbook) return;
    try {
      const updated = await ebookApi.getById(activeEbook.id);
      setActiveEbook(updated);
    } catch (err) {
      console.error('Gagal memperbarui ebook aktif', err);
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

  // Handler: Create New Ebook - instantly opens workflow with zero login gate
  const handleCreateNewEbook = () => {
    setActiveEbook(null);
    setCurrentView('workflow');
    setWorkflowStep('idea');
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
        onOpenSettings={(tab) => {
          setAccountModalTab(tab || 'profile');
          setAccountModalOpen(true);
        }}
      />

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {/* VIEW 1: LANDING PAGE */}
        {currentView === 'landing' && (
          <LandingPage
            onStartCreating={handleCreateNewEbook}
            onOpenDemo={() => setCurrentView('dashboard')}
          />
        )}

        {/* VIEW 2: DASHBOARD */}
        {currentView === 'dashboard' && (
          <Dashboard
            user={user || {
              id: 'usr_demo_101',
              email: 'demo@ebookgenerator.com',
              displayName: 'Penulis Ebook',
              createdAt: new Date().toISOString(),
            }}
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

        {/* VIEW 3: WORKFLOW STEPS */}
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

      {/* Account & AI Settings Modal */}
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
