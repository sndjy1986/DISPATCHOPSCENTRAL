import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hash, 
  Radio, 
  Shield, 
  Search,
  BookOpen,
  Filter,
  ArrowRight,
  Clipboard,
  X,
  Flame
} from 'lucide-react';

const TEN_CODES = [
  { code: '10-0', meaning: 'Chase in Progress' },
  { code: '10-1', meaning: 'Signal Weak' },
  { code: '10-2', meaning: 'Signal Good' },
  { code: '10-3', meaning: 'Stop Transmitting' },
  { code: '10-4', meaning: 'Okay / Affirmative' },
  { code: '10-5', meaning: 'Relay to _______' },
  { code: '10-6', meaning: 'Busy' },
  { code: '10-7', meaning: 'Out of Service' },
  { code: '10-8', meaning: 'In Service' },
  { code: '10-9', meaning: 'Repeat / Say Again' },
  { code: '10-10', meaning: 'Negative' },
  { code: '10-11', meaning: '_______ On Duty' },
  { code: '10-12', meaning: 'Stand By' },
  { code: '10-13', meaning: 'Existing Conditions' },
  { code: '10-14', meaning: 'Message Info' },
  { code: '10-15', meaning: 'Message Delivered' },
  { code: '10-16', meaning: 'Reply to Message' },
  { code: '10-17', meaning: 'Enroute' },
  { code: '10-18', meaning: 'Urgent / Quickly' },
  { code: '10-19', meaning: 'Contact' },
  { code: '10-20', meaning: 'Location' },
  { code: '10-21', meaning: 'Call by Phone' },
  { code: '10-22', meaning: 'Cancel / Disregard' },
  { code: '10-23', meaning: 'Arrived on Scene' },
  { code: '10-24', meaning: 'Assignment Completed' },
  { code: '10-25', meaning: 'Meet With' },
  { code: '10-26', meaning: 'ETA' },
  { code: '10-27', meaning: 'Drivers License Check' },
  { code: '10-28', meaning: 'Tag Information' },
  { code: '10-29', meaning: 'Record Check / Subject' },
  { code: '10-30', meaning: 'Danger / Use Caution' },
  { code: '10-32', meaning: 'Emergency Response' },
  { code: '10-33', meaning: 'Officer Needs Help / Distress' },
  { code: '10-34', meaning: 'Time' },
  { code: '10-35', meaning: 'Drowning' },
  { code: '10-36', meaning: 'Civil Dispute' },
  { code: '10-37', meaning: 'Notify _______' },
  { code: '10-38', meaning: 'Suicide / Attempt' },
  { code: '10-39', meaning: 'Gas Drive Off' },
  { code: '10-40', meaning: 'Road Repairs at _______' },
  { code: '10-41', meaning: 'Beginning Tour of Duty' },
  { code: '10-42', meaning: 'Ending Tour of Duty' },
  { code: '10-43', meaning: 'Open Door / Unsecured' },
  { code: '10-44', meaning: 'Silent Run' },
  { code: '10-45', meaning: 'Animal Carcass' },
  { code: '10-46', meaning: 'Stranded Motorist' },
  { code: '10-47', meaning: 'Suspicious Vehicle' },
  { code: '47B', meaning: 'Suspicious Aircraft' },
  { code: '10-48', meaning: 'Traffic Stop' },
  { code: '10-49', meaning: 'Noise or Civil Disturbance' },
  { code: '10-50', meaning: 'MVA' },
  { code: '10-51', meaning: 'Wrecker Needed' },
  { code: '10-52', meaning: 'Ambulance Needed' },
  { code: '10-53', meaning: 'Road Blocked' },
  { code: '10-54', meaning: 'Traffic Control' },
  { code: '10-55', meaning: 'Intoxicated Driver' },
  { code: '10-56', meaning: 'Intoxicated Person' },
  { code: '56B', meaning: 'Underaged Drinking' },
  { code: '10-57', meaning: 'Hit and Run' },
  { code: '10-58', meaning: 'Riot' },
  { code: '10-59', meaning: 'Person with Gun' },
  { code: '10-60', meaning: 'Notify the Coroner' },
  { code: '10-61', meaning: 'Illegal Use of Radio' },
  { code: '10-62', meaning: 'Prison/Jail Break or Escape' },
  { code: '10-63', meaning: 'Request Phone Number' },
  { code: '10-64', meaning: 'Bomb Threat' },
  { code: '10-65', meaning: 'Blockade' },
  { code: '10-66', meaning: 'Drag Racing' },
  { code: '66B', meaning: 'Reckless Driver' },
  { code: '10-67', meaning: 'Subject in Custody / Prisoner' },
  { code: '10-68', meaning: 'Mental Subject' },
  { code: '10-69', meaning: 'Investigative Detention' },
  { code: '10-70', meaning: 'Fire (Specify)' },
  { code: '10-71', meaning: 'Wanted or Stolen' },
  { code: '10-72', meaning: 'Larceny' },
  { code: '10-73', meaning: 'Burglary' },
  { code: '10-74', meaning: 'Armed Robbery' },
  { code: '10-75', meaning: 'Shooting Incident' },
  { code: '10-76', meaning: 'Assault' },
  { code: '10-77', meaning: 'Vandalism' },
  { code: '10-78', meaning: 'Officer Assist' },
  { code: '78B', meaning: 'DSS' },
  { code: '78C', meaning: 'EMS' },
  { code: '78D', meaning: 'Other Agency' },
  { code: '10-79', meaning: 'Prowler' },
  { code: '10-80', meaning: 'Suspicious Person' },
  { code: '10-81', meaning: 'Missing Person' },
  { code: '10-82', meaning: 'Domestic Problem' },
  { code: '10-83', meaning: 'Fight in Progress' },
  { code: '10-84', meaning: 'Crime in Progress' },
  { code: '10-85', meaning: 'Alarm' },
  { code: 'Code 1', meaning: 'Legit Alarm' },
  { code: 'Code 2', meaning: 'Unfounded Alarm' },
  { code: 'Code 3', meaning: 'Human Error Alarm' },
  { code: 'Code 4', meaning: 'Act of God Alarm' },
  { code: 'Code 5', meaning: 'Unknown Alarm' },
  { code: '10-86', meaning: 'Out of Vehicle - LEC' },
  { code: '10-87', meaning: 'Meal Break' },
  { code: '10-88', meaning: 'Unit in Vicinity' },
  { code: '10-89', meaning: 'Escort' },
  { code: '89A', meaning: 'Mental Escort' },
  { code: '10-90', meaning: 'Prepare to Copy' },
  { code: '10-91', meaning: 'Return to -------' },
  { code: '10-92', meaning: 'Delayed Due to -------' },
  { code: '10-93', meaning: 'Litter Offense' },
  { code: '10-94', meaning: 'BOLO / General Broadcast' },
  { code: '10-95', meaning: 'Prisoner Pick Up / Transport' },
  { code: '10-97', meaning: 'Radio Check' },
  { code: '10-98', meaning: 'Switch to Backup Radio/Channel' },
  { code: '10-99', meaning: 'Traffic Light Out' },
];

