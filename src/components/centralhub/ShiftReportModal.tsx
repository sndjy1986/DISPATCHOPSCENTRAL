import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText } from 'lucide-react';
import ShiftReport from '../../pages/ShiftReport';

interface ShiftReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShiftReportModal({ isOpen, onClose }: ShiftReportModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 backdrop-blur-2xl bg-black/75">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-[#090d16] border border-blue-400/30 rounded-[2rem] w-full max-w-[96vw] h-[94vh] shadow-2xl flex flex-col overflow-hidden relative"
        >
          {/* Top Bar for Modal Controls */}
          <div className="px-6 py-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Operational Shift Report
                </h3>
                <p className="text-[9px] text-blue-400/80 font-mono uppercase tracking-widest">
                  Standalone Modal System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-all border border-white/10 cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body with ShiftReport */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-6 custom-scrollbar no-scrollbar relative z-10 bg-brand-bg/95">
            <ShiftReport isModal={true} onClose={onClose} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
