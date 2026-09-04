import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera } from '../../lib/camsTypes';
import { ALL_CAMERAS } from '../../lib/camsConstants';
import { CameraPlayer } from './CameraPlayer';
import { RefreshCw, Activity } from 'lucide-react';
import { doc, onSnapshot, db } from '../../lib/firebase';
import { useTerminal } from '../../context/TerminalContext';

export const CameraGrid: React.FC = React.memo(() => {
  const { addNotification } = useTerminal();
  const [gridSize, setGridSize] = useState<4 | 6>(() => {
    const saved = localStorage.getItem('cameraGridSize');
    return saved === '6' ? 6 : 4;
  });

  React.useEffect(() => {
    localStorage.setItem('cameraGridSize', String(gridSize));
  }, [gridSize]);

  const [activeCameras, setActiveCameras] = useState<Camera[]>([]);
  const [globalAiEnabled, setGlobalAiEnabled] = useState(() => {
    return localStorage.getItem('globalAiEnabled') === 'true';
  });
  const [contextMenu, setContextMenu] = useState<{ camId: string, x: number, y: number, index: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, camId: string, index: number) => {
    e.preventDefault();
    setContextMenu({ camId, x: e.clientX, y: e.clientY, index });
  };

  React.useEffect(() => {
    localStorage.setItem('globalAiEnabled', String(globalAiEnabled));
  }, [globalAiEnabled]);

  // Sync with Firestore Global Settings for default cameras
  React.useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.defaultCameraIds && Array.isArray(data.defaultCameraIds)) {
          const cams = data.defaultCameraIds
            .map((id: string) => ALL_CAMERAS.find(c => c.id === id))
            .filter(Boolean) as Camera[];
          
          if (cams.length > 0) {
            const saved = localStorage.getItem('activeCameras');
            if (!saved) {
              setActiveCameras(cams);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Initial load from localStorage or hardcoded defaults
  React.useEffect(() => {
    const saved = localStorage.getItem('activeCameras');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveCameras(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved cameras', e);
      }
    }
    
    if (activeCameras.length === 0) {
      const defaultCamIds = ['cam2', 'cam3', 'cam6', 'cam9'];
      setActiveCameras(defaultCamIds.map(id => ALL_CAMERAS.find(c => c.id === id) || ALL_CAMERAS[0]));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('activeCameras', JSON.stringify(activeCameras));
  }, [activeCameras]);

  // AI Monitoring Logic
  React.useEffect(() => {
    if (!globalAiEnabled || activeCameras.length === 0) return;

    const interval = setInterval(() => {
      // 5% chance of an anomaly check every 30 seconds for simulation 
      // In a real app, this would be a backend process or vision analysis
      const chance = Math.random();
      if (chance > 0.85) { 
        const randomCam = activeCameras[Math.floor(Math.random() * activeCameras.length)];
        const alerts = [
          `Traffic surge detected at ${randomCam.name}. Priority level: Low.`,
          `Unusual activity pattern identified near ${randomCam.name}.`,
          `High density traffic detected at ${randomCam.name}. Suggest monitoring.`,
          `Obstruction or slow-moving traffic on ${randomCam.name} feed.`
        ];
        const alert = alerts[Math.floor(Math.random() * alerts.length)];
        addNotification(alert, chance > 0.95 ? 'warning' : 'info');
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [globalAiEnabled, activeCameras, addNotification]);

  const REFRESH_RATE = 900000; // Hardcoded 15 min (900,000ms)

  const handleSwitchCamera = (index: number, newCam: Camera) => {
    setActiveCameras(prev => {
      const next = [...prev];
      next[index] = newCam;
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 relative text-slate-100 font-sans overflow-hidden transition-colors duration-500 selection:bg-indigo-500/30">
      {/* Tactical Header */}
      <header className="h-20 bg-black/40 backdrop-blur-xl border-b border-white/5 px-8 flex items-center justify-between z-50 transition-all duration-500 tactical-header-glow shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.2)]">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase italic tracking-tight text-white leading-none">
              Surveillance <span className="text-indigo-500 not-italic">Matrix</span>
            </h1>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">Multi-Sensor Response Relay</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Grid Density</span>
            <div className="flex gap-1.5 h-1.5">
               {[4, 6].map((size) => (
                 <button
                    key={size}
                    onClick={() => setGridSize(size as 4 | 6)}
                    className={`w-4 h-full rounded-full transition-all ${gridSize === size ? 'bg-indigo-500 ring-2 ring-indigo-500/20' : 'bg-white/10 hover:bg-white/20'}`}
                 />
               ))}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <button 
            onClick={() => setGlobalAiEnabled(!globalAiEnabled)}
            className={`flex items-center gap-3 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${globalAiEnabled ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${globalAiEnabled ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`} />
            AI Sentry {globalAiEnabled ? 'Active' : 'Standby'}
          </button>
        </div>
      </header>

      {/* Grid Container */}
      <main className={`flex-1 grid gap-6 p-8 z-10 overflow-y-auto custom-scrollbar ${gridSize === 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {activeCameras.slice(0, gridSize).map((camera, idx) => (
          <div 
            key={`${idx}-${camera.id}`} 
            className="relative tactical-card p-1 overflow-hidden group"
            onContextMenu={(e) => handleContextMenu(e, camera.id, idx)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative h-full rounded-[1.5rem] overflow-hidden">
               <CameraPlayer 
                 camera={camera}
                 availableCameras={ALL_CAMERAS}
                 onSwitchCamera={(newCam) => handleSwitchCamera(idx, newCam)}
                 globalAiEnabled={globalAiEnabled}
                 onToggleAi={() => setGlobalAiEnabled(!globalAiEnabled)}
                 refreshInterval={REFRESH_RATE}
               />
            </div>
          </div>
        ))}
      </main>

      {/* Global Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <div className="fixed inset-0 z-[9999]" onClick={() => setContextMenu(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed bg-[#0d0d10] border-2 border-indigo-500/30 shadow-[0_40px_100px_rgba(0,0,0,0.9)] z-[10000] min-w-[280px] overflow-hidden backdrop-blur-3xl rounded-3xl"
              style={{ 
                top: contextMenu.y + 400 > window.innerHeight ? Math.max(10, window.innerHeight - 410) : contextMenu.y,
                left: contextMenu.x + 300 > window.innerWidth ? Math.max(10, window.innerWidth - 310) : contextMenu.x
              }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="bg-indigo-500/5 px-5 py-4 border-b border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[11px] text-white font-black tracking-[0.3em] uppercase">Sensor Selection</span>
                </div>
                <button 
                  onClick={() => setContextMenu(null)}
                  className="text-[10px] text-slate-400 hover:text-white font-black transition-colors"
                >
                  CLOSE [×]
                </button>
              </div>
              
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2">
                {ALL_CAMERAS.map(cam => (
                  <button
                    key={cam.id}
                    onClick={() => {
                      handleSwitchCamera(contextMenu.index, cam);
                      setContextMenu(null);
                    }}
                    className={`w-full text-left px-4 py-3 text-xs flex items-center justify-between transition-all rounded-2xl mb-1 group/item ${
                      cam.id === contextMenu.camId 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`font-black tracking-tight ${cam.id === contextMenu.camId ? 'text-white' : ''}`}>{cam.name}</span>
                      <span className={`text-[9px] uppercase tracking-[0.1em] truncate max-w-[180px] mt-0.5 ${cam.id === contextMenu.camId ? 'text-white/60' : 'text-slate-600'}`}>
                        {cam.description}
                      </span>
                    </div>
                    {cam.id === contextMenu.camId && (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Bar */}
      <footer className="h-12 bg-black/60 backdrop-blur-xl border-t border-white/5 px-8 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[9px] font-black text-emerald-400 tracking-widest uppercase">Encryption Link Stable</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-4 text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase">
            <span>Relay: Sector {gridSize === 4 ? 'Alpha' : 'Zeta'}</span>
            <div className="flex gap-1">
               <div className="w-1 h-3 bg-indigo-500 rounded-full" />
               <div className="w-1 h-3 bg-indigo-500/50 rounded-full" />
               <div className="w-1 h-3 bg-indigo-500/20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <span className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-600">Spatial Latency: 24ms</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
             <RefreshCw size={10} className="text-indigo-400 animate-spin-slow" />
             <span className="text-[8px] font-black uppercase text-indigo-400">Stream Sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
});
// sync;

