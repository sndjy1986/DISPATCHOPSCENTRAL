import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Map as MapIcon, List, AlertCircle, Loader2, X, Shield, Activity, Truck, Zap, Radio } from 'lucide-react';
import { Unit, API_LIMIT } from '../lib/distanceConstants';
import { geocode, getMatrix, fetchCurrentUsage, incrementUsage } from '../services/mapboxService';
import { POST_DATA, INITIAL_UNITS, TRANSPORT_ADDRS, QRV_UNITS as DISPATCH_QRV } from '../lib/dispatchConstants';
import Map from '../components/distancechecker/Map';
import UnitTable from '../components/distancechecker/UnitTable';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { ToneTestRecord } from '../types';
import { MASTER_POSTS } from '../lib/systemLevels';

import { useTerminal } from '../context/TerminalContext';

interface UnitAssignment {
  unitId: string;
  postName: string;
}

const QRV_HOME_POSTS: Record<string, string> = {
  "A-5": "Centerville",
  "A-8": "Headquarters",
  "ALS-2": "Pendleton",
  "ALS-3": "Homeland Park",
  "ALS-4": "81 & Fred Dean",
  "ALS-6": "Pelzer",
  "ALS-7": "Powdersville",
  "ALS-11": "West Anderson - P5",
  "ALS-12": "Belton City",
  "ALS-17": "TownVille",
  "ALS-19": "Hopewell",
  "ALS-21": "Honea Path",
  "ALS-23": "Headquarters",
  "ALS-24": "Wren",
  "ALS-27": "Zion"
};

