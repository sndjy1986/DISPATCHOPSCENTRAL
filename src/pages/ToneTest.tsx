import ToneTestTable from '../components/ToneTestTable';
import { Activity, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function ToneTest() {
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-8 pb-10 border-b border-white/5 relative tactical-header-glow">
        <div className="space-y-4">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.4)] group-hover:scale-110 transition-transform duration-500">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white uppercase italic">
              Fleet <span className="text-indigo-500 not-italic">Readiness</span>
            </h1>
          </div>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3">
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
            Unit State Tracking & Strategic Performance Monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-2 glass-effect rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Systems Nominal</span>
          </div>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <ToneTestTable />
      </motion.div>
    </div>
  );
}
