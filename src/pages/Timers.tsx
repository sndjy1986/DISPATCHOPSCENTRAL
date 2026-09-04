import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, 
  Play, 
  Square, 
  RotateCcw, 
  AlertTriangle, 
  Bell, 
  History,
  Trash2,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface ActiveTimer {
  id: string;
  label: string;
  duration: number; // in seconds
  remaining: number;
  isActive: boolean;
  type: 'standard' | 'oos' | 'custom';
  startTime: number | null;
  unitNumber?: string;
}

const MED_UNITS = Array.from({ length: 20 }, (_, i) => `MED-${i}`);

export default function Timers() {
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [history, setHistory] = useState<{label: string, finishedAt: number, unitNumber?: string}[]>([]);

  // Timer Tick
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => prev.map(t => {
        if (t.isActive && t.remaining > 0) {
          return { ...t, remaining: t.remaining - 1 };
        }
        if (t.isActive && t.remaining <= 0) {
          // Timer finished
          handleTimerFinish(t);
          return { ...t, isActive: false, remaining: 0 };
        }
        return t;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTimerFinish = (timer: ActiveTimer) => {
    // Play alert sound if needed
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play();
    } catch (e) {}
    
    setHistory(prev => [{ label: timer.label, finishedAt: Date.now(), unitNumber: timer.unitNumber }, ...prev].slice(0, 5));
  };

  const startTimer = (durationMinutes: number, label: string, type: ActiveTimer['type'] = 'standard') => {
    const id = Math.random().toString(36).substring(7);
    setActiveTimers(prev => [...prev, {
      id,
      label,
      duration: durationMinutes * 60,
      remaining: durationMinutes * 60,
      isActive: true,
      type,
      startTime: Date.now()
    }]);
  };

  const toggleTimer = (id: string) => {
    setActiveTimers(prev => prev.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const resetTimer = (id: string) => {
    setActiveTimers(prev => prev.map(t => 
      t.id === id ? { ...t, remaining: t.duration, isActive: false } : t
    ));
  };

  const deleteTimer = (id: string) => {
    setActiveTimers(prev => prev.filter(t => t.id !== id));
  };

  const setUnitNumber = (id: string, unitNumber: string) => {
    setActiveTimers(prev => prev.map(t => 
      t.id === id ? { ...t, unitNumber } : t
    ));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 p-8 h-full bg-brand-bg transition-colors duration-500">
      {/* Header */}
      <div className="xl:col-span-12 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
               <Timer className="w-5 h-5 text-indigo-500" />
             </div>
             <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Temporal Command Console</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Tactical_Interval_Monitoring</p>
             </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '20 MIN TIMER', duration: 20, type: 'standard' as const, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
          { label: '10 MIN TIMER', duration: 10, type: 'standard' as const, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'OUT OF SERVICE', duration: 30, type: 'oos' as const, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => startTimer(action.duration, action.label, action.type)}
            className={cn(
              "p-8 rounded-[2rem] border group transition-all relative overflow-hidden flex flex-col items-start gap-4 active:scale-95",
              action.bg, action.border
            )}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Zap size={80} />
            </div>
            <div className={cn("w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5", action.color)}>
              <Play size={24} />
            </div>
            <div className="text-left relative z-10">
              <h3 className="text-xl font-black text-white uppercase tracking-tight italic">{action.label}</h3>
              <p className={cn("text-[9px] font-black uppercase tracking-[0.4em] mt-1", action.color)}>Initiate Sequence</p>
            </div>
          </button>
        ))}
      </div>

      {/* Active Timers Grid */}
      <div className="xl:col-span-8 space-y-6">
        <div className="flex items-center gap-4 mb-4">
           <Zap className="w-4 h-4 text-indigo-500" />
           <span className="text-xs font-black text-white uppercase tracking-widest">Active Surveillance Streams</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {activeTimers.map((timer) => (
              <motion.div
                key={timer.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className={cn(
                  "tactical-card p-8 relative overflow-hidden group",
                  timer.remaining === 0 ? "border-rose-500/50 bg-rose-500/5" : ""
                )}
              >
                {/* Progress bar background */}
                <div 
                  className={cn(
                    "absolute bottom-0 left-0 h-1 transition-all duration-1000",
                    timer.type === 'oos' ? 'bg-rose-500' : 'bg-indigo-500'
                  )}
                  style={{ width: `${(timer.remaining / timer.duration) * 100}%` }}
                />

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      {timer.label}
                      {timer.unitNumber && (
                        <span className="bg-indigo-500 text-[10px] px-2 py-0.5 rounded text-white italic">
                          {timer.unitNumber}
                        </span>
                      )}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {timer.type === 'oos' ? 'Maintenance Cycle' : 'Standard Watch'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={timer.unitNumber || ""}
                      onChange={(e) => setUnitNumber(timer.id, e.target.value)}
                      className="bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-lg px-2 py-1 outline-none hover:border-indigo-500/50 transition-all cursor-pointer"
                    >
                      <option value="" className="bg-[#101014]">UNIT_ID</option>
                      {MED_UNITS.map(unit => (
                        <option key={unit} value={unit} className="bg-[#101014]">
                          {unit}
                        </option>
                      ))}
                    </select>
                    <button 
                      onClick={() => deleteTimer(timer.id)}
                      className="p-2 text-slate-600 hover:text-rose-500 transition-colors bg-white/5 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-8 py-4">
                   <div className={cn(
                     "text-6xl font-black font-mono tracking-tighter",
                     timer.remaining === 0 ? "text-rose-500 animate-pulse" : "text-white"
                   )}>
                     {formatTime(timer.remaining)}
                   </div>
                   
                   <div className="flex gap-2">
                     <button
                       onClick={() => toggleTimer(timer.id)}
                       className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center border border-indigo-500/30 hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10"
                     >
                       {timer.isActive ? <Square size={18} /> : <Play size={18} />}
                     </button>
                     <button
                       onClick={() => resetTimer(timer.id)}
                       className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center border border-white/5 hover:bg-white/10 hover:text-white transition-all"
                     >
                       <RotateCcw size={18} />
                     </button>
                   </div>
                </div>

                {timer.remaining === 0 && (
                  <div className="absolute top-4 right-16 flex items-center gap-2 px-3 py-1 bg-rose-500 rounded-full">
                     <AlertTriangle size={12} className="text-white" />
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">SIGNAL_EXPIRED</span>
                  </div>
                )}
              </motion.div>
            ))}
            {activeTimers.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center tactical-card opacity-30">
                 <Shield size={48} className="mb-6" />
                 <p className="text-xs font-black uppercase tracking-widest text-white">No Active Chrono-Streams detected</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* History & Status */}
      <div className="xl:col-span-4 space-y-6">
        <div className="tactical-card p-8 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center border border-white/5">
                <History size={18} className="text-slate-400" />
             </div>
             <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Completions</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Session_Audit_Log</p>
             </div>
          </div>

          <div className="space-y-4 flex-1">
            {history.map((item, idx) => (
              <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all" />
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                       {item.label}
                       {item.unitNumber && (
                         <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">
                           {item.unitNumber}
                         </span>
                       )}
                    </p>
                    <p className="text-[8px] text-slate-600 font-bold uppercase mt-1">{format(item.finishedAt, 'HH:mm:ss')}</p>
                  </div>
                </div>
                <div className="text-indigo-500/40 font-mono text-[10px]">COMPLETE</div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="h-40 flex items-center justify-center opacity-20 italic text-[10px] uppercase font-black tracking-widest text-white">
                Log_Empty
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
             <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                <div className="flex items-center gap-3 mb-3">
                  <Clock size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Real-Time Sync</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase">
                  All systems operating within normal temporal parameters. 
                  Synchronized with Atomic Clock Server.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
