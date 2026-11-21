import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  Announcement,
  AuthorStatusLabel,
  ChatMessage,
  CourseExercise,
  CourseMaterial,
  ExerciseSubmission,
  LibraryShelf,
  ModerationReport,
  Publication,
  PublicationComment,
  UserProfile,
  UserRole,
} from './src/types/academic';
import { formatFrenchDate, formatFrenchTime, loadDb, saveDb } from './server/store';

const ROLE_TO_STATUS: Record<UserRole, AuthorStatusLabel> = {
  etudiant: 'Étudiant',
  enseignant: 'Enseignant',
  chercheur: 'Chercheur',
  alumni: 'Ancien étudiant (Alumni)',
  administratif: 'Personnel administratif',
  partenaire: 'Partenaire universitaire',
  visiteur: 'Invité',
};

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function startServer(): Promise<void> {
  const app = express();
  const port = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Bootstrap full initial dataset
  app.get('/api/bootstrap', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json(db);
  });

  // Create or register a new profile (Universal Access)
  app.post('/api/profiles', (req: Request, res: Response) => {
    const db = loadDb();
    const {
      fullName,
      role,
      departmentId,
      institution,
      email,
      specialty,
      academicRank,
      programName,
      studyLevel,
      bio,
    } = req.body as Partial<UserProfile>;

    if (!fullName || !role || !email) {
      res.status(400).json({ error: 'Nom complet, rôle et email sont requis.' });
      return;
    }

    const allDepts = db.faculties.flatMap((f) => f.departments);
    const dept = allDepts.find((d) => d.id === departmentId) || allDepts[0];
    const isTeacher = role === 'enseignant';
    const isAutoVerified = role !== 'visiteur' && email.toLowerCase().includes('univ-doba');

    const newProfile: UserProfile = {
      id: makeId('usr'),
      fullName: fullName.trim(),
      role,
      statusLabel: ROLE_TO_STATUS[role] || 'Invité',
      departmentId: dept.id,
      departmentName: dept.name,
      institution: institution?.trim() || 'Université de Doba',
      email: email.trim().toLowerCase(),
      verified: isAutoVerified,
      verifiedTeacher: false,
      verificationRequested: isTeacher || role === 'chercheur',
      specialty: specialty?.trim() || undefined,
      academicRank: academicRank || (isTeacher ? 'Chargé de Cours' : undefined),
      programName: programName?.trim() || undefined,
      studyLevel: studyLevel?.trim() || undefined,
      bio:
        bio?.trim() ||
        `Membre de la communauté académique de l’Université de Doba (${ROLE_TO_STATUS[role]}).`,
      joinedDate: formatFrenchDate(),
    };

    db.profiles.unshift(newProfile);
    saveDb(db);
    res.status(201).json(newProfile);
  });

  // Verify a teacher or researcher profile (Moderation / Admin action)
  app.post('/api/profiles/:id/verify', (req: Request, res: Response) => {
    const db = loadDb();
    const profile = db.profiles.find((p) => p.id === req.params.id);
    if (!profile) {
      res.status(404).json({ error: 'Profil introuvable.' });
      return;
    }
    profile.verified = true;
    if (profile.role === 'enseignant') {
      profile.verifiedTeacher = true;
    }
    profile.verificationRequested = false;
    saveDb(db);
    res.json(profile);
  });

  // Create a publication in Université de Doba Forum
  app.post('/api/publications', (req: Request, res: Response) => {
    const db = loadDb();
    const {
      authorId,
      title,
      subtitle,
      category,
      departmentId,
      contentText,
      sourcesText,
      libraryShelf,
      copyrightCertified,
    } = req.body as {
      authorId: string;
      title: string;
      subtitle: string;
      category: Publication['category'];
      departmentId: string;
      contentText: string;
      sourcesText?: string;
      libraryShelf?: LibraryShelf;
      copyrightCertified?: boolean;
    };

    const author = db.profiles.find((p) => p.id === authorId);
    if (!author) {
      res.status(400).json({ error: 'Profil auteur introuvable.' });
      return;
    }
    if (!title?.trim() || !contentText?.trim()) {
      res.status(400).json({ error: 'Le titre et le contenu sont obligatoires.' });
      return;
    }
    if (!copyrightCertified) {
      res.status(400).json({
        error: 'Vous devez certifier le respect des droits d’auteur et l’exactitude des sources.',
      });
      return;
    }

    const allDepts = db.faculties.flatMap((f) => f.departments);
    const dept = allDepts.find((d) => d.id === departmentId) || allDepts[0];
    const paragraphs = contentText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const sources = (sourcesText || '')
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const codePrefix = dept.code.split('-')[1] || 'ACA';
    const refNumber = String(db.publications.length + 32).padStart(3, '0');

    const newPub: Publication = {
      id: makeId('pub'),
      title: title.trim(),
      subtitle:
        subtitle?.trim() ||
        `Contribution académique publiée dans la rubrique ${category} (${dept.name}).`,
      category,
      departmentId: dept.id,
      content: paragraphs,
      sources: sources.length > 0 ? sources : ['Contribution originale certifiée par l’auteur.'],
      signature: {
        authorId: author.id,
        authorName: author.fullName,
        authorStatus: author.statusLabel,
        departmentOrInstitution:
          author.role === 'partenaire' || author.role === 'visiteur'
            ? author.institution
            : author.departmentName,
        verifiedEmail: author.email,
        publishedAt: formatFrenchDate(),
        referenceCode: `UD-2026-${codePrefix}-${refNumber}`,
        authorVerified: author.verified,
        verifiedTeacher: author.verifiedTeacher,
        teacherRank: author.academicRank,
        teacherSpecialty: author.specialty,
      },
      reads: 1,
      citations: 0,
      ratingAverage: 5.0,
      ratingCount: 1,
      comments: [],
      libraryShelf: libraryShelf || undefined,
      moderationStatus: author.verified ? 'valide' : 'en_attente',
      copyrightCertified: true,
    };

    db.publications.unshift(newPub);
    saveDb(db);
    res.status(201).json(newPub);
  });

  // Increment read count
  app.post('/api/publications/:id/read', (req: Request, res: Response) => {
    const db = loadDb();
    const pub = db.publications.find((p) => p.id === req.params.id);
    if (!pub) {
      res.status(404).json({ error: 'Publication introuvable.' });
      return;
    }
    pub.reads += 1;
    saveDb(db);
    res.json({ reads: pub.reads });
  });

  // Increment citation count
  app.post('/api/publications/:id/cite', (req: Request, res: Response) => {
    const db = loadDb();
    const pub = db.publications.find((p) => p.id === req.params.id);
    if (!pub) {
      res.status(404).json({ error: 'Publication introuvable.' });
      return;
    }
    pub.citations += 1;
    saveDb(db);
    res.json({ citations: pub.citations });
  });

  // Rate publication (1..5)
  app.post('/api/publications/:id/rate', (req: Request, res: Response) => {
    const db = loadDb();
    const pub = db.publications.find((p) => p.id === req.params.id);
    if (!pub) {
      res.status(404).json({ error: 'Publication introuvable.' });
      return;
    }
    const score = Number(req.body.score);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      res.status(400).json({ error: 'La note doit être comprise entre 1 et 5.' });
      return;
    }
    const total = pub.ratingAverage * pub.ratingCount + score;
    pub.ratingCount += 1;
    pub.ratingAverage = Number((total / pub.ratingCount).toFixed(2));
    saveDb(db);
    res.json({ ratingAverage: pub.ratingAverage, ratingCount: pub.ratingCount });
  });

  // Add comment to publication
  app.post('/api/publications/:id/comment', (req: Request, res: Response) => {
    const db = loadDb();
    const pub = db.publications.find((p) => p.id === req.params.id);
    if (!pub) {
      res.status(404).json({ error: 'Publication introuvable.' });
      return;
    }
    const { authorId, content } = req.body as { authorId: string; content: string };
    const author = db.profiles.find((p) => p.id === authorId);
    if (!author || !content?.trim()) {
      res.status(400).json({ error: 'Auteur et commentaire requis.' });
      return;
    }

    const comment: PublicationComment = {
      id: makeId('com'),
      publicationId: pub.id,
      authorId: author.id,
      authorName: author.fullName,
      authorStatus: author.statusLabel,
      departmentOrInstitution: author.departmentName,
      verifiedEmail: author.email,
      authorVerified: author.verified,
      verifiedTeacher: author.verifiedTeacher,
      content: content.trim(),
      createdAt: formatFrenchTime(),
    };
    pub.comments.push(comment);
    saveDb(db);
    res.status(201).json(comment);
  });

  // Promote publication to Knowledge Library shelf
  app.post('/api/publications/:id/library', (req: Request, res: Response) => {
    const db = loadDb();
    const pub = db.publications.find((p) => p.id === req.params.id);
    if (!pub) {
      res.status(404).json({ error: 'Publication introuvable.' });
      return;
    }
    const { shelf } = req.body as { shelf: LibraryShelf };
    pub.libraryShelf = shelf;
    pub.moderationStatus = 'valide';
    saveDb(db);
    res.json(pub);
  });

  // Department Chat endpoints
  app.get('/api/chat', (req: Request, res: Response) => {
    const db = loadDb();
    const channelKey = req.query.channelKey as string | undefined;
    const messages = channelKey
      ? db.chatMessages.filter((m) => m.channelKey === channelKey)
      : db.chatMessages;
    res.json(messages);
  });

  app.post('/api/chat', (req: Request, res: Response) => {
    const db = loadDb();
    const {
      channelKey,
      departmentId,
      departmentName,
      programName,
      levelName,
      groupName,
      authorId,
      kind,
      content,
    } = req.body as Partial<ChatMessage>;

    const author = db.profiles.find((p) => p.id === authorId);
    if (!author || !content?.trim() || !channelKey) {
      res.status(400).json({ error: 'Canal, auteur et message requis.' });
      return;
    }
    if (author.role === 'visiteur') {
      res.status(403).json({
        error: 'Les visiteurs ont un accès en lecture au forum. Créez un profil étudiant ou partenaire pour participer au chat.',
      });
      return;
    }

    const msg: ChatMessage = {
      id: makeId('chat'),
      channelKey,
      departmentId: departmentId || author.departmentId,
      departmentName: departmentName || author.departmentName,
      programName: programName || 'Général',
      levelName: levelName || 'Tous niveaux',
      groupName: groupName || 'Groupe Unique',
      authorId: author.id,
      authorName: author.fullName,
      authorStatus: author.statusLabel,
      verifiedTeacher: author.verifiedTeacher,
      teacherRank: author.academicRank,
      teacherSpecialty: author.specialty,
      kind: kind || 'discussion',
      content: content.trim(),
      createdAt: formatFrenchTime(),
    };
    db.chatMessages.push(msg);
    saveDb(db);
    res.status(201).json(msg);
  });

  app.post('/api/chat/:id/answer', (req: Request, res: Response) => {
    const db = loadDb();
    const msg = db.chatMessages.find((m) => m.id === req.params.id);
    const { authorId, content } = req.body as { authorId: string; content: string };
    const teacher = db.profiles.find((p) => p.id === authorId);
    if (!msg || !teacher || !content?.trim()) {
      res.status(400).json({ error: 'Données invalides pour la réponse.' });
      return;
    }
    if (!teacher.verifiedTeacher && teacher.role !== 'enseignant') {
      res.status(403).json({ error: 'Seul un enseignant peut publier une réponse officielle.' });
      return;
    }
    msg.officialAnswer = {
      authorId: teacher.id,
      authorName: teacher.fullName,
      teacherRank: teacher.academicRank,
      content: content.trim(),
      answeredAt: formatFrenchTime(),
    };
    saveDb(db);
    res.json(msg);
  });

  // Teacher-Student Pedagogy endpoints
  app.post('/api/pedagogy/announcement', (req: Request, res: Response) => {
    const db = loadDb();
    const { authorId, departmentId, programName, levelName, title, body, urgent } =
      req.body as Partial<Announcement>;
    const teacher = db.profiles.find((p) => p.id === authorId);
    if (!teacher || (teacher.role !== 'enseignant' && teacher.role !== 'administratif')) {
      res.status(403).json({ error: 'Action réservée aux enseignants et à l’administration.' });
      return;
    }
    if (!title?.trim() || !body?.trim()) {
      res.status(400).json({ error: 'Titre et contenu de l’annonce requis.' });
      return;
    }
    const ann: Announcement = {
      id: makeId('ann'),
      departmentId: departmentId || teacher.departmentId,
      programName: programName || 'Toutes filières',
      levelName: levelName || 'Tous niveaux',
      title: title.trim(),
      body: body.trim(),
      authorId: teacher.id,
      authorName: teacher.fullName,
      teacherRank: teacher.academicRank || 'Enseignant',
      teacherSpecialty: teacher.specialty || teacher.departmentName,
      verifiedTeacher: teacher.verifiedTeacher,
      createdAt: formatFrenchDate(),
      urgent: Boolean(urgent),
    };
    db.announcements.unshift(ann);
    saveDb(db);
    res.status(201).json(ann);
  });

  app.post('/api/pedagogy/material', (req: Request, res: Response) => {
    const db = loadDb();
    const { authorId, departmentId, programName, levelName, moduleCode, title, summary, outlineText } =
      req.body as {
        authorId: string;
        departmentId: string;
        programName: string;
        levelName: string;
        moduleCode: string;
        title: string;
        summary: string;
        outlineText: string;
      };
    const teacher = db.profiles.find((p) => p.id === authorId);
    if (!teacher || teacher.role !== 'enseignant') {
      res.status(403).json({ error: 'Action réservée aux enseignants.' });
      return;
    }
    if (!title?.trim() || !summary?.trim()) {
      res.status(400).json({ error: 'Titre et résumé du support requis.' });
      return;
    }
    const outline = (outlineText || '')
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const mat: CourseMaterial = {
      id: makeId('mat'),
      departmentId: departmentId || teacher.departmentId,
      programName: programName || 'Général',
      levelName: levelName || 'Licence 3',
      moduleCode: moduleCode?.trim() || 'MOD-101',
      title: title.trim(),
      summary: summary.trim(),
      outline: outline.length > 0 ? outline : ['Support complet disponible pour les étudiants du département.'],
      authorId: teacher.id,
      authorName: teacher.fullName,
      teacherRank: teacher.academicRank || 'Enseignant',
      teacherSpecialty: teacher.specialty || teacher.departmentName,
      verifiedTeacher: teacher.verifiedTeacher,
      publishedAt: formatFrenchDate(),
      downloads: 0,
    };
    db.courseMaterials.unshift(mat);
    saveDb(db);
    res.status(201).json(mat);
  });

  app.post('/api/pedagogy/material/:id/download', (req: Request, res: Response) => {
    const db = loadDb();
    const mat = db.courseMaterials.find((m) => m.id === req.params.id);
    if (!mat) {
      res.status(404).json({ error: 'Support introuvable.' });
      return;
    }
    mat.downloads += 1;
    saveDb(db);
    res.json({ downloads: mat.downloads });
  });

  app.post('/api/pedagogy/exercise', (req: Request, res: Response) => {
    const db = loadDb();
    const { authorId, departmentId, programName, levelName, title, instructions, dueDate } =
      req.body as Partial<CourseExercise>;
    const teacher = db.profiles.find((p) => p.id === authorId);
    if (!teacher || teacher.role !== 'enseignant') {
      res.status(403).json({ error: 'Action réservée aux enseignants.' });
      return;
    }
    if (!title?.trim() || !instructions?.trim()) {
      res.status(400).json({ error: 'Titre et énoncé requis.' });
      return;
    }
    const exo: CourseExercise = {
      id: makeId('exo'),
      departmentId: departmentId || teacher.departmentId,
      programName: programName || 'Général',
      levelName: levelName || 'Licence 3',
      title: title.trim(),
      instructions: instructions.trim(),
      dueDate: dueDate?.trim() || '30 novembre 2026',
      authorId: teacher.id,
      authorName: teacher.fullName,
      teacherRank: teacher.academicRank || 'Enseignant',
      teacherSpecialty: teacher.specialty || teacher.departmentName,
      verifiedTeacher: teacher.verifiedTeacher,
      createdAt: formatFrenchDate(),
      submissions: [],
    };
    db.exercises.unshift(exo);
    saveDb(db);
    res.status(201).json(exo);
  });

  app.post('/api/pedagogy/exercise/:id/submit', (req: Request, res: Response) => {
    const db = loadDb();
    const exo = db.exercises.find((e) => e.id === req.params.id);
    const { studentId, answerText } = req.body as { studentId: string; answerText: string };
    const student = db.profiles.find((p) => p.id === studentId);
    if (!exo || !student || !answerText?.trim()) {
      res.status(400).json({ error: 'Exercice, étudiant et réponse requis.' });
      return;
    }
    const sub: ExerciseSubmission = {
      id: makeId('sub'),
      exerciseId: exo.id,
      studentId: student.id,
      studentName: student.fullName,
      studentEmail: student.email,
      answerText: answerText.trim(),
      submittedAt: formatFrenchTime(),
    };
    exo.submissions.unshift(sub);
    saveDb(db);
    res.status(201).json(sub);
  });

  app.post('/api/pedagogy/submission/:id/grade', (req: Request, res: Response) => {
    const db = loadDb();
    const { teacherId, grade, teacherComment } = req.body as {
      teacherId: string;
      grade: string;
      teacherComment: string;
    };
    const teacher = db.profiles.find((p) => p.id === teacherId);
    if (!teacher || teacher.role !== 'enseignant') {
      res.status(403).json({ error: 'Seul un enseignant peut corriger un travail.' });
      return;
    }
    let foundSub: ExerciseSubmission | undefined;
    for (const exo of db.exercises) {
      const sub = exo.submissions.find((s) => s.id === req.params.id);
      if (sub) {
        foundSub = sub;
        break;
      }
    }
    if (!foundSub) {
      res.status(404).json({ error: 'Copie introuvable.' });
      return;
    }
    foundSub.grade = grade?.trim() || 'Validé';
    foundSub.teacherComment = teacherComment?.trim() || 'Travail corrigé.';
    foundSub.gradedBy = teacher.fullName;
    foundSub.gradedAt = formatFrenchTime();
    saveDb(db);
    res.json(foundSub);
  });

  // Moderation & Academic Quality endpoints
  app.post('/api/moderation/report', (req: Request, res: Response) => {
    const db = loadDb();
    const { publicationId, reason, details, reporterId } = req.body as {
      publicationId: string;
      reason: ModerationReport['reason'];
      details: string;
      reporterId: string;
    };
    const pub = db.publications.find((p) => p.id === publicationId);
    const reporter = db.profiles.find((p) => p.id === reporterId);
    if (!pub || !reporter) {
      res.status(400).json({ error: 'Publication ou utilisateur introuvable.' });
      return;
    }
    pub.moderationStatus = 'signale';
    const report: ModerationReport = {
      id: makeId('rep'),
      publicationId: pub.id,
      publicationTitle: pub.title,
      authorName: pub.signature.authorName,
      reason,
      details: details?.trim() || 'Signalement soumis pour vérification académique.',
      reportedByName: reporter.fullName,
      reportedByRole: reporter.statusLabel,
      createdAt: formatFrenchDate(),
      status: 'en_cours',
    };
    db.moderationReports.unshift(report);
    saveDb(db);
    res.status(201).json(report);
  });

  app.post('/api/moderation/resolve', (req: Request, res: Response) => {
    const db = loadDb();
    const { reportId, publicationId, decision, moderatorId, resolutionNote } = req.body as {
      reportId?: string;
      publicationId: string;
      decision: 'valide_maintenu' | 'retire_archive';
      moderatorId: string;
      resolutionNote?: string;
    };
    const moderator = db.profiles.find((p) => p.id === moderatorId);
    if (
      !moderator ||
      (moderator.role !== 'administratif' && moderator.role !== 'enseignant')
    ) {
      res.status(403).json({
        error: 'Seuls les responsables administratifs et enseignants modérateurs peuvent statuer.',
      });
      return;
    }
    const pub = db.publications.find((p) => p.id === publicationId);
    if (pub) {
      pub.moderationStatus = decision === 'valide_maintenu' ? 'valide' : 'archive';
    }
    if (reportId) {
      const rep = db.moderationReports.find((r) => r.id === reportId);
      if (rep) {
        rep.status = decision;
        rep.resolvedBy = moderator.fullName;
        rep.resolutionNote =
          resolutionNote?.trim() ||
          (decision === 'valide_maintenu'
            ? 'Contenu vérifié conforme à la charte scientifique.'
            : 'Publication archivée pour non-conformité.');
        rep.resolvedAt = formatFrenchDate();
      }
    }
    saveDb(db);
    res.json({ ok: true, publication: pub });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Université de Doba academic server listening on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
