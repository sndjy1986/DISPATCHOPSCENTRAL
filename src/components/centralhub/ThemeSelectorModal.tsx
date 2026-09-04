import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, Sparkles, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useTerminal, AppTheme } from '../../context/TerminalContext';
import { Modal } from './Modal';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  category: 'dark' | 'light';
  badge: string;
  bg: string;
  surface: string;
  accent: string;
  textColor: string;
  description: string;
}

export const THEME_LIST: ThemeConfig[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    category: 'dark',
    badge: 'DARK OPS',
    bg: '#1a1d23',
    surface: '#262a33',
    accent: '#5f5495',
    textColor: '#f8fafc',
    description: 'Deep high-contrast tactical night mode with purple/red indicators',
  },
  {
    id: 'paper',
    name: 'Paper',
    category: 'light',
    badge: 'CLASSIC',
    bg: '#f8fafc',
    surface: '#f1f5f9',
    accent: '#4338ca',
    textColor: '#0f172a',
    description: 'Clean slate tactical with deep indigo accents and sharp contrast',
  },
  {
    id: 'frost',
    name: 'Frost',
    category: 'light',
    badge: 'COOL',
    bg: '#f0f9ff',
    surface: '#e0f2fe',
    accent: '#2563eb',
    textColor: '#1e40af',
    description: 'Crisp soft daylight sky with bright sapphire command accents',
  },
  {
    id: 'sky',
    name: 'Sky',
    category: 'light',
    badge: 'HIGH CONTRAST',
    bg: '#bae6fd',
    surface: '#e0f2fe',
    accent: '#0284c7',
    textColor: '#0c4a6e',
    description: 'Stormy cyan atmosphere with vivid blue tactical headers',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    category: 'light',
    badge: 'GLACIAL',
    bg: '#e2e8f0',
    surface: '#cbd5e1',
    accent: '#0ea5e9',
    textColor: '#0c4a6e',
    description: 'Glacial slate stone with electric cyan status nodes',
  },
  {
    id: 'mint',
    name: 'Mint',
    category: 'light',
    badge: 'SAGE',
    bg: '#dcfce7',
    surface: '#bbf7d0',
    accent: '#059669',
    textColor: '#064e3b',
    description: 'Relaxed sage green palette with crisp emerald alert borders',
  },
  {
    id: 'clay',
    name: 'Clay',
    category: 'light',
    badge: 'VIOLET',
    bg: '#ddd6fe',
    surface: '#ede9fe',
    accent: '#7c3aed',
    textColor: '#2e1065',
    description: 'Heathered purple tone with vibrant violet command panels',
  },
  {
    id: 'cream',
    name: 'Cream',
    category: 'light',
    badge: 'WARM',
    bg: '#eee8d5',
    surface: '#fdf6e3',
    accent: '#b45309',
    textColor: '#451a03',
    description: 'Warm amber parchment with dark espresso typographic hierarchy',
  },
  {
    id: 'ivory',
    name: 'Ivory',
    category: 'light',
    badge: 'BRONZE',
    bg: '#fffbf0',
    surface: '#f3e8d2',
    accent: '#d97706',
    textColor: '#451a03',
    description: 'Warm elegant off-white canvas with antique golden bronze accents',
  },
];

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
  const { appTheme, setAppTheme } = useTerminal();
  const [filter, setFilter] = useState<'all' | 'dark' | 'light'>('all');
  const [selectedToast, setSelectedToast] = useState<string | null>(null);

  const filteredThemes = THEME_LIST.filter(t => {
    if (filter === 'all') return true;
    return t.category === filter;
  });

  const handleSelect = (themeId: AppTheme, themeName: string) => {
    setAppTheme(themeId);
    setSelectedToast(`${themeName.toUpperCase()} THEME ACTIVATED`);
    setTimeout(() => setSelectedToast(null), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Color & Theme Matrix"
      icon={<Palette className="w-5 h-5 text-indigo-400" />}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Select an interface color scheme for the dispatch console and standalone shift reports.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({THEME_LIST.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('dark')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                filter === 'dark'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3 h-3" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => setFilter('light')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                filter === 'light'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3 h-3" />
              Light
            </button>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredThemes.map((theme) => {
            const isSelected = appTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelect(theme.id, theme.name)}
                className={`group text-left p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-400 ring-2 ring-indigo-400/50 shadow-xl shadow-indigo-950/50'
                    : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Badge & Active Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-white/10 text-slate-300 border border-white/5">
                      {theme.badge}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Check className="w-3 h-3 text-emerald-400" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Theme Live Mini-Mockup Swatch */}
                  <div
                    className="w-full h-20 rounded-xl p-2.5 flex flex-col justify-between border border-black/20 shadow-inner relative overflow-hidden transition-transform group-hover:scale-[1.02] duration-300"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-sm"
                        style={{ backgroundColor: theme.accent, color: '#ffffff' }}
                      >
                        {theme.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full shadow-sm"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span
                          className="w-2 h-2 rounded-full opacity-60 shadow-sm"
                          style={{ backgroundColor: theme.textColor }}
                        />
                      </div>
                    </div>

                    <div
                      className="p-1.5 rounded-lg border flex items-center justify-between shadow-sm"
                      style={{
                        backgroundColor: theme.surface,
                        borderColor: `${theme.textColor}22`,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded shadow-sm"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <div
                          className="h-1.5 w-12 rounded-full opacity-75"
                          style={{ backgroundColor: theme.textColor }}
                        />
                      </div>
                      <div
                        className="h-1.5 w-6 rounded-full opacity-50"
                        style={{ backgroundColor: theme.textColor }}
                      />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-wider text-white group-hover:text-indigo-300 transition-colors">
                        {theme.name}
                      </h4>
                      <span className="text-[9px] font-mono uppercase text-slate-500">
                        {theme.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {theme.description}
                    </p>
                  </div>
                </div>

                {/* Color Swatch Bar */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">
                    Palette
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: theme.bg }}
                      title="Background"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: theme.surface }}
                      title="Surface"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: theme.accent }}
                      title="Accent"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: theme.textColor }}
                      title="Text"
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Toast Notification */}
        {selectedToast && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs font-black uppercase tracking-widest text-emerald-400 animate-pulse">
            {selectedToast}
          </div>
        )}
      </div>
    </Modal>
  );
}
