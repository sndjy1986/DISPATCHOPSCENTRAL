import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clipboard, 
  CheckCircle2, 
  Circle, 
  X, 
  Save, 
  FileText,
  AlertCircle,
  Truck,
  User,
  Calendar,
  Activity,
  History,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Inbox,
  Loader2,
  Eye,
  Maximize2,
  HardDrive
} from 'lucide-react';
import { BackupControlModal } from '../components/BackupControlModal';
import { format } from 'date-fns';
import { useTerminal } from '../context/TerminalContext';
import { db, handleFirestoreError, PersonnelMember, getTurnoverReports, saveTurnoverReport } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { TEAM_MEMBERS, ALSSUP_OPTIONS, MEDSUP_OPTIONS, DEFAULT_ZULU_OPTIONS, SHIFT_TEAMS, EMPLOYEE_EMAILS } from '../lib/shiftConstants';

const STORAGE_KEY = "shiftReportDraft_v2";

interface TurnoverData {
  date: string;
  currentTeamLead: string;
  oncomingTeamLead: string;
  alssup: string;
  medsup: string;
  zuluPrimary: string;
  zuluSecondary: string;

  // Handover Checks
  floorsVacuumed: boolean;
  computersRestarted: boolean;
  wipedDown: boolean;
  timesDqc: boolean;

  // Other Issues
  unitsOut: string;
  badCalls: string;
  busyAreas: string;

  systemStatusLevel: string;
  specialEvents: string;
}