const SIGNAL_CODES = [
  { code: 'SIG 0', meaning: 'SUBJ WITH KNIFE OR SHARP OBJ' },
  { code: 'SIG 1', meaning: 'UNFOUNDED' },
  { code: 'SIG 2', meaning: 'GONE ON ARRIVAL' },
  { code: 'SIG 3', meaning: 'NO ACTION - HANDLED BY OFFICER' },
  { code: 'SIG 4', meaning: 'MISC REPORT' },
  { code: 'SIG 5', meaning: 'INCIDENT REPORT' },
  { code: 'SIG 6', meaning: 'TRAFFIC TICKET' },
  { code: 'SIG 7', meaning: 'TURNED OVER TO OTHER AGENCY' },
  { code: 'SIG 8', meaning: 'WARRANTS' },
  { code: 'SIG 9', meaning: 'CLEAR TO COPY?' },
  { code: 'SIG 10', meaning: 'NEED NARCOTIC OFFICER' },
  { code: 'SIG 11', meaning: 'BACK UP UNIT' },
  { code: 'SIG 12', meaning: 'OPERATOR NOT FAMILIAR' },
  { code: 'SIG 13', meaning: 'SUSPENDED DRIVERS LICENSE' },
  { code: 'SIG 14', meaning: 'REQUEST DIVE TEAM' },
  { code: 'SIG 15', meaning: 'COPY SENSATIVE INFORMATION' },
  { code: 'SIG 16', meaning: 'RESUME NORMAL RADIO TRAFFIC' },
  { code: 'SIG 17', meaning: 'RAPE' },
  { code: 'SIG 18', meaning: 'UNLOCK CAR DOOR – PUBLIC SERV.' },
  { code: 'SIG 19', meaning: 'CHILD / ELDER ABUSE' },
  { code: 'SIG 20', meaning: 'ABANDONED VEH' },
  { code: 'SIG 21', meaning: 'KIDNAPPING' },
  { code: 'SIG 22', meaning: 'ADVISORY CALL' },
  { code: 'SIG 23', meaning: 'BAD CHECK' },
  { code: 'SIG 24', meaning: 'BREACH OF TRUST' },
  { code: 'SIG 25', meaning: 'DRUGS' },
  { code: 'SIG 26', meaning: 'FORGERY' },
  { code: 'SIG 27', meaning: 'FOUND PROPERTY' },
  { code: 'SIG 27A', meaning: 'LOST PROPERTY' },
  { code: 'SIG 28', meaning: 'GAMBLING' },
  { code: 'SIG 29', meaning: 'MURDER / HOMICIDE' },
  { code: 'SIG 30', meaning: 'HOSTAGE SITUATION' },
  { code: 'SIG 31', meaning: 'INDECENT EXPOSURE' },
  { code: 'SIG 32', meaning: 'LOUD MUSIC' },
  { code: 'SIG 33', meaning: 'OVERDOSE' },
  { code: 'SIG 34', meaning: 'PROSTITUTION' },
  { code: 'SIG 35', meaning: 'PURSE SNATCHING / STRONG ARM' },
  { code: 'SIG 36', meaning: 'SHOPLIFTING IN CUSTODY' },
  { code: 'SIG 36S', meaning: 'SHOPLIFTER STILL IN STORE – IP' },
  { code: 'SIG 37', meaning: 'UNKNOWN SITUATION' },
  { code: 'SIG 38', meaning: 'STABBING' },
  { code: 'SIG 39', meaning: 'STAKE OUT' },
  { code: 'SIG 40', meaning: 'TRAFFIC VIOLATION' },
  { code: 'SIG 41', meaning: 'TRESSPASSING' },
  { code: 'SIG 42', meaning: 'UNLAWFUL USE TELEPHONE' },
  { code: 'SIG 43', meaning: 'STOLEN VEHICLE' },
  { code: 'SIG 44', meaning: 'EXTRA DUTY' },
  { code: 'SIG 45', meaning: 'WARRANT SERVICE' },
  { code: 'SIG 45C', meaning: 'CIVIL PROCESS' },
  { code: 'SIG 46', meaning: 'JUVENILE COMPLAINT' },
  { code: 'SIG 49', meaning: 'EXTRA PATROL / KEEP CHECK' },
  { code: 'SIG 50', meaning: 'K-9 REQUESTED' },
  { code: 'SIG 51', meaning: 'DOG OR CAT BITE / ANIMAL ATTACK' },
  { code: 'SIG 52', meaning: 'ANIMAL COMPLAINT' },
  { code: 'SIG 53', meaning: 'STALKING' },
  { code: 'SIG 54', meaning: 'THREATS' },
  { code: 'SIG 55', meaning: 'CHECK WELL BEING' },
  { code: 'SIG 56', meaning: 'FOLLOW UP' },
  { code: 'SIG 57', meaning: 'SHOTS FIRED IN AREA' },
  { code: 'SIG 58', meaning: 'DETENTION ORDER' },
  { code: 'SIG 59', meaning: 'SUBJ SEX OFFENDER' },
  { code: 'SIG 60', meaning: 'RESIDENCE VERIFICATION' },
  { code: 'SIG 61', meaning: 'SUBJ VGTOF FILE – DO NOT BROADCAST' },
  { code: 'SIG 80', meaning: 'WARRANT SERVED FOR OTHER AGENCY' },
  { code: 'SIG 81', meaning: 'AUTO BREAK IN' },
  { code: 'SIG 88', meaning: 'TERRORIST ACT' },
  { code: 'SIG 90', meaning: 'BATH ROOM BREAK' },
  { code: 'SIG 91', meaning: 'UNIVERSAL PRECAUTIONS' },
  { code: 'SIG 99', meaning: 'ALL OTHER' },
  { code: 'SIG 99A', meaning: 'ALL OTHER ANIMAL CONTROL' },
  { code: 'SIG 99E', meaning: 'ENVIROMENTAL ENFORCEMENT' },
  { code: 'SIG 99M', meaning: 'SUSPICOUS MAIL' },
  { code: 'SIG 99P', meaning: 'SUSPICUOUS POWDER' },
  { code: 'SIG 99S', meaning: 'SCHOOL INTRUDER' },
];

