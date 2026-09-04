import { Unit } from '../../lib/distanceConstants';
import { motion, AnimatePresence } from 'motion/react';

interface UnitTableProps {
  title: string;
  units: Unit[];
  loading?: boolean;
}

export default function UnitTable({ title, units, loading }: UnitTableProps) {
  if (!loading && units.length === 0) return null;

  return (
    <div className="bg-brand-panel border border-brand-border rounded-2xl flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-brand-indigo/10 border-b border-brand-border flex justify-between items-center">
        <h2 className="text-sm font-bold text-text-main">{title}</h2>
        <span className="text-[10px] bg-brand-blue/20 text-brand-blue px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Priority Order</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wider">Unit</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wider">Dist</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wider text-right">ETA</th>
            </tr>
          </thead>
          <tbody>
             <AnimatePresence mode="popLayout">
              {units.map((unit, idx) => (
                <motion.tr 
                  key={unit.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`border-b border-brand-border/30 transition-colors hover:bg-brand-indigo/5 ${idx === 0 ? 'bg-brand-indigo/15 border-l-2 border-l-brand-indigo' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-sm text-white tracking-wide">{unit.name}</div>
                    <div className="text-[11px] text-zinc-300 truncate max-w-[190px] uppercase font-bold mt-0.5 tracking-wider">{unit.addr}</div>
                  </td>
                  <td className="px-4 py-3 text-indigo-200 font-mono text-xs font-semibold">
                    {unit.distance !== undefined ? `${unit.distance.toFixed(2)}mi` : '--'}
                  </td>
                  <td className={`px-4 py-3 font-mono text-xs text-right ${idx === 0 ? 'text-brand-emerald font-extrabold shadow-sm' : 'text-zinc-400'}`}>
                    {unit.duration !== undefined ? `${unit.duration}m` : '--'}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
// sync