export default function ShiftTurnover({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { terminalUser } = useTerminal();
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  
  const [turnoverData, setTurnoverData] = useState<TurnoverData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    currentTeamLead: '',
    oncomingTeamLead: '',
    alssup: '',
    medsup: '',
    zuluPrimary: '',
    zuluSecondary: '',
    floorsVacuumed: false,
    computersRestarted: false,
    wipedDown: false,
    timesDqc: false,
    unitsOut: '',
    badCalls: '',
    busyAreas: '',
    systemStatusLevel: 'Normal',
    specialEvents: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [turnoverLogs, setTurnoverLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedTurnover, setSelectedTurnover] = useState<any | null>(null);

  const fetchTurnoverHistory = async () => {
    setLoadingHistory(true);
    try {
      const logs = await getTurnoverReports(50);
      if (logs) setTurnoverLogs(logs);
    } catch (err) {
      console.error("Failed to load turnover history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const [alssupList, setAlssupList] = useState<string[]>(ALSSUP_OPTIONS);
  const [medsupList, setMedsupList] = useState<string[]>(MEDSUP_OPTIONS);
  const [zuluList, setZuluList] = useState<string[]>(DEFAULT_ZULU_OPTIONS);

  // Sync active personnel list and load shift report draft
  useEffect(() => {
    // 0. Cache hydration
    try {
      const cached = localStorage.getItem('cached_global_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.zuluOptions) setZuluList(parsed.zuluOptions);
        if (parsed.alssupOptions) setAlssupList(parsed.alssupOptions);
      }
    } catch (e) {}

    // 1. Sync personnel & global settings
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.personnel) {
          setPersonnel(data.personnel);
        }
        if (data.alssupOptions) {
          setAlssupList(data.alssupOptions);
        }
        if (data.supervisors) {
          setMedsupList(Object.keys(data.supervisors));
        }
        if (data.zuluOptions) {
          setZuluList(data.zuluOptions);
        }
      }
    });

    // 2. Load draft
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setReportData(draft);
        setTurnoverData(prev => ({
          ...prev,
          date: draft.date || prev.date,
          currentTeamLead: draft.name || prev.currentTeamLead,
          alssup: draft.alssup || prev.alssup,
          medsup: draft.medsup || prev.medsup,
          zuluPrimary: draft.zuluPrimary || prev.zuluPrimary,
          zuluSecondary: draft.zuluSecondary || prev.zuluSecondary,
        }));
      } catch (err) {
        console.error("Draft load error:", err);
      }
    }

    return () => unsubscribe();
  }, []);

  const SHIFT_LEADS = [
    { name: 'Corrine Skelly', email: 'cskelly@medshore.com' },
    { name: 'Erin Brandenburg', email: 'ebrandenburg@medshore.com' },
    { name: 'Joseph Sanders', email: 'jsanders@medshore.com' },
    { name: 'Crystal Culbertson', email: 'cculbertson@medshore.com' }
  ];

  const handleToggle = (key: keyof TurnoverData) => {
    setTurnoverData(prev => ({ 
      ...prev, 
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key] 
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalData = {
        meta: {
          date: turnoverData.date,
          currentTeamLead: turnoverData.currentTeamLead || 'PENDING',
          oncomingTeamLead: turnoverData.oncomingTeamLead || 'PENDING',
          alssup: turnoverData.alssup || 'None',
          medsup: turnoverData.medsup || 'None',
          zuluUnits: `${turnoverData.zuluPrimary || ''} ${turnoverData.zuluSecondary ? '/ ' + turnoverData.zuluSecondary : ''}`.trim() || 'NONE'
        },
        checks: {
          floorsVacuumed: turnoverData.floorsVacuumed,
          computersRestarted: turnoverData.computersRestarted,
          wipedDown: turnoverData.wipedDown,
          timesDqc: turnoverData.timesDqc
        },
        otherIssues: {
          unitsOut: turnoverData.unitsOut,
          badCalls: turnoverData.badCalls,
          busyAreas: turnoverData.busyAreas
        },
        specialEvents: turnoverData.specialEvents,
        systemStatusLevel: turnoverData.systemStatusLevel,
        submittedAt: serverTimestamp(),
        submittedBy: terminalUser?.username || 'Operator'
      };

      await saveTurnoverReport(finalData);
      
      const copyText = `TURNOVER REPORT
Date: ${finalData.meta.date}
Current Team Lead: ${finalData.meta.currentTeamLead}
Oncoming Team Lead: ${finalData.meta.oncomingTeamLead}

SUPERVISORS
ALSSUP: ${finalData.meta.alssup}
MEDSUP: ${finalData.meta.medsup}

ZULU ON-CALL
Zulu Units: ${finalData.meta.zuluUnits}

CHECKS
Floors Vacuumed: ${finalData.checks.floorsVacuumed ? "Yes" : "No"}
Computers Restarted: ${finalData.checks.computersRestarted ? "Yes" : "No"}
Wiped Down: ${finalData.checks.wipedDown ? "Yes" : "No"}
Times & DQC: ${finalData.checks.timesDqc ? "Yes" : "No"}

OTHER ISSUES
Units Out: ${finalData.otherIssues.unitsOut || "None"}
Bad Calls: ${finalData.otherIssues.badCalls || "None"}
Busy Areas: ${finalData.otherIssues.busyAreas || "None"}

System Level: ${finalData.systemStatusLevel}

SPECIAL EVENTS & BRIEFING
${finalData.specialEvents || "None"}
`;
      await navigator.clipboard.writeText(copyText);
      alert("Turnover report has been copied to the clipboard!\n\nEmail window is launching with the oncoming Team Lead and Supervisor pre-loaded.");

      // Email formatting & launch
      const oncomingLeadObj = SHIFT_LEADS.find(p => p.name === turnoverData.oncomingTeamLead);
      const oncomingEmail = oncomingLeadObj?.email || '';
      
      const toList = [
        "gwilliams@medshore.com"
      ].filter(Boolean).join(";");

      const getShiftEmails = (leadName: string) => {
        // Find the team where this person is the lead
        const shiftEntry = Object.values(SHIFT_TEAMS).find(team => team.lead === leadName);
        if (!shiftEntry) return [];
        const members = [shiftEntry.lead, ...shiftEntry.members];
        return members.map(name => {
          return EMPLOYEE_EMAILS[name] || `${name.toLowerCase().replace(/\s+/g, '')}@medshore.com`;
        });
      };

      const ccSet = new Set([
        ...getShiftEmails(turnoverData.currentTeamLead),
        ...getShiftEmails(turnoverData.oncomingTeamLead)
      ]);
      const ccList = Array.from(ccSet).filter(Boolean).join(";");
      
      const formatDateForSubject = (dateStr: string) => {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [y, m, d] = parts;
        return `${parseInt(m)}/${parseInt(d)}/${y.slice(2)}`;
      };

      const subject = `Shift Turnover Report - ${formatDateForSubject(turnoverData.date)}`;
      const body = `*** FULL TURNOVER REPORT COPIED TO CLIPBOARD ***\n\nSummary:\n- Current Lead: ${turnoverData.currentTeamLead}\n- Oncoming Lead: ${turnoverData.oncomingTeamLead}\n- Date: ${turnoverData.date}\n\nClick here and press Ctrl+V to paste the detailed handover report.`;
      
      let mailto = `mailto:${encodeURIComponent(toList)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (ccList) {
        mailto = `mailto:${encodeURIComponent(toList)}?cc=${encodeURIComponent(ccList)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
      window.location.href = mailto;

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      handleFirestoreError(e, 'create' as any, 'shift_turnovers');
    } finally {
      setIsSaving(false);
    }
  };

  const containerClass = isEmbedded ? "" : "max-w-4xl mx-auto p-6 md:p-12 font-sans selection:bg-indigo-500/30";

  return (
    <div className={containerClass}>
      {!isEmbedded && (
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <History className="w-5 h-5 text-white" />
               </div>
               <h1 className="text-4xl font-black text-white uppercase italic tracking-tight">Shift <span className="text-indigo-500 not-italic">Turnover</span></h1>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-13 italic">Operational Handover Protocol</p>
          </div>
          
          <div className="flex items-center gap-4">
             <button
               type="button"
               onClick={() => {
                 setShowHistoryModal(true);
                 fetchTurnoverHistory();
               }}
               className="px-5 py-2.5 glass-effect border-white/10 text-slate-300 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-white/10"
             >
               <History className="w-3.5 h-3.5 text-indigo-400" />
               Turnover Archive
             </button>
             <button
               type="button"
               onClick={() => setShowBackupModal(true)}
               className="px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-indigo-500/20"
             >
               <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
               Backup (.json)
             </button>
             <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Sync Ready</span>
             </div>
          </div>
        </header>
      )}

      {isEmbedded && (
        <div className="mt-20 mb-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            <h2 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] italic">Turnover Protocol</h2>
            <button
              type="button"
              onClick={() => {
                setShowHistoryModal(true);
                fetchTurnoverHistory();
              }}
              className="px-4 py-1.5 glass-effect border-white/10 text-slate-300 hover:text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-white/10"
            >
              <History className="w-3 h-3 text-indigo-400" />
              Turnover Archive
            </button>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Left Column: Shift Info & Supervisors & Zulu */}
        <section className="space-y-6">
          <div className="tactical-card p-8 bg-[#101014]/60 backdrop-blur-xl border-indigo-500/20 space-y-6">
            <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-4 flex items-center gap-3">
              <Clipboard className="w-3.5 h-3.5" /> Shift Info
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1 block">Date</label>
                <input 
                  type="date"
                  value={turnoverData.date}
                  onChange={(e) => setTurnoverData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1 block">Current Team Lead</label>
                <select 
                  value={turnoverData.currentTeamLead}
                  onChange={(e) => setTurnoverData(prev => ({ ...prev, currentTeamLead: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-indigo-500/50 transition-all"
                >
                  <option className="bg-[#1a1a24] text-white" value="">-- SELECT CURRENT TEAM LEAD --</option>
                  {SHIFT_LEADS.map(lead => (
                    <option className="bg-[#1a1a24] text-white" key={lead.name} value={lead.name}>{lead.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1 block">Oncoming Team Lead</label>
                <select 
                  value={turnoverData.oncomingTeamLead}
                  onChange={(e) => setTurnoverData(prev => ({ ...prev, oncomingTeamLead: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-indigo-500/50 transition-all"
                >
                  <option className="bg-[#1a1a24] text-white" value="">-- SELECT ONCOMING TEAM LEAD --</option>
                  {SHIFT_LEADS.map(lead => (
                    <option className="bg-[#1a1a24] text-white" key={lead.name} value={lead.name}>{lead.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] pt-4 mb-4 border-b border-white/5 pb-4 flex items-center gap-3">
              <Activity className="w-3.5 h-3.5" /> Supervisors
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1 block">ALSSUP</label>
                <select 
                  value={turnoverData.alssup}
                  onChange={(e) => setTurnoverData(prev => ({ ...prev, alssup: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-indigo-500/50 transition-all"
                >
                  <option className="bg-[#1a1a24] text-white" value="">-- SELECT --</option>
                  {alssupList.map(opt => (
                    <option className="bg-[#1a1a24] text-white" key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1 block">Med Sup</label>
                <select 
                  value={turnoverData.medsup}
                  onChange={(e) => setTurnoverData(prev => ({ ...prev, medsup: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-indigo-500/50 transition-all"
                >
                  <option className="bg-[#1a1a24] text-white" value="">-- SELECT --</option>
                  {medsupList.map(opt => (
                    <option className="bg-[#1a1a24] text-white" key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] pt-4 mb-4 border-b border-white/5 pb-4 flex items-center gap-3">
              <Truck className="w-3.5 h-3.5" /> Zulu On-Call
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1 block">Primary</label>
                <select
                  value={turnoverData.zuluPrimary}
                  onChange={(e) => setTurnoverData(prev => ({ ...prev, zuluPrimary: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                >
                  <option value="" className="bg-[#0f1118] text-slate-500">-- SELECT ZULU PRIMARY --</option>
                  {turnoverData.zuluPrimary && !zuluList.includes(turnoverData.zuluPrimary) && (
                    <option value={turnoverData.zuluPrimary} className="bg-[#0f1118]">{turnoverData.zuluPrimary}</option>
                  )}
                  {zuluList.map(z => (
                    <option key={z} value={z} className="bg-[#0f1118]">{z}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1 block">Secondary</label>
                <select
                  value={turnoverData.zuluSecondary}
                  onChange={(e) => setTurnoverData(prev => ({ ...prev, zuluSecondary: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                >
                  <option value="" className="bg-[#0f1118] text-slate-500">-- SELECT ZULU SECONDARY --</option>
                  {turnoverData.zuluSecondary && !zuluList.includes(turnoverData.zuluSecondary) && (
                    <option value={turnoverData.zuluSecondary} className="bg-[#0f1118]">{turnoverData.zuluSecondary}</option>
                  )}
                  {zuluList.map(z => (
                    <option key={z} value={z} className="bg-[#0f1118]">{z}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Checkboxes & Other Issues */}
        <section className="space-y-6">
          <div className="tactical-card p-8 space-y-6">
            <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-4 flex items-center gap-3">
              <CheckCircle2 className="w-3.5 h-3.5" /> Handover Checks
            </h2>

            <div className="space-y-3">
              <ToggleButton 
                label="Floors Vacuumed" 
                active={turnoverData.floorsVacuumed} 
                onClick={() => handleToggle('floorsVacuumed')} 
              />
              <ToggleButton 
                label="Computers Restarted" 
                active={turnoverData.computersRestarted} 
                onClick={() => handleToggle('computersRestarted')} 
              />
              <ToggleButton 
                label="Wiped Down" 
                active={turnoverData.wipedDown} 
                onClick={() => handleToggle('wipedDown')} 
              />
              <ToggleButton 
                label="Times & DQC" 
                active={turnoverData.timesDqc} 
                onClick={() => handleToggle('timesDqc')} 
              />
            </div>

            <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] pt-4 mb-4 border-b border-white/5 pb-4 flex items-center gap-3">
              <ShieldAlert className="w-3.5 h-3.5" /> Other Issues
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1 block">Units Out</label>
                <input 
                  type="text"
                  value={turnoverData.unitsOut}
                  onChange={(e) => setTurnoverData(prev => ({ ...prev, unitsOut: e.target.value }))}
                  placeholder="Units Out briefing..."
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1 block">Bad Calls</label>
                <input 
                  type="text"
                  value={turnoverData.badCalls}
                  onChange={(e) => setTurnoverData(prev => ({ ...prev, badCalls: e.target.value }))}
                  placeholder="Bad Calls log..."
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1 block">Busy Areas</label>
                <input 
                  type="text"
                  value={turnoverData.busyAreas}
                  onChange={(e) => setTurnoverData(prev => ({ ...prev, busyAreas: e.target.value }))}
                  placeholder="Busy Areas notes..."
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Status Level</label>
              <select 
                value={turnoverData.systemStatusLevel}
                onChange={(e) => setTurnoverData(prev => ({ ...prev, systemStatusLevel: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none focus:border-indigo-500/50 transition-all"
              >
                <option className="bg-[#1a1a24] text-white" value="Normal">Level: Normal</option>
                <option className="bg-[#1a1a24] text-white" value="Elevated">Level: Elevated</option>
                <option className="bg-[#1a1a24] text-white" value="Critical">Level: Critical</option>
                <option className="bg-[#1a1a24] text-white" value="Overdrive">Level: Overdrive</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      <section className="tactical-card p-8 mb-12">
        <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-4 flex items-center gap-3">
          <AlertCircle className="w-3.5 h-3.5" /> Special Events & Briefing
        </h2>
        <textarea 
          value={turnoverData.specialEvents}
          onChange={(e) => setTurnoverData(prev => ({ ...prev, specialEvents: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm font-mono text-white min-h-[120px] outline-none focus:border-indigo-500/50 transition-all"
          placeholder="Briefing notes for the oncoming shift..."
        />
      </section>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] italic leading-relaxed">
            * SUBMITTING WILL SYNC FLIGHT NODE, COPY PLAIN REPORT, AND LAUNCH PRE-ADDRESSED OUTLOOK COMPOSE WINDOW.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="tactical-btn-indigo px-10 py-4 shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group h-14 min-w-[240px] shrink-0"
        >
          {isSaving ? (
            <Activity className="w-5 h-5 animate-spin" />
          ) : showSuccess ? (
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>LOGGED & SENT</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 justify-center">
               <Save size={18} />
               <span>COMPLETE TURNOVER</span>
               <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </button>
      </div>

      {/* Turnover History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div onClick={() => setShowHistoryModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
          <div className="relative w-full max-w-5xl bg-[#101014] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                  <History className="w-6 h-6 text-indigo-500" /> Turnover Archives
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">
                  Historical Handover Records in Cloud Database
                </p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="p-3 hover:bg-white/10 rounded-2xl transition-colors text-slate-400"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-white/5">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Retrieving Turnover Logs...</p>
                </div>
              ) : turnoverLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
                  <Inbox className="w-16 h-16 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">No turnover reports saved yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {turnoverLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4 hover:border-indigo-500/30 transition-all text-left relative"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                          {log.meta?.date || "No Date"}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          By: {log.submittedBy || "Operator"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase">Current Lead</p>
                          <p className="font-black text-white">{log.meta?.currentTeamLead || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase">Oncoming Lead</p>
                          <p className="font-black text-white">{log.meta?.oncomingTeamLead || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono space-y-1 bg-black/30 p-3 rounded-xl border border-white/5">
                        <p><strong className="text-slate-300">Supervisors:</strong> ALSSUP: {log.meta?.alssup} | MEDSUP: {log.meta?.medsup}</p>
                        <p><strong className="text-slate-300">Status Level:</strong> {log.systemStatusLevel || 'Normal'}</p>
                        {log.otherIssues?.unitsOut && <p><strong className="text-slate-300">Units Out:</strong> {log.otherIssues.unitsOut}</p>}
                        {log.specialEvents && <p><strong className="text-slate-300">Briefing:</strong> {log.specialEvents}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backup & Export Modal */}
      <BackupControlModal 
        isOpen={showBackupModal} 
        onClose={() => setShowBackupModal(false)} 
        onRefreshData={fetchTurnoverHistory} 
      />
    </div>
  );
}

function ToggleButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
        active 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
          : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'
      }`}
    >
      <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-emerald-400' : ''}`}>{label}</span>
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
        active ? 'bg-emerald-500 text-white' : 'bg-white/10'
      }`}>
        {active ? <CheckCircle2 size={14} /> : <Circle size={14} className="opacity-20" />}
      </div>
    </button>
  );
}