const DHEC_CODES = [
  { code: '1', meaning: 'Exhaustion' },
  { code: '2', meaning: 'Heat Stroke' },
  { code: '3', meaning: 'Seizure' },
  { code: '4', meaning: 'Diabetic Reaction' },
  { code: '5', meaning: 'Insulin Shock' },
  { code: '6', meaning: 'Poisoning' },
  { code: '7', meaning: 'Communicable Disease' },
  { code: '8', meaning: 'Unconscious' },
  { code: '9', meaning: 'DOA - No transport' },
  { code: '10', meaning: 'DOA - Transport' },
  { code: '11', meaning: 'Abrasion/Contusion' },
  { code: '12', meaning: 'Avulsion' },
  { code: '13', meaning: 'Laceration' },
  { code: '14', meaning: 'Puncture/Stab' },
  { code: '15', meaning: 'Gunshot' },
  { code: '16', meaning: 'Burn' },
  { code: '17', meaning: 'Hemorrhage' },
  { code: '18', meaning: 'Electrocution' },
  { code: '19', meaning: 'Chest Injury' },
  { code: '20', meaning: 'Crushing' },
  { code: '21', meaning: 'Amputation' },
  { code: '22', meaning: 'Dislocation' },
  { code: '23', meaning: 'Fracture' },
  { code: '24', meaning: 'Multitrauma/Shock' },
  { code: '25', meaning: 'Patient Trapped' },
  { code: '26', meaning: 'Eye Strain' },
  { code: '29', meaning: 'Sprain/Strain' },
  { code: '30', meaning: 'Head Injury' },
  { code: '31', meaning: 'Paralysis' },
  { code: '32', meaning: 'Spinal Injury' },
  { code: '37', meaning: 'Animal Bite' },
  { code: '38', meaning: 'Snake Bite' },
  { code: '40', meaning: 'Hysteria' },
  { code: '41', meaning: 'Fainting' },
  { code: '43', meaning: 'Psychiatric/Behavioral' },
  { code: '44', meaning: 'Overdose' },
  { code: '45', meaning: 'Impairment similar to Alcohol' },
  { code: '46', meaning: 'Altered Mental Status' },
  { code: '51', meaning: 'GI Problems' },
  { code: '52', meaning: 'GU Problems' },
  { code: '60', meaning: 'OB Prenatal' },
  { code: '61', meaning: 'OB Postnatal' },
  { code: '62', meaning: 'OB Emergency' },
  { code: '63', meaning: 'OB Abortion' },
  { code: '64', meaning: 'GYN Problem' },
  { code: '65', meaning: 'OB Delivery' },
  { code: '70', meaning: 'Apnea (not breathing)' },
  { code: '71', meaning: 'Airway Obstruction' },
  { code: '72', meaning: 'Hyperventilation' },
  { code: '73', meaning: 'Pulmonary Edema' },
  { code: '74', meaning: 'Respiratory Distress' },
  { code: '75', meaning: 'Anaphylactic/Toxic Shock' },
  { code: '76', meaning: 'Near Drowning' },
  { code: '80', meaning: 'Coronary Problem' },
  { code: '81', meaning: 'Congestive Heart Failure' },
  { code: '82', meaning: 'Hypertension' },
  { code: '83', meaning: 'Cardiac Arrest' },
  { code: '84', meaning: 'CVA/TIA/Stroke' },
  { code: '85', meaning: 'Hypotension' },
  { code: '86', meaning: 'Chest Pain' },
  { code: '90', meaning: 'Unknown Complaint' },
  { code: '91', meaning: 'Transport for Exam' },
  { code: '92', meaning: 'Non-Emergency Transport' },
  { code: '93', meaning: 'No Transport' },
  { code: '94', meaning: 'Cancelled Call' },
  { code: '95', meaning: 'False Call' },
  { code: '101', meaning: 'Hypothermia' },
  { code: '102', meaning: 'Sexual Assault' },
  { code: '103', meaning: 'Cold/Flu' },
  { code: '104', meaning: 'Headache' },
  { code: '105', meaning: 'Weakness/Dizziness' },
  { code: '106', meaning: 'Pain' },
  { code: '107', meaning: 'Cancer' },
  { code: '108', meaning: 'Dialysis' },
  { code: '109', meaning: 'Medical Device Failure' },
  { code: '110', meaning: 'Post Operative Complications' },
  { code: '111', meaning: 'Bed Confined' },
  { code: '112', meaning: 'ALS Monitoring Req.' },
  { code: '113', meaning: 'BLS Monitoring Req.' },
  { code: '114', meaning: 'Specialty Care Monitoring' },
  { code: 'Red', meaning: 'Immediate / Priority 1' },
  { code: 'Yellow', meaning: 'Delayed / Priority 2' },
  { code: 'Green', meaning: 'Minor / Priority 3' },
  { code: 'Black', meaning: 'Deceased / Expectant' },
];

