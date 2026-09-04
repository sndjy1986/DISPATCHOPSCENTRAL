import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, MapPin, Navigation, AlertCircle, Maximize2, Minimize2, Ambulance, Siren, Terminal, RefreshCw } from 'lucide-react';
import { onSnapshot, collection, doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import DistanceChecker from '../components/dispatch/DistanceChecker';
import CommandConsoleComponent from '../components/dispatch/CommandConsole';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { POST_DATA, POSTING_PLAN, INITIAL_UNITS, TRANSPORT_ADDRS, SECTOR_MAP } from '../lib/dispatchConstants';
import { UnitState, UnitStatus, Recommendation, DragPosition } from '../lib/dispatchTypes';

// --- UTILS ---
const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3958.8; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatTime = (ms: number) => {
  const sec = Math.floor(ms / 1000);
  const minutes = Math.floor(Math.abs(sec) / 60);
  const seconds = Math.abs(sec) % 60;
  const sign = sec < 0 ? '-' : '';
  return `${sign}${minutes}:${seconds.toString().padStart(2, '0')}`;
};

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function CommandConsolePage() {
  // --- STATE ---
  const [unitStates, setUnitStates] = useState<Record<string, UnitState>>({});
  const [unitPositions, setUnitPositions] = useState<Record<string, DragPosition>>({});
  const [unitStagedAt, setUnitStagedAt] = useState<Record<string, string>>({});
  const [oosUnits, setOosUnits] = useState<Set<string>>(new Set());
  const [inactiveUnits, setInactiveUnits] = useState<Set<string>>(new Set());
  
  const [isSyncing, setIsSyncing] = useState(true);
  
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(260);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(260);
  const [timerSectionHeight, setTimerSectionHeight] = useState(240);
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [showUsageNotice, setShowUsageNotice] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'dispatch' | 'distance'>('dispatch');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [activePage, setActivePage] = useState<'tactical' | 'console' | 'logistics'>('tactical');
  const [consoleLogs, setConsoleLogs] = useState<any[]>([]);
  
  // Removed root now state to prevent full page re-renders every second

  // Firestore Settings Sync
  const [globalSettings, setGlobalSettings] = useState({ opacity: 60, mode: 'slate-glow' });
  
  useEffect(() => {
    let unsubGlobal: (() => void) | null = null;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (!unsubGlobal) {
          unsubGlobal = onSnapshot(doc(db, 'settings', 'global'), (s) => {
            if (s.exists()) {
              const data = s.data();
              setGlobalSettings({
                opacity: data.emergencyBackgroundOpacity ?? 60,
                mode: data.ambienceMode ?? 'slate-glow'
              });
            }
          }, (err) => {
            handleFirestoreError(err, 'get', 'settings/global');
          });
        }
      } else {
        if (unsubGlobal) {
          unsubGlobal();
          unsubGlobal = null;
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubGlobal) unsubGlobal();
    };
  }, []);

  const updateGlobalSettings = async (updates: any) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, 'write', 'settings/global');
    }
  };

  useEffect(() => {
    addLog('Priority Dispatch Command System [v37.4] successfully linked.', 'success');
    addLog('Sector: Anderson County // Unit Matrix Synchronized.', 'system');
    addLog('Type "help" for a list of available commands.', 'system');
  }, []);

  const addLog = useCallback((message: string, type: 'system' | 'user' | 'unit' | 'error' | 'success' = 'system') => {
    setConsoleLogs(prev => [...prev.slice(-99), {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      message,
      type
    }]);
  }, []);

  // --- MAP COMPONENTS ---
  const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
      const container = map.getContainer();
      
      const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'copy';
      };

      const onDrop = (e: DragEvent) => {
        e.preventDefault();
        const unitId = e.dataTransfer!.getData('unitId');
        if (!unitId) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const latlng = map.containerPointToLatLng([x, y]);
        
        // Find if dropped near a post (within ~0.5 miles)
        let stagedAt: string | null = null;
        for (const post of POST_DATA) {
          if (getDist(latlng.lat, latlng.lng, post.lat, post.lon) < 0.5) {
            stagedAt = post.name;
            break;
          }
        }

        updateUnitInDb(unitId, { 
          pos: { lat: latlng.lat, lon: latlng.lng },
          stagedAt: stagedAt,
          status: 'READY'
        });
      };

      container.addEventListener('dragover', onDragOver as any);
      container.addEventListener('drop', onDrop as any);
      
      return () => {
        container.removeEventListener('dragover', onDragOver as any);
        container.removeEventListener('drop', onDrop as any);
      };
    }, [map]);

    return null;
  };

  // --- DATABASE SYNC ---
  useEffect(() => {
    let unsubscribeUnits: (() => void) | null = null;

    const startSync = () => {
      try {
        unsubscribeUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
          const newStates: Record<string, UnitState> = {};
          const newPositions: Record<string, DragPosition> = {};
          const newStaged: Record<string, string> = {};
          const newOos = new Set<string>();
          const newInactive = new Set<string>();

          snapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;

            const getMillis = (val: any) => {
              if (val && typeof val.toMillis === 'function') return val.toMillis();
              return val || Date.now();
            };

            if (data.status && data.status !== 'READY') {
              newStates[id] = { id, type: data.status, start: getMillis(data.statusStart) };
            }
            if (data.pos) {
              newPositions[id] = data.pos;
            }
            if (data.stagedAt) {
              newStaged[id] = data.stagedAt;
            }
            if (data.isOos) {
              newOos.add(id);
            }
            if (data.isInactive) {
              newInactive.add(id);
            }
          });

          setUnitStates(newStates);
          setUnitPositions(newPositions);
          setUnitStagedAt(newStaged);
          setOosUnits(newOos);
          setInactiveUnits(newInactive);
          setIsSyncing(false);
        }, (err) => {
          handleFirestoreError(err, 'list', 'units');
        });
      } catch (err) {
        console.error("Sync initialization failed:", err);
      }
    };

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (!unsubscribeUnits) {
          startSync();
        }
      } else {
        if (unsubscribeUnits) {
          unsubscribeUnits();
          unsubscribeUnits = null;
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribeUnits) unsubscribeUnits();
    };
  }, []);

  // --- LOGIC ---
  const readyUnits = useMemo(() => {
    return INITIAL_UNITS.filter(u => {
      if (inactiveUnits.has(u.id)) return false;
      if (oosUnits.has(u.id)) return false;
      if (unitStates[u.id]) return false;
      return true;
    });
  }, [oosUnits, unitStates, inactiveUnits]);

  const recommendations = useMemo(() => {
    const rawPlanLevel = readyUnits.length;
    const planLevel = Math.min(rawPlanLevel, Math.max(...Object.keys(POSTING_PLAN).map(Number)));
    const activePlan = [...(POSTING_PLAN[planLevel] || [])];
    const recs: Recommendation[] = [];
    
    const unitsAtTargetPosts: Record<string, string> = {};
    const coveredPosts: string[] = [];
    const availableToMove: typeof readyUnits = [];

    // Map each ready unit to its current effective coordinates
    const unitLocs = readyUnits.map(u => {
      const pos = unitPositions[u.id];
      if (pos && pos.lat && pos.lon) {
        return { unit: u, lat: pos.lat, lon: pos.lon };
      }
      const pName = unitStagedAt[u.id] || u.home;
      const pData = POST_DATA.find(p => p.name === pName) || POST_DATA[0];
      return { unit: u, lat: pData.lat, lon: pData.lon };
    });

    // 1. Identify which plan posts are already covered by any unit (proximity threshold 1.0mi)
    activePlan.forEach(pName => {
      const pData = POST_DATA.find(p => p.name === pName);
      if (!pData) return;
      
      const sector = Object.keys(SECTOR_MAP).find(s => SECTOR_MAP[s].includes(pName));
      const sectorPosts = sector ? SECTOR_MAP[sector] : [pName];

      const coveringUnits = unitLocs.filter(ul => {
        // Direct proximity (1.0mi)
        if (getDist(ul.lat, ul.lon, pData.lat, pData.lon) < 1.0) return true;
        
        // Regional coverage: Unit is at any post in the same sector
        const unitIsAtAnyPostInSector = sectorPosts.some(sp => {
          const spData = POST_DATA.find(p => p.name === sp);
          return spData && getDist(ul.lat, ul.lon, spData.lat, spData.lon) < 1.0;
        });
        
        return unitIsAtAnyPostInSector;
      });

      if (coveringUnits.length > 0) {
        coveredPosts.push(pName);
        coveringUnits.forEach(ul => {
          unitsAtTargetPosts[ul.unit.id] = pName;
        });
      }
    });

    // 2. Units not covering a plan post are available to move
    readyUnits.forEach(u => {
      if (!Object.keys(unitsAtTargetPosts).includes(u.id)) {
        availableToMove.push(u);
      }
    });

    const uncoveredPosts = activePlan.filter(p => !coveredPosts.includes(p));
    let currentAvailable = [...availableToMove];
    
    // Check if Med-3 is busy and Med-6 is available (Special Logic)
    const m3Busy = unitStates['Med-3'] || oosUnits.has('Med-3');
    const m6Idx = currentAvailable.findIndex(u => u.id === 'Med-6');

    uncoveredPosts.forEach(reqPost => {
      if (reqPost === "Homeland Park" && m3Busy && m6Idx !== -1) {
        recs.push({
          post: "81 & Fred Dean",
          unitId: "Med-6",
          dist: 0,
          type: 'MUTUAL_AID'
        });
        currentAvailable.splice(m6Idx, 1);
      } else {
        const postCoords = POST_DATA.find(p => p.name === reqPost);
        if (postCoords) {
          let bestCandidateIdx = -1;
          let minDist = Infinity;

          currentAvailable.forEach((unit, idx) => {
            const pos = unitPositions[unit.id];
            let lat, lon;
            if (pos && pos.lat && pos.lon) {
              lat = pos.lat;
              lon = pos.lon;
            } else {
              const currentPost = unitStagedAt[unit.id] || unit.home;
              const base = POST_DATA.find(p => p.name === currentPost) || POST_DATA.find(p => p.name === "Headquarters")!;
              lat = base.lat;
              lon = base.lon;
            }
            const d = getDist(lat, lon, postCoords.lat, postCoords.lon);
            if (d < minDist) {
              minDist = d;
              bestCandidateIdx = idx;
            }
          });

          if (bestCandidateIdx !== -1) {
            recs.push({
              post: reqPost,
              unitId: currentAvailable[bestCandidateIdx].id,
              dist: minDist,
              type: 'GAP'
            });
            currentAvailable.splice(bestCandidateIdx, 1);
          }
        }
      }
    });

    return recs;
  }, [readyUnits, unitStates, oosUnits, unitStagedAt, unitPositions]);

  // --- ACTIONS ---
  useEffect(() => {
    if (!contextMenu) return;
    const handleGlobalClick = (e: MouseEvent) => {
      const menu = document.getElementById('context-menu');
      if (menu && menu.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [contextMenu]);

  const updateUnitInDb = async (uId: string, updates: any) => {
    try {
      const unitDoc = doc(db, 'units', uId);
      await setDoc(unitDoc, { 
        id: uId, 
        ...updates, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      if (updates.status) {
        addLog(`Unit ${uId} status changed to ${updates.status}`, 'unit');
      }
    } catch (err) {
      handleFirestoreError(err, 'write', `units/${uId}`);
      addLog(`Failed to update ${uId}: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  const handleTerminalCommand = useCallback((cmd: string) => {
    const parts = cmd.toLowerCase().split(' ');
    const action = parts[0];
    const target = parts[1];
    const value = parts[2];

    addLog(`> ${cmd}`, 'user');

    if (action === 'help') {
      addLog('Available commands: status [unit] [ready|call|dest|logs|oos], recall, clear, help', 'system');
      return;
    }

    if (action === 'clear') {
      setConsoleLogs([]);
      return;
    }

    if (action === 'recall') {
      recallAll();
      addLog('System-wide recall initiated.', 'success');
      return;
    }

    if (action === 'status') {
      if (!target) {
        addLog('Error: Unit ID required for status command.', 'error');
        return;
      }
      
      // Basic normalization
      let unitId = target;
      if (!unitId.startsWith('Med-')) {
        const num = unitId.replace(/\D/g, '');
        unitId = `Med-${num}`;
      }

      if (!INITIAL_UNITS.find(u => u.id === unitId)) {
        addLog(`Error: Unit ${unitId} not found in fleet matrix.`, 'error');
        return;
      }

      if (value === 'oos') {
        toggleOOS(unitId);
        addLog(`Unit ${unitId} toggled OOS.`, 'success');
      } else if (['ready', 'call', 'dest', 'logs'].includes(value)) {
        setStatus(unitId, value.toUpperCase() as any);
        addLog(`Unit ${unitId} status updated to ${value.toUpperCase()}.`, 'success');
      } else {
        addLog(`Error: Invalid status "${value}". Use: ready, call, dest, logs, oos.`, 'error');
      }
      return;
    }

    addLog(`Error: Unknown command "${action}". Type "help" for options.`, 'error');
  }, [addLog]);

  const setStatus = useCallback(async (uId: string, type: UnitStatus) => {
    try {
      const unitDoc = doc(db, 'units', uId);
      if (type === 'READY') {
        // Reset unit in DB
        await setDoc(unitDoc, {
          id: uId,
          status: 'READY',
          pos: null,
          stagedAt: null,
          updatedAt: Date.now()
        }, { merge: true });
      } else {
        await updateUnitInDb(uId, { 
          status: type, 
          statusStart: serverTimestamp() 
        });
      }
    } catch (err) {
      handleFirestoreError(err, 'write', `units/${uId}`);
    }
    setContextMenu(null);
  }, []);

  const toggleOOS = useCallback(async (uId: string) => {
    const isNowOos = !oosUnits.has(uId);
    await updateUnitInDb(uId, { isOos: isNowOos });
    setContextMenu(null);
  }, [oosUnits]);

  const recallAll = useCallback(async () => {
    const batch = writeBatch(db);
    
    // Reset Units to default "Ready in Menu" state
    INITIAL_UNITS.forEach(unit => {
      const unitDoc = doc(db, 'units', unit.id);
      batch.set(unitDoc, {
        id: unit.id,
        status: 'READY',
        statusStart: null,
        pos: null,
        stagedAt: null,
        isOos: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    try {
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleResize = useCallback((panel: 'left' | 'right' | 'timers', e: React.MouseEvent) => {
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (panel === 'left') setLeftSidebarWidth(moveEvent.clientX);
      if (panel === 'right') setRightSidebarWidth(window.innerWidth - moveEvent.clientX);
      if (panel === 'timers') setTimerSectionHeight(window.innerHeight - moveEvent.clientY);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  // --- INTERNAL COMPONENTS (OPTIMIZED) ---
  const MissionTimers = React.memo(({ unitStates, onSetStatus }: { unitStates: Record<string, UnitState>, onSetStatus: (uId: string, status: UnitStatus) => void }) => {
    const [now, setNow] = useState(Date.now());
    
    useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }, []);

    const hasTimers = Object.keys(unitStates).length > 0;

    return (
      <div className="flex-1 p-3 flex gap-4 overflow-x-auto custom-scrollbar bg-transparent">
        {hasTimers ? (
          Object.keys(unitStates).map(uId => {
            const state = unitStates[uId];
            const elapsed = now - state.start;
            const duration = state.type === 'DEST' ? 20 * 60 * 1000 : state.type === 'LOGS' ? 10 * 60 * 1000 : 0;
            const remaining = duration - elapsed;
            const display = state.type === 'CALL' ? formatTime(elapsed) : formatTime(remaining);
            return (
              <div key={uId} className="timer-card min-w-[200px] bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl shrink-0">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-white">{uId}</span>
                  <span className={`text-[10px] px-1.5 rounded font-black ${state.type === 'CALL' ? 'bg-bright-red/10 text-bright-red' : 'bg-hosp-orange/10 text-hosp-orange'}`}>
                    {state.type === 'CALL' ? '911 CALL' : state.type === 'DEST' ? 'IFR TRANS' : 'LOGISTICS'}
                  </span>
                </div>
                <div className={`text-4xl font-mono font-black my-1 ${state.type === 'CALL' ? 'text-bright-red shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-slate-300'}`}>
                   {display}
                </div>
                <div className="flex gap-2">
                   {state.type === 'CALL' && (
                    <button onClick={() => onSetStatus(uId, 'DEST')} className="flex-1 bg-hosp-orange text-white font-black p-1 text-[9px] rounded-xl shadow-lg active:scale-95 transition-all">Arrived</button>
                   )}
                   <button onClick={() => onSetStatus(uId, 'READY')} className="flex-1 font-black p-1 text-[9px] rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95">Clear</button>
                </div>
              </div>
            );
          })
        ) : (
          <div className={`w-full flex items-center justify-center border border-dashed rounded-xl border-zinc-800`}>
            <span className={`text-[10px] font-bold uppercase text-zinc-800`}>Standby Sector Waiting...</span>
          </div>
        )}
      </div>
    );
  });

  const FleetGrid = React.memo(({ unitPositions, unitStagedAt, unitStates, oosUnits, inactiveUnits, onRenderIcon }: any) => {
    return (
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-2 content-start custom-scrollbar bg-transparent">
        {INITIAL_UNITS.map(u => !inactiveUnits.has(u.id) && !unitPositions[u.id] && (
          <div key={u.id} className="min-h-[40px] flex justify-center">
            {onRenderIcon(u)}
          </div>
        ))}
      </div>
    );
  });

  const DispatchLogicMatrix = React.memo(({ recommendations }: { recommendations: Recommendation[] }) => {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-transparent">
        {recommendations.length > 0 ? (
          recommendations.map((rec, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/5 bg-black/40 backdrop-blur-md shadow-2xl transition-all hover:bg-white/10">
              <div className={`text-[10px] font-black uppercase mb-2 flex items-center gap-2 ${rec.type === 'MUTUAL_AID' ? 'text-hosp-orange' : 'text-indigo-accent'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${rec.type === 'MUTUAL_AID' ? 'bg-hosp-orange' : 'bg-indigo-accent'} animate-pulse shadow-[0_0_8px] shadow-current`} />
                 {rec.type === 'MUTUAL_AID' ? 'Mutual Aid' : `Gap: ${rec.post}`}
              </div>
              <div className="text-sm leading-tight font-bold text-white">
                Move <span className="text-indigo-accent uppercase italic">{rec.unitId}</span> to <span className="text-indigo-accent uppercase italic">{rec.post}</span>.
              </div>
              {rec.dist > 0 && <div className="mt-3 pt-2 border-t border-white/5 text-[9px] font-mono text-slate-500">Est. Response: {(rec.dist * 1.5).toFixed(1)} mins</div>}
            </div>
          ))
        ) : (
          <div className="p-8 rounded-3xl border border-dashed border-white/10 text-center space-y-3 py-16">
            <div className="typography-label !text-slate-600">Status Optimal</div>
            <div className="text-[9px] font-mono uppercase text-slate-800">Vector alignment confirmed.</div>
          </div>
        )}
      </div>
    );
  });

  // --- RENDER HELPERS ---
    const renderUnitIcon = (unit: typeof INITIAL_UNITS[0]) => {
    const isBusy = unitStates[unit.id] || oosUnits.has(unit.id);
    const status = unitStates[unit.id]?.type;
    const isOos = oosUnits.has(unit.id);
    const staged = unitStagedAt[unit.id];

    return (
      <div
        key={unit.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('unitId', unit.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setSelectedUnitId(unit.id);
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        className={`ambulance-icon w-full group relative ${isOos ? 'oos' : ''} ${status === 'CALL' ? 'state-call' : ''} ${status === 'DEST' ? 'state-dest' : ''}`}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full mb-1 relative transition-all group-hover:scale-110">
           {status === 'CALL' ? (
             <Siren className="w-4 h-4 text-bright-red animate-pulse" />
           ) : (
             <Ambulance className={`w-4 h-4 transition-transform ${status === 'DEST' ? 'text-hosp-orange' : 'text-logistics-blue'}`} />
           )}
           <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border-2 border-zinc-950 z-20 ${isOos ? 'bg-zinc-600' : status === 'CALL' ? 'bg-bright-red' : status === 'DEST' ? 'bg-hosp-orange' : 'bg-neon-green'}`} />
        </div>
        <div className="unit-label text-[8px] tracking-tighter font-black">{unit.id}</div>
        <div className="unit-status-text text-[6px] leading-tight text-center font-mono opacity-70">
          {staged ? staged : isOos ? 'OOS' : status === 'CALL' ? '911' : status === 'DEST' ? 'HOSP' : status === 'LOGS' ? 'LOGS' : 'READY'}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-8 bg-black border-b border-white/5 shrink-0 z-[2000] relative tactical-header-glow">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 group">
             <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                <Terminal className="w-5 h-5 text-indigo-400" />
             </div>
             <div className="flex flex-col">
               <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Operational <span className="text-indigo-500 not-italic">Matrix</span></h1>
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Control Interface_v37.4</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-8 px-6 py-2 bg-white/5 border border-white/10 rounded-2xl">
             <div className="flex flex-col items-center">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Units</span>
               <span className="text-xs font-mono font-black text-indigo-400">{INITIAL_UNITS.length - oosUnits.size - inactiveUnits.size}</span>
             </div>
             <div className="w-px h-6 bg-white/10" />
             <div className="flex flex-col items-center">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">OOS Lock</span>
               <span className="text-xs font-mono font-black text-rose-500">{oosUnits.size}</span>
             </div>
           </div>

           {isSyncing ? (
             <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Syncing...</span>
             </div>
           ) : (
             <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Linked</span>
             </div>
           )}
           
           <button 
             onClick={() => setIsSidePanelOpen(true)}
             className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
           >
             <Settings className="w-5 h-5 transition-transform hover:rotate-90" />
           </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-black">
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
             {/* Tactical Map Container */}
             <div className="absolute top-6 left-8 z-20 pointer-events-none flex flex-col gap-2">
                <div className="px-4 py-2 bg-black/80 backdrop-blur-xl border border-indigo-500/30 rounded-xl font-black text-[10px] uppercase tracking-[0.22em] text-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.2)] flex items-center gap-3">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                   Sector_Anderson // Tactical_Feed
                </div>
                <div className="px-4 py-1 bg-black/60 backdrop-blur border border-white/5 rounded-lg font-mono text-[9px] text-slate-500 inline-block uppercase italic">
                   Lat: 34.5034 // Lon: -82.6501
                </div>
             </div>

             <div className="w-full h-full p-4">
                <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
                   <iframe 
                    src="https://www.google.com/maps/d/u/0/embed?mid=1sVuk-qPshgccqAlOzQvumzq7OdeVII8&ehbc=2E312F" 
                    className="w-full h-[calc(100%+60px)] -translate-y-[60px] border-none grayscale contrast-125 brightness-75 hover:grayscale-0 transition-all duration-700 pointer-events-auto"
                    title="Google My Maps Tactical"
                  />
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.6)]" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* SYSTEM OVERLAYS */}
      <AnimatePresence>
        {isSidePanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidePanelOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[3000]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 right-0 h-full w-[400px] z-[3001] shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-zinc-900 border-l border-zinc-800 text-white' : 'bg-white border-l border-slate-200 text-zinc-900'}`}
            >
              <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-logistics-blue animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest italic text-logistics-blue">System Operations</span>
                </div>
                <button onClick={() => setIsSidePanelOpen(false)} className="p-1.5 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-2">
                  <div className={`flex border rounded-lg p-1 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                    <button 
                      onClick={() => setActiveRightTab('dispatch')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${activeRightTab === 'dispatch' ? 'bg-logistics-blue text-white shadow-lg shadow-logistics-blue/20' : 'text-zinc-500 hover:text-zinc-400'}`}
                    >
                      Dispatch Logic
                    </button>
                    <button 
                      onClick={() => setActiveRightTab('distance')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${activeRightTab === 'distance' ? 'bg-logistics-blue text-white shadow-lg shadow-logistics-blue/20' : 'text-zinc-500 hover:text-zinc-400'}`}
                    >
                      Distance Tool
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {activeRightTab === 'dispatch' ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fleet Advisory Matrix</span>
                         <span className="text-[9px] font-mono text-neon-green">REAL_TIME_SYNC</span>
                      </div>
                      
                      {recommendations.length > 0 ? recommendations.map((rec, i) => (
                        <div key={i} className={`p-5 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] font-black uppercase mb-2 ${rec.type === 'MUTUAL_AID' ? 'text-hosp-orange' : 'text-logistics-blue'}`}>
                            {rec.type === 'MUTUAL_AID' ? '// MUTUAL AID ALERT //' : `// GAP DETECTED: ${rec.post} //`}
                          </div>
                          <div className="text-sm font-medium leading-relaxed">
                            Deploy <span className="font-black text-logistics-blue">{rec.unitId}</span> to provide coverage for <span className="font-black text-logistics-blue">{rec.post}</span>.
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-10 opacity-40">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-[10px] font-mono uppercase">System Balance Optimal</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Distance Matrix Utility</div>
                      <DistanceChecker />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-white/5 space-y-8">
                <div className="space-y-3">
                  <label className="typography-label">Visual Flux Intensity</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={globalSettings.opacity}
                    onChange={(e) => updateGlobalSettings({ emergencyBackgroundOpacity: Number(e.target.value) })}
                    className="w-full accent-indigo-accent h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-4">
                  <label className="typography-label">Ambience Engine</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => updateGlobalSettings({ ambienceMode: 'slate-glow' })}
                      className={`p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${globalSettings.mode === 'slate-glow' ? 'bg-indigo-accent text-white border-indigo-accent/50 shadow-lg shadow-indigo-accent/20' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                    >
                      Slate Glow
                    </button>
                    <button 
                      onClick={() => updateGlobalSettings({ ambienceMode: 'emergency' })}
                      className={`p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${globalSettings.mode === 'emergency' ? 'bg-bright-red text-white border-bright-red/50 shadow-lg shadow-bright-red/20' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                    >
                      Emergency
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full p-4 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-between transition-all hover:bg-white/10 group"
                >
                  <span className="text-xs font-black uppercase tracking-tight text-slate-300 group-hover:text-white transition-colors">Toggle Visual Theme</span>
                  {theme === 'dark' ? <Maximize2 className="w-4 h-4 text-slate-400" /> : <Minimize2 className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAP ENLARGEMENT */}
      <AnimatePresence>
        {isMapExpanded && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[4000] bg-black/95 backdrop-blur-xl p-4 flex flex-col"
          >
            <div className="relative flex-1 rounded-3xl overflow-hidden border border-white/10">
              <div className="absolute top-6 left-6 z-[4001] px-4 py-2 bg-black/60 backdrop-blur rounded-xl border border-white/10">
                <span className="text-[10px] font-black text-logistics-blue uppercase tracking-widest italic">Full Tactical Feed</span>
                <p className="text-[9px] font-mono text-zinc-500">ANDERSON COUNTY // RC-35</p>
              </div>
              <button 
                onClick={() => setIsMapExpanded(false)} 
                className="absolute top-6 right-6 z-[4001] w-12 h-12 bg-black/80 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-zinc-800 transition-all shadow-xl"
              >
                <Minimize2 className="w-6 h-6" />
              </button>
              <MapContainer center={[34.523, -82.648]} zoom={12} className="w-full h-full" zoomControl={false} attributionControl={false}>
                <TileLayer url={theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"} />
                {POST_DATA.map(p => (
                  <Marker key={p.name} position={[p.lat, p.lon]} icon={L.divIcon({ className: 'custom-post-marker', html: `<div class="post-dot"></div><div class="post-label">${p.name}</div>`, iconSize: [20, 20], iconAnchor: [10, 10] })} />
                ))}
                {INITIAL_UNITS.map(u => {
                  const pos = unitPositions[u.id];
                  if (!pos) return null;
                  return (
                     <Marker 
                        key={u.id} 
                        position={[pos.lat, pos.lon]} 
                        icon={L.divIcon({
                          className: `custom-unit-marker expanded ${oosUnits.has(u.id) ? 'oos' : ''}`,
                          html: `<div class="unit-orb-container"><div class="unit-orb-inner"><div class="unit-id-map">${u.id.split('-')[1]}</div></div></div>`,
                          iconSize: [60,60], iconAnchor: [30,30]
                        })}
                     />
                  );
                })}
              </MapContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTEXT MENU */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed z-[5000] w-48 shadow-2xl rounded-xl border p-1.5 backdrop-blur-xl ${theme === 'dark' ? 'bg-zinc-950/90 border-white/10' : 'bg-white/90 border-slate-200'}`}
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <div className="px-3 py-2 border-b border-white/5 mb-1 flex justify-between items-center text-[10px] font-black uppercase text-logistics-blue italic">
              {selectedUnitId}
            </div>
            <button onClick={() => setStatus(selectedUnitId!, 'CALL')} className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-bold text-bright-red hover:bg-bright-red/10 rounded-lg transition-colors"><Siren className="w-3.5 h-3.5" /> 911 RESPONSE</button>
            <button onClick={() => setStatus(selectedUnitId!, 'DEST')} className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-bold text-hosp-orange hover:bg-hosp-orange/10 rounded-lg transition-colors"><Navigation className="w-3.5 h-3.5" /> HOSP TRANSPORT</button>
            <button onClick={() => setStatus(selectedUnitId!, 'LOGS')} className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-bold text-logistics-blue hover:bg-logistics-blue/10 rounded-lg transition-colors"><AlertCircle className="w-3.5 h-3.5" /> SYSTEM LOGS</button>
            <div className="h-px bg-white/5 my-1" />
            <button onClick={() => toggleOOS(selectedUnitId!)} className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-bold text-zinc-500 hover:bg-zinc-800 rounded-lg transition-colors"><X className="w-3.5 h-3.5" /> TOGGLE OOS</button>
            <button onClick={() => setStatus(selectedUnitId!, 'READY')} className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-black text-neon-green hover:bg-zinc-800 rounded-lg transition-colors"><Maximize2 className="w-3.5 h-3.5" /> RESET UNIT</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYSTEM OVERLAYS */}
    </>
  );
}
// sync
