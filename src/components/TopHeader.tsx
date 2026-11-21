import React from 'react';
import { UserProfile } from '../types/academic';

export type ActiveSection = 'forum' | 'departments' | 'chat' | 'library' | 'moderation';

interface TopHeaderProps {
  activeSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
  currentUser: UserProfile;
  onOpenAccessModal: () => void;
}

const NAV_ITEMS: { id: ActiveSection; label: string }[] = [
  { id: 'forum', label: 'Forum' },
  { id: 'departments', label: 'Départements' },
  { id: 'chat', label: 'Chat' },
  { id: 'library', label: 'Bibliothèque' },
  { id: 'moderation', label: 'Modération' },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeSection,
  onNavigate,
  currentUser,
  onOpenAccessModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('forum')}
          className="text-left font-serif text-xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A] cursor-pointer"
        >
          Université de Doba
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1.5 border-b-2 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A] ${
                  isActive
                    ? 'border-[#1E3A8A] text-[#1E3A8A] font-semibold'
                    : 'border-transparent text-stone-600 hover:text-[#1C1917] hover:border-stone-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenAccessModal}
            className="px-4 py-2 text-xs font-medium text-white bg-[#1E3A8A] hover:bg-[#172C69] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 max-w-[220px] truncate cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
            title={`${currentUser.fullName} — ${currentUser.statusLabel}`}
          >
            Accès · {currentUser.statusLabel}
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="Navigation mobile"
        className="md:hidden flex items-center gap-5 overflow-x-auto px-4 py-2 border-t border-stone-200/80 text-xs font-medium"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`py-1 border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'border-[#1E3A8A] text-[#1E3A8A] font-semibold'
                  : 'border-transparent text-stone-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
