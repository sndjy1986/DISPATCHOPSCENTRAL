import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { UserProfile, UserRole, AppSettings } from '../types';
import { Shield, UserPlus, Trash2, Loader2, CheckCircle2, DatabaseZap, Siren, ToggleLeft as Toggle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { seedInitialData } from '../lib/seed';
import { cn } from '../lib/utils';
import { useAuthRole as useRole } from '../hooks/useAuthRole';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('viewer');
  const [isSeeding, setIsSeeding] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const { isAdmin } = useRole();

  useEffect(() => {
    let unsubSettings: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (!unsubSettings) {
          unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
            if (snapshot.exists()) {
              setSettings({ id: snapshot.id, ...snapshot.data() } as AppSettings);
            } else {
              setSettings({ emergencyMode: false });
            }
          }, (error) => {
              handleFirestoreError(error, OperationType.GET, 'settings/global');
          });
        }
        
        if (!unsubUsers) {
          unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            setUsers(data);
            setLoading(false);
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'users');
          });
        }
      } else {
        setUsers([]);
        setLoading(false);
        if (unsubSettings) {
          unsubSettings();
          unsubSettings = null;
        }
        if (unsubUsers) {
          unsubUsers();
          unsubUsers = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubSettings) unsubSettings();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  const toggleEmergencyMode = async () => {
    if (!isAdmin) return;
    const path = 'settings/global';
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        emergencyMode: !settings?.emergencyMode,
        emergencyBackgroundOpacity: settings?.emergencyBackgroundOpacity ?? 15,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleSeed = async () => {
    if (!isAdmin) return;
    setIsSeeding(true);
    try {
      await seedInitialData();
      alert('Initial data seeded successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seed');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !isAdmin) return;
    
    const path = 'users/new';
    try {
      const id = btoa(newEmail).replace(/\//g, '_').replace(/\+/g, '-');
      await setDoc(doc(db, 'users', id), {
        email: newEmail,
        role: newRole
      });
      setNewEmail('');
      setNewRole('viewer');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleRemoveUser = async (id: string) => {
    if (!isAdmin) return;
    const path = `users/${id}`;
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted">
        <Shield className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-bold uppercase tracking-widest text-xs">Authorization Required</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10 min-h-full">
      <header className="flex flex-wrap items-center justify-between gap-8 pb-10 border-b border-white/5 relative tactical-header-glow">
        <div className="space-y-4">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.4)] group-hover:scale-110 transition-transform duration-500">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white uppercase italic">
              Control <span className="text-rose-500 not-italic">Module</span>
            </h1>
          </div>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 animate-pulse" />
            High-Level Authentication & Database Orchestration Node
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <button
              onClick={toggleEmergencyMode}
              className={cn(
                "px-5 py-2.5 rounded-2xl border transition-all duration-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-3",
                settings?.emergencyMode 
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.3)] animate-pulse" 
                  : "glass-effect text-slate-500 border-white/5 hover:text-white"
              )}
            >
              <Siren className={cn("w-4 h-4", settings?.emergencyMode && "animate-pulse")} />
              {settings?.emergencyMode ? 'Emergency Mode: Active' : 'Emergency Mode: Standby'}
            </button>

            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-5 py-2.5 glass-effect text-slate-500 border-white/5 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all disabled:opacity-30 group"
            >
              {isSeeding ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <DatabaseZap className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />}
              {isSeeding ? 'Synchronizing...' : 'Reset Operational Data'}
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
          <section className="tactical-card p-10 space-y-10 group">
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight italic">Personnel <span className="text-indigo-500 not-italic">Roster</span></h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5">Authorization Node Vector-01</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddUser} className="flex flex-wrap gap-6 items-end p-8 bg-black/20 border border-white/5 rounded-3xl group-hover:border-indigo-500/10 transition-colors duration-500">
              <div className="flex-1 min-w-[300px]">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Network Identity Protocol (Email)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="IDENTITY@EMS-OS.TACTICAL"
                  className="tactical-input w-full px-6 h-14 text-white font-mono"
                />
              </div>
              <div className="w-56">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Clearance Level</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="tactical-input w-full px-6 h-14 text-white uppercase tracking-widest cursor-pointer"
                >
                  <option value="viewer">Level 1 // Observer</option>
                  <option value="editor">Level 2 // Operative</option>
                  <option value="admin">Level 3 // Architect</option>
                </select>
              </div>
              <button
                type="submit"
                className="tactical-btn-indigo px-10 h-14 shadow-indigo-600/20 min-w-[200px]"
              >
                Establish Access
              </button>
            </form>

            <div className="overflow-x-auto pt-6">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] italic">
                    <th className="px-8 py-4">Identity Signature</th>
                    <th className="px-8 py-4">Protocol Role</th>
                    <th className="px-8 py-4 text-right pr-12">Action Vector</th>
                  </tr>
                </thead>
                <tbody className="">
                  <AnimatePresence mode="popLayout">
                    {users.map((user) => (
                      <motion.tr 
                        key={user.uid}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-black/20 hover:bg-white/[0.03] transition-all group duration-300 relative"
                      >
                        <td className="px-8 py-6 text-sm font-black text-white font-mono tracking-tight first:rounded-l-2xl border-y border-l border-white/5 group-hover:border-indigo-500/30">{user.email}</td>
                        <td className="px-8 py-6 border-y border-white/5 group-hover:border-indigo-500/30">
                          <span className={cn(
                            "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic",
                            user.role === 'admin' ? "bg-rose-500/10 text-rose-500 border border-rose-500/30 shadow-[0_0_10px_rgba(225,29,72,0.1)]" :
                            user.role === 'editor' ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(79,70,229,0.1)]" : 
                            "bg-white/5 text-slate-500 border border-white/10"
                          )}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right last:rounded-r-2xl border-y border-r border-white/5 group-hover:border-indigo-500/30 pr-12">
                          <button
                            onClick={() => handleRemoveUser(user.uid)}
                            className="p-2 text-slate-600 hover:text-rose-500 transition-all hover:scale-110 active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="lg:col-span-12">
          <div className="tactical-card p-10 flex gap-8 items-start group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full translate-x-16 -translate-y-16" />
            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-600/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6 text-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
            </div>
            <div className="space-y-4">
              <h4 className="font-black text-white text-xl uppercase tracking-tight italic">Protocol <span className="text-indigo-500 not-italic">Integrity</span></h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-4xl uppercase tracking-tight">
                All administrative actions are processed through a hardened relational matrix. Modifying clearance levels requires architectural authority. 
                Personnel records are immutable without valid cryptographic tokens. Database factory resets purge all dynamic nodes while maintaining identity constants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// synchronized
