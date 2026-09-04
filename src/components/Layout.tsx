import { ReactNode } from 'react';
import { useAuthRole as useRole } from '../hooks/useAuthRole';
import { auth, signIn, logOut } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  LogIn,
  Shield,
  Truck,
  ExternalLink,
  Menu,
  X,
  FileText,
  Map as MapIcon,
  Terminal,
  Camera
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import EmergencyBackground from './EmergencyBackground';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AppSettings } from '../types';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { role, isAdmin, isEditor } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (!unsub) {
          unsub = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
            if (snapshot.exists()) {
              setSettings({ id: snapshot.id, ...snapshot.data() } as AppSettings);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'settings/global');
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

  const updateOpacity = async (val: number) => {
    if (!isEditor) return;
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        emergencyBackgroundOpacity: val * 100,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  const navItems = [
    { label: 'Unit Log', icon: LayoutDashboard, path: '/' },
    { label: 'Command Console', icon: Terminal, path: '/console' },
    { label: 'Shift Report', icon: FileText, path: '/reports' },
    { label: 'Distance Map', icon: MapIcon, path: '/map' },
    { label: 'DOT Cameras', icon: Camera, path: '/cameras' },
  ];

  const resourceLinks = [
    { label: 'Report', url: 'https://report.sndjy.us/' },
    { label: 'Distance Map', url: 'https://work.sndjy.us/map' },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin', icon: Shield, path: '/admin' });
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col relative overflow-hidden">
      <EmergencyBackground />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <div className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
              {children}
            </div>
          </div>
          
          <footer className="h-10 bg-bg-surface border-t border-border-subtle px-6 flex items-center justify-between text-[10px] text-text-muted uppercase tracking-widest sticky bottom-0 z-10 w-full backdrop-blur-md bg-opacity-80">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                Charlie-Net Status: Nominal
              </span>
              
              <div className="h-4 w-px bg-border-subtle" />

              {/* Global Light Intensity Control - Moved from Header */}
              <div className="flex items-center gap-3">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">Lights</label>
                <input 
                  type="range" 
                  min="0.01" 
                  max="0.6" 
                  step="0.01"
                  value={(settings?.emergencyBackgroundOpacity ?? 15) / 100}
                  onChange={(e) => updateOpacity(parseFloat(e.target.value))}
                  disabled={!isEditor}
                  className="w-20 h-1 bg-[#1A1D23] rounded-lg appearance-none cursor-pointer accent-brand-blue disabled:opacity-30"
                />
                <span className="text-[9px] font-mono text-brand-blue w-6">{Math.round((settings?.emergencyBackgroundOpacity ?? 15))}%</span>
              </div>
            </div>

            <nav className="flex items-center gap-4">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "px-2 py-1 rounded transition-all duration-200 hover:text-white",
                    location.pathname === item.path ? "text-brand-blue font-black" : "text-text-secondary"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              {auth.currentUser && (
                <div className="flex items-center gap-3">
                  <span className="opacity-50 lowercase">{auth.currentUser.email}</span>
                  <button
                    onClick={() => logOut()}
                    className="hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="h-4 w-px bg-border-subtle" />
              <span className="text-brand-blue font-bold tracking-[0.2em]">SNDJY Dispatch V3.0</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
// synchronized
