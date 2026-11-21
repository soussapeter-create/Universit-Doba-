import React, { useEffect, useMemo, useState } from 'react';
import { HelpCircle, MessageSquare, Send, ShieldCheck } from 'lucide-react';
import {
  ChatMessage,
  ChatMessageKind,
  Department,
  UserProfile,
} from '../types/academic';

interface ChatViewProps {
  departments: Department[];
  messages: ChatMessage[];
  currentUser: UserProfile;
  initialChannel?: {
    departmentId: string;
    programName: string;
    levelName: string;
  } | null;
  onSendMessage: (payload: {
    channelKey: string;
    departmentId: string;
    departmentName: string;
    programName: string;
    levelName: string;
    groupName: string;
    kind: ChatMessageKind;
    content: string;
  }) => Promise<void>;
  onOfficialAnswer: (messageId: string, content: string) => Promise<void>;
  onOpenAccessModal: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  departments,
  messages,
  currentUser,
  initialChannel,
  onSendMessage,
  onOfficialAnswer,
  onOpenAccessModal,
}) => {
  const [departmentId, setDepartmentId] = useState<string>(
    initialChannel?.departmentId || departments[0]?.id || 'dept-droit-prive'
  );

  const selectedDept = useMemo(
    () => departments.find((d) => d.id === departmentId) || departments[0],
    [departments, departmentId]
  );

  const [programName, setProgramName] = useState<string>(
    initialChannel?.programName || selectedDept?.programs[0]?.name || 'Droit privé'
  );
  const selectedProgram = useMemo(
    () =>
      selectedDept?.programs.find((p) => p.name === programName) ||
      selectedDept?.programs[0],
    [selectedDept, programName]
  );

  const [levelName, setLevelName] = useState<string>(
    initialChannel?.levelName || 'Licence 3'
  );
  const [groupName, setGroupName] = useState<string>(
    selectedProgram?.groups[0] || 'Groupe A'
  );

  useEffect(() => {
    if (initialChannel) {
      setDepartmentId(initialChannel.departmentId);
      setProgramName(initialChannel.programName);
      setLevelName(initialChannel.levelName);
      const dept = departments.find((d) => d.id === initialChannel.departmentId);
      const prog = dept?.programs.find((p) => p.name === initialChannel.programName) || dept?.programs[0];
      if (prog && prog.groups.length > 0) {
        setGroupName(prog.groups[0]);
      }
    }
  }, [initialChannel, departments]);

  const [kindFilter, setKindFilter] = useState<'all' | ChatMessageKind>('all');
  const [messageKind, setMessageKind] = useState<ChatMessageKind>('discussion');
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [answeringId, setAnsweringId] = useState<string | null>(null);

  if (!selectedDept || !selectedProgram) return null;

  const channelKey = `${selectedDept.id}|${selectedProgram.name}|${levelName}|${groupName}`;

  const channelMessages = useMemo(() => {
    return messages
      .filter((m) => m.channelKey === channelKey)
      .filter((m) => (kindFilter === 'all' ? true : m.kind === kindFilter));
  }, [messages, channelKey, kindFilter]);

  const handleDepartmentChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    const dept = departments.find((d) => d.id === newDeptId);
    if (dept && dept.programs.length > 0) {
      const firstProg = dept.programs[0];
      setProgramName(firstProg.name);
      setLevelName(firstProg.levels.includes('Licence 3') ? 'Licence 3' : firstProg.levels[0]);
      setGroupName(firstProg.groups[0]);
    }
  };

  const handleProgramChange = (newProgName: string) => {
    setProgramName(newProgName);
    const prog = selectedDept.programs.find((p) => p.name === newProgName);
    if (prog) {
      setLevelName(prog.levels.includes(levelName) ? levelName : prog.levels[0]);
      setGroupName(prog.groups[0]);
    }
  };

  const applyPreset = (
    deptId: string,
    prog: string,
    lvl: string,
    grp: string
  ) => {
    setDepartmentId(deptId);
    setProgramName(prog);
    setLevelName(lvl);
    setGroupName(grp);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setSending(true);
    try {
      await onSendMessage({
        channelKey,
        departmentId: selectedDept.id,
        departmentName: selectedDept.name,
        programName: selectedProgram.name,
        levelName,
        groupName,
        kind: messageKind,
        content: messageInput,
      });
      setMessageInput('');
    } finally {
      setSending(false);
    }
  };

  const isTeacher = currentUser.role === 'enseignant';
  const isVisitor = currentUser.role === 'visiteur';

  return (
    <div className="space-y-6">
      {/* Cascading Department -> Program -> Level -> Group Selector */}
      <section className="bg-white border border-stone-200 rounded-md p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">
              Communication pédagogique structurée
            </div>
            <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              Chat académique par département
            </h1>
          </div>

          {/* Quick-jump presets matching brief examples */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-stone-500">Accès rapides :</span>
            <button
              type="button"
              onClick={() =>
                applyPreset('dept-droit-prive', 'Droit privé', 'Licence 3', 'Groupe A')
              }
              className={`px-3 py-1.5 rounded-md border cursor-pointer ${
                channelKey === 'dept-droit-prive|Droit privé|Licence 3|Groupe A'
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                  : 'bg-[#FBF9F5] text-stone-700 border-stone-200 hover:border-stone-400'
              }`}
            >
              Licence 3 Droit privé
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset('dept-informatique', 'Génie logiciel', 'Licence 3', 'Groupe A')
              }
              className={`px-3 py-1.5 rounded-md border cursor-pointer ${
                channelKey === 'dept-informatique|Génie logiciel|Licence 3|Groupe A'
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                  : 'bg-[#FBF9F5] text-stone-700 border-stone-200 hover:border-stone-400'
              }`}
            >
              Département Informatique
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset('dept-gestion', 'Gestion', 'Master', 'Groupe Unique')
              }
              className={`px-3 py-1.5 rounded-md border cursor-pointer ${
                channelKey === 'dept-gestion|Gestion|Master|Groupe Unique'
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                  : 'bg-[#FBF9F5] text-stone-700 border-stone-200 hover:border-stone-400'
              }`}
            >
              Master Gestion
            </button>
          </div>
        </div>

        {/* 4-Step Cascade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-200">
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              1. Département
            </label>
            <select
              value={selectedDept.id}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              2. Filière
            </label>
            <select
              value={selectedProgram.name}
              onChange={(e) => handleProgramChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
            >
              {selectedDept.programs.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              3. Niveau d’études
            </label>
            <select
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
            >
              {selectedProgram.levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              4. Groupe
            </label>
            <select
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
            >
              {selectedProgram.groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Active Chat Channel Workspace */}
      <section className="bg-white border border-stone-200 rounded-md overflow-hidden">
        <div className="px-6 py-4 bg-[#FBF9F5] border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1E3A8A]" aria-hidden="true" />
              Chat « {levelName} {selectedProgram.name} · {groupName} »
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {selectedDept.name} · Responsable : {selectedDept.headName}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-md p-1 text-xs">
            <button
              type="button"
              onClick={() => setKindFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                kindFilter === 'all'
                  ? 'bg-[#1E3A8A] text-white font-medium'
                  : 'text-stone-600 hover:text-[#1C1917]'
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('question')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                kindFilter === 'question'
                  ? 'bg-[#1E3A8A] text-white font-medium'
                  : 'text-stone-600 hover:text-[#1C1917]'
              }`}
            >
              Questions
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('pedagogique')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                kindFilter === 'pedagogique'
                  ? 'bg-[#1E3A8A] text-white font-medium'
                  : 'text-stone-600 hover:text-[#1C1917]'
              }`}
            >
              Infos pédagogiques
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="p-6 space-y-4 min-h-[320px] max-h-[540px] overflow-y-auto bg-[#FBF9F5]/40">
          {channelMessages.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-500">
              Aucun message dans le canal <strong>{levelName} {selectedProgram.name} · {groupName}</strong> pour le moment. Lancez la discussion académique ci-dessous.
            </div>
          ) : (
            channelMessages.map((msg) => (
              <article
                key={msg.id}
                className="bg-white border border-stone-200 rounded-md p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#1C1917]">{msg.authorName}</span>
                    <span className="text-stone-500">· {msg.authorStatus}</span>
                    {msg.verifiedTeacher && (
                      <span className="inline-flex items-center gap-1 font-medium text-[#14532D]">
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        Enseignant vérifié
                        {msg.teacherRank ? ` (${msg.teacherRank})` : ''}
                      </span>
                    )}
                    {msg.kind === 'question' && (
                      <span className="inline-flex items-center gap-1 font-medium text-[#1E3A8A]">
                        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        Question académique
                      </span>
                    )}
                    {msg.kind === 'pedagogique' && (
                      <span className="font-semibold text-[#78350F]">
                        · Information pédagogique
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-stone-400 tabular-nums">
                    {msg.createdAt}
                  </span>
                </div>

                <p className="text-sm text-[#292524] leading-relaxed">{msg.content}</p>

                {msg.officialAnswer && (
                  <div className="mt-2 pt-3 border-t border-stone-200 bg-[#FBF9F5] p-3.5 rounded-md space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#14532D] inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        Réponse officielle · {msg.officialAnswer.authorName}
                        {msg.officialAnswer.teacherRank
                          ? ` (${msg.officialAnswer.teacherRank})`
                          : ''}
                      </span>
                      <span className="font-mono text-[11px] text-stone-400 tabular-nums">
                        {msg.officialAnswer.answeredAt}
                      </span>
                    </div>
                    <p className="text-sm text-stone-700 leading-relaxed">
                      {msg.officialAnswer.content}
                    </p>
                  </div>
                )}

                {isTeacher && msg.kind === 'question' && !msg.officialAnswer && (
                  <div className="pt-2">
                    {answeringId === msg.id ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={answerDrafts[msg.id] || ''}
                          onChange={(e) =>
                            setAnswerDrafts((prev) => ({
                              ...prev,
                              [msg.id]: e.target.value,
                            }))
                          }
                          placeholder="Rédiger la réponse pédagogique officielle..."
                          className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const txt = answerDrafts[msg.id];
                            if (!txt?.trim()) return;
                            await onOfficialAnswer(msg.id, txt);
                            setAnswerDrafts((prev) => ({ ...prev, [msg.id]: '' }));
                            setAnsweringId(null);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-[#14532D] rounded-md cursor-pointer"
                        >
                          Publier la réponse
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAnsweringId(msg.id)}
                        className="text-xs font-medium text-[#1E3A8A] hover:underline cursor-pointer"
                      >
                        Répondre officiellement en tant qu’enseignant →
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        {/* Message Composer */}
        <div className="p-4 sm:p-5 bg-white border-t border-stone-200">
          {isVisitor ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
              <span>
                En tant que visiteur, vous pouvez consulter les échanges académiques. Activez un profil étudiant, enseignant ou partenaire pour écrire dans le chat.
              </span>
              <button
                type="button"
                onClick={onOpenAccessModal}
                className="px-4 py-2 text-xs font-medium text-white bg-[#1E3A8A] rounded-md whitespace-nowrap cursor-pointer"
              >
                Changer de profil
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-stone-500">Type de message :</span>
                  <select
                    value={messageKind}
                    onChange={(e) => setMessageKind(e.target.value as ChatMessageKind)}
                    className="px-2.5 py-1 bg-[#FBF9F5] border border-stone-300 rounded-md text-xs font-medium"
                  >
                    <option value="discussion">Discussion générale</option>
                    <option value="question">Question académique</option>
                    {(isTeacher || currentUser.role === 'administratif') && (
                      <option value="pedagogique">Information pédagogique</option>
                    )}
                  </select>
                </div>
                <span className="text-stone-500">
                  Signature active : <strong className="text-[#1C1917]">{currentUser.fullName}</strong>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Écrire dans ${levelName} ${selectedProgram.name} (${groupName})...`}
                  className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#1E3A8A]"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="px-5 py-2.5 text-xs font-medium text-white bg-[#1E3A8A] hover:bg-[#172C69] rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  Envoyer
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
