import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  fullWidth?: boolean;
}

export function Modal({ isOpen, onClose, title, icon, children, maxWidth = 'max-w-4xl', fullWidth = false }: ModalProps) {
  const actualMaxWidth = fullWidth ? 'max-w-[95vw]' : maxWidth;
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 backdrop-blur-xl bg-black/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`bg-bg-surface border border-white/10 rounded-[2.5rem] w-full ${actualMaxWidth} max-h-[95vh] shadow-2xl flex flex-col overflow-hidden relative`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
            
            <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                {icon && (
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    {icon}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight italic">
                    {title}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">Operations_Modal_Subsystem</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
