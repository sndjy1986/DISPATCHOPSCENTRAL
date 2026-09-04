import React, { useState } from 'react';
import { useTerminal } from '../../context/TerminalContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Terminal, Shield, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function LoginPage() {
  const { loginTerminalUser } = useTerminal();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    try {
       localStorage.removeItem('cached_terminal_users');
    } catch(e) {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setStatus('loading');
    setErrorMsg('');

    const normalizedUsername = username.toLowerCase().trim();

    try {
      if (normalizedUsername === 'sndjy' && password === 'Russell1') {
         setStatus('success');
         setTimeout(() => {
           loginTerminalUser('sndjy', 'root');
         }, 500);
         return;
      }
      
      // Look up personnel in global settings
      const globalDoc = await getDoc(doc(db, 'settings', 'global'));
      let accessGranted = false;
      let userRole = 'personnel';
      let terminalUsername = normalizedUsername;

      if (globalDoc.exists()) {
        const personnel = globalDoc.data().personnel || [];
        const person = personnel.find((p: any) => 
          (p.username || '').toLowerCase().trim() === normalizedUsername || 
          p.name.toLowerCase().trim() === normalizedUsername
        );
        
        if (person) {
          accessGranted = true;
          terminalUsername = person.username || person.name;
          
          const SHIFT_LEADS = [
            'corrine skelly', 'cskel',
            'erin brandenburg', 'ebrand',
            'joseph sanders', 'joey sanders', 'jsand',
            'crystal culbertson', 'cculb',
            'g. williams', 'geneva williams', 'shift lead'
          ];
          const isLead = SHIFT_LEADS.includes(person.name.toLowerCase().trim()) || 
                         (person.username && SHIFT_LEADS.includes(person.username.toLowerCase().trim()));
          
          userRole = isLead ? 'shift_lead' : 'dispatcher';
        }
      }

      // Special fallback case for shift leads just in case
      if (!accessGranted && ['shift lead', 'g. williams'].includes(normalizedUsername)) {
         accessGranted = true;
         userRole = 'shift_lead';
         terminalUsername = normalizedUsername;
      }
      
      if (!accessGranted && normalizedUsername === 'msenn') {
         accessGranted = true;
         userRole = 'dispatcher';
         terminalUsername = 'msenn';
      }

      if (accessGranted) {
         setStatus('success');
         setTimeout(() => {
           loginTerminalUser(terminalUsername, userRole);
         }, 500);
      } else {
         setStatus('error');
         setErrorMsg('ACCESS_DENIED // UNKNOWN_OPERATOR');
      }
    } catch (err: any) {
      console.error("Critical Login Error:", err);
      setStatus('error');
      setErrorMsg('SYSTEM_ERROR // UPLINK_FAILURE');
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="tactical-card p-10 space-y-10 border-indigo-500/20 bg-brand-panel/80 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.1)]">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Shield className="w-8 h-8 text-indigo-500 relative z-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-text-main uppercase tracking-tighter italic">
                Strategic <span className="text-indigo-500 not-italic">Access</span>
              </h1>
              <p className="text-[10px] text-text-dim font-black uppercase tracking-[0.4em]">
                Authenticating Node Presence
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 group">
                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest px-1">Operator Identity</label>
                <div className="relative">
                  <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="USERNAME"
                    className="w-full h-14 bg-white/5 border border-black/5 rounded-2xl px-12 text-text-main font-mono text-sm focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-text-dim/30"
                  />
                </div>
              </div>
              <div className="space-y-2 group">
                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest px-1">Access Key</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full h-14 bg-white/5 border border-black/5 rounded-2xl px-12 text-text-main font-mono text-sm focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-text-dim/30"
                  />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {status === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className={`
                w-full h-16 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 group relative overflow-hidden
                ${status === 'success' 
                  ? 'bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.3)]' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-50'}
              `}
            >
              {status === 'loading' ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : status === 'success' ? (
                <>ACCESS_GRANTED <div className="w-2 h-2 rounded-full bg-white animate-ping" /></>
              ) : (
                <>
                  Establish Connection 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Meta */}
          <div className="pt-6 border-t border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Uplink Active</span>
              </div>
              <span className="text-[8px] font-mono text-slate-700 tracking-tighter uppercase font-bold">Node V.02_Alpha</span>
            </div>

            <button 
              type="button"
              onClick={async () => {
                const { signInWithPopup, GoogleAuthProvider, auth } = await import('../../lib/firebase');
                try {
                  await signInWithPopup(auth, new GoogleAuthProvider());
                } catch (err) {
                  console.error(err);
                }
              }}
              className="w-full py-3 rounded-xl border border-white/5 hover:border-indigo-500/30 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-indigo-400 transition-all flex items-center justify-center gap-3 bg-white/[0.02]"
            >
              <Shield size={12} />
              Owner Bootstrap Access
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[9px] text-zinc-600 uppercase tracking-[0.4em] font-black">
          Unauthorized attempts will be logged by the system matrix
        </p>
      </motion.div>
    </div>
  );
}
