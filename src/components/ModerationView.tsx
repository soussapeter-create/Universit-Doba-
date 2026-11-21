import React, { useState } from 'react';
import { CheckCircle2, FileWarning, Scale, ShieldCheck, XCircle } from 'lucide-react';
import { ModerationReport, Publication, UserProfile } from '../types/academic';

interface ModerationViewProps {
  reports: ModerationReport[];
  publications: Publication[];
  profiles: UserProfile[];
  currentUser: UserProfile;
  onResolveReport: (payload: {
    reportId?: string;
    publicationId: string;
    decision: 'valide_maintenu' | 'retire_archive';
    resolutionNote?: string;
  }) => Promise<void>;
  onVerifyProfile: (profileId: string) => Promise<void>;
  onSelectPublication: (pub: Publication) => void;
  onOpenAccessModal: () => void;
}

const CHARTER_RULES = [
  {
    title: '01. Signature numérique et traçabilité',
    body: 'Toute publication porte obligatoirement le nom complet de son auteur, son statut universitaire, son département ou institution, son adresse email vérifiée et la date d’édition.',
  },
  {
    title: '02. Intégrité scientifique et lutte contre la désinformation',
    body: 'Les faits avancés, données statistiques et textes juridiques doivent s’appuyer sur des sources identifiables. Les responsables académiques peuvent certifier ou retirer toute information erronée.',
  },
  {
    title: '03. Respect strict des droits d’auteur',
    body: 'Le plagiat et la reproduction sans autorisation sont interdits. Chaque citation d’un auteur tiers doit mentionner l’ouvrage, l’année et l’éditeur.',
  },
  {
    title: '04. Courtoisie et débat universitaire constructif',
    body: 'Les échanges dans le Forum et les chats départementaux doivent rester respectueux des personnes, des travaux étudiants et des opinions scientifiques divergentes.',
  },
];

