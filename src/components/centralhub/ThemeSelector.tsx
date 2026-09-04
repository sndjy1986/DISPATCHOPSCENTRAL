import React, { useState } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { useTerminal } from '../../context/TerminalContext';
import { ThemeSelectorModal, THEME_LIST } from './ThemeSelectorModal';

interface ThemeSelectorButtonProps {
  variant?: 'header' | 'sidebar' | 'compact' | 'pill';
  className?: string;
}

export function ThemeSelectorButton({ variant = 'header', className = '' }: ThemeSelectorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { appTheme } = useTerminal();

  const currentTheme = THEME_LIST.find(t => t.id === appTheme) || THEME_LIST[0];

  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center justify-between w-full px-4 py-2.5 rounded-2xl text-text-dim hover:text-indigo-400 transition-all border border-transparent hover:bg-indigo-500/10 hover:border-indigo-500/20 group ${className}`}
          title="Switch Color Theme"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0 flex items-center justify-center"
              style={{ backgroundColor: currentTheme.accent }}
            >
              <Palette className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black uppercase tracking-[0.25em]">Theme: {currentTheme.name}</span>
            </div>
          </div>
          <span className="text-[8px] font-mono uppercase text-slate-500 group-hover:text-indigo-400">
            {currentTheme.category}
          </span>
        </button>

        <ThemeSelectorModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider ${className}`}
          title="Select Color Theme"
        >
          <span
            className="w-3 h-3 rounded-full border border-white/30 shrink-0 shadow-sm"
            style={{ backgroundColor: currentTheme.accent }}
          />
          <span>{currentTheme.name}</span>
          <Palette className="w-3 h-3 text-indigo-400 opacity-70" />
        </button>

        <ThemeSelectorModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  // Default 'header' / 'pill' variant
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2.5 glass-effect border-indigo-500/30 text-indigo-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2.5 transition-all hover:bg-indigo-500/20 shadow-lg shadow-indigo-950/40 cursor-pointer ${className}`}
        title="Change App Theme Matrix"
      >
        <span
          className="w-3 h-3 rounded-full border border-white/40 shrink-0 shadow-sm"
          style={{ backgroundColor: currentTheme.accent }}
        />
        <Palette className="w-4 h-4 text-indigo-400" />
        <span>Theme: <strong className="text-white not-italic">{currentTheme.name}</strong></span>
      </button>

      <ThemeSelectorModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
