/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  Settings,
  History,
  Eye,
  Loader2,
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
  Plus,
  ArrowRight,
  EyeOff,
  HardDrive,
  Palette,
  Type,
  Sliders,
  RotateCcw,
  Check,
  ZoomIn,
  ZoomOut,
  Sparkles
} from 'lucide-react';
import { BackupControlModal } from '../components/BackupControlModal';
import { ThemeSelectorButton } from '../components/centralhub/ThemeSelector';

// Sub-component for the high-intensity emergency background
const EmergencyBackground = ({ isActive, opacity = 0.25 }: { isActive: boolean; opacity?: number }) => {
  return null;
};

import { 
  TEAM_MEMBERS, 
  SHIFT_TEAMS,
  ALSSUP_OPTIONS, 
  DEFAULT_ZULU_OPTIONS,
  MEDSUP_OPTIONS, 
  MEDSUP_MAP, 
  BASE_REPORT_EMAILS, 
  CC_EMAIL, 
  SHIFTS,
  INITIAL_DATA,
  ShiftReportData 
} from '../lib/shiftConstants';
import { 
  saveReport, 
  getReports, 
  ShiftReport as ShiftReportType, 
  auth, 
  signIn, 
  googleProvider, 
  doc, 
  onSnapshot, 
  db, 
  updateGlobalSettings,
  PersonnelMember,
  query,
  orderBy,
  collection,
  updateDoc,
  serverTimestamp
} from '../lib/firebase';
import ShiftTurnover from './ShiftTurnover';

const STORAGE_KEY = "shiftReportDraft_v2";
const LABEL_STYLE_STORAGE_KEY = "shift_report_label_style_v2";

export interface LabelStyleConfig {
  color: string;
  fontSize: number; // in pixels (e.g. 8 - 24)
  fontWeight: 'font-medium' | 'font-semibold' | 'font-bold' | 'font-black';
  letterSpacing: string;
  textTransform: 'uppercase' | 'normal-case';
}

const DEFAULT_LABEL_STYLE: LabelStyleConfig = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 'font-black',
  letterSpacing: 'tracking-[0.25em]',
  textTransform: 'uppercase',
};

const COLOR_PRESETS = [
  { name: 'Slate Neutral', hex: '#94a3b8', description: 'Standard tactical gray' },
  { name: 'Pure White', hex: '#ffffff', description: 'Maximum contrast' },
  { name: 'Neon Cyan', hex: '#22d3ee', description: 'Digital cyan display' },
  { name: 'Emerald', hex: '#34d399', description: 'Crisp green readout' },
  { name: 'Amber Gold', hex: '#fbbf24', description: 'High-visibility alert' },
  { name: 'Command Indigo', hex: '#818cf8', description: 'Tactical purple-blue' },
  { name: 'Coral Rose', hex: '#fb7185', description: 'Vivid contrast tone' },
  { name: 'Electric Violet', hex: '#c084fc', description: 'Clear violet hue' },
  { name: 'Lime Spark', hex: '#a3e635', description: 'Laser bright lime' },
  { name: 'Safety Orange', hex: '#fb923c', description: 'High alert orange' },
];

const SIZE_PRESETS = [
  { label: 'Compact', size: 9 },
  { label: 'Standard', size: 11 },
  { label: 'Medium', size: 13 },
  { label: 'Large', size: 15 },
  { label: 'Extra Large', size: 18 },
];

const LabelStyleContext = React.createContext<LabelStyleConfig>(DEFAULT_LABEL_STYLE);

export function useLabelStyle() {
  return React.useContext(LabelStyleContext);
}

