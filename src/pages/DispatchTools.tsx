import React from 'react';
import { motion } from 'motion/react';
import { 
  Map as MapIcon, 
  Flame, 
  ExternalLink, 
  Layout, 
  ArrowRight,
  ShieldAlert,
  Truck
} from 'lucide-react';

const TOOLS = [
  {
    title: "Posting Plan",
    description: "Real-time deployment and unit positioning plan for Anderson County.",
    url: "https://docs.google.com/spreadsheets/d/1AbNC8FCxYZkFCaYIhcIBLSmgUPsIEEa9pyiPOKW9lXQ/edit?usp=drive_link",
    icon: MapIcon,
    tag: "LIVE DEPLOYMENT",
    theme: "indigo"
  },
  {
    title: "Fire Response Reference",
    description: "Detailed protocols for fire department responses and mutual aid configuration.",
    url: "https://docs.google.com/spreadsheets/d/1-4Uwh00g4orCaOQoOrLIcRkamAhdxrBNhVVOt2IEOoY/edit#gid=0",
    icon: Flame,
    tag: "FIRE PROTOCOLS",
    theme: "rose"
  },
  {
    title: "AVL Cleanup Tool",
    description: "Automated Vehicle Location cleanup and verification matrix.",
    url: "https://docs.google.com/spreadsheets/d/12V94dal4UvVJcsRMBd3fCj49pJjiOXFMTgZa1tdaEE0/edit?gid=1621560398#gid=1621560398",
    icon: Truck,
    tag: "FLEET OVERSIGHT",
    theme: "emerald"
  },
  {
    title: "Helo Tracker",
    description: "Real-time helicopter tracking system.",
    url: "https://helotracker.pages.dev/",
    icon: MapIcon,
    tag: "AIR OVERSIGHT",
    theme: "indigo"
  }
];

export default function DispatchTools() {
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <header className="mb-16">
        <div className="flex items-center gap-6 mb-4">
           <div className="w-14 h-14 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <Layout className="w-7 h-7 text-white" />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tight">Tactical <span className="text-indigo-500 not-italic">Matrices</span></h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Operational Deployment & Response Tools</p>
           </div>
        </div>
      </header>

      <div className="space-y-8">
        {TOOLS.map((tool, idx) => (
          <motion.a
            key={tool.title}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="tactical-card p-0 overflow-hidden group flex flex-col md:flex-row hover:border-indigo-500/30 transition-all border-white/5 bg-[#101014]/40"
          >
            <div className={`w-full md:w-64 p-10 flex items-center justify-center bg-gradient-to-br transition-all duration-700 ${
              tool.theme === 'indigo' ? 'from-indigo-600 to-indigo-900 group-hover:from-indigo-500' : 
              tool.theme === 'emerald' ? 'from-emerald-600 to-emerald-900 group-hover:from-emerald-500' :
              'from-rose-600 to-rose-900 group-hover:from-rose-500'
            }`}>
               <tool.icon size={64} className="text-white drop-shadow-2xl group-hover:scale-125 transition-transform duration-700" />
            </div>
            
            <div className="flex-1 p-10 flex flex-col justify-between">
               <div>
                  <div className="flex items-center justify-between mb-4">
                     <span className={`text-[9px] font-black px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-500 group-hover:text-white transition-colors`}>
                       {tool.tag}
                     </span>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Live Document</span>
                     </div>
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tight mb-4 group-hover:text-indigo-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed group-hover:text-slate-300 transition-colors max-w-xl">
                    {tool.description}
                  </p>
               </div>

               <div className="mt-10 flex items-center gap-6">
                  <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 group-hover:border-indigo-500/30 transition-all">
                     <ExternalLink size={14} className="text-indigo-500" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Open Deployment Grid</span>
                     <ArrowRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                  </div>
               </div>
            </div>
          </motion.a>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="p-8 bg-indigo-500/5 rounded-[2.5rem] border border-indigo-500/10 flex items-start gap-6">
            <ShieldAlert className="text-indigo-500 shrink-0 mt-1" size={24} />
            <div>
               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Protocol Integrity</h4>
               <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                 "Deployment plans are dynamic and subject to change based on real-time operational demands. Always verify unit status via the Command Console."
               </p>
            </div>
         </div>
         <div className="p-8 bg-rose-500/5 rounded-[2.5rem] border border-rose-500/10 flex items-start gap-6">
            <Truck className="text-rose-500 shrink-0 mt-1" size={24} />
            <div>
               <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Resource Monitoring</h4>
               <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                 "Fire response assets must be assigned in accordance with the reciprocal mutual aid agreement as outlined in the Fire Reference grid."
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
