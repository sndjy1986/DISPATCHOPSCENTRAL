import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Maximize2, 
  X, 
  Copy, 
  Check, 
  Settings, 
  Save, 
  Pencil, 
  PanelLeftClose, 
  PanelLeft, 
  ChevronRight,
  Link as LinkIcon,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, onSnapshot, updateDoc, setDoc } from '../../lib/firebase';
import { useTerminal } from '../../context/TerminalContext';

export interface ShiftSheetConfig {
  mainSheetUrl: string;
  aShiftUrl: string;
  bShiftUrl: string;
  cShiftUrl: string;
  deltaShiftUrl: string; // D-Shift
}

export const DEFAULT_SHEET_CONFIG: ShiftSheetConfig = {
  mainSheetUrl: 'https://docs.google.com/spreadsheets/d/1-4Uwh00g4orCaOQoOrLIcRkamAhdxrBNhVVOt2IEOoY/edit?gid=534085027#gid=534085027',
  aShiftUrl: 'https://docs.google.com/spreadsheets/d/1-4Uwh00g4orCaOQoOrLIcRkamAhdxrBNhVVOt2IEOoY/edit?gid=534085027#gid=534085027',
  bShiftUrl: 'https://docs.google.com/spreadsheets/d/12V94dal4UvVJcsRMBd3fCj49pJjiOXFMTgZa1tdaEE0/edit?gid=1621560398#gid=1621560398',
  cShiftUrl: 'https://docs.google.com/spreadsheets/d/1-4Uwh00g4orCaOQoOrLIcRkamAhdxrBNhVVOt2IEOoY/edit?gid=0#gid=0',
  deltaShiftUrl: 'https://docs.google.com/spreadsheets/d/1-4Uwh00g4orCaOQoOrLIcRkamAhdxrBNhVVOt2IEOoY/edit?gid=10001#gid=10001',
};

interface AugustSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'main' | 'a' | 'b' | 'c' | 'delta';
}

