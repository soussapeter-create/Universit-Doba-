import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Flag,
  MessageSquare,
  PenSquare,
  Quote,
  Search,
  Star,
  X,
} from 'lucide-react';
import {
  Department,
  ForumCategory,
  LibraryShelf,
  Publication,
  ReportReason,
  UserProfile,
} from '../types/academic';
import { DigitalSignatureBlock } from './DigitalSignatureBlock';

interface ForumViewProps {
  publications: Publication[];
  departments: Department[];
  currentUser: UserProfile;
  selectedPublication: Publication | null;
  onSelectPublication: (pub: Publication | null) => void;
  onCreatePublication: (payload: {
    title: string;
    subtitle: string;
    category: ForumCategory;
    departmentId: string;
    contentText: string;
    sourcesText: string;
    libraryShelf?: LibraryShelf;
    copyrightCertified: boolean;
  }) => Promise<void>;
  onCitePublication: (pubId: string) => Promise<void>;
  onRatePublication: (pubId: string, score: number) => Promise<void>;
  onCommentPublication: (pubId: string, content: string) => Promise<void>;
  onPromoteLibrary: (pubId: string, shelf: LibraryShelf) => Promise<void>;
  onReportPublication: (
    pubId: string,
    reason: ReportReason,
    details: string
  ) => Promise<void>;
  onInspectAuthor: (authorId: string) => void;
  onOpenAccessModal: () => void;
  onNotify: (msg: string) => void;
}

const CATEGORIES: ('Toutes' | ForumCategory)[] = [
  'Toutes',
  'Articles scientifiques',
  'Recherches',
  'Opinions académiques',
  'Projets étudiants',
  'Innovations',
  'Événements',
  'Informations universitaires',
];

const LIBRARY_SHELVES: LibraryShelf[] = [
  'Articles scientifiques',
  'Travaux étudiants',
  'Mémoires',
  'Recherches',
  'Conférences',
];

const REPORT_REASONS: ReportReason[] = [
  'Fausse information / Désinformation',
  'Atteinte aux droits d’auteur / Plagiat',
  'Propos inappropriés',
  'Hors-sujet académique',
];

