import React, { useState, useEffect } from 'react';
import { Palette, Check, Sun, Moon, Type, Sliders, RotateCcw, Sparkles, Activity } from 'lucide-react';
import { useTerminal, AppTheme } from '../../context/TerminalContext';
import { Modal } from './Modal';
import { 
  LabelStyleConfig, 
  getSavedLabelStyle, 
  saveLabelStyle, 
  resetSavedLabelStyle, 
  COLOR_PRESETS, 
  SIZE_PRESETS,
  DEFAULT_LABEL_STYLE
} from '../../lib/labelStyle';

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
  // --- Darker Tactical Themes ---
  {
    id: 'abyss',
    name: 'OLED Abyss',
    category: 'dark',
    badge: 'PITCH BLACK',
    bg: '#020204',
    surface: '#0a0a0f',
    accent: '#00f0ff',
    textColor: '#ffffff',
    description: 'Ultra-deep OLED obsidian pitch black with laser cyan contrast',
  },
  {
    id: 'stealth',
    name: 'Stealth Carbon',
    category: 'dark',
    badge: 'GUNMETAL',
    bg: '#0b0f17',
    surface: '#111827',
    accent: '#10b981',
    textColor: '#e2e8f0',
    description: 'Tactical carbon fiber gunmetal with emerald status indicators',
  },
  {
    id: 'cyber',
    name: 'Cyber Void',
    category: 'dark',
    badge: 'NEON VOID',
    bg: '#090810',
    surface: '#131022',
    accent: '#c084fc',
    textColor: '#f3e8ff',
    description: 'Deep purple void night with electric violet command borders',
  },
  {
    id: 'slate-dark',
    name: 'Slate Night',
    category: 'dark',
    badge: 'DEEP NAVY',
    bg: '#0c111d',
    surface: '#151c2e',
    accent: '#38bdf8',
    textColor: '#e0e7ff',
    description: 'Tactical night operations deep navy slate with crisp sapphire highlights',
  },
  {
    id: 'matrix',
    name: 'Matrix Obsidian',
    category: 'dark',
    badge: 'DIGITAL CRT',
    bg: '#020904',
    surface: '#05190a',
    accent: '#22c55e',
    textColor: '#dcfce7',
    description: 'Pure terminal obsidian with glowing green phosphor readouts',
  },
  {
    id: 'midnight',
    name: 'Midnight Ops',
    category: 'dark',
    badge: 'DARK OPS',
    bg: '#1a1d23',
    surface: '#262a33',
    accent: '#5f5495',
    textColor: '#f8fafc',
    description: 'High-contrast tactical night mode with purple & crimson alert nodes',
  },

  // --- Daylight & High Contrast Themes ---
  {
    id: 'paper',
    name: 'Paper Slate',
    category: 'light',
    badge: 'CLASSIC',
    bg: '#f8fafc',
    surface: '#f1f5f9',
    accent: '#4338ca',
    textColor: '#0f172a',
    description: 'Clean slate tactical paper with deep indigo command accents',
  },
  {
    id: 'frost',
    name: 'Frost Sky',
    category: 'light',
    badge: 'COOL',
    bg: '#f0f9ff',
    surface: '#e0f2fe',
    accent: '#2563eb',
    textColor: '#1e40af',
    description: 'Crisp soft daylight sky with bright sapphire command highlights',
  },
  {
    id: 'sky',
    name: 'Sky Cyan',
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
    name: 'Arctic Stone',
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
    name: 'Mint Sage',
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
    name: 'Clay Violet',
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
    name: 'Cream Amber',
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
    name: 'Ivory Bronze',
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
  const [activeTab, setActiveTab] = useState<'themes' | 'typography'>('themes');
  const [filter, setFilter] = useState<'all' | 'dark' | 'light'>('all');
  const [selectedToast, setSelectedToast] = useState<string | null>(null);

  // Typography & Label Styling State
  const [labelStyle, setLabelStyleState] = useState<LabelStyleConfig>(getSavedLabelStyle);

  useEffect(() => {
    if (isOpen) {
      setLabelStyleState(getSavedLabelStyle());
    }
  }, [isOpen]);

  const updateLabelStyle = (partial: Partial<LabelStyleConfig>) => {
    setLabelStyleState(prev => {
      const updated = { ...prev, ...partial };
      saveLabelStyle(updated);
      return updated;
    });
  };

  const handleResetTypography = () => {
    const def = resetSavedLabelStyle();
    setLabelStyleState(def);
    setSelectedToast("FONT STYLING RESET TO DEFAULT");
    setTimeout(() => setSelectedToast(null), 2500);
  };

  const filteredThemes = THEME_LIST.filter(t => {
    if (filter === 'all') return true;
    return t.category === filter;
  });

  const handleSelectTheme = (themeId: AppTheme, themeName: string) => {
    setAppTheme(themeId);
    setSelectedToast(`${themeName.toUpperCase()} THEME ACTIVATED`);
    setTimeout(() => setSelectedToast(null), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appearance & Typography Matrix"
      icon={<Palette className="w-5 h-5 text-indigo-400" />}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Top Navigation Bar: Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('themes')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'themes'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              Themes ({THEME_LIST.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('typography')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'typography'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-4 h-4" />
              Font & Typography
            </button>
          </div>

          {/* If on themes tab, show filter */}
          {activeTab === 'themes' && (
            <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  filter === 'dark'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3 h-3" />
                Dark ({THEME_LIST.filter(t => t.category === 'dark').length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('light')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  filter === 'light'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3 h-3" />
                Light ({THEME_LIST.filter(t => t.category === 'light').length})
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: THEMES GRID */}
        {activeTab === 'themes' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 font-medium">
              Select an interface color scheme for the dispatch console and shift reports. Includes 6 high-contrast ultra-dark tactical modes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[62vh] overflow-y-auto custom-scrollbar pr-1">
              {filteredThemes.map((theme) => {
                const isSelected = appTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme.id, theme.name)}
                    className={`group text-left p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between gap-4 cursor-pointer ${
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
          </div>
        )}

        {/* TAB 2: TYPOGRAPHY & FONT STYLING */}
        {activeTab === 'typography' && (
          <div className="space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar pr-2">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Adjust font size, weights, and high-visibility colors for field prompt headers and box labels across the application.
              </p>
            </div>

            {/* Live Interactive Preview Card */}
            <div className="tactical-card p-6 space-y-3 shadow-xl">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between border-b border-white/10 pb-2">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Live Box Prompt Preview
                </span>
                <span className="text-indigo-400 font-mono font-bold">{labelStyle.fontSize}px • {labelStyle.color}</span>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 pl-2">
                  <Activity style={{ color: labelStyle.color }} className="w-3.5 h-3.5 opacity-80" />
                  <label 
                    style={{ 
                      color: labelStyle.color, 
                      fontSize: `${labelStyle.fontSize}px` 
                    }}
                    className={`${labelStyle.fontWeight} ${labelStyle.textTransform} tracking-wider transition-all leading-none select-none`}
                  >
                    Sample Field Header Prompt
                  </label>
                </div>
                <input 
                  type="text" 
                  disabled 
                  value="10-4 • Units En Route to Sector Alpha" 
                  className="w-full tactical-input p-3.5 text-xs font-mono text-white/90 cursor-default" 
                />
              </div>
            </div>

            {/* Prompt Text Color Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  Prompt Text Color
                </label>
                <span className="text-[10px] font-mono text-slate-400">{labelStyle.color}</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = labelStyle.color.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => updateLabelStyle({ color: preset.hex })}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-white/15 border-white shadow-lg scale-105 ring-2 ring-indigo-500/40' 
                          : 'bg-black/30 border-white/10 hover:border-white/30 hover:bg-white/5'
                      }`}
                      title={preset.description}
                    >
                      <span 
                        className="w-7 h-7 rounded-full border border-white/20 shadow-inner flex items-center justify-center shrink-0" 
                        style={{ backgroundColor: preset.hex }}
                      >
                        {isSelected && (
                          <Check className={`w-3.5 h-3.5 ${preset.hex === '#ffffff' || preset.hex === '#fbbf24' || preset.hex === '#a3e635' ? 'text-black' : 'text-white'}`} />
                        )}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-tight text-slate-300 truncate max-w-full">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Color Picker */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Custom Color:</span>
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 flex-1">
                  <input 
                    type="color" 
                    value={labelStyle.color.startsWith('#') && labelStyle.color.length === 7 ? labelStyle.color : '#94a3b8'} 
                    onChange={(e) => updateLabelStyle({ color: e.target.value })}
                    className="w-6 h-6 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={labelStyle.color} 
                    onChange={(e) => updateLabelStyle({ color: e.target.value })}
                    placeholder="#94a3b8" 
                    className="bg-transparent border-none text-xs font-mono text-white outline-none w-full uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Prompt Text Size Presets & Slider */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Prompt Text Size
                </label>
                <span className="text-xs font-mono font-bold text-indigo-400">{labelStyle.fontSize}px</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SIZE_PRESETS.map((preset) => {
                  const isSelected = labelStyle.fontSize === preset.size;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => updateLabelStyle({ fontSize: preset.size })}
                      className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                          : 'bg-black/30 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {preset.label} ({preset.size}px)
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 pt-1">
                <span className="text-[9px] font-mono text-slate-500">8px</span>
                <input 
                  type="range" 
                  min={8} 
                  max={24} 
                  step={1}
                  value={labelStyle.fontSize} 
                  onChange={(e) => updateLabelStyle({ fontSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-[9px] font-mono text-slate-500">24px</span>
              </div>
            </div>

            {/* Font Weight & Text Casing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Font Weight
                </label>
                <select
                  value={labelStyle.fontWeight}
                  onChange={(e) => updateLabelStyle({ fontWeight: e.target.value as LabelStyleConfig['fontWeight'] })}
                  className="w-full bg-black/40 border border-white/10 text-white text-xs font-medium rounded-xl p-3 outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="font-normal" className="bg-slate-900">Normal (400)</option>
                  <option value="font-medium" className="bg-slate-900">Medium (500)</option>
                  <option value="font-semibold" className="bg-slate-900">Semibold (600)</option>
                  <option value="font-bold" className="bg-slate-900">Bold (700)</option>
                  <option value="font-black" className="bg-slate-900">Heavy Black (900)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Letter Casing
                </label>
                <select
                  value={labelStyle.textTransform}
                  onChange={(e) => updateLabelStyle({ textTransform: e.target.value as LabelStyleConfig['textTransform'] })}
                  className="w-full bg-black/40 border border-white/10 text-white text-xs font-medium rounded-xl p-3 outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="uppercase" className="bg-slate-900">UPPERCASE</option>
                  <option value="normal-case" className="bg-slate-900">Standard Case</option>
                </select>
              </div>
            </div>

            {/* Bottom Actions for Typography */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleResetTypography}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>

              <button
                type="button"
                onClick={() => {
                  saveLabelStyle(labelStyle);
                  setSelectedToast("TYPOGRAPHY SETTINGS SAVED");
                  setTimeout(() => setSelectedToast(null), 2000);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
              >
                Apply & Save
              </button>
            </div>
          </div>
        )}

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
