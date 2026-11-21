import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { DigitalSignature } from '../types/academic';

interface DigitalSignatureBlockProps {
  signature: DigitalSignature;
  compact?: boolean;
  onInspectAuthor?: (authorId: string) => void;
}

export const DigitalSignatureBlock: React.FC<DigitalSignatureBlockProps> = ({
  signature,
  compact = false,
  onInspectAuthor,
}) => {
  return (
    <div className="border-t border-stone-200 pt-3 mt-3 text-xs text-stone-600">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-stone-400 font-medium">Auteur :</span>
          {onInspectAuthor ? (
            <button
              type="button"
              onClick={() => onInspectAuthor(signature.authorId)}
              className="font-semibold text-[#1C1917] hover:text-[#1E3A8A] underline decoration-stone-300 underline-offset-4 cursor-pointer"
            >
              {signature.authorName}
            </button>
          ) : (
            <span className="font-semibold text-[#1C1917]">{signature.authorName}</span>
          )}
          <span aria-hidden="true">·</span>
          <span>
            {signature.authorStatus} — {signature.departmentOrInstitution}
          </span>
          {signature.verifiedTeacher && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-[#14532D]">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Enseignant vérifié
                {signature.teacherRank ? ` (${signature.teacherRank})` : ''}
              </span>
            </>
          )}
          {!signature.verifiedTeacher && signature.authorVerified && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-[#1E3A8A]">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Profil vérifié
              </span>
            </>
          )}
        </div>

        <span className="font-mono text-[11px] text-stone-500 tabular-nums">
          {signature.referenceCode}
        </span>
      </div>

      {!compact && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-500">
          <span>
            Email : <span className="font-mono text-stone-700">{signature.verifiedEmail}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Publié le : <span className="text-stone-700 tabular-nums">{signature.publishedAt}</span>
          </span>
        </div>
      )}
    </div>
  );
};
