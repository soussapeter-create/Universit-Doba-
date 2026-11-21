import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface VerifiedTeacherBadgeProps {
  fullName: string;
  departmentName: string;
  specialty?: string;
  academicRank?: string;
  email?: string;
  onSelect?: () => void;
}

export const VerifiedTeacherBadge: React.FC<VerifiedTeacherBadgeProps> = ({
  fullName,
  departmentName,
  specialty,
  academicRank,
  email,
  onSelect,
}) => {
  return (
    <div className="bg-white border border-stone-200 rounded-md p-4 flex flex-col justify-between gap-2">
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-[#14532D] font-semibold">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            Enseignant vérifié
          </span>
          {academicRank && (
            <span className="text-stone-600 font-medium">{academicRank}</span>
          )}
        </div>

        <h4 className="mt-2 font-serif text-base font-semibold text-[#1C1917]">
          {onSelect ? (
            <button
              type="button"
              onClick={onSelect}
              className="text-left hover:text-[#1E3A8A] underline decoration-stone-300 underline-offset-4 cursor-pointer"
            >
              {fullName}
            </button>
          ) : (
            fullName
          )}
        </h4>

        <p className="mt-1 text-xs text-stone-600">{departmentName}</p>
        {specialty && (
          <p className="mt-1 text-xs text-stone-500">
            Spécialité : <span className="text-stone-700">{specialty}</span>
          </p>
        )}
      </div>

      {email && (
        <div className="pt-2 border-t border-stone-100 text-[11px] font-mono text-stone-500 truncate">
          {email}
        </div>
      )}
    </div>
  );
};
