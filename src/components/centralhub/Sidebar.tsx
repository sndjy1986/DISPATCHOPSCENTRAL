import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Terminal, 
  Map as MapIcon, 
  Camera, 
  FileText,
  AlertTriangle,
  Zap,
  Radio,
  Siren,
  Settings2,
  Table,
  Lock,
  UserCheck,
  Clock as ClockIcon,
  Phone,
  Calendar,
  CreditCard,
  LogOut,
  ExternalLink,
  Link as LinkIcon,
  Timer,
  Hash,
  Shield,
  BookOpen,
  ArrowRightLeft,
  Bell,
  FileSpreadsheet,
  Maximize2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useTerminal } from '../../context/TerminalContext';
import { onSnapshot, doc, db } from '../../lib/firebase';
import type { SidebarLink as SidebarLinkType } from '../../lib/firebase';
import { Modal } from './Modal';
import { AugustSheetModal } from './AugustSheetModal';
import { ThemeSelectorButton } from './ThemeSelector';

const iconMap: Record<string, any> = {
  LayoutDashboard, Activity, Terminal, MapIcon, Camera, FileText, 
  AlertTriangle, Zap, Radio, Siren, Settings2, Table, Lock, 
  UserCheck, ClockIcon, Phone, Calendar, CreditCard, ExternalLink, LinkIcon, Timer,
  Hash, Shield, BookOpen, ArrowRightLeft
};

const CORE_COMMANDS = [
  { icon: 'LayoutDashboard', label: 'Start Page', path: '/', id: 'start' },
  { icon: 'Activity', label: 'Tone Test', path: '/tone-test', id: 'tone' },
  { icon: 'Terminal', label: 'Unit Posting', path: '/unit-posting', id: 'unit' },
  { icon: 'FileText', label: 'Shift Report', path: '/shift-report', id: 'report' },
  { icon: 'Camera', label: 'Cameras', path: '/cameras', id: 'cams' },
];

const TOOLS_LINKS = [
  { icon: 'Timer', label: 'Timers', path: '/timers', id: 'timers' },
  { icon: 'Hash', label: 'Codes Reference', path: '/codes', id: 'codes' },
  { icon: 'BookOpen', label: 'Guidelines', path: '/guidelines', id: 'guidelines' },
  { icon: 'MapIcon', label: 'Distance Tracker', path: '/distance-map', id: 'dist' },
  { icon: 'MapIcon', label: 'Helo Tracker', path: 'https://helotracker.pages.dev/', external: true, id: 'helotracker' },
];

const PORTAL_LINKS = [
  { icon: 'ClockIcon', label: 'Time Clock', path: '/time-clock', id: 'clock' },
  { icon: 'Phone', label: 'Directory', path: '/directory', id: 'dir' },
  { icon: 'Shield', label: 'Vanguard', path: 'https://vanguard.vlitech.com/', external: true, id: 'vanguard' },
  { icon: 'LinkIcon', label: 'ESO Portal', path: 'https://scheduling.esosuite.net/', external: true, id: 'eso' },
  { icon: 'Calendar', label: 'Coroner Schedule', path: 'https://drive.google.com/file/d/137BOp88NqFXFuoYJ-VBIR0n-xGfOq4_U/view?usp=drive_link', external: true, id: 'coroner' },
  { icon: 'Table', label: 'Daily Worksheet', path: 'https://docs.google.com/spreadsheets/d/1-4Uwh00g4orCaOQoOrLIcRkamAhdxrBNhVVOt2IEOoY/edit?gid=534085027#gid=534085027', external: true, id: 'worksheet' },
  { icon: 'Table', label: 'AVL Cleanup Tool', path: 'https://docs.google.com/spreadsheets/d/12V94dal4UvVJcsRMBd3fCj49pJjiOXFMTgZa1tdaEE0/edit?gid=1621560398#gid=1621560398', external: true, id: 'avl_cleanup' },
  { icon: 'CreditCard', label: 'PayCom Online', path: 'https://www.paycomonline.net/v4/ee/web.php/app/login', external: true, id: 'paycom' },
  { icon: 'Siren', label: 'Helicopter', path: 'https://andersoncounty911_sc.transport.net/#/login', external: true, id: 'helo' },
];

