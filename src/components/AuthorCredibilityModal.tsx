import React from 'react';
import { BookOpen, ShieldCheck, Star, X } from 'lucide-react';
import { Publication, UserProfile } from '../types/academic';

interface AuthorCredibilityModalProps {
  profile: UserProfile | null;
  publications: Publication[];
  onClose: () => void;
  onOpenPublication: (pub: Publication) => void;
}

export const AuthorCredibilityModal: React.FC<AuthorCredibilityModalProps> = ({
  profile,
  publications,
  onClose,
  onOpenPublication,
}) => {
  if (!profile) return null;

  const authorPubs = publications.filter((p) => p.signature.authorId === profile.id);
  const totalReads = authorPubs.reduce((sum, p) => sum + p.reads, 0);
  const totalCitations = authorPubs.reduce((sum, p) => sum + p.citations, 0);
  const avgRating =
    authorPubs.length > 0
      ? (
          authorPubs.reduce((sum, p) => sum + p.ratingAverage, 0) / authorPubs.length
        ).toFixed(2)
      : '—';

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credibility-modal-title"
    >
      <div className="bg-[#FBF9F5] border border-stone-300 rounded-md w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-xl">
        <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span>{profile.statusLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.departmentName}</span>
              {profile.verifiedTeacher && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#14532D]">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    Enseignant vérifié
                  </span>
                </>
              )}
              {!profile.verifiedTeacher && profile.verified && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1E3A8A]">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    Profil vérifié
                  </span>
                </>
              )}
            </div>
            <h2
              id="credibility-modal-title"
              className="mt-1 font-serif text-2xl font-semibold text-[#1C1917]"
            >
              {profile.fullName}
            </h2>
            {profile.academicRank && (
              <p className="text-xs font-medium text-stone-600 mt-0.5">
                {profile.academicRank}
                {profile.specialty ? ` — Spécialité : ${profile.specialty}` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le dossier auteur"
            className="p-2 text-stone-500 hover:text-[#1C1917] rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white border border-stone-200 rounded-md p-4">
            <p className="text-sm text-stone-700 leading-relaxed">{profile.bio}</p>
            <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
              <span>
                Email : <span className="font-mono text-stone-800">{profile.email}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Institution : {profile.institution}</span>
              <span aria-hidden="true">·</span>
              <span>Membre depuis : {profile.joinedDate}</span>
            </div>
          </div>

          {/* Credibility metrics table-like strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-stone-200 rounded-md p-3.5">
              <div className="text-xs text-stone-500">Publications</div>
              <div className="mt-1 font-mono text-xl font-semibold text-[#1C1917] tabular-nums">
                {authorPubs.length}
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-md p-3.5">
              <div className="text-xs text-stone-500">Lectures totales</div>
              <div className="mt-1 font-mono text-xl font-semibold text-[#1C1917] tabular-nums">
                {totalReads}
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-md p-3.5">
              <div className="text-xs text-stone-500">Citations reçues</div>
              <div className="mt-1 font-mono text-xl font-semibold text-[#1E3A8A] tabular-nums">
                {totalCitations}
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-md p-3.5">
              <div className="text-xs text-stone-500">Évaluation moyenne</div>
              <div className="mt-1 font-mono text-xl font-semibold text-[#14532D] tabular-nums inline-flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                {avgRating}
              </div>
            </div>
          </div>

          {/* Publication history */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#1C1917] mb-3">
              Historique des publications
            </h3>
            {authorPubs.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-md p-4 text-sm text-stone-500">
                Aucune publication enregistrée pour ce profil pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-stone-200 bg-white border border-stone-200 rounded-md">
                {authorPubs.map((pub) => (
                  <div key={pub.id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-stone-500">
                        {pub.category} · {pub.signature.publishedAt}
                        {pub.libraryShelf ? ` · Bibliothèque : ${pub.libraryShelf}` : ''}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPublication(pub);
                        }}
                        className="mt-1 text-left font-serif text-base font-semibold text-[#1C1917] hover:text-[#1E3A8A] cursor-pointer"
                      >
                        {pub.title}
                      </button>
                      <div className="mt-1.5 text-xs text-stone-500 tabular-nums">
                        {pub.reads} lectures · {pub.citations} citations · {pub.comments.length} commentaires · Note {pub.ratingAverage.toFixed(1)}/5
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPublication(pub);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-[#1E3A8A] border border-stone-200 hover:border-[#1E3A8A] rounded-md whitespace-nowrap inline-flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      Lire
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