const RESCUENET_CODES = [
  { code: '77', meaning: 'Priority Transfer' },
  { code: '88', meaning: 'Non-Emergency Transport' },
  { code: '99', meaning: 'Emergency Transport' },
  { code: 'C1', meaning: 'Stable' },
  { code: 'C2', meaning: 'Unstable' },
  { code: 'C3', meaning: 'Critical' },
];

const FIRE_RESPONSE_CODES = [
  { code: 'FT1', meaning: 'Structure Fire - Residential' },
  { code: 'FT2', meaning: 'Structure Fire - Commercial' },
  { code: 'FT3', meaning: 'Grass / Brush Fire' },
  { code: 'FT4', meaning: 'Vehicle Fire' },
  { code: 'FT5', meaning: 'Medical Call - First Response' },
  { code: 'FT6', meaning: 'MVA with Entrapment' },
  { code: 'FT7', meaning: 'MVA - No Entrapment' },
  { code: 'FT8', meaning: 'Working Fire Alert' },
  { code: 'FT9', meaning: 'CO Alarm / Gas Leak' },
  { code: 'FT10', meaning: 'Service Call / Public Assist' },
  { code: 'FT11', meaning: 'Smoke Investigation' },
  { code: 'FT12', meaning: 'Hazmat Incident' },
  { code: 'FT13', meaning: 'Rescue Incident (High Angle/Swift Water)' },
  { code: 'FT14', meaning: 'Transformer / Power Line Down' },
  { code: 'FT15', meaning: 'Mutual Aid Request' },
];

