import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useTerminal } from '../../context/TerminalContext';
import { EmergencyBackground } from './EmergencyBackground';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signIn, googleProvider } from '../../lib/firebase';
import { Shield, AlertTriangle, Info, Bell, AlertCircle, CheckCircle, X as CloseIcon } from 'lucide-react';
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

  const isStandalone = 
    location.pathname === '/single-shift-report' || 
    location.pathname === '/shift-report/standalone' ||
    new URLSearchParams(location.search).get('standalone') === 'true';

  const NOAA_GOES19_GEOCOLOR_URL = 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/10848x10848.jpg';
  const [standaloneSatelliteBg, setStandaloneSatelliteBg] = useState<string>(
    `${NOAA_GOES19_GEOCOLOR_URL}?t=${Date.now()}`
  );

  // Auto-refresh NOAA GOES-19 satellite image every 1 hour
  useEffect(() => {
    if (!isStandalone) return;

    const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

    const fetchLatestSatelliteImage = () => {
      const timestamp = Date.now();
      const freshUrl = `${NOAA_GOES19_GEOCOLOR_URL}?t=${timestamp}`;

      // Preload the high-resolution satellite imagery before updating state to avoid flickering
      const img = new Image();
      img.src = freshUrl;
      img.onload = () => {
        setStandaloneSatelliteBg(freshUrl);
      };
    };

    const intervalId = setInterval(fetchLatestSatelliteImage, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isStandalone]);

  const activeBackgroundImage = isStandalone ? standaloneSatelliteBg : appBackgroundImage;

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
      <main className={`${isStandalone ? 'w-full pl-0' : 'pl-64'} h-full overflow-y-auto relative z-10 custom-scrollbar`}>
          {/* Global Notification Toast Manager */}
          <div className="fixed top-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
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

