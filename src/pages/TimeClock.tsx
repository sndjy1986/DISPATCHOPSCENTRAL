import React, { useState } from 'react';
import { ExternalLink, AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function TimeClockPage() {
  const url = "https://scheduling.esosuite.net/eps/main/TimeClock.ashx?db=priorityambulance";
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="w-full h-full bg-bg-main flex flex-col transition-colors duration-500 overflow-hidden relative">
      <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none" />
      
      <header className="p-8 border-b border-white/5 flex justify-between items-center shrink-0 tactical-header-glow bg-black/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight italic">Time <span className="text-indigo-500 not-italic">Uplink</span></h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">External Protocol Gateway</p>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="tactical-card p-12 max-w-xl space-y-8 relative group"
        >
          <div className="w-20 h-20 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)] group-hover:scale-110 transition-transform">
            <AlertCircle className="w-10 h-10 text-rose-500 animate-pulse" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Secure <span className="text-rose-500 not-italic">Isolation</span></h2>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Organizational security policies (X-Frame-Options) prevent embedding the ESO Time Clock platform within this matrix. 
              The connection must be established via a direct encrypted portal.
            </p>
          </div>

          <div className="pt-8">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="tactical-btn-indigo px-10 py-5 flex items-center justify-center gap-3 w-full shadow-indigo-500/30"
            >
              <ExternalLink className="w-5 h-5" /> ESTABLISH SECURE LINK
            </a>
          </div>
        </motion.div>

        {/* Global HUD elements */}
        <div className="absolute bottom-10 left-10 p-4 border border-white/5 rounded-2xl bg-black/20 pointer-events-none">
          <div className="text-[9px] font-mono text-slate-500 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PROTO: ESO_EPS_v4</span>
            </div>
            <div>STATUS: STANDBY</div>
          </div>
        </div>
      </div>
    </div>
  );
}
