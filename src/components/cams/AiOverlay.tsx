import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AiAnalysisResult } from '../../lib/camsTypes';

interface AiOverlayProps {
  analysis: AiAnalysisResult | null;
  isAnalyzing: boolean;
  videoWidth: number;
  videoHeight: number;
}

export const AiOverlay: React.FC<AiOverlayProps> = ({ 
  analysis, 
  isAnalyzing 
}) => {
  const getDetColor = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('truck') || l.includes('bus')) return 'orange';
    if (l.includes('pedestrian') || l.includes('person')) return 'emerald';
    return 'indigo';
  };

  const colorMap = {
    indigo: 'border-indigo-500/70 shadow-[0_0_10px_rgba(99,102,241,0.5)] bg-indigo-500/10 text-indigo-400',
    orange: 'border-orange-500/70 shadow-[0_0_10px_rgba(249,115,22,0.5)] bg-orange-500/10 text-orange-500',
    emerald: 'border-emerald-500/70 shadow-[0_0_10px_rgba(16,185,129,0.5)] bg-emerald-500/10 text-emerald-400'
  };

  const bgMap = {
    indigo: 'bg-indigo-500',
    orange: 'bg-orange-500',
    emerald: 'bg-emerald-500'
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden font-sans">
      {/* Subtle Loading Indicator */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-6 flex items-center gap-3 bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 px-3 py-1.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_#6366f1]" />
            <span className="text-[9px] text-indigo-400 font-black tracking-[0.2em] uppercase">Node Analyzing...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// sync;
