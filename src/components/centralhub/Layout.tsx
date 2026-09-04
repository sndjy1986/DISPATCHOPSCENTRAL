import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useTerminal } from '../../context/TerminalContext';
import { EmergencyBackground } from './EmergencyBackground';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signIn, googleProvider } from '../../lib/firebase';
import { Shield, AlertTriangle, Info, Bell, AlertCircle, CheckCircle, X as CloseIcon, ExternalLink, Maximize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { emergencyLevel, notifications, removeNotification, appTheme, appBackgroundImage } = useTerminal();
  const [user, setUser] = useState<any>(auth.currentUser);
  const [authError, setAuthError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUser(u));
  }, []);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await signIn();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError(`Domain not authorized: ${window.location.hostname}. Please add it to your Firebase Console.`);
      } else {
        setAuthError(err.message);
      }
    }
  };

  const searchParams = new URLSearchParams(location.search);
  const isShiftReportStandalone = 
    location.pathname === '/single-shift-report' || 
    location.pathname === '/shift-report/standalone';
  const isStandalone = 
    isShiftReportStandalone || 
    searchParams.get('standalone') === 'true' ||
    searchParams.get('standalone') === '1' ||
    new URLSearchParams(window.location.search).get('standalone') === 'true' ||
    new URLSearchParams(window.location.search).get('standalone') === '1';

  const NOAA_GOES19_GEOCOLOR_URL = 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/10848x10848.jpg';
  const [standaloneSatelliteBg, setStandaloneSatelliteBg] = useState<string>(
    `${NOAA_GOES19_GEOCOLOR_URL}?t=${Date.now()}`
  );

  // Auto-refresh NOAA GOES-19 satellite image every 1 hour
  useEffect(() => {
    if (!isShiftReportStandalone) return;

    const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

    const fetchLatestSatelliteImage = () => {
      const timestamp = Date.now();
      const freshUrl = `${NOAA_GOES19_GEOCOLOR_URL}?t=${timestamp}`;

      const img = new Image();
      img.src = freshUrl;
      img.onload = () => {
        setStandaloneSatelliteBg(freshUrl);
      };
    };

    const intervalId = setInterval(fetchLatestSatelliteImage, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isShiftReportStandalone]);

  const activeBackgroundImage = isShiftReportStandalone 
    ? (appBackgroundImage || standaloneSatelliteBg) 
    : appBackgroundImage;

  const handlePopOutCurrentPage = () => {
    const baseUrl = window.location.href.split('#')[0];
    const hashRoute = location.pathname;
    const currentParams = new URLSearchParams(location.search);
    currentParams.set('standalone', 'true');
    const popoutUrl = `${baseUrl}#${hashRoute}?${currentParams.toString()}`;
    const pageTitle = hashRoute.replace(/[^a-zA-Z0-9]/g, '_') || 'Dashboard';
    window.open(
      popoutUrl,
      `Popout_${pageTitle}`,
      'width=1450,height=920,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
    );
  };

  const handleOpenFullApp = () => {
    const baseUrl = window.location.href.split('#')[0];
    const hashRoute = location.pathname;
    const currentParams = new URLSearchParams(location.search);
    currentParams.delete('standalone');
    const paramStr = currentParams.toString();
    const targetUrl = `${baseUrl}#${hashRoute}${paramStr ? `?${paramStr}` : ''}`;
    window.open(targetUrl, '_blank');
  };

  return (
    <div className="h-screen bg-brand-bg text-text-main relative overflow-hidden font-sans transition-colors duration-500" data-theme={appTheme}>
      {/* Background Image: Permanent on Standalone, configurable on standard */}
      {activeBackgroundImage && (
        <>
          <div 
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-opacity duration-1000"
            style={{ backgroundImage: `url(${activeBackgroundImage})` }}
          />
          {/* Subtle overlay to ensure UI elements remain legible */}
          <div className="fixed inset-0 z-0 bg-brand-bg/50 backdrop-blur-[2px] pointer-events-none" />
        </>
      )}

      {/* Subtle Ambient Depth Lighting */}
      <div className="fixed top-[-10%] left-[-10%] w-[400px] h-[400px] bg-brand-indigo/10 rounded-full blur-[100px] pointer-events-none transition-colors duration-500 z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-emerald/05 rounded-full blur-[120px] pointer-events-none transition-colors duration-500 z-0" />

      <EmergencyBackground />
      
      {!isStandalone && <Sidebar />}

      {/* Standalone Window Indicator & Controls OR Floating Pop-Out Button */}
      {isStandalone ? (
        <aside aria-label="Standalone Window Controls" className="fixed top-3 right-5 z-[150] flex items-center gap-2 bg-slate-950/85 border border-emerald-500/30 backdrop-blur-xl px-3 py-1.5 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 pr-2.5 border-r border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
              Independent Window
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenFullApp}
            title="Open Main Terminal (with Sidebar)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-blue-500/20 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-transparent hover:border-blue-400/30"
          >
            <Maximize2 className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Main Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            title="Close this window"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer border border-transparent hover:border-rose-500/30"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </aside>
      ) : (
        <button
          type="button"
          onClick={handlePopOutCurrentPage}
          title="Pop out this page into an independent window without sidebar"
          className="fixed top-3 right-6 z-40 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/75 hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-blue-400/20 hover:border-blue-400/50 backdrop-blur-xl shadow-lg transition-all duration-200 text-[10px] font-black uppercase tracking-widest group cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Pop Out Window</span>
        </button>
      )}

      <main className={`${isStandalone ? 'w-full pl-0' : 'pl-64'} h-full overflow-y-auto relative z-10 custom-scrollbar`}>
          {/* Global Notification Toast Manager */}
          <div className="fixed top-14 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
              {notifications.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  className="pointer-events-auto"
                >
                  <div className={`
                    flex items-center gap-4 p-5 rounded-2xl border backdrop-blur-2xl shadow-2xl min-w-[320px] max-w-[400px]
                    ${note.type === 'error' ? 'bg-rose-500/10 border-rose-500/20' : 
                      note.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                      note.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      'bg-brand-panel/80 border-white/10'}
                  `}>
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      ${note.type === 'error' ? 'bg-rose-500/20 text-rose-500' : 
                        note.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                        note.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                        'bg-indigo-500/20 text-indigo-400'}
                    `}>
                      {note.type === 'error' && <AlertCircle className="w-5 h-5" />}
                      {note.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                      {note.type === 'success' && <CheckCircle className="w-5 h-5" />}
                      {note.type === 'info' && <Bell className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-0.5">
                        {note.type === 'info' ? 'System Notification' : `AI ${note.type.toUpperCase()} ALERT`}
                      </p>
                      <p className={`text-sm font-bold selection:bg-indigo-500/30 leading-snug ${note.type === 'info' ? 'text-text-main' : 'text-white'}`}>
                        {note.message}
                      </p>
                    </div>

                    <button 
                      onClick={() => removeNotification(note.id)}
                      className="p-1 hover:bg-white/5 rounded-lg text-text-dim hover:text-text-main transition-all"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
  );
}
// sync

