import React, { useState } from 'react';
import { Check, ShieldCheck, UserPlus, X } from 'lucide-react';
import { AcademicRank, Department, UserProfile, UserRole } from '../types/academic';

interface AccessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: UserProfile[];
  currentUser: UserProfile;
  departments: Department[];
  onSwitchUser: (profile: UserProfile) => void;
  onCreateProfile: (payload: {
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
  }) => Promise<void>;
}

const ROLE_RIGHTS: Record<UserRole, { label: string; summary: string }> = {
  etudiant: {
    label: 'Étudiant',
    summary:
      'Lecture complète, chat par filière/niveau/groupe, remise d’exercices, publication de travaux étudiants et commentaires.',
  },
  enseignant: {
    label: 'Enseignant',
    summary:
      'Badge Enseignant vérifié, annonces officielles, supports de cours, création et correction d’exercices, réponses certifiées, modération.',
  },
  chercheur: {
    label: 'Chercheur',
    summary:
      'Publication d’articles scientifiques et recherches, évaluation par les pairs, citations académiques et accès aux chats.',
  },
  alumni: {
    label: 'Ancien étudiant (Alumni)',
    summary:
      'Mentorat dans les départements, partage d’expériences professionnelles, forum public et bibliothèque.',
  },
  administratif: {
    label: 'Personnel administratif',
    summary:
      'Validation des profils enseignants/chercheurs, modération des signalements, annonces officielles du rectorat.',
  },
  partenaire: {
    label: 'Partenaire universitaire',
    summary:
      'Publication d’événements et colloques conjoints, accès aux échanges interuniversitaires et bibliothèque.',
  },
  visiteur: {
    label: 'Visiteur',
    summary:
      'Accès libre en lecture au Forum universitaire public, aux départements et à la Bibliothèque des connaissances.',
  },
};

export const AccessProfileModal: React.FC<AccessProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  currentUser,
  departments,
  onSwitchUser,
  onCreateProfile,
}) => {
  const [tab, setTab] = useState<'switch' | 'register'>('switch');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('etudiant');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-droit-prive');
  const [institution, setInstitution] = useState('Université de Doba');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [academicRank, setAcademicRank] = useState<AcademicRank>('Chargé de Cours');
  const [programName, setProgramName] = useState('Droit privé');
  const [studyLevel, setStudyLevel] = useState('Licence 3');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim()) {
      setError('Veuillez renseigner votre nom complet et votre adresse email.');
      return;
    }
    setSubmitting(true);
    try {
      await onCreateProfile({
        fullName,
        role,
        departmentId,
        institution,
        email,
        specialty: role === 'enseignant' || role === 'chercheur' ? specialty : undefined,
        academicRank: role === 'enseignant' ? academicRank : undefined,
        programName: role === 'etudiant' ? programName : undefined,
        studyLevel: role === 'etudiant' ? studyLevel : undefined,
        bio,
      });
      setFullName('');
      setEmail('');
      setSpecialty('');
      setBio('');
      setTab('switch');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du profil.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-modal-title"
    >
      <div className="bg-[#FBF9F5] border border-stone-300 rounded-md w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="access-modal-title" className="font-serif text-xl font-semibold text-[#1C1917]">
              Accès universel &amp; Profils académiques
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Connecté actuellement : <strong className="text-[#1C1917]">{currentUser.fullName}</strong> ({currentUser.statusLabel})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="p-2 text-stone-500 hover:text-[#1C1917] rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 flex items-center gap-2 border-b border-stone-200 bg-white">
          <button
            type="button"
            onClick={() => setTab('switch')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'switch'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-stone-600 hover:text-[#1C1917]'
            }`}
          >
            Changer de profil (7 niveaux d’accès)
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
              tab === 'register'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-stone-600 hover:text-[#1C1917]'
            }`}
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            Créer un nouveau compte
          </button>
        </div>

        <div className="p-6">
          {tab === 'switch' ? (
            <div className="space-y-4">
              <p className="text-sm text-stone-600 leading-relaxed">
                Le réseau de l’Université de Doba est ouvert à l’ensemble de la communauté académique et aux visiteurs. Sélectionnez un profil ci-dessous pour explorer les droits et outils adaptés à chaque statut.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profiles.map((p) => {
                  const isCurrent = p.id === currentUser.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSwitchUser(p);
                        onClose();
                      }}
                      className={`text-left p-4 rounded-md border transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-white border-[#1E3A8A] ring-1 ring-[#1E3A8A]'
                          : 'bg-white border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-medium text-[#1E3A8A]">
                            {p.statusLabel}
                            {p.verifiedTeacher ? ' · Enseignant vérifié' : ''}
                          </div>
                          <div className="font-serif text-base font-semibold text-[#1C1917] mt-0.5">
                            {p.fullName}
                          </div>
                        </div>
                        {isCurrent && (
                          <Check className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-1" aria-hidden="true" />
                        )}
                      </div>
                      <div className="mt-1 text-xs text-stone-600">{p.departmentName}</div>
                      <div className="mt-1 font-mono text-[11px] text-stone-500">{p.email}</div>
                      <p className="mt-2 pt-2 border-t border-stone-100 text-xs text-stone-500 leading-relaxed">
                        {ROLE_RIGHTS[p.role]?.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-stone-200 rounded-md p-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex. : Nadji Djasnabaye"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Statut / Niveau d’accès *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="etudiant">Étudiant</option>
                    <option value="enseignant">Enseignant (vérification requise)</option>
                    <option value="chercheur">Chercheur</option>
                    <option value="alumni">Ancien étudiant (Alumni)</option>
                    <option value="administratif">Personnel administratif</option>
                    <option value="partenaire">Partenaire universitaire</option>
                    <option value="visiteur">Visiteur intéressé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Adresse email professionnelle ou vérifiée *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@univ-doba.td"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Département de rattachement
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:border-[#1E3A8A]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(role === 'enseignant' || role === 'chercheur') && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Spécialité académique
                      </label>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ex. : Droit public / Économie rurale"
                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                      />
                    </div>
                    {role === 'enseignant' && (
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Grade universitaire
                        </label>
                        <select
                          value={academicRank}
                          onChange={(e) => setAcademicRank(e.target.value as AcademicRank)}
                          className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:border-[#1E3A8A]"
                        >
                          <option value="Professeur Titulaire">Professeur Titulaire</option>
                          <option value="Maître de Conférences">Maître de Conférences</option>
                          <option value="Maître-Assistant">Maître-Assistant</option>
                          <option value="Chargé de Cours">Chargé de Cours</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {role === 'etudiant' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Filière
                      </label>
                      <input
                        type="text"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Niveau d’études
                      </label>
                      <select
                        value={studyLevel}
                        onChange={(e) => setStudyLevel(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:border-[#1E3A8A]"
                      >
                        <option value="Licence 1">Licence 1</option>
                        <option value="Licence 2">Licence 2</option>
                        <option value="Licence 3">Licence 3</option>
                        <option value="Master">Master</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Institution / Organisation
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Notice biographique académique
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Parcours, thèmes de recherche ou centre d’intérêt..."
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-4 border-t border-stone-100">
                <div className="text-xs text-stone-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#14532D]" aria-hidden="true" />
                  <span>
                    {role === 'enseignant'
                      ? 'Les comptes enseignants sont soumis à validation administrative dans l’onglet Modération.'
                      : 'Votre signature numérique sera générée automatiquement pour chaque publication.'}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#172C69] rounded-md whitespace-nowrap disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Enregistrement...' : 'Activer le profil'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
