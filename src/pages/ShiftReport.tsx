/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { useTerminal } from '../context/TerminalContext';
import { 
  Clipboard, 
  Mail, 
  Trash2, 
  ExternalLink, 
  User, 
  Truck, 
  Clock, 
  CheckCircle2,
  Maximize2,
  X,
  FileText,
  Phone,
  Radio,
  Shield,
  Users,
  Zap,
  Activity,
  Calendar,
  Globe,
  UserCheck,
  Lock,
  AlertCircle,
  ArrowRight,
  EyeOff,
  Eye
} from 'lucide-react';
import { ThemeSelectorButton } from '../components/centralhub/ThemeSelector';
import { 
  TEAM_MEMBERS, 
  SHIFT_TEAMS,
  ALSSUP_OPTIONS, 
  DEFAULT_ZULU_OPTIONS, 
  MEDSUP_MAP, 
  BASE_REPORT_EMAILS, 
  CC_EMAIL, 
  SHIFTS,
  INITIAL_DATA,
  ShiftReportData 
} from '../lib/shiftConstants';
import { 
  doc, 
  onSnapshot, 
  db, 
  PersonnelMember 
} from '../lib/firebase';
import { 
  LabelStyleConfig, 
  DEFAULT_LABEL_STYLE, 
  getSavedLabelStyle 
} from '../lib/labelStyle';

const STORAGE_KEY = "shiftReportDraft_v2";

const LabelStyleContext = React.createContext<LabelStyleConfig>(DEFAULT_LABEL_STYLE);

export function useLabelStyle() {
  return React.useContext(LabelStyleContext);
}

