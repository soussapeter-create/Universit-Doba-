export type UserRole =
  | 'etudiant'
  | 'enseignant'
  | 'chercheur'
  | 'alumni'
  | 'administratif'
  | 'partenaire'
  | 'visiteur';

export type AuthorStatusLabel =
  | 'Étudiant'
  | 'Enseignant'
  | 'Chercheur'
  | 'Ancien étudiant (Alumni)'
  | 'Personnel administratif'
  | 'Partenaire universitaire'
  | 'Invité';

export type AcademicRank =
  | 'Professeur Titulaire'
  | 'Maître de Conférences'
  | 'Maître-Assistant'
  | 'Chargé de Cours'
  | 'Chercheur Principal'
  | 'Doctorant'
  | 'Étudiant'
  | 'Administrateur Académique'
  | 'Partenaire Institutionnel'
  | 'Visiteur';

export interface UserProfile {
  id: string;
  fullName: string;
  role: UserRole;
  statusLabel: AuthorStatusLabel;
  departmentId: string;
  departmentName: string;
  institution: string;
  email: string;
  verified: boolean;
  verifiedTeacher: boolean;
  specialty?: string;
  academicRank?: AcademicRank;
  programName?: string;
  studyLevel?: string;
  bio: string;
  joinedDate: string;
  verificationRequested?: boolean;
}

export interface ProgramFiliere {
  id: string;
  name: string;
  levels: string[];
  groups: string[];
}

export interface Department {
  id: string;
  facultyId: string;
  name: string;
  code: string;
  headName: string;
  description: string;
  programs: ProgramFiliere[];
}

export interface Faculty {
  id: string;
  name: string;
  dean: string;
  description: string;
  departments: Department[];
}

export type ForumCategory =
  | 'Articles scientifiques'
  | 'Opinions académiques'
  | 'Recherches'
  | 'Événements'
  | 'Projets étudiants'
  | 'Innovations'
  | 'Informations universitaires';

export type LibraryShelf =
  | 'Articles scientifiques'
  | 'Travaux étudiants'
  | 'Mémoires'
  | 'Recherches'
  | 'Conférences';

export type ModerationStatus = 'valide' | 'en_attente' | 'signale' | 'archive';

export interface DigitalSignature {
  authorId: string;
  authorName: string;
  authorStatus: AuthorStatusLabel;
  departmentOrInstitution: string;
  verifiedEmail: string;
  publishedAt: string;
  referenceCode: string;
  authorVerified: boolean;
  verifiedTeacher: boolean;
  teacherRank?: string;
  teacherSpecialty?: string;
}

export interface PublicationComment {
  id: string;
  publicationId: string;
  authorId: string;
  authorName: string;
  authorStatus: AuthorStatusLabel;
  departmentOrInstitution: string;
  verifiedEmail: string;
  authorVerified: boolean;
  verifiedTeacher: boolean;
  content: string;
  createdAt: string;
}

export interface Publication {
  id: string;
  title: string;
  subtitle: string;
  category: ForumCategory;
  departmentId: string;
  content: string[];
  sources: string[];
  imageUrl?: string;
  imageCaption?: string;
  signature: DigitalSignature;
  reads: number;
  citations: number;
  ratingAverage: number;
  ratingCount: number;
  comments: PublicationComment[];
  libraryShelf?: LibraryShelf;
  moderationStatus: ModerationStatus;
  copyrightCertified: boolean;
  isLeadFeature?: boolean;
}

export type ChatMessageKind = 'discussion' | 'question' | 'pedagogique';

export interface ChatMessage {
  id: string;
  channelKey: string;
  departmentId: string;
  departmentName: string;
  programName: string;
  levelName: string;
  groupName: string;
  authorId: string;
  authorName: string;
  authorStatus: AuthorStatusLabel;
  verifiedTeacher: boolean;
  teacherRank?: string;
  teacherSpecialty?: string;
  kind: ChatMessageKind;
  content: string;
  createdAt: string;
  officialAnswer?: {
    authorId: string;
    authorName: string;
    teacherRank?: string;
    content: string;
    answeredAt: string;
  };
}

export interface Announcement {
  id: string;
  departmentId: string;
  programName: string;
  levelName: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  teacherRank: string;
  teacherSpecialty: string;
  verifiedTeacher: boolean;
  createdAt: string;
  urgent?: boolean;
}

export interface CourseMaterial {
  id: string;
  departmentId: string;
  programName: string;
  levelName: string;
  moduleCode: string;
  title: string;
  summary: string;
  outline: string[];
  authorId: string;
  authorName: string;
  teacherRank: string;
  teacherSpecialty: string;
  verifiedTeacher: boolean;
  publishedAt: string;
  downloads: number;
}

export interface ExerciseSubmission {
  id: string;
  exerciseId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  answerText: string;
  submittedAt: string;
  grade?: string;
  teacherComment?: string;
  gradedBy?: string;
  gradedAt?: string;
}

export interface CourseExercise {
  id: string;
  departmentId: string;
  programName: string;
  levelName: string;
  title: string;
  instructions: string;
  dueDate: string;
  authorId: string;
  authorName: string;
  teacherRank: string;
  teacherSpecialty: string;
  verifiedTeacher: boolean;
  createdAt: string;
  submissions: ExerciseSubmission[];
}

export type ReportReason =
  | 'Fausse information / Désinformation'
  | 'Atteinte aux droits d’auteur / Plagiat'
  | 'Propos inappropriés'
  | 'Hors-sujet académique';

export interface ModerationReport {
  id: string;
  publicationId: string;
  publicationTitle: string;
  authorName: string;
  reason: ReportReason;
  details: string;
  reportedByName: string;
  reportedByRole: AuthorStatusLabel;
  createdAt: string;
  status: 'en_cours' | 'valide_maintenu' | 'retire_archive';
  resolvedBy?: string;
  resolutionNote?: string;
  resolvedAt?: string;
}

export interface AcademicDatabase {
  faculties: Faculty[];
  profiles: UserProfile[];
  publications: Publication[];
  chatMessages: ChatMessage[];
  announcements: Announcement[];
  courseMaterials: CourseMaterial[];
  exercises: CourseExercise[];
  moderationReports: ModerationReport[];
}