export function AugustSheetModal({ isOpen, onClose, initialTab = 'main' }: AugustSheetModalProps) {
  const { terminalUser } = useTerminal();
  
  const [sheetConfig, setSheetConfig] = useState<ShiftSheetConfig>(() => {
    try {
      const saved = localStorage.getItem('august_sheet_config_v1');
      return saved ? JSON.parse(saved) : DEFAULT_SHEET_CONFIG;
    } catch (e) {
      return DEFAULT_SHEET_CONFIG;
    }
  });

  const [activeTab, setActiveTab] = useState<'main' | 'a' | 'b' | 'c' | 'delta'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [isSlideOutOpen, setIsSlideOutOpen] = useState(true);
  const [editingShiftKey, setEditingShiftKey] = useState<keyof ShiftSheetConfig | null>(null);
  const [editUrlValue, setEditUrlValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync with Firestore global settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.augustSheetConfig) {
          setSheetConfig(data.augustSheetConfig);
          try {
            localStorage.setItem('august_sheet_config_v1', JSON.stringify(data.augustSheetConfig));
          } catch (e) {}
        }
      }
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const currentUrl = 
    activeTab === 'a' ? sheetConfig.aShiftUrl :
    activeTab === 'b' ? sheetConfig.bShiftUrl :
    activeTab === 'c' ? sheetConfig.cShiftUrl :
    activeTab === 'delta' ? sheetConfig.deltaShiftUrl :
    sheetConfig.mainSheetUrl;

  // Convert google spreadsheet edit URL to clean htmlview preview URL
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('docs.google.com/spreadsheets')) {
        let clean = url.replace(/\/edit.*$/, '/htmlview');
        if (!clean.includes('/htmlview')) {
          clean += '/htmlview';
        }
        return clean;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePopoutWindow = (url: string, title: string) => {
    const width = 1280;
    const height = 850;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      url,
      `ShiftSheet_${title}`,
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
    );
  };

  const handleSaveUrlForKey = async (key: keyof ShiftSheetConfig, newUrl: string) => {
    setIsSaving(true);
    const updated = {
      ...sheetConfig,
      [key]: newUrl.trim() || DEFAULT_SHEET_CONFIG[key]
    };

    setSheetConfig(updated);
    try {
      localStorage.setItem('august_sheet_config_v1', JSON.stringify(updated));
      const globalRef = doc(db, 'settings', 'global');
      await updateDoc(globalRef, {
        augustSheetConfig: updated
      }).catch(async () => {
        await setDoc(globalRef, { augustSheetConfig: updated }, { merge: true });
      });
    } catch (err) {
      console.error('Failed saving to Firestore:', err);
    } finally {
      setIsSaving(false);
      setEditingShiftKey(null);
    }
  };

  const SHIFT_ITEMS: Array<{
    id: 'a' | 'b' | 'c' | 'delta';
    key: keyof ShiftSheetConfig;
    code: string;
    name: string;
    desc: string;
    url: string;
    badgeColor: string;
    activeTabBg: string;
    accentColor: string;
  }> = [
    {
      id: 'a',
      key: 'aShiftUrl',
      code: 'A-Shift',
      name: 'Alpha Shift',
      desc: 'Day Operations Sheet',
      url: sheetConfig.aShiftUrl,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      activeTabBg: 'bg-emerald-600 text-white shadow-emerald-600/30',
      accentColor: 'border-emerald-500'
    },
    {
      id: 'b',
      key: 'bShiftUrl',
      code: 'B-Shift',
      name: 'Bravo Shift',
      desc: 'Night Operations Sheet',
      url: sheetConfig.bShiftUrl,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      activeTabBg: 'bg-blue-600 text-white shadow-blue-600/30',
      accentColor: 'border-blue-500'
    },
    {
      id: 'c',
      key: 'cShiftUrl',
      code: 'C-Shift',
      name: 'Charlie Shift',
      desc: 'Secondary Day Sheet',
      url: sheetConfig.cShiftUrl,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      activeTabBg: 'bg-amber-600 text-white shadow-amber-600/30',
      accentColor: 'border-amber-500'
    },
    {
      id: 'delta',
      key: 'deltaShiftUrl',
      code: 'D-Shift',
      name: 'Delta Shift',
      desc: 'Relief & Special Ops Sheet',
      url: sheetConfig.deltaShiftUrl,
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      activeTabBg: 'bg-purple-600 text-white shadow-purple-600/30',
      accentColor: 'border-purple-500'
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-hidden">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="bg-[#0b0c10] border border-white/10 rounded-3xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl overflow-hidden relative"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-white/10 bg-black/50 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => setIsSlideOutOpen(!isSlideOutOpen)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-white transition-all border border-emerald-500/30 flex items-center gap-2"
                title={isSlideOutOpen ? "Hide Shift Drawer" : "Show Shift Drawer"}
              >
                {isSlideOutOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
                  {isSlideOutOpen ? 'Close Menu' : 'Shift Menu'}
                </span>
              </button>

              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    Shift Sheet Pop Out
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase border border-emerald-500/30">
                    A • B • C • D
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  August Shift Sheets & Direct Roster Editor
                </p>
              </div>
            </div>

            {/* Top Action Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-2"
                title="Copy Active Tab Link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => handlePopoutWindow(currentUrl, activeTab.toUpperCase())}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                title="Pop Out Sheet in Standalone Window"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Pop Out Window</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(currentUrl, '_blank')}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-2"
                title="Open in New Browser Tab"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">New Tab</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all border border-white/10 ml-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Body with Slide-Out Drawer & Embedded View */}
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* Slide-Out Drawer Panel */}
            <AnimatePresence initial={false}>
              {isSlideOutOpen && (
                <motion.div
                  initial={{ x: -320, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -320, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="w-full sm:w-80 bg-black/90 border-r border-white/10 flex flex-col shrink-0 z-30 shadow-2xl overflow-y-auto"
                >
                  <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black uppercase text-white tracking-wider">
                        Shift Sheets Drawer
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Select / Edit
                    </span>
                  </div>

                  {/* Main Sheet Quick Link */}
                  <div className="p-3 border-b border-white/5">
                    <div
                      onClick={() => setActiveTab('main')}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                        activeTab === 'main'
                          ? 'bg-slate-200 text-slate-900 border-white shadow-lg'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className={`w-5 h-5 ${activeTab === 'main' ? 'text-slate-900' : 'text-emerald-400'}`} />
                        <div>
                          <div className="text-xs font-black uppercase tracking-wider">August Main Sheet</div>
                          <div className={`text-[9px] font-medium ${activeTab === 'main' ? 'text-slate-700' : 'text-slate-400'}`}>
                            Master Operations Sheet
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-60" />
                    </div>
                  </div>

                  {/* 4 Shift Cards: A-Shift, B-Shift, C-Shift, D-Shift */}
                  <div className="p-3 space-y-3 flex-1">
                    <div className="px-1 text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center justify-between">
                      <span>Shift Sheets</span>
                      <span className="text-[9px] text-emerald-400 font-bold">Click Pencil to Edit Link</span>
                    </div>

                    {SHIFT_ITEMS.map((shift) => {
                      const isActive = activeTab === shift.id;
                      const isEditing = editingShiftKey === shift.key;

                      return (
                        <div
                          key={shift.id}
                          className={`rounded-2xl border transition-all p-3 relative overflow-hidden ${
                            isActive
                              ? `bg-white/10 ${shift.accentColor} shadow-lg shadow-black/50`
                              : 'bg-white/5 hover:bg-white/[0.08] border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div 
                              onClick={() => setActiveTab(shift.id)}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${shift.badgeColor}`}>
                                  {shift.code}
                                </span>
                                <span className="text-xs font-black text-white uppercase">{shift.name}</span>
                              </div>
                              <p className="text-[10px] font-medium text-slate-400 mt-1">
                                {shift.desc}
                              </p>
                            </div>

                            {/* Action Buttons for this Shift */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingShiftKey(null);
                                  } else {
                                    setEditingShiftKey(shift.key);
                                    setEditUrlValue(shift.url);
                                  }
                                }}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isEditing 
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                                }`}
                                title={`Edit ${shift.code} Google Sheet Link`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePopoutWindow(shift.url, shift.code)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 transition-all border border-white/10"
                                title={`Pop Out ${shift.code} in Standalone Window`}
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Edit URL Drawer for this Shift */}
                          {isEditing && (
                            <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-fadeIn">
                              <label className="text-[9px] font-black uppercase text-amber-300 block">
                                Edit {shift.code} Google Sheet URL:
                              </label>
                              <input
                                type="text"
                                value={editUrlValue}
                                onChange={(e) => setEditUrlValue(e.target.value)}
                                placeholder="Paste Google Sheet URL here..."
                                className="w-full bg-black/80 border border-white/20 p-2 rounded-xl text-xs font-mono text-white outline-none focus:border-amber-400"
                              />
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingShiftKey(null)}
                                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-bold uppercase rounded-lg border border-white/10"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleSaveUrlForKey(shift.key, editUrlValue)}
                                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase rounded-lg shadow-lg flex items-center gap-1"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>{isSaving ? 'Saving...' : 'Save Link'}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Active Tab View Indicator */}
                          {isActive && !isEditing && (
                            <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-emerald-400 pt-1 border-t border-white/5">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Currently Embedded
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveTab(shift.id)}
                                className="underline hover:text-white"
                              >
                                View Sheet
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Drawer Footer Tip */}
                  <div className="p-3 border-t border-white/10 bg-black/40 text-[9px] text-slate-400 font-mono">
                    💡 All sheet links saved here persist automatically across terminals & users.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Embedded Google Sheet Viewer Area */}
            <div className="flex-1 bg-[#12141d] relative w-full h-full overflow-hidden flex flex-col">
              
              {/* Horizontal Shift Tabs (Fast Switcher) */}
              <div className="bg-black/70 px-4 py-2.5 border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">
                  Active View:
                </span>

                <button
                  type="button"
                  onClick={() => setActiveTab('main')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 ${
                    activeTab === 'main'
                      ? 'bg-slate-200 text-slate-900 border-white shadow-md'
                      : 'bg-white/5 text-slate-400 hover:text-white border-white/5'
                  }`}
                >
                  August Main Sheet
                </button>

                <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

                {SHIFT_ITEMS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveTab(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 flex items-center gap-1.5 ${
                      activeTab === s.id
                        ? `${s.activeTabBg} border-white/20`
                        : 'bg-white/5 text-slate-300 hover:text-white border-white/5'
                    }`}
                  >
                    <span>{s.code}</span>
                  </button>
                ))}
              </div>

              {/* SpreadSheet Iframe View */}
              <iframe
                src={getEmbedUrl(currentUrl)}
                title="Shift Sheet Google Viewer"
                className="w-full h-full border-0 bg-white"
                allow="autoplay"
              />

              {/* Bottom Status Bar */}
              <div className="p-3 bg-black/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono shrink-0">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Viewing: {activeTab === 'main' ? 'August Main Sheet' : `${activeTab.toUpperCase()}-SHIFT SHEET`}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-sm hidden md:inline">
                    {currentUrl}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePopoutWindow(currentUrl, activeTab.toUpperCase())}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1"
                  >
                    <Maximize2 className="w-3 h-3" /> Pop Out Standalone Window
                  </button>
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

