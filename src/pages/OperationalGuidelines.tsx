import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  ExternalLink, 
  ShieldCheck, 
  FileText, 
  UserCircle,
  ArrowRight,
  Download,
  AlertTriangle
} from 'lucide-react';

const DOCUMENTS = [
  {
    title: "Anderson County SOG",
    description: "Standard Operating Guidelines for Anderson County 911 dispatch operations.",
    url: "https://drive.google.com/file/d/1YRmQRgyxRjqlGWiBLsNaiYhmssqDeCet/view?usp=drive_link",
    icon: ShieldCheck,
    tag: "REQUIRED READING",
    color: "bg-indigo-600"
  },
  {
    title: "Priority Employee Handbook",
    description: "Human resources, workplace policies, and core values handbook for employees.",
    url: "https://drive.google.com/file/d/15IL2nx3foN5V4L2ue6OBAp8kmZkpWzma/view?usp=drive_link",
    icon: UserCircle,
    tag: "HR POLICIES",
    color: "bg-emerald-600"
  },
  {
    title: "Helo Link Portal",
    description: "Access to the transport network for helicopter coordination and monitoring.",
    url: "https://andersoncounty911_sc.transport.net/#/login",
    icon: ExternalLink,
    tag: "OPERATIONAL PORTAL",
    color: "bg-blue-600"
  }
];

export default function OperationalGuidelines() {
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <header className="mb-16">
        <div className="flex items-center gap-6 mb-4">
           <div className="w-14 h-14 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <BookOpen className="w-7 h-7 text-white" />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tight">Guideline <span className="text-indigo-500 not-italic">Vault</span></h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Official Protocols & Handbooks</p>
           </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-indigo-500/30 via-white/5 to-transparent" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {DOCUMENTS.map((doc, idx) => (
          <motion.a 
            key={doc.title}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="tactical-card p-8 group flex flex-col justify-between h-full hover:border-indigo-500/30 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 shadow-2xl transition-all translate-x-4 -translate-y-4">
               <doc.icon size={120} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-8">
                 <div className={`w-12 h-12 ${doc.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <doc.icon size={24} className="text-white" />
                 </div>
                 <span className="text-[9px] font-black px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-500 group-hover:text-white transition-colors">
                   {doc.tag}
                 </span>
              </div>
              
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-4 group-hover:text-indigo-400 transition-colors">
                {doc.title}
              </h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed group-hover:text-slate-300 transition-colors">
                {doc.description}
              </p>
            </div>

            <div className="mt-12 flex items-center justify-between pt-6 border-t border-white/5">
               <div className="flex items-center gap-3">
                  <Download size={14} className="text-slate-700 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-[10px] font-black text-slate-600 group-hover:text-indigo-400 uppercase tracking-widest transition-colors">Launch Resource</span>
               </div>
               <ArrowRight size={18} className="text-slate-700 group-hover:translate-x-2 group-hover:text-indigo-500 transition-all" />
            </div>
          </motion.a>
        ))}
      </div>

      <div className="mt-16 bg-rose-500/5 border border-rose-500/10 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
         <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle className="text-rose-500" size={24} />
         </div>
         <div className="flex-1 text-center md:text-left">
            <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1">Confidential Information</h4>
            <p className="text-xs font-medium text-slate-500 tracking-tight leading-relaxed">
              These guidelines are for authorized personnel only. Distribution or unauthorized access to internal documentation is strictly prohibited under departmental policy.
            </p>
         </div>
      </div>
    </div>
  );
}
