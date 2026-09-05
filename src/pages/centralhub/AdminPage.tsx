import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Save, 
  AlertCircle, 
  Terminal, 
  Lock, 
  Info, 
  Radio, 
  Activity, 
  User, 
  Settings, 
  History, 
  Truck, 
  Clock, 
  Trash2,
  Globe,
  Loader2, 
  Maximize2,
  Mail,
  CheckCircle2,
  Check,
  X,
  Plus,
  Edit2,
  Phone,
  Camera,
  Search,
  Bell,
  Cpu,
  Zap,
  Wind,
  Thermometer,
  Gauge,
  HardDrive
} from 'lucide-react';
import { BackupControlModal } from '../../components/BackupControlModal';
import { useTerminal, AppTheme } from '../../context/TerminalContext';
import { MatrixPasscodeGate } from '../../components/centralhub/MatrixPasscodeGate';
import { 
  auth, 
  signIn, 
  updateGlobalSettings, 
  getReports, 
  doc, 
  onSnapshot, 
  db, 
  ShiftReport as ShiftReportType,
  PersonnelMember,
  deleteDoc,
  getDocs,
  collection,
  setDoc
} from '../../lib/firebase';
import { ALL_CAMERAS } from '../../lib/camsConstants';

import { ALSSUP_OPTIONS, MEDSUP_MAP, DEFAULT_ZULU_OPTIONS } from '../../lib/shiftConstants';
export interface TerminalUser {
  username: string;
  role: 'dispatcher' | 'admin';
  createdAt: string;
}

