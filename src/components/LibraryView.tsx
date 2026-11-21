import React, { useMemo, useState } from 'react';
import { BookOpen, Quote, Search } from 'lucide-react';
import { Department, LibraryShelf, Publication } from '../types/academic';
import { DigitalSignatureBlock } from './DigitalSignatureBlock';

interface LibraryViewProps {
  publications: Publication[];
  departments: Department[];
  onSelectPublication: (pub: Publication) => void;
  onCitePublication: (pubId: string) => Promise<void>;
  onInspectAuthor: (authorId: string) => void;
  onNotify: (msg: string) => void;
}

const SHELVES: ('Toutes' | LibraryShelf)[] = [
  'Toutes',
  'Articles scientifiques',
  'Travaux étudiants',
  'Mémoires',
  'Recherches',
  'Conférences',
];

export const LibraryView: React.FC<LibraryViewProps> = ({
  publications,
  departments,
  onSelectPublication,
  onCitePublication,
  onInspectAuthor,
  onNotify,
}) => {
  const [activeShelf, setActiveShelf] = useState<'Toutes' | LibraryShelf>('Toutes');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'citations' | 'rating' | 'reads'>('citations');
  const [searchQuery, setSearchQuery] = useState('');

  const archivedPublications = useMemo(() => {
    return publications
      .filter((p) => Boolean(p.libraryShelf) && p.moderationStatus !== 'archive')
      .filter((p) => (activeShelf === 'Toutes' ? true : p.libraryShelf === activeShelf))
      .filter((p) => (deptFilter === 'all' ? true : p.departmentId === deptFilter))
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.signature.authorName.toLowerCase().includes(q) ||
          p.signature.referenceCode.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'citations') return b.citations - a.citations;
        if (sortBy === 'rating') return b.ratingAverage - a.ratingAverage;
        return b.reads - a.reads;
      });
  }, [publications, activeShelf, deptFilter, sortBy, searchQuery]);

  const shelfCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const shelf of SHELVES) {
      if (shelf === 'Toutes') {
        counts[shelf] = publications.filter(
          (p) => Boolean(p.libraryShelf) && p.moderationStatus !== 'archive'
        ).length;
      } else {
        counts[shelf] = publications.filter(
          (p) => p.libraryShelf === shelf && p.moderationStatus !== 'archive'
        ).length;
      }
    }
    return counts;
  }, [publications]);

  const handleCopyBibtex = async (pub: Publication) => {
    const citation = `${pub.signature.authorName} (${pub.signature.publishedAt}). ${pub.title}. Bibliothèque des connaissances — Université de Doba (${pub.libraryShelf}). Réf. ${pub.signature.referenceCode}.`;
    try {
      await navigator.clipboard.writeText(citation);
    } catch {
      // ignore
    }
    await onCitePublication(pub.id);
    onNotify('Référence bibliographique copiée (+1 citation).');
  };

  return (
    <div className="space-y-8">
      {/* Library Institutional Header */}
      <section className="bg-white border border-stone-200 rounded-md overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">
                Base documentaire pérenne · Université de Doba
              </div>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917]">
                Bibliothèque des connaissances
              </h1>
              <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl">
                Les publications les mieux évaluées, validées pour leur rigueur scientifique et signées numériquement sont conservées durablement dans ce répertoire universitaire ouvert.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-6 text-xs">
              <div>
                <span className="text-stone-500">Ouvrages archivés</span>
                <div className="font-mono text-lg font-semibold text-[#1C1917] tabular-nums">
                  {shelfCounts['Toutes']}
                </div>
              </div>
              <div>
                <span className="text-stone-500">Articles scientifiques</span>
                <div className="font-mono text-lg font-semibold text-[#1E3A8A] tabular-nums">
                  {shelfCounts['Articles scientifiques']}
                </div>
              </div>
              <div>
                <span className="text-stone-500">Mémoires &amp; Travaux</span>
                <div className="font-mono text-lg font-semibold text-[#14532D] tabular-nums">
                  {shelfCounts['Mémoires'] + shelfCounts['Travaux étudiants']}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[220px] bg-stone-200">
            <img
              src="/src/assets/images/doba_library_archive_1795285599347.jpg"
              alt="Salle de lecture de la Bibliothèque des connaissances de Doba"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          </div>
        </div>
      </section>

      {/* Shelf Navigation & Filters */}
      <section className="space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {SHELVES.map((shelf) => {
            const active = activeShelf === shelf;
            return (
              <button
                key={shelf}
                type="button"
                onClick={() => setActiveShelf(shelf)}
                className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
                }`}
              >
                {shelf} ({shelfCounts[shelf] || 0})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search
              className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer par titre, auteur ou cote (UD-2026-...)..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
            >
              <option value="all">Tous les départements</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'citations' | 'rating' | 'reads')
              }
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md"
            >
              <option value="citations">Trier : Plus cités</option>
              <option value="rating">Trier : Mieux évalués</option>
              <option value="reads">Trier : Plus lus</option>
            </select>
          </div>
        </div>
      </section>

      {/* Archival Catalog */}
      {archivedPublications.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-md p-10 text-center text-sm text-stone-500">
          Aucun document archivé ne correspond à ces critères. Les enseignants et chercheurs peuvent classer des publications depuis le Forum.
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-md divide-y divide-stone-200">
          {archivedPublications.map((pub) => (
            <article key={pub.id} className="p-6 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="font-semibold text-[#1E3A8A]">{pub.libraryShelf}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-stone-600">{pub.signature.referenceCode}</span>
                    <span aria-hidden="true">·</span>
                    <span>{pub.signature.departmentOrInstitution}</span>
                  </div>
                  <h2 className="font-serif text-xl font-semibold text-[#1C1917]">
                    <button
                      type="button"
                      onClick={() => onSelectPublication(pub)}
                      className="text-left hover:text-[#1E3A8A] cursor-pointer"
                    >
                      {pub.title}
                    </button>
                  </h2>
                  <p className="text-sm text-stone-600 leading-relaxed">{pub.subtitle}</p>
                </div>

                <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0">
                  <div className="text-xs text-stone-600 font-mono tabular-nums">
                    {pub.citations} cit. · {pub.reads} lect. · {pub.ratingAverage.toFixed(1)}/5
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyBibtex(pub)}
                      className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-[#FBF9F5] border border-stone-300 hover:border-[#1E3A8A] rounded-md inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Quote className="w-3.5 h-3.5" aria-hidden="true" />
                      Citer
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPublication(pub)}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#1E3A8A] hover:bg-[#172C69] rounded-md inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      Consulter
                    </button>
                  </div>
                </div>
              </div>

              <DigitalSignatureBlock
                signature={pub.signature}
                compact
                onInspectAuthor={onInspectAuthor}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
