import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  Download,
  Megaphone,
  MessageCircle,
  Plus,
  Send,
} from 'lucide-react';
import {
  Announcement,
  CourseExercise,
  CourseMaterial,
  Department,
  Faculty,
  UserProfile,
} from '../types/academic';
import { VerifiedTeacherBadge } from './VerifiedTeacherBadge';

interface DepartmentsViewProps {
  faculties: Faculty[];
  profiles: UserProfile[];
  announcements: Announcement[];
  courseMaterials: CourseMaterial[];
  exercises: CourseExercise[];
  currentUser: UserProfile;
  onJumpToChat: (
    departmentId: string,
    programName: string,
    levelName: string
  ) => void;
  onCreateAnnouncement: (payload: {
    departmentId: string;
    programName: string;
    levelName: string;
    title: string;
    body: string;
    urgent: boolean;
  }) => Promise<void>;
  onCreateMaterial: (payload: {
    departmentId: string;
    programName: string;
    levelName: string;
    moduleCode: string;
    title: string;
    summary: string;
    outlineText: string;
  }) => Promise<void>;
  onDownloadMaterial: (materialId: string) => Promise<void>;
  onCreateExercise: (payload: {
    departmentId: string;
    programName: string;
    levelName: string;
    title: string;
    instructions: string;
    dueDate: string;
  }) => Promise<void>;
  onSubmitExercise: (exerciseId: string, answerText: string) => Promise<void>;
  onGradeSubmission: (
    submissionId: string,
    grade: string,
    teacherComment: string
  ) => Promise<void>;
  onInspectAuthor: (authorId: string) => void;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  faculties,
  profiles,
  announcements,
  courseMaterials,
  exercises,
  currentUser,
  onJumpToChat,
  onCreateAnnouncement,
  onCreateMaterial,
  onDownloadMaterial,
  onCreateExercise,
  onSubmitExercise,
  onGradeSubmission,
  onInspectAuthor,
}) => {
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(
    faculties[0]?.id || 'fac-juridique'
  );

  const selectedFaculty = useMemo(
    () => faculties.find((f) => f.id === selectedFacultyId) || faculties[0],
    [faculties, selectedFacultyId]
  );

  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    selectedFaculty?.departments[0]?.id || 'dept-droit-prive'
  );

  const selectedDept: Department | undefined = useMemo(() => {
    const inFaculty = selectedFaculty?.departments.find((d) => d.id === selectedDeptId);
    return inFaculty || selectedFaculty?.departments[0];
  }, [selectedFaculty, selectedDeptId]);

  const [selectedProgramName, setSelectedProgramName] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tous niveaux');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'materials' | 'exercises'
  >('overview');

  // Forms for Teachers
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annUrgent, setAnnUrgent] = useState(false);

  const [showMatForm, setShowMatForm] = useState(false);
  const [matCode, setMatCode] = useState('DRP-305');
  const [matTitle, setMatTitle] = useState('');
  const [matSummary, setMatSummary] = useState('');
  const [matOutline, setMatOutline] = useState('');

  const [showExoForm, setShowExoForm] = useState(false);
  const [exoTitle, setExoTitle] = useState('');
  const [exoInstructions, setExoInstructions] = useState('');
  const [exoDueDate, setExoDueDate] = useState('04 décembre 2026');

  // Student answer & teacher grading state
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [gradeDrafts, setGradeDrafts] = useState<
    Record<string, { grade: string; comment: string }>
  >({});

  if (!selectedFaculty || !selectedDept) return null;

  const activeProgram =
    selectedDept.programs.find((p) => p.name === selectedProgramName) ||
    selectedDept.programs[0];

  const deptTeachers = profiles.filter(
    (p) => p.departmentId === selectedDept.id && p.role === 'enseignant'
  );

  const deptAnnouncements = announcements.filter(
    (a) =>
      a.departmentId === selectedDept.id &&
      (selectedLevel === 'Tous niveaux' || a.levelName === selectedLevel)
  );

  const deptMaterials = courseMaterials.filter(
    (m) =>
      m.departmentId === selectedDept.id &&
      (selectedLevel === 'Tous niveaux' || m.levelName === selectedLevel)
  );

  const deptExercises = exercises.filter(
    (e) =>
      e.departmentId === selectedDept.id &&
      (selectedLevel === 'Tous niveaux' || e.levelName === selectedLevel)
  );

  const isTeacher = currentUser.role === 'enseignant';
  const canAnnounce = isTeacher || currentUser.role === 'administratif';
  const canSubmitWork = currentUser.role !== 'visiteur';

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateAnnouncement({
      departmentId: selectedDept.id,
      programName: activeProgram?.name || 'Toutes filières',
      levelName: selectedLevel === 'Tous niveaux' ? 'Licence 3' : selectedLevel,
      title: annTitle,
      body: annBody,
      urgent: annUrgent,
    });
    setAnnTitle('');
    setAnnBody('');
    setAnnUrgent(false);
    setShowAnnForm(false);
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateMaterial({
      departmentId: selectedDept.id,
      programName: activeProgram?.name || 'Général',
      levelName: selectedLevel === 'Tous niveaux' ? 'Licence 3' : selectedLevel,
      moduleCode: matCode,
      title: matTitle,
      summary: matSummary,
      outlineText: matOutline,
    });
    setMatTitle('');
    setMatSummary('');
    setMatOutline('');
    setShowMatForm(false);
  };

  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateExercise({
      departmentId: selectedDept.id,
      programName: activeProgram?.name || 'Général',
      levelName: selectedLevel === 'Tous niveaux' ? 'Licence 3' : selectedLevel,
      title: exoTitle,
      instructions: exoInstructions,
      dueDate: exoDueDate,
    });
    setExoTitle('');
    setExoInstructions('');
    setShowExoForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">
            Architecture académique &amp; Espace pédagogique
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#1C1917]">
            Facultés, Départements et Filières
          </h1>
          <p className="mt-2 text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl">
            Explorez chaque espace numérique départemental, consultez les supports de cours publiés par nos enseignants vérifiés, remettez vos travaux dirigés et accédez aux discussions de votre filière.
          </p>
        </div>

        <div className="lg:col-span-4 h-40 rounded-md overflow-hidden border border-stone-200 bg-stone-100">
          <img
            src="/src/assets/images/doba_lecture_seminar_1795285600499.jpg"
            alt="Séminaire pédagogique à l’Université de Doba"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Faculty Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {faculties.map((fac) => {
          const isSelected = fac.id === selectedFaculty.id;
          return (
            <button
              key={fac.id}
              type="button"
              onClick={() => {
                setSelectedFacultyId(fac.id);
                setSelectedDeptId(fac.departments[0]?.id || '');
                setSelectedProgramName('');
                setSelectedLevel('Tous niveaux');
              }}
              className={`text-left p-5 rounded-md border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-white border-[#1E3A8A] ring-1 ring-[#1E3A8A]'
                  : 'bg-white border-stone-200 hover:border-stone-400'
              }`}
            >
              <div className="text-xs text-stone-500">Doyen : {fac.dean}</div>
              <h2 className="mt-1 font-serif text-lg font-semibold text-[#1C1917]">
                {fac.name}
              </h2>
              <p className="mt-1.5 text-xs text-stone-600 line-clamp-2">
                {fac.description}
              </p>
              <div className="mt-3 text-xs font-medium text-[#1E3A8A] tabular-nums">
                {fac.departments.length} départements
              </div>
            </button>
          );
        })}
      </div>

      {/* Department Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Department & Filière Tree */}
        <aside className="lg:col-span-4 bg-white border border-stone-200 rounded-md p-5 space-y-5">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-3">
              Départements de la faculté
            </h3>
            <div className="space-y-2">
              {selectedFaculty.departments.map((dept) => {
                const active = dept.id === selectedDept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      setSelectedDeptId(dept.id);
                      setSelectedProgramName(dept.programs[0]?.name || '');
                      setSelectedLevel('Tous niveaux');
                    }}
                    className={`w-full text-left p-3.5 rounded-md border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#FBF9F5] border-[#1E3A8A] text-[#1C1917]'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-stone-500">{dept.code}</span>
                      <span className="text-stone-500">{dept.programs.length} filières</span>
                    </div>
                    <div className="mt-1 font-semibold text-sm">{dept.name}</div>
                    <div className="mt-0.5 text-xs text-stone-500">
                      Chef : {dept.headName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">
              Filières &amp; Niveaux d’études
            </h3>
            <div className="space-y-3">
              {selectedDept.programs.map((prog) => (
                <div key={prog.id} className="p-3 bg-[#FBF9F5] border border-stone-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => setSelectedProgramName(prog.name)}
                    className={`text-sm font-semibold text-left cursor-pointer ${
                      activeProgram?.id === prog.id ? 'text-[#1E3A8A]' : 'text-[#1C1917]'
                    }`}
                  >
                    {prog.name}
                  </button>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {prog.levels.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setSelectedProgramName(prog.name);
                          setSelectedLevel(lvl);
                        }}
                        className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                          selectedLevel === lvl && activeProgram?.id === prog.id
                            ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {selectedLevel !== 'Tous niveaux' && (
              <button
                type="button"
                onClick={() => setSelectedLevel('Tous niveaux')}
                className="mt-2 text-xs text-[#1E3A8A] hover:underline cursor-pointer"
              >
                Afficher tous les niveaux
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              onJumpToChat(
                selectedDept.id,
                activeProgram?.name || selectedDept.programs[0]?.name || '',
                selectedLevel === 'Tous niveaux' ? 'Licence 3' : selectedLevel
              )
            }
            className="w-full px-4 py-2.5 text-xs font-medium text-white bg-[#1E3A8A] hover:bg-[#172C69] rounded-md inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            Ouvrir le Chat : {selectedDept.code} ({selectedLevel === 'Tous niveaux' ? 'Licence 3' : selectedLevel})
          </button>
        </aside>

        {/* Right: Department Digital Workspace */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-stone-200 rounded-md p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs text-stone-500">
                  {selectedFaculty.name} · {selectedDept.code}
                </div>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#1C1917]">
                  {selectedDept.name}
                </h2>
                <p className="mt-1.5 text-sm text-stone-600">{selectedDept.description}</p>
              </div>
            </div>

            {/* Sub-navigation tabs */}
            <div className="mt-6 pt-4 border-t border-stone-200 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-[#FBF9F5] text-stone-700 border border-stone-200'
                }`}
              >
                Annonces &amp; Corps enseignant ({deptAnnouncements.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('materials')}
                className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                  activeTab === 'materials'
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-[#FBF9F5] text-stone-700 border border-stone-200'
                }`}
              >
                Supports de cours ({deptMaterials.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('exercises')}
                className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                  activeTab === 'exercises'
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-[#FBF9F5] text-stone-700 border border-stone-200'
                }`}
              >
                Exercices &amp; Corrections ({deptExercises.length})
              </button>
            </div>
          </div>

          {/* Tab 1: Announcements & Verified Teachers */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Verified Teachers Roster */}
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#1C1917] mb-3">
                  Enseignants vérifiés du département
                </h3>
                {deptTeachers.length === 0 ? (
                  <div className="bg-white border border-stone-200 rounded-md p-4 text-sm text-stone-500">
                    Responsable : {selectedDept.headName}. Les enseignants du département peuvent demander leur vérification dans l’onglet Accès.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {deptTeachers.map((teacher) => (
                      <VerifiedTeacherBadge
                        key={teacher.id}
                        fullName={teacher.fullName}
                        departmentName={teacher.departmentName}
                        specialty={teacher.specialty}
                        academicRank={teacher.academicRank}
                        email={teacher.email}
                        onSelect={() => onInspectAuthor(teacher.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Department Announcements */}
              <div className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-serif text-lg font-semibold text-[#1C1917] flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#1E3A8A]" aria-hidden="true" />
                    Annonces pédagogiques
                  </h3>
                  {canAnnounce && (
                    <button
                      type="button"
                      onClick={() => setShowAnnForm(!showAnnForm)}
                      className="px-3 py-1.5 text-xs font-medium text-[#1E3A8A] border border-stone-300 hover:border-[#1E3A8A] rounded-md inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      Nouvelle annonce
                    </button>
                  )}
                </div>

                {showAnnForm && (
                  <form
                    onSubmit={handleAnnouncementSubmit}
                    className="p-4 bg-[#FBF9F5] border border-stone-200 rounded-md space-y-3"
                  >
                    <input
                      type="text"
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="Titre de l’annonce pédagogique..."
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
                    />
                    <textarea
                      rows={3}
                      required
                      value={annBody}
                      onChange={(e) => setAnnBody(e.target.value)}
                      placeholder="Horaires, salle, consignes aux étudiants..."
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
                    />
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-xs text-stone-700 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={annUrgent}
                          onChange={(e) => setAnnUrgent(e.target.checked)}
                        />
                        Annonce prioritaire
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-medium text-white bg-[#1E3A8A] rounded-md cursor-pointer"
                      >
                        Publier l’annonce
                      </button>
                    </div>
                  </form>
                )}

                {deptAnnouncements.length === 0 ? (
                  <p className="text-sm text-stone-500">
                    Aucune annonce publiée pour ce filtre.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-200">
                    {deptAnnouncements.map((ann) => (
                      <div key={ann.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                          {ann.urgent && (
                            <span className="font-semibold text-[#9A3412]">Prioritaire ·</span>
                          )}
                          <span>
                            {ann.programName} · {ann.levelName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{ann.createdAt}</span>
                        </div>
                        <h4 className="mt-1 font-serif text-base font-semibold text-[#1C1917]">
                          {ann.title}
                        </h4>
                        <p className="mt-1.5 text-sm text-stone-700 leading-relaxed">
                          {ann.body}
                        </p>
                        <div className="mt-2 text-xs text-stone-500">
                          Par <strong className="text-[#1C1917]">{ann.authorName}</strong> ({ann.teacherRank})
                          {ann.verifiedTeacher ? ' · Enseignant vérifié' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Course Materials */}
          {activeTab === 'materials' && (
            <div className="bg-white border border-stone-200 rounded-md p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-serif text-lg font-semibold text-[#1C1917] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1E3A8A]" aria-hidden="true" />
                  Supports de cours et syllabus
                </h3>
                {isTeacher && (
                  <button
                    type="button"
                    onClick={() => setShowMatForm(!showMatForm)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#1E3A8A] rounded-md inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Publier un support
                  </button>
                )}
              </div>

              {showMatForm && (
                <form
                  onSubmit={handleMaterialSubmit}
                  className="p-4 bg-[#FBF9F5] border border-stone-200 rounded-md space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={matCode}
                      onChange={(e) => setMatCode(e.target.value)}
                      placeholder="Code UE (ex. DRP-305)"
                      className="px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
                    />
                    <input
                      type="text"
                      required
                      value={matTitle}
                      onChange={(e) => setMatTitle(e.target.value)}
                      placeholder="Intitulé du support de cours"
                      className="sm:col-span-2 px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
                    />
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={matSummary}
                    onChange={(e) => setMatSummary(e.target.value)}
                    placeholder="Objectifs pédagogiques et résumé du cours..."
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
                  />
                  <textarea
                    rows={3}
                    value={matOutline}
                    onChange={(e) => setMatOutline(e.target.value)}
                    placeholder="Plan du cours (un chapitre par ligne)..."
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-medium text-white bg-[#1E3A8A] rounded-md cursor-pointer"
                    >
                      Enregistrer le support
                    </button>
                  </div>
                </form>
              )}

              {deptMaterials.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Aucun support de cours publié dans ce département pour ce niveau.
                </p>
              ) : (
                <div className="divide-y divide-stone-200">
                  {deptMaterials.map((mat) => (
                    <div key={mat.id} className="py-5 first:pt-0 last:pb-0 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                        <span>
                          <span className="font-mono font-semibold text-[#1E3A8A]">
                            {mat.moduleCode}
                          </span>
                          {' · '}
                          {mat.programName} · {mat.levelName}
                        </span>
                        <span className="tabular-nums">
                          Publié le {mat.publishedAt} · {mat.downloads} téléchargements
                        </span>
                      </div>
                      <h4 className="font-serif text-lg font-semibold text-[#1C1917]">
                        {mat.title}
                      </h4>
                      <p className="text-sm text-stone-600">{mat.summary}</p>
                      <ul className="text-xs text-stone-600 list-disc pl-5 space-y-1">
                        {mat.outline.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-stone-500">
                          Enseignant vérifié :{' '}
                          <strong className="text-[#1C1917]">{mat.authorName}</strong> ({mat.teacherRank})
                        </span>
                        <button
                          type="button"
                          onClick={() => onDownloadMaterial(mat.id)}
                          className="px-3.5 py-1.5 text-xs font-medium text-[#1E3A8A] border border-stone-300 hover:border-[#1E3A8A] rounded-md inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          Télécharger le syllabus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Exercises, Student Submissions & Teacher Grading */}
          {activeTab === 'exercises' && (
            <div className="bg-white border border-stone-200 rounded-md p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-serif text-lg font-semibold text-[#1C1917] flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#1E3A8A]" aria-hidden="true" />
                  Exercices, Travaux dirigés &amp; Corrections
                </h3>
                {isTeacher && (
                  <button
                    type="button"
                    onClick={() => setShowExoForm(!showExoForm)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#1E3A8A] rounded-md inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Envoyer un exercice
                  </button>
                )}
              </div>

              {showExoForm && (
                <form
                  onSubmit={handleExerciseSubmit}
                  className="p-4 bg-[#FBF9F5] border border-stone-200 rounded-md space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={exoTitle}
                      onChange={(e) => setExoTitle(e.target.value)}
                      placeholder="Titre du TD ou exercice..."
                      className="sm:col-span-2 px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
                    />
                    <input
                      type="text"
                      required
                      value={exoDueDate}
                      onChange={(e) => setExoDueDate(e.target.value)}
                      placeholder="Date limite"
                      className="px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={exoInstructions}
                    onChange={(e) => setExoInstructions(e.target.value)}
                    placeholder="Énoncé détaillé et consignes de rédaction..."
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-medium text-white bg-[#1E3A8A] rounded-md cursor-pointer"
                    >
                      Publier l’exercice
                    </button>
                  </div>
                </form>
              )}

              {deptExercises.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Aucun exercice publié pour ce département et ce niveau.
                </p>
              ) : (
                <div className="space-y-6">
                  {deptExercises.map((exo) => (
                    <div
                      key={exo.id}
                      className="border border-stone-200 rounded-md p-5 space-y-4 bg-[#FBF9F5]/50"
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                          <span>
                            {exo.programName} · {exo.levelName} · Par {exo.authorName}
                          </span>
                          <span className="font-medium text-[#9A3412]">
                            Échéance : {exo.dueDate}
                          </span>
                        </div>
                        <h4 className="mt-1 font-serif text-lg font-semibold text-[#1C1917]">
                          {exo.title}
                        </h4>
                        <p className="mt-2 text-sm text-stone-700 leading-relaxed">
                          {exo.instructions}
                        </p>
                      </div>

                      {/* Student Submission Box */}
                      {canSubmitWork && currentUser.role !== 'enseignant' && (
                        <div className="bg-white border border-stone-200 rounded-md p-4 space-y-2.5">
                          <label className="block text-xs font-semibold text-stone-700">
                            Soumettre votre réponse ({currentUser.fullName})
                          </label>
                          <textarea
                            rows={3}
                            value={answerDrafts[exo.id] || ''}
                            onChange={(e) =>
                              setAnswerDrafts((prev) => ({
                                ...prev,
                                [exo.id]: e.target.value,
                              }))
                            }
                            placeholder="Rédigez votre solution structurée..."
                            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={async () => {
                                const text = answerDrafts[exo.id];
                                if (!text?.trim()) return;
                                await onSubmitExercise(exo.id, text);
                                setAnswerDrafts((prev) => ({ ...prev, [exo.id]: '' }));
                              }}
                              className="px-4 py-1.5 text-xs font-medium text-white bg-[#1E3A8A] rounded-md inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" aria-hidden="true" />
                              Remettre le travail
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Submissions & Teacher Corrections */}
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-stone-600">
                          Travaux remis ({exo.submissions.length})
                        </div>
                        {exo.submissions.map((sub) => {
                          const draft = gradeDrafts[sub.id] || {
                            grade: sub.grade || '',
                            comment: sub.teacherComment || '',
                          };
                          return (
                            <div
                              key={sub.id}
                              className="bg-white border border-stone-200 rounded-md p-4 space-y-2.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-[#1C1917]">
                                  {sub.studentName}{' '}
                                  <span className="font-mono font-normal text-stone-500">
                                    ({sub.studentEmail})
                                  </span>
                                </span>
                                <span className="text-stone-400 tabular-nums">
                                  Remis le {sub.submittedAt}
                                </span>
                              </div>
                              <p className="text-sm text-stone-700 leading-relaxed">
                                {sub.answerText}
                              </p>

                              {sub.grade && (
                                <div className="pt-2.5 border-t border-stone-100 text-xs space-y-1">
                                  <div className="font-semibold text-[#14532D]">
                                    Note attribuée : {sub.grade} · Corrigé par {sub.gradedBy}
                                  </div>
                                  <p className="text-stone-600">{sub.teacherComment}</p>
                                </div>
                              )}

                              {isTeacher && (
                                <div className="pt-2.5 border-t border-stone-100 flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    value={draft.grade}
                                    onChange={(e) =>
                                      setGradeDrafts((prev) => ({
                                        ...prev,
                                        [sub.id]: { ...draft, grade: e.target.value },
                                      }))
                                    }
                                    placeholder="Note (ex. 16 / 20)"
                                    className="sm:w-32 px-2.5 py-1.5 text-xs border border-stone-300 rounded-md"
                                  />
                                  <input
                                    type="text"
                                    value={draft.comment}
                                    onChange={(e) =>
                                      setGradeDrafts((prev) => ({
                                        ...prev,
                                        [sub.id]: { ...draft, comment: e.target.value },
                                      }))
                                    }
                                    placeholder="Commentaire pédagogique de correction..."
                                    className="flex-1 px-2.5 py-1.5 text-xs border border-stone-300 rounded-md"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onGradeSubmission(
                                        sub.id,
                                        draft.grade,
                                        draft.comment
                                      )
                                    }
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#14532D] rounded-md whitespace-nowrap cursor-pointer"
                                  >
                                    Enregistrer la correction
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
