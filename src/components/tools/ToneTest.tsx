import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Activity, Volume2, Music, Waves, Settings2, BarChart2 } from 'lucide-react';

type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export function ToneTest() {
  const [active, setActive] = useState(false);
  const [frequency, setFrequency] = useState(440);
  const [volume, setVolume] = useState(0.1);
  const [waveform, setWaveform] = useState<Waveform>('sine');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = 2048;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (active && analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(dataArray);
        
        ctx.beginPath();
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(129, 140, 248, 0.4)';
        
        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * canvas.height / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      } else {
        // IDLE STATE
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }
      
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [active]);

  // Update frequency and volume in real-time
  useEffect(() => {
    if (active && oscRef.current && gainRef.current) {
      oscRef.current.frequency.setTargetAtTime(frequency, audioCtxRef.current!.currentTime, 0.05);
      gainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current!.currentTime, 0.05);
    }
  }, [frequency, volume, active]);

  const toggleTone = () => {
    if (!active) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      const analyser = audioCtxRef.current.createAnalyser();
      
      analyser.fftSize = 2048;
      
      osc.type = waveform;
      osc.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
      
      osc.connect(gain);
      gain.connect(analyser);
      analyser.connect(audioCtxRef.current.destination);
      
      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
      analyserRef.current = analyser;
      setActive(true);
    } else {
      oscRef.current?.stop();
      audioCtxRef.current?.close();
      setActive(false);
    }
  };

  const waveforms: { id: Waveform; icon: any }[] = [
    { id: 'sine', icon: Waves },
    { id: 'square', icon: Square },
    { id: 'sawtooth', icon: BarChart2 },
    { id: 'triangle', icon: Activity },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             
             {/* Visualization and Basic Info */}
             <div className="lg:col-span-8 space-y-8">
                <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-inner group">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)] pointer-events-none" />
                   <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto relative z-10" />
                   
                   <div className="absolute bottom-6 left-8 flex items-center gap-2 opacity-40">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white">LIVE_OSCILLOSCOPE</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                         <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
                            <Settings2 className="w-3 h-3" /> Frequency
                         </span>
                         <span className="text-sm font-mono font-bold text-indigo-400">{frequency} Hz</span>
                      </div>
                      <input 
                         type="range" 
                         min="20" 
                         max="10000" 
                         value={frequency}
                         onChange={(e) => setFrequency(parseInt(e.target.value))}
                         className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                      />
                      <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                         <span>Sub</span>
                         <span>Low</span>
                         <span>Mid</span>
                         <span>High</span>
                         <span>HF</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                         <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
                            <Volume2 className="w-3 h-3" /> Gain Control
                         </span>
                         <span className="text-sm font-mono font-bold text-emerald-400">{Math.round(volume * 100)}%</span>
                      </div>
                      <input 
                         type="range" 
                         min="0" 
                         max="1" 
                         step="0.01"
                         value={volume}
                         onChange={(e) => setVolume(parseFloat(e.target.value))}
                         className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                      />
                   </div>
                </div>
             </div>

             {/* Mode Selection and Toggle */}
             <div className="lg:col-span-4 flex flex-col gap-8">
                <div className="space-y-4">
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Waveform Matrix</span>
                   <div className="grid grid-cols-2 gap-4">
                      {waveforms.map((w) => (
                         <button
                            key={w.id}
                            onClick={() => {
                               setWaveform(w.id);
                               if (active && oscRef.current) oscRef.current.type = w.id;
                            }}
                            className={`
                               p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all duration-300
                               ${waveform === w.id 
                                 ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                                 : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'}
                            `}
                         >
                            <w.icon className="w-6 h-6" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">{w.id}</span>
                         </button>
                      ))}
                   </div>
                </div>

                <div className="mt-auto">
                   <button 
                      onClick={toggleTone}
                      className={`
                         w-full aspect-[4/3] rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all duration-500 border-2
                         ${active 
                           ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-lg shadow-rose-500/10' 
                           : 'bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95'}
                      `}
                   >
                      <div className={`p-4 rounded-full ${active ? 'bg-rose-500 text-white' : 'bg-white/20'}`}>
                         {active ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                      </div>
                      <div className="text-center">
                         <p className="text-sm font-bold uppercase tracking-[0.2em]">{active ? 'DEACTIVATE' : 'INITIATE TONE'}</p>
                         <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Status: {active ? 'BROADCASTING' : 'STANDBY'}</p>
                      </div>
                   </button>
                </div>
             </div>
          </div>
       </div>

       {/* Technical Specs Footer */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Music className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[9px] uppercase font-bold text-slate-500">Sample Rate</p>
                <p className="text-lg font-bold text-white tracking-tight">48.0 kHz</p>
             </div>
          </div>
          <div className="p-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 text-emerald-400">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[9px] uppercase font-bold text-slate-500">Peak Volume</p>
                <p className="text-lg font-bold text-white tracking-tight">0.0 dBFS</p>
             </div>
          </div>
          <div className="p-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 text-amber-400">
             <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[9px] uppercase font-bold text-slate-500">Stability</p>
                <p className="text-lg font-bold text-white tracking-tight">Nominal</p>
             </div>
          </div>
       </div>
    </div>
  );
}
