import React, { useState, useEffect, useRef } from 'react';
import { Search, Map as MapIcon, List, AlertCircle, Info, Navigation } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TRANSPORT_ADDRS, QRV_UNITS } from '../../lib/dispatchConstants';
import { MAPBOX_TOKEN } from '../../lib/distanceConstants';

const COUNTER_API = "https://api.sndjy.us/api/increment";
const API_LIMIT = 10000;

mapboxgl.accessToken = MAPBOX_TOKEN;

interface Result {
  name: string;
  addr: string;
  distance: string;
  duration: number;
  coords: [number, number];
}

// Coordinate cache to prevent redundant geocoding and rate limiting
const coordCache: Record<string, [number, number]> = {};

export default function DistanceChecker({ isDark }: { isDark?: boolean }) {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('');
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [isLimited, setIsLimited] = useState(false);
  const [results, setResults] = useState<{ transport: Result[], qrv: Result[] } | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  useEffect(() => {
    if (view === 'map' && destCoords && mapContainer.current) {
      if (!map.current) {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: isDark ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/light-v11',
          center: destCoords,
          zoom: 11
        });
      } else {
        map.current.flyTo({ center: destCoords, zoom: 12 });
      }

      if (marker.current) marker.current.remove();
      marker.current = new mapboxgl.Marker({ color: '#2c82ff' })
        .setLngLat(destCoords)
        .addTo(map.current);
    }
  }, [view, destCoords, isDark]);

  const fetchUsage = async () => {
    // Disabled external tracking
    setUsageCount(0);
  };

  const incrementUsage = async (amount: number) => {
    // Disabled external tracking
  };

  const geocode = async (addr: string): Promise<[number, number]> => {
    if (coordCache[addr]) return coordCache[addr];

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.features || data.features.length === 0) throw new Error("Location not found");
    
    const center = data.features[0].center as [number, number];
    coordCache[addr] = center;
    return center;
  };

  const processUnitGroup = async (units: { name: string, addr: string }[], dest: [number, number]) => {
    // Geocode unit addresses (sequentially or in small chunks would be better, but we have a cache now)
    const unitCoords = await Promise.all(units.map(u => geocode(u.addr)));
    const coordString = [dest.join(','), ...unitCoords.map(c => c.join(','))].join(';');
    
    const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordString}?sources=0&annotations=distance,duration&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== 'Ok') throw new Error("Calculation failure");

    return units.map((u, i) => ({
      name: u.name,
      addr: u.addr,
      distance: (data.distances[0][i+1] * 0.000621371).toFixed(2), // meters to miles
      duration: Math.round(data.durations[0][i+1] / 60), // seconds to minutes
      coords: unitCoords[i]
    })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || isLimited || isLoading) return;

    setIsLoading(true);
    setStatus("Locating destination...");
    
    try {
      const destC = await geocode(address);
      setDestCoords(destC);
      setStatus("Calculating routes...");

      const transportUnits = Object.entries(TRANSPORT_ADDRS).map(([name, addr]) => ({ name, addr }));
      
      const [transportRes, qrvRes] = await Promise.all([
        processUnitGroup(transportUnits, destC),
        processUnitGroup(QRV_UNITS, destC)
      ]);

      setResults({ transport: transportRes, qrv: qrvRes });
      
      const totalCost = 1 + transportUnits.length + QRV_UNITS.length;
      incrementUsage(totalCost);
      
      setStatus("Closest units identified.");
    } catch (err: any) {
      setStatus("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full p-4 transition-colors ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'} text-xs overflow-hidden`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className={`text-lg font-black uppercase tracking-tighter ${isDark ? 'text-logistics-blue' : 'text-logistics-blue'}`}>Unit Distance Checker</h2>
          <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>MAPBOX INTELLIGENCE ENGINE</p>
        </div>
        <div className={`border rounded px-2 py-1 font-mono text-[9px] shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
          USAGE: <span className={isLimited ? "text-bright-red" : "text-logistics-blue font-bold"}>
            {usageCount?.toLocaleString() || '...'}
          </span> / {API_LIMIT.toLocaleString()}
        </div>
      </div>

      <div className={`p-3 rounded-xl mb-4 shadow-sm border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address (e.g. 5531 Airport Rd)"
            className={`flex-1 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-logistics-blue/20 transition-all ${isDark ? 'bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600' : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
          />
          <button 
            type="submit"
            disabled={isLimited || isLoading || !address}
            className="bg-logistics-blue hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-600 px-4 py-2 rounded-lg font-black uppercase transition-colors shrink-0 text-white shadow-lg active:scale-95 text-[10px]"
          >
            {isLoading ? 'Calculat...' : 'Check'}
          </button>
        </form>
        <div className="mt-3 flex items-center justify-between">
          <div className={`text-[10px] font-bold ${status.includes('Error') ? 'text-bright-red' : (isDark ? 'text-zinc-500' : 'text-slate-400')}`}>
            {status || 'SYSTEM READY'}
          </div>
          <div className="flex gap-1.5">
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? (isDark ? 'bg-zinc-800 text-logistics-blue shadow-inner' : 'bg-slate-100 text-logistics-blue shadow-inner') : (isDark ? 'text-zinc-600 hover:text-zinc-400' : 'text-slate-400 hover:text-slate-600')}`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setView('map')}
              className={`p-2 rounded-lg transition-all ${view === 'map' ? (isDark ? 'bg-zinc-800 text-logistics-blue shadow-inner' : 'bg-slate-100 text-logistics-blue shadow-inner') : (isDark ? 'text-zinc-600 hover:text-zinc-400' : 'text-slate-400 hover:text-slate-600')}`}
              title="Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {!results && !isLoading && (
        <div className={`flex-1 flex flex-col items-center justify-center ${isDark ? 'text-zinc-800' : 'text-slate-300'}`}>
          <Search className="w-16 h-16 mb-4 stroke-1 opacity-20" />
          <p className="uppercase font-black tracking-[0.2em] text-[10px]">Awaiting Destination Vector</p>
        </div>
      )}

      {results && view === 'list' && (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          <div>
            <h3 className={`text-[10px] font-black uppercase mb-3 border-b pb-1 tracking-widest ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-slate-400 border-slate-100'}`}>Transport Assets</h3>
            <div className="space-y-1">
              {results.transport.map((r, i) => (
                <div key={r.name} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${i === 0 ? (isDark ? 'bg-logistics-blue/10 border-logistics-blue/20 text-logistics-blue' : 'bg-logistics-blue/5 border-logistics-blue/10 text-logistics-blue') : (isDark ? 'border-transparent text-zinc-400' : 'border-transparent text-slate-600')}`}>
                  <span className="font-black text-[11px]">{r.name}</span>
                  <div className="flex gap-4 font-mono text-[10px]">
                    <span className="opacity-60">{r.distance} mi</span>
                    <span className="font-black">{r.duration}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className={`text-[10px] font-black uppercase mb-3 border-b pb-1 tracking-widest ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-slate-400 border-slate-100'}`}>QRV Response</h3>
            <div className="space-y-1">
              {results.qrv.map((r, i) => (
                <div key={r.name} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${i === 0 ? (isDark ? 'bg-hosp-orange/10 border-hosp-orange/20 text-hosp-orange' : 'bg-hosp-orange/5 border-hosp-orange/10 text-hosp-orange') : (isDark ? 'border-transparent text-zinc-400' : 'border-transparent text-slate-600')}`}>
                  <span className="font-black text-[11px]">{r.name}</span>
                  <div className="flex gap-4 font-mono text-[10px]">
                    <span className="opacity-60">{r.distance} mi</span>
                    <span className="font-black">{r.duration}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {results && view === 'map' && (
        <div className={`flex-1 relative rounded-xl border overflow-hidden shadow-inner ${isDark ? 'border-zinc-800 bg-black' : 'border-slate-200 bg-slate-100'}`}>
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      )}

      <div className={`mt-4 p-3 rounded-xl border text-[9px] leading-tight shadow-sm shrink-0 ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-white border-slate-100 text-slate-400'}`}>
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-logistics-blue shrink-0" />
          <p>
            Network logic calculated via Mapbox API. Standard variance applies. 
            <span className="block mt-1 font-bold italic">Coverage is calculated for all units simultaneously.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
// sync