export default function ShiftReport() {
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
  const [showDirectoryDrawer, setShowDirectoryDrawer] = useState(false);
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  
  // Custom Box Prompt Label Color & Size Configuration
  const [labelStyle, setLabelStyle] = useState<LabelStyleConfig>(() => {
    try {
      const saved = localStorage.getItem(LABEL_STYLE_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_LABEL_STYLE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LABEL_STYLE;
  });

  const updateLabelStyle = useCallback((partial: Partial<LabelStyleConfig>) => {
    setLabelStyle(prev => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(LABEL_STYLE_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const resetLabelStyle = useCallback(() => {
    setLabelStyle(DEFAULT_LABEL_STYLE);
    try {
      localStorage.removeItem(LABEL_STYLE_STORAGE_KEY);
    } catch (e) {}
    setShowToast("Label text styling reset to default");
  }, []);
  
  const handlePasteReport = () => setShowPasteModal(true);
  
  // Standalone detection
  const location = useLocation();
  const isStandalone = location.pathname === '/single-shift-report' || location.pathname === '/shift-report/standalone' || new URLSearchParams(location.search).get('standalone') === 'true';

  // New States for History and Lights
  const { terminalUser } = useTerminal();
  const [user, setUser] = useState(auth.currentUser);
  const [backgroundStyle, setBackgroundStyle] = useState<'glow' | 'emergency'>('glow');
  const [lightIntensity, setLightIntensity] = useState<number>(0.5);
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);
  const [zuluList, setZuluList] = useState<string[]>(DEFAULT_ZULU_OPTIONS);
  
  // Emergency States
  const manualEmergencyMode = backgroundStyle === 'emergency';
  const emergencyOpacity = lightIntensity;

  // Sync with Firestore Global Settings
  useEffect(() => {
    // 1. Try local cache first for instant render
    try {
      const cached = localStorage.getItem('cached_global_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.zuluOptions) setZuluList(parsed.zuluOptions);
        if (parsed.alssupOptions) setAlssupList(parsed.alssupOptions);
      }
    } catch (e) {}

    // 2. Subscribe to live Firestore updates
    const settingsRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.backgroundStyle) setBackgroundStyle(data.backgroundStyle);
        if (typeof data.lightIntensity === 'number') setLightIntensity(data.lightIntensity);
        if (data.personnel) setPersonnel(data.personnel);
        if (data.supervisors) setSupervisors(data.supervisors);
        if (data.alssupOptions) setAlssupList(data.alssupOptions);
        if (data.zuluOptions) setZuluList(data.zuluOptions);
      }
    });

    return () => unsubscribe();
  }, []);

  // Compute shift teams from personnel with robust static fallbacks if Firestore/Uplink is offline
  const shiftTeams = useMemo(() => {
    const teams: Record<string, { lead: string; members: string[] }> = {
      'A': { lead: '', members: [] },
      'B': { lead: '', members: [] },
      'C': { lead: '', members: [] },
      'D': { lead: '', members: [] },
      'Other': { lead: '', members: [] }
    };

    if (personnel && personnel.length > 0) {
      // First pass: identify leads based on SHIFT_TEAMS to ensure they get assigned properly
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
                             targetKey === 'D' ? SHIFT_TEAMS['Delta']?.lead : null;

        if (teams[targetKey]) {
          if (p.name === expectedLead) {
            teams[targetKey].lead = p.name;
          }
        }
      });

      // Second pass: fill in members and fallback leads if missing
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
                             targetKey === 'D' ? SHIFT_TEAMS['Delta']?.lead : null;

        if (teams[targetKey]) {
          if (p.name !== expectedLead) {
            if (!teams[targetKey].lead) {
              teams[targetKey].lead = p.name;
            } else {
              teams[targetKey].members.push(p.name);
            }
          }
        }
      });
    }

    // If teams are still empty (e.g. offline or blocked), populate them with high-fidelity static fallbacks from shiftConstants to prevent empty selects
    const isTeamsEmpty = !teams['A'].lead && !teams['B'].lead && !teams['C'].lead && !teams['D'].lead;
    if (isTeamsEmpty) {
      if (SHIFT_TEAMS) {
        if (SHIFT_TEAMS['Alpha']) {
          teams['A'] = { lead: SHIFT_TEAMS['Alpha'].lead, members: SHIFT_TEAMS['Alpha'].members };
        }
        if (SHIFT_TEAMS['Bravo']) {
          teams['B'] = { lead: SHIFT_TEAMS['Bravo'].lead, members: SHIFT_TEAMS['Bravo'].members };
        }
        if (SHIFT_TEAMS['Charlie']) {
          teams['C'] = { lead: SHIFT_TEAMS['Charlie'].lead, members: SHIFT_TEAMS['Charlie'].members };
        }
        if (SHIFT_TEAMS['Delta']) {
          teams['D'] = { lead: SHIFT_TEAMS['Delta'].lead, members: SHIFT_TEAMS['Delta'].members };
        }
      }
    }

    return teams;
  }, [personnel]);

  // Track auth state
  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUser(u));
  }, []);
  const [archivedReports, setArchivedReports] = useState<ShiftReportType[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedArchivedReport, setSelectedArchivedReport] = useState<ShiftReportType | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Load history when drawer opens
  useEffect(() => {
    if (showAdminDrawer || showHistory) {
      loadHistory();
    }
  }, [showAdminDrawer, showHistory]);

  const loadHistory = useCallback(async () => {
    setLoadingReports(true);
    try {
      const reports = await getReports();
      if (reports) setArchivedReports(reports);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  // Dynamic Data State
  const [employees, setEmployees] = useState<string[]>(TEAM_MEMBERS);
  
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

  // Auto-save logic
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
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleTextareaTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newValue = target.value.substring(0, start) + "    " + target.value.substring(end);
      
      const event = {
        target: {
          name: target.name,
          value: newValue,
        }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      
      handleChange(event);
      
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const clearData = async () => {
    if (window.confirm("Are you sure you want to clear all form data? (This will also archive a backup to the cloud)")) {
      // Save to Firebase History (Only if logged in) before clearing
      if (user) {
        try {
          const plainReport = buildReport();
          const htmlReport = buildHtmlReport();
          await saveReport({
            name: data.name,
            date: data.date,
            shift: data.shift,
            data: data,
            htmlReport: htmlReport,
            plainReport: plainReport
          });
          console.log("Report archived to Firebase during reset");
        } catch (e) {
          console.error("Failed to archive report during reset:", e);
        }
      }

      setData(INITIAL_DATA);
      localStorage.removeItem(STORAGE_KEY);
      setShowToast("Form cleared & Backed up");
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

    addSection("Radio Assignment", [
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
    const dataStyle = 'font-family: Calibri, sans-serif; font-size: 16pt; margin: 0; line-height: 1.4; color: #000;';

    const addHtmlSection = (title: string, content: string | string[], isTabular: boolean = false) => {
      if (parts.length > 0) {
        parts.push('<div style="height: 18pt;">&nbsp;</div>');
      }
      
      const isLateTrucks = title === "Late Trucks";
      const customHeaderStyle = isLateTrucks 
        ? 'font-family: Calibri, sans-serif; font-size: 20pt; font-weight: bold; text-decoration: underline; margin-top: 6px; margin-bottom: 4px; color: #000;'
        : 'font-family: Calibri, sans-serif; font-size: 18pt; font-weight: bold; text-decoration: underline; margin-top: 6px; margin-bottom: 4px; color: #000;';

      parts.push(`<div style="${customHeaderStyle}"><u style="text-decoration: underline;"><strong>**${title}**</strong></u></div>`);
      
      if (Array.isArray(content)) {
        content.forEach(line => {
          const colonIndex = line.indexOf(': ');
          if (colonIndex !== -1) {
            const label = line.substring(0, colonIndex);
            const value = line.substring(colonIndex + 2);
            parts.push(`<div style="${dataStyle}"><strong>${label}:</strong> ${value}</div>`);
          } else {
            parts.push(`<div style="${dataStyle}">${line}</div>`);
          }
        });
      } else {
        const text = (typeof content === 'string' ? content : "");
        if (isTabular && text.trim()) {
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length > 0) {
            const rows = lines.map(line => line.split(/\t|\s{2,}/).map(cell => cell.trim()));
            const widths = ["20%", "14%", "13%", "34%", "19%"];

            let table = `<table style="border-collapse: collapse; width: auto; max-width: 100%; border: 1px solid #000; font-family: Calibri, sans-serif; font-size: 16pt; margin-top: 4px;">`;
            rows.forEach((row, rowIndex) => {
              table += `<tr>`;
              for (let i = 0; i < 5; i++) {
                const cell = row[i] || "";
                const cellStyle = `border: 1px solid #000; padding: 4px 8px; text-align: left; width: ${widths[i] || "auto"}; min-width: 50px;`;
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
            parts.push(`<div style="${dataStyle}">None</div>`);
          }
        } else if (text) {
          const lines = text.split(/\r?\n/);
          lines.forEach(line => {
            const formattedLine = line.replace(/ /g, "&nbsp;") || "&nbsp;";
            parts.push(`<div style="${dataStyle}">${formattedLine}</div>`);
          });
        } else {
          parts.push(`<div style="${dataStyle}">None</div>`);
        }
      }
    };

    addHtmlSection("Info", [
      `Name: ${data.name || "N/A"}`,
      `Date: ${data.date || "N/A"}`,
      `Shift: ${data.shift}`
    ]);

    addHtmlSection("Radio Assignment", [
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

  const handleSend = async () => {
    const plainReport = buildReport();
    const htmlReport = buildHtmlReport();
    
    // Save report to Cloud Archive automatically on deploy
    try {
      await saveReport({
        name: data.name || "N/A",
        date: data.date || format(new Date(), 'yyyy-MM-dd'),
        shift: data.shift || "A",
        data: data,
        htmlReport: htmlReport,
        plainReport: plainReport
      });
      loadHistory();
    } catch (e) {
      console.error("Auto-archive error on deploy:", e);
    }

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const typePlain = "text/plain";
        const typeHtml = "text/html";
        const blobPlain = new Blob([plainReport], { type: typePlain });
        const blobHtml = new Blob([htmlReport], { type: typeHtml });
        
        const clipboardItems = [new ClipboardItem({
          [typePlain]: blobPlain,
          [typeHtml]: blobHtml
        })];
        
        await navigator.clipboard.write(clipboardItems);
        setShowToast("Report Saved to Archive & Copied! Launching Email...");
      } else {
        await navigator.clipboard.writeText(plainReport);
        setShowToast("Report Saved to Archive & Copied! Launching Email...");
      }
    } catch (err) {
      console.error("Clipboard error:", err);
      setShowToast("Report Saved! Opening email...");
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
      const timer = setTimeout(() => setShowToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="relative selection:bg-indigo-500/30">
      <EmergencyBackground isActive={manualEmergencyMode} opacity={emergencyOpacity} />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-1000">
        <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse-slow delay-700" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto pb-24 px-6 pt-12">
        {/* Main Form */}
        <LabelStyleContext.Provider value={labelStyle}>
          <main className="flex flex-col gap-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-10 border-b border-indigo-500/10 relative tactical-header-glow font-sans">
              <div className="space-y-4">
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_35px_rgba(79,70,229,0.3)] transition-transform group-hover:scale-105 duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    <Clipboard className="w-7 h-7 text-white relative z-10" />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-5xl font-black tracking-tight text-white uppercase italic leading-tight">
                      Shift <span className="text-indigo-500 not-italic">Report</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] font-black flex items-center gap-3">
                      <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                      Shift Report Log & Personnel Management
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                 {/* Quick Prompt Label Text Size & Color Controls */}
                 <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-inner">
                   <button
                     type="button"
                     onClick={() => updateLabelStyle({ fontSize: Math.max(8, labelStyle.fontSize - 1) })}
                     className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                     title="Decrease Box Prompt Text Size (A-)"
                   >
                     <ZoomOut className="w-3.5 h-3.5" />
                   </button>
                   
                   <button
                     type="button"
                     onClick={() => setShowLabelModal(true)}
                     className="flex items-center gap-2 px-2.5 py-1 hover:bg-white/10 rounded-xl transition-all group cursor-pointer"
                     title="Customize Box Prompt Text Color & Size"
                   >
                     <span 
                       className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm shrink-0 transition-transform group-hover:scale-110" 
                       style={{ backgroundColor: labelStyle.color }} 
                     />
                     <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white">
                       {labelStyle.fontSize}px
                     </span>
                     <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                   </button>

                   <button
                     type="button"
                     onClick={() => updateLabelStyle({ fontSize: Math.min(24, labelStyle.fontSize + 1) })}
                     className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                     title="Increase Box Prompt Text Size (A+)"
                   >
                     <ZoomIn className="w-3.5 h-3.5" />
                   </button>
                 </div>

                 <div className="flex items-center gap-6 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl shadow-inner">
                   <div className="flex flex-col items-center">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Report</span>
                     <span className="text-xs font-black text-indigo-400 uppercase italic">SHIFT-{data.shift}</span>
                   </div>
                   <div className="w-px h-5 bg-white/10" />
                   <div className="flex flex-col items-center">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sync State</span>
                     <span className="text-[10px] font-mono font-bold text-emerald-500 animate-pulse">ENCRYPTED</span>
                   </div>
                 </div>
                 
                 <ThemeSelectorButton />

                 <button
                   onClick={handlePasteReport}
                   className="tactical-btn-indigo px-6 py-2.5 text-[10px] shadow-indigo-600/20"
                 >
                   <Maximize2 className="w-4 h-4" />
                   Vector Stream
                 </button>
                 <button
                   onClick={() => setShowHistory(true)}
                   className="px-5 py-2.5 glass-effect text-slate-400 border-white/5 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2.5 transition-all hover:bg-white/5"
                 >
                   <History className="w-4 h-4" />
                   Archive
                 </button>
                 {!isStandalone && (
                   <button
                     onClick={() => window.open('/single-shift-report', '_blank', 'width=1400,height=900')}
                     className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
                     title="Open Standalone Shift Report without Sidebar"
                   >
                     <ExternalLink className="w-4 h-4 text-emerald-400" />
                     Standalone View
                   </button>
                 )}

                 <button
                   onClick={() => setShowBackupModal(true)}
                   className="px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
                 >
                   <HardDrive className="w-4 h-4 text-indigo-400" />
                   Backup (.json)
                 </button>
              </div>
            </header>

            <div className="flex flex-col gap-10">
              {/* Row 1: Info, Radio, Supervisors */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="tactical-card p-8 space-y-8 group">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <User className="w-3.5 h-3.5" /> Shift Information
                     </h2>
                  </div>
                  <div className="space-y-6">

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

                <div className="tactical-card p-8 space-y-8 group">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <Zap className="w-3.5 h-3.5" /> Radio Assignments
                     </h2>
                  </div>
                  <div className="space-y-6">
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

                <div className="tactical-card p-8 space-y-8 group">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <Lock className="w-3.5 h-3.5" /> Supervisors
                     </h2>
                  </div>
                  <div className="space-y-6">
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

              {/* Row 2: Available Trucks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="tactical-card p-8 space-y-8 group">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <Truck className="w-3.5 h-3.5" /> Available Trucks
                     </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
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

                <div className="tactical-card p-8 space-y-8 group">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <Clock className="w-3.5 h-3.5" /> Late Trucks / Chute Deviations
                     </h2>
                  </div>
                  <div className="space-y-6">
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
                        placeholder="ANOMALIES..." 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Log */}
              {terminalUser?.role?.toLowerCase() !== 'dispatcher' ? (
                <section className="tactical-card p-8 space-y-6 group">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                     <h2 
                       style={{ color: labelStyle.color }}
                       className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors"
                     >
                        <FileText className="w-4 h-4" /> Operational Log
                     </h2>
                     <div className="flex items-center gap-4">
                       <button 
                          type="button" 
                          onClick={() => setShowPasteModal(true)}
                          className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-2 uppercase font-black tracking-[0.2em] transition-colors"
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
                    rows={10} 
                    className="w-full tactical-input p-6 text-sm font-mono leading-relaxed text-white"
                    placeholder="RECORD ALL SIGNIFICANT ACTIONS, FAILURES, AND RECOVERY STEPS..." 
                  />
                  <div className="pt-4 mt-4 border-t border-white/5">
                    <label 
                      style={{ 
                        color: labelStyle.color, 
                        fontSize: `${Math.max(8, labelStyle.fontSize - 1)}px` 
                      }}
                      className={`${labelStyle.fontWeight} ${labelStyle.textTransform} tracking-wider block mb-3 select-none transition-all`}
                    >
                      Buffer Data / Roster Sync
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
                <section className="tactical-card p-12 flex flex-col items-center justify-center text-center gap-6 border-white/5 bg-white/[0.02]">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                    <EyeOff className="w-8 h-8 text-indigo-500 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Access Restricted</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black leading-relaxed max-w-sm">
                      The operational log is reserved for shift supervisors and administrative nodes. Please contact system admin for elevated clearance.
                    </p>
                  </div>
                </section>
              )}

              {/* Actions */}
              <div className="mt-8 p-6 sm:p-8 tactical-card flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none" />
                 <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] relative z-10">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
                   Autosave Pulse Active {lastSaved ? `at ${lastSaved}` : 'now'}
                 </div>
                 <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4 relative z-10 w-full md:w-auto">
                   <button 
                     type="button" 
                     onClick={clearData}
                     className="px-4 py-2.5 text-[10px] font-black text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all uppercase tracking-[0.2em] rounded-xl cursor-pointer"
                   >
                     Clear Buffer
                   </button>
                   <button 
                     type="button" 
                     onClick={async () => {
                       const plainReport = buildReport();
                       const htmlReport = buildHtmlReport();
                       try {
                         await saveReport({
                           name: data.name,
                           date: data.date,
                           shift: data.shift,
                           data: data,
                           htmlReport: htmlReport,
                           plainReport: plainReport
                         });
                         setShowToast("SYSTEM BACKUP COMPLETE");
                         loadHistory();
                       } catch (e) {
                         setShowToast("BACKUP FAILURE");
                       }
                     }}
                     className="px-4 py-2.5 text-[10px] font-black text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all uppercase tracking-[0.2em] rounded-xl cursor-pointer"
                   >
                     Manual Uplink
                   </button>
                   <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 h-[48px] shadow-inner">
                     <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                     <select 
                       name="reportType" 
                       value={data.reportType || "Mid-Shift Report"} 
                       onChange={handleChange}
                       className="bg-transparent border-none text-xs font-black uppercase text-white outline-none cursor-pointer pr-2"
                     >
                       <option value="Mid-Shift Report">Mid-Shift Report</option>
                       <option value="End of Shift Report">End Of Shift Report</option>
                     </select>
                   </div>
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
            <ShiftTurnover isEmbedded />
          </main>
        </LabelStyleContext.Provider>
      </div>

      {/* Floating Toast */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 glass-effect !bg-brand-bg/90 border-brand-indigo/30 text-white font-bold rounded-3xl shadow-2xl flex items-center gap-4 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-brand-indigo/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-brand-indigo" />
          </div>
          <span className="text-sm tracking-tight">{showToast}</span>
        </div>
      )}

      {/* Preview / Archive Drawer */}
      <div className={`fixed inset-0 z-[120] transition-opacity duration-300 ${showPreviewDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={() => {
          setShowPreviewDrawer(false);
          setSelectedArchivedReport(null);
        }} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
        <aside 
          className={`absolute top-0 right-0 h-full w-full max-w-lg bg-white/5 border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${showPreviewDrawer ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                {selectedArchivedReport ? <History className="w-7 h-7 text-indigo-600" /> : <Eye className="w-7 h-7 text-indigo-600" />}
                Report Preview
              </h3>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-black">
                {selectedArchivedReport ? `ARCHIVED: ${selectedArchivedReport.date}` : 'Rich Text Snapshot'}
              </p>
            </div>
            <button 
              onClick={() => {
                setShowPreviewDrawer(false);
                setSelectedArchivedReport(null);
              }}
              className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-slate-400"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto scrollbar-thin bg-white/5">
            <div className="bg-white/5 rounded-3xl p-10 shadow-inner min-h-full">
              <div 
                className="prose prose-slate max-w-none text-white selection:bg-brand-indigo/20"
                style={{ fontFamily: 'Calibri, sans-serif' }}
                dangerouslySetInnerHTML={{ 
                  __html: selectedArchivedReport ? selectedArchivedReport.htmlReport : buildHtmlReport() 
                }} 
              />
            </div>
          </div>

          <div className="p-10 border-t border-white/10 bg-white/5">
            <div className="space-y-6">
              <button 
                onClick={async () => {
                  try {
                    const plainContent = selectedArchivedReport ? selectedArchivedReport.plainReport : buildReport();
                    const htmlContent = selectedArchivedReport ? selectedArchivedReport.htmlReport : buildHtmlReport();

                    if (navigator.clipboard && window.ClipboardItem) {
                      const typePlain = "text/plain";
                      const typeHtml = "text/html";
                      const blobPlain = new Blob([plainContent], { type: typePlain });
                      const blobHtml = new Blob([htmlContent], { type: typeHtml });
                      
                      const clipboardData = [new ClipboardItem({
                        [typePlain]: blobPlain,
                        [typeHtml]: blobHtml
                      })];
                      
                      await navigator.clipboard.write(clipboardData);
                      setShowToast("Record copied! Ready to paste.");
                    } else {
                      await navigator.clipboard.writeText(plainContent);
                      setShowToast("Plain text copied successfully.");
                    }
                  } catch (e) {
                    console.error("Copy error:", e);
                    setShowToast("Failed to access clipboard");
                  }
                }}
                className="w-full bg-brand-indigo hover:bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 transition-all shadow-2xl shadow-indigo-500/20 active:scale-[0.98]"
              >
                <Clipboard className="w-6 h-6" /> Copy Report Format
              </button>
              
              {!selectedArchivedReport && (
                <div className="pt-8 border-t border-white/5 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Essential Resources</h4>
                  <nav className="flex flex-col gap-3">
                    <ExternalLinkItem href="https://drive.google.com/file/d/137BOp88NqFXFuoYJ-VBIR0n-xGfOq4_U/view?usp=drive_link" label="Coroner On Call" meta="Google Drive Access" />
                    <ExternalLinkItem href="https://drive.google.com/file/d/1YRmQRgyxRjqlGWiBLsNaiYhmssqDeCet/view" label="911 SOG'S County" meta="Regulation Handbook" />
                    <ExternalLinkItem href="https://drive.google.com/file/d/15IL2nx3foN5V4L2ue6OBAp8kmZkpWzma/view" label="Employee Handbook" meta="HR Policies" />
                    <ExternalLinkItem href="https://docs.google.com/spreadsheets/d/1ywTY-EVDLJYfPsxKPDGLdNJStJ63W-_yYS-Y4CU31Bw/edit" label="Shift Calendar" meta="Live Roster Sync" />
                  </nav>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Roster Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div onClick={() => setShowPasteModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
          <div className="relative w-full max-w-5xl bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight uppercase">Roster Processing</h3>
                <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-black">Paste data grid from source system</p>
              </div>
              <button 
                onClick={() => setShowPasteModal(false)} 
                className="p-4 hover:bg-white/10 rounded-3xl transition-colors text-slate-500"
              >
                <X className="w-10 h-10" />
              </button>
            </div>
            <div className="p-10 flex-1 relative glass-effect bg-white/5">
              <textarea 
                className="w-full h-full bg-white/5 text-white p-8 rounded-[2rem] border border-white/10 font-mono text-base resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium shadow-inner"
                placeholder="Ctrl+V roster data here..."
                value={data.pasteNotes}
                onChange={(e) => setData(prev => ({ ...prev, pasteNotes: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="p-10 bg-white/5 flex justify-end gap-6 border-t border-white/5">
              <button 
                onClick={() => setShowPasteModal(false)}
                className="bg-emerald-600 hover:bg-emerald-700 px-14 py-5 rounded-3xl text-white font-black uppercase tracking-widest text-sm transition-all shadow-2xl shadow-emerald-500/20 active:scale-95"
              >
                Incorporate Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div onClick={() => setShowHistory(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
          <div className="relative w-full max-w-5xl bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight uppercase">Archive Inventory</h3>
                <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-black">Historical shift matrices & data streams</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-4 hover:bg-white/10 rounded-3xl transition-colors text-slate-500">
                <X className="w-10 h-10" />
              </button>
            </div>
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar bg-white/5">
              {loadingReports ? (
                 <div className="flex flex-col items-center justify-center h-full gap-4">
                   <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Retrieving Encrypted Archives...</p>
                 </div>
              ) : archivedReports.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
                   <History className="w-16 h-16 opacity-20" />
                   <p className="text-xs font-black uppercase tracking-widest">No matching records found in archive</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {archivedReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => {
                        setSelectedArchivedReport(report);
                        setData(report.data);
                        setShowHistory(false);
                        setShowToast("Archived report restored to buffer");
                      }}
                      className="group p-8 bg-white/5 border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all text-left relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/20">
                          <FileText className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SHIFT-{report.shift}</p>
                          <p className="text-lg font-black text-white tracking-tight uppercase italic">{report.name || 'Anonymous'}</p>
                        </div>
                      </div>
                      <p className="text-xs font-mono text-slate-400">{report.date}</p>
                    </button>
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
        onRefreshData={loadHistory} 
      />

      {/* Label Text Appearance Customizer Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
          <div 
            onClick={() => setShowLabelModal(false)} 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
          />
          <div className="relative w-full max-w-xl bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10">
            {/* Modal Header */}
            <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Box Prompt Text Style</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest font-black">
                    Customize color & size of input labels & field headers
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowLabelModal(false)} 
                className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
              {/* Live Preview Box */}
              <div className="p-5 bg-black/40 border border-white/10 rounded-2xl space-y-3 shadow-inner">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                  <span>Live Field Preview</span>
                  <span className="text-indigo-400 font-mono">{labelStyle.fontSize}px • {labelStyle.color}</span>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 pl-2">
                    <Activity style={{ color: labelStyle.color }} className="w-3.5 h-3.5 opacity-80" />
                    <label 
                      style={{ 
                        color: labelStyle.color, 
                        fontSize: `${labelStyle.fontSize}px` 
                      }}
                      className={`${labelStyle.fontWeight} ${labelStyle.textTransform} tracking-wider transition-all leading-none select-none`}
                    >
                      Sample Field Label Prompt
                    </label>
                  </div>
                  <input 
                    type="text" 
                    disabled 
                    value="Input text stays crisp and bright (10-4)" 
                    className="w-full tactical-input p-3 text-xs font-mono text-white/90 cursor-default" 
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Prompt Text Color
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">{labelStyle.color}</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = labelStyle.color.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => updateLabelStyle({ color: preset.hex })}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-white/15 border-white shadow-lg scale-105' 
                            : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                        }`}
                        title={preset.name}
                      >
                        <span 
                          className="w-6 h-6 rounded-full border border-white/20 shadow-inner flex items-center justify-center shrink-0" 
                          style={{ backgroundColor: preset.hex }}
                        >
                          {isSelected && <Check className={`w-3.5 h-3.5 ${preset.hex === '#ffffff' || preset.hex === '#fbbf24' || preset.hex === '#a3e635' ? 'text-black' : 'text-white'}`} />}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-tight text-slate-400 truncate max-w-full">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Custom Hex:</span>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex-1">
                    <input 
                      type="color" 
                      value={labelStyle.color.startsWith('#') && labelStyle.color.length === 7 ? labelStyle.color : '#64748b'} 
                      onChange={(e) => updateLabelStyle({ color: e.target.value })}
                      className="w-6 h-6 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={labelStyle.color} 
                      onChange={(e) => updateLabelStyle({ color: e.target.value })}
                      placeholder="#64748b" 
                      className="bg-transparent border-none text-xs font-mono text-white outline-none w-full uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Size Selector & Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Prompt Text Size
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-400">{labelStyle.fontSize}px</span>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
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
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
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
                    max={20} 
                    step={1}
                    value={labelStyle.fontSize} 
                    onChange={(e) => updateLabelStyle({ fontSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-[9px] font-mono text-slate-500">20px</span>
                </div>
              </div>

              {/* Style Controls (Weight & Transform) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Font Weight
                  </label>
                  <select
                    value={labelStyle.fontWeight}
                    onChange={(e) => updateLabelStyle({ fontWeight: e.target.value as LabelStyleConfig['fontWeight'] })}
                    className="w-full bg-white/5 border border-white/10 text-white text-xs font-medium rounded-xl p-2.5 outline-none focus:border-indigo-500/50"
                  >
                    <option value="font-normal" className="bg-slate-900">Normal (400)</option>
                    <option value="font-medium" className="bg-slate-900">Medium (500)</option>
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
                    className="w-full bg-white/5 border border-white/10 text-white text-xs font-medium rounded-xl p-2.5 outline-none focus:border-indigo-500/50"
                  >
                    <option value="uppercase" className="bg-slate-900">UPPERCASE</option>
                    <option value="normal-case" className="bg-slate-900">Standard Text</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={resetLabelStyle}
                className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLabelModal(false);
                  setShowToast("Label prompt styles applied");
                }}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-600/30 active:scale-95 cursor-pointer"
              >
                Apply & Save
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
    <div className="flex flex-col gap-2.5 group/field">
      <div className="flex items-center gap-2 pl-3">
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
          className: `w-full tactical-input p-4 text-xs font-mono relative z-10 text-white ${(children as any).props?.className || ''}`
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
      className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 group transition-all"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{label}</span>
        <ArrowRight className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
      </div>
      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 block">{meta}</span>
    </a>
  );
}

function PendingUpdatesSync({ onAppend }: { onAppend: (text: string) => void }) {
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'shift_updates'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((d: any) => d.status === 'pending');
      setPending(docs);
    });
    return () => unsubscribe();
  }, []);

  const handleSync = async () => {
    if (pending.length === 0) return;
    const combinedText = pending.map(p => `[${format(p.timestamp?.toDate() || new Date(), 'HH:mm')}] ${p.content}`).join('\n');
    onAppend(combinedText);
    
    // Mark as processed
    for (const p of pending) {
      await updateDoc(doc(db, 'shift_updates', p.id), { status: 'processed' });
    }
  };

  if (pending.length === 0) return null;

  return (
    <button 
      onClick={handleSync}
      className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest animate-pulse hover:bg-indigo-500/20 transition-all"
    >
      <Plus className="w-3 h-3" />
      {pending.length} New Updates Available
    </button>
  );
}
