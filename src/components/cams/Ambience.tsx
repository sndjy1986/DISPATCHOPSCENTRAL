import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AmbienceProps {
  mode: 'slate-glow' | 'emergency';
}

export const Ambience: React.FC<AmbienceProps> = ({ mode }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-900">
      <AnimatePresence mode="wait">
        <motion.div
          key="slate-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
        >
          {/* Indigo Orb */}
          <div 
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[120px]"
            style={{ backgroundColor: '#6366f1' }}
          />
          {/* Emerald Orb */}
          <div 
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[100px]"
            style={{ backgroundColor: '#10b981' }}
          />
           {/* Subtle Deep Indigo Center */}
           <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-5 blur-[150px]"
            style={{ backgroundColor: '#4f46e5' }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
// sync

