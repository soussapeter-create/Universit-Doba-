import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AcademicDatabase,
  AcademicRank,
  ChatMessageKind,
  ForumCategory,
  LibraryShelf,
  Publication,
  ReportReason,
  UserProfile,
  UserRole,
} from './types/academic';
import { ActiveSection, TopHeader } from './components/TopHeader';
import { AccessProfileModal } from './components/AccessProfileModal';
import { AuthorCredibilityModal } from './components/AuthorCredibilityModal';
import { ForumView } from './components/ForumView';
import { DepartmentsView } from './components/DepartmentsView';
import { ChatView } from './components/ChatView';
import { LibraryView } from './components/LibraryView';
import { ModerationView } from './components/ModerationView';

const STORAGE_USER_KEY = 'univ_doba_active_user_id';

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Une erreur est survenue.');
  }
  return data as T;
}

export default function App() {
  const [db, setDb] = useState<AcademicDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeSection, setActiveSection] = useState<ActiveSection>('forum');
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_USER_KEY) || 'prof-jean';
    } catch {
      return 'prof-jean';
    }
  });

  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [inspectedAuthorId, setInspectedAuthorId] = useState<string | null>(null);
  const [selectedPublicationId, setSelectedPublicationId] = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<{
    departmentId: string;
    programName: string;
    levelName: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  const fetchBootstrap = useCallback(async () => {
    try {
      const data = await apiJson<AcademicDatabase>('/api/bootstrap');
      setDb(data);
      setLoadError('');
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Impossible de charger le portail académique.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  const allDepartments = useMemo(() => {
    if (!db) return [];
    return db.faculties.flatMap((f) => f.departments);
  }, [db]);

  const currentUser: UserProfile | undefined = useMemo(() => {
    if (!db || db.profiles.length === 0) return undefined;
    return db.profiles.find((p) => p.id === activeUserId) || db.profiles[0];
  }, [db, activeUserId]);

  const selectedPublication = useMemo(() => {
    if (!db || !selectedPublicationId) return null;
    return db.publications.find((p) => p.id === selectedPublicationId) || null;
  }, [db, selectedPublicationId]);

  const inspectedAuthor = useMemo(() => {
    if (!db || !inspectedAuthorId) return null;
    return db.profiles.find((p) => p.id === inspectedAuthorId) || null;
  }, [db, inspectedAuthorId]);

  const handleSwitchUser = (profile: UserProfile) => {
    setActiveUserId(profile.id);
    try {
      localStorage.setItem(STORAGE_USER_KEY, profile.id);
    } catch {
      // ignore storage failure
    }
    notify(`Session active : ${profile.fullName} (${profile.statusLabel})`);
  };

  const handleCreateProfile = async (payload: {
    fullName: string;
    role: UserRole;
    departmentId: string;
    institution: string;
    email: string;
    specialty?: string;
    academicRank?: AcademicRank;
    programName?: string;
    studyLevel?: string;
    bio?: string;
  }) => {
    const created = await apiJson<UserProfile>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await fetchBootstrap();
    handleSwitchUser(created);
  };

  const handleSelectPublication = async (pub: Publication | null) => {
    if (!pub) {
      setSelectedPublicationId(null);
      return;
    }
    setSelectedPublicationId(pub.id);
    try {
      const res = await apiJson<{ reads: number }>(`/api/publications/${pub.id}/read`, {
        method: 'POST',
      });
      setDb((prev) =>
        prev
          ? {
              ...prev,
              publications: prev.publications.map((p) =>
                p.id === pub.id ? { ...p, reads: res.reads } : p
              ),
            }
          : prev
      );
    } catch {
      // non-blocking read increment
    }
  };

  const handleCreatePublication = async (payload: {
    title: string;
    subtitle: string;
    category: ForumCategory;
    departmentId: string;
    contentText: string;
    sourcesText: string;
    libraryShelf?: LibraryShelf;
    copyrightCertified: boolean;
  }) => {
    if (!currentUser) return;
    await apiJson('/api/publications', {
      method: 'POST',
      body: JSON.stringify({ ...payload, authorId: currentUser.id }),
    });
    await fetchBootstrap();
    notify('Publication signée et ajoutée au Forum universitaire.');
  };

  const handleCitePublication = async (pubId: string) => {
    await apiJson(`/api/publications/${pubId}/cite`, { method: 'POST' });
    await fetchBootstrap();
  };

  const handleRatePublication = async (pubId: string, score: number) => {
    await apiJson(`/api/publications/${pubId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
    await fetchBootstrap();
    notify(`Évaluation enregistrée (${score}/5).`);
  };

  const handleCommentPublication = async (pubId: string, content: string) => {
    if (!currentUser) return;
    await apiJson(`/api/publications/${pubId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ authorId: currentUser.id, content }),
    });
    await fetchBootstrap();
    notify('Commentaire publié avec votre signature.');
  };

  const handlePromoteLibrary = async (pubId: string, shelf: LibraryShelf) => {
    await apiJson(`/api/publications/${pubId}/library`, {
      method: 'POST',
      body: JSON.stringify({ shelf }),
    });
    await fetchBootstrap();
    notify(`Publication classée dans la Bibliothèque (${shelf}).`);
  };

  const handleReportPublication = async (
    pubId: string,
    reason: ReportReason,
    details: string
  ) => {
    if (!currentUser) return;
    await apiJson('/api/moderation/report', {
      method: 'POST',
      body: JSON.stringify({
        publicationId: pubId,
        reason,
        details,
        reporterId: currentUser.id,
      }),
    });
    await fetchBootstrap();
    notify('Signalement transmis aux responsables de modération.');
  };

  const handleSendMessage = async (payload: {
    channelKey: string;
    departmentId: string;
    departmentName: string;
    programName: string;
    levelName: string;
    groupName: string;
    kind: ChatMessageKind;
    content: string;
  }) => {
    if (!currentUser) return;
    try {
      await apiJson('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ ...payload, authorId: currentUser.id }),
      });
      await fetchBootstrap();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Envoi impossible.');
    }
  };

  const handleOfficialAnswer = async (messageId: string, content: string) => {
    if (!currentUser) return;
    try {
      await apiJson(`/api/chat/${messageId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ authorId: currentUser.id, content }),
      });
      await fetchBootstrap();
      notify('Réponse officielle publiée.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action non autorisée.');
    }
  };

  const handleCreateAnnouncement = async (payload: {
    departmentId: string;
    programName: string;
    levelName: string;
    title: string;
    body: string;
    urgent: boolean;
  }) => {
    if (!currentUser) return;
    await apiJson('/api/pedagogy/announcement', {
      method: 'POST',
      body: JSON.stringify({ ...payload, authorId: currentUser.id }),
    });
    await fetchBootstrap();
    notify('Annonce pédagogique publiée.');
  };

  const handleCreateMaterial = async (payload: {
    departmentId: string;
    programName: string;
    levelName: string;
    moduleCode: string;
    title: string;
    summary: string;
    outlineText: string;
  }) => {
    if (!currentUser) return;
    await apiJson('/api/pedagogy/material', {
      method: 'POST',
      body: JSON.stringify({ ...payload, authorId: currentUser.id }),
    });
    await fetchBootstrap();
    notify('Support de cours mis en ligne.');
  };

  const handleDownloadMaterial = async (materialId: string) => {
    await apiJson(`/api/pedagogy/material/${materialId}/download`, {
      method: 'POST',
    });
    await fetchBootstrap();
    notify('Support de cours consulté et téléchargé.');
  };

  const handleCreateExercise = async (payload: {
    departmentId: string;
    programName: string;
    levelName: string;
    title: string;
    instructions: string;
    dueDate: string;
  }) => {
    if (!currentUser) return;
    await apiJson('/api/pedagogy/exercise', {
      method: 'POST',
      body: JSON.stringify({ ...payload, authorId: currentUser.id }),
    });
    await fetchBootstrap();
    notify('Exercice envoyé aux étudiants du département.');
  };

  const handleSubmitExercise = async (exerciseId: string, answerText: string) => {
    if (!currentUser) return;
    await apiJson(`/api/pedagogy/exercise/${exerciseId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ studentId: currentUser.id, answerText }),
    });
    await fetchBootstrap();
    notify('Travail remis à l’enseignant.');
  };

  const handleGradeSubmission = async (
    submissionId: string,
    grade: string,
    teacherComment: string
  ) => {
    if (!currentUser) return;
    await apiJson(`/api/pedagogy/submission/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify({
        teacherId: currentUser.id,
        grade,
        teacherComment,
      }),
    });
    await fetchBootstrap();
    notify('Correction et note enregistrées.');
  };

  const handleResolveReport = async (payload: {
    reportId?: string;
    publicationId: string;
    decision: 'valide_maintenu' | 'retire_archive';
    resolutionNote?: string;
  }) => {
    if (!currentUser) return;
    await apiJson('/api/moderation/resolve', {
      method: 'POST',
      body: JSON.stringify({ ...payload, moderatorId: currentUser.id }),
    });
    await fetchBootstrap();
    notify('Décision de modération appliquée.');
  };

  const handleVerifyProfile = async (profileId: string) => {
    await apiJson(`/api/profiles/${profileId}/verify`, { method: 'POST' });
    await fetchBootstrap();
    notify('Profil académique certifié.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-md p-6 space-y-3">
          <div className="h-5 w-48 bg-stone-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-stone-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (loadError || !db || !currentUser) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-md p-6 space-y-3 text-center">
          <h1 className="font-serif text-xl font-semibold text-[#1C1917]">
            Université de Doba
          </h1>
          <p className="text-sm text-stone-600">
            {loadError || 'Données académiques indisponibles.'}
          </p>
          <button
            type="button"
            onClick={fetchBootstrap}
            className="px-4 py-2 text-xs font-medium text-white bg-[#1E3A8A] rounded-md cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      <TopHeader
        activeSection={activeSection}
        onNavigate={setActiveSection}
        currentUser={currentUser}
        onOpenAccessModal={() => setAccessModalOpen(true)}
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-8 py-8">
        {activeSection === 'forum' && (
          <ForumView
            publications={db.publications}
            departments={allDepartments}
            currentUser={currentUser}
            selectedPublication={selectedPublication}
            onSelectPublication={handleSelectPublication}
            onCreatePublication={handleCreatePublication}
            onCitePublication={handleCitePublication}
            onRatePublication={handleRatePublication}
            onCommentPublication={handleCommentPublication}
            onPromoteLibrary={handlePromoteLibrary}
            onReportPublication={handleReportPublication}
            onInspectAuthor={(id) => setInspectedAuthorId(id)}
            onOpenAccessModal={() => setAccessModalOpen(true)}
            onNotify={notify}
          />
        )}

        {activeSection === 'departments' && (
          <DepartmentsView
            faculties={db.faculties}
            profiles={db.profiles}
            announcements={db.announcements}
            courseMaterials={db.courseMaterials}
            exercises={db.exercises}
            currentUser={currentUser}
            onJumpToChat={(deptId, prog, lvl) => {
              setChatTarget({ departmentId: deptId, programName: prog, levelName: lvl });
              setActiveSection('chat');
            }}
            onCreateAnnouncement={handleCreateAnnouncement}
            onCreateMaterial={handleCreateMaterial}
            onDownloadMaterial={handleDownloadMaterial}
            onCreateExercise={handleCreateExercise}
            onSubmitExercise={handleSubmitExercise}
            onGradeSubmission={handleGradeSubmission}
            onInspectAuthor={(id) => setInspectedAuthorId(id)}
          />
        )}

        {activeSection === 'chat' && (
          <ChatView
            departments={allDepartments}
            messages={db.chatMessages}
            currentUser={currentUser}
            initialChannel={chatTarget}
            onSendMessage={handleSendMessage}
            onOfficialAnswer={handleOfficialAnswer}
            onOpenAccessModal={() => setAccessModalOpen(true)}
          />
        )}

        {activeSection === 'library' && (
          <LibraryView
            publications={db.publications}
            departments={allDepartments}
            onSelectPublication={(pub) => {
              setActiveSection('forum');
              handleSelectPublication(pub);
            }}
            onCitePublication={handleCitePublication}
            onInspectAuthor={(id) => setInspectedAuthorId(id)}
            onNotify={notify}
          />
        )}

        {activeSection === 'moderation' && (
          <ModerationView
            reports={db.moderationReports}
            publications={db.publications}
            profiles={db.profiles}
            currentUser={currentUser}
            onResolveReport={handleResolveReport}
            onVerifyProfile={handleVerifyProfile}
            onSelectPublication={(pub) => {
              setActiveSection('forum');
              handleSelectPublication(pub);
            }}
            onOpenAccessModal={() => setAccessModalOpen(true)}
          />
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="border-t border-stone-200 bg-white mt-12">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            <span className="font-serif font-semibold text-[#1C1917]">Université de Doba</span>
            <span> · Réseau académique et communication universitaire · Tchad</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveSection('forum')}
              className="hover:text-[#1C1917] cursor-pointer"
            >
              Forum public
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('library')}
              className="hover:text-[#1C1917] cursor-pointer"
            >
              Bibliothèque des connaissances
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('moderation')}
              className="hover:text-[#1C1917] cursor-pointer"
            >
              Charte académique
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AccessProfileModal
        isOpen={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        profiles={db.profiles}
        currentUser={currentUser}
        departments={allDepartments}
        onSwitchUser={handleSwitchUser}
        onCreateProfile={handleCreateProfile}
      />

      <AuthorCredibilityModal
        profile={inspectedAuthor}
        publications={db.publications}
        onClose={() => setInspectedAuthorId(null)}
        onOpenPublication={(pub) => {
          setActiveSection('forum');
          handleSelectPublication(pub);
        }}
      />

      {/* Non-intrusive Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-[#1C1917] text-white text-xs font-medium px-4 py-3 rounded-md shadow-lg border border-stone-700"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
