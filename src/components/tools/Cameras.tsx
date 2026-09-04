import React from 'react';
import { Camera, Maximize2, Shield, Eye } from 'lucide-react';
import { motion } from 'motion/react';

const channels = [
  { id: 'CAM-01', label: 'Main Perimeter', status: 'Online' },
  { id: 'CAM-02', label: 'Sector 7 Access', status: 'Online' },
  { id: 'CAM-03', label: 'Storage Bay B', status: 'Online' },
  { id: 'CAM-04', label: 'Rear Loading Dock', status: 'Warning' },
  { id: 'CAM-05', label: 'Command Deck Entry', status: 'Online' },
  { id: 'CAM-06', label: 'Server Room 4', status: 'Online' },
];

export function Cameras() {
  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((cam, idx) => (
             <motion.div 
                key={cam.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl overflow-hidden aspect-video cursor-crosshair shadow-lg"
             >
                {/* Static Placeholder Background */}
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center opacity-40">
                   <div className="w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]" />
                </div>
                
                {/* Technical Overlays */}
                <div className="absolute inset-0 flex flex-col p-4">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <div className="px-2 py-0.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-md inline-flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${cam.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            <span className="text-[9px] font-bold text-white uppercase tracking-widest">{cam.id}</span>
                         </div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">{cam.label}</p>
                      </div>
                      <button className="p-2 bg-black/20 text-white/50 hover:text-white rounded-lg transition-colors">
                         <Maximize2 className="w-4 h-4" />
                      </button>
                   </div>
                   
                   <div className="mt-auto flex justify-between items-end">
                      <div className="space-y-1 text-white/40 font-mono text-[9px] uppercase tracking-tighter">
                         <p>REC • {new Date().toLocaleTimeString()}</p>
                         <p>LUX: 12.4 • FPS: 60.0</p>
                      </div>
                      <div className="w-6 h-6 border-b border-r border-white/20" />
                   </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 m-3 group-hover:scale-110 transition-transform" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/10 m-3 group-hover:scale-110 transition-transform" />
                
                {/* Center Reticle */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-40 transition-opacity">
                   <div className="w-8 h-8 border border-white/20 rounded-full" />
                   <div className="absolute w-4 h-[1px] bg-white/40" />
                   <div className="absolute h-4 w-[1px] bg-white/40" />
                </div>
             </motion.div>
          ))}
       </div>

       <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
             <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-indigo-400" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Security Matrix</h3>
                <p className="text-sm text-slate-400">All surveillance primary loops are operating within parameters.</p>
             </div>
          </div>
          <div className="flex gap-4">
             <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                <Eye className="w-4 h-4" /> Loop Toggle
             </button>
             <button className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-rose-500/20">
                Seal Perimeter
             </button>
          </div>
       </div>
    </div>
  );
}
