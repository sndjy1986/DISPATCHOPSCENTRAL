import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Shield, 
  Trash2,
  Zap,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { AugustSheetModal } from './AugustSheetModal';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addDays
} from 'date-fns';
import { useAuthRole } from '../../hooks/useAuthRole';
import { onSnapshot, collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../../lib/firebase';
import { getShiftForDate, isPayday, getUpcomingShifts } from '../../lib/opsUtils';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

import { useTerminal } from '../../context/TerminalContext';

export function OpsCalendar() {
  const { isAdmin } = useAuthRole();
  const { terminalUser } = useTerminal();
  const isElevatedTerminal = terminalUser?.role === 'admin' || terminalUser?.role === 'root' || terminalUser?.role === 'shift_lead';
  const [events, setEvents] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAugustSheetModal, setShowAugustSheetModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newEvent, setNewEvent] = useState({ title: '', description: '', type: 'event', eventDate: '', eventTime: '' });

  useEffect(() => {
    const q = query(collection(db, 'calendar_events'), orderBy('eventDate', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setEvents(items);
    }, (err) => handleFirestoreError(err, 'list' as any, 'calendar_events'));

    return () => unsub();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;
    try {
      await addDoc(collection(db, 'calendar_events'), {
        ...newEvent,
        createdBy: auth.currentUser?.email || 'Anonymous',
        createdAt: serverTimestamp()
      });
      setNewEvent({ title: '', description: '', type: 'event', eventDate: '', eventTime: '' });
      setShowAddModal(false);
    } catch (err) {
      handleFirestoreError(err, 'write' as any, 'calendar_events');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'calendar_events', id));
    } catch (err) {
      handleFirestoreError(err, 'delete' as any, 'calendar_events');
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events.filter(e => e.eventDate === dayStr);
  };

  const upcomingShifts = getUpcomingShifts(new Date(), 6);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full min-h-[600px]">
      {/* 5-Day Shift Grid (Header) */}
      <div className="xl:col-span-12 grid grid-cols-2 md:grid-cols-6 gap-4">
        {upcomingShifts.map((item, idx) => (
          <div key={idx} className={cn(
            "p-4 rounded-2xl border flex flex-col gap-2 transition-all relative overflow-hidden",
            isSameDay(item.date, new Date()) ? "bg-indigo-500/10 border-indigo-500/30" : "bg-white/[0.02] border-white/5"
          )}>
            <div className="flex justify-between items-center relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase">{format(item.date, 'EEE, MMM d')}</span>
              {item.isPayday && <DollarSign className="w-3 h-3 text-emerald-500 animate-pulse" />}
            </div>
            <div className="flex items-center gap-3 relative z-10">
               <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/10">
                  <span className="text-xl font-black text-white">{item.shift}</span>
               </div>
               <div>
                  <p className="text-[10px] font-black text-white uppercase leading-none">Rotation</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">
                    {['A', 'C'].includes(item.shift) ? 'Day Duty' : 'Night Duty'}
                  </p>
               </div>
            </div>
            {isSameDay(item.date, new Date()) && (
              <div className="absolute top-0 right-0 p-1 bg-indigo-500 text-[8px] font-black text-white uppercase tracking-tighter px-2 rounded-bl-lg">LIVE</div>
            )}
          </div>
        ))}
      </div>

      {/* Monthly View */}
      <div className="xl:col-span-8 tactical-card p-6 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Ops Schedule</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setShowAugustSheetModal(true)}
              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all mr-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Shift Sheet (A/B/C/D)</span>
            </button>
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-400/30 rounded-lg hover:bg-indigo-400/10"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 flex-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-[9px] font-black text-slate-500 uppercase py-2 tracking-widest">{day}</div>
          ))}
          {calendarDays.map((day, i) => {
             const isToday = isSameDay(day, new Date());
             const isCurrentMonth = isSameMonth(day, monthStart);
             const isSelected = isSameDay(day, selectedDate);
             const dayEvents = getEventsForDay(day);
             const shift = getShiftForDate(day);
             const isPay = isPayday(day);

             return (
               <button
                 key={i}
                 onClick={() => setSelectedDate(day)}
                 className={cn(
                   "relative min-h-[80px] rounded-xl border p-2 flex flex-col items-start transition-all",
                   !isCurrentMonth ? "opacity-10 grayscale pointer-events-none" : "opacity-100",
                   isSelected ? "bg-indigo-500/20 border-indigo-500/50" : "bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/40",
                   isToday ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-black" : ""
                 )}
               >
                 <div className="flex justify-between items-center w-full">
                    <span className={cn(
                      "text-xs font-black",
                      isToday ? "text-white" : isSelected ? "text-indigo-400" : "text-slate-500"
                    )}>
                       {format(day, 'd')}
                    </span>
                    <span className="text-[9px] font-black text-slate-700">{shift}</span>
                 </div>
                 
                 {isPay && (
                   <div className="mt-1">
                     <DollarSign className="w-3 h-3 text-emerald-500" />
                   </div>
                 )}

                 <div className="flex flex-wrap gap-1 mt-auto">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          e.type === 'alert' ? 'bg-red-500' : e.type === 'info' ? 'bg-indigo-400' : 'bg-emerald-500'
                        )} 
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-slate-600 font-bold">+{dayEvents.length - 3}</span>
                    )}
                 </div>
               </button>
             );
          })}
        </div>
      </div>

      {/* Daily Detail View */}
      <div className="xl:col-span-4 tactical-card p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">
              {format(selectedDate, 'MMM d, yyyy')}
            </h4>
            <div className="flex items-center gap-4 mt-2">
               <div className="flex items-center gap-2">
                 <Zap className="w-3 h-3 text-indigo-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{getShiftForDate(selectedDate)} SHIFT</span>
               </div>
               {isPayday(selectedDate) && (
                 <div className="flex items-center gap-2">
                   <DollarSign className="w-3 h-3 text-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">PAYDAY</span>
                 </div>
               )}
            </div>
          </div>
          {(isAdmin || isElevatedTerminal) && (
            <button 
              onClick={() => {
                setNewEvent(prev => ({ ...prev, eventDate: format(selectedDate, 'yyyy-MM-dd') }));
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20 gap-2"
            >
              <Plus size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Add to Calendar</span>
            </button>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
          {getEventsForDay(selectedDate).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center opacity-30">
              <Shield className="w-10 h-10 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white">No Sector Events</p>
            </div>
          ) : (
            getEventsForDay(selectedDate).map(event => (
              <div key={event.id} className="group p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                       "w-2 h-2 rounded-full",
                       event.type === 'alert' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                       event.type === 'info' ? 'bg-indigo-500' : 'bg-emerald-500'
                    )} />
                    <h5 className="text-xs font-bold text-white uppercase tracking-tight">{event.title}</h5>
                  </div>
                  {(isAdmin || isElevatedTerminal) && (
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-1.5 text-slate-500 hover:text-red-500 transition-colors bg-white/5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{event.description}</p>
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <Clock size={12} className="text-slate-500" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{event.eventTime || 'All Day'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-black border border-white/10 rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Strategic Entry Matrix</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Event_Injection_Protocol</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors p-2"><ChevronLeft size={24} className="rotate-180" /></button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Classification</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['event', 'info', 'alert'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewEvent(prev => ({ ...prev, type }))}
                        className={cn(
                          "py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          newEvent.type === type 
                            ? "bg-indigo-500 text-white border-indigo-400 shadow-xl shadow-indigo-500/20" 
                            : "bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operation Identifier</label>
                  <input 
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full h-16 tactical-input px-6 text-white font-mono text-base focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                    placeholder="IDENTIFY OPERATION..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date Window</label>
                    <input 
                      type="date"
                      required
                      value={newEvent.eventDate}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, eventDate: e.target.value }))}
                      className="w-full h-16 tactical-input px-6 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Precision Time</label>
                    <input 
                      type="time"
                      value={newEvent.eventTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, eventTime: e.target.value }))}
                      className="w-full h-16 tactical-input px-6 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operation Briefing</label>
                  <textarea 
                    rows={4}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full tactical-input p-6 text-white font-mono text-sm leading-relaxed"
                    placeholder="ENTER MISSION PARAMETERS..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full h-18 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-indigo-500/20 transition-all text-xs italic"
                >
                  Commit to Operational Stream
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AugustSheetModal 
        isOpen={showAugustSheetModal} 
        onClose={() => setShowAugustSheetModal(false)} 
      />
    </div>
  );
}