export function Sidebar() {
  const [customLinks, setCustomLinks] = React.useState<SidebarLinkType[]>([]);
  const { 
    manualEmergencyMode, 
    setManualEmergencyMode, 
    emergencyOpacity, 
    setEmergencyOpacity,
    terminalUser,
    logoutTerminalUser,
    loginTerminalUser,
    firebaseUser,
    appTheme,
    appBackgroundImage
  } = useTerminal();

  const [isToolsOpen, setIsToolsOpen] = React.useState(false);
  const [isSysLinkOpen, setIsSysLinkOpen] = React.useState(false);
  const [isAugustSheetOpen, setIsAugustSheetOpen] = React.useState(false);
  const [passcode, setPasscode] = React.useState('');
  const [authStatus, setAuthStatus] = React.useState('');

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (s) => {
      if (s.exists()) {
        const data = s.data();
        if (data.sidebarLinks) {
          setCustomLinks(data.sidebarLinks);
        }
      }
    });
    return () => unsub();
  }, []);

  const bouncyProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 10 } as const
  };

  const activeCoreCommands = React.useMemo(() => {
    if (customLinks && customLinks.length > 0) {
      return customLinks.filter(l => !l.external);
    }
    return CORE_COMMANDS;
  }, [customLinks]);

  const activePortalLinks = React.useMemo(() => {
    if (customLinks && customLinks.length > 0) {
      return customLinks.filter(l => l.external);
    }
    return PORTAL_LINKS;
  }, [customLinks]);

  return (
    <aside 
      className={cn(
        "w-64 h-screen border-r border-blue-400/20 flex flex-col fixed left-0 top-0 z-50 transition-colors duration-500 overflow-hidden",
        "bg-slate-950/45 backdrop-blur-2xl shadow-[8px_0_32px_0_rgba(0,0,0,0.4)]"
      )}
      data-theme={appTheme}
    >
      {/* Dynamic Transparent Blue Glass Tint & Ambient Specular Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-blue-950/35 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.22),transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-blue-400/40 via-blue-400/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent pointer-events-none" />
      
      <div className="p-8 relative flex-shrink-0">
        <motion.div 
          className="flex items-center gap-3 mb-4 group cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 } as const}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/50 transition-all duration-500 border border-blue-400/30",
            appTheme === 'midnight' ? 'bg-blue-600/90' : 'bg-indigo-600/90'
          )} style={{ backgroundColor: 'var(--header-logo-color)' }}>D</div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-[0.2em] text-text-main uppercase leading-none drop-shadow-sm">Dispatch</span>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mt-1 drop-shadow-sm" style={{ color: 'var(--brand-accent)' }}>Terminal</span>
          </div>
        </motion.div>
      </div>
      
      <nav className="flex-1 min-h-0 px-4 py-2 relative flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col justify-between pr-1">
          <div className="space-y-4">
            {/* Core Commands Section */}
            <div>
              <div className="px-4 mb-2 flex items-center gap-2">
                <div className="w-1 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">Core Command</span>
              </div>
              <div className="space-y-0.5">
                {activeCoreCommands.filter((item) => {
                  if (item.id === 'report') {
                    return terminalUser?.role?.toLowerCase() !== 'dispatcher';
                  }
                  return true;
                }).map((item) => {
                  const IconComponent = iconMap[item.icon] || LinkIcon;
                  return (
                    <motion.div key={item.path} {...bouncyProps}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 group relative
                            ${isActive ? 'text-text-main font-black' : 'text-text-dim hover:text-text-main hover:bg-blue-500/10'}
                        `}
                      >
                        {({ isActive }) => (
                          <>
                            <IconComponent className={cn("w-4 h-4 flex-shrink-0 transition-colors relative z-10", isActive ? "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "group-hover:text-blue-300")} />
                            <span className="text-[11px] font-black uppercase tracking-widest relative z-10">{item.label}</span>
                            {isActive && (
                              <motion.div 
                                layoutId="nav-active"
                                className="absolute inset-0 bg-blue-500/15 border border-blue-400/30 backdrop-blur-md rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_rgba(59,130,246,0.2)]"
                                initial={false}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 } as const}
                              />
                            )}
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Portal Links Section - Spaced much tighter ("Closer") */}
            <div className="pt-3 mt-4 border-t border-white/5">
              <div className="px-4 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Portal Links</span>
                </div>
              </div>

              {/* Shift Sheet Pop-Out Quick Button */}
              <motion.button
                type="button"
                onClick={() => setIsAugustSheetOpen(true)}
                {...bouncyProps}
                className="w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all duration-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 backdrop-blur-md text-emerald-200 font-bold group relative my-1.5 shadow-md shadow-emerald-950/40"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">Shift Sheet</span>
                    <span className="text-[8px] font-black uppercase text-emerald-400/80 tracking-widest">A / B / C / D Shifts</span>
                  </div>
                </div>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
              </motion.button>

              <div className="space-y-0.5">
                {activePortalLinks.map((item) => {
                  const IconComponent = iconMap[item.icon] || LinkIcon;
                  return (
                    <motion.a
                      key={item.path}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...bouncyProps}
                      className="flex items-center gap-3 px-4 py-1.5 rounded-xl transition-all duration-200 text-text-dim hover:bg-blue-500/10 hover:text-text-main border border-transparent hover:border-blue-400/10 group relative"
                    >
                      <IconComponent className="w-4 h-4 flex-shrink-0 group-hover:text-emerald-400 transition-colors" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tools Trigger - Moved to bottom of the scrollable container */}
          <div className="pt-4 mt-auto border-t border-white/5 relative">
            <div 
              className="relative"
              onMouseEnter={() => setIsToolsOpen(true)}
              onMouseLeave={() => setIsToolsOpen(false)}
            >
              <button 
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={cn(
                  "flex items-center justify-between w-full gap-3 px-4 py-2 rounded-xl transition-all duration-300 group relative",
                  isToolsOpen ? 'text-text-main font-black bg-blue-500/15 border border-blue-400/25 backdrop-blur-md' : 'text-text-dim hover:text-text-main hover:bg-blue-500/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings2 className={cn("w-4 h-4 flex-shrink-0 transition-colors", isToolsOpen ? "text-rose-400" : "group-hover:text-rose-300")} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Tools</span>
                </div>
                <motion.div
                  animate={{ rotate: isToolsOpen ? 90 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <ArrowRightLeft className="w-3 h-3 opacity-50" />
                </motion.div>
              </button>

              <motion.div
                initial={false}
                animate={isToolsOpen ? "open" : "closed"}
                variants={{
                  open: { 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    display: "block",
                    transition: { type: "spring", stiffness: 300, damping: 30 } 
                  },
                  closed: { 
                    opacity: 0, 
                    x: -10, 
                    scale: 0.95,
                    transitionEnd: { display: "none" } 
                  }
                }}
                className="fixed left-[240px] bottom-28 w-52 bg-slate-900/80 border border-blue-400/25 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-2 z-[100] backdrop-blur-2xl bg-gradient-to-b from-blue-950/50 to-slate-950/85"
              >
                {/* Visual Bridge */}
                <div className="absolute -left-10 top-0 bottom-0 w-10" />
                
                <div className="px-3 py-2 mb-2 border-b border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-400">Resource Matrix</span>
                </div>
                
                <div className="space-y-0.5">
                  {TOOLS_LINKS.map((item) => {
                    const IconComponent = iconMap[item.icon] || LinkIcon;
                    if (item.external) {
                      return (
                        <a
                          key={item.path}
                          href={item.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsToolsOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/item text-text-dim hover:bg-blue-500/15 hover:text-text-main border border-transparent hover:border-blue-400/20"
                        >
                          <IconComponent className="w-3.5 h-3.5 group-hover/item:text-rose-300" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity" />
                        </a>
                      );
                    }
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsToolsOpen(false)}
                        className={({ isActive }) => cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/item",
                          isActive ? "bg-rose-500/15 text-rose-300 border border-rose-400/30 font-bold backdrop-blur-sm shadow-sm" : "text-text-dim hover:bg-blue-500/15 hover:text-text-main border border-transparent hover:border-blue-400/20"
                        )}
                      >
                        {({ isActive }) => (
                          <>
                            <IconComponent className={cn("w-3.5 h-3.5", isActive ? "text-rose-400" : "group-hover/item:text-rose-300")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </nav>

      <div className="px-4 py-6 space-y-4 relative">
        <div className="px-4">
          <button 
            type="button"
            onClick={() => {
              setIsSysLinkOpen(true);
              setAuthStatus('');
            }}
            className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 cursor-pointer w-full group"
          >
            <LinkIcon className="w-3 h-3 group-hover:scale-110 transition-transform" />
            System Link
          </button>
        </div>


        {/* User Profile & Admin Access */}
        <div className="flex flex-col gap-2">
          <motion.div 
            {...bouncyProps}
            onClick={() => {
              setIsSysLinkOpen(true);
              setAuthStatus('');
            }}
            className="flex items-center justify-between px-4 py-3 bg-blue-950/30 border border-blue-400/20 backdrop-blur-xl rounded-2xl group shadow-inner cursor-pointer hover:border-blue-400/40 hover:bg-blue-900/35 transition-all"
          >
             <div className="flex items-center gap-3 min-w-0">
               <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center border border-blue-400/30 group-hover:border-blue-400/60 transition-all shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                  <UserCheck className="w-4 h-4 text-blue-400" />
               </div>
               <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-main truncate">
                    {terminalUser?.username || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Dispatcher'}
                  </span>
                  <span className="text-[8px] font-bold text-blue-300/80 truncate leading-none mt-1 uppercase">
                    {terminalUser?.role || (firebaseUser ? 'Root Admin' : 'Operator')}
                  </span>
               </div>
             </div>
             <button 
              onClick={async (e) => {
                e.stopPropagation();
                if (window.confirm("TERMINATE SESSION?")) {
                  logoutTerminalUser();
                  if (firebaseUser) {
                    const { auth } = await import('../../lib/firebase');
                    await auth.signOut();
                  }
                }
              }}
              className="p-2 text-text-dim hover:text-rose-400 transition-colors"
              title="Terminate Session"
             >
               <LogOut size={14} />
             </button>
          </motion.div>

          {/* Admin Message Link */}
          {(terminalUser?.role === 'admin' || terminalUser?.role === 'root' || firebaseUser) && (
            <motion.div {...bouncyProps}>
              <Link 
                to="/admin/send-message"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-text-dim hover:text-emerald-400 transition-all border border-transparent hover:bg-emerald-500/10 hover:border-emerald-500/20 group w-full"
              >
                <Bell className="w-4 h-4 group-hover:scale-110 transition-transform text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Admin Message</span>
              </Link>
            </motion.div>
          )}

          <motion.div {...bouncyProps}>
            <ThemeSelectorButton variant="sidebar" />
          </motion.div>

          <motion.div {...bouncyProps}>
            <Link 
              to="/admin/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-text-dim hover:text-blue-400 transition-all border border-transparent hover:bg-blue-500/10 hover:border-blue-400/20 group w-full"
            >
              <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Matrix Auth</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* SYSTEM LINK GOOGLE AUTHENTICATION MODAL */}
      <Modal 
        isOpen={isSysLinkOpen} 
        onClose={() => setIsSysLinkOpen(false)} 
        title="SYSTEM OVERRIDES & GOOGLE LINK"
        icon={<Shield className="w-5 h-5 text-indigo-400" />}
        maxWidth="max-w-md"
      >
        <div className="space-y-6 text-slate-300">
          <div className="p-5 rounded-2xl border border-white/5 bg-black/40 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block border-b border-white/5 pb-2">Active Session Context</span>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Identity node</span>
                <span className="font-extrabold text-white uppercase">{terminalUser?.username || 'GUEST OPERATOR'}</span>
              </div>
              <div>
                <span className="block text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Clearance level</span>
                <span className="font-extrabold text-white uppercase">{terminalUser?.role || 'GUEST / OPERATOR'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block border-b border-white/5 pb-2">Google Cloud Sync</span>
            
            {firebaseUser ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs flex flex-col gap-1">
                  <span className="font-bold text-white">LINKED GOOGLE ACCOUNT:</span>
                  <span className="font-mono text-[11px] text-zinc-400">{firebaseUser.email}</span>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mt-2">Personalized settings, custom theme selections, and configurations are synced in the cloud.</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const { auth } = await import('../../lib/firebase');
                    await auth.signOut();
                    setAuthStatus('SUCCESS: Google Link dissociated.');
                  }}
                  className="w-full py-3 rounded-xl border border-rose-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  Unlink Google Account
                </button>
              </div>
            ) : (
              <div className="space-y-3 font-semibold">
                <p className="text-zinc-400 font-semibold leading-relaxed uppercase text-[10px]">
                  Link this terminal interface with your personal Google credentials to store your custom layout settings and theme overrides permanently.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const { signInWithPopup, GoogleAuthProvider, auth } = await import('../../lib/firebase');
                    try {
                      await signInWithPopup(auth, new GoogleAuthProvider());
                      setAuthStatus('SUCCESS: Google authentication logged.');
                    } catch (err: any) {
                      setAuthStatus(`ERROR: ${err.message || 'Authentication rejected'}`);
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
                >
                  <Shield size={14} />
                  Link Google Console Profile
                </button>
              </div>
            )}
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const clean = passcode.trim();
            const normalizedUsername = clean.toLowerCase();

            // Built-in root fallbacks
            if (clean === 'Russell1') {
              loginTerminalUser('sndjy', 'root');
              setAuthStatus('SUCCESS: Root admin override authorized.');
              setPasscode('');
              setTimeout(() => { setIsSysLinkOpen(false); setAuthStatus(''); }, 1000);
              return;
            } else if (clean.toLowerCase() === 'lead123') {
              loginTerminalUser('Shift Lead', 'shift_lead');
              setAuthStatus('SUCCESS: Shift Lead override authorized.');
              setPasscode('');
              setTimeout(() => { setIsSysLinkOpen(false); setAuthStatus(''); }, 1000);
              return;
            } else if (clean.toLowerCase() === 'williams' || clean === 'Williams911') {
              loginTerminalUser('G. Williams', 'shift_lead');
              setAuthStatus('SUCCESS: Shift Lead override authorized.');
              setPasscode('');
              setTimeout(() => { setIsSysLinkOpen(false); setAuthStatus(''); }, 1000);
              return;
            }

            try {
              const { getDoc } = await import('firebase/firestore');
              const globalDoc = await getDoc(doc(db, 'settings', 'global'));
              let accessGranted = false;
              let userRole = 'personnel';
              let terminalUsername = normalizedUsername;

              if (globalDoc.exists()) {
                const personnel = globalDoc.data().personnel || [];
                const person = personnel.find((p: any) => 
                  (p.username || '').toLowerCase().trim() === normalizedUsername || 
                  p.name.toLowerCase().trim() === normalizedUsername
                );
                
                if (person) {
                  accessGranted = true;
                  terminalUsername = person.username || person.name;
                  
                  const SHIFT_LEADS = [
                    'corrine skelly', 'cskel',
                    'erin brandenburg', 'ebrand',
                    'joseph sanders', 'joey sanders', 'jsand',
                    'crystal culbertson', 'cculb',
                    'g. williams', 'geneva williams', 'shift lead'
                  ];
                  const isLead = SHIFT_LEADS.includes(person.name.toLowerCase().trim()) || 
                                 (person.username && SHIFT_LEADS.includes(person.username.toLowerCase().trim()));
                  
                  userRole = isLead ? 'shift_lead' : 'dispatcher';
                }
              }

              // Special fallback case for shift leads just in case
              if (!accessGranted && ['shift lead', 'g. williams'].includes(normalizedUsername)) {
                 accessGranted = true;
                 userRole = 'shift_lead';
                 terminalUsername = normalizedUsername;
              }
              
              if (!accessGranted && normalizedUsername === 'msenn') {
                 accessGranted = true;
                 userRole = 'dispatcher';
                 terminalUsername = 'msenn';
              }

              if (accessGranted) {
                loginTerminalUser(terminalUsername, userRole);
                setAuthStatus('SUCCESS: Node override authorized via directory.');
                setPasscode('');
                setTimeout(() => {
                  setIsSysLinkOpen(false);
                  setAuthStatus('');
                }, 1000);
              } else {
                setAuthStatus('ERROR: Access Denied.');
              }
            } catch (err) {
              console.error("Sidebar passcode error:", err);
              setAuthStatus('ERROR: Validation failed.');
            }
          }} className="space-y-3 pt-4 border-t border-white/5 font-semibold">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#f0af45] block border-b border-white/5 pb-2">Node Passcode Bypass</span>
            <div className="space-y-2">
              <input 
                type="password"
                placeholder="ENTER BYPASS GATEWAY PASSCODE..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full h-11 bg-black/40 border border-white/5 rounded-xl text-center text-text-main font-mono text-xs tracking-widest focus:border-indigo-500/50 outline-none transition-all placeholder:text-text-dim/20"
              />
              <button 
                type="submit"
                className="w-full py-2.5 rounded-xl border border-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:border-white hover:text-white transition-all bg-white/[0.02]"
              >
                Apply Local Authorization Override
              </button>
            </div>
          </form>

          {authStatus && (
            <div className={`p-4 rounded-xl text-xs font-bold text-center border uppercase tracking-wider ${authStatus.startsWith('SUCCESS') ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-rose-500/5 border-rose-500/10 text-rose-500'}`}>
              {authStatus}
            </div>
          )}
        </div>
      </Modal>

      <AugustSheetModal 
        isOpen={isAugustSheetOpen} 
        onClose={() => setIsAugustSheetOpen(false)} 
      />
    </aside>
  );
}
// sync
