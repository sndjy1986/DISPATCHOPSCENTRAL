import React, { useState } from 'react';
import { MapPin, Navigation, Info, Layers, ZoomIn, ZoomOut } from 'lucide-react';
import { motion } from 'motion/react';

const markers = [
  { id: 1, x: 200, y: 150, label: 'CP-Alpha', type: 'base' },
  { id: 2, x: 450, y: 300, label: 'U-7 Recon', type: 'unit' },
  { id: 3, x: 600, y: 100, label: 'Sector 4 Node', type: 'node' },
  { id: 4, x: 100, y: 400, label: 'B-3 Signal', type: 'unit' },
];

export function DistanceMap() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full space-y-6 animate-in zoom-in duration-700">
       <div className="flex-1 backdrop-blur-md bg-bg-surface border border-white/10 rounded-3xl relative overflow-hidden flex flex-col transition-colors duration-500">
          {/* SVG Map Layout */}
          <div className="flex-1 relative cursor-crosshair">
             <svg className="w-full h-full min-h-[500px]" viewBox="0 0 800 500">
                {/* Background Grid */}
                <defs>
                   <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
                   </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Radar Circles */}
                <circle cx="400" cy="250" r="100" fill="none" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="1" />
                <circle cx="400" cy="250" r="200" fill="none" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="1" />
                
                {/* Connections */}
                <line x1="400" y1="250" x2="200" y2="150" stroke="rgba(99, 102, 241, 0.2)" strokeDasharray="4 4" />
                <line x1="400" y1="250" x2="450" y2="300" stroke="rgba(16, 185, 129, 0.2)" strokeDasharray="4 4" />

                {/* Markers */}
                {markers.map((m) => (
                   <g key={m.id} className="cursor-pointer" onClick={() => setSelected(m.id)}>
                      <circle 
                         cx={m.x} cy={m.y} r={selected === m.id ? 8 : 4} 
                         fill={m.type === 'unit' ? '#10b981' : m.type === 'base' ? '#6366f1' : '#f59e0b'} 
                         className="transition-all duration-300"
                      />
                      <circle 
                         cx={m.x} cy={m.y} r={selected === m.id ? 15 : 10} 
                         fill="none" 
                         stroke={m.type === 'unit' ? '#10b981' : m.type === 'base' ? '#6366f1' : '#f59e0b'} 
                         strokeWidth="1"
                         className="opacity-20 flex"
                      />
                      {m.label && (
                         <text 
                            x={m.x + 12} y={m.y + 4} 
                            fill="rgba(255,255,255,0.4)" 
                            className="text-[10px] font-mono font-bold uppercase tracking-widest"
                         >
                            {m.label}
                         </text>
                      )}
                   </g>
                ))}
                
                {/* Center Point */}
                <circle cx="400" cy="250" r="6" fill="#6366f1" />
                <circle cx="400" cy="250" r="12" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.3" >
                   <animate attributeName="r" from="12" to="40" dur="3s" repeatCount="indefinite" />
                   <animate attributeName="opacity" from="0.3" to="0" dur="3s" repeatCount="indefinite" />
                </circle>
             </svg>

             {/* UI Overlays */}
             <div className="absolute top-6 left-6 space-y-4">
                <div className="p-4 bg-bg-main/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-3 transition-colors duration-500">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] font-mono">Live Tracking Active</span>
                </div>
                
                <div className="p-4 bg-bg-main/60 backdrop-blur-md border border-white/10 rounded-2xl space-y-3 transition-colors duration-500">
                   <div className="flex items-center gap-2 group cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-white transition-colors">Command Center</span>
                   </div>
                   <div className="flex items-center gap-2 group cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-white transition-colors">Active Units</span>
                   </div>
                   <div className="flex items-center gap-2 group cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-white transition-colors">Relay Nodes</span>
                   </div>
                </div>
             </div>

             <div className="absolute top-6 right-6 flex flex-col gap-2">
                <button className="w-12 h-12 bg-bg-main/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors duration-500">
                   <Layers className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 bg-bg-main/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors duration-500">
                   <ZoomIn className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 bg-bg-main/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors duration-500">
                   <ZoomOut className="w-5 h-5" />
                </button>
             </div>
 
             <div className="absolute bottom-6 left-6 p-4 bg-bg-main/60 backdrop-blur-md border border-white/10 rounded-2xl space-y-1 transition-colors duration-500">
                <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Coordinates</p>
                <p className="text-xs font-mono font-bold text-indigo-400 tracking-tighter">40.7128°N, 74.0060°W</p>
             </div>
          </div>
          
          <div className="h-20 bg-bg-surface/50 border-t border-white/5 px-8 flex items-center justify-between transition-colors duration-500">
             <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                   <Navigation className="w-4 h-4 text-indigo-400" />
                   <div>
                      <p className="text-[9px] uppercase font-bold text-slate-500">Route Efficiency</p>
                      <p className="text-sm font-bold text-white tracking-tight">94.2%</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <Info className="w-4 h-4 text-emerald-400" />
                   <div>
                      <p className="text-[9px] uppercase font-bold text-slate-500">Active Signals</p>
                      <p className="text-sm font-bold text-white tracking-tight">12/12 Stable</p>
                   </div>
                </div>
             </div>
             <button className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                Optimize Grid
             </button>
          </div>
       </div>
    </div>
  );
}