export default function DistanceMap() {
  const { toneTestMode } = useTerminal();
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [usageCount, setUsageCount] = useState(0);
  const [destCoords, setDestCoords] = useState<[number, number] | undefined>();
  
  const [transportResults, setTransportResults] = useState<Unit[]>([]);
  const [qrvResults, setQrvResults] = useState<Unit[]>([]);
  
  const [toneRecords, setToneRecords] = useState<ToneTestRecord[]>([]);
  const [assignments, setAssignments] = useState<UnitAssignment[]>([]);
  const [fleetConfigs, setFleetConfigs] = useState<import('../lib/firebase').UnitConfig[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUsage().then(setUsageCount);

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (s) => {
      if (s.exists()) {
        const data = s.data();
        setGlobalSettings(data);
        if (data.fleetConfigs) setFleetConfigs(data.fleetConfigs);
      }
    }, (error) => {
      console.warn('Firestore settings/global read error:', error);
    });

    const unsubTone = onSnapshot(query(collection(db, 'toneTests')), (snapshot) => {
      setToneRecords(snapshot.docs.map(doc => doc.data() as ToneTestRecord));
    }, (error) => {
      console.warn('Firestore toneTests read error:', error);
    });

    const unsubAssign = onSnapshot(query(collection(db, 'unitAssignments')), (snapshot) => {
      setAssignments(snapshot.docs.map(doc => doc.data() as UnitAssignment));
    }, (error) => {
      console.warn('Firestore unitAssignments read error:', error);
    });

    return () => {
      unsubSettings();
      unsubTone();
      unsubAssign();
    };
  }, []);

  // Compute active units and their effective coordinates from home stations
  const activeTransportUnits = useMemo(() => {
    // Pull ALL trucks representing home stations, as requested by the user
    const medUnits = INITIAL_UNITS.filter(u => u.id.toUpperCase().startsWith('MED'));
    
    return medUnits.map(u => {
      const unitId = u.id;
      const config = fleetConfigs.find(c => c.id.toLowerCase() === unitId.toLowerCase());
      
      let coords: [number, number] | null = null;
      let addr = "";

      const homePostName = config?.homePost || u.home || "Headquarters";
      const post = homePostName ? POST_DATA.find(p => p.name.toLowerCase() === homePostName.toLowerCase()) : null;
      
      if (post) {
        coords = [post.lon, post.lat];
        addr = `Home @ ${post.name}`;
      } else {
        addr = config?.address || TRANSPORT_ADDRS[unitId] || "Headquarters";
        // Fallback fallback: search POST_DATA for HQ
        const hqPost = POST_DATA.find(p => p.name.toLowerCase() === 'headquarters');
        if (hqPost) coords = [hqPost.lon, hqPost.lat];
      }

      return {
        name: unitId,
        addr: addr,
        coords: coords
      };
    }).filter(u => u.coords !== null); // Ensure only valid coords are used
  }, [fleetConfigs]);

  // QRVs are mapped to home stations as well to support zero-geocoding distances
  const activeQrvUnits = useMemo(() => {
    const qrvConfigs = fleetConfigs.filter(c => c.type === 'qrv');
    const items = qrvConfigs.length > 0 
      ? qrvConfigs.map(q => ({ name: q.name, addr: q.address || "" }))
      : DISPATCH_QRV.map(q => ({ name: q.name, addr: q.addr || "" }));

    return items.map(q => {
      let coords: [number, number] | null = null;
      let addr = q.addr;

      const homePostName = QRV_HOME_POSTS[q.name] || "Headquarters";
      const post = POST_DATA.find(p => p.name.toLowerCase() === homePostName.toLowerCase());
      if (post) {
        coords = [post.lon, post.lat];
        addr = `Home @ ${post.name}`;
      } else {
        const hqPost = POST_DATA.find(p => p.name.toLowerCase() === 'headquarters');
        if (hqPost) coords = [hqPost.lon, hqPost.lat];
      }

      return {
        name: q.name,
        addr: addr,
        coords: coords
      };
    }).filter(u => u.coords !== null); // Ensure only valid coords are used
  }, [fleetConfigs]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || loading || (usageCount >= API_LIMIT)) return;

    setLoading(true);
    setStatus("Locating destination...");
    
    try {
      const coords = await geocode(address);
      setDestCoords(coords);
      setStatus("Calculating routes...");

      const processGroup = async (units: { name: string, addr: string, coords: [number, number] | null }[]) => {
        if (units.length === 0) return [];

        const unitCoordsWithMeta = await Promise.all(units.map(async u => {
          try {
            const coords = u.coords || await geocode(u.addr);
            return { coords, unit: u };
          } catch (e) {
            console.warn(`Geocoding failed for ${u.name}:`, e);
            return null;
          }
        }));

        const validEntries = unitCoordsWithMeta.filter((v): v is { coords: [number, number], unit: typeof units[0] } => v !== null);
        if (validEntries.length === 0) return [];

        const matrix = await getMatrix(coords, validEntries.map(v => v.coords));
        
        return validEntries.map((v, i) => ({
          name: v.unit.name,
          addr: v.unit.addr,
          distance: matrix.distances?.[0]?.[i] !== undefined ? matrix.distances[0][i] * 0.000621371 : undefined,
          duration: matrix.durations?.[0]?.[i] !== undefined ? Math.round(matrix.durations[0][i] / 60) : undefined
        })).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      };

      const [trans, qrv] = await Promise.all([
        processGroup(activeTransportUnits),
        processGroup(activeQrvUnits)
      ]);

      setTransportResults(trans as Unit[]);
      setQrvResults(qrv as Unit[]);

      const totalCost = 1 + activeTransportUnits.length + activeQrvUnits.length;
      const newCount = await incrementUsage(totalCost);
      setUsageCount(newCount);

      setStatus(null);
    } catch (error) {
      console.error(error);
      setStatus("Error: " + (error instanceof Error ? error.message : "Failed to calculate"));
    } finally {
      setLoading(false);
    }
  };

  const isLimitReached = usageCount >= API_LIMIT;

  // Determine absolute prime response (closest between transport and qrv)
  const primeResponse = useMemo(() => {
    const all = [...transportResults, ...qrvResults]
      .filter(u => u.distance !== undefined)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return all[0] || null;
  }, [transportResults, qrvResults]);

  const displayTransports = useMemo(() => {
    return transportResults.length > 0 ? transportResults : activeTransportUnits.map(u => ({ name: u.name, addr: u.addr }));
  }, [transportResults, activeTransportUnits]);

  const displayQrvs = useMemo(() => {
    return qrvResults.length > 0 ? qrvResults : activeQrvUnits.map(u => ({ name: u.name, addr: u.addr }));
  }, [qrvResults, activeQrvUnits]);

  return (
    <div data-theme="midnight" className="relative flex flex-col technical-grid text-text-main font-sans p-8 pt-12 overflow-hidden bg-bg-main h-screen">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="radar-sweep !opacity-10" />
        <div className="scanner-line !opacity-10" />
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-indigo/5 blur-[120px] rounded-full animate-pulse-slow" />
      </div>

      <header className="flex justify-between items-end mb-12 relative z-10 tactical-header-glow pb-8 border-b border-brand-border">
        <div className="space-y-3"> 
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-indigo rounded-2xl flex items-center justify-center shadow-brand-indigo">
              <MapIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-text-main uppercase italic">
               Fleet <span className="text-brand-indigo not-italic">Matrix</span>
            </h1>
          </div>
          <p className="text-text-dim font-black uppercase tracking-[0.2em] text-[10px] ml-16">Real-time response logistics and fleet positioning for EMS Dispatch</p>
        </div>
        
        <div className="flex items-center gap-6 tactical-card px-6 py-4 bg-brand-panel/50 border-brand-border">
          <div className="text-right"> 
            <span className="block text-[8px] uppercase tracking-[0.3em] text-text-dim font-black">System Pulse</span> 
            <span className="text-brand-emerald font-black text-[10px] tracking-widest flex items-center justify-end gap-2 mt-1 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse"></span> 
              Ops Ready - {activeTransportUnits.length + activeQrvUnits.length} Units Up
            </span>
          </div>
        </div>
      </header>

      <div className="flex gap-8 flex-1 min-h-0 relative z-10 overflow-hidden">
        {/* Left Column (Search & Summary) */}
        <div className="w-[350px] flex flex-col gap-8 shrink-0 min-h-0">
          <div className="tactical-card p-8 space-y-6 shadow-2xl relative overflow-hidden group bg-brand-panel/80 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/5 to-transparent pointer-events-none" />
                <div className="space-y-4"> 
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-brand-indigo" />
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim">Target Vector</label>
                  </div>
                  <form onSubmit={handleSearch} className="relative"> 
                    <input 
                      type="text" 
                      placeholder="DEPLOY TO ADDRESS..." 
                      className="w-full h-14 bg-brand-panel/50 border border-brand-border rounded-2xl px-5 text-text-main font-mono text-sm focus:border-brand-indigo focus:ring-4 focus:ring-brand-indigo/10 transition-all outline-none placeholder:text-text-dim/30"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={loading || isLimitReached}
                    />
                    <button 
                      type="submit"
                      disabled={loading || isLimitReached || !address.trim()}
                      className="absolute right-2 top-2 tactical-btn-indigo px-4 py-2 text-[10px] font-black shadow-brand-indigo"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "PING"}
                    </button>
                  </form>
                </div>

            {status && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-brand-indigo/10 border border-brand-indigo/20 rounded-2xl flex gap-3"
              > 
                <div className="bg-brand-indigo/20 p-2 rounded-lg h-fit text-brand-indigo">
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>
                <p className="text-[11px] leading-snug text-text-main font-bold uppercase tracking-wider">{status}</p>
              </motion.div>
            )}

            {isLimitReached && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3"> 
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-[11px] leading-snug text-text-main font-black uppercase tracking-wider">Matrix limit reached. System cooldown initialized.</p>
              </div>
            )}
          </div>

          <div className="flex-1 tactical-card flex flex-col min-h-0 overflow-hidden bg-brand-panel/40">
            <div className="p-6 border-b border-brand-border bg-brand-indigo/5 flex justify-between items-center shrink-0"> 
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-indigo">Response Matrix</h3> 
              <div className="flex gap-1.5">
                <div className="w-8 h-[2px] bg-brand-indigo rounded-full shadow-brand-indigo"></div>
                <div className="w-4 h-[2px] bg-brand-border rounded-full"></div>
              </div>
            </div>
            <div className="p-8 space-y-8 flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar"> 
              <div className="space-y-4 shrink-0">
                <div className="flex justify-between items-center group/item hover:bg-brand-indigo/5 p-2 -mx-2 rounded-xl transition-all"> 
                  <span className="text-text-dim text-[10px] font-black uppercase tracking-widest group-hover/item:text-text-main">Fleet Units</span> 
                  <span className="text-text-main font-mono bg-brand-bg/50 px-3 py-1 rounded-lg text-[10px] border border-brand-border border-b-brand-indigo/50">{activeTransportUnits.length} ACTIVE</span> 
                </div> 
                <div className="flex justify-between items-center group/item hover:bg-brand-indigo/5 p-2 -mx-2 rounded-xl transition-all"> 
                  <span className="text-text-dim text-[10px] font-black uppercase tracking-widest group-hover/item:text-text-main">QRV Response</span> 
                  <span className="text-text-main font-mono bg-brand-bg/50 px-3 py-1 rounded-lg text-[10px] border border-brand-border border-b-brand-emerald/50">{activeQrvUnits.length} READY</span> 
                </div> 
              </div>

              <div className="pt-8 border-t border-brand-border mt-4 shrink-0"> 
                <div className="text-center bg-brand-bg/50 rounded-[2rem] p-8 border border-brand-border relative group overflow-hidden shadow-inner"> 
                  <div className="absolute inset-0 bg-brand-indigo/[0.02] group-hover:bg-brand-indigo/[0.05] transition-all" />
                  <span className="block text-6xl font-black text-text-main mb-2 leading-none">
                    {primeResponse ? primeResponse.distance?.toFixed(2) : '--'}
                    <span className="text-sm font-black text-text-dim ml-1 uppercase tracking-widest">mi</span>
                  </span> 
                  <span className="text-[9px] text-brand-indigo uppercase font-black tracking-[0.2em] relative z-10 px-4 py-1.5 bg-brand-indigo/10 rounded-full border border-brand-indigo/20">
                    Prime Response: {primeResponse ? primeResponse.name : 'STNDBY'}
                  </span> 
                </div> 
              </div>

              {/* View Toggle */}
              <div className="mt-auto pt-8 shrink-0">
                <div className="bg-brand-bg/60 p-1.5 rounded-2xl border border-brand-border flex shadow-inner">
                  <button 
                    onClick={() => setView('list')}
                    className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${view === 'list' ? 'bg-brand-indigo text-white shadow-brand-indigo' : 'text-text-dim hover:text-text-main'}`}
                  >
                    <List className="w-4 h-4" />
                    List Matrix
                  </button>
                  <button 
                    onClick={() => setView('map')}
                    className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${view === 'map' ? 'bg-brand-indigo text-white shadow-brand-indigo' : 'text-text-dim hover:text-text-main'}`}
                  >
                    <MapIcon className="w-4 h-4" />
                    Overlay Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Results) */}
        <div className="flex-1 flex flex-col gap-8 min-h-0 h-full">
          <div className="flex-1 min-h-0 h-full">
            <AnimatePresence mode="wait">
              {view === 'list' ? (
                <motion.div 
                  key="list"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pr-4 custom-scrollbar"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2 px-2">
                       <Truck className="w-4 h-4 text-brand-indigo" />
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-main">Fleet Deployments</h4>
                    </div>
                    <UnitTable units={displayTransports} loading={loading} title="Primary Assets" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2 px-2">
                       <Zap className="w-4 h-4 text-brand-emerald" />
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-main">QRV Support</h4>
                    </div>
                    <UnitTable units={displayQrvs} loading={loading} title="Operational QRVs" />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="map"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="h-full tactical-card overflow-hidden relative"
                >
                  <Map coords={destCoords} />
                  <div className="absolute top-6 left-6 z-[1000]">
                    <div className="bg-brand-panel/80 backdrop-blur-xl p-4 rounded-2xl border border-brand-border shadow-2xl flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-brand-indigo flex items-center justify-center text-white">
                          <MapIcon className="w-4 h-4" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim">Overlay active</span>
                          <span className="text-[10px] font-bold text-text-main uppercase tracking-widest">{address || 'No destination targeted'}</span>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <footer className="mt-8 flex justify-between items-center bg-brand-panel/40 rounded-[2rem] border border-brand-border p-6 relative z-10 shadow-2xl">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-6"> 
            <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.3em]">Network Load</span> 
            <div className="w-64 h-2 bg-brand-bg/50 rounded-full overflow-hidden border border-brand-border p-[1px]"> 
              <motion.div 
                className={`h-full rounded-full shadow-brand-indigo ${usageCount >= API_LIMIT ? 'bg-rose-500' : 'bg-brand-indigo'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (usageCount / API_LIMIT) * 100)}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
              />
            </div> 
            <span className="text-[10px] font-mono text-brand-indigo font-bold bg-brand-indigo/10 px-3 py-1 rounded-lg border border-brand-indigo/20">{usageCount.toLocaleString()} / {API_LIMIT.toLocaleString()}</span>
          </div>
          <div className="h-6 w-[1px] bg-brand-border hidden md:block"></div>
          <p className="text-[9px] text-text-dim max-w-sm hidden lg:block font-bold uppercase tracking-widest">Quantum usage resets on monthly cycle. Spatial metrics provided via Mapbox Relay Matrix.</p>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-bg/50 flex items-center justify-center text-text-dim border border-brand-border hover:border-brand-indigo hover:text-brand-indigo transition-all cursor-crosshair">
            <Search className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-bg/50 flex items-center justify-center text-text-dim border border-brand-border hover:border-brand-indigo hover:text-brand-indigo transition-all cursor-crosshair">
            <Radio className="w-4 h-4" />
          </div>
        </div>
      </footer>
    </div>
  );
}
// sync