export const ForumView: React.FC<ForumViewProps> = ({
  publications,
  departments,
  currentUser,
  selectedPublication,
  onSelectPublication,
  onCreatePublication,
  onCitePublication,
  onRatePublication,
  onCommentPublication,
  onPromoteLibrary,
  onReportPublication,
  onInspectAuthor,
  onOpenAccessModal,
  onNotify,
}) => {
  const [activeCategory, setActiveCategory] = useState<'Toutes' | ForumCategory>('Toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);

  // Composer form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<ForumCategory>('Articles scientifiques');
  const [departmentId, setDepartmentId] = useState(
    currentUser.departmentId || departments[0]?.id || 'dept-droit-prive'
  );
  const [contentText, setContentText] = useState('');
  const [sourcesText, setSourcesText] = useState('');
  const [libraryShelf, setLibraryShelf] = useState<LibraryShelf | ''>('');
  const [copyrightCertified, setCopyrightCertified] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  // Reading modal states
  const [commentInput, setCommentInput] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [userScore, setUserScore] = useState<number>(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>(
    'Fausse information / Désinformation'
  );
  const [reportDetails, setReportDetails] = useState('');
  const [copiedCitation, setCopiedCitation] = useState(false);

  const visiblePublications = useMemo(() => {
    return publications
      .filter((p) => p.moderationStatus !== 'archive')
      .filter((p) => {
        if (activeCategory !== 'Toutes' && p.category !== activeCategory) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.signature.authorName.toLowerCase().includes(q) ||
          p.signature.departmentOrInstitution.toLowerCase().includes(q)
        );
      });
  }, [publications, activeCategory, searchQuery]);

  const leadPublication = visiblePublications[0];
  const secondaryPublications = visiblePublications.slice(1, 3);
  const archivePublications = visiblePublications.slice(3);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishError('');
    if (!copyrightCertified) {
      setPublishError(
        'Vous devez confirmer le respect des droits d’auteur et l’authenticité de vos sources.'
      );
      return;
    }
    setPublishing(true);
    try {
      await onCreatePublication({
        title,
        subtitle,
        category,
        departmentId,
        contentText,
        sourcesText,
        libraryShelf: libraryShelf || undefined,
        copyrightCertified,
      });
      setTitle('');
      setSubtitle('');
      setContentText('');
      setSourcesText('');
      setLibraryShelf('');
      setCopyrightCertified(false);
      setComposerOpen(false);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Erreur lors de la publication.');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyCitation = async (pub: Publication) => {
    const citationText = `${pub.signature.authorName} (${pub.signature.publishedAt}). ${pub.title}. Université de Doba Forum — ${pub.signature.departmentOrInstitution}. Réf. ${pub.signature.referenceCode}.`;
    try {
      await navigator.clipboard.writeText(citationText);
    } catch {
      // Clipboard fallback ignored if blocked
    }
    await onCitePublication(pub.id);
    setCopiedCitation(true);
    onNotify('Citation académique copiée et comptabilisée.');
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPublication || !commentInput.trim()) return;
    setCommenting(true);
    try {
      await onCommentPublication(selectedPublication.id, commentInput);
      setCommentInput('');
    } finally {
      setCommenting(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPublication) return;
    await onReportPublication(selectedPublication.id, reportReason, reportDetails);
    setReportDetails('');
    setReportOpen(false);
  };

  const canPromoteLibrary =
    currentUser.role === 'enseignant' ||
    currentUser.role === 'administratif' ||
    currentUser.role === 'chercheur';

  return (
    <div className="space-y-10">
      {/* Institutional Hero Split */}
      <section className="bg-white border border-stone-200 rounded-md overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/src/assets/images/doba_crest_emblem_1795285599252.jpg"
                  alt="Sceau de l’Université de Doba"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-md object-cover border border-stone-200 shrink-0"
                />
                <div className="text-xs tracking-wider uppercase text-stone-500 font-medium">
                  Université de Doba · Portail Académique Public
                </div>
              </div>

              <h1 className="mt-5 font-serif text-3xl sm:text-4xl lg:text-[44px] leading-[1.12] font-semibold text-[#1C1917]">
                Université de Doba Forum
              </h1>
              <p className="mt-4 text-base text-stone-600 leading-relaxed max-w-2xl">
                Espace ouvert d’échanges scientifiques, de recherches universitaires et de dialogue pédagogique entre étudiants, enseignants vérifiés, chercheurs, anciens étudiants et partenaires.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {currentUser.role === 'visiteur' ? (
                <button
                  type="button"
                  onClick={onOpenAccessModal}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#172C69] rounded-md inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <PenSquare className="w-4 h-4" aria-hidden="true" />
                  Activer un profil pour publier
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setComposerOpen(true)}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#172C69] rounded-md inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <PenSquare className="w-4 h-4" aria-hidden="true" />
                  Publier dans le Forum
                </button>
              )}
              <span className="text-xs text-stone-500">
                Signature numérique obligatoire · Anti-plagiat et sources vérifiées
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[260px] bg-stone-200">
            <img
              src="/src/assets/images/doba_campus_hero_1795285600390.jpg"
              alt="Cour principale du campus de l’Université de Doba"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          </div>
        </div>

        {/* Full-width institutional summary strip */}
        <div className="border-t border-stone-200 bg-[#FBF9F5] px-6 sm:px-10 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-stone-500">Publications actives</span>
            <div className="font-mono font-semibold text-[#1C1917] tabular-nums mt-0.5">
              {publications.filter((p) => p.moderationStatus !== 'archive').length} articles
            </div>
          </div>
          <div>
            <span className="text-stone-500">Départements connectés</span>
            <div className="font-mono font-semibold text-[#1C1917] tabular-nums mt-0.5">
              {departments.length} départements
            </div>
          </div>
          <div>
            <span className="text-stone-500">Lectures cumulées</span>
            <div className="font-mono font-semibold text-[#1C1917] tabular-nums mt-0.5">
              {publications.reduce((s, p) => s + p.reads, 0)} lectures
            </div>
          </div>
          <div>
            <span className="text-stone-500">Citations académiques</span>
            <div className="font-mono font-semibold text-[#1E3A8A] tabular-nums mt-0.5">
              {publications.reduce((s, p) => s + p.citations, 0)} citations
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section aria-label="Filtrer les publications du forum" className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search
              className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article, un auteur..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>
        </div>
      </section>

      {/* 3-Tier Editorial Broadsheet */}
      {visiblePublications.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-md p-10 text-center">
          <p className="font-serif text-lg text-[#1C1917]">
            Aucune publication ne correspond à votre recherche.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('Toutes');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 text-xs font-medium text-[#1E3A8A] border border-stone-300 rounded-md hover:border-[#1E3A8A] cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tier 1: Lead Story */}
          {leadPublication && (
            <article className="bg-white border border-stone-200 rounded-md overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                {leadPublication.imageUrl && (
                  <div className="lg:col-span-5 bg-stone-100 relative min-h-[240px]">
                    <img
                      src={leadPublication.imageUrl}
                      alt={leadPublication.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover lg:absolute lg:inset-0"
                    />
                  </div>
                )}
                <div
                  className={`${
                    leadPublication.imageUrl ? 'lg:col-span-7' : 'lg:col-span-12'
                  } p-6 sm:p-8 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-[#1E3A8A]">
                        {leadPublication.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>À la une du Forum</span>
                      {leadPublication.moderationStatus === 'signale' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#9A3412] font-medium">
                            En cours de vérification éditoriale
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917] leading-snug">
                      <button
                        type="button"
                        onClick={() => onSelectPublication(leadPublication)}
                        className="text-left hover:text-[#1E3A8A] transition-colors cursor-pointer"
                      >
                        {leadPublication.title}
                      </button>
                    </h2>

                    <p className="mt-2.5 text-sm sm:text-base text-stone-600 leading-relaxed">
                      {leadPublication.subtitle}
                    </p>
                  </div>

                  <div className="mt-5">
                    <DigitalSignatureBlock
                      signature={leadPublication.signature}
                      onInspectAuthor={onInspectAuthor}
                    />

                    <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 tabular-nums">
                        <span>{leadPublication.reads} lectures</span>
                        <span aria-hidden="true">·</span>
                        <span>{leadPublication.citations} citations</span>
                        <span aria-hidden="true">·</span>
                        <span>{leadPublication.comments.length} commentaires</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#14532D] font-medium">
                          Note {leadPublication.ratingAverage.toFixed(1)}/5 ({leadPublication.ratingCount})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectPublication(leadPublication)}
                        className="px-4 py-2 text-xs font-medium text-white bg-[#1E3A8A] hover:bg-[#172C69] rounded-md inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                        Lire l’article complet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* Tier 2: Secondary Features */}
          {secondaryPublications.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {secondaryPublications.map((pub) => (
                <article
                  key={pub.id}
                  className="bg-white border border-stone-200 rounded-md overflow-hidden flex flex-col justify-between"
                >
                  {pub.imageUrl && (
                    <div className="h-48 bg-stone-100 overflow-hidden border-b border-stone-200">
                      <img
                        src={pub.imageUrl}
                        alt={pub.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                        <span className="font-semibold text-[#1E3A8A]">{pub.category}</span>
                        {pub.libraryShelf && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Bibliothèque : {pub.libraryShelf}</span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-2 font-serif text-xl font-semibold text-[#1C1917] leading-snug">
                        <button
                          type="button"
                          onClick={() => onSelectPublication(pub)}
                          className="text-left hover:text-[#1E3A8A] cursor-pointer"
                        >
                          {pub.title}
                        </button>
                      </h3>
                      <p className="mt-2 text-sm text-stone-600 leading-relaxed line-clamp-3">
                        {pub.subtitle}
                      </p>
                    </div>

                    <div className="mt-4">
                      <DigitalSignatureBlock
                        signature={pub.signature}
                        onInspectAuthor={onInspectAuthor}
                      />
                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 tabular-nums">
                        <span>
                          {pub.reads} lect. · {pub.citations} cit. · {pub.ratingAverage.toFixed(1)}/5
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectPublication(pub)}
                          className="font-medium text-[#1E3A8A] hover:underline cursor-pointer"
                        >
                          Consulter →
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Tier 3: Compact Editorial Archive List */}
          {archivePublications.length > 0 && (
            <section className="bg-white border border-stone-200 rounded-md divide-y divide-stone-200">
              <div className="px-6 py-3.5 bg-[#FBF9F5] border-b border-stone-200">
                <h3 className="font-serif text-base font-semibold text-[#1C1917]">
                  Autres contributions récentes de la communauté
                </h3>
              </div>
              {archivePublications.map((pub) => (
                <article key={pub.id} className="p-6 hover:bg-[#FBF9F5]/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="text-xs text-stone-500">
                        <span className="font-semibold text-[#1E3A8A]">{pub.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{pub.signature.departmentOrInstitution}</span>
                        {pub.libraryShelf && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>Classé en {pub.libraryShelf}</span>
                          </>
                        )}
                      </div>
                      <h4 className="mt-1.5 font-serif text-lg font-semibold text-[#1C1917]">
                        <button
                          type="button"
                          onClick={() => onSelectPublication(pub)}
                          className="text-left hover:text-[#1E3A8A] cursor-pointer"
                        >
                          {pub.title}
                        </button>
                      </h4>
                      <p className="mt-1 text-sm text-stone-600">{pub.subtitle}</p>
                      <DigitalSignatureBlock
                        signature={pub.signature}
                        onInspectAuthor={onInspectAuthor}
                      />
                    </div>

                    <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0">
                      <div className="text-xs text-stone-500 tabular-nums">
                        {pub.reads} lect. · {pub.citations} cit. · {pub.ratingAverage.toFixed(1)}/5
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectPublication(pub)}
                        className="px-3.5 py-1.5 text-xs font-medium text-[#1E3A8A] border border-stone-300 hover:border-[#1E3A8A] rounded-md whitespace-nowrap cursor-pointer"
                      >
                        Ouvrir la publication
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      )}

      {/* Publication Composer Modal */}
      {composerOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="composer-title"
        >
          <div className="bg-[#FBF9F5] border border-stone-300 rounded-md w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between">
              <h2 id="composer-title" className="font-serif text-xl font-semibold text-[#1C1917]">
                Publier dans « Université de Doba Forum »
              </h2>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                aria-label="Fermer"
                className="p-2 text-stone-500 hover:text-[#1C1917] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {publishError && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded-md">
                  {publishError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Rubrique du forum *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ForumCategory)}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                  >
                    {CATEGORIES.filter((c) => c !== 'Toutes').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Département concerné *
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Titre de la publication *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. : Enjeux de l’économie numérique au Tchad"
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Résumé / Chapeau introductif
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Synthèse en une phrase de votre problématique ou annonce..."
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Corps du texte *
                </label>
                <textarea
                  rows={5}
                  required
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Rédigez votre article, recherche ou proposition académique (séparez les paragraphes par une ligne vide)..."
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Sources &amp; Références bibliographiques (une par ligne)
                </label>
                <textarea
                  rows={2}
                  value={sourcesText}
                  onChange={(e) => setSourcesText(e.target.value)}
                  placeholder="Ex. : OHADA, Acte uniforme révisé (2010)..."
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              {canPromoteLibrary && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Indexation directe dans la Bibliothèque des connaissances (optionnel)
                  </label>
                  <select
                    value={libraryShelf}
                    onChange={(e) => setLibraryShelf(e.target.value as LibraryShelf | '')}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="">Ne pas indexer immédiatement</option>
                    {LIBRARY_SHELVES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mandatory Digital Signature Preview */}
              <div className="bg-white border border-stone-200 rounded-md p-4 text-xs text-stone-600">
                <div className="font-semibold text-[#1C1917] mb-1">
                  Aperçu de votre signature numérique obligatoire
                </div>
                <div>
                  Auteur : <span className="font-semibold text-[#1C1917]">{currentUser.fullName}</span> · {currentUser.statusLabel} — {currentUser.departmentName}
                </div>
                <div className="mt-1">
                  Email : <span className="font-mono text-stone-800">{currentUser.email}</span> · Publié le : 21 novembre 2026
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyrightCertified}
                  onChange={(e) => setCopyrightCertified(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-[#1E3A8A]"
                />
                <span>
                  Je certifie être l’auteur original de cette publication, respecter les droits d’auteur et fournir des informations vérifiables conformes à la charte académique de l’Université de Doba.
                </span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-md cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-5 py-2 text-xs font-medium text-white bg-[#1E3A8A] hover:bg-[#172C69] rounded-md disabled:opacity-60 cursor-pointer"
                >
                  {publishing ? 'Publication...' : 'Signer et publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full 70/30 Publication Reader Modal */}
      {selectedPublication && (
        <div
          className="fixed inset-0 z-50 bg-[#1C1917]/55 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-title"
        >
          <div className="bg-[#FBF9F5] border border-stone-300 rounded-md w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between gap-4">
              <div className="text-xs text-stone-500 truncate">
                <span className="font-semibold text-[#1E3A8A]">
                  {selectedPublication.category}
                </span>
                <span aria-hidden="true"> · </span>
                <span className="font-mono">{selectedPublication.signature.referenceCode}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectPublication(null);
                  setReportOpen(false);
                }}
                aria-label="Fermer la lecture"
                className="p-1.5 text-stone-500 hover:text-[#1C1917] rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* 70% Main Reading Canvas */}
              <div className="lg:col-span-8 space-y-6">
                <div>
                  <h2
                    id="reader-title"
                    className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917] leading-tight"
                  >
                    {selectedPublication.title}
                  </h2>
                  <p className="mt-3 text-base text-stone-600 leading-relaxed">
                    {selectedPublication.subtitle}
                  </p>
                </div>

                {selectedPublication.imageUrl && (
                  <figure>
                    <img
                      src={selectedPublication.imageUrl}
                      alt={selectedPublication.title}
                      referrerPolicy="no-referrer"
                      className="w-full max-h-80 object-cover rounded-md border border-stone-200"
                    />
                    {selectedPublication.imageCaption && (
                      <figcaption className="mt-2 text-xs font-serif italic text-stone-500">
                        {selectedPublication.imageCaption}
                      </figcaption>
                    )}
                  </figure>
                )}

                <div className="space-y-4 text-[15px] sm:text-base text-[#292524] leading-[1.75] max-w-prose">
                  {selectedPublication.content.map((para, idx) => (
                    <p
                      key={idx}
                      className={
                        idx === 0
                          ? 'first-letter:text-4xl first-letter:font-serif first-letter:font-semibold first-letter:float-left first-letter:mr-2.5 first-letter:leading-none'
                          : ''
                      }
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Sources & Bibliography */}
                <div className="pt-5 border-t border-stone-200">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">
                    Sources &amp; Références citées
                  </h3>
                  <ul className="space-y-1.5 text-xs text-stone-600 list-disc pl-4">
                    {selectedPublication.sources.map((src, i) => (
                      <li key={i}>{src}</li>
                    ))}
                  </ul>
                </div>

                {/* Academic Comments */}
                <div className="pt-6 border-t border-stone-200 space-y-4">
                  <h3 className="font-serif text-lg font-semibold text-[#1C1917] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#1E3A8A]" aria-hidden="true" />
                    Discussion académique ({selectedPublication.comments.length})
                  </h3>

                  {selectedPublication.comments.length === 0 ? (
                    <p className="text-sm text-stone-500">
                      Aucun commentaire pour le moment. Ouvrez la discussion scientifique ci-dessous.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedPublication.comments.map((com) => (
                        <div
                          key={com.id}
                          className="bg-white border border-stone-200 rounded-md p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[#1C1917]">
                              {com.authorName}
                              <span className="font-normal text-stone-500">
                                {' '}
                                · {com.authorStatus} — {com.departmentOrInstitution}
                              </span>
                            </span>
                            <span className="text-stone-400 tabular-nums">{com.createdAt}</span>
                          </div>
                          <p className="mt-2 text-sm text-stone-700 leading-relaxed">
                            {com.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentUser.role !== 'visiteur' ? (
                    <form onSubmit={handleSendComment} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder={`Commenter en tant que ${currentUser.fullName}...`}
                        className="flex-1 px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                      />
                      <button
                        type="submit"
                        disabled={commenting || !commentInput.trim()}
                        className="px-4 py-2 text-xs font-medium text-white bg-[#1E3A8A] hover:bg-[#172C69] rounded-md whitespace-nowrap disabled:opacity-50 cursor-pointer"
                      >
                        Publier le commentaire
                      </button>
                    </form>
                  ) : (
                    <div className="bg-white border border-stone-200 rounded-md p-3 text-xs text-stone-600 flex items-center justify-between gap-3">
                      <span>Connectez un profil académique pour commenter cette publication.</span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPublication(null);
                          onOpenAccessModal();
                        }}
                        className="text-[#1E3A8A] font-medium hover:underline whitespace-nowrap cursor-pointer"
                      >
                        Changer de profil
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 30% Margin Sidebar: Digital Signature, Credibility, Citation, Library, Report */}
              <aside className="lg:col-span-4 space-y-5">
                {/* Digital Signature Card */}
                <div className="bg-white border border-stone-200 rounded-md p-5 space-y-2.5 text-xs">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
                    Signature numérique certifiée
                  </div>
                  <div className="font-serif text-base font-semibold text-[#1C1917]">
                    <button
                      type="button"
                      onClick={() => onInspectAuthor(selectedPublication.signature.authorId)}
                      className="hover:text-[#1E3A8A] underline decoration-stone-300 underline-offset-4 cursor-pointer text-left"
                    >
                      {selectedPublication.signature.authorName}
                    </button>
                  </div>
                  <div className="text-stone-600">
                    {selectedPublication.signature.authorStatus} —{' '}
                    {selectedPublication.signature.departmentOrInstitution}
                  </div>
                  {selectedPublication.signature.verifiedTeacher && (
                    <div className="text-[#14532D] font-semibold">
                      Enseignant vérifié
                      {selectedPublication.signature.teacherRank
                        ? ` · ${selectedPublication.signature.teacherRank}`
                        : ''}
                    </div>
                  )}
                  <div className="pt-2 border-t border-stone-100 space-y-1 text-stone-600">
                    <div>
                      Email :{' '}
                      <span className="font-mono text-stone-800">
                        {selectedPublication.signature.verifiedEmail}
                      </span>
                    </div>
                    <div>
                      Publié le :{' '}
                      <span className="text-stone-800">
                        {selectedPublication.signature.publishedAt}
                      </span>
                    </div>
                    <div>
                      Référence :{' '}
                      <span className="font-mono text-stone-800">
                        {selectedPublication.signature.referenceCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Credibility & Peer Evaluation */}
                <div className="bg-white border border-stone-200 rounded-md p-5 space-y-4">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
                    Crédibilité &amp; Évaluation
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center border-b border-stone-100 pb-3">
                    <div>
                      <div className="font-mono text-base font-semibold text-[#1C1917] tabular-nums">
                        {selectedPublication.reads}
                      </div>
                      <div className="text-[11px] text-stone-500">Lectures</div>
                    </div>
                    <div>
                      <div className="font-mono text-base font-semibold text-[#1E3A8A] tabular-nums">
                        {selectedPublication.citations}
                      </div>
                      <div className="text-[11px] text-stone-500">Citations</div>
                    </div>
                    <div>
                      <div className="font-mono text-base font-semibold text-[#14532D] tabular-nums">
                        {selectedPublication.ratingAverage.toFixed(1)}/5
                      </div>
                      <div className="text-[11px] text-stone-500">
                        ({selectedPublication.ratingCount} avis)
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-stone-700 mb-2">
                      Évaluer la qualité scientifique
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setUserScore(star);
                            onRatePublication(selectedPublication.id, star);
                          }}
                          aria-label={`Noter ${star} sur 5`}
                          className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                            userScore >= star
                              ? 'border-[#1E3A8A] text-[#1E3A8A] bg-[#1E3A8A]/5'
                              : 'border-stone-200 text-stone-400 hover:text-[#1E3A8A]'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${userScore >= star ? 'fill-current' : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCitation(selectedPublication)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-[#1E3A8A] bg-[#FBF9F5] border border-stone-300 hover:border-[#1E3A8A] rounded-md inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedCitation ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#14532D]" aria-hidden="true" />
                        Citation copiée (+1)
                      </>
                    ) : (
                      <>
                        <Quote className="w-3.5 h-3.5" aria-hidden="true" />
                        Citer cette publication
                      </>
                    )}
                  </button>
                </div>

                {/* Library Classification */}
                <div className="bg-white border border-stone-200 rounded-md p-5 space-y-2.5 text-xs">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
                    Bibliothèque des connaissances
                  </div>
                  {selectedPublication.libraryShelf ? (
                    <div className="text-[#14532D] font-medium flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      Classé dans : {selectedPublication.libraryShelf}
                    </div>
                  ) : (
                    <div className="text-stone-500">
                      Non encore archivé en bibliothèque durable.
                    </div>
                  )}

                  {canPromoteLibrary && (
                    <div className="pt-2">
                      <label className="block text-[11px] text-stone-600 mb-1">
                        Classer / déplacer dans une section :
                      </label>
                      <select
                        value={selectedPublication.libraryShelf || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            onPromoteLibrary(
                              selectedPublication.id,
                              e.target.value as LibraryShelf
                            );
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md"
                      >
                        <option value="">Choisir une collection...</option>
                        {LIBRARY_SHELVES.map((shelf) => (
                          <option key={shelf} value={shelf}>
                            {shelf}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Moderation & Report */}
                <div className="bg-white border border-stone-200 rounded-md p-5 space-y-3">
                  {!reportOpen ? (
                    <button
                      type="button"
                      onClick={() => setReportOpen(true)}
                      className="w-full text-xs text-stone-600 hover:text-[#9A3412] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                      Signaler un manquement académique
                    </button>
                  ) : (
                    <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
                      <div className="font-semibold text-[#9A3412]">
                        Signalement à la modération
                      </div>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value as ReportReason)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-md"
                      >
                        {REPORT_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <textarea
                        rows={2}
                        required
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        placeholder="Précisez la source manquante ou l’erreur factuelle..."
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-md"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReportOpen(false)}
                          className="px-2.5 py-1 text-stone-600 cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-[#9A3412] text-white rounded-md font-medium cursor-pointer"
                        >
                          Envoyer le signalement
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
