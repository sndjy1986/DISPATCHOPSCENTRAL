import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Send, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  ShieldAlert, 
  HelpCircle, 
  Activity, 
  UserMinus, 
  AlertOctagon,
  Hammer
} from 'lucide-react';
import { useTerminal } from '../../context/TerminalContext';

type MessageType = 'status' | 'hurt' | 'accident' | 'high-acuity' | 'code-100-200' | 'severe-weather' | 'road-closed';

interface FormState {
  // System Status fields
  statusLevel: '0' | '1' | '2' | '3';

  // Employee Hurt fields
  employeeName: string;
  employeeId: string;
  injuryType: string;
  injuryLocation: string;
  supervisorName: string;
  actionsTaken: string;

  // AC Vehicle Accident fields
  vehicleUnit: string;
  accidentLocation: string;
  crewMembers: string;
  policeIncident: string;
  injuriesReported: string;
  vehicleStatus: string;
  briefDescription: string;

  // High Acuity Call fields
  haWhatHappened: string;
  haUnitsEnRoute: string;
  haAnyoneHurt: string;
  haBriefDetails: string;

  // Code100/200 fields
  cUnitInvolved: string;
  cLocation: string;
  cPatients: string;
  cAnyoneHurt: string;

  // Severe Weather fields
  weatherMsg: string;

  // Road Closed fields
  rcRoadName: string;
  rcFromRoad: string;
  rcToRoad: string;
}