export function AdminPage() {
  const { 
    addNotification, 
    notificationPermission, 
    requestNotificationPermission, 
    appTheme, 
    setAppTheme, 
    appBackgroundImage,
    setAppBackgroundImage,
    toneTestMode, 
    setToneTestMode,
    logoutTerminalUser,
    setIsSavingGlobal,
    terminalUser
  } = useTerminal();
  const [showToast, setShowToast] = useState<string | null>(null);

  const safeConfirm = (message: string): boolean => {
    try {
      return window.confirm(message);
    } catch (e) {
      console.warn("window.confirm is blocked in this environment. Proceeding with autoconfirm.", message);
      return true;
    }
  };

  const safeAlert = (message: string) => {
    try {
      window.alert(message);
    } catch (e) {
      console.warn("window.alert is blocked in this environment:", message);
    }
  };

  const safePrompt = (message: string, defaultValue: string = ''): string | null => {
    try {
      return window.prompt(message, defaultValue);
    } catch (e) {
      console.warn("window.prompt is blocked in this environment:", message);
      return null;
    }
  };

  const THEMES: { id: AppTheme; name: string; color: string }[] = [
    { id: 'abyss', name: 'OLED Abyss', color: '#030305' },
    { id: 'stealth', name: 'Stealth Carbon', color: '#0b0f17' },
    { id: 'midnight', name: 'Midnight', color: '#1a1d23' },
    { id: 'slate-dark', name: 'Slate Night', color: '#0c111d' },
    { id: 'cyber', name: 'Cyber Void', color: '#090810' },
    { id: 'matrix', name: 'Matrix Obsidian', color: '#020904' },
    { id: 'paper', name: 'Paper', color: '#e2e8f0' },
    { id: 'cream', name: 'Cream', color: '#eee8d5' },
    { id: 'mint', name: 'Mint', color: '#dcfce7' },
    { id: 'clay', name: 'Clay', color: '#ddd6fe' },
    { id: 'arctic', name: 'Arctic', color: '#e2e8f0' },
    { id: 'ivory', name: 'Ivory', color: '#eee8d5' },
    { id: 'frost', name: 'Frost', color: '#bae6fd' },
    { id: 'sky', name: 'Sky', color: '#7dd3fc' },
  ];

  // Shift Report Config States
  const [user, setUser] = useState(auth.currentUser);
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);

  const isTeamLeadOrAdmin = terminalUser?.role === 'admin' || terminalUser?.role === 'root' || terminalUser?.role === 'shift_lead' || terminalUser?.username === 'sndjy' || !!user;
  const isOnlyMe = terminalUser?.username === 'sndjy' || terminalUser?.role === 'root' || !!user;
  const isAuthorized = terminalUser?.username === 'sndjy' || terminalUser?.role === 'root' || terminalUser?.role === 'shift_lead' || !!user;
  const [supervisors, setSupervisors] = useState<Record<string, string>>(MEDSUP_MAP);
  const [alssupList, setAlssupList] = useState<string[]>(ALSSUP_OPTIONS);
  const [zuluList, setZuluList] = useState<string[]>(DEFAULT_ZULU_OPTIONS);
  const [showZuluModal, setShowZuluModal] = useState(false);
  const [editingZuluIndex, setEditingZuluIndex] = useState<number | null>(null);
  const [zuluFormInput, setZuluFormInput] = useState('');
  const [defaultCameraIds, setDefaultCameraIds] = useState<string[]>([]);
  const [fleetConfigs, setFleetConfigs] = useState<import('../../lib/firebase').UnitConfig[]>([]);
  const [sidebarLinks, setSidebarLinks] = useState<import('../../lib/firebase').SidebarLink[]>([]);
  const [themeOverrides, setThemeOverrides] = useState<import('../../lib/firebase').ThemeOverrides>({});
  const [globalSettings, setGlobalSettings] = useState<import('../../lib/firebase').GlobalSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const lastLocalChangeRef = React.useRef<number>(0);
  const changeThemeOverrides = useCallback((nextVal: import('../../lib/firebase').ThemeOverrides | ((prev: import('../../lib/firebase').ThemeOverrides) => import('../../lib/firebase').ThemeOverrides)) => {
    lastLocalChangeRef.current = Date.now();
    setThemeOverrides(nextVal);
  }, []);

  const themeRef = React.useRef(themeOverrides);
  useEffect(() => {
    themeRef.current = themeOverrides;
  }, [themeOverrides]);

  // Replace handleUpdateSettings with a debounced version for theme overrides
  const debouncedThemeUpdate = React.useMemo(
    () => {
      let timeout: any;
      return (overrides: any) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          handleUpdateSettings({ themeOverrides: overrides });
        }, 1000);
      };
    },
    []
  );

  useEffect(() => {
    return () => {
      // Final flush if unmounting? 
    };
  }, []);

  const [archivedReports, setArchivedReports] = useState<ShiftReportType[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Terminal User States
  const [terminalUsers, setTerminalUsers] = useState<TerminalUser[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ 
    username: '', 
    role: 'dispatcher' as 'dispatcher' | 'admin'
  });

  // Personnel Form State
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonnelMember | null>(null);
  const [personForm, setPersonForm] = useState<{
    name: string, 
    shift: 'A' | 'B' | 'C' | 'D' | 'Other', 
    phone: string, 
    username?: string,
    certifications: {id: string, name: string, expirationDate: string, required: boolean}[]
  }>({
    name: '',
    shift: 'A',
    phone: '',
    username: '',
    certifications: []
  });

  const [activeTab, setActiveTab] = useState<'general' | 'personnel' | 'fleet' | 'links' | 'archive'>('general');

  // Track auth state
  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUser(u));
  }, []);

  // Sync with Firestore Global Settings with offline local storage cache fallback
  useEffect(() => {
    // 1. Load instantly from offline cache first
    try {
      const cached = localStorage.getItem('cached_global_settings');
      if (cached) {
        const data = JSON.parse(cached) as import('../../lib/firebase').GlobalSettings;
        setGlobalSettings(data);
        if (data.personnel) setPersonnel(data.personnel);
        if (data.supervisors) setSupervisors(data.supervisors);
        if (data.alssupOptions) setAlssupList(data.alssupOptions);
        if (data.zuluOptions) setZuluList(data.zuluOptions);
        if (data.defaultCameraIds) setDefaultCameraIds(data.defaultCameraIds);
        if (data.fleetConfigs) setFleetConfigs(data.fleetConfigs);
        if (data.sidebarLinks) setSidebarLinks(data.sidebarLinks);
        if (data.themeOverrides && !isSaving && (Date.now() - lastLocalChangeRef.current > 4000)) {
          setThemeOverrides(data.themeOverrides);
        }
      }
    } catch (e) {
      console.warn("Could not load global settings from offline cache:", e);
    }

    // 2. Setup live database subscription (tolerates subscription errors/firewall blocks)
    let unsubscribe: any = null;
    try {
      const settingsRef = doc(db, 'settings', 'global');
      unsubscribe = onSnapshot(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as import('../../lib/firebase').GlobalSettings;
          setGlobalSettings(data);
          if (data.personnel) setPersonnel(data.personnel);
          if (data.supervisors) setSupervisors(data.supervisors);
          if (data.alssupOptions) setAlssupList(data.alssupOptions);
          if (data.zuluOptions) setZuluList(data.zuluOptions);
          if (data.defaultCameraIds) setDefaultCameraIds(data.defaultCameraIds);
          if (data.fleetConfigs) setFleetConfigs(data.fleetConfigs);
          if (data.sidebarLinks) setSidebarLinks(data.sidebarLinks);
          
          // Save to local cache
          try {
            localStorage.setItem('cached_global_settings', JSON.stringify(data));
          } catch (e) {
            console.warn(e);
          }
          
          if (data.themeOverrides && !isSaving && (Date.now() - lastLocalChangeRef.current > 4000)) {
            const currentStr = JSON.stringify(themeRef.current);
            const incomingStr = JSON.stringify(data.themeOverrides);
            if (currentStr !== incomingStr) {
              setThemeOverrides(data.themeOverrides);
            }
          }
        }
      }, (err) => {
        console.warn("Firestore settings listen offline/blocked, using cached backup states:", err);
      });
    } catch (err) {
      console.warn("Failed to subscribe to global settings:", err);
    }

    return () => { if (unsubscribe) unsubscribe(); };
  }, [isSaving]);

  // Sync Terminal Users with robust local caching fallbacks
  useEffect(() => {
    // 1. Instantly pull everything from local storage cache
    const cachedUsersStr = localStorage.getItem('cached_terminal_users');
    let localUsersList: TerminalUser[] = [];
    if (cachedUsersStr) {
      try {
        const parsed = JSON.parse(cachedUsersStr);
        localUsersList = Object.values(parsed);
        setTerminalUsers(localUsersList);
      } catch (e) {
        console.warn("Parsing cached terminal users failed:", e);
      }
    }

    if (!isAuthorized) return;

    let unsub: any = null;
    try {
      unsub = onSnapshot(collection(db, 'terminal_users'), (snap) => {
        const freshUsers = snap.docs.map(d => {
          const data = d.data();
          return {
            username: data.username || d.id,
            role: data.role || 'dispatcher',
            createdAt: data.createdAt || new Date().toISOString(),
            ...data
          } as TerminalUser;
        });

        setTerminalUsers(freshUsers);

        // Update local cache
        const currentCache = JSON.parse(localStorage.getItem('cached_terminal_users') || '{}');
        freshUsers.forEach(u => {
          currentCache[u.username] = u;
        });
        localStorage.setItem('cached_terminal_users', JSON.stringify(currentCache));
      }, (err) => {
        console.warn("Firestore terminal_users collection subscribe blocked/offline, using local caches:", err);
      });
    } catch (e) {
      console.warn("Failed to subscribe call on terminal_users collection:", e);
    }

    return () => { if (unsub) unsub(); };
  }, [user, isAuthorized]);

  // Login form for admin fallback
  const [adminLoginForm, setAdminLoginForm] = useState({ username: '', password: '' });
  const createTerminalUser = async () => {
    if (!userForm.username) return;
    const username = userForm.username.toLowerCase().trim();
    const newUserObj = {
      username,
      role: userForm.role,
      createdAt: new Date().toISOString()
    };

    // 1. Instantly register in offline local cache
    try {
      const localUsersStr = localStorage.getItem('cached_terminal_users') || '{}';
      const localUsers = JSON.parse(localUsersStr);
      localUsers[username] = newUserObj;
      localStorage.setItem('cached_terminal_users', JSON.stringify(localUsers));
      
      // Update local state right away
      setTerminalUsers(Object.values(localUsers));
    } catch (e) {
      console.warn("Could not save to local offline user cache:", e);
    }

    setShowUserModal(false);
    setUserForm({ username: '', role: 'dispatcher' });

    // 2. Tries to sync to Firebase
    try {
      await setDoc(doc(db, 'terminal_users', username), newUserObj);
      setShowToast("USER_UPLINK_ESTABLISHED");
    } catch (err: any) {
      console.warn("Background Firebase registrar blocked/offline. Offline node established:", err);
      setShowToast("USER_UPLINK_ESTABLISHED"); // We still show success because offline cache is primed and working!
    }
  };

  const deleteTerminalUser = async (username: string) => {
    if (!safeConfirm(`Terminate access for operator: ${(username || '').toUpperCase()}?`)) return;
    
    // 1. Purge from local storage cache instantly
    try {
      const localUsersStr = localStorage.getItem('cached_terminal_users') || '{}';
      const localUsers = JSON.parse(localUsersStr);
      delete localUsers[username];
      localStorage.setItem('cached_terminal_users', JSON.stringify(localUsers));
      
      setTerminalUsers(Object.values(localUsers));
    } catch (e) {
      console.warn(e);
    }
    
    setShowToast("ACCESS_TERMINATED");

    // 2. Try doing background online sync if connectivity exists
    try {
      await deleteDoc(doc(db, 'terminal_users', username));
    } catch (err: any) {
      console.warn("Online database access revoke blocked/offline, using offline purge fallback:", err);
    }
  };

  const savePersonnel = async () => {
    if (!personForm.name) return;
    
    let newPersonnel = [...personnel];
    if (editingPerson) {
      newPersonnel = newPersonnel.map(p => p.id === editingPerson.id ? { ...p, ...personForm } : p);
    } else {
      const newPerson: PersonnelMember = {
        id: crypto.randomUUID(),
        ...personForm
      };
      newPersonnel.push(newPerson);
    }
    
    setPersonnel(newPersonnel);
    if (isAuthorized) await handleUpdateSettings({ personnel: newPersonnel });
    setShowPersonnelModal(false);
    setEditingPerson(null);
    setPersonForm({ name: '', shift: 'A', phone: '', username: '', certifications: [] });
    setShowToast("Personnel Updated");
  };

  const deletePerson = async (id: string) => {
    if (!safeConfirm("Remove this member?")) return;
    const newPersonnel = personnel.filter(p => p.id !== id);
    setPersonnel(newPersonnel);
    if (isAuthorized) await handleUpdateSettings({ personnel: newPersonnel });
  };

  const toggleCamera = async (camId: string) => {
    let newIds = [...defaultCameraIds];
    if (newIds.includes(camId)) {
      newIds = newIds.filter(id => id !== camId);
    } else {
      newIds.push(camId);
    }
    setDefaultCameraIds(newIds);
    if (isAuthorized) await handleUpdateSettings({ defaultCameraIds: newIds });
  };

  const seedPersonnel = async () => {
    if (!isAuthorized) return;
    if (personnel.length > 0 && !safeConfirm("Personnel records already exist. This will append new records. Proceed?")) return;

    const seedData: PersonnelMember[] = [
      { id: crypto.randomUUID(), name: "Crystal Culbertson", shift: 'A' },
      { id: crypto.randomUUID(), name: "Courtney Fletcher", shift: 'A' },
      { id: crypto.randomUUID(), name: "Brian Blair", shift: 'A' },
      { id: crypto.randomUUID(), name: "Corrine Skelly", shift: 'B' },
      { id: crypto.randomUUID(), name: "Dayonna", shift: 'B' },
      { id: crypto.randomUUID(), name: "Joseph Sanders", shift: 'C' },
      { id: crypto.randomUUID(), name: "Michael Senn", shift: 'C' },
      { id: crypto.randomUUID(), name: "Rea Roberson", shift: 'C' },
      { id: crypto.randomUUID(), name: "Erin Brandenburg", shift: 'D' },
      { id: crypto.randomUUID(), name: "Asha Williams", shift: 'D' },
      { id: crypto.randomUUID(), name: "Darren Chestein", shift: 'D' },
      { id: crypto.randomUUID(), name: "Donna Wiles", shift: 'Other' }
    ];

    const merged = [...personnel];
    seedData.forEach(s => {
      if (!merged.find(p => p.name === s.name)) {
        merged.push(s);
      }
    });

    setPersonnel(merged);
    await handleUpdateSettings({ personnel: merged });
    setShowToast("Shift Personnel Synchronized");
  };

  const seedFleet = async () => {
    if (!isAuthorized) return;
    if (fleetConfigs.length > 0 && !safeConfirm("Fleet configuration already exists. This will reset to system defaults. Proceed?")) return;

    const { INITIAL_UNITS, TRANSPORT_ADDRS, QRV_UNITS } = await import('../../lib/dispatchConstants');
    
    const transportFleet: import('../../lib/firebase').UnitConfig[] = INITIAL_UNITS.map(u => ({
      id: u.id,
      name: u.id,
      homePost: u.home || 'Headquarters',
      address: TRANSPORT_ADDRS[u.id] || "",
      type: 'transport'
    }));

    const qrvFleet: import('../../lib/firebase').UnitConfig[] = QRV_UNITS.map(q => ({
      id: q.name,
      name: q.name,
      homePost: 'Headquarters',
      address: q.addr,
      type: 'qrv'
    }));

    const fullFleet = [...transportFleet, ...qrvFleet];
    setFleetConfigs(fullFleet);
    await handleUpdateSettings({ fleetConfigs: fullFleet });
    setShowToast("FLEET_MATRIX_INITIALIZED");
  };

  const updateFleetUnit = async (id: string, updates: Partial<import('../../lib/firebase').UnitConfig>) => {
    const newFleet = fleetConfigs.map(u => u.id === id ? { ...u, ...updates } : u);
    setFleetConfigs(newFleet);
    await handleUpdateSettings({ fleetConfigs: newFleet });
  };

  const loadHistory = useCallback(async () => {
    if (!isAuthorized) return;
    setLoadingReports(true);
    try {
      const reports = await getReports();
      if (reports) setArchivedReports(reports);
    } catch (e) {
      console.error(e);
      setShowToast("Failed to load history");
    } finally {
      setLoadingReports(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) loadHistory();
  }, [isAuthorized, loadHistory]);

  // Apply local theme overrides for instant preview
  useEffect(() => {
    const root = document.documentElement;
    const overrides = themeOverrides;
    
    const vars: Record<string, string | undefined> = {
      '--brand-blue': overrides.brandBlue,
      '--brand-indigo': overrides.brandIndigo,
      '--brand-emerald': overrides.brandEmerald,
      '--brand-panel': overrides.brandPanel,
      '--brand-border': overrides.brandBorder,
      '--brand-bg': overrides.brandBg,
      '--brand-field': overrides.brandField,
      '--brand-accent': overrides.brandAccent,
      '--header-logo-color': overrides.headerLogoColor,
      '--bg-main': overrides.bgMain,
      '--bg-surface': overrides.bgSurface,
      '--text-main': overrides.textMain,
      '--text-dim': overrides.textDim,
      '--panel-opacity': overrides.panelOpacity?.toString(),
      '--global-scale': overrides.globalScale?.toString(),
    };

    Object.entries(vars).forEach(([key, value]) => {
      if (value !== undefined) {
        root.style.setProperty(key, value);
      }
    });

    if (overrides.globalScale !== undefined) {
      root.style.fontSize = `${16 * overrides.globalScale}px`;
    }
  }, [themeOverrides]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleUpdateSettings = async (updates: Partial<import('../../lib/firebase').GlobalSettings>) => {
    try {
      setIsSaving(true);
      if (updates.themeOverrides) setIsSavingGlobal(true);
      await updateGlobalSettings(updates);
      // Success toast
      if (updates.themeOverrides) {
        setShowToast("VECTORS_COMMITTED_TO_CORE");
      }
    } catch (err) {
      console.error(err);
      setShowToast("UPLINK_SYNC_REJECTED");
    } finally {
      // Stay in saving mode for a moment to ignore the immediate snapshot echo
      setTimeout(() => {
        setIsSaving(false);
        setIsSavingGlobal(false);
      }, 3000);
    }
  };

  const updateSidebarLink = (id: string, updates: Partial<import('../../lib/firebase').SidebarLink>) => {
    const newLinks = sidebarLinks.length > 0 ? [...sidebarLinks] : [
      { icon: 'LayoutDashboard', label: 'Start Page', path: '/', external: false, id: 'start' },
      { icon: 'Activity', label: 'Tone Test', path: '/tone-test', external: false, id: 'tone' },
      { icon: 'Terminal', label: 'Unit Posting', path: '/unit-posting', external: false, id: 'unit' },
      { icon: 'MapIcon', label: 'Distance Map', path: '/distance-map', external: false, id: 'dist' },
      { icon: 'FileText', label: 'Shift Report', path: '/shift-report', external: false, id: 'report' },
      { icon: 'Camera', label: 'Cameras', path: '/cameras', external: false, id: 'cams' },
      { icon: 'ClockIcon', label: 'Time Clock', path: '/time-clock', external: false, id: 'clock' },
      { icon: 'Phone', label: 'Directory', path: '/directory', external: false, id: 'dir' },
      { icon: 'Calendar', label: 'Coroner Schedule', path: 'https://drive.google.com/file/d/137BOp88NqFXFuoYJ-VBIR0n-xGfOq4_U/view?usp=drive_link', external: true, id: 'coroner' },
      { icon: 'Table', label: 'Daily Worksheet', path: 'https://docs.google.com/spreadsheets/d/1-4Uwh00g4orCaOQoOrLIcRkamAhdxrBNhVVOt2IEOoY/edit?gid=534085027#gid=534085027', external: true, id: 'worksheet' },
      { icon: 'Table', label: 'AVL Cleanup Tool', path: 'https://docs.google.com/spreadsheets/d/12V94dal4UvVJcsRMBd3fCj49pJjiOXFMTgZa1tdaEE0/edit?gid=1621560398#gid=1621560398', external: true, id: 'avl_cleanup' },
      { icon: 'CreditCard', label: 'PayCom Online', path: 'https://www.paycomonline.net/v4/ee/web.php/app/login', external: true, id: 'paycom' },
    ];

    const updated = newLinks.map(l => l.id === id ? { ...l, ...updates } : l);
    setSidebarLinks(updated as any);
    handleUpdateSettings({ sidebarLinks: updated as any });
  };

  const addSidebarLink = () => {
    const newLink = {
      id: crypto.randomUUID(),
      label: 'New Link',
      path: 'https://',
      icon: 'LinkIcon',
      external: true
    };
    const updated = [...(sidebarLinks.length > 0 ? sidebarLinks : []), newLink];
    setSidebarLinks(updated as any);
    handleUpdateSettings({ sidebarLinks: updated as any });
  };

  const removeSidebarLink = (id: string) => {
    if (!safeConfirm("Remove this link?")) return;
    const updated = sidebarLinks.filter(l => l.id !== id);
    setSidebarLinks(updated);
    handleUpdateSettings({ sidebarLinks: updated });
  };

  return (
    <div className="space-y-12 pb-24 h-full overflow-y-auto pr-4 scrollbar-thin transition-colors duration-500">
      <header className="flex flex-wrap items-center justify-between gap-8 pb-10 border-b border-white/5 relative tactical-header-glow">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-2xl shadow-indigo-500/20 group hover:scale-110 transition-all duration-500">
             <Lock className="w-8 h-8 text-indigo-400 group-hover:animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">System <span className="text-indigo-500 not-italic">Matrix</span></h1>
            <p className="text-slate-500 font-black mt-1 uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
              <Shield className="w-3 h-3 text-emerald-500" />
              Authenticated Administrative Protocols
            </p>
          </div>
        </div>
      </header>

      {/* Admin UI directly below header */}

      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-6">
        {[
          { id: 'general', label: 'System & Theme', icon: <Settings className="w-4 h-4" /> },
          { id: 'fleet', label: 'Fleet Configuration', icon: <Truck className="w-4 h-4" /> },
          { id: 'personnel', label: 'Personnel & Access', icon: <User className="w-4 h-4" /> },
          { id: 'links', label: 'Nav & Feeds', icon: <Camera className="w-4 h-4" /> },
          { id: 'archive', label: 'Archives', icon: <History className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`
              px-6 py-3 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all
              ${activeTab === tab.id 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* App Theme Settings */}
              <section className="tactical-card p-8 space-y-6 bg-indigo-500/[0.02] flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-4 italic">
                <Settings className="w-5 h-5 text-indigo-400" />
                Theme <span className="text-indigo-400 not-italic">Sync</span>
              </h3>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 flex-1 items-center">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setAppTheme(theme.id);
                    setShowToast(`${theme.name.toUpperCase()} ENGINE ACTIVATED`);
                  }}
                  className={`
                    flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all relative overflow-hidden group
                    ${appTheme === theme.id 
                      ? 'bg-white/10 border-white/20 shadow-xl' 
                      : 'bg-black/60 border-transparent hover:border-white/10 hover:bg-white/5'}
                  `}
                  title={theme.name}
                >
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 mb-2" 
                    style={{ backgroundColor: theme.color, boxShadow: `0 0 15px ${theme.color}44` }}
                  >
                    {appTheme === theme.id && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-[0.2em] text-center truncate w-full ${appTheme === theme.id ? 'text-white' : 'text-slate-500'}`}>
                    {theme.id.substring(0, 4)}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-3">
               <div className="flex items-center justify-between">
                 <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Background Atmosphere</label>
                 {appBackgroundImage && (
                   <button 
                     type="button" 
                     onClick={() => {
                       setAppBackgroundImage(null);
                       setShowToast("DEFAULT_CYBER_GRID_RESTORED");
                     }}
                     className="text-[8px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300"
                   >
                     Reset to Cyber Grid
                   </button>
                 )}
               </div>

               {/* Quick Presets */}
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                 {[
                   { label: 'Cyber Grid (Dynamic)', url: null, bg: 'linear-gradient(135deg, #0b0f19, #1e3a8a)' },
                   { label: 'Deep Aurora', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80', bg: '#091e3a' },
                   { label: 'Tactical Command', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80', bg: '#0f172a' },
                   { label: 'Midnight Horizon', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80', bg: '#030712' },
                 ].map((preset) => {
                   const isSelected = (!preset.url && !appBackgroundImage) || (appBackgroundImage === preset.url);
                   return (
                     <button
                       key={preset.label}
                       type="button"
                       onClick={() => {
                         setAppBackgroundImage(preset.url);
                         setShowToast(`${preset.label.toUpperCase()} ACTIVATED`);
                       }}
                       className={`p-2 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all text-center flex flex-col items-center gap-1.5 ${
                         isSelected 
                           ? 'bg-blue-600/30 border-blue-400 text-white shadow-lg shadow-blue-500/20' 
                           : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                       }`}
                     >
                       <span 
                         className="w-full h-8 rounded-lg border border-white/10 shadow-inner flex items-center justify-center"
                         style={{ background: preset.bg }}
                       >
                         {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                       </span>
                       <span className="truncate max-w-full">{preset.label}</span>
                     </button>
                   );
                 })}
               </div>

               <div className="pt-2">
                 <input
                   type="text"
                   value={appBackgroundImage || ''}
                   onChange={(e) => setAppBackgroundImage(e.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                   placeholder="Or enter custom image URL (https://images.unsplash.com/...)"
                 />
               </div>
            </div>
          </section>

          {/* Notification Settings */}
          <section className="tactical-card p-8 space-y-6 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-4 italic text-sans">
                <Bell className="w-5 h-5 text-indigo-500" />
                Alert <span className="text-indigo-500 not-italic">Matrix</span>
              </h3>
              <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${notificationPermission === 'granted' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                 {notificationPermission.toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Integration</p>
                  <p className="text-[10px] text-white/40 mt-1 uppercase font-bold">Authorized Gateways</p>
                </div>
                {notificationPermission !== 'granted' && (
                  <button 
                    onClick={requestNotificationPermission}
                    className="tactical-btn-indigo px-5 py-2 text-[9px] h-fit"
                  >
                    Establish Link
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => {
                    addNotification('SYSTEM_READY // ALERT_CHANNEL_ESTABLISHED', 'success');
                  }}
                  className="w-full py-3 bg-white/5 border border-white/10 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  INITIATE PING
                </button>
              </div>
            </div>
          </section>
          </div>

          {/* Advanced Visuals */}
          <section className="tactical-card p-10 space-y-10 bg-brand-panel/30">
            <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/5">
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4 italic">
                <Settings className="w-6 h-6 text-indigo-400" />
                Advanced <span className="text-indigo-400 not-italic">Visuals</span>
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mt-2">Granular UI color and transparency controls</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={() => {
                changeThemeOverrides({});
                updateGlobalSettings({ themeOverrides: {} });
                setShowToast("THEME_RESET_COMPLETE");
              }}
              className="px-6 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition-all"
            >
              Reset to Defaults
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Color Matrix */}
            <div className="space-y-6 lg:col-span-2">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic border-l-2 border-indigo-500 pl-3">Color Vector Matrix</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Brand Indigo', key: 'brandIndigo' },
                  { label: 'Brand Blue', key: 'brandBlue' },
                  { label: 'Brand Emerald', key: 'brandEmerald' },
                  { label: 'Brand Accent', key: 'brandAccent' },
                  { label: 'Header Logo', key: 'headerLogoColor' },
                  { label: 'Panel BG', key: 'brandPanel' },
                  { label: 'Border', key: 'brandBorder' },
                  { label: 'Main BG', key: 'bgMain' },
                  { label: 'Surface BG', key: 'bgSurface' },
                  { label: 'Text Main', key: 'textMain' },
                  { label: 'Text Dim', key: 'textDim' },
                ].map((item) => (
                  <div key={item.key} className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">{item.label}</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={themeOverrides[item.key as keyof typeof themeOverrides] as string || '#000000'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = { ...themeOverrides, [item.key]: val };
                          changeThemeOverrides(next);
                          debouncedThemeUpdate(next);
                        }}
                        className="w-20 h-20 rounded-2xl bg-transparent border-2 border-white/10 cursor-pointer p-0 hover:scale-105 active:scale-95 transition-all shadow-lg overflow-hidden"
                      />
                      <div className="flex-1 space-y-2">
                        <input 
                          type="text"
                          value={themeOverrides[item.key as keyof typeof themeOverrides] as string || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = { ...themeOverrides, [item.key]: val };
                            changeThemeOverrides(next);
                            debouncedThemeUpdate(next);
                          }}
                          placeholder="HEX/RGB"
                          className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white font-mono uppercase focus:border-indigo-500 outline-none"
                        />
                        <button 
                          onClick={() => {
                            const newTheme = { ...themeOverrides };
                            delete newTheme[item.key as keyof typeof themeOverrides];
                            changeThemeOverrides(newTheme);
                            handleUpdateSettings({ themeOverrides: newTheme });
                          }}
                          className="text-[8px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Density & Transparency */}
            <div className="space-y-8">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic border-l-2 border-indigo-500 pl-3">Optics & Density</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Panel Opacity</label>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">{Math.round((themeOverrides.panelOpacity || 0.5) * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05"
                  value={themeOverrides.panelOpacity || 0.5}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    changeThemeOverrides(prev => ({ ...prev, panelOpacity: val }));
                  }}
                  onMouseUp={() => handleUpdateSettings({ themeOverrides: themeRef.current })}
                  className="w-full h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[8px] text-slate-600 uppercase tracking-widest italic">Controls glass effect transparency level</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Scale</label>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">x{(themeOverrides.globalScale || 1).toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.75" max="1.5" step="0.05"
                  value={themeOverrides.globalScale || 1}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    changeThemeOverrides(prev => ({ ...prev, globalScale: val }));
                  }}
                  onMouseUp={() => handleUpdateSettings({ themeOverrides: themeRef.current })}
                  className="w-full h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[8px] text-slate-600 uppercase tracking-widest italic">Scales entire interface typography and grid</p>
              </div>
            </div>

            {/* Quick Actions / Presets */}
            <div className="space-y-6">
               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic border-l-2 border-indigo-500 pl-3">Override Diagnostics</h4>
               <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Tunnel</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tight">
                    Manual overrides will persist across all active terminal sessions and bypass standard theme defaults.
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    onClick={() => handleUpdateSettings({ themeOverrides })}
                    className="w-full py-4 bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    Commit Vector Update
                  </motion.button>
               </div>
            </div>
          </div>
        </section>

        {/* Level 1.7: Weather Optics */}
        <section className="tactical-card p-10 space-y-10 bg-indigo-500/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/5">
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4 italic">
                <Wind className="w-6 h-6 text-indigo-400" />
                Weather <span className="text-indigo-400 not-italic">Optics</span>
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mt-2">Modular environment monitoring controls</p>
            </div>
            <div className="flex gap-2">
               <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { key: 'showCurrent', label: 'Primary Metrics', icon: <Thermometer className="w-4 h-4" />, desc: 'Current temperature & condition' },
              { key: 'showPressure', label: 'Pressure Analytics', icon: <Gauge className="w-4 h-4" />, desc: 'Barometric tracking' },
              { key: 'showTimeline', label: 'Shift Timeline', icon: <Clock className="w-4 h-4" />, desc: '24H Hourly forecast' },
              { key: 'showTomorrow', label: 'Extended Outlook', icon: <Shield className="w-4 h-4" />, desc: 'T+24H projected trends' },
            ].map((module) => (
              <div 
                key={module.key}
                className="p-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-4 group hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      {module.icon}
                   </div>
                   <div 
                    onClick={() => {
                      const current = globalSettings?.weatherModules || { showCurrent: true, showPressure: true, showTimeline: true, showTomorrow: true };
                      const updated = { ...current, [module.key]: !current[module.key as keyof typeof current] };
                      handleUpdateSettings({ weatherModules: updated });
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer relative ${globalSettings?.weatherModules?.[module.key as keyof typeof module.key] !== false ? 'bg-indigo-500' : 'bg-slate-700'}`}
                   >
                     <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-sm ${globalSettings?.weatherModules?.[module.key as keyof typeof module.key] !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                   </div>
                </div>
                <div>
                   <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{module.label}</h4>
                   <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1 italic">{module.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        </div>
        )}

        {/* PERSONNEL & ACCESS TAB */}
        {activeTab === 'personnel' && (
          <MatrixPasscodeGate allowedRoles={['root', 'admin', 'shift_lead']}>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500">
          
          {/* User Access Management */}
          <section className="tactical-card p-10 space-y-10 xl:col-span-4 bg-indigo-500/[0.02]">
            <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/5">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  Terminal <span className="text-indigo-400 not-italic">Nodes</span>
                </h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mt-2">Access Credentials & Privileges</p>
              </div>
              <div className="flex gap-3">
                <button 
                  disabled={!isAuthorized}
                  onClick={() => {
                    safeAlert("TO ADD A LOGIN:\n1. Choose a unique Operator ID (e.g. 'dispatcher1')\n2. Click 'Confirm Registration'\n\nThe user can then log in using just that Operator ID.");
                  }}
                  className="px-4 py-2 border border-indigo-500/30 text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/10 transition-all"
                >
                  <Info className="w-3 h-3 inline mr-1" /> Help
                </button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  disabled={!isAuthorized}
                  onClick={() => setShowUserModal(true)}
                  className="tactical-btn-indigo px-5 py-2 text-[10px] shadow-indigo-500/10 disabled:opacity-30 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Node
                </motion.button>
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {terminalUsers.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-black/20">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No Authorized Nodes</p>
                </div>
              ) : (
                terminalUsers.map((u, idx) => (
                  <div key={u.username || idx} className="p-5 bg-black/40 border border-white/5 rounded-2xl group hover:border-indigo-500/40 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${u.role === 'admin' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                        {u.role === 'admin' ? <Shield size={18} /> : <Terminal size={18} />}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-widest">{u.username}</div>
                        <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1 italic">{u.role === 'admin' ? 'FULL_ACCESS_NODE' : 'DISPATCH_OPERATOR'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => deleteTerminalUser(u.username)}
                        className="p-2 text-slate-600 hover:text-rose-400 transition-colors bg-white/5 rounded-lg opacity-0 group-hover:opacity-100"
                        title="Revoke Access"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex gap-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-200/40 font-bold uppercase tracking-tight leading-relaxed">
                  Notice: These credentials bypass standard Google authentication.
                </p>
              </div>
            </div>
          </section>

          {/* Fleet Personnel Array */}
          <section className="tactical-card p-10 space-y-10 xl:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/5">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                  <User className="w-6 h-6 text-indigo-500" />
                  Fleet Personnel Array
                </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mt-2">Database of active responders and tactical shifts</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                disabled={!isAuthorized}
                onClick={seedPersonnel}
                className="px-6 py-3 bg-white/5 border border-white/10 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                title="Import from Hardcoded Seeds"
              >
                Sync Buffer
              </button>
              <button 
                disabled={!isAuthorized}
                onClick={() => {
                setEditingPerson(null);
                setPersonForm({ name: '', shift: 'A', phone: '', certifications: [] });
                setShowPersonnelModal(true);
              }}
              className="tactical-btn-indigo px-8 py-3 text-[10px] shadow-indigo-500/20 disabled:opacity-30"
            >
              <Plus className="w-4 h-4" />
              Initialize Personnel
            </button>
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {['A', 'B', 'C', 'D', 'Other'].map(shift => (
              <div key={shift} className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{shift} Shift</h4>
                  <span className="text-[9px] font-mono text-slate-500 border border-white/10 px-2 py-0.5 rounded bg-black/20">{personnel.filter(p => p.shift === shift).length}</span>
                </div>
                <div className="space-y-3">
                  {personnel.filter(p => p.shift === shift).length === 0 ? (
                    <div className="py-8 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
                      <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">No Personnel Deployed</span>
                    </div>
                  ) : (
                    personnel.filter(p => p.shift === shift).map((p, idx) => (
                      <div key={p.id || idx} className="p-5 bg-black/20 border border-white/5 rounded-2xl group hover:border-indigo-500/40 transition-all duration-300 shadow-inner hover:shadow-indigo-500/5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-white uppercase tracking-tight truncate group-hover:text-indigo-400 transition-colors uppercase">{p.name}</div>
                            {p.phone ? (
                              <div className="flex items-center gap-2 mt-2">
                                <Phone className="w-3 h-3 text-slate-600" />
                                <span className="text-[9px] font-mono text-slate-500 font-bold tracking-tight">{p.phone}</span>
                              </div>
                            ) : (
                              <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">No contact data</div>
                            )}

                            {p.certifications && p.certifications.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {p.certifications.map(c => (
                                  <div key={c.id} className="text-[8px] font-mono font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 uppercase" title={`Exp: ${c.expirationDate}`}>
                                    {c.name || 'Cert'}- Exp {c.expirationDate ? `${c.expirationDate.split('-')[1] || ''}/${c.expirationDate.split('-')[0].slice(2) || ''}` : 'N/A'}
                                  </div>
                                ))}
                              </div>
                            )}

                            {p.username && (
                              <div className="mt-3 border-t border-white/5 pt-2 flex flex-col gap-1">
                                <div className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-widest">
                                  Username = {p.username}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingPerson(p);
                                setPersonForm({ name: p.name, shift: p.shift, phone: p.phone || '', username: p.username || '', certifications: p.certifications || [] });
                                setShowPersonnelModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors bg-white/5 rounded-lg"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => deletePerson(p.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors bg-white/5 rounded-lg"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

          {/* ALSSUP Management */}
          <section className="tactical-card p-10 space-y-6 xl:col-span-6 bg-indigo-500/[0.02]">
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  ALSSUP Options
                </h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mt-2">ALS Supervisor Designations</p>
              </div>
              <button
                disabled={!isAuthorized}
                onClick={() => {
                  const val = window.prompt("Enter new ALSSUP Option (e.g. '(A-1) John Doe'):");
                  if (val?.trim()) {
                    const newList = [...alssupList, val.trim()];
                    setAlssupList(newList);
                    updateGlobalSettings({ alssupOptions: newList });
                  }
                }}
                className="tactical-btn-indigo px-4 py-2 text-[10px] flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {alssupList.map((opt, idx) => (
                <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between group hover:border-indigo-500/40 transition-all">
                  <span className="text-xs font-bold text-slate-300 uppercase">{opt}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        const val = window.prompt("Edit ALSSUP Option:", opt);
                        if (val && val.trim() !== opt) {
                          const newList = [...alssupList];
                          newList[idx] = val.trim();
                          setAlssupList(newList);
                          updateGlobalSettings({ alssupOptions: newList });
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-400 bg-white/5 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${opt}?`)) {
                          const newList = alssupList.filter((_, i) => i !== idx);
                          setAlssupList(newList);
                          updateGlobalSettings({ alssupOptions: newList });
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 bg-white/5 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* MEDSUP Management */}
          <section className="tactical-card p-10 space-y-6 xl:col-span-6 bg-indigo-500/[0.02]">
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  MEDSUP & Emails
                </h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mt-2">Medical Supervisors & Notifications</p>
              </div>
              <button
                disabled={!isAuthorized}
                onClick={() => {
                  const name = window.prompt("Enter MEDSUP Name:");
                  if (name?.trim()) {
                    const email = window.prompt(`Enter email for ${name.trim()}:`);
                    const newSups = { ...supervisors, [name.trim()]: (email || "").trim() };
                    setSupervisors(newSups);
                    updateGlobalSettings({ supervisors: newSups });
                  }
                }}
                className="tactical-btn-indigo px-4 py-2 text-[10px] flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add MEDSUP
              </button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {Object.entries(supervisors).map(([name, email]) => (
                <div key={name} className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between group hover:border-indigo-500/40 transition-all">
                  <div>
                    <div className="text-xs font-bold text-slate-300 uppercase">{name}</div>
                    <div className="text-[10px] font-mono text-slate-500 lowercase mt-1">{email || "No email"}</div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        const newName = window.prompt("Edit MEDSUP Name:", name);
                        if (newName && newName.trim()) {
                          const newEmail = window.prompt("Edit Email:", email);
                          if (newEmail !== null) {
                            const newSups = { ...supervisors };
                            delete newSups[name];
                            newSups[newName.trim()] = newEmail.trim();
                            setSupervisors(newSups);
                            updateGlobalSettings({ supervisors: newSups });
                          }
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-400 bg-white/5 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${name}?`)) {
                          const newSups = { ...supervisors };
                          delete newSups[name];
                          setSupervisors(newSups);
                          updateGlobalSettings({ supervisors: newSups });
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 bg-white/5 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Zulu Unit Roster Management */}
          <section className="tactical-card p-10 space-y-6 xl:col-span-12 bg-indigo-500/[0.02]">
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                  <Truck className="w-5 h-5 text-indigo-400" />
                  Zulu Unit Roster & Call Signs
                </h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mt-2">Configurable Zulu Units for Shift Reports & Turnover</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  disabled={!isAuthorized}
                  onClick={() => {
                    if (safeConfirm("Reset Zulu Unit roster back to default list?")) {
                      setZuluList(DEFAULT_ZULU_OPTIONS);
                      updateGlobalSettings({ zuluOptions: DEFAULT_ZULU_OPTIONS });
                      setShowToast("ZULU ROSTER RESET TO DEFAULT");
                    }
                  }}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-white/10"
                  title="Reset to default ZULU-1 through ZULU-11"
                >
                  Reset Default
                </button>
                <button
                  disabled={!isAuthorized}
                  onClick={() => {
                    setEditingZuluIndex(null);
                    setZuluFormInput('');
                    setShowZuluModal(true);
                  }}
                  className="tactical-btn-indigo px-4 py-2 text-[10px] flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Zulu Unit
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
              {zuluList.map((unit, idx) => (
                <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between group hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide truncate" title={unit}>
                      {unit}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      disabled={!isAuthorized}
                      onClick={() => {
                        setEditingZuluIndex(idx);
                        setZuluFormInput(unit);
                        setShowZuluModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit Zulu Unit Name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={!isAuthorized}
                      onClick={() => {
                        if (safeConfirm(`Remove ${unit} from Zulu roster?`)) {
                          const newList = zuluList.filter((_, i) => i !== idx);
                          setZuluList(newList);
                          updateGlobalSettings({ zuluOptions: newList });
                          setShowToast("ZULU UNIT REMOVED");
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      title="Remove Unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
          </MatrixPasscodeGate>
        )}

        {/* FLEET CONFIGURATION TAB */}
        {activeTab === 'fleet' && (
          <MatrixPasscodeGate allowedRoles={['root', 'admin', 'shift_lead']}>
            <div className="space-y-12 animate-in fade-in duration-500">
        {/* Level 3: Fleet Configuration Management */}
        <section className="tactical-card p-10 space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-brand-border">
            <div>
              <h3 className="text-2xl font-black text-text-main uppercase tracking-tight flex items-center gap-4">
                <Truck className="w-6 h-6 text-brand-indigo" />
                Fleet <span className="text-brand-indigo not-italic">Configuration</span>
              </h3>
              <p className="text-[10px] text-text-dim uppercase tracking-[0.3em] font-black mt-2">Manage unit home stations and response addresses</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                disabled={!isAuthorized}
                onClick={seedFleet}
                className="px-6 py-3 bg-brand-panel/30 border border-brand-border text-text-dim rounded-xl font-black uppercase tracking-widest text-[10px] hover:text-text-main hover:bg-brand-panel/50 transition-all disabled:opacity-30"
                title="Populate from System Defaults"
              >
                Sync Defaults
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
            {fleetConfigs.length === 0 ? (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-brand-border rounded-[2rem] bg-brand-bg/20">
                <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">No Fleet Matrix Configured</p>
              </div>
            ) : (
              fleetConfigs.map((unit, idx) => (
                <div key={unit.id || idx} className="p-6 bg-brand-panel/40 border border-brand-border rounded-2xl group hover:border-brand-indigo/40 transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${unit.type === 'transport' ? 'bg-brand-indigo/10 border-brand-indigo/30 text-brand-indigo' : 'bg-brand-emerald/10 border-brand-emerald/30 text-brand-emerald'}`}>
                        {unit.type === 'transport' ? <Truck size={14} /> : <Zap size={14} />}
                      </div>
                      <span className="text-sm font-black text-text-main uppercase">{unit.id}</span>
                    </div>
                    <span className="text-[8px] font-black px-2 py-0.5 rounded bg-brand-panel/30 border border-brand-border text-text-dim uppercase tracking-widest leading-none">
                      {unit.type}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Home Post</label>
                      <input 
                        type="text"
                        value={unit.homePost}
                        onChange={(e) => updateFleetUnit(unit.id, { homePost: e.target.value })}
                        className="w-full bg-brand-bg/50 border border-brand-border rounded-lg px-3 py-2 text-[10px] text-text-main font-mono uppercase focus:border-brand-indigo outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-text-dim uppercase tracking-widest">Response Address</label>
                      <textarea 
                        value={unit.address}
                        rows={2}
                        onChange={(e) => updateFleetUnit(unit.id, { address: e.target.value })}
                        className="w-full bg-brand-bg/50 border border-brand-border rounded-lg px-3 py-2 text-[10px] text-text-main font-mono uppercase focus:border-brand-indigo outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        </div>
          </MatrixPasscodeGate>
        )}

        {/* LINKS & FEEDS TAB */}
        {activeTab === 'links' && (
          <div className="space-y-12 animate-in fade-in duration-500">
          {isTeamLeadOrAdmin && (
            <>
              {/* Sidebar Link Management */}
              <section className="tactical-card p-10 space-y-10 bg-brand-panel/20">
              <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4 italic font-sans">
                    <Settings className="w-6 h-6 text-indigo-400" />
                    Sidebar <span className="text-indigo-400 not-italic">Matrix</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mt-2">Manage menu navigation and external portals</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setSidebarLinks([]);
                      updateGlobalSettings({ sidebarLinks: [] });
                      setShowToast("NAVIGATION_VECTORS_RECALIBRATED");
                    }}
                    className="px-6 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition-all"
                  >
                    Reset Navigation
                  </button>
                  <button 
                    onClick={addSidebarLink}
                    className="tactical-btn-indigo px-8 py-3 text-[10px]"
                  >
                    <Plus className="w-4 h-4" />
                    Inject Link
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(sidebarLinks.length > 0 ? sidebarLinks : [
                  { icon: 'LayoutDashboard', label: 'Start Page', path: '/', external: false, id: 'start' },
                  { icon: 'Activity', label: 'Tone Test', path: '/tone-test', external: false, id: 'tone' },
                  { icon: 'Terminal', label: 'Unit Posting', path: '/unit-posting', external: false, id: 'unit' },
                  { icon: 'MapIcon', label: 'Distance Map', path: '/distance-map', external: false, id: 'dist' },
                  { icon: 'FileText', label: 'Shift Report', path: '/shift-report', external: false, id: 'report' },
                  { icon: 'Camera', label: 'Cameras', path: '/cameras', external: false, id: 'cams' },
                  { icon: 'ClockIcon', label: 'Time Clock', path: '/time-clock', external: false, id: 'clock' },
                  { icon: 'Phone', label: 'Directory', path: '/directory', external: false, id: 'dir' },
                  { icon: 'Calendar', label: 'Coroner Schedule', path: 'https://drive.google.com/file/d/137BOp88NqFXFuoYJ-VBIR0n-xGfOq4_U/view?usp=drive_link', external: true, id: 'coroner' },
                  { icon: 'Table', label: 'Daily Worksheet', path: 'https://docs.google.com/spreadsheets/d/1-4Uwh00g4orCaOQoOrLIcRkamAhdxrBNhVVOt2IEOoY/edit?gid=534085027#gid=534085027', external: true, id: 'worksheet' },
                  { icon: 'Table', label: 'AVL Cleanup Tool', path: 'https://docs.google.com/spreadsheets/d/12V94dal4UvVJcsRMBd3fCj49pJjiOXFMTgZa1tdaEE0/edit?gid=1621560398#gid=1621560398', external: true, id: 'avl_cleanup' },
                  { icon: 'CreditCard', label: 'PayCom Online', path: 'https://www.paycomonline.net/v4/ee/web.php/app/login', external: true, id: 'paycom' },
                ]).map((link) => (
                  <div key={link.id} className="p-6 bg-black/40 border border-white/5 rounded-2xl group hover:border-indigo-500/40 transition-all space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{link.external ? 'EXTERNAL' : 'CORE'}</span>
                      </div>
                      <button 
                        onClick={() => removeSidebarLink(link.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Label</label>
                        <input 
                          type="text" 
                          value={link.label}
                          onChange={(e) => updateSidebarLink(link.id, { label: e.target.value })}
                          className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white font-black uppercase focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Target Path / URL</label>
                        <input 
                          type="text" 
                          value={link.path}
                          onChange={(e) => updateSidebarLink(link.id, { path: e.target.value })}
                          className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Icon Key</label>
                          <input 
                            type="text" 
                            value={link.icon}
                            onChange={(e) => updateSidebarLink(link.id, { icon: e.target.value })}
                            className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white font-mono focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={link.external}
                              onChange={(e) => updateSidebarLink(link.id, { external: e.target.checked })}
                              className="w-3 h-3 accent-indigo-500 rounded bg-black/40 border-white/10"
                            />
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">External</span>
                          </label>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setShowToast("LINK_CONFIGURATION_SAVED")}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          <Check className="w-3 h-3" />
                          Apply Link Configuration
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
          )}

        {/* Level 4: Orbital Feeds - Full Wide */}
        <section className="tactical-card p-10 space-y-8">
           <div className="flex items-center justify-between border-b border-white/5 pb-6">
             <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4 italic font-sans">
               <Camera className="w-6 h-6 text-indigo-500" />
               Orbital <span className="text-indigo-500 not-italic">Feeds</span>
             </h3>
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Links</span>
               <span className="text-xs font-mono text-indigo-400 font-black border border-indigo-500/30 px-3 py-1 rounded-lg bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">{defaultCameraIds.length}</span>
             </div>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
             {ALL_CAMERAS.map(cam => (
               <button
                 key={cam.id}
                 disabled={!isAuthorized}
                 onClick={() => toggleCamera(cam.id)}
                 className={`
                   p-4 rounded-2xl border transition-all text-left flex flex-col justify-between h-24 group relative overflow-hidden active:scale-95
                   ${defaultCameraIds.includes(cam.id) 
                     ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-500/20' 
                     : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'}
                 `}
               >
                 <div className="relative z-10">
                    <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 transition-colors ${defaultCameraIds.includes(cam.id) ? 'text-indigo-200' : 'text-slate-500'}`}>SOURCE_{cam.id}</div>
                    <div className={`text-[10px] font-black uppercase leading-tight truncate ${defaultCameraIds.includes(cam.id) ? 'text-white' : 'text-slate-300'}`}>{cam.name}</div>
                 </div>
                 <div className={`text-[7px] font-black uppercase tracking-[0.3em] relative z-10 ${defaultCameraIds.includes(cam.id) ? 'text-white' : 'text-slate-600'}`}>
                   {defaultCameraIds.includes(cam.id) ? 'LIVE' : 'LINK'}
                 </div>
                 {defaultCameraIds.includes(cam.id) && (
                   <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)] z-20" />
                 )}
               </button>
             ))}
           </div>
        </section>
      </div>
      )}

      {/* ARCHIVE TAB */}
      {activeTab === 'archive' && (
      <div className="animate-in fade-in duration-500">
      {/* History Feed */}
      <section className="tactical-card p-12 space-y-10">
        <div className="flex items-center justify-between border-b border-white/5 pb-8">
          <h3 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-6 italic">
            <History className="w-8 h-8 text-indigo-500" />
            Operational <span className="text-indigo-500 not-italic">Archive</span>
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowBackupModal(true)}
              className="px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all hover:bg-indigo-500/20"
            >
              <HardDrive className="w-4 h-4 text-indigo-400" />
              Backup & Export (.json)
            </button>
            <button 
              onClick={loadHistory}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30">
                <Loader2 className={`w-4 h-4 text-indigo-400 ${loadingReports ? 'animate-spin' : ''}`} />
              </div>
              Vector Synchronization
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {archivedReports.length === 0 ? (
            <div className="col-span-full py-24 text-center text-slate-700 font-black uppercase tracking-[0.3em] text-xs border-2 border-dashed border-white/5 rounded-[3rem] bg-black/10">
               Archive database is currently empty
            </div>
          ) : (
            archivedReports.map((report, idx) => (
              <div key={report.id || idx} className="p-8 tactical-card bg-black/30 group hover:bg-indigo-500/[0.03] transition-all duration-500 relative overflow-hidden flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] italic mb-1">Sector Log</span>
                    <span className="text-sm font-black text-white uppercase">{report.shift} SHIFT</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Timecode</span>
                    <span className="text-[10px] font-mono text-slate-400">{report.date}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-base font-black text-white uppercase italic tracking-tight group-hover:text-indigo-400 transition-colors leading-snug">
                    {report.name}
                  </h4>
                  <div className="relative">
                    <p className="text-[11px] text-slate-500 line-clamp-4 uppercase tracking-tight font-medium leading-relaxed italic">
                      {report.plainReport}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                      <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Integrity Verified</span>
                   </div>
                   <button className="text-[8px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">
                      Full Decrypt →
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      </div>
      )}
      </div>

      {/* Personnel Modal */}
      <AnimatePresence>
        {showPersonnelModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              onClick={() => setShowPersonnelModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-effect bg-bg-surface/90 rounded-[2.5rem] border border-white/10 p-10 space-y-8 shadow-2xl transition-colors duration-500"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <User className="w-6 h-6 text-indigo-400" />
                  {editingPerson ? 'Edit Personnel' : 'New Personnel'}
                </h3>
                <button onClick={() => setShowPersonnelModal(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Full Name</label>
                  <input 
                    type="text" 
                    value={personForm.name}
                    onChange={e => setPersonForm({...personForm, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Shift Assignment</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['A', 'B', 'C', 'D', 'Other'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setPersonForm({...personForm, shift: s as any})}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${personForm.shift === s ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={personForm.phone}
                      onChange={e => setPersonForm({...personForm, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="864-XXX-XXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Linked Operator Node</label>
                  <select 
                    value={personForm.username || ''}
                    onChange={e => setPersonForm({...personForm, username: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                  >
                    <option value="">-- UNLINKED --</option>
                    {terminalUsers.map(u => (
                      <option key={u.username} value={u.username}>{(u.username || '').toUpperCase()} ({(u.role || '').toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Certifications</label>
                    <button 
                      onClick={() => setPersonForm({...personForm, certifications: [...personForm.certifications, {id: crypto.randomUUID(), name: '', expirationDate: '', required: false}]})}
                      className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg uppercase font-bold tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Cert
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 scrollbar-thin">
                    {personForm.certifications.map((cert, index) => (
                      <div key={cert.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 relative group">
                        <button 
                          onClick={() => {
                            const newCerts = [...personForm.certifications];
                            newCerts.splice(index, 1);
                            setPersonForm({...personForm, certifications: newCerts});
                          }}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <input 
                          type="text" 
                          value={cert.name}
                          onChange={e => {
                            const newCerts = [...personForm.certifications];
                            newCerts[index].name = e.target.value;
                            setPersonForm({...personForm, certifications: newCerts});
                          }}
                          className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Cert Name (e.g. CPR)"
                        />
                        <div className="flex items-center gap-2">
                          <input 
                            type="date" 
                            value={cert.expirationDate}
                            onChange={e => {
                              const newCerts = [...personForm.certifications];
                              newCerts[index].expirationDate = e.target.value;
                              setPersonForm({...personForm, certifications: newCerts});
                            }}
                            className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                          />
                          <label className="flex items-center gap-2 cursor-pointer bg-black/40 px-4 py-3 rounded-xl border border-white/5">
                            <input 
                              type="checkbox" 
                              checked={cert.required}
                              onChange={e => {
                                const newCerts = [...personForm.certifications];
                                newCerts[index].required = e.target.checked;
                                setPersonForm({...personForm, certifications: newCerts});
                              }}
                              className="w-4 h-4 accent-indigo-500 rounded bg-white/5 border-white/10"
                            />
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Required</span>
                          </label>
                        </div>
                      </div>
                    ))}
                    {personForm.certifications.length === 0 && (
                      <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No Certifications</span>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={savePersonnel}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  {editingPerson ? 'Update Member' : 'Enlist Personnel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terminal User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-3xl"
              onClick={() => setShowUserModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm tactical-card bg-black border-indigo-500/30 p-10 space-y-10 shadow-[0_0_80px_rgba(99,102,241,0.2)]"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Create <span className="text-indigo-400 not-italic">Node</span></h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Initialize access credentials</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Operator ID</label>
                  <input 
                    type="text" 
                    value={userForm.username}
                    onChange={e => setUserForm({...userForm, username: e.target.value})}
                    placeholder="USERNAME"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Security Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['dispatcher', 'admin'].map(r => (
                      <button 
                        key={r}
                        onClick={() => setUserForm({...userForm, role: r as any})}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${userForm.role === r ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                   onClick={createTerminalUser}
                   className="w-full py-5 bg-indigo-500 text-white font-black uppercase tracking-widest italic rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs"
                >
                  Confirm Registration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[400] px-6 py-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-4 shadow-2xl"
          >
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-white">{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; }
        .glass-effect { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}} />

      {/* Backup & Export Modal */}
      <BackupControlModal 
        isOpen={showBackupModal} 
        onClose={() => setShowBackupModal(false)} 
        onRefreshData={loadHistory} 
      />

      {/* Zulu Unit Add / Edit Modal */}
      <AnimatePresence>
        {showZuluModal && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1118] border border-white/10 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">
                      {editingZuluIndex !== null ? 'Edit Zulu Unit' : 'Add Zulu Unit'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      Configure Unit Callsign / Name
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowZuluModal(false)}
                  className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Unit Callsign & Name
                </label>
                <input 
                  type="text"
                  value={zuluFormInput}
                  onChange={(e) => setZuluFormInput(e.target.value)}
                  placeholder="e.g. ZULU-1 - G. SHORE"
                  autoFocus
                  className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white uppercase outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && zuluFormInput.trim()) {
                      const newList = [...zuluList];
                      if (editingZuluIndex !== null) {
                        newList[editingZuluIndex] = zuluFormInput.trim();
                      } else {
                        newList.push(zuluFormInput.trim());
                      }
                      setZuluList(newList);
                      updateGlobalSettings({ zuluOptions: newList });
                      setShowZuluModal(false);
                      setShowToast(editingZuluIndex !== null ? "ZULU UNIT UPDATED" : "ZULU UNIT ADDED");
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowZuluModal(false)}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!zuluFormInput.trim()}
                  onClick={() => {
                    if (!zuluFormInput.trim()) return;
                    const newList = [...zuluList];
                    if (editingZuluIndex !== null) {
                      newList[editingZuluIndex] = zuluFormInput.trim();
                    } else {
                      newList.push(zuluFormInput.trim());
                    }
                    setZuluList(newList);
                    updateGlobalSettings({ zuluOptions: newList });
                    setShowZuluModal(false);
                    setShowToast(editingZuluIndex !== null ? "ZULU UNIT UPDATED" : "ZULU UNIT ADDED");
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Unit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminPage;
