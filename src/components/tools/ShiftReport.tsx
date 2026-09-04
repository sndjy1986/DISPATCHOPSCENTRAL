import React, { useState } from 'react';
import { FileText, Send, Paperclip, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export function ShiftReport() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    incidents: '',
    tasksCompleted: '',
    status: 'Nominal',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-700">
       <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-10">
          <form className="space-y-8" onSubmit={handleSubmit}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block px-1">Functional Status</label>
                   <div className="grid grid-cols-2 gap-3">
                      {['Nominal', 'Alert', 'Advisory', 'Maintenance'].map((s) => (
                         <button
                            key={s}
                            type="button"
                            onClick={() => setFormData({...formData, status: s})}
                            className={`px-4 py-3 rounded-2xl text-[10px] font-bold uppercase transition-all border ${formData.status === s ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                         >
                            {s}
                         </button>
                      ))}
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block px-1">Resource Attachments</label>
                   <button type="button" className="w-full h-24 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-2 group hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-slate-500 hover:text-indigo-400">
                      <Paperclip className="w-6 h-6" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">DRAG OR CLICK TO ATTACH</span>
                   </button>
                </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block px-1">Incident Documentation</label>
                   <textarea 
                      rows={4}
                      value={formData.incidents}
                      onChange={(e) => setFormData({...formData, incidents: e.target.value})}
                      placeholder="Describe any anomalies or operational exceptions recorded during the shift..."
                      className="w-full bg-black/20 border border-white/10 rounded-2xl p-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 resize-none"
                   />
                </div>
                
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block px-1">Objectives & Handoff Notes</label>
                   <textarea 
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Provide primary directives for incoming shift Command..."
                      className="w-full bg-black/20 border border-white/10 rounded-2xl p-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 resize-none"
                   />
                </div>
             </div>

             <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-4">
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">JD</div>
                      <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">SY</div>
                   </div>
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Command Verification Required</span>
                </div>
                
                <button 
                   type="submit"
                   disabled={submitted}
                   className={`px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 ${submitted ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'}`}
                >
                   {submitted ? (
                      <>
                         <CheckCircle2 className="w-4 h-4" />
                         DISPATCHED
                      </>
                   ) : (
                      <>
                         <Send className="w-4 h-4" />
                         SUBMIT LOG
                      </>
                   )}
                </button>
             </div>
          </form>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl flex gap-6">
             <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <AlertTriangle className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Priority Escalation</h4>
                <p className="text-xs text-slate-400">Reports containing 'Alert' status are automatically relayed to District Hub.</p>
             </div>
          </div>
          <div className="p-8 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl flex gap-6">
             <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <Info className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Audit Trail</h4>
                <p className="text-xs text-slate-400">Shift reports are immutable and signed with your biometric hash.</p>
             </div>
          </div>
       </div>
    </div>
  );
}