type Category = 'TEN' | 'SIGNAL' | 'DHEC' | 'RESCUENET' | 'FIRE';

export default function CodesReference() {
  const [activeCategory, setActiveCategory] = useState<Category>('TEN');
  const [search, setSearch] = useState('');

  const getCodes = () => {
    switch (activeCategory) {
      case 'TEN': return TEN_CODES;
      case 'SIGNAL': return SIGNAL_CODES;
      case 'DHEC': return DHEC_CODES;
      case 'RESCUENET': return RESCUENET_CODES;
      case 'FIRE': return FIRE_RESPONSE_CODES;
      default: return [];
    }
  };

  const filteredCodes = getCodes().filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) || 
    c.meaning.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [
    { id: 'TEN', label: 'TEN Codes', icon: Hash, color: 'text-indigo-400' },
    { id: 'SIGNAL', label: 'Signal Codes', icon: Radio, color: 'text-emerald-400' },
    { id: 'DHEC', label: 'DHEC Codes', icon: Shield, color: 'text-rose-400' },
    { id: 'FIRE', label: 'Fire Response', icon: Flame, color: 'text-orange-400' },
    { id: 'RESCUENET', label: 'RescueNet', icon: BookOpen, color: 'text-amber-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                <BookOpen className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tight">Reference <span className="text-indigo-500 not-italic">Matrix</span></h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Operational Codes & Signal Lookup</p>
             </div>
          </div>
        </div>

        <div className="relative group w-full md:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search code or terminal meaning..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#101014]/60 backdrop-blur-xl border border-white/5 py-4 pl-14 pr-6 rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none focus:border-indigo-500/50 transition-all shadow-inner"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-4 mb-10">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as Category);
                setSearch('');
              }}
              className={`
                flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all duration-300
                ${isActive 
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-white shadow-[0_0_30px_rgba(79,70,229,0.1)]' 
                  : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'}
              `}
            >
              <Icon size={16} className={isActive ? cat.color : ''} />
              <span className="text-[11px] font-black uppercase tracking-widest">{cat.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCodes.map((item, idx) => (
            <motion.div 
              key={item.code}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
              className="tactical-card p-6 flex flex-col group hover:border-indigo-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-xs font-black uppercase tracking-widest">
                  {item.code}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-indigo-500 transition-colors" />
              </div>
              <p className="text-[13px] font-black text-white uppercase tracking-wider leading-relaxed group-hover:text-indigo-100 transition-colors">
                {item.meaning}
              </p>
            </motion.div>
          ))}

          {filteredCodes.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-6 text-slate-600">
               <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center opacity-20">
                  <X size={32} />
               </div>
               <p className="text-xs font-black uppercase tracking-[0.3em]">No matching codes detected</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <footer className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Data Node Integrated</span>
        </div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">
          * Reference only. Follow agency protocols at all times.
        </p>
      </footer>
    </div>
  );
}
