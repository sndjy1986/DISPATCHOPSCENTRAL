import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, AiAnalysisResult } from '../../lib/camsTypes';
import { AiOverlay } from './AiOverlay';
import { analyzeFrame } from '../../lib/geminiService';
import { 
  Maximize2, 
  MoreVertical, 
  Cpu, 
  MapPin, 
  Navigation, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface CameraPlayerProps {
  camera: Camera;
  onSwitchCamera: (cam: Camera) => void;
  availableCameras: Camera[];
  globalAiEnabled: boolean;
  onToggleAi: () => void;
  refreshInterval: number;
}

export const CameraPlayer: React.FC<CameraPlayerProps> = ({ 
  camera, 
  onSwitchCamera,
  availableCameras,
  globalAiEnabled,
  onToggleAi,
  refreshInterval
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<number>(0);
  const errorCountRef = useRef(0);

  const getCooldownRemaining = useCallback(() => {
    const elapsed = Date.now() - lastAnalysisTime;
    return Math.max(0, refreshInterval - elapsed);
  }, [lastAnalysisTime, refreshInterval]);

  useEffect(() => {
    setHasError(false);
    errorCountRef.current = 0;
    
    if (videoRef.current) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          manifestLoadingMaxRetry: 3,
          levelLoadingMaxRetry: 3,
        });

        hls.loadSource(camera.url);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setHasError(false);
          errorCountRef.current = 0;
          videoRef.current?.play().catch(e => {
            if (e.name !== 'AbortError') console.error("Autoplay failed", e);
          });
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            errorCountRef.current++;
            if (errorCountRef.current > 5) {
              console.error("Too many fatal errors, stopping node sync", camera.id);
              setHasError(true);
              hls.destroy();
              hlsRef.current = null;
              return;
            }

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("Network sync issue, attempting re-link...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("Media sync issue, attempting recovery...");
                hls.recoverMediaError();
                break;
              default:
                setHasError(true);
                hls.destroy();
                hlsRef.current = null;
                break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = camera.url;
        videoRef.current.addEventListener('error', () => setHasError(true));
      }
    }

    // Reset analysis when camera changes
    setAnalysis(null);
    setLastAnalysisTime(0);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [camera.url]);

  const handleAnalyze = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isAnalyzing || !globalAiEnabled || hasError) return;
    
    // Check cooldown
    if (lastAnalysisTime > 0 && getCooldownRemaining() > 0) {
      console.log(`Node locked. ${Math.round(getCooldownRemaining() / 1000)}s until next sync.`);
      return;
    }

    // Ensure video has data and is ready for capture
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      let dataUrl = "";
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
      } catch (canvasErr) {
        console.warn("Canvas capture tainted or failed, falling back to server-side smart simulation for", camera.name, canvasErr);
      }
      
      const result = await analyzeFrame(dataUrl, camera.name);
      setAnalysis(result);
      setLastAnalysisTime(Date.now());
    } catch (error) {
      console.error("Node AI Logic Failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [camera.name, isAnalyzing, globalAiEnabled, hasError, lastAnalysisTime, getCooldownRemaining]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let isActive = true;

    const runLoop = async () => {
      if (!isActive) return;
      
      if (globalAiEnabled && !document.hidden) {
        await handleAnalyze();
      }
      
      if (!isActive) return;
      const remainingTime = getCooldownRemaining();
      const delay = remainingTime > 0 ? remainingTime : 1000;
      timeout = setTimeout(runLoop, delay);
    };

    if (globalAiEnabled) {
      runLoop();
    }
    
    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [globalAiEnabled, handleAnalyze, getCooldownRemaining]);

  const toggleFullscreen = () => {
    const wrapper = videoRef.current?.parentElement;
    if (!wrapper) return;

    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Interaction Layer - simplified, Menu now handled by CameraGrid
  return (
    <div 
      className="relative w-full h-full bg-bg-main group overflow-hidden transition-colors duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover pointer-events-none transition-opacity duration-700 font-mono"
        muted
        autoPlay
        playsInline
      />

      {/* Signal Lost Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-bg-main flex flex-col items-center justify-center z-10 border-2 border-red-500/20">
          <div className="w-1/2 h-1 bg-red-950/40 mb-6 overflow-hidden relative rounded-full">
            <motion.div 
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-red-500 opacity-50 shadow-[0_0_15px_#ef4444]"
            />
          </div>
          <span className="text-red-500 font-black text-[12px] tracking-[0.4em] uppercase animate-pulse">
            Terminal Signal Lost
          </span>
          <p className="themed-label mt-3 opacity-50">
            Node ID: {camera.id} / ERR_OFFLINE
          </p>
          <button 
            onClick={() => { setHasError(false); onSwitchCamera(camera); }}
            className="mt-6 px-6 py-2 bg-red-500/10 border border-red-500/30 text-[10px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-full tracking-widest"
          >
            RESTORE SYNC
          </button>
        </div>
      )}

      {/* AI Overlay Rendering */}
      {showOverlay && globalAiEnabled && (
        <AiOverlay 
          analysis={analysis} 
          isAnalyzing={isAnalyzing}
          videoWidth={videoRef.current?.videoWidth || 0}
          videoHeight={videoRef.current?.videoHeight || 0}
        />
      )}

      {/* Header Info Overlay */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-30 pointer-events-none">
        <div className="flex gap-2">
          <span className="bg-bg-surface/60 backdrop-blur-md px-3 py-1 text-[10px] font-black border border-white/10 text-white uppercase tracking-widest rounded-lg transition-colors duration-500">
            {camera.name.split(' ')[0]} {camera.name.split(' ')[1]}
          </span>
          <button 
            onClick={onToggleAi}
            className="group/ai cursor-pointer pointer-events-auto"
          >
            <span className={`bg-indigo-500/20 backdrop-blur-md px-3 py-1 text-[10px] font-black border border-indigo-500/30 text-indigo-400 flex items-center gap-2 rounded-lg transition-all duration-500 ${globalAiEnabled ? 'bg-indigo-500/40 border-indigo-400' : 'hover:bg-indigo-500/30'}`}>
              <div className={`w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-brand-indigo ${globalAiEnabled ? 'animate-pulse' : 'opacity-50'}`} />
              AI_FEED {globalAiEnabled ? 'ACTIVE' : 'START'}
            </span>
          </button>
        </div>

        <div className="flex flex-col items-end text-[9px] font-mono text-slate-400 bg-bg-surface/60 px-3 py-1.5 backdrop-blur-md border border-white/5 rounded-lg transition-colors duration-500">
          <div className="tracking-tighter">COORD: {camera.lat.toFixed(4)}N {Math.abs(camera.lng).toFixed(4)}W</div>
          <div className="text-emerald-400 font-bold tracking-widest mt-0.5">FLOW: {analysis ? analysis.flow : (isAnalyzing ? 'SYNCING...' : 'WAITING')}</div>
        </div>
      </div>

      {/* Right-click instruction toast (temporary hint) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 pointer-events-none"
          >
            <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em]">Right-Click to Swap Sensor</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Summary Bar */}
      {globalAiEnabled && analysis && showOverlay && (
        <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end z-30 pointer-events-none">
          <div className="max-w-[70%]">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-[9px] font-black border border-emerald-500/20 uppercase tracking-[0.2em]">
                FLOW_METRIC
              </span>
              <span className="text-white bg-indigo-600/60 px-2 py-0.5 rounded text-[9px] font-black border border-white/10 uppercase tracking-[0.2em] shadow-lg">
                {analysis.flow}
              </span>
            </div>
            <div className="text-white text-[12px] font-black leading-tight drop-shadow-2xl uppercase tracking-widest bg-bg-surface/40 backdrop-blur-sm p-3 border border-white/5 rounded-2xl transition-colors duration-500">
              {analysis.summary}
            </div>
          </div>
          
          <div className="h-12 w-32 bg-bg-surface/60 backdrop-blur-md border border-white/10 p-2 flex flex-col justify-between rounded-xl transition-colors duration-500">
            <div className="themed-label leading-none mb-1 opacity-50">Sync Window</div>
            <div className="text-[11px] text-emerald-400 font-mono text-right font-bold">
              {lastAnalysisTime > 0 && getCooldownRemaining() > 0 
                ? `${Math.floor(getCooldownRemaining() / 60000)}m ${Math.floor((getCooldownRemaining() % 60000) / 1000)}s` 
                : 'READY'}
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-1 overflow-hidden">
              <motion.div 
                initial={false}
                animate={{ width: `${(1 - getCooldownRemaining() / refreshInterval) * 100}%` }}
                className="h-full bg-emerald-500 shadow-brand-emerald"
              />
            </div>
          </div>
        </div>
      )}

      {!globalAiEnabled && (
        <div className="absolute bottom-5 left-5 z-30 pointer-events-none">
          <span className="text-slate-500 bg-slate-950/40 px-3 py-1.5 border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] rounded-full backdrop-blur-sm">
            AI_ENGINE_OFFLINE
          </span>
        </div>
      )}

      {/* UI Controls */}
      <div className={`absolute right-5 top-20 flex flex-col gap-3 transition-opacity duration-300 z-40 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={() => setShowOverlay(!showOverlay)}
          className={`p-3 bg-bg-surface/60 border border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all rounded-2xl backdrop-blur-xl shadow-xl duration-500 ${!showOverlay ? 'text-red-500 border-red-500/30' : ''}`}
          title="Toggle AI HUD"
        >
          {showOverlay ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>

        <button 
          onClick={toggleFullscreen}
          className="p-3 bg-bg-surface/60 border border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all rounded-2xl backdrop-blur-xl shadow-xl duration-500"
          title="Toggle Fullscreen"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}
// sync;