export default function ShiftReport({ isModal, onClose }: { isModal?: boolean; onClose?: () => void } = {}) {
  const [data, setData] = useState<ShiftReportData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...INITIAL_DATA, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DATA;
  });

  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  
  // Custom Box Prompt Label Color & Size Configuration synced with ThemeSelectorModal
  const [labelStyle, setLabelStyle] = useState<LabelStyleConfig>(getSavedLabelStyle);

  useEffect(() => {
    const handleStyleUpdate = (e: any) => {
      if (e?.detail) {
        setLabelStyle(e.detail);
      } else {
        setLabelStyle(getSavedLabelStyle());
      }
    };
    window.addEventListener('shift_report_label_style_changed', handleStyleUpdate);
    window.addEventListener('storage', handleStyleUpdate);
    return () => {
      window.removeEventListener('shift_report_label_style_changed', handleStyleUpdate);
      window.removeEventListener('storage', handleStyleUpdate);
    };
  }, []);
  
  const handlePasteReport = () => setShowPasteModal(true);
  
  // Standalone detection
  const location = useLocation();
  const isStandalone = location.pathname === '/single-shift-report' || location.pathname === '/shift-report/standalone' || new URLSearchParams(location.search).get('standalone') === 'true';

  const { terminalUser } = useTerminal();
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);
  const [zuluList, setZuluList] = useState<string[]>(DEFAULT_ZULU_OPTIONS);
  
  // Sync with Firestore Global Settings (Personnel, Zulu, Supervisors)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('cached_global_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.zuluOptions) setZuluList(parsed.zuluOptions);
        if (parsed.alssupOptions) setAlssupList(parsed.alssupOptions);
      }
    } catch (e) {}

    const settingsRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d.personnel) setPersonnel(d.personnel);
        if (d.supervisors) setSupervisors(d.supervisors);
        if (d.alssupOptions) setAlssupList(d.alssupOptions);
        if (d.zuluOptions) setZuluList(d.zuluOptions);
      }
    });

    return () => unsubscribe();
  }, []);

  // Compute shift teams from personnel with robust static fallbacks
  const shiftTeams = useMemo(() => {
    const teams: Record<string, { lead: string; members: string[] }> = {
      'A': { lead: '', members: [] },
      'B': { lead: '', members: [] },
      'C': { lead: '', members: [] },
      'D': { lead: '', members: [] },
      'Other': { lead: '', members: [] }
    };

    if (personnel && personnel.length > 0) {
      personnel.forEach(p => {
        let targetKey: string = p.shift;
        if (targetKey === 'Alpha' || targetKey === 'A-Shift' || targetKey === 'A') targetKey = 'A';
        else if (targetKey === 'Bravo' || targetKey === 'B-Shift' || targetKey === 'B') targetKey = 'B';
        else if (targetKey === 'Charlie' || targetKey === 'C-Shift' || targetKey === 'C') targetKey = 'C';
        else if (targetKey === 'Delta' || targetKey === 'D-Shift' || targetKey === 'D') targetKey = 'D';
        else targetKey = 'Other';

        const expectedLead = targetKey === 'A' ? SHIFT_TEAMS['Alpha']?.lead :
                             targetKey === 'B' ? SHIFT_TEAMS['Bravo']?.lead :
                             targetKey === 'C' ? SHIFT_TEAMS['Charlie']?.lead :
                             targetKey === 'D' ? SHIFT_TEAMS['Delta']?.lead : '';

        const isLead = p.role?.toLowerCase().includes('lead') || 
                       p.role?.toLowerCase().includes('supervisor') ||
                       p.name === expectedLead;

        if (isLead && !teams[targetKey].lead) {
          teams[targetKey].lead = p.name;
        } else {
          teams[targetKey].members.push(p.name);
        }
      });
    } else {
      if (SHIFT_TEAMS['Alpha']) teams['A'] = { lead: SHIFT_TEAMS['Alpha'].lead, members: SHIFT_TEAMS['Alpha'].members };
      if (SHIFT_TEAMS['Bravo']) teams['B'] = { lead: SHIFT_TEAMS['Bravo'].lead, members: SHIFT_TEAMS['Bravo'].members };
      if (SHIFT_TEAMS['Charlie']) teams['C'] = { lead: SHIFT_TEAMS['Charlie'].lead, members: SHIFT_TEAMS['Charlie'].members };
      if (SHIFT_TEAMS['Delta']) teams['D'] = { lead: SHIFT_TEAMS['Delta'].lead, members: SHIFT_TEAMS['Delta'].members };
    }

    return teams;
  }, [personnel]);

  // Dynamic Data State
  const [supervisors, setSupervisors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("shiftReport_supervisors");
    return saved ? JSON.parse(saved) : MEDSUP_MAP;
  });
  
  const [alssupList, setAlssupList] = useState<string[]>(() => {
    const saved = localStorage.getItem("shiftReport_alssup");
    return saved ? JSON.parse(saved) : ALSSUP_OPTIONS;
  });

  useEffect(() => {
    localStorage.setItem("shiftReport_supervisors", JSON.stringify(supervisors));
  }, [supervisors]);

  useEffect(() => {
    localStorage.setItem("shiftReport_alssup", JSON.stringify(alssupList));
  }, [alssupList]);

  // Auto-save logic to local buffer
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.error(e);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' && value) {
        for (const [shiftKey, team] of Object.entries(shiftTeams)) {
          if (team.lead === value || team.members.includes(value)) {
            updated.shift = shiftKey as any;
            break;
          }
        }
      }
      return updated;
    });
  };

  const handleTextareaTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      
      const nextValue = value.substring(0, start) + "    " + value.substring(end);
      const name = target.name;
      
      const event = {
        target: {
          name,
          value: nextValue
        }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      
      handleChange(event);
      
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const clearData = () => {
    if (window.confirm("Are you sure you want to clear all form data?")) {
      setData(INITIAL_DATA);
      localStorage.removeItem(STORAGE_KEY);
      setShowToast("Form buffer cleared");
    }
  };

  const buildReport = () => {
    const reportParts: string[] = [];

    const formatTabularData = (text: string) => {
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) return text;
      const rows = lines.map(line => line.split(/\t|\s{2,}/).map(cell => cell.trim()));
      const maxCols = Math.max(...rows.map(r => r.length));
      const colWidths: number[] = [];
      for (let i = 0; i < maxCols; i++) {
        let maxW = 0;
        rows.forEach(row => {
          const val = row[i] || "";
          if (val.length > maxW) maxW = val.length;
        });
        colWidths[i] = maxW;
      }
      return rows.map(row => {
        let lineStr = "";
        for (let i = 0; i < maxCols; i++) {
          const cell = row[i] || "";
          if (i === maxCols - 1) {
            lineStr += cell;
          } else {
            lineStr += cell.padEnd(colWidths[i] + 3, ' ');
          }
        }
        return lineStr;
      }).join('\n');
    };

    const addSection = (title: string, content: string | string[], isTabular: boolean = false) => {
      const header = `**${title}**`;
      reportParts.push(header);
      
      if (Array.isArray(content)) {
        content.forEach(line => reportParts.push(line));
      } else {
        let text = (typeof content === 'string' ? content.trim() : "");
        if (isTabular && text) {
          text = formatTabularData(text);
        }
        reportParts.push(text || "None");
      }
      reportParts.push(""); // spacer
    };

    addSection("Info", [
      `Name: ${data.name || "N/A"}`,
      `Date: ${data.date || "N/A"}`,
      `Shift: ${data.shift}`
    ]);

    addSection("Radio Assignments", [
      `Ch.1: ${data.channel1 || "N/A"}`,
      `Ch.2: ${data.channel2 || "N/A"}`,
      `Third Person: ${data.thirdPerson || "N/A"}`
    ]);

    addSection("Supervisors", [
      `ALSSUP: ${data.alssup || "N/A"}`,
      `MEDSUP: ${data.medsup || "N/A"}`
    ]);

    addSection("Zulu On Call (After 1700)", [
      `Primary: ${data.zuluPrimary || "N/A"}`,
      `Secondary: ${data.zuluSecondary || "N/A"}`
    ]);

    addSection("Avail Trucks", [
      `911 Trucks: ${data.truck911 || "0"}`,
      `GT Trucks: ${data.truckGT || "0"}`,
      `ALS Transport Trucks: ${data.truckALS || "None"}`,
      `County QRV: ${data.truckCountyQRV || "None"}`
    ]);

    addSection("Late Trucks", data.lateTrucks);
    addSection("Out of Chute", data.outOfChute);
    addSection("Other Issues", data.issues);

    if (data.pasteNotes) {
      addSection("Roster/Time Up", data.pasteNotes, true);
    }

    if (data.otherEvents) {
      addSection("Other Events", data.otherEvents);
    }

    return reportParts.join("\n");
  };

  const buildHtmlReport = () => {
    const parts: string[] = [];
    const dataStyle = 'font-family: Calibri, Helvetica, Arial, sans-serif; font-size: 13pt; mso-ansi-font-size: 13.0pt; margin: 0 0 2pt 0; line-height: 1.4; color: #000000;';
    const headerStyle = 'font-family: Calibri, Helvetica, Arial, sans-serif; font-size: 20pt; mso-ansi-font-size: 20.0pt; mso-bidi-font-size: 20.0pt; font-weight: bold; text-decoration: underline; margin-top: 14pt; margin-bottom: 3pt; padding: 0; color: #000000; line-height: 1.2;';

    const addHtmlSection = (title: string, content: string | string[], isTabular: boolean = false) => {
      if (parts.length > 0) {
        parts.push('<p style="margin: 0; line-height: 12pt; font-size: 12pt;">&nbsp;</p>');
      }

      // 5-layer size guarantee: h2 + font size="5" + span 20pt + inline CSS + mso-ansi-font-size
      parts.push(`<h2 style="${headerStyle}"><u><strong><font size="5" style="font-size: 20pt; mso-ansi-font-size: 20.0pt;"><span style="font-size: 20pt; font-family: Calibri, Helvetica, Arial, sans-serif; mso-ansi-font-size: 20.0pt;">**${title}**</span></font></strong></u></h2>`);
      
      if (Array.isArray(content)) {
        content.forEach(line => {
          const colonIndex = line.indexOf(': ');
          if (colonIndex !== -1) {
            const label = line.substring(0, colonIndex);
            const value = line.substring(colonIndex + 2);
            parts.push(`<p style="${dataStyle}"><font size="3" style="font-size: 13pt; mso-ansi-font-size: 13.0pt;"><strong>${label}:</strong> ${value}</font></p>`);
          } else {
            parts.push(`<p style="${dataStyle}"><font size="3" style="font-size: 13pt; mso-ansi-font-size: 13.0pt;">${line}</font></p>`);
          }
        });
      } else {
        const text = (typeof content === 'string' ? content : "");
        if (isTabular && text.trim()) {
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length > 0) {
            const rows = lines.map(line => line.split(/\t|\s{2,}/).map(cell => cell.trim()));
            const widths = ["20%", "14%", "13%", "34%", "19%"];

            let table = `<table style="border-collapse: collapse; width: auto; max-width: 100%; border: 1px solid #000; font-family: Calibri, Helvetica, Arial, sans-serif; font-size: 12pt; margin-top: 4px;">`;
            rows.forEach((row, rowIndex) => {
              table += `<tr>`;
              for (let i = 0; i < 5; i++) {
                const cell = row[i] || "";
                const cellStyle = `border: 1px solid #000; padding: 4px 8px; text-align: left; width: ${widths[i] || "auto"}; min-width: 50px; font-family: Calibri, Helvetica, Arial, sans-serif; font-size: 12pt;`;
                if (rowIndex === 0) {
                  table += `<th style="${cellStyle} background-color: #D9D9D9; font-weight: bold;">${cell}</th>`;
                } else {
                  table += `<td style="${cellStyle}">${cell}</td>`;
                }
              }
              table += `</tr>`;
            });
            table += `</table>`;
            parts.push(table);
          } else {
            parts.push(`<p style="${dataStyle}"><font size="3" style="font-size: 13pt; mso-ansi-font-size: 13.0pt;">None</font></p>`);
          }
        } else if (text) {
          const lines = text.split(/\r?\n/);
          lines.forEach(line => {
            const formattedLine = line.replace(/ /g, "&nbsp;") || "&nbsp;";
            parts.push(`<p style="${dataStyle}"><font size="3" style="font-size: 13pt; mso-ansi-font-size: 13.0pt;">${formattedLine}</font></p>`);
          });
        } else {
          parts.push(`<p style="${dataStyle}"><font size="3" style="font-size: 13pt; mso-ansi-font-size: 13.0pt;">None</font></p>`);
        }
      }
    };

    addHtmlSection("Info", [
      `Name: ${data.name || "N/A"}`,
      `Date: ${data.date || "N/A"}`,
      `Shift: ${data.shift}`
    ]);

    addHtmlSection("Radio Assignments", [
      `Ch.1: ${data.channel1 || "N/A"}`,
      `Ch.2: ${data.channel2 || "N/A"}`,
      `Third Person: ${data.thirdPerson || "N/A"}`
    ]);

    addHtmlSection("Supervisors", [
      `ALSSUP: ${data.alssup || "N/A"}`,
      `MEDSUP: ${data.medsup || "N/A"}`
    ]);

    addHtmlSection("Zulu On Call (After 1700)", [
      `Primary: ${data.zuluPrimary || "N/A"}`,
      `Secondary: ${data.zuluSecondary || "N/A"}`
    ]);

    addHtmlSection("Avail Trucks", [
      `911 Trucks: ${data.truck911 || "0"}`,
      `GT Trucks: ${data.truckGT || "0"}`,
      `ALS Transport Trucks: ${data.truckALS || "None"}`,
      `County QRV: ${data.truckCountyQRV || "None"}`
    ]);

    addHtmlSection("Late Trucks", data.lateTrucks);
    addHtmlSection("Out of Chute", data.outOfChute);
    addHtmlSection("Other Issues", data.issues);

    if (data.pasteNotes) {
      addHtmlSection("Roster/Time Up", data.pasteNotes, true);
    }

    if (data.otherEvents) {
      addHtmlSection("Other Events", data.otherEvents);
    }

    return parts.join("\n");
  };

  const copyReportToClipboard = async (plainReport: string, htmlReport: string) => {
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Shift Report</title>
<style>
  h2 { font-family: Calibri, Helvetica, Arial, sans-serif !important; font-size: 20pt !important; mso-ansi-font-size: 20.0pt !important; mso-bidi-font-size: 20.0pt !important; font-weight: bold !important; text-decoration: underline !important; color: #000000 !important; margin-top: 14pt !important; margin-bottom: 3pt !important; }
  p { font-family: Calibri, Helvetica, Arial, sans-serif !important; font-size: 13pt !important; mso-ansi-font-size: 13.0pt !important; color: #000000 !important; margin: 0 0 2pt 0 !important; line-height: 1.4 !important; }
  u { text-decoration: underline !important; }
  strong { font-weight: bold !important; }
</style>
</head>
<body style="font-family: Calibri, Helvetica, Arial, sans-serif; font-size: 13pt; color: #000000; margin: 0; padding: 10px;">
<!--StartFragment-->
${htmlReport}
<!--EndFragment-->
</body>
</html>`;

    let copied = false;

    // 1. Primary: Async Clipboard API with text/plain and text/html
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({
          "text/plain": new Blob([plainReport], { type: "text/plain" }),
          "text/html": new Blob([fullHtml], { type: "text/html" })
        });
        await navigator.clipboard.write([item]);
        copied = true;
      }
    } catch (e) {
      console.warn("Async Clipboard API error, attempting fallback:", e);
    }

    // 2. Fallback: execCommand copy with rich clipboardData injection
    if (!copied) {
      try {
        const copyHandler = (e: ClipboardEvent) => {
          e.preventDefault();
          if (e.clipboardData) {
            e.clipboardData.setData('text/html', fullHtml);
            e.clipboardData.setData('text/plain', plainReport);
          }
        };
        document.addEventListener('copy', copyHandler);
        copied = document.execCommand('copy');
        document.removeEventListener('copy', copyHandler);
      } catch (e) {
        console.warn("execCommand copy error:", e);
      }
    }

    // 3. Fallback: plain text only
    if (!copied) {
      try {
        await navigator.clipboard.writeText(plainReport);
        copied = true;
      } catch (e) {}
    }

    return copied;
  };

  const handleSend = async () => {
    const plainReport = buildReport();
    const htmlReport = buildHtmlReport();

    try {
      await copyReportToClipboard(plainReport, htmlReport);
      setShowToast("Report Copied to Clipboard! Launching Email...");
    } catch (err) {
      console.error("Clipboard error:", err);
      setShowToast("Launching email...");
    }

    const reportSubjectType = data.reportType || "Mid-Shift Report";
    const reportDate = data.date || format(new Date(), 'yyyy-MM-dd');
    const subject = `${reportSubjectType} - ${reportDate}`;
    const body = `*** FULL REPORT COPIED TO CLIPBOARD ***\n\nSummary:\n- Supervisor: ${data.name}\n- Date: ${data.date}\n\nClick here and press Ctrl+V to paste the detailed report.`;
    
    let cc = CC_EMAIL;
    const medSupEmail = data.medsup ? supervisors[data.medsup] : null;
    if (medSupEmail && medSupEmail.trim()) {
      cc += `; ${medSupEmail}`;
    }

    const mailto = `mailto:${encodeURIComponent(BASE_REPORT_EMAILS)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="relative selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-1000">
        <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse-slow delay-700" />
      </div>

      <div className="relative z-10">
        <LabelStyleContext.Provider value={labelStyle}>
          <main className="max-w-[1700px] mx-auto p-4 sm:p-8 lg:p-12 space-y-10">
            {/* Header Module */}
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/30 border border-indigo-400/30 relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    <Clipboard className="w-7 h-7 text-white relative z-10" />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase italic leading-tight">
                      Shift <span className="text-indigo-500 not-italic">Report</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] uppercase tracking-[0.35em] font-black flex items-center gap-2.5">
                      <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                      Operational Roster & Tactical Shift Matrix
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                 <div className="flex items-center gap-4 px-4 py-2 bg-black/40 border border-white/10 rounded-2xl shadow-inner">
                   <div className="flex flex-col items-center">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Roster</span>
                     <span className="text-xs font-black text-indigo-400 uppercase italic">SHIFT-{data.shift}</span>
                   </div>
                   <div className="w-px h-5 bg-white/10" />
                   <div className="flex flex-col items-center">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Buffer State</span>
                     <span className="text-[10px] font-mono font-bold text-emerald-400 animate-pulse">ACTIVE</span>
                   </div>
                 </div>
                 
                 {/* Themes & Typography Button */}
                 <ThemeSelectorButton />

                 <button
                   type="button"
                   onClick={handlePasteReport}
                   className="tactical-btn-indigo px-5 py-2.5 text-[10px] shadow-indigo-600/20 cursor-pointer"
                   title="Process Raw Roster Grid Data"
                 >
                   <Maximize2 className="w-3.5 h-3.5" />
                   Vector Stream
                 </button>

                 <button
                   type="button"
                   onClick={() => setShowPreviewDrawer(true)}
                   className="px-4 py-2.5 bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-md cursor-pointer"
                   title="View Rich Text Report Preview"
                 >
                   <Eye className="w-3.5 h-3.5 text-indigo-400" />
                   Preview
                 </button>

                 {!isStandalone && (
                   <button
                     type="button"
                     onClick={() => {
                       const standaloneUrl = window.location.href.split('#')[0] + '#/single-shift-report';
                       window.open(standaloneUrl, 'ShiftReportStandalone', 'width=1450,height=920,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
                     }}
                     className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-md cursor-pointer"
                     title="Open Standalone Shift Report in Independent Window"
                   >
                     <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                     Standalone View
                   </button>
                 )}
              </div>
            </header>

            <div className="flex flex-col gap-8 sm:gap-10">
              {/* Row 1: Info, Radio, Supervisors */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="tactical-card p-6 sm:p-8 space-y-6 sm:space-y-8 group">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <User className="w-3.5 h-3.5" /> Shift Information
                     </h2>
                  </div>
                  <div className="space-y-5">
                    <Field label="Name" icon={UserCheck}>
                      <select name="name" value={data.name} onChange={handleChange}>
                        <option value="">-- SELECT --</option>
                        {Object.entries(shiftTeams).map(([shiftName, team]) => (
                          <optgroup key={shiftName} label={`${shiftName} Shift`}>
                            {team.lead && <option value={team.lead}>{team.lead} (Lead)</option>}
                            {team.members.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </Field>
                    <Field label="Date" icon={Calendar}>
                      <input type="date" name="date" value={data.date} onChange={handleChange} />
                    </Field>
                    <Field label="Shift" icon={Activity}>
                      <select name="shift" value={data.shift} onChange={handleChange}>
                        {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="tactical-card p-6 sm:p-8 space-y-6 sm:space-y-8 group">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <Zap className="w-3.5 h-3.5" /> Radio Assignments
                     </h2>
                  </div>
                  <div className="space-y-5">
                    <Field label="Radio Ch. 1" icon={Radio}>
                      <select name="channel1" value={data.channel1} onChange={handleChange}>
                        <option value="">-- SELECT --</option>
                        {Object.entries(shiftTeams).map(([shiftName, team]) => (
                          <optgroup key={shiftName} label={`${shiftName} Shift`}>
                            {team.lead && <option value={team.lead}>{team.lead}</option>}
                            {team.members.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </Field>
                    <Field label="Radio Ch. 2" icon={Shield}>
                      <select name="channel2" value={data.channel2} onChange={handleChange}>
                        <option value="">-- SELECT --</option>
                        {Object.entries(shiftTeams).map(([shiftName, team]) => (
                          <optgroup key={shiftName} label={`${shiftName} Shift`}>
                            {team.lead && <option value={team.lead}>{team.lead}</option>}
                            {team.members.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </Field>
                    <Field label="Third Person" icon={Users}>
                      <select name="thirdPerson" value={data.thirdPerson} onChange={handleChange}>
                        <option value="">-- SELECT --</option>
                        {Object.entries(shiftTeams).map(([shiftName, team]) => (
                          <optgroup key={shiftName} label={`${shiftName} Shift`}>
                            {team.lead && <option value={team.lead}>{team.lead}</option>}
                            {team.members.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="tactical-card p-6 sm:p-8 space-y-6 sm:space-y-8 group">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <Lock className="w-3.5 h-3.5" /> Supervisors
                     </h2>
                  </div>
                  <div className="space-y-5">
                    <Field label="ALSSUP" icon={Activity}>
                      <select name="alssup" value={data.alssup} onChange={handleChange}>
                        <option value="">-- SELECT --</option>
                        {alssupList.map(a => <option key={a}>{a}</option>)}
                      </select>
                    </Field>
                    <Field label="MEDSUP" icon={Globe}>
                      <select name="medsup" value={data.medsup} onChange={handleChange}>
                        <option value="">-- SELECT --</option>
                        {Object.keys(supervisors).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Row 2: Zulu On Call & Available Trucks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="tactical-card p-6 sm:p-8 space-y-6 sm:space-y-8 group">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <Truck className="w-3.5 h-3.5" /> Available Trucks & Zulu On Call
                     </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="911 Trucks" icon={Activity}>
                      <input type="number" name="truck911" value={data.truck911} onChange={handleChange} min="0" />
                    </Field>
                    <Field label="GT Trucks" icon={Activity}>
                      <input type="number" name="truckGT" value={data.truckGT} onChange={handleChange} min="0" />
                    </Field>
                    <Field label="Zulu Primary" icon={Zap}>
                      <select name="zuluPrimary" value={data.zuluPrimary} onChange={handleChange}>
                        <option value="">-- SELECT --</option>
                        {data.zuluPrimary && !zuluList.includes(data.zuluPrimary) && (
                          <option value={data.zuluPrimary}>{data.zuluPrimary}</option>
                        )}
                        {zuluList.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </Field>
                    <Field label="Zulu Secondary" icon={Zap}>
                      <select name="zuluSecondary" value={data.zuluSecondary} onChange={handleChange}>
                        <option value="">-- SELECT --</option>
                        {data.zuluSecondary && !zuluList.includes(data.zuluSecondary) && (
                          <option value={data.zuluSecondary}>{data.zuluSecondary}</option>
                        )}
                        {zuluList.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </Field>
                    <Field label="ALS Transport" icon={Shield}>
                      <input type="text" name="truckALS" value={data.truckALS} onChange={handleChange} placeholder="UNIT_IDS" />
                    </Field>
                    <Field label="County QRV" icon={Activity}>
                      <input type="text" name="truckCountyQRV" value={data.truckCountyQRV} onChange={handleChange} placeholder="UNIT_ID" />
                    </Field>
                  </div>
                </div>

                <div className="tactical-card p-6 sm:p-8 space-y-6 sm:space-y-8 group">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <Clock className="w-3.5 h-3.5" /> Late Trucks & Chute Deviations
                     </h2>
                  </div>
                  <div className="space-y-5">
                    <div className="flex flex-col gap-2.5 group/field">
                      <div className="flex items-center gap-2 pl-3">
                        <AlertCircle style={{ color: labelStyle.color }} className="w-3.5 h-3.5 opacity-80 shrink-0" />
                        <label 
                          style={{ 
                            color: labelStyle.color, 
                            fontSize: `${labelStyle.fontSize}px` 
                          }}
                          className={`${labelStyle.fontWeight} ${labelStyle.textTransform} tracking-wider transition-all select-none leading-none`}
                        >
                          Late Trucks
                        </label>
                      </div>
                      <textarea 
                        name="lateTrucks" 
                        value={data.lateTrucks} 
                        onChange={handleChange} 
                        onKeyDown={handleTextareaTab}
                        rows={3} 
                        className="w-full tactical-input p-4 text-xs font-mono text-white"
                        placeholder="UNIT / TIME / REASON..." 
                      />
                    </div>
                    <div className="flex flex-col gap-2.5 group/field">
                      <div className="flex items-center gap-2 pl-3">
                        <Zap style={{ color: labelStyle.color }} className="w-3.5 h-3.5 opacity-80 shrink-0" />
                        <label 
                          style={{ 
                            color: labelStyle.color, 
                            fontSize: `${labelStyle.fontSize}px` 
                          }}
                          className={`${labelStyle.fontWeight} ${labelStyle.textTransform} tracking-wider transition-all select-none leading-none`}
                        >
                          Out of Chute
                        </label>
                      </div>
                      <textarea 
                        name="outOfChute" 
                        value={data.outOfChute} 
                        onChange={handleChange} 
                        onKeyDown={handleTextareaTab}
                        rows={3} 
                        className="w-full tactical-input p-4 text-xs font-mono text-white"
                        placeholder="CHUTE ANOMALIES & EXPLANATIONS..." 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Operational Log & Buffer Sync */}
              {terminalUser?.role?.toLowerCase() !== 'dispatcher' ? (
                <section className="tactical-card p-6 sm:p-8 space-y-6 group">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <FileText className="w-4 h-4" /> Operational Log & Other Issues
                     </h2>
                     <div className="flex items-center gap-4">
                       <button 
                          type="button" 
                          onClick={() => setShowPasteModal(true)}
                          className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-2 uppercase font-black tracking-[0.2em] transition-colors cursor-pointer"
                       >
                         <Maximize2 className="w-3 h-3" /> System Fullscreen
                       </button>
                       <div className="w-24 h-[1px] bg-gradient-to-r from-indigo-500/30 to-transparent" />
                     </div>
                  </div>
                  <textarea 
                    name="issues" 
                    value={data.issues} 
                    onChange={handleChange} 
                    onKeyDown={handleTextareaTab}
                    rows={8} 
                    className="w-full tactical-input p-5 text-sm font-mono leading-relaxed text-white"
                    placeholder="RECORD ALL SIGNIFICANT ACTIONS, FAILURES, AND RECOVERY STEPS..." 
                  />
                  <div className="pt-4 mt-4 border-t border-white/10">
                    <label 
                      style={{ 
                        color: labelStyle.color, 
                        fontSize: `${Math.max(8, labelStyle.fontSize - 1)}px` 
                      }}
                      className={`${labelStyle.fontWeight} ${labelStyle.textTransform} tracking-wider block mb-3 select-none transition-all`}
                    >
                      Buffer Data / Roster Sync Notes
                    </label>
                    <textarea 
                      name="pasteNotes" 
                      value={data.pasteNotes} 
                      onChange={handleChange} 
                      onKeyDown={handleTextareaTab}
                      rows={4} 
                      className="w-full tactical-input p-4 text-xs font-mono text-white"
                      placeholder="LOAD ROSTER DATA / TIME UP LOGS..." 
                    />
                  </div>
                </section>
              ) : (
                <section className="tactical-card p-12 flex flex-col items-center justify-center text-center gap-6 border-white/10 bg-white/[0.02]">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                    <EyeOff className="w-8 h-8 text-indigo-500 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Access Restricted</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black leading-relaxed max-w-sm">
                      The operational log is reserved for shift supervisors and administrative nodes.
                    </p>
                  </div>
                </section>
              )}

              {/* Actions Footer Bar */}
              <div className="tactical-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none" />
                 <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] relative z-10">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
                   Autosave Buffer Active {lastSaved ? `at ${lastSaved}` : 'now'}
                 </div>
                 <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4 relative z-10 w-full md:w-auto">
                   <button 
                     type="button" 
                     onClick={clearData}
                     className="px-4 py-2.5 text-[10px] font-black text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all uppercase tracking-[0.2em] rounded-xl cursor-pointer"
                   >
                     Clear Buffer
                   </button>
                   <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 h-[48px] shadow-inner">
                     <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                     <select 
                       name="reportType" 
                       value={data.reportType || "Mid-Shift Report"} 
                       onChange={handleChange}
                       className="bg-transparent border-none text-xs font-black uppercase text-white outline-none cursor-pointer pr-2"
                     >
                       <option value="Mid-Shift Report" className="bg-slate-900">Mid-Shift Report</option>
                       <option value="End of Shift Report" className="bg-slate-900">End Of Shift Report</option>
                     </select>
                   </div>
                   <button 
                     type="button"
                     onClick={() => setShowPreviewDrawer(true)}
                     className="px-5 h-[48px] bg-black/40 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                   >
                     <Eye className="w-4 h-4 text-indigo-400" />
                     <span>Preview</span>
                   </button>
                   <button 
                     type="button"
                     onClick={handleSend}
                     className="px-8 h-[48px] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap border border-indigo-400/30 select-none"
                     title="Deploy Report & Launch Email"
                   >
                     <Mail className="w-4 h-4 text-white shrink-0" />
                     <span>Deploy Report</span>
                   </button>
                 </div>
              </div>
            </div>
          </main>
        </LabelStyleContext.Provider>
      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 glass-effect !bg-slate-950/90 border border-indigo-500/30 text-white font-bold rounded-3xl shadow-2xl flex items-center gap-4 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-sm tracking-tight">{showToast}</span>
        </div>
      )}

      {/* Live Report Preview Drawer */}
      <div className={`fixed inset-0 z-[120] transition-opacity duration-300 ${showPreviewDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div 
          onClick={() => setShowPreviewDrawer(false)} 
          className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        />
        <aside 
          className={`absolute top-0 right-0 h-full w-full max-w-xl bg-slate-950/95 border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${showPreviewDrawer ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
                <Eye className="w-6 h-6 text-indigo-400" />
                Report Preview
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">
                Rich Text Snapshot • Formatted for Email
              </p>
            </div>
            <button 
              onClick={() => setShowPreviewDrawer(false)}
              className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto scrollbar-thin bg-black/20">
            <div className="bg-white rounded-2xl p-8 text-black shadow-inner min-h-full">
              <div 
                className="max-w-none text-black selection:bg-indigo-500/20"
                style={{ fontFamily: 'Calibri, sans-serif' }}
                dangerouslySetInnerHTML={{ __html: buildHtmlReport() }} 
              />
            </div>
          </div>

          <div className="p-6 sm:p-8 border-t border-white/10 bg-white/[0.02] space-y-6">
            <button 
              onClick={async () => {
                try {
                  const plainContent = buildReport();
                  const htmlContent = buildHtmlReport();
                  await copyReportToClipboard(plainContent, htmlContent);
                  setShowToast("Rich HTML & Text copied! Ready to paste into email.");
                } catch (e) {
                  console.error("Copy error:", e);
                  setShowToast("Failed to access clipboard");
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/30 active:scale-[0.98] cursor-pointer"
            >
              <Clipboard className="w-4 h-4" /> Copy Email Rich Text Format
            </button>
            
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Essential Resources</h4>
              <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <ExternalLinkItem href="https://drive.google.com/file/d/137BOp88NqFXFuoYJ-VBIR0n-xGfOq4_U/view?usp=drive_link" label="Coroner On Call" meta="Google Drive Access" />
                <ExternalLinkItem href="https://drive.google.com/file/d/1YRmQRgyxRjqlGWiBLsNaiYhmssqDeCet/view" label="911 SOG'S County" meta="Regulation Handbook" />
                <ExternalLinkItem href="https://drive.google.com/file/d/15IL2nx3foN5V4L2ue6OBAp8kmZkpWzma/view" label="Employee Handbook" meta="HR Policies" />
                <ExternalLinkItem href="https://docs.google.com/spreadsheets/d/1ywTY-EVDLJYfPsxKPDGLdNJStJ63W-_yYS-Y4CU31Bw/edit" label="Shift Calendar" meta="Live Roster Sync" />
              </nav>
            </div>
          </div>
        </aside>
      </div>

      {/* Vector Stream / Roster Processing Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
          <div onClick={() => setShowPasteModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
          <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] z-10">
            <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">Roster Processing</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">Paste data grid from source system</p>
              </div>
              <button 
                onClick={() => setShowPasteModal(false)} 
                className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 sm:p-8 flex-1 relative bg-black/40">
              <textarea 
                className="w-full h-full bg-black/50 text-white p-6 rounded-2xl border border-white/10 font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium shadow-inner"
                placeholder="Ctrl+V roster data here..."
                value={data.pasteNotes}
                onChange={(e) => setData(prev => ({ ...prev, pasteNotes: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="p-6 sm:p-8 bg-white/[0.02] flex justify-end gap-4 border-t border-white/10">
              <button 
                onClick={() => setShowPasteModal(false)}
                className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 rounded-xl text-white font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/30 active:scale-95 cursor-pointer"
              >
                Incorporate Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, icon: Icon }: { label: string; children: React.ReactElement; icon?: React.ElementType }) {
  const { color, fontSize, fontWeight, textTransform } = useLabelStyle();

  return (
    <div className="flex flex-col gap-2 group/field">
      <div className="flex items-center gap-2 pl-2">
        {Icon && (
          <Icon 
            style={{ color: color }} 
            className="w-3.5 h-3.5 opacity-80 group-hover/field:opacity-100 transition-opacity shrink-0" 
          />
        )}
        <label 
          style={{ 
            color: color, 
            fontSize: `${fontSize}px` 
          }}
          className={`${fontWeight} ${textTransform} tracking-wider transition-all select-none leading-none`}
        >
          {label}
        </label>
      </div>
      <div className="relative group">
        {React.cloneElement(children as React.ReactElement<any>, {
          className: `w-full tactical-input p-3.5 text-xs font-mono relative z-10 text-white ${(children as any).props?.className || ''}`
        })}
        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/[0.02] transition-colors pointer-events-none rounded-xl" />
      </div>
    </div>
  );
}

function ExternalLinkItem({ href, label, meta }: { href: string; label: string; meta: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="p-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-indigo-500/40 hover:bg-white/[0.04] group transition-all"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{label}</span>
        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
      </div>
      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1 block">{meta}</span>
    </a>
  );
}