export default function SendAdminMessage() {
  const { terminalUser, firebaseUser, appTheme } = useTerminal();
  const [selectedType, setSelectedType] = useState<MessageType>('status');
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [copiedClean, setCopiedClean] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'instructions'>('preview');

  const bookmarkRef = useRef<HTMLAnchorElement>(null);
  const bookmarkRefPlain = useRef<HTMLAnchorElement>(null);

  // Load default operator name
  const currentOperator = terminalUser?.username || firebaseUser?.displayName || 'OPERATOR_1';

  // State values
  const [form, setForm] = useState<FormState>({
    statusLevel: '1',

    employeeName: 'Officer Miller',
    employeeId: 'EMP-3841',
    injuryType: 'Minor Laceration / Exposure to toxic fume',
    injuryLocation: 'Station 12 parking bay',
    supervisorName: 'Captain Jenkins',
    actionsTaken: 'Treated on scene. Admitted to regional clinic for baseline monitoring.',

    vehicleUnit: 'Medic 42',
    accidentLocation: 'E Greenville St & Martin Rd',
    crewMembers: 'Paramedic Hayes, EMT Ross',
    policeIncident: 'APD Incident #2026-5011A',
    injuriesReported: 'None for crew. Other vehicle driver complaining of wrist soreness.',
    vehicleStatus: 'OOS - Minor front bumper compression (Driveable)',
    briefDescription: 'En route to non-emergency call when citizen vehicle failure caused low-speed rear-end contact.',

    haWhatHappened: 'Pedestrian Struck / Major Trauma',
    haUnitsEnRoute: 'Medic 2, Quick Response Vehicle 5 (QRV-5), Rescue 1',
    haAnyoneHurt: 'Pedestrian unconscious with severe injuries, crew uninjured',
    haBriefDetails: 'Active rescue operational scene near major intersection. Avoid area.',

    cUnitInvolved: 'Medic 14',
    cLocation: 'Highway 81 South near mile marker 14',
    cPatients: 'Yes, 1 patient in secondary vehicle',
    cAnyoneHurt: 'Medic 14 crew reporting uninjured. Police and fire en route.',

    weatherMsg: 'Severe Thunderstorm Warning issued by NWS for Anderson County. Strong damaging wind gusts and heavy localized rainfall expected through 1900 hours. Stay indoors and secure loose items.',

    rcRoadName: 'Hwy 178 / Liberty Highway',
    rcFromRoad: 'Centerville Road',
    rcToRoad: 'Airport Road'
  });

  const handleFieldChange = (key: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Compile subject and body templates dynamically
  const getSubject = (): string => {
    switch (selectedType) {
      case 'status':
        return `System Status`;
      case 'hurt':
        return `[URGENT] EMPLOYEE HURT - ${form.employeeName} (${form.employeeId})`;
      case 'accident':
        return `[CRITICAL] AC VEHICLE ACCIDENT - Unit: ${form.vehicleUnit}`;
      case 'high-acuity':
        return `High Acuity Call`;
      case 'code-100-200':
        return `Code100/200`;
      case 'severe-weather':
        return `Severe Weather Alert`;
      case 'road-closed':
        return `Road Closed`;
    }
  };

  const getBody = (): string => {
    const timestamp = new Date().toLocaleString();
    switch (selectedType) {
      case 'status':
        return `System Status Level ${form.statusLevel}.

Thanks,
Dispatch`;
      case 'hurt':
        return `Employee: ${form.employeeName} (${form.employeeId})
Injury: ${form.injuryType}
Location: ${form.injuryLocation}
Supervisor: ${form.supervisorName}
Actions: ${form.actionsTaken}`;
      case 'accident':
        return `Unit: ${form.vehicleUnit}
Location: ${form.accidentLocation}
Crew: ${form.crewMembers}
Police ID: ${form.policeIncident}
Injuries: ${form.injuriesReported}
Status: ${form.vehicleStatus}
Details: ${form.briefDescription}`;
      case 'high-acuity':
        return `What Happened : ${form.haWhatHappened}
Where: ${form.haBriefDetails}
En-Route or On-Scene , Who? ${form.haUnitsEnRoute}`;
      case 'code-100-200':
        return `Unit Involved: ${form.cUnitInvolved}
Location: ${form.cLocation}
Patients: ${form.cPatients}
Anyone Hurt: ${form.cAnyoneHurt}`;
      case 'severe-weather':
        return `Weather Alert: ${form.weatherMsg}`;
      case 'road-closed':
        return `${form.rcRoadName} is closed from ${form.rcFromRoad} to ${form.rcToRoad} - See Attached Image -`;
    }
  };

  // Generate Bookmarklet JavaScript Code
  const getRawBookmarkletCode = (): string => {
    const subjValJson = JSON.stringify(getSubject());
    const bodyValJson = JSON.stringify(getBody());

    const lines = [
      "(function(){",
      `var subVal = ${subjValJson};`,
      `var bdyVal = ${bodyValJson};`,
      "var mg = document.getElementsByName('MessageGroup')[0];",
      "if (mg) {",
      "  mg.value = '74';",
      "}",
      "var reg = document.getElementsByName('Registered')[0];",
      "if (reg) {",
      "  reg.checked = true;",
      "}",
      "var req = document.getElementsByName('Required')[0];",
      "if (req) {",
      "  req.removeAttribute('disabled');",
      "  req.disabled = false;",
      "  req.checked = true;",
      "}",
      "var email = document.getElementsByName('SendByEMail')[0];",
      "if (email) {",
      "  email.checked = true;",
      "}",
      "var text = document.getElementById('SendByText') || document.getElementsByName('SendByText')[0];",
      "if (text) {",
      "  text.checked = true;",
      "}",
      "var title = document.getElementsByName('Title')[0];",
      "if (title) {",
      "  title.value = subVal;",
      "}",
      "var msg = document.getElementById('Message') || document.getElementsByName('Message')[0];",
      "if (msg) {",
      "  msg.value = bdyVal;",
      "}",
      "var msg2 = document.getElementById('Message2') || document.getElementsByName('Message2')[0];",
      "if (msg2) {",
      "  msg2.removeAttribute('disabled');",
      "  msg2.disabled = false;",
      "  msg2.value = bdyVal;",
      "}",
      "})();"
    ];

    return lines.join('');
  };

  const getBookmarkletHref = (): string => {
    return `javascript:${encodeURIComponent(getRawBookmarkletCode())}`;
  };

  const getBookmarkletHrefClean = (): string => {
    return `javascript:${getRawBookmarkletCode()}`;
  };

  // Synchronize dynamic refs to bypass React's javascript: URL security verification
  useEffect(() => {
    if (bookmarkRef.current) {
      bookmarkRef.current.setAttribute('href', getBookmarkletHref());
    }
    if (bookmarkRefPlain.current) {
      bookmarkRefPlain.current.setAttribute('href', getBookmarkletHrefClean());
    }
  }, [
    selectedType,
    form.statusLevel,
    form.employeeName,
    form.employeeId,
    form.injuryType,
    form.injuryLocation,
    form.supervisorName,
    form.actionsTaken,
    form.vehicleUnit,
    form.accidentLocation,
    form.crewMembers,
    form.policeIncident,
    form.injuriesReported,
    form.vehicleStatus,
    form.briefDescription,
    form.haWhatHappened,
    form.haUnitsEnRoute,
    form.haAnyoneHurt,
    form.haBriefDetails,
    form.cUnitInvolved,
    form.cLocation,
    form.cPatients,
    form.cAnyoneHurt,
    form.weatherMsg,
    form.rcRoadName,
    form.rcFromRoad,
    form.rcToRoad
  ]);

  const copyToClipboard = async (text: string, type: 'subject' | 'body' | 'bookmarklet' | 'bookmarklet_clean') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'subject') {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
      } else if (type === 'body') {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
      } else if (type === 'bookmarklet_clean') {
        setCopiedClean(true);
        setTimeout(() => setCopiedClean(false), 2000);
      } else {
        setCopiedBookmarklet(true);
        setTimeout(() => setCopiedBookmarklet(false), 2000);
      }
    } catch (err) {
      console.error("Could not copy:", err);
    }
  };

  const handleOpenSuite = () => {
    window.open("https://scheduling.esosuite.net/EPS/MessageCenter/SendMessage.ashx", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8" id="send-admin-message-page">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border border-emerald-500/10 rounded-3xl p-6 md:p-8 bg-brand-panel/30 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-xl text-emerald-400">
            <Bell className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-text-main uppercase tracking-widest leading-none">Send Admin Message</h1>
            <span className="text-[10px] font-bold text-emerald-400 tracking-[0.3em] uppercase mt-1">
              Eso Suite Auto-fill Portal
            </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0 relative z-10">
          <button 
            onClick={handleOpenSuite}
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all shadow-lg active:scale-95"
            title="Launch Scheduling Portal"
          >
            <span>Open ESO Scheduler</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-white/5 pb-2.5 gap-2.5 md:gap-4">
        {['status', 'hurt', 'accident', 'high-acuity', 'code-100-200', 'severe-weather', 'road-closed'].map((t) => {
          const isSelected = selectedType === t;
          let label = "";
          let Icon = FileText;
          if (t === 'status') { label = "System Status"; Icon = Activity; }
          if (t === 'hurt') { label = "Employee Hurt"; Icon = UserMinus; }
          if (t === 'accident') { label = "AC Vehicle Accident"; Icon = AlertOctagon; }
          if (t === 'high-acuity') { label = "High Acuity Call"; Icon = Activity; }
          if (t === 'code-100-200') { label = "Code 100/200"; Icon = ShieldAlert; }
          if (t === 'severe-weather') { label = "Severe Weather Alert"; Icon = AlertOctagon; }
          if (t === 'road-closed') { label = "Road Closed"; Icon = ShieldAlert; }
          
          return (
            <button
              key={t}
              onClick={() => setSelectedType(t as MessageType)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all text-[10px] h-10 font-bold uppercase tracking-widest
                ${isSelected 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold shadow-md' 
                  : 'bg-brand-panel/10 border-transparent text-text-dim hover:text-emerald-400 hover:bg-emerald-500/5'}
              `}
            >
              <Icon size={14} className={isSelected ? 'text-emerald-400' : 'text-text-dim'} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dynamic Fields Left Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-white/5 rounded-2xl p-6 bg-brand-panel/50 backdrop-blur-md shadow-lg space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Template Context</span>
            </div>

            <AnimatePresence mode="wait">
              {/* System Status form fields */}
              {selectedType === 'status' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                  key="form-status"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Status Urgency Level</label>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">Level {form.statusLevel}</span>
                    </div>
                    <div className="flex items-center w-full justify-between px-2 bg-black/20 py-4 border border-white/5 rounded-2xl relative">
                      {/* Background connected horizontal line */}
                      <div className="absolute top-[35px] left-10 right-10 h-[2px] bg-white/10 pointer-events-none z-0" />
                      
                      {['0', '1', '2', '3'].map((level) => {
                        const isSelected = form.statusLevel === level;
                        return (
                          <div key={level} className="flex flex-col items-center gap-1.5 z-10">
                            <button
                              type="button"
                              onClick={() => handleFieldChange('statusLevel', level as any)}
                              className={`
                                w-10 h-10 rounded-full text-xs font-black border transition-all flex items-center justify-center
                                ${isSelected 
                                  ? 'bg-emerald-500 border-emerald-400 text-white font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-110' 
                                  : 'bg-brand-field border-white/5 text-text-dim hover:bg-white/10 hover:text-text-main'}
                              `}
                            >
                              {level}
                            </button>
                            <span className={`text-[8px] font-bold tracking-widest uppercase transition-colors ${isSelected ? 'text-emerald-400' : 'text-text-dim/50'}`}>
                              L{level}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Employee Hurt form fields */}
              {selectedType === 'hurt' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                  key="form-hurt"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Employee Name</label>
                      <input
                        type="text"
                        value={form.employeeName}
                        onChange={(e) => handleFieldChange('employeeName', e.target.value)}
                        className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Employee ID</label>
                      <input
                        type="text"
                        value={form.employeeId}
                        onChange={(e) => handleFieldChange('employeeId', e.target.value)}
                        className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Injury / Event Type</label>
                    <input
                      type="text"
                      value={form.injuryType}
                      onChange={(e) => handleFieldChange('injuryType', e.target.value)}
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                      placeholder="e.g. Exposure, Needle slip, Orthopedic slip/fall"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Occurrence Location</label>
                    <input
                      type="text"
                      value={form.injuryLocation}
                      onChange={(e) => handleFieldChange('injuryLocation', e.target.value)}
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Supervisor Notified</label>
                    <input
                      type="text"
                      value={form.supervisorName}
                      onChange={(e) => handleFieldChange('supervisorName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Immediate Action / Treatment</label>
                    <textarea
                      value={form.actionsTaken}
                      onChange={(e) => handleFieldChange('actionsTaken', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors resize-none custom-scrollbar"
                      placeholder="e.g., EMS evaluated, transported to ER, self-care log"
                    />
                  </div>
                </motion.div>
              )}

              {/* AC Vehicle Accident form fields */}
              {selectedType === 'accident' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                  key="form-accident"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Vehicle Unit ID</label>
                      <input
                        type="text"
                        value={form.vehicleUnit}
                        onChange={(e) => handleFieldChange('vehicleUnit', e.target.value)}
                        className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                        placeholder="e.g. Medic 3"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Vehicle Status</label>
                      <input
                        type="text"
                        value={form.vehicleStatus}
                        onChange={(e) => handleFieldChange('vehicleStatus', e.target.value)}
                        className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                        placeholder="e.g. OOS / Tow needed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Incident Location</label>
                    <input
                      type="text"
                      value={form.accidentLocation}
                      onChange={(e) => handleFieldChange('accidentLocation', e.target.value)}
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                      placeholder="Intersections / Mile markers"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Crew on Board</label>
                    <input
                      type="text"
                      value={form.crewMembers}
                      onChange={(e) => handleFieldChange('crewMembers', e.target.value)}
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Police Dispatch ID</label>
                      <input
                        type="text"
                        value={form.policeIncident}
                        onChange={(e) => handleFieldChange('policeIncident', e.target.value)}
                        className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Injuries Reported?</label>
                      <input
                        type="text"
                        value={form.injuriesReported}
                        onChange={(e) => handleFieldChange('injuriesReported', e.target.value)}
                        className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Brief Collision Description</label>
                    <textarea
                      value={form.briefDescription}
                      onChange={(e) => handleFieldChange('briefDescription', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors resize-none custom-scrollbar"
                      placeholder="Describe what occurred on final report..."
                    />
                  </div>
                </motion.div>
              )}

              {/* High Acuity Call form fields */}
              {selectedType === 'high-acuity' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                  key="form-high-acuity"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">What Happened :</label>
                    <input
                      type="text"
                      value={form.haWhatHappened}
                      onChange={(e) => handleFieldChange('haWhatHappened', e.target.value)}
                      placeholder="e.g. Pedestrian Struck / Major Trauma"
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Where:</label>
                    <input
                      type="text"
                      value={form.haBriefDetails}
                      onChange={(e) => handleFieldChange('haBriefDetails', e.target.value)}
                      placeholder="e.g. Active rescue operational scene near major intersection"
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">En-Route or On-Scene , Who?</label>
                    <input
                      type="text"
                      value={form.haUnitsEnRoute}
                      onChange={(e) => handleFieldChange('haUnitsEnRoute', e.target.value)}
                      placeholder="e.g. Medic 2, Quick Response Vehicle 5 (QRV-5), Rescue 1"
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </motion.div>
              )}

              {/* Code 100/200 form fields */}
              {selectedType === 'code-100-200' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                  key="form-code-100-200"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Unit Involved in MVA</label>
                      <input
                        type="text"
                        value={form.cUnitInvolved}
                        onChange={(e) => handleFieldChange('cUnitInvolved', e.target.value)}
                        placeholder="e.g. Medic 14"
                        className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Patients?</label>
                      <input
                        type="text"
                        value={form.cPatients}
                        onChange={(e) => handleFieldChange('cPatients', e.target.value)}
                        placeholder="e.g. Yes, 2 patients"
                        className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Location</label>
                    <input
                      type="text"
                      value={form.cLocation}
                      onChange={(e) => handleFieldChange('cLocation', e.target.value)}
                      placeholder="e.g. Highway 81 South near mile marker 14"
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Anyone Hurt?</label>
                    <input
                      type="text"
                      value={form.cAnyoneHurt}
                      onChange={(e) => handleFieldChange('cAnyoneHurt', e.target.value)}
                      placeholder="e.g. Medic 14 crew reporting uninjured"
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </motion.div>
              )}

              {/* Severe Weather Alert form fields */}
              {selectedType === 'severe-weather' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                  key="form-severe-weather"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">NWS Alert Message</label>
                    <textarea
                      value={form.weatherMsg}
                      onChange={(e) => handleFieldChange('weatherMsg', e.target.value)}
                      rows={6}
                      placeholder="Paste/copy alert message from the National Weather Service..."
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors resize-none custom-scrollbar font-mono leading-relaxed"
                    />
                  </div>
                </motion.div>
              )}

              {/* Road Closed form fields */}
              {selectedType === 'road-closed' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                  key="form-road-closed"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">Closed Road Name (X Road)</label>
                    <input
                      type="text"
                      value={form.rcRoadName}
                      onChange={(e) => handleFieldChange('rcRoadName', e.target.value)}
                      placeholder="e.g. Hwy 178 / Liberty Highway"
                      className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">From Intersecting Road (X Road)</label>
                      <input
                        type="text"
                        value={form.rcFromRoad}
                        onChange={(e) => handleFieldChange('rcFromRoad', e.target.value)}
                        placeholder="e.g. Centerville Road"
                        className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-dim">To Intersecting Road (X Road)</label>
                      <input
                        type="text"
                        value={form.rcToRoad}
                        onChange={(e) => handleFieldChange('rcToRoad', e.target.value)}
                        placeholder="e.g. Airport Road"
                        className="w-full px-4 py-2.5 bg-brand-field border border-white/5 rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                      📷 Auto-appends "- See Attached Image -" to the message template!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Controls & Bookmarklet Generator Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header tabs for Right Column */}
          <div className="border border-white/5 rounded-2xl bg-brand-panel/50 backdrop-blur-md shadow-lg overflow-hidden">
            <div className="flex border-b border-white/5 bg-black/10">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-4 text-[10px] h-11 font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-text-dim hover:text-text-main'}`}
              >
                Output Preview
              </button>
              <button
                onClick={() => setActiveTab('instructions')}
                className={`flex-1 py-4 text-[10px] h-11 font-black uppercase tracking-widest transition-all ${activeTab === 'instructions' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-text-dim hover:text-text-main'}`}
              >
                Auto-Fill Setup & Drag-and-Drop
              </button>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'preview' ? (
                  <motion.div
                    key="tab-preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Subject Row */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider text-text-dim">Compiling Subject Line</span>
                        <button
                          onClick={() => copyToClipboard(getSubject(), 'subject')}
                          className="flex items-center gap-1.5 px-3 py-1 bg-black/20 hover:bg-black/40 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400 transition-all active:scale-95"
                        >
                          {copiedSubject ? (
                            <>
                              <Check size={10} className="text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={10} />
                              <span>Copy Line</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-brand-field border border-white/5 rounded-xl p-4 font-mono text-xs text-text-main tracking-wide">
                        {getSubject()}
                      </div>
                    </div>

                    {/* Body Text Box */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider text-text-dim">Compiled Message Body</span>
                        <button
                          onClick={() => copyToClipboard(getBody(), 'body')}
                          className="flex items-center gap-1.5 px-3 py-1 bg-black/20 hover:bg-black/40 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400 transition-all active:scale-95"
                        >
                          {copiedBody ? (
                            <>
                              <Check size={10} className="text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={10} />
                              <span>Copy Body</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-brand-field border border-white/5 rounded-xl p-4 font-mono text-xs text-text-main leading-relaxed select-all whitespace-pre-wrap custom-scrollbar max-h-72 overflow-y-auto">
                        {getBody()}
                      </div>
                    </div>

                    {/* Auto-Inject Specs List */}
                    <div className="bg-black/20 border border-white/5 rounded-xl p-4.5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">🤖 Active Bookmarklet Auto-Inject Specs</span>
                        <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[8px]">Available Boxes Armed</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        <div className="bg-brand-field p-2.5 rounded-lg border border-white/5 flex flex-col gap-1 shadow-inner">
                          <span className="text-text-main/70 text-[8px]">Group Selection</span>
                          <span className="text-emerald-400 text-[9px] font-black tracking-tight truncate">Medshore / Anderson Alerts</span>
                        </div>
                        <div className="bg-brand-field p-2.5 rounded-lg border border-white/5 flex flex-col gap-1 shadow-inner">
                          <span className="text-text-main/70 text-[8px]">Registered User</span>
                          <span className="text-emerald-400 text-[9px] font-black">Yes (First Radio Box)</span>
                        </div>
                        <div className="bg-brand-field p-2.5 rounded-lg border border-white/5 flex flex-col gap-1 shadow-inner">
                          <span className="text-text-main/70 text-[8px]">Acknowledge Required</span>
                          <span className="text-emerald-400 text-[9px] font-black">Yes (Second Radio Box)</span>
                        </div>
                        <div className="bg-brand-field p-2.5 rounded-lg border border-white/5 flex flex-col gap-1 shadow-inner">
                          <span className="text-text-main/70 text-[8px]">Dual Send Channels</span>
                          <span className="text-emerald-400 text-[9px] font-black">Email & Text Pages</span>
                        </div>
                      </div>
                    </div>

                    {/* Bookmarklet Quick-Launch action block */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-4 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 text-xs">
                          <Send size={15} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-text-main uppercase tracking-widest">ESO Suite Auto-Inject</span>
                          <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-widest mt-0.5">Integration Options</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] uppercase font-bold text-text-dim leading-relaxed tracking-wider">
                          Choose any of these options to install the bookmarklet in your browser. All options are formatted with the updated ESO class and input names!
                        </p>

                        {/* Interactive Drag & Drop Area */}
                        <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-3">
                          <h4 className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Option 1: Drag & Drop directly to your Bookmarks Bar</h4>
                          <p className="text-[8.5px] uppercase text-text-dim/80 leading-normal">
                            Make sure your Bookmarks Bar is visible (Ctrl+Shift+B or Cmd+Shift+B). Literally drag either of these buttons directly up to your bookmarks bar!
                          </p>
                          <div className="flex flex-wrap gap-2.5 pt-1">
                            <a
                              ref={bookmarkRef}
                              draggable
                              className="px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5 cursor-grab active:cursor-grabbing"
                              title="Drag this to your bookmarks bar"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Hammer size={11} />
                              <span>📥 ESO Match (Encoded)</span>
                            </a>
                            <a
                              ref={bookmarkRefPlain}
                              draggable
                              className="px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-grab active:cursor-grabbing"
                              title="Drag this to your bookmarks bar"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Hammer size={11} />
                              <span>📥 ESO Match (Plain-Text)</span>
                            </a>
                          </div>
                        </div>

                        {/* Manual Copy Area */}
                        <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-3">
                          <h4 className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Option 2: Copy link and create bookmark manually</h4>
                          <p className="text-[8.5px] uppercase text-text-dim/80 leading-normal">
                            Right-click your bookmarks bar, select <strong className="text-emerald-400">"Add Page" or "Add Bookmark"</strong>, set the Name to <strong className="text-emerald-400">"ESO Sync"</strong>, and paste either link below into the URL/Address box:
                          </p>

                          <div className="space-y-2.5 pt-1.5">
                            {/* Plain text input group */}
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase text-text-dim">Standard Address (Plain-Text - Recommended)</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={getBookmarkletHrefClean()}
                                  onClick={(e) => (e.target as HTMLInputElement).select()}
                                  className="flex-1 bg-black/40 border border-white/5 rounded-md px-3 py-1.5 text-[9px] font-mono text-text-dim/80 focus:outline-none select-all"
                                />
                                <button
                                  onClick={() => copyToClipboard(getBookmarkletHrefClean(), 'bookmarklet_clean')}
                                  className="px-3 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all active:scale-95 shrink-0"
                                >
                                  {copiedClean ? "Copied!" : "Copy"}
                                </button>
                              </div>
                            </div>

                            {/* Encoded input group */}
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase text-text-dim">Encoded Address (URL Encoded - Backup)</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={getBookmarkletHref()}
                                  onClick={(e) => (e.target as HTMLInputElement).select()}
                                  className="flex-1 bg-black/40 border border-white/5 rounded-md px-3 py-1.5 text-[9px] font-mono text-text-dim/80 focus:outline-none select-all"
                                />
                                <button
                                  onClick={() => copyToClipboard(getBookmarkletHref(), 'bookmarklet')}
                                  className="px-3 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all active:scale-95 shrink-0"
                                >
                                  {copiedBookmarklet ? "Copied!" : "Copy"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex justify-end">
                        <button
                          onClick={handleOpenSuite}
                          className="px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 transition-all active:scale-95 flex items-center gap-2"
                        >
                          <ExternalLink size={12} className="text-emerald-400" />
                          <span>Launch Scheduling Portal</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tab-instructions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Integration instructions</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex gap-4 items-start">
                          <div className="w-5 h-5 rounded-full bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 border border-emerald-500/20">1</div>
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-text-main">Equip Bookmarklet button</h4>
                            <p className="text-[10px] text-text-dim leading-relaxed uppercase font-semibold">
                              Click <strong className="text-emerald-400">📋 Copy Bookmarklet Address</strong> on the "Output Preview" tab. Right-click your browser bookmarks bar (press Command+Shift+B/Ctrl+Shift+B if hidden), select "Add Page" or "Add Bookmark", type "ESO Auto-fill", and paste into the URL / Address field.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4 items-start">
                          <div className="w-5 h-5 rounded-full bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 border border-emerald-500/20">2</div>
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-text-main">Open the dispatch center</h4>
                            <p className="text-[10px] text-text-dim leading-relaxed uppercase font-semibold">
                              Click <strong className="text-emerald-400">"Launch Scheduling Portal"</strong> to navigate to ESO Suite. This opens <code className="text-[9px] bg-black/20 px-1 py-0.5 rounded text-emerald-400 tracking-tight">esosuite.net</code> in a new secure tab.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4 items-start">
                          <div className="w-5 h-5 rounded-full bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 border border-emerald-500/20">3</div>
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-text-main">Magic Auto-fill inject</h4>
                            <p className="text-[10px] text-text-dim leading-relaxed uppercase font-semibold">
                              On that newly opened page, simply click the bookmark you saved in Step 1. The bookmarklet script will scan the form and instantly pre-populate the Subject and message boxes!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Advanced code view */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider text-text-dim">Script Source Code (Troubleshooting)</span>
                        <button
                          onClick={() => copyToClipboard(getRawBookmarkletCode(), 'bookmarklet')}
                          className="flex items-center gap-1.5 px-3 py-1 bg-black/20 hover:bg-black/40 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-400 transition-all active:scale-95"
                        >
                          {copiedBookmarklet ? (
                            <>
                              <Check size={10} className="text-emerald-400" />
                              <span>Copied Script!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={10} />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 bg-black/40 border border-white/5 rounded-xl text-[9px] font-mono text-text-dim overflow-x-auto max-h-56 custom-scrollbar leading-relaxed">
                        {getRawBookmarkletCode()}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
