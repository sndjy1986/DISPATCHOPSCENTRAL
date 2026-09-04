import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  User, 
  Truck, 
  Shield, 
  Mail, 
  Search, 
  X, 
  ExternalLink, 
  Clipboard, 
  History, 
  PlusCircle, 
  Trash2, 
  Settings, 
  Save,
  Maximize2
} from 'lucide-react';
import { doc, onSnapshot, db, auth, updateGlobalSettings, signIn, PersonnelMember } from '../lib/firebase';
import { MEDSUP_MAP } from '../lib/shiftConstants';

const DIRECTORY_DATA = [
  {
    title: "Emergency & Public Services",
    contacts: [
      { name: "Steven Kelly", title: "(EMS-1) EMS Director", phone: "864-844-4131" },
      { name: "Don McCown", title: "(EMS-2) EMS Coordinator", phone: "864-444-0715" },
      { name: "Cory Freeman", title: "(EMS 3) Operations Manager", phone: "864-532-1065" },
      { name: "Geneva Williams", title: "Communications Supervisor", phone: "864-791-0121" },
      { name: "Rhonda Brooks", title: "Operations Manager", phone: "864-276-9936" },
      { name: "Supervisor Number", title: "Medshore (Multiple)", phone: "864-844-4354" },
      { name: "Anmed Comms Room", title: "Comm Room", phone: "864-512-1344" },
    ]
  },
  {
    title: "Coroner's Office",
    contacts: [
      { name: "G. Shore", title: "Z-1", phone: "864-444-6727" },
      { name: "D. McCown", title: "Z-3", phone: "864-444-0715" },
      { name: "T. Blackwell", title: "Z-7", phone: "864-318-4915" },
      { name: "A. Whitfield", title: "Z-9", phone: "864-795-2633" },
      { name: "S. Sullivan", title: "Z-10", phone: "864-795-0886" },
      { name: "K. Williamson", title: "Z-11", phone: "864-749-9159" },
      { name: "C. Freeman", title: "Z-14", phone: "864-532-1065" },
      { name: "R. Ables", title: "Z-15", phone: "864-642-8853" },
      { name: "S. Kaufman", title: "Z-18", phone: "864-932-7179" },
    ]
  },
  {
    title: "QRV Supervisor's",
    contacts: [
      { name: "Shanda Shore", title: "A Shift Captain", phone: "864-749-7004" },
      { name: "Joe Kennedy", title: "B Shift Captain", phone: "864-749-7008" },
      { name: "Jared Bingel", title: "C Shift Captain", phone: "864-749-6208" },
      { name: "Joseph \"Alex\" Kay", title: "D Shift Captain", phone: "864-749-7013" },
    ]
  }
];

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);
  const [supervisors, setSupervisors] = useState<Record<string, string>>(MEDSUP_MAP);
  const [user, setUser] = useState(auth.currentUser);
  const [isManagementMode, setIsManagementMode] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUser(u));
  }, []);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.personnel) setPersonnel(data.personnel);
        if (data.supervisors) setSupervisors(data.supervisors);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const filteredDirectory = DIRECTORY_DATA.map(section => ({
    ...section,
    contacts: section.contacts.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    )
  })).filter(section => section.contacts.length > 0);

  const filteredPersonnel = personnel.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.phone && p.phone.includes(searchTerm)) ||
    p.shift.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredSupervisors = Object.entries(supervisors).filter(([name, email]) => 
    name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase flex items-center gap-4">
            <Phone className="w-10 h-10 text-indigo-500" />
            Operations Directory
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Internal contact registry for Medshore Ambulance Service.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search registry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-surface border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm"
            />
          </div>

          {!user ? (
            <button 
              onClick={() => signIn().then(() => setShowToast("Access Granted"))}
              className="p-4 bg-bg-surface rounded-2xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
              title="Management Login"
            >
              <Settings className="w-6 h-6" />
            </button>
          ) : (
            <button 
              onClick={() => setIsManagementMode(!isManagementMode)}
              className={`p-4 rounded-2xl transition-all border shadow-lg duration-500 ${isManagementMode ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-bg-surface text-slate-400 border-white/10 hover:text-white'}`}
              title={isManagementMode ? "Exit Management" : "Access Management"}
            >
              <Settings className={`w-6 h-6 ${isManagementMode ? 'animate-spin-slow' : ''}`} />
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Main Contacts */}
        <div className="xl:col-span-2 space-y-12">
          {filteredDirectory.map((section, sIdx) => (
            <section key={sIdx} className="space-y-6">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                  {section.title}
                </h2>
                <span className="text-[10px] font-mono text-slate-600">{section.contacts.length} Records</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.contacts.map((contact, cIdx) => (
                  <div key={cIdx} className="p-6 transition-all duration-500 bg-bg-surface border border-white/5 rounded-3xl hover:bg-white/10 hover:border-indigo-500/30 group flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white tracking-tight">{contact.name}</div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1">{contact.title}</div>
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <Phone className="w-3 h-3 text-indigo-400" />
                        <span className="text-xs font-mono font-bold text-indigo-300">{contact.phone}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(contact.phone);
                        setShowToast(`Copied: ${contact.phone}`);
                      }}
                      className="p-3 bg-bg-main text-slate-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-lg active:scale-95 duration-500"
                      title="Copy Number"
                    >
                      <Clipboard className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
          
          {filteredDirectory.length === 0 && searchTerm && (
            <div className="py-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs border-2 border-dashed border-white/5 rounded-[3rem]">
              No matching internal contacts found
            </div>
          )}
        </div>

        {/* Sidebar: Roster & Supervisors */}
        <div className="space-y-12">
          {/* Supervisors Section */}
          <section className="backdrop-blur-md bg-bg-surface border border-white/10 rounded-[2.5rem] p-8 space-y-6 transition-colors duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <Truck className="w-5 h-5 text-emerald-400" />
                Supervisors
              </h3>
              {isManagementMode && (
                <button 
                  onClick={() => {
                    const name = window.prompt("New Supervisor Name:");
                    if (name?.trim()) {
                      const email = window.prompt("Email (optional):");
                      const newSups = { ...supervisors, [name.trim()]: (email || "").trim() };
                      setSupervisors(newSups);
                      updateGlobalSettings({ supervisors: newSups });
                    }
                  }}
                  className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              {filteredSupervisors.length > 0 ? filteredSupervisors.map(([name, email]) => (
                <div key={name} className="p-4 bg-bg-main rounded-2xl border border-white/5 flex items-center justify-between group transition-colors duration-500">
                  <div>
                    <div className="text-xs font-bold text-white">{name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 lowercase truncate">{email || 'No email'}</div>
                  </div>
                  {isManagementMode && (
                    <div className="flex items-center gap-1">
                       <button onClick={() => {
                         const n = window.prompt("Update Email:", email);
                         if (n !== null) {
                           const newSups = { ...supervisors, [name]: n.trim() };
                           setSupervisors(newSups);
                           updateGlobalSettings({ supervisors: newSups });
                         }
                       }} className="p-2 text-slate-500 hover:text-indigo-400"><Maximize2 className="w-3.5 h-3.5" /></button>
                       <button onClick={() => {
                         if (confirm(`Delete ${name}?`)) {
                           const newSups = { ...supervisors };
                           delete newSups[name];
                           setSupervisors(newSups);
                           updateGlobalSettings({ supervisors: newSups });
                         }
                       }} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-xs text-slate-600 italic">No supervisors matching search</p>
              )}
            </div>
          </section>

          {/* Roster Section */}
          <section className="backdrop-blur-md bg-bg-surface border border-white/10 rounded-[2.5rem] p-8 space-y-6 h-[500px] flex flex-col transition-colors duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <User className="w-5 h-5 text-indigo-400" />
                Active Roster
              </h3>
              {isManagementMode && (
                <div className="text-[10px] text-slate-500 font-black uppercase">Edit in Admin Panel</div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
              {filteredPersonnel.length > 0 ? filteredPersonnel.map(p => (
                <div key={p.id} className="p-4 bg-bg-main rounded-2xl border border-white/5 flex items-center justify-between group transition-colors duration-500">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{p.shift} SHIFT {p.phone ? `• ${p.phone}` : ''}</span>
                  </div>
                  {p.phone && (
                    <button onClick={() => {
                        navigator.clipboard.writeText(p.phone!);
                        setShowToast(`Copied: ${p.phone}`);
                      }} className="p-2 text-slate-500 hover:text-indigo-400 transition-all">
                      <Clipboard className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )) : (
                <p className="text-xs text-slate-600 italic">No personnel matching search</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-3 shadow-2xl"
          >
            <Shield className="w-4 h-4" />
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}} />
    </div>
  );
}