export const ModerationView: React.FC<ModerationViewProps> = ({
  reports,
  publications,
  profiles,
  currentUser,
  onResolveReport,
  onVerifyProfile,
  onSelectPublication,
  onOpenAccessModal,
}) => {
  const [notes, setNotes] = useState<Record<string, string>>({});

  const isModerator =
    currentUser.role === 'administratif' || currentUser.role === 'enseignant';

  const pendingReports = reports.filter((r) => r.status === 'en_cours');
  const resolvedReports = reports.filter((r) => r.status !== 'en_cours');
  const pendingVerifications = profiles.filter(
    (p) => p.verificationRequested && !p.verifiedTeacher && !p.verified
  );
  const pendingPublications = publications.filter(
    (p) => p.moderationStatus === 'en_attente'
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">
            Qualité éditoriale &amp; Intégrité académique
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#1C1917]">
            Modération et qualité académique
          </h1>
          <p className="mt-2 text-sm sm:text-base text-stone-600 leading-relaxed">
            Charte des publications, contrôle des signalements, prévention des fausses informations, protection des droits d’auteur et validation des comptes enseignants et chercheurs.
          </p>
        </div>

        <div className="bg-[#FBF9F5] border border-stone-200 rounded-md p-4 text-xs space-y-1.5 shrink-0">
          <div className="font-semibold text-[#1C1917]">
            Droits de votre session : {currentUser.statusLabel}
          </div>
          {isModerator ? (
            <div className="text-[#14532D] font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              Habilité à valider, certifier ou archiver les contenus.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-stone-600">
                Vous pouvez consulter la charte et signaler des contenus depuis le Forum.
              </div>
              <button
                type="button"
                onClick={onOpenAccessModal}
                className="text-[#1E3A8A] font-medium hover:underline cursor-pointer"
              >
                Tester avec un profil Administratif ou Enseignant →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Academic Charter */}
      <section className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
        <h2 className="font-serif text-xl font-semibold text-[#1C1917] flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#1E3A8A]" aria-hidden="true" />
          Règles de publication de l’Université de Doba
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHARTER_RULES.map((rule) => (
            <div
              key={rule.title}
              className="p-4 bg-[#FBF9F5] border border-stone-200 rounded-md space-y-1.5"
            >
              <h3 className="text-sm font-semibold text-[#1C1917]">{rule.title}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{rule.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Teacher/Researcher Profile Verifications */}
      <section className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
        <h2 className="font-serif text-xl font-semibold text-[#1C1917]">
          Validation des profils enseignants et chercheurs ({pendingVerifications.length})
        </h2>
        {pendingVerifications.length === 0 ? (
          <p className="text-sm text-stone-500">
            Tous les comptes enseignants et chercheurs enregistrés ont été vérifiés. Créez un nouveau compte enseignant dans « Accès » pour tester la file de validation.
          </p>
        ) : (
          <div className="divide-y divide-stone-200">
            {pendingVerifications.map((prof) => (
              <div
                key={prof.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs text-stone-500">
                    {prof.statusLabel} · {prof.departmentName}
                    {prof.academicRank ? ` · ${prof.academicRank}` : ''}
                  </div>
                  <div className="font-serif text-base font-semibold text-[#1C1917]">
                    {prof.fullName}
                  </div>
                  <div className="text-xs font-mono text-stone-600">{prof.email}</div>
                </div>
                {isModerator && (
                  <button
                    type="button"
                    onClick={() => onVerifyProfile(prof.id)}
                    className="px-4 py-2 text-xs font-medium text-white bg-[#14532D] rounded-md inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    Délivrer le badge vérifié
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Publications awaiting review */}
      {pendingPublications.length > 0 && (
        <section className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
          <h2 className="font-serif text-xl font-semibold text-[#1C1917]">
            Publications récentes en attente de validation ({pendingPublications.length})
          </h2>
          <div className="divide-y divide-stone-200">
            {pendingPublications.map((pub) => (
              <div
                key={pub.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs text-stone-500">
                    {pub.category} · {pub.signature.authorName} ({pub.signature.verifiedEmail})
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectPublication(pub)}
                    className="mt-1 font-serif text-base font-semibold text-[#1C1917] hover:text-[#1E3A8A] text-left cursor-pointer"
                  >
                    {pub.title}
                  </button>
                </div>
                {isModerator && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onResolveReport({
                          publicationId: pub.id,
                          decision: 'valide_maintenu',
                          resolutionNote: 'Publication validée par la modération académique.',
                        })
                      }
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#14532D] rounded-md cursor-pointer"
                    >
                      Valider
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onResolveReport({
                          publicationId: pub.id,
                          decision: 'retire_archive',
                          resolutionNote: 'Retirée avant publication définitive.',
                        })
                      }
                      className="px-3.5 py-1.5 text-xs font-medium text-[#9A3412] border border-stone-300 rounded-md cursor-pointer"
                    >
                      Archiver
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Moderation Reports Queue */}
      <section className="bg-white border border-stone-200 rounded-md p-6 space-y-5">
        <h2 className="font-serif text-xl font-semibold text-[#1C1917] flex items-center gap-2">
          <FileWarning className="w-5 h-5 text-[#9A3412]" aria-hidden="true" />
          Signalements en cours d’examen ({pendingReports.length})
        </h2>

        {pendingReports.length === 0 ? (
          <p className="text-sm text-stone-500">
            Aucun signalement en attente de traitement.
          </p>
        ) : (
          <div className="space-y-4">
            {pendingReports.map((rep) => {
              const targetPub = publications.find((p) => p.id === rep.publicationId);
              return (
                <div
                  key={rep.id}
                  className="p-4 bg-[#FBF9F5] border border-stone-200 rounded-md space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#9A3412]">{rep.reason}</span>
                    <span className="text-stone-500">
                      Signalé le {rep.createdAt} par {rep.reportedByName} ({rep.reportedByRole})
                    </span>
                  </div>

                  <div>
                    <div className="font-serif text-base font-semibold text-[#1C1917]">
                      {targetPub ? (
                        <button
                          type="button"
                          onClick={() => onSelectPublication(targetPub)}
                          className="hover:text-[#1E3A8A] text-left underline decoration-stone-300 underline-offset-4 cursor-pointer"
                        >
                          {rep.publicationTitle}
                        </button>
                      ) : (
                        rep.publicationTitle
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Auteur de la publication : {rep.authorName}
                    </div>
                    <p className="mt-2 text-sm text-stone-700">{rep.details}</p>
                  </div>

                  {isModerator && (
                    <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={notes[rep.id] || ''}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [rep.id]: e.target.value }))
                        }
                        placeholder="Motif de la décision académique..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onResolveReport({
                            reportId: rep.id,
                            publicationId: rep.publicationId,
                            decision: 'valide_maintenu',
                            resolutionNote: notes[rep.id],
                          })
                        }
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#14532D] rounded-md inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Valider &amp; Certifier
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onResolveReport({
                            reportId: rep.id,
                            publicationId: rep.publicationId,
                            decision: 'retire_archive',
                            resolutionNote: notes[rep.id],
                          })
                        }
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#9A3412] rounded-md inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        Retirer la publication
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {resolvedReports.length > 0 && (
          <div className="pt-4 border-t border-stone-200 space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              Décisions archivées ({resolvedReports.length})
            </h3>
            <div className="divide-y divide-stone-200 text-xs">
              {resolvedReports.map((rep) => (
                <div key={rep.id} className="py-2.5 flex flex-wrap justify-between gap-2">
                  <div>
                    <span className="font-semibold text-[#1C1917]">
                      {rep.publicationTitle}
                    </span>
                    <span className="text-stone-500">
                      {' '}
                      — {rep.resolutionNote} (par {rep.resolvedBy})
                    </span>
                  </div>
                  <span
                    className={`font-medium ${
                      rep.status === 'valide_maintenu'
                        ? 'text-[#14532D]'
                        : 'text-[#9A3412]'
                    }`}
                  >
                    {rep.status === 'valide_maintenu' ? 'Validé' : 'Retiré'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
