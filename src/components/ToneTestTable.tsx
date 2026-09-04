import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  setDoc,
  addDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { ToneTestRecord } from '../types';
import { useAuthRole as useRole } from '../hooks/useAuthRole';
import { useTerminal } from '../context/TerminalContext';
import { Check, X, Loader2, Plus, Trash2, Users, ClipboardCopy, Trash, RefreshCw, Clock, Activity, Upload } from 'lucide-react';
import { Modal } from './centralhub/Modal';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ToneTestTable() {
  const [records, setRecords] = useState<ToneTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newUnit, setNewUnit] = useState({ 
    unit: '', 
    date: new Date().toLocaleDateString(), 
    time: '', 
    callSign: '', 
    tenFortyTwo: '',
    lateStatus: ''
  });
  const [isImporting, setIsImporting] = useState(false);
  const [pastedRoster, setPastedRoster] = useState('');
  const [focusedTimeField, setFocusedTimeField] = useState<string | null>(null); // 'new' or record.id
  const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null);
  const { isEditor: isFbEditor, isAdmin: isFbAdmin } = useRole();
  const { terminalUser } = useTerminal();
  
  const isEditor = isFbEditor || !!terminalUser;
  const isAdmin = isFbAdmin || terminalUser?.role === 'root' || terminalUser?.role === 'admin';

  const ALL_UNITS = [
    ...Array.from({ length: 25 }, (_, i) => `MED-${i}`),
    'ALS-01', 'ALS-02', 'ALS-03', 'ALS-04', 'ALS-06', 'ALS-07', 'ALS-11', 'ALS-12', 'ALS-17', 'ALS-19', 'ALS-21', 'ALS-23', 'ALS-24', 'ALS-27'
  ];

  const handleResetTable = async () => {
    if (!isEditor) return;
    try {
      // 1. Clear all
      const snap = await getDocs(collection(db, 'toneTests'));
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'toneTests', d.id)));
      await Promise.all(deletePromises);

      // 2. Seed Defaults
      const DEFAULT_UNITS = [
        ...Array.from({ length: 10 }, (_, i) => `MED-${i}`), // 0-9
        ...Array.from({ length: 7 }, (_, i) => `MED-${i + 12}`) // 12-18
      ];

      const addPromises = DEFAULT_UNITS.map(unit => 
        addDoc(collection(db, 'toneTests'), {
          unit,
          date: new Date().toLocaleDateString(),
          time: '',
          callSign: '',
          tenFortyTwo: '',
          ttDone: true, // DEFAULT TO UP STATE
          updatedAt: new Date().toISOString(),
          ...(auth.currentUser?.email ? { updatedBy: auth.currentUser.email } : {})
        })
      );
      await Promise.all(addPromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'toneTests/resetTable');
    }
  };

  const handleClearFleet = async () => {
    if (!isEditor) return;
    try {
      const snap = await getDocs(collection(db, 'toneTests'));
      const batchPromises = snap.docs.map(d => deleteDoc(doc(db, 'toneTests', d.id)));
      await Promise.all(batchPromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'toneTests/clear');
    }
  };

  const handleCopyTable = () => {
    const lines = [
      "ID\tUnit\tDate\tTime\tCall-Sign\t10-42"
    ];
    records.forEach((r, i) => {
      const timeStr = r.time || '--:--';
      const callSign = (r.unit || '').startsWith('MED') ? 'N/A' : (r.callSign || '--');
      const tenFortyTwo = r.tenFortyTwo || '--:--';
      lines.push(`${i + 1}\t${r.unit || ''}\t${r.date || ''}\t${timeStr}\t${callSign}\t${tenFortyTwo}`);
    });
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      alert("Table copied to clipboard!");
    });
  };

  const handleResetShift = async () => {
    if (!isEditor) return;
    try {
      const batchPromises = records.map(record => 
        setDoc(doc(db, 'toneTests', record.id!), {
          unit: record.unit,
          time: '',
          ttDone: false,
          tenFortyTwo: '',
          date: new Date().toLocaleDateString(),
          updatedAt: new Date().toISOString(),
          ...(auth.currentUser?.email ? { updatedBy: auth.currentUser.email } : {})
        }, { merge: true })
      );
      await Promise.all(batchPromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'toneTests/reset');
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let toneTestRecords: ToneTestRecord[] = [];
    let activeUnits: any[] = [];

    const syncData = () => {
      const combined = [...toneTestRecords];
      
      // Auto-inject active units that are missing from Tone Tests
      activeUnits.forEach(u => {
        if (u.id && !combined.find(r => (r.unit || '').toUpperCase() === u.id.toUpperCase())) {
          combined.push({
            id: u.id,
            unit: u.id,
            date: new Date().toLocaleDateString(),
            time: '',
            callSign: '',
            tenFortyTwo: '',
            ttDone: false
          });
        }
      });

      // Custom Sort: MEDIC (MED-) first, then ALS-, and both numerically within group
      const sorted = combined.sort((a, b) => {
        const unitA = (a.unit || '').toUpperCase();
        const unitB = (b.unit || '').toUpperCase();
        
        const isMedA = unitA.startsWith('MED');
        const isMedB = unitB.startsWith('MED');

        // If one is MED and the other isn't, MED comes first
        if (isMedA && !isMedB) return -1;
        if (!isMedA && isMedB) return 1;

        // If both are same prefix TYPE (both MED or both ALS), sort numerically
        // Extract the number part: "MED-10" -> 10
        const getNum = (u: string) => parseInt(u.replace(/[^0-9]/g, '')) || 0;
        const numA = getNum(unitA);
        const numB = getNum(unitB);

        if (numA !== numB) return numA - numB;
        return unitA.localeCompare(unitB);
      });

      // Remove any duplicate IDs before setting records to prevent React key errors
      const uniqueRecords = sorted.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setRecords(uniqueRecords);
      setLoading(false);
    };

    const qTone = query(collection(db, 'toneTests'));
    const unsubTone = onSnapshot(qTone, (snapshot) => {
      toneTestRecords = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          unit: data.unit || doc.id // Fallback for old records missing unit
        } as ToneTestRecord;
      });
      syncData();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'toneTests');
      setLoading(false);
    });

    const unsubUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
      activeUnits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => (u as any).status && (u as any).status !== 'OOS' && (u as any).status !== 'INACTIVE');
      syncData();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'units');
    });

    return () => {
      unsubTone();
      unsubUnits();
    };
  }, []);

  const handleAddUnit = async () => {
    if (!newUnit.unit) return;
    try {
      const entry = {
        ...newUnit,
        callSign: newUnit.unit.toUpperCase().startsWith('MED') ? '' : newUnit.callSign,
        ttDone: true, // DEFAULT TO UP STATE
        duration: '',
        updatedAt: new Date().toISOString(),
        ...(auth.currentUser?.email ? { updatedBy: auth.currentUser.email } : {})
      };
      await addDoc(collection(db, 'toneTests'), entry);
      setNewUnit({ unit: '', date: new Date().toLocaleDateString(), time: '', callSign: '', tenFortyTwo: '', lateStatus: '' });
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'toneTests/new');
    }
  };

  const handleImportRoster = async () => {
    if (!pastedRoster.trim()) return;
    try {
      const lines = pastedRoster.split('\n');
      let updatedCount = 0;
      let addedCount = 0;

      for (let line of lines) {
        line = line.trim();
        if (!line || line.toUpperCase().startsWith('UNIT') || line.includes('Roster') || line.includes('**')) continue;

        let cols: string[] = [];
        if (line.includes('\t')) {
          cols = line.split('\t').map(c => c.trim());
        } else {
          cols = line.split(/\s{2,}/).map(c => c.trim());
          if (cols.length < 3) {
            cols = line.split(/\s+/).map(c => c.trim());
          }
        }

        if (cols.length >= 3) {
          const unit = cols[0].toUpperCase();
          const date = cols[1] === 'XXX' ? new Date().toLocaleDateString() : cols[1];
          const time = cols[2] === 'XXX' ? '' : cols[2];
          
          let callSign = '';
          let tenFortyTwo = '';
          
          if (cols.length === 5) {
            callSign = cols[3] === 'XXX' ? '' : cols[3];
            tenFortyTwo = cols[4] === 'XXX' ? '' : cols[4];
          } else if (cols.length === 4) {
            const val = cols[3];
            if (val.includes(':') || val === 'XXX') {
              tenFortyTwo = val === 'XXX' ? '' : val;
            } else {
              callSign = val;
            }
          }

          // Check if this unit already exists in the records list
          const existingRecord = records.find(r => r.unit.toUpperCase() === unit);
          
          const entry = {
            unit,
            date: date || new Date().toLocaleDateString(),
            time: time || '',
            callSign: unit.startsWith('MED') ? '' : (callSign || ''),
            tenFortyTwo: tenFortyTwo || '',
            ttDone: !!time,
            updatedAt: new Date().toISOString(),
            ...(auth.currentUser?.email ? { updatedBy: auth.currentUser.email } : {})
          };

          if (existingRecord?.id) {
            await setDoc(doc(db, 'toneTests', existingRecord.id), entry, { merge: true });
            updatedCount++;
          } else {
            await addDoc(collection(db, 'toneTests'), entry);
            addedCount++;
          }
        }
      }

      alert(`Import complete! Successfully updated ${updatedCount} and added ${addedCount} units.`);
      setPastedRoster('');
      setIsImporting(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'toneTests/import');
    }
  };

  const handleDeleteUnit = async (id: string, name: string) => {
    if (!isEditor) return;
    try {
      await deleteDoc(doc(db, 'toneTests', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `toneTests/${id}`);
    }
  };

  const toggleTtDone = async (record: ToneTestRecord) => {
    if (!isEditor || !record.id) return;
    const path = `toneTests/${record.id}`;
    try {
      await setDoc(doc(db, 'toneTests', record.id), {
        unit: record.unit, // ensure unit is set on creation
        date: record.date || new Date().toLocaleDateString(),
        ttDone: !record.ttDone,
        updatedAt: new Date().toISOString(),
        ...(auth.currentUser?.email ? { updatedBy: auth.currentUser.email } : {})
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleFieldUpdate = async (record: ToneTestRecord, field: keyof ToneTestRecord, value: any) => {
    if (!isEditor || !record.id) return;
    const path = `toneTests/${record.id}`;
    try {
      await setDoc(doc(db, 'toneTests', record.id), {
        unit: record.unit, // ensure unit is set on creation
        date: record.date || new Date().toLocaleDateString(),
        [field]: value,
        updatedAt: new Date().toISOString(),
        ...(auth.currentUser?.email ? { updatedBy: auth.currentUser.email } : {})
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center gap-6 bg-bg-surface/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {isEditor && (
          <div className="flex flex-wrap gap-4 relative z-10">
            <button
              onClick={() => setConfirmAction({
                message: 'Start new shift? This will clear all Up-Times and Statuses for the current fleet.',
                action: handleResetShift
              })}
              className="flex items-center gap-3 px-6 py-3 bg-emerald-600/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)] active:scale-95 group/btn2"
            >
              <RefreshCw className="w-4 h-4 group-hover/btn2:rotate-180 transition-transform duration-500" />
              New Shift
            </button>

            <button
              onClick={() => setConfirmAction({
                message: 'This will RESET the table to default units. Existing data will be purged. Continue?',
                action: handleResetTable
              })}
              className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-95 group/btn"
            >
              <RefreshCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
              Reset Fleet Matrix
            </button>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 border text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-xl active:scale-95",
                isAdding 
                  ? "bg-white/10 border-indigo-500/50 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                  : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
              )}
            >
              <Plus className={cn("w-4 h-4 transition-transform duration-300", isAdding && "rotate-45")} />
              {isAdding ? "Close" : "Add Truck"}
            </button>

            <button
              onClick={() => setIsImporting(true)}
              className="flex items-center gap-3 px-6 py-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-xl active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Import Roster & Times
            </button>

            <button
              onClick={() => setConfirmAction({
                message: 'This will CLEAR all recorded units. Are you sure?',
                action: handleClearFleet
              })}
              className="group/delete flex items-center gap-3 px-6 py-3 bg-rose-600/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-xl active:scale-95 shadow-lg shadow-rose-500/5"
            >
              <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform" />
              Purge Status
            </button>
          </div>
        )}

        <button
          onClick={handleCopyTable}
          className="flex items-center gap-3 px-6 py-3 ml-auto bg-black/40 border border-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:border-white/20 transition-all rounded-xl relative z-10"
        >
          <ClipboardCopy className="w-4 h-4 text-indigo-400" />
          Data Export
        </button>
      </div>

      <div className="overflow-hidden bg-bg-surface/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-white/5">
              <th className="w-16 p-6 text-center text-[10px] text-slate-600 uppercase font-black tracking-[0.3em]">ID</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Unit Chassis</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Log Date</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Up-Time</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Call-Sign</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">10-42 Code</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] text-center">Bio-Sync</th>
              {isEditor && <th className="w-16 p-6 border-l border-white/5"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {records.map((record, idx) => (
                <motion.tr 
                  key={record.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-indigo-500/[0.02] transition-colors group"
                >
                  <td className="p-6 text-center text-[10px] text-slate-600 font-mono font-bold tracking-widest border-r border-white/5">
                    {(idx + 1).toString().padStart(3, '0')}
                  </td>
                  <td className="px-6 py-4 border-r border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1 leading-none">Chassis</span>
                      <span className="text-lg font-black text-white group-hover:text-indigo-400 glow-text-indigo transition-colors tracking-tight">{record.unit || ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-r border-white/5">
                    <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase px-3 py-1 bg-black/20 rounded-full border border-white/5">
                      {record.date}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-r border-white/5 relative group/time min-w-[140px]">
                    <div className="flex items-center gap-3">
                      <Clock className="w-3.5 h-3.5 text-indigo-500/50" />
                      <input
                        type="text"
                        value={record.time}
                        disabled={!isEditor}
                        onFocus={() => setFocusedTimeField(record.id!)}
                        onBlur={() => setTimeout(() => setFocusedTimeField(null), 200)}
                        onChange={(e) => handleFieldUpdate(record, 'time', e.target.value)}
                        className="bg-transparent border-none focus:ring-0 rounded text-base text-white font-mono outline-none w-full placeholder:text-slate-700"
                        placeholder="--:--"
                      />
                    </div>
                    {focusedTimeField === record.id && isEditor && (
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleFieldUpdate(record, 'time', getCurrentTime());
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-xl shadow-indigo-500/40 animate-in fade-in zoom-in slide-in-from-right-2 duration-300 z-10 hover:bg-indigo-500 uppercase tracking-widest"
                      >
                        Capture
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 border-r border-white/5">
                    <input
                      type="text"
                      value={record.callSign}
                      disabled={!isEditor || (record.unit || '').toUpperCase().startsWith('MED')}
                      onChange={(e) => handleFieldUpdate(record, 'callSign', e.target.value)}
                      className={cn(
                        "bg-transparent border-none focus:ring-0 rounded text-xs outline-none w-full font-black tracking-[0.2em] uppercase placeholder:text-slate-800 transition-all",
                        (record.unit || '').toUpperCase().startsWith('MED') && "opacity-10 cursor-not-allowed"
                      )}
                      placeholder={(record.unit || '').toUpperCase().startsWith('MED') ? "INACTIVE" : "IDENT_CODE"}
                    />
                  </td>
                  <td className="px-6 py-4 border-r border-white/5">
                     <input
                      type="text"
                      value={record.tenFortyTwo}
                      disabled={!isEditor}
                      onChange={(e) => handleFieldUpdate(record, 'tenFortyTwo', e.target.value)}
                      className="bg-transparent border-none focus:ring-0 rounded text-base text-white outline-none w-full font-mono placeholder:text-slate-800"
                      placeholder="STNDBY"
                    />
                  </td>
                  <td className="px-6 py-4 border-r border-white/5">
                    <select
                      value={record.lateStatus || ''}
                      disabled={!isEditor}
                      onChange={(e) => handleFieldUpdate(record, 'lateStatus', e.target.value)}
                      className={cn(
                        "bg-transparent border-none focus:ring-0 outline-none w-full font-black tracking-widest text-[10px] uppercase cursor-pointer appearance-none",
                        record.lateStatus === 'LATE' ? "text-rose-500" : record.lateStatus === 'ON TIME' ? "text-emerald-500" : "text-slate-500"
                      )}
                    >
                      <option value="" className="bg-bg-surface text-slate-500">--</option>
                      <option value="ON TIME" className="bg-bg-surface text-emerald-500">ON TIME</option>
                      <option value="LATE" className="bg-bg-surface text-rose-500">LATE</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleTtDone(record)}
                      disabled={!isEditor}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-all duration-500 overflow-hidden",
                        !isEditor ? "opacity-30 cursor-not-allowed" : "hover:scale-105 active:scale-95",
                        record.ttDone 
                          ? "bg-emerald-500/20 border border-emerald-500/40" 
                          : "bg-rose-500/10 border border-rose-500/20"
                      )}
                    >
                      <motion.div 
                        animate={{ x: record.ttDone ? 24 : 4 }}
                        className={cn(
                          "w-4 h-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                          record.ttDone ? "bg-emerald-500" : "bg-rose-500"
                        )}
                      />
                    </button>
                  </td>
                  {isEditor && (
                    <td className="px-6 py-4 text-center border-l border-white/5">
                      <button
                        onClick={() => setConfirmAction({
                          message: `Decommission unit ${record.unit}?`,
                          action: () => handleDeleteUnit(record.id!, record.unit)
                        })}
                        className="text-slate-600 hover:text-rose-500 transition-all hover:scale-110"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isAdding} 
        onClose={() => setIsAdding(false)} 
        title="Unit Activation Menu" 
        icon={<Activity className="w-5 h-5 text-indigo-500" />}
      >
        <div className="space-y-6">
          {/* Sketch Subheader Banner */}
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Place unit en-service</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Unit Num & Truck Up Time on same line as in sketch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Unit Num:</label>
              <input
                list="truck-list"
                type="text"
                className="border-b-2 border-slate-700 bg-transparent text-white font-black text-xl tracking-wide pb-1.5 outline-none focus:border-indigo-500 transition-all uppercase w-full placeholder:text-slate-700"
                value={newUnit.unit}
                placeholder="e.g. MED-4"
                onChange={e => setNewUnit({...newUnit, unit: e.target.value.toUpperCase()})}
              />
              <datalist id="truck-list">
                {ALL_UNITS.map(u => <option key={u} value={u} />)}
              </datalist>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">truck UP time</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="07:32"
                  className="bg-black/60 border-2 border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-base text-center w-full focus:border-indigo-500 outline-none transition-all"
                  value={newUnit.time}
                  onChange={e => setNewUnit({...newUnit, time: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setNewUnit({...newUnit, time: getCurrentTime()})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded hover:bg-indigo-500 transition-all uppercase tracking-widest"
                >
                  NOW
                </button>
              </div>
            </div>
          </div>

          {/* Personnel Field: Only shows if unit starts with ALS or A- */}
          {(newUnit.unit.startsWith('ALS') || newUnit.unit.startsWith('A-')) ? (
            <div className="space-y-2 animate-in fade-in duration-300">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block">Personell - (Will set up names)</label>
              <input
                type="text"
                placeholder="A-3"
                className="border-b-2 border-slate-700 bg-transparent text-white font-black text-lg pb-1.5 outline-none focus:border-indigo-500 transition-all uppercase w-full tracking-widest"
                value={newUnit.callSign}
                onChange={e => setNewUnit({...newUnit, callSign: e.target.value.toUpperCase()})}
              />
              <span className="text-[9px] text-slate-500 italic block mt-1 tracking-wider">Only shows/needed if unit is ALS-??</span>
            </div>
          ) : (
            newUnit.unit && (
              <div className="text-[10px] text-slate-600 italic">
                Personnel field hidden (only shown for ALS-?? units)
              </div>
            )
          )}

          {/* Unit 10-42 Time & Late status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Unit 10-42 time</label>
              <input
                type="text"
                placeholder="18:30"
                className="bg-black/60 border-2 border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-base text-center w-full focus:border-indigo-500 outline-none transition-all"
                value={newUnit.tenFortyTwo}
                onChange={e => setNewUnit({...newUnit, tenFortyTwo: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Late / On Time</label>
              <select
                className="bg-black/60 border-2 border-slate-800 rounded-xl px-4 py-3 outline-none text-white font-black text-xs w-full uppercase tracking-widest transition-all appearance-none"
                value={newUnit.lateStatus || ''}
                onChange={e => setNewUnit({...newUnit, lateStatus: e.target.value})}
              >
                <option value="" className="bg-bg-surface text-slate-500">-- SELECT --</option>
                <option value="ON TIME" className="bg-bg-surface text-emerald-500 font-bold">ON TIME</option>
                <option value="LATE" className="bg-bg-surface text-rose-500 font-bold">LATE</option>
              </select>
            </div>
          </div>

          {/* OK button in the bottom right */}
          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              onClick={() => {
                handleAddUnit();
                setIsAdding(false);
              }}
              disabled={!newUnit.unit}
              className={cn(
                "px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all",
                newUnit.unit ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 cursor-pointer" : "bg-white/5 text-slate-700 cursor-not-allowed"
              )}
            >
              OK
            </button>
          </div>
        </div>
      </Modal>

      {/* Roster & 10-41 Times Import Modal */}
      <Modal
        isOpen={isImporting}
        onClose={() => setIsImporting(false)}
        title="Import Roster & 10-41 Times"
        icon={<Upload className="w-5 h-5 text-indigo-400" />}
      >
        <div className="space-y-6">
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[11px] text-indigo-300 leading-relaxed font-mono">
            Paste tabular data from your dispatch roster spreadsheet or text list. We will match columns automatically by tab-separation or spacing!
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Roster Data Matrix</label>
            <textarea
              className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono text-xs focus:border-indigo-500/50 focus:bg-black/60 outline-none transition-all resize-none"
              placeholder="Unit	Date	Time	Call-Sign	10-42&#10;MED-4	6/18	06:11		18:30&#10;ALS-03	6/18	06:44	C-4	19:00"
              value={pastedRoster}
              onChange={e => setPastedRoster(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              onClick={() => {
                setPastedRoster('');
                setIsImporting(false);
              }}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleImportRoster}
              disabled={!pastedRoster.trim()}
              className={cn(
                "px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all",
                pastedRoster.trim() ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 cursor-pointer" : "bg-white/5 text-slate-700 cursor-not-allowed"
              )}
            >
              Import & Sync Fleet
            </button>
          </div>
        </div>
      </Modal>

      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-indigo-500" />
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-widest">Confirm Action</h3>
            <p className="text-slate-300 text-sm mb-8 font-medium">{confirmAction.message}</p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setConfirmAction(null)}
                className="px-6 py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmAction.action();
                  setConfirmAction(null);
                }}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] uppercase tracking-[0.2em] font-black shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all active:scale-95"
              >
                Authorize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
