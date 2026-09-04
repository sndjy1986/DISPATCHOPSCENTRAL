import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  LayoutDashboard, 
  Activity, 
  Terminal, 
  Map as MapIcon, 
  Camera, 
  FileText,
  AlertTriangle,
  Zap,
  Radio,
  Siren,
  Settings2,
  Lock,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTerminal } from '../context/TerminalContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Start Page', path: '/' },
  { icon: Activity, label: 'Tone Test', path: '/tone-test' },
  { icon: Terminal, label: 'Unit Posting', path: '/unit-posting' },
  { icon: MapIcon, label: 'Distance Map', path: '/distance-map' },
  { icon: Camera, label: 'Cameras', path: '/cameras' },
  { icon: FileText, label: 'Shift Report', path: '/shift-report' },
];

export function Sidebar() {
  const { 
    manualEmergencyMode, 
    setManualEmergencyMode, 
    emergencyOpacity, 
    setEmergencyOpacity 
  } = useTerminal();

  return (
    <div className="w-64 h-screen backdrop-blur-xl bg-white/5 border-r border-white/10 flex flex-col fixed left-0 top-0 z-50 overflow-y-auto overflow-x-hidden">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">D</div>
          <span className="text-xl font-bold tracking-tight text-white uppercase">DISPATCH <span className="text-indigo-400">OPS</span></span>
        </div>
      </div>
      
      <nav className="flex-1 px-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
              ${isActive 
                ? 'bg-white/10 text-white border border-white/10' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute inset-0 bg-indigo-500/10 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-6 space-y-6">
        {/* Time Clock moved down to Links Section */}
        <div className="mb-2 flex flex-col items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl group cursor-default">
          <ClockDisplay />
        </div>


        {/* User Profile & Admin Access */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-xl">
             <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <UserCheck className="w-4 h-4 text-indigo-400" />
             </div>
             <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">SNDJY Ops</span>
                <span className="text-[8px] font-bold text-slate-500 truncate lowercase">sndjy1986@gmail.com</span>
             </div>
          </div>

          <Link 
            to="/admin/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-indigo-400 transition-colors border border-dashed border-white/5 hover:border-indigo-500/30 group"
          >
            <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Admin Interface</span>
          </Link>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">System Status</p>
          <div className="flex items-center gap-2 text-emerald-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium">All Systems Nominal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClockDisplay() {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none">
        {format(now, 'HH:mm')}
        <span className="text-indigo-500 text-sm ml-1 opacity-50">{format(now, 'ss')}</span>
      </div>
      <div className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2 italic shadow-sm">
        {format(now, 'EEE, MMM d')}
      </div>
    </div>
  );
}
