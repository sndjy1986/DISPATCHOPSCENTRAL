import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, auth } from '../../lib/firebase';
import EmergencyBackground from '../EmergencyBackground';
import { motion, AnimatePresence } from 'motion/react';

interface SystemSettings {
  emergencyBackgroundOpacity: number;
  ambienceMode: 'slate-glow' | 'emergency';
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    emergencyBackgroundOpacity: 60,
    ambienceMode: 'slate-glow'
  });

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (!unsub) {
          unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
            if (docSnap.exists()) {
              setSettings(docSnap.data() as SystemSettings);
            } else {
              // Initialize default settings if not exists
              const globalSettingsRef = doc(db, 'settings', 'global');
              setDoc(globalSettingsRef, {
                emergencyBackgroundOpacity: 60,
                ambienceMode: 'slate-glow'
              }).catch(err => handleFirestoreError(err, 'write', 'settings/global'));
            }
          }, (err) => {
            handleFirestoreError(err, 'get', 'settings/global');
          });
        }
      } else {
        if (unsub) {
          unsub();
          unsub = null;
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsub) unsub();
    };
  }, []);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-bg-slate text-slate-300 font-sans select-none">
      {/* GLOBAL BACKGROUND LAYER */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <AnimatePresence mode="wait">
          {settings.ambienceMode === 'slate-glow' ? (
            <motion.div
              key="slate-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <div 
                className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px]" 
                style={{ opacity: settings.emergencyBackgroundOpacity / 100 }}
              />
              <div 
                className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px]" 
                style={{ opacity: settings.emergencyBackgroundOpacity / 100 }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="emergency-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <EmergencyBackground opacity={settings.emergencyBackgroundOpacity} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
// sync;
