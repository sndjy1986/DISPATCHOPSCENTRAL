import { useState, useEffect } from 'react';
import ToneTestTable from '../components/ToneTestTable';
import { Truck, Users, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ToneTestRecord } from '../types';

export default function Dashboard() {
  const [fleetStatus, setFleetStatus] = useState<ToneTestRecord[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'toneTests'), orderBy('unit', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ToneTestRecord));
      setFleetStatus(data);
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-10 selection:bg-indigo-500/30">
      <header className="tactical-header-glow pb-8 border-b border-white/5">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tight">
          Sector <span className="text-indigo-500 not-italic">Matrix</span>
        </h1>
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2">Real-time operational telemetry and fleet integration</p>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="tactical-card p-8 flex items-start gap-6 group hover:border-indigo-500/30 transition-all">
          <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(79,70,229,0.1)] group-hover:shadow-[0_0_25px_rgba(79,70,229,0.4)]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Deployment Capacity</p>
            <div className="space-y-2">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-white">14</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pb-1.5">Alpha Phase</span>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-white text-indigo-400">17</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pb-1.5">Zeta Phase</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tactical-card p-8 flex items-start gap-6 group hover:border-emerald-500/30 transition-all">
          <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]">
            <Truck className="w-6 h-6 transition-transform group-hover:scale-110" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Fleet Telemetry</p>
            <div className="grid grid-cols-2 gap-4">
              {fleetStatus.slice(0, 2).map(unit => (
                <div key={unit.id} className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{unit.unit}</p>
                  <p className="text-lg font-black text-white leading-none tracking-tight">{unit.time || '--:--'}</p>
                </div>
              ))}
              {fleetStatus.length === 0 && (
                <div className="col-span-2 py-4 text-center">
                  <div className="w-4 h-4 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest animate-pulse">Establishing Uplink...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="tactical-card p-8 flex items-start gap-6 group hover:border-rose-500/30 transition-all">
          <div className="w-12 h-12 bg-rose-600/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(225,29,72,0.1)] group-hover:shadow-[0_0_25px_rgba(225,29,72,0.4)]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Operator Briefing</p>
            <div className="p-4 bg-rose-600/5 border border-rose-500/10 rounded-2xl">
              <p className="text-rose-100/70 text-[11px] leading-relaxed font-bold uppercase tracking-wide">
                Validate all tone tests by 08:00. Verify <span className="text-rose-400">10-42</span> status before relief handover. System integrity check required.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <ToneTestTable />
        </div>
        
        {/* Right Panel: Truck Up Time (From Firestore) */}
        <div className="w-full xl:w-72 space-y-6 shrink-0">
          <div className="bg-bg-surface rounded-lg border border-border-subtle shadow-sm overflow-hidden sticky top-6">
            <div className="bg-bg-surface px-4 py-3 border-b border-border-subtle">
              <h3 className="font-bold text-white text-[11px] uppercase tracking-widest flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-brand-blue" />
                Fleet Ready Status
              </h3>
            </div>
            <div className="p-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-text-muted text-[9px] uppercase font-bold">
                    <th className="px-3 py-2">Chassis</th>
                    <th className="px-3 py-2 text-right">Up_Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30">
                  {fleetStatus.map((unit, idx) => (
                    <tr key={unit.id} className={cn(
                      "hover:bg-white/5 transition-colors group cursor-default",
                      idx % 2 === 1 && "bg-bg-main/50"
                    )}>
                      <td className="px-3 py-1.5 text-xs font-bold text-text-primary group-hover:text-brand-blue transition-colors">
                        {unit.unit}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-[10px] text-brand-blue/80">
                        {unit.time || '--:--'}
                      </td>
                    </tr>
                  ))}
                  {fleetStatus.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center text-[10px] text-text-muted italic">
                        No active units found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-bg-surface border-t border-border-subtle">
              <div className="flex items-center justify-between text-[9px] font-bold text-text-muted uppercase tracking-widest">
                <span>Total Assets</span>
                <span className="text-text-primary">{fleetStatus.length} Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// synchronized
