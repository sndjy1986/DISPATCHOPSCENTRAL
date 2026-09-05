import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, 
  AlertCircle, 
  Thermometer, 
  MapPin, 
  RefreshCw, 
  Navigation, 
  Shield, 
  Settings, 
  X, 
  Bell, 
  Clock, 
  ArrowDown, 
  ArrowUp,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  Snowflake,
  Gauge,
  Maximize2,
  CalendarDays,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useTerminal } from '../../context/TerminalContext';
import { onSnapshot, doc, db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

interface WeatherSettings {
  forecastDays: number;
  fontFamily: string;
  fontWeight: string;
  animatedIcons: boolean;
  hideAlertsIfEmpty: boolean;
  showPressure?: boolean;
  showTimeline?: boolean;
  showTomorrow?: boolean;
  showCurrent?: boolean;
  zipCode?: string;
}

interface WeatherData {
  temperature: number;
  condition: string;
  unit: string;
  forecast: any[];
  hourly: any[];
  alerts: any[];
  location: string;
  pressure?: number;
  humidity?: number;
  windSpeed?: string;
  windDirection?: string;
  daily: any[];
  lat?: number;
  lon?: number;
}

const DEFAULT_MODULES = {
  showPressure: true,
  showTimeline: true,
  showTomorrow: true,
  showCurrent: true
};

const formatHourTime = (timeStr?: string) => {
  if (!timeStr) return '--:--';
  try {
    const d = new Date(timeStr);
    return isNaN(d.getTime()) ? '--:--' : format(d, 'HH:mm');
  } catch {
    return '--:--';
  }
};

const AnimatedWeatherIcon = ({ condition, size = 24, className = "", animated = true }: { condition: string, size?: number, className?: string, animated?: boolean }) => {
  const c = condition?.toLowerCase() || '';
  
  if (c.includes('thunder') || c.includes('storm')) {
    return (
      <motion.div 
        animate={animated ? { 
          scale: [1, 1.02, 1],
          filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
        } : {}}
        transition={{ duration: 0.1, repeat: Infinity, repeatDelay: Math.random() * 5 + 2 }}
        className={cn("text-yellow-400", className)}
      >
        <CloudLightning size={size} />
      </motion.div>
    );
  }
  if (c.includes('rain') || c.includes('shower')) {
    return (
      <motion.div 
        animate={animated ? { y: [0, 2, 0] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className={cn("text-blue-400", className)}
      >
        <CloudRain size={size} />
      </motion.div>
    );
  }
  if (c.includes('snow') || c.includes('ice')) {
    return (
      <motion.div 
        animate={animated ? { 
          rotate: 360,
          y: [-1, 1, -1]
        } : {}}
        transition={{ 
          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        className={cn("text-sky-300", className)}
      >
        <Snowflake size={size} />
      </motion.div>
    );
  }
  if (c.includes('cloud') || c.includes('overcast')) {
    return (
      <motion.div 
        animate={animated ? { x: [-2, 2, -2] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={cn("text-slate-400", className)}
      >
        <Cloud size={size} />
      </motion.div>
    );
  }
  return (
    <motion.div 
      animate={animated ? { rotate: [0, 10, 0] } : {}}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className={cn("text-amber-400", className)}
    >
      <Sun size={size} />
    </motion.div>
  );
};

export function WeatherDashboard({ settings, compact = false }: { settings?: WeatherSettings, compact?: boolean }) {
  const { 
    setEmergencyLevel, 
    weatherZip, 
    setWeatherZip, 
    addNotification, 
  } = useTerminal();
  
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zipInput, setZipInput] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [globalModules, setGlobalModules] = useState(DEFAULT_MODULES);
  const [activeTab, setActiveTab] = useState<'now' | 'today' | 'forecast' | 'radar'>('now');
  const [isRadarExpanded, setIsRadarExpanded] = useState(false);
  
  const notifiedAlerts = useRef<Set<string>>(new Set());
  const forecastDays = settings?.forecastDays || 7;

  const radarUrl = useMemo(() => {
    if (!weather) return null;
    const lat = weather.lat || 34.8526;
    const lon = weather.lon || -82.394;
    return `https://www.rainviewer.com/map.html?loc=${lat},${lon},6&control=1&head=1&foot=1&v=1`;
  }, [weather]);

  // Derrive active modules from local settings if available, otherwise global
  const activeModules = {
    showCurrent: settings?.showCurrent ?? globalModules.showCurrent,
    showPressure: settings?.showPressure ?? globalModules.showPressure,
    showTimeline: settings?.showTimeline ?? globalModules.showTimeline,
    showTomorrow: settings?.showTomorrow ?? globalModules.showTomorrow,
  };

  // Sync Global Weather Modules settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (s) => {
      if (s.exists()) {
        const data = s.data();
        if (data.weatherModules) {
          setGlobalModules(data.weatherModules);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (weather) {
      if (weather.alerts.length > 0) {
        setEmergencyLevel('CRITICAL');
        weather.alerts.forEach((alert: any) => {
          const id = alert.id || (alert.properties && alert.properties.id);
          if (id && !notifiedAlerts.current.has(id)) {
            addNotification(`NWS ALERT: ${alert.properties.event}. ${alert.properties.headline}`, 'error');
            notifiedAlerts.current.add(id);
          }
        });
      } else {
        setEmergencyLevel('NORMAL');
      }
    }
  }, [weather, setEmergencyLevel, addNotification]);

  useEffect(() => {
    async function getWeatherData() {
      setLoading(true);
      setError(null);
      
      try {
        let latitude: number;
        let longitude: number;

        const targetZip = settings?.zipCode || weatherZip;
        if (targetZip) {
          const zipRes = await fetch(`https://api.zippopotam.us/us/${targetZip}`);
          if (!zipRes.ok) throw new Error('Invalid or unrecognized Zip Code.');
          const zipData = await zipRes.json();
          const place = zipData.places[0];
          latitude = parseFloat(place.latitude);
          longitude = parseFloat(place.longitude);
        } else {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }

        const pointsRes = await fetch(`https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`);
        if (!pointsRes.ok) throw new Error('Could not find NOAA grid coordinates.');
        const pointsData = await pointsRes.json();
        
        const forecastUrl = pointsData.properties.forecast;
        const forecastHourlyUrl = pointsData.properties.forecastHourly;
        const observationStationsUrl = pointsData.properties.observationStations;
        const city = pointsData.properties.relativeLocation.properties.city;
        const state = pointsData.properties.relativeLocation.properties.state;

        // Fetch stations first to get latest observations (for pressure)
        const stationsRes = await fetch(observationStationsUrl);
        const stationsData = await stationsRes.json();
        const stationId = stationsData.features[0].id;

        const [forecastRes, hourlyRes, alertsRes, obsRes] = await Promise.all([
          fetch(forecastUrl),
          fetch(forecastHourlyUrl),
          fetch(`https://api.weather.gov/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`),
          fetch(`${stationId}/observations/latest`)
        ]);

        if (!forecastRes.ok) throw new Error(`Forecast error: ${forecastRes.status} ${forecastRes.statusText}`);
        if (!hourlyRes.ok) throw new Error(`Hourly error: ${hourlyRes.status} ${hourlyRes.statusText}`);
        
        const forecastData = await forecastRes.json();
        const hourlyData = await hourlyRes.json();
        const alertsData = await alertsRes.json();
        const obsData = obsRes.ok ? await obsRes.json() : null;

        const currentPeriod = forecastData?.properties?.periods?.[0] || {};
        const currentHourly = hourlyData?.properties?.periods?.[0];
        
        // Pressure conversion: Pa to inHg
        const pressurePa = obsData?.properties?.barometricPressure?.value;
        const pressureInHg = pressurePa ? (pressurePa * 0.0002953).toFixed(2) : undefined;
        
        // Derive daily from forecast periods (NOAA returns roughly 14 periods, usually Day/Night entries)
        const daily: any[] = [];
        const forecastPeriods = forecastData?.properties?.periods || [];
        for (let i = 0; i < forecastPeriods.length; i += 2) {
          const dayPeriod = forecastPeriods[i];
          const nightPeriod = forecastPeriods[i + 1];
          if (dayPeriod && nightPeriod) {
            daily.push({
              name: dayPeriod.name || 'Unknown',
              high: Math.max(dayPeriod.temperature || 0, nightPeriod.temperature || 0),
              low: Math.min(dayPeriod.temperature || 0, nightPeriod.temperature || 0),
              condition: dayPeriod.shortForecast || '',
              icon: dayPeriod.icon || '',
              detailed: dayPeriod.detailedForecast || ''
            });
          }
        }

        const rawHourly = hourlyData?.properties?.periods || [];
        const validHourly = rawHourly
          .filter((p: any) => p && typeof p === 'object' && p.startTime);

        setWeather({
          temperature: currentHourly?.temperature ?? currentPeriod?.temperature ?? 0,
          condition: currentHourly?.shortForecast ?? currentPeriod?.shortForecast ?? 'Clear',
          unit: currentPeriod?.temperatureUnit || 'F',
          forecast: forecastPeriods.filter(Boolean).slice(0, forecastDays),
          hourly: validHourly.slice(0, 24),
          alerts: alertsData?.features || [],
          location: `${city || 'Sector'}, ${state || ''}`,
          pressure: pressureInHg ? parseFloat(pressureInHg) : undefined,
          humidity: obsData?.properties?.relativeHumidity?.value,
          windSpeed: currentPeriod?.windSpeed || '0 mph',
          windDirection: currentPeriod?.windDirection || '',
          daily: daily,
          lat: latitude,
          lon: longitude
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Satellite Link Failed');
      } finally {
        setLoading(false);
      }
    }

    getWeatherData();
    const interval = setInterval(getWeatherData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [retryCount, weatherZip, forecastDays, settings?.zipCode]);

  const handleUpdateZip = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipInput.length === 5) {
      setWeatherZip(zipInput);
      setIsModalOpen(false);
    }
  };

  if (loading && !weather) {
    return (
      <div className="w-full bg-[#0a0a0c] border border-white/5 rounded-[2rem] p-12 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Initializing Atmospheric Telemetry</p>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="w-full bg-rose-500/5 border border-rose-500/20 rounded-[2rem] p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-6" />
        <h3 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tight">Telemetry Link Offline</h3>
        <p className="text-sm text-slate-500 mb-8 max-w-sm uppercase font-bold tracking-widest">{error}</p>
        <button onClick={() => setRetryCount(prev => prev + 1)} className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">Re-establish Connection</button>
      </div>
    );
  }

  const availableTabs = [
    ...(activeModules.showCurrent ? ['now'] : []),
    ...(activeModules.showTimeline ? ['today'] : []),
    ...(activeModules.showTomorrow ? ['forecast'] : []),
    'radar'
  ];

  // Auto-switch tab if current one becomes hidden
  if (!availableTabs.includes(activeTab) && availableTabs.length > 0) {
    setActiveTab(availableTabs[0] as any);
  }

  if (compact) {
    return (
      <div className={cn("w-full h-full flex flex-col p-0 overflow-hidden relative", settings?.fontFamily, settings?.fontWeight)}>
        {/* Radar Overlay */}
        <AnimatePresence>
          {isRadarExpanded && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-4 z-[200] bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Layers className="w-6 h-6 text-indigo-500" />
                  <h3 className="text-2xl font-black text-white uppercase italic">Live Radar <span className="text-slate-500 not-italic">Nexus</span></h3>
                </div>
                <button 
                  onClick={() => setIsRadarExpanded(false)}
                  className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 bg-black">
                <iframe 
                  src={radarUrl || ""} 
                  className="w-full h-full border-none"
                  title="Expanded Radar"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'now' && activeModules.showCurrent && (
              <motion.div 
                key="now"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full p-4 gap-4"
              >
                {/* LEFT: METRICS & FORECAST */}
                <div className="w-[38%] flex flex-col gap-4">
                  {/* Current Section */}
                  <div className="flex-1 bg-[#101014]/60 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-center relative overflow-hidden shadow-2xl group/card">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover/card:opacity-20 transition-opacity translate-x-6 -translate-y-6">
                       {weather && <AnimatedWeatherIcon condition={weather.condition} size={140} animated={settings?.animatedIcons ?? true} />}
                    </div>
                    
                    <div className="space-y-1 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Live Telemetry</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-300 uppercase tracking-widest italic opacity-90">
                        Sector: {weather?.location?.split(',')[0]}
                      </h2>
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="text-8xl font-black text-white tracking-tighter flex items-start drop-shadow-2xl">
                        {weather?.temperature}<span className="text-3xl text-indigo-500 mt-4 ml-1">°</span>
                      </div>
                      <div className="mb-4">
                        <p className="text-lg font-black text-white uppercase tracking-widest leading-none drop-shadow-lg">{weather?.condition}</p>
                        <div className="flex items-center gap-3 mt-3">
                           <div className="flex items-center gap-1 text-[10px] font-black text-rose-500">
                             <ArrowUp size={10} />
                             {weather?.daily?.[0]?.high ?? '--'}°
                           </div>
                           <div className="flex items-center gap-1 text-[10px] font-black text-sky-500">
                             <ArrowDown size={10} />
                             {weather?.daily?.[0]?.low ?? '--'}°
                           </div>
                           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic opacity-60 ml-2">
                             {weather?.humidity ?? '--'}% HUM
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Today Mini Forecast */}
                  <div className="h-[32%] bg-[#101014]/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Window</span>
                       <Clock className="w-3 h-3 text-slate-700" />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      {(weather?.hourly || []).filter((h: any) => h && h.startTime).slice(0, 4).map((hour, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 flex-1 pt-1 group/item">
                          <span className="text-[8px] font-black text-slate-600 uppercase group-hover/item:text-slate-400 transition-colors">{formatHourTime(hour?.startTime)}</span>
                          <AnimatedWeatherIcon condition={hour?.shortForecast || ''} size={20} animated={settings?.animatedIcons ?? true} />
                          <span className="text-xs font-black text-white">{hour?.temperature ?? '--'}°</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT: RADAR */}
                <div 
                  className="flex-1 h-full relative group cursor-pointer overflow-hidden border-2 border-indigo-500/20 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(79,70,229,0.05)]" 
                  onClick={() => setIsRadarExpanded(true)}
                >
                  <div className="absolute inset-0 bg-indigo-500/10 opacity-20" />
                  <iframe 
                    src={radarUrl || ""} 
                    className="w-full h-full border-none pointer-events-none scale-[1.8] origin-center opacity-90 group-hover:opacity-100 transition-opacity duration-1000"
                    title="Mini Radar"
                  />
                  
                  <div className="absolute top-8 right-8 flex items-center gap-2 z-50">
                    {availableTabs.map(tab => (
                      <button
                        key={tab}
                        onClick={(e) => { e.stopPropagation(); setActiveTab(tab as any); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all backdrop-blur-md",
                          activeTab === tab 
                            ? "bg-white text-black font-black" 
                            : "bg-black/60 text-slate-300 hover:text-white"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="absolute bottom-8 right-8 z-50">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-indigo-600 transition-all shadow-2xl">
                      <Maximize2 size={18} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'today' && activeModules.showTimeline && (
              <motion.div 
                key="today"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col p-8"
              >
                <div className="flex items-center gap-2 mb-8 shrink-0">
                  {availableTabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                        activeTab === tab 
                          ? "bg-white text-black font-black" 
                          : "text-slate-500 hover:text-white"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar-h">
                  {(weather?.hourly || []).filter((h: any) => h && h.startTime).map((hour, idx) => (
                    <div key={idx} className="flex-shrink-0 w-28 p-6 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-4 hover:border-indigo-500/30 transition-all">
                      <span className="text-[10px] font-black text-slate-500 uppercase">{formatHourTime(hour?.startTime)}</span>
                      <AnimatedWeatherIcon condition={hour?.shortForecast || ''} size={28} animated={settings?.animatedIcons ?? true} />
                      <span className="text-xl font-black text-white">{hour?.temperature ?? '--'}°</span>
                      <div className="w-full space-y-1.5">
                         <div className="flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-tighter">
                            <span>POP</span>
                            <span>{hour?.probabilityOfPrecipitation?.value || 0}%</span>
                         </div>
                         <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <div 
                            className="h-full bg-blue-500 transition-all duration-1000" 
                            style={{ width: `${hour?.probabilityOfPrecipitation?.value || 0}%` }}
                           />
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'forecast' && activeModules.showTomorrow && (
              <motion.div 
                key="forecast"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col p-8"
              >
                <div className="flex items-center gap-2 mb-8 shrink-0">
                  {availableTabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                        activeTab === tab 
                          ? "bg-white text-black font-black" 
                          : "text-slate-500 hover:text-white"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin">
                  {(weather?.daily || []).filter(Boolean).slice(0, forecastDays).map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-6 w-1/3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest italic w-16">{idx === 0 ? "Today" : day.name}</span>
                        <AnimatedWeatherIcon condition={day.condition} size={24} animated={settings?.animatedIcons ?? true} />
                      </div>
                      <div className="w-1/3 text-center">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest truncate block">{day.condition}</span>
                      </div>
                      <div className="flex items-baseline gap-2 w-1/3 justify-end">
                        <span className="text-lg font-black text-white">{day.high}°</span>
                        <span className="text-[10px] font-black text-slate-500">/ {day.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'radar' && (
              <motion.div 
                key="radar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full relative"
              >
                <iframe 
                  src={radarUrl || ""} 
                  className="w-full h-full border-none"
                  title="Tab Radar"
                />
                <button 
                  onClick={() => setIsRadarExpanded(true)}
                  className="absolute bottom-8 right-8 p-4 bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-500/30 hover:scale-110 active:scale-95 transition-all"
                >
                  <Maximize2 size={20} />
                </button>
                <div className="absolute top-8 left-8 flex items-center gap-2">
                  {availableTabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all bg-black/60 backdrop-blur-md",
                        activeTab === tab 
                          ? "bg-white text-black font-black" 
                          : "text-slate-300 hover:text-white"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 lg:p-12 space-y-12 overflow-y-auto custom-scrollbar", settings?.fontFamily, settings?.fontWeight)}>
      {/* HEADER SECTION */}
      {(activeModules.showCurrent || !compact) && (
        <div className="flex flex-wrap items-end justify-between gap-8 pb-10 border-b border-white/5">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300 text-[10px] uppercase font-black tracking-[0.3em]">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Sector {weather?.location} Matrix
            </div>
            {(activeModules.showCurrent || !compact) && (
              <>
                <div className="flex items-center gap-8">
                  <div className="text-8xl font-black text-white tracking-tighter flex items-start">
                    {weather?.temperature}
                    <span className="text-3xl mt-4 text-slate-600 ml-2">°{weather?.unit}</span>
                  </div>
                  {weather && <AnimatedWeatherIcon condition={weather.condition} size={80} animated={settings?.animatedIcons ?? true} />}
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-2xl font-black text-slate-400 uppercase tracking-tight italic opacity-80">{weather?.condition}</p>
                  {weather?.windSpeed && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Wind className="w-3 h-3" />
                      {weather.windSpeed} {weather.windDirection}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsModalOpen(true)} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all group">
              <Settings className="w-6 h-6 group-hover:rotate-45 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* MODULES GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PRIMARY MODULES */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* HOURLY TIMELINE */}
          {activeModules.showTimeline && (
            <div className="tactical-card p-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 italic">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Shift Timeline <span className="text-slate-500 not-italic">24H Operational window</span>
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar-h">
                {(weather?.hourly || []).filter((h: any) => h && h.startTime).map((hour, idx) => (
                  <div key={idx} className="flex-shrink-0 w-24 p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-3 group hover:border-indigo-500/30 transition-all">
                    <span className="text-[9px] font-black text-slate-500 uppercase">{formatHourTime(hour?.startTime)}</span>
                    <AnimatedWeatherIcon condition={hour?.shortForecast || ''} size={24} animated={settings?.animatedIcons ?? true} />
                    <span className="text-lg font-black text-white">{hour?.temperature ?? '--'}°</span>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${hour?.probabilityOfPrecipitation?.value || 0}%` }}
                        className="h-full bg-blue-500"
                       />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALERTS SECTION */}
          {weather && (weather.alerts.length > 0 || !settings?.hideAlertsIfEmpty) && (
            <div className={cn(
              "border-2 rounded-[2rem] p-8 space-y-6 transition-all",
              weather.alerts.length > 0 ? "bg-rose-500/10 border-rose-500/30 tactical-card-glow-rose" : "bg-emerald-500/5 border-emerald-500/20"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {weather.alerts.length > 0 ? (
                    <AlertCircle className="w-6 h-6 text-rose-500 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  )}
                  <h3 className="text-lg font-black text-white uppercase tracking-tight italic">
                    {weather.alerts.length > 0 ? "NWS Deployment Warnings" : "System Status"}
                  </h3>
                </div>
                <span className={cn(
                  "px-4 py-1 text-white text-[10px] font-black rounded-full",
                  weather.alerts.length > 0 ? "bg-rose-500" : "bg-emerald-500/50"
                )}>
                  {weather.alerts.length > 0 ? "ACTION REQUIRED" : "ALL CLEAR"}
                </span>
              </div>
              
              {weather.alerts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {weather.alerts.map((alert, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedAlert(alert)}
                      className="text-left p-6 bg-black/40 rounded-2xl border border-rose-500/20 hover:border-rose-500 transition-all space-y-2"
                    >
                      <h4 className="text-white font-black uppercase text-xs tracking-tight">{alert.properties.event}</h4>
                      <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest line-clamp-2">{alert.properties.headline}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400/70 font-black uppercase tracking-widest">No active weather alerts for this sector.</p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ANALYTICS MODULES */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* PRESSURE MODULE */}
          {activeModules.showPressure && (
            <div className="tactical-card p-8 space-y-6">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 italic">
                <Gauge className="w-4 h-4 text-emerald-400" />
                Atmospheric Pressure
              </h3>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-4xl font-black text-white">{weather?.pressure || '---'}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Inches of Mercury (inHg)</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ArrowUp className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <p className="text-lg font-black text-white">{weather?.humidity || '--'}%</p>
                   <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Relative Humidity</p>
                </div>
                <div className="space-y-1">
                   <p className="text-lg font-black text-white">{weather?.temperature ? Math.round(weather.temperature - 2) : '--'}°</p>
                   <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Dew Point</p>
                </div>
              </div>
            </div>
          )}

          {/* TOMORROW MODULE */}
          {activeModules.showTomorrow && weather && Array.isArray(weather.forecast) && weather.forecast.length > 2 && weather.forecast[2] && (
            <div className="tactical-card p-8 space-y-6 bg-indigo-600/5 border-indigo-500/20">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 italic">
                <Shield className="w-4 h-4 text-indigo-400" />
                Ops Outlook <span className="text-slate-500 not-italic">T+24H</span>
              </h3>
              <div className="flex items-center gap-6">
                <AnimatedWeatherIcon condition={weather.forecast[2]?.shortForecast || ''} size={48} animated={settings?.animatedIcons ?? true} />
                <div>
                   <p className="text-3xl font-black text-white tracking-tight">{weather.forecast[2]?.temperature ?? '--'}°</p>
                   <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Projected Peak</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 font-bold uppercase leading-relaxed">{weather.forecast[2]?.detailedForecast || ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* ZIP MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-bg-surface border border-white/10 rounded-[3rem] p-12 w-full max-w-md shadow-2xl overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 space-y-8">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Set Link Node</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                 </div>
                 <form onSubmit={handleUpdateZip} className="space-y-6">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">Target Sector Zip Code</label>
                     <input 
                       type="text" 
                       maxLength={5}
                       value={zipInput}
                       onChange={(e) => setZipInput(e.target.value.replace(/\D/g, ''))}
                       className="w-full h-16 tactical-input px-8 text-xl text-white font-mono"
                       placeholder="e.g. 30302"
                     />
                   </div>
                   <button type="submit" className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all italic text-xs">Establish Linkage</button>
                 </form>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALERT MODAL */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <div onClick={() => setSelectedAlert(null)} className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative bg-rose-950 border border-rose-500/30 rounded-[3.5rem] p-12 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
               <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/40">
                      <AlertCircle size={32} className="text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase italic leading-none">{selectedAlert.properties.event}</h3>
                      <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.4em] mt-2">National Weather Service Red-Level Protocol</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAlert(null)} className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={20} /></button>
               </div>
               <div className="space-y-10">
                 <div className="p-10 bg-black/40 border border-rose-500/20 rounded-3xl space-y-6">
                    <p className="text-xl font-bold text-white italic">{selectedAlert.properties.headline}</p>
                    <div className="h-px bg-rose-500/20" />
                    <p className="text-sm text-slate-300 leading-relaxed font-mono uppercase whitespace-pre-wrap">{selectedAlert.properties.description}</p>
                 </div>
                 {selectedAlert.properties.instruction && (
                   <div className="p-10 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Command Directive</p>
                      <p className="text-emerald-100 font-bold italic leading-relaxed uppercase">{selectedAlert.properties.instruction}</p>
                   </div>
                 )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
// sync
