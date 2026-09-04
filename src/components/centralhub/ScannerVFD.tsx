import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Square, Volume2, Activity, Layers } from "lucide-react";
import { cn } from "../../lib/utils";

interface RadioCall {
  id: number;
  dateTime: string;
  groupId: number;
  groupLabel: string;
  label: string;
  name: string;
  talkgroup: number;
}

const VFDLineTicker = ({
  text = "",
  sizeClass = "text-3xl",
}: {
  text?: string;
  sizeClass?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setShouldScroll(
          textRef.current.offsetWidth > containerRef.current.offsetWidth,
        );
      }
    };

    // Check overflow after a brief delay to allow text rendering
    const timer = setTimeout(checkOverflow, 50);
    window.addEventListener("resize", checkOverflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [text]);

  const safeText = typeof text === "string" ? text : String(text || "");

  return (
    <div
      ref={containerRef}
      className={cn(
        "ticker-container",
        shouldScroll ? "!justify-start" : "!justify-center",
      )}
    >
      <span
        ref={textRef}
        className={cn(
          "ticker-text uppercase font-mono tracking-widest",
          sizeClass,
          shouldScroll ? "vfd-scroll" : "",
        )}
      >
        {safeText}
      </span>
    </div>
  );
};

export function ScannerVFD() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isExpanded, setIsExpanded] = useState(false);

  const [status, setStatus] = useState<
    "STANDBY" | "CONNECTING" | "CONNECTED" | "ERROR"
  >("STANDBY");
  const [activeCall, setActiveCall] = useState<RadioCall | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const lastPlayedIdRef = useRef<number>(0);
  const pollIntervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setStatus("STANDBY");
      setActiveCall(null);
      return;
    }

    setStatus("CONNECTING");

    // Initial fetch to get the current latest ID so we don't play the past calls wildly
    fetch("https://radioapi.sndjy.us/latest")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error("Invalid API response format");
        }
      })
      .then((data: RadioCall[]) => {
        setStatus("CONNECTED");
        setErrorMsg("");
        if (data && data.length > 0) {
          lastPlayedIdRef.current = data[0].id;
          setActiveCall(data[0]); // Just display the latest call immediately
        }
      })
      .catch((e) => {
        console.warn("API init error:", e);
        setStatus("ERROR");
        setErrorMsg(e instanceof Error ? e.message : String(e));
      });

    const poll = async () => {
      try {
        const res = await fetch("https://radioapi.sndjy.us/latest");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        let data: RadioCall[];
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error("Invalid API response format");
        }

        setErrorMsg("");
        if (data && data.length > 0) {
          const latest = data[0];

          if (latest.id > lastPlayedIdRef.current) {
            lastPlayedIdRef.current = latest.id;
            handleNewCall(latest);
          }
        }
      } catch (err) {
        console.warn("Polling error:", err);
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    };

    pollIntervalRef.current = window.setInterval(poll, 3000);

    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }
    };
  }, [isPlaying]);

  const handleNewCall = (call: RadioCall) => {
    setActiveCall(call);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    // We use direct radio api endpoint with CORS enabled
    const audioUrl = `https://radioapi.sndjy.us/audio/${call.id}`;
    const audio = new Audio(audioUrl);
    audio.volume = volume / 100;

    // Listen for ended so we can clear active UI if desired, but retaining it looks cooler
    audio.play().catch((e) => console.warn("Audio play blocked", e));
    audioRef.current = audio;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  return (
    <div className="flex flex-col gap-4">
      {/* VFD Container */}
      <div className="relative group w-full max-w-4xl mx-auto">
        <div className="vfd-case">
          <div className="vfd-display min-h-[160px] md:min-h-[200px] flex-col items-center justify-center">
            {/* Matrix Text Area */}
            <div className="relative z-10 w-full flex flex-col items-center gap-2 md:gap-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCall ? activeCall.id : "idle"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2 md:gap-4 w-full px-2"
                >
                  <VFDLineTicker
                    text={
                      activeCall
                        ? activeCall.name || activeCall.label || "VOICE UPLINK"
                        : "STANDBY"
                    }
                    sizeClass="text-2xl sm:text-4xl md:text-5xl"
                  />
                  <VFDLineTicker
                    text={
                      activeCall
                        ? `TG:${activeCall.talkgroup} ${activeCall.groupLabel || ""}`
                        : "AWAITING UPLINK"
                    }
                    sizeClass="text-lg sm:text-xl md:text-2xl opacity-70"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Status Indicators - VFD Style */}
          <div className="absolute bottom-4 left-8 right-8 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 md:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 md:w-2 md:h-2 rounded-sm transition-all duration-300",
                    isPlaying && i <= volume / 8
                      ? "bg-[#26e680] shadow-[0_0_8px_#26e680]"
                      : "bg-black/40",
                    activeCall && isPlaying && i <= volume / 8 && i % 2 === 0
                      ? "animate-pulse"
                      : "",
                  )}
                />
              ))}
            </div>
            <div className="text-[10px] font-black text-[#26e680] opacity-50 uppercase tracking-[0.3em] font-mono">
              UPLINK :: {status}
            </div>
          </div>
        </div>

        {/* Tactical Controls */}
        <div className="mt-8 flex items-center justify-between gap-6">
          <div className="flex gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "h-14 px-8 rounded-2xl flex items-center gap-4 transition-all duration-500 border shadow-2xl active:scale-95 group",
                isPlaying
                  ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                  : "bg-white/5 border-white/10 text-cyan-400/60 hover:text-cyan-400 hover:border-cyan-400/50",
              )}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-500",
                  isPlaying
                    ? "bg-black animate-pulse"
                    : "bg-cyan-400/40 group-hover:bg-cyan-400",
                )}
              />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">
                {isPlaying ? "LINK: ACTIVE" : "ESTABLISH LINK"}
              </span>
              {isPlaying ? (
                <Square size={16} />
              ) : (
                <Play size={16} className="ml-1" />
              )}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 active:scale-95",
                isExpanded ? "bg-white/10 text-white" : "",
              )}
            >
              <Layers size={20} />
            </button>
          </div>

          {/* Volume Slider - VFD Style */}
          <div className="hidden md:flex flex-1 items-center gap-4 px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <Volume2 size={16} className="text-slate-600" />
            <div className="relative flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full bg-cyan-400/40"
                animate={{ width: `${Math.max(5, volume)}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Data Parser Diagnostics */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-6 border border-white/10 bg-black/40 rounded-2xl text-[10px] uppercase font-mono text-cyan-500/70 tracking-widest leading-relaxed">
              <div className="mb-2 text-white font-bold flex items-center gap-2 tracking-[0.3em] opacity-50">
                <Activity size={12} /> Live API Diagnostic Stream
              </div>
              <div className="space-y-1">
                {errorMsg && (
                  <div className="text-red-400 mb-2">ERR: {errorMsg}</div>
                )}
                {activeCall ? (
                  <div className="mt-4 space-y-1 border-white/10">
                    <div className="text-white">Active Intercept Data:</div>
                    <div>ID: {activeCall.id}</div>
                    <div>
                      SYS_ID: {activeCall.groupId} /{" "}
                      {activeCall.groupLabel || "Unknown"}
                    </div>
                    <div>TG: {activeCall.talkgroup}</div>
                    <div>DATE: {activeCall.dateTime}</div>
                    <div>
                      TAG: {activeCall.label || "N/A"} /{" "}
                      {activeCall.name || "N/A"}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 opacity-50 italic">
                    Awaiting transmission packets...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// UI optimizations and VFD scrolling layout fixes
