import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Shield,
  Activity,
  AlertCircle,
  Plus,
  Trash2,
  Info,
  MessageSquare,
  PlusCircle,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  GripVertical,
  Wind,
  Settings,
  FileText,
  ArrowUp,
  Newspaper,
  Palette,
  FileSpreadsheet,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { AugustSheetModal } from "../../components/centralhub/AugustSheetModal";
import { ShiftReportModal } from "../../components/centralhub/ShiftReportModal";
import { ThemeSelectorButton } from "../../components/centralhub/ThemeSelector";
import { WeatherDashboard } from "../../components/centralhub/WeatherDashboard";
import { ScannerVFD } from "../../components/centralhub/ScannerVFD";
import { NewsWidget } from "../../components/centralhub/NewsWidget";
import { WotdWidget } from "../../components/centralhub/WotdWidget";
import { useTerminal } from "../../context/TerminalContext";
import {
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db, auth, handleFirestoreError } from "../../lib/firebase";
import { useAuthRole } from "../../hooks/useAuthRole";
import { motion, AnimatePresence } from "motion/react";
import { SHIFT_TEAMS } from "../../lib/shiftConstants";
import { Modal } from "../../components/centralhub/Modal";
import { cn } from "../../lib/utils";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
} from "date-fns";

import { useNavigate } from "react-router-dom";
import { OpsCalendar } from "../../components/centralhub/OpsCalendar";
import { GoogleSearchWidget } from "../../components/centralhub/GoogleSearchWidget";

interface ClockSettings {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  showDate: boolean;
  is24Hour: boolean;
  color: string;
}

interface WeatherSettings {
  forecastDays: number;
  fontFamily: string;
  fontWeight: string;
  animatedIcons: boolean;
  hideAlertsIfEmpty: boolean;
  zipCode?: string;
  showPressure?: boolean;
  showTimeline?: boolean;
  showTomorrow?: boolean;
  showCurrent?: boolean;
}

interface NewsSettings {
  source: string;
  articleCount: number;
  fontFamily: string;
  refreshInterval: number;
}

interface WidgetItem {
  id: string;
  type:
    | "time"
    | "weather"
    | "personnel"
    | "calendar"
    | "shift_report"
    | "custom_new"
    | "news"
    | "wotd"
    | "search"
    | "scanner";
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
  isVisible: boolean;
  clockSettings?: ClockSettings;
  weatherSettings?: WeatherSettings;
  newsSettings?: NewsSettings;
  panelColor?: string;
}

const DEFAULT_CLOCK_SETTINGS: ClockSettings = {
  fontFamily: "font-mono",
  fontSize: "text-6xl",
  fontWeight: "font-black",
  showDate: true,
  is24Hour: true,
  color: "text-white",
};

const DEFAULT_WEATHER_SETTINGS: WeatherSettings = {
  forecastDays: 5,
  fontFamily: "font-sans",
  fontWeight: "font-black",
  animatedIcons: true,
  hideAlertsIfEmpty: false,
  showPressure: true,
  showTimeline: true,
  showTomorrow: true,
  showCurrent: true,
};

const DEFAULT_NEWS_SETTINGS: NewsSettings = {
  source: "google",
  articleCount: 10,
  fontFamily: "font-sans",
  refreshInterval: 15,
};

const DEFAULT_WIDGETS: WidgetItem[] = [
  {
    id: "widget-weather",
    type: "weather",
    title: "Environment Monitor",
    size: "xl",
    isVisible: true,
    weatherSettings: DEFAULT_WEATHER_SETTINGS,
  },
  {
    id: "widget-personnel",
    type: "personnel",
    title: "Personnel Deployment",
    size: "xl",
    isVisible: true,
  },
  {
    id: "widget-calendar",
    type: "calendar",
    title: "Operations Calendar",
    size: "xl",
    isVisible: true,
  },
  {
    id: "widget-shift-report",
    type: "shift_report",
    title: "Shift Report Entry",
    size: "md",
    isVisible: true,
  },
  {
    id: "widget-news",
    type: "news",
    title: "Global Intel Feed",
    size: "lg",
    isVisible: true,
    newsSettings: DEFAULT_NEWS_SETTINGS,
  },
];

function DebouncedZipInput({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => {
    setLocalVal(value);
  }, [value]);
  return (
    <input
      type="text"
      placeholder="e.g. 90210"
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={() => onChange(localVal)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onChange(localVal);
        }
      }}
      className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
    />
  );
}

export function StartPage() {
  const {
    userSettings,
    isUserSettingsLoaded,
    updateUserSettings,
    terminalUser,
    appBackgroundImage,
    setAppBackgroundImage,
  } = useTerminal();
  const [now, setNow] = useState(new Date());
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_WIDGETS);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showAtmosphereModal, setShowAtmosphereModal] = useState(false);

  // Load initial widgets
  useEffect(() => {
    if (hasInitialized || !isUserSettingsLoaded) return;

    const savedLocal = localStorage.getItem("start-page-widgets-v7");
    const savedRemote = userSettings?.startPageWidgets;

    let initialWidgets: WidgetItem[] = DEFAULT_WIDGETS;

    if (savedRemote) {
      initialWidgets = savedRemote;
    } else if (savedLocal) {
      try {
        initialWidgets = JSON.parse(savedLocal);
      } catch {
        initialWidgets = DEFAULT_WIDGETS;
      }
    }

    setWidgets(initialWidgets);
    setHasInitialized(true);
  }, [userSettings?.startPageWidgets, hasInitialized, isUserSettingsLoaded]);

  // Sync back to local storage
  useEffect(() => {
    if (!hasInitialized) return;
    localStorage.setItem("start-page-widgets-v7", JSON.stringify(widgets));
  }, [widgets, hasInitialized]);

  const updateWidgets = (newWidgetsOrUpdater: WidgetItem[] | ((prev: WidgetItem[]) => WidgetItem[])) => {
    setWidgets((prev) => {
      const result = typeof newWidgetsOrUpdater === 'function' ? newWidgetsOrUpdater(prev) : newWidgetsOrUpdater;
      setTimeout(() => {
        updateUserSettings("startPageWidgets", result);
      }, 0);
      return result;
    });
  };

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAugustSheetModal, setShowAugustSheetModal] = useState(false);
  const [editingClock, setEditingClock] = useState<WidgetItem | null>(null);
  const [editingWeather, setEditingWeather] = useState<WidgetItem | null>(null);
  const [editingNews, setEditingNews] = useState<WidgetItem | null>(null);
  const [editingPanelColor, setEditingPanelColor] = useState<WidgetItem | null>(null);
  const [showFullWeather, setShowFullWeather] = useState(false);

  const updateWidgetSize = (id: string, size: "sm" | "md" | "lg" | "xl") => {
    updateWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  };

  const updateWidgetPanelColor = (id: string, panelColor: string) => {
    updateWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, panelColor } : w)),
    );
  };

  const updateClockSettings = (id: string, settings: ClockSettings) => {
    updateWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, clockSettings: settings } : w)),
    );
    setEditingClock((prev) => prev ? { ...prev, clockSettings: settings } : null);
  };

  const updateWeatherSettings = (id: string, settings: WeatherSettings) => {
    updateWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, weatherSettings: settings } : w)),
    );
    setEditingWeather((prev) => prev ? { ...prev, weatherSettings: settings } : null);
  };

  const updateNewsSettings = (id: string, settings: NewsSettings) => {
    updateWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, newsSettings: settings } : w)),
    );
    setEditingNews((prev) => prev ? { ...prev, newsSettings: settings } : null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      updateWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeWidget = (id: string) => {
    updateWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const addWidget = (
    type: WidgetItem["type"],
    titleStr: string,
    sizeStr: any,
  ) => {
    const newId = `widget-${type}-${Date.now()}`;
    let newWidget: WidgetItem = {
      id: newId,
      type,
      title: titleStr,
      size: sizeStr,
      isVisible: true,
    };
    if (type === "time") newWidget.clockSettings = DEFAULT_CLOCK_SETTINGS;
    if (type === "weather")
      newWidget.weatherSettings = DEFAULT_WEATHER_SETTINGS;
    if (type === "news") newWidget.newsSettings = DEFAULT_NEWS_SETTINGS;

    updateWidgets((prev) => [...prev, newWidget]);
    setShowAddMenu(false);
  };

  const visibleWidgets = widgets.filter((w) => {
    if (
      w.type === "shift_report" &&
      terminalUser?.role?.toLowerCase() === "dispatcher"
    ) {
      return false;
    }
    return w.isVisible;
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-8 pb-10 border-b border-white/5 relative tactical-header-glow">
        <div className="space-y-4">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.4)] group-hover:scale-110 transition-transform duration-500">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tight text-text-main uppercase italic">
              Dispatch <span className="text-indigo-500 not-italic">Ops</span>
            </h1>
          </div>
          <p className="text-text-dim font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3">
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
            Strategic Command Hub v5.0
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ThemeSelectorButton />

          <button
            type="button"
            onClick={() => setShowAtmosphereModal(true)}
            className="px-5 py-3 glass-effect border-blue-500/30 text-blue-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2.5 transition-all hover:bg-blue-500/20 shadow-lg shadow-blue-950/50"
            title="Configure Background & Wallpaper Atmosphere"
          >
            <Palette className="w-4 h-4 text-blue-400" />
            <span>Atmosphere</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAugustSheetModal(true)}
            className="px-5 py-3 glass-effect border-emerald-500/30 text-emerald-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2.5 transition-all hover:bg-emerald-500/20 shadow-lg shadow-emerald-950/50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Shift Sheet</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] border border-emerald-500/30">A/B/C/D Shifts</span>
          </button>

          <button
            onClick={() => setShowAddMenu(true)}
            className="px-6 py-3 glass-effect border-indigo-500/30 text-indigo-500 hover:text-text-main rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-indigo-500/10"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-8 relative z-10 auto-rows-auto px-4 lg:px-8">
            {visibleWidgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onRemove={() => removeWidget(widget.id)}
                onResize={(size) => updateWidgetSize(widget.id, size)}
                onEditClock={() => setEditingClock(widget)}
                onEditWeather={() => setEditingWeather(widget)}
                onEditNews={() => setEditingNews(widget)}
                onEditPanelColor={() => setEditingPanelColor(widget)}
                onExpandWeather={() => setShowFullWeather(true)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Modal
        isOpen={!!editingWeather}
        onClose={() => setEditingWeather(null)}
        title="Weather Configuration"
        icon={<Wind className="w-6 h-6" />}
      >
        {editingWeather && (
          <div className="space-y-8 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Future Cast Days
                </label>
                <select
                  value={editingWeather.weatherSettings?.forecastDays}
                  onChange={(e) =>
                    updateWeatherSettings(editingWeather.id, {
                      ...editingWeather.weatherSettings!,
                      forecastDays: parseInt(e.target.value),
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="5">5 Days</option>
                  <option value="7">7 Days</option>
                  <option value="10">10 Days</option>
                  <option value="14">14 Days</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Typography
                </label>
                <select
                  value={editingWeather.weatherSettings?.fontFamily}
                  onChange={(e) =>
                    updateWeatherSettings(editingWeather.id, {
                      ...editingWeather.weatherSettings!,
                      fontFamily: e.target.value,
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="font-sans">Inter Sans</option>
                  <option value="font-mono">JetBrains Mono</option>
                  <option value="font-serif">Editorial Serif</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Font Weight
                </label>
                <select
                  value={editingWeather.weatherSettings?.fontWeight}
                  onChange={(e) =>
                    updateWeatherSettings(editingWeather.id, {
                      ...editingWeather.weatherSettings!,
                      fontWeight: e.target.value,
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="font-normal">Normal</option>
                  <option value="font-bold">Bold</option>
                  <option value="font-black">Black/Heavy</option>
                </select>
              </div>
              <div className="space-y-4 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Target Zip Code (Leave blank for global/GPS)
                </label>
                <DebouncedZipInput
                  value={editingWeather.weatherSettings?.zipCode || ""}
                  onChange={(val) =>
                    updateWeatherSettings(editingWeather.id, {
                      ...editingWeather.weatherSettings!,
                      zipCode: val,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "showPressure", label: "InHg Pressure" },
                { key: "showTimeline", label: "24H Timeline" },
                { key: "showTomorrow", label: "T+24H Outlook" },
                { key: "showCurrent", label: "Surface Metrics" },
              ].map((module) => (
                <button
                  key={module.key}
                  onClick={() =>
                    updateWeatherSettings(editingWeather.id, {
                      ...editingWeather.weatherSettings!,
                      [module.key]:
                        !editingWeather.weatherSettings?.[
                          module.key as keyof WeatherSettings
                        ],
                    })
                  }
                  className={`p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    editingWeather.weatherSettings?.[
                      module.key as keyof WeatherSettings
                    ] !== false
                      ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20"
                      : "bg-black/40 border-white/5 text-slate-500"
                  }`}
                >
                  {module.label}:{" "}
                  {editingWeather.weatherSettings?.[
                    module.key as keyof WeatherSettings
                  ] !== false
                    ? "ON"
                    : "OFF"}
                </button>
              ))}
              <button
                onClick={() =>
                  updateWeatherSettings(editingWeather.id, {
                    ...editingWeather.weatherSettings!,
                    animatedIcons:
                      !editingWeather.weatherSettings?.animatedIcons,
                  })
                }
                className={`p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  editingWeather.weatherSettings?.animatedIcons
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20"
                    : "bg-black/40 border-white/5 text-slate-500"
                }`}
              >
                Animated Icons:{" "}
                {editingWeather.weatherSettings?.animatedIcons
                  ? "ENABLED"
                  : "DISABLED"}
              </button>
              <button
                onClick={() =>
                  updateWeatherSettings(editingWeather.id, {
                    ...editingWeather.weatherSettings!,
                    hideAlertsIfEmpty:
                      !editingWeather.weatherSettings?.hideAlertsIfEmpty,
                  })
                }
                className={`p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  editingWeather.weatherSettings?.hideAlertsIfEmpty
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20"
                    : "bg-black/40 border-white/5 text-slate-500"
                }`}
              >
                Hide NOAA Box if Empty:{" "}
                {editingWeather.weatherSettings?.hideAlertsIfEmpty
                  ? "YES"
                  : "NO"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!editingNews}
        onClose={() => setEditingNews(null)}
        title="Intel Feed Configuration"
        icon={<Newspaper className="w-6 h-6" />}
      >
        {editingNews && (
          <div className="space-y-8 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Intel Source
                </label>
                <select
                  value={editingNews.newsSettings?.source}
                  onChange={(e) =>
                    updateNewsSettings(editingNews.id, {
                      ...editingNews.newsSettings!,
                      source: e.target.value,
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="cnn">CNN Tactical</option>
                  <option value="fox">Fox Division</option>
                  <option value="tech">Tech Matrix</option>
                  <option value="google">Google Signal</option>
                  <option value="reuters">Reuters Agency</option>
                  <option value="associated_press">AP Dispatch</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Intel Depth (Articles)
                </label>
                <select
                  value={editingNews.newsSettings?.articleCount}
                  onChange={(e) =>
                    updateNewsSettings(editingNews.id, {
                      ...editingNews.newsSettings!,
                      articleCount: parseInt(e.target.value),
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="3">3 Packets</option>
                  <option value="5">5 Packets</option>
                  <option value="10">10 Packets</option>
                  <option value="20">20 Packets</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Typography
                </label>
                <select
                  value={editingNews.newsSettings?.fontFamily}
                  onChange={(e) =>
                    updateNewsSettings(editingNews.id, {
                      ...editingNews.newsSettings!,
                      fontFamily: e.target.value,
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="font-sans">Inter Sans</option>
                  <option value="font-mono">JetBrains Mono</option>
                  <option value="font-serif">Editorial Serif</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Sync Frequency
                </label>
                <select
                  value={editingNews.newsSettings?.refreshInterval}
                  onChange={(e) =>
                    updateNewsSettings(editingNews.id, {
                      ...editingNews.newsSettings!,
                      refreshInterval: parseInt(e.target.value),
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="5">5 Miutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!editingClock}
        onClose={() => setEditingClock(null)}
        title="Clock Configuration"
        icon={<Clock className="w-6 h-6" />}
      >
        {editingClock && (
          <div className="space-y-8 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Typography
                </label>
                <select
                  value={editingClock.clockSettings?.fontFamily}
                  onChange={(e) =>
                    updateClockSettings(editingClock.id, {
                      ...editingClock.clockSettings!,
                      fontFamily: e.target.value,
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="font-sans">Inter Sans</option>
                  <option value="font-mono">JetBrains Mono</option>
                  <option value="font-serif">Editorial Serif</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Font Weight
                </label>
                <select
                  value={editingClock.clockSettings?.fontWeight}
                  onChange={(e) =>
                    updateClockSettings(editingClock.id, {
                      ...editingClock.clockSettings!,
                      fontWeight: e.target.value,
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="font-normal">Normal</option>
                  <option value="font-bold">Bold</option>
                  <option value="font-black">Black/Heavy</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Font Size
                </label>
                <select
                  value={editingClock.clockSettings?.fontSize}
                  onChange={(e) =>
                    updateClockSettings(editingClock.id, {
                      ...editingClock.clockSettings!,
                      fontSize: e.target.value,
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="text-3xl">Small</option>
                  <option value="text-5xl">Medium</option>
                  <option value="text-6xl">Large</option>
                  <option value="text-7xl">X-Large</option>
                  <option value="text-8xl">XX-Large</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                  Color Profile
                </label>
                <select
                  value={editingClock.clockSettings?.color}
                  onChange={(e) =>
                    updateClockSettings(editingClock.id, {
                      ...editingClock.clockSettings!,
                      color: e.target.value,
                    })
                  }
                  className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
                >
                  <option value="text-white">White Ghost</option>
                  <option value="text-indigo-400">Indigo Tactical</option>
                  <option value="text-emerald-400">Emerald Active</option>
                  <option value="text-amber-400">Amber Warning</option>
                  <option value="text-rose-400">Critical Rose</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() =>
                  updateClockSettings(editingClock.id, {
                    ...editingClock.clockSettings!,
                    is24Hour: !editingClock.clockSettings?.is24Hour,
                  })
                }
                className={`p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  editingClock.clockSettings?.is24Hour
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20"
                    : "bg-black/40 border-white/5 text-slate-500"
                }`}
              >
                24-Hour Format:{" "}
                {editingClock.clockSettings?.is24Hour ? "ON" : "OFF"}
              </button>
              <button
                onClick={() =>
                  updateClockSettings(editingClock.id, {
                    ...editingClock.clockSettings!,
                    showDate: !editingClock.clockSettings?.showDate,
                  })
                }
                className={`p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  editingClock.clockSettings?.showDate
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20"
                    : "bg-black/40 border-white/5 text-slate-500"
                }`}
              >
                Display Date:{" "}
                {editingClock.clockSettings?.showDate ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!editingPanelColor}
        onClose={() => setEditingPanelColor(null)}
        title="Panel Theme Configuration"
        icon={<Palette className="w-6 h-6" />}
      >
        {editingPanelColor && (
          <div className="space-y-8 p-4">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">
                Panel Background Theme
              </label>
              <select
                value={editingPanelColor.panelColor || ""}
                onChange={(e) => {
                  updateWidgetPanelColor(editingPanelColor.id, e.target.value);
                  setEditingPanelColor((prev) => prev ? { ...prev, panelColor: e.target.value } : null);
                }}
                className="w-full tactical-input px-4 h-12 text-white text-xs font-black uppercase"
              >
                <option value="">Default (App Theme)</option>
                <option value="!bg-indigo-900/20">Indigo Tactical</option>
                <option value="!bg-emerald-900/20">Emerald Active</option>
                <option value="!bg-rose-900/20">Critical Rose</option>
                <option value="!bg-amber-900/20">Amber Warning</option>
                <option value="!bg-blue-900/20">Blue Command</option>
                <option value="!bg-slate-900/50">Slate Ghost</option>
                <option value="!bg-black/50">Pitch Black</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showFullWeather}
        onClose={() => setShowFullWeather(false)}
        title="Atmospheric Command Center"
        icon={<Wind className="w-6 h-6" />}
        fullWidth
      >
        <div className="h-[80vh]">
          <WeatherDashboard settings={widgets.find((w) => w.type === "weather")?.weatherSettings} />
        </div>
      </Modal>

      <Modal
        isOpen={showAddMenu}
        onClose={() => setShowAddMenu(false)}
        title="Module Repository"
        icon={<PlusCircle className="w-6 h-6" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              type: "time",
              title: "Local Time",
              size: "sm",
              desc: "Chronometer node",
            },
            {
              type: "weather",
              title: "Tactical Weather",
              size: "lg",
              desc: "Atmospheric monitor",
            },
            {
              type: "news",
              title: "Intel Feed",
              size: "lg",
              desc: "External news stream",
            },
            {
              type: "wotd",
              title: "Word of the Day",
              size: "md",
              desc: "Linguistic analysis",
            },
            {
              type: "personnel",
              title: "Active Personnel",
              size: "md",
              desc: "Fleet dashboard",
            },
            {
              type: "calendar",
              title: "Global Schedule",
              size: "xl",
              desc: "Operations calendar",
            },
            {
              type: "shift_report",
              title: "Shift Uplink",
              size: "sm",
              desc: "Post operations",
            },
            {
              type: "search",
              title: "Global Search",
              size: "md",
              desc: "Web query interface",
            },
          ]
            .filter((widget) => {
              if (
                widget.type === "shift_report" &&
                terminalUser?.role?.toLowerCase() === "dispatcher"
              ) {
                return false;
              }
              return true;
            })
            .map((widget) => (
              <button
                key={widget.type}
                onClick={() =>
                  addWidget(
                    widget.type as WidgetItem["type"],
                    widget.title,
                    widget.size,
                  )
                }
                className="p-6 tactical-card hover:border-indigo-500 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-black text-white uppercase italic mb-1">
                    {widget.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {widget.desc}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg shadow-black/50">
                  <Plus className="w-5 h-5" />
                </div>
              </button>
            ))}
        </div>
      </Modal>

      <Modal
        isOpen={showAtmosphereModal}
        onClose={() => setShowAtmosphereModal(false)}
        title="Command Atmosphere & Wallpaper"
        icon={<Palette className="w-6 h-6 text-blue-400" />}
      >
        <div className="space-y-6 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Select Background Theme or Wallpaper
            </p>
            {appBackgroundImage && (
              <button 
                type="button" 
                onClick={() => setAppBackgroundImage(null)}
                className="text-[9px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors"
              >
                Reset to Cyber Grid
              </button>
            )}
          </div>

          {/* Quick Atmosphere Presets */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'NOAA GOES-19 Live', url: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/10848x10848.jpg', bg: 'radial-gradient(circle, #0c4a6e 0%, #020617 100%)', desc: 'Live GeoColor full-disk Earth satellite feed' },
              { label: 'Cyber Grid (Dynamic)', url: null, bg: 'linear-gradient(135deg, #060810, #1e3a8a)', desc: 'High-tech matrix with ambient blue aurora' },
              { label: 'Deep Aurora', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80', bg: '#091e3a', desc: 'Cosmic emerald and violet night sky' },
              { label: 'Tactical Command', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80', bg: '#0f172a', desc: 'Hardware cyber operations hub' },
              { label: 'Midnight Horizon', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80', bg: '#030712', desc: 'Serene dark water horizon reflection' },
            ].map((preset) => {
              const isSelected = (!preset.url && !appBackgroundImage) || (appBackgroundImage === preset.url);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setAppBackgroundImage(preset.url)}
                  className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all ${
                    isSelected 
                      ? 'bg-blue-600/25 border-blue-400 text-white shadow-xl shadow-blue-500/20 ring-1 ring-blue-400' 
                      : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div 
                    className="w-full h-16 rounded-xl border border-white/10 shadow-inner flex items-center justify-center relative overflow-hidden"
                    style={{ background: preset.bg }}
                  >
                    {isSelected && (
                      <span className="px-3 py-1 bg-blue-600/90 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-lg border border-blue-400/40">
                        Active
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-white block">{preset.label}</span>
                    <span className="text-[9px] text-slate-500 font-bold block mt-0.5">{preset.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
              Or Custom Image URL
            </label>
            <input
              type="text"
              value={appBackgroundImage || ''}
              onChange={(e) => setAppBackgroundImage(e.target.value)}
              className="w-full tactical-input px-4 h-12 text-white text-xs font-sans"
              placeholder="Paste direct image URL (https://images.unsplash.com/...)"
            />
          </div>
        </div>
      </Modal>

      <AugustSheetModal
        isOpen={showAugustSheetModal}
        onClose={() => setShowAugustSheetModal(false)}
        />
    </div>
  );
}

function SortableWidget({
  widget,
  onRemove,
  onResize,
  onEditClock,
  onEditWeather,
  onEditNews,
  onEditPanelColor,
  onExpandWeather,
}: {
  widget: WidgetItem;
  onRemove: () => void;
  onResize: (size: "sm" | "md" | "lg" | "xl") => void;
  onEditClock?: () => void;
  onEditWeather?: () => void;
  onEditNews?: () => void;
  onEditPanelColor?: () => void;
  onExpandWeather?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const getColSpan = () => {
    switch (widget.size) {
      case "xl":
        return "col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-6";
      case "lg":
        return "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4";
      case "md":
        return "col-span-1 md:col-span-2 xl:col-span-2";
      default:
        return "col-span-1";
    }
  };

  const renderContent = () => {
    switch (widget.type) {
      case "time":
        return <TimeWidgetContent settings={widget.clockSettings} />;
      case "weather":
        return (
          <div className="h-full">
            <WeatherDashboard
              settings={widget.weatherSettings}
              compact={true}
            />
          </div>
        );
      case "news":
        return (
          <div className="h-full">
            <NewsWidget
              settings={widget.newsSettings}
              compact={widget.size === "sm" || widget.size === "md"}
            />
          </div>
        );
      case "wotd":
        return (
          <div className="h-full">
            <WotdWidget compact={widget.size === "sm"} />
          </div>
        );
      case "personnel":
        return <PersonnelModalContent />;
      case "calendar":
        return <OpsCalendar />;
      case "scanner":
        return <ScannerVFD />;
      case "shift_report":
        return <ShiftReportAddContent onClose={() => {}} />;
      case "search":
        return <GoogleSearchWidget />;
      default:
        return (
          <div className="p-12 text-slate-500 uppercase font-black text-[10px] tracking-widest text-center">
            Module Offline
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`tactical-card p-0 flex flex-col relative group overflow-hidden ${getColSpan()} ${widget.panelColor || ''} shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10 hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-shadow duration-500`}
    >
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-3 cursor-grab active:cursor-grabbing text-text-dim hover:text-text-main transition-colors"
        >
          <GripVertical className="w-4 h-4" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim italic pr-2">
            {widget.title}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEditPanelColor}
            className="p-1.5 text-text-dim hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all mr-1"
            title="Panel Theme"
          >
            <Palette className="w-4 h-4" />
          </button>
          {widget.type === "time" && (
            <button
              onClick={onEditClock}
              className="p-1.5 text-text-dim hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all mr-1"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
          {widget.type === "weather" && (
            <div className="flex items-center gap-1">
              <button
                onClick={onExpandWeather}
                className="p-1.5 text-text-dim hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all mr-1"
                title="Expand Weather Dashboard"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={onEditWeather}
                className="p-1.5 text-text-dim hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all mr-1"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
          {widget.type === "news" && (
            <button
              onClick={onEditNews}
              className="p-1.5 text-text-dim hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all mr-1"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <div className="flex bg-black/5 rounded-lg p-0.5 border border-white/5 mr-2">
            {(["sm", "md", "lg", "xl"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onResize(s)}
                className={`
                  w-6 h-5 text-[8px] font-black uppercase flex items-center justify-center rounded-md transition-all
                  ${
                    widget.size === s
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "text-text-dim hover:text-text-main hover:bg-white/5"
                  }
                `}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={onRemove}
            className="p-1.5 text-text-dim hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 relative">{renderContent()}</div>
    </div>
  );
}

function PersonnelModalContent() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 h-full overflow-y-auto custom-scrollbar pr-2">
      {Object.entries(SHIFT_TEAMS).map(([name, team]) => (
        <div
          key={name}
          className="tactical-card p-6 group hover:border-indigo-500/30"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] italic">
              {name} <span className="text-text-dim not-italic">Shift</span>
            </h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-black text-text-main leading-tight uppercase tracking-tight">
                  {team.lead}
                </p>
                <p className="text-[8px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5 italic">
                  Protocol Lead
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/5">
              {team.members.map((member) => (
                <div
                  key={member}
                  className="flex items-center gap-3 pl-2 group/member"
                >
                  <div className="w-1 h-1 rounded-full bg-slate-700 group-hover/member:bg-indigo-500 transition-colors" />
                  <p className="text-[10px] font-bold text-text-dim group-hover/member:text-text-main transition-colors uppercase tracking-tight">
                    {member}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimeWidgetContent({
  settings = DEFAULT_CLOCK_SETTINGS,
}: {
  settings?: ClockSettings;
}) {
  const [now, setNow] = useState(new Date());
  const [nextEvents, setNextEvents] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);

    // Fetch upcoming events for the ticker
    const q = query(
      collection(db, "calendar_events"),
      orderBy("eventDate", "asc"),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const todayStr = format(new Date(), "yyyy-MM-dd");
      // Filter for today or future
      setNextEvents(
        all.filter((e: any) => e.eventDate >= todayStr).slice(0, 3),
      );
    });

    return () => {
      clearInterval(timer);
      unsub();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 py-4 relative">
      <div className="absolute inset-0 bg-indigo-500/[0.02] blur-[80px] rounded-full animate-pulse pointer-events-none" />

      <div className="flex flex-col items-center relative z-10">
        <div
          className={cn(
            settings.fontSize,
            settings.fontWeight,
            settings.color,
            settings.fontFamily,
            "tracking-tighter leading-none hover:scale-105 transition-all duration-700 cursor-default flex items-baseline",
          )}
        >
          {format(now, settings.is24Hour ? "HH:mm" : "hh:mm")}
          <span className="text-[0.4em] opacity-30 ml-2 animate-pulse font-thin w-[1.5ch]">
            {format(now, "ss")}
          </span>
          {!settings.is24Hour && (
            <span className="text-[0.3em] ml-4 font-black uppercase text-slate-600">
              {format(now, "aa")}
            </span>
          )}
        </div>

        {settings.showDate && (
          <div className="flex flex-col items-center mt-6">
            <p className="text-[11px] text-indigo-500/60 font-black uppercase tracking-[0.4em] italic mb-1.5">
              Operational Phase
            </p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              {format(now, "EEEE, LLLL do, yyyy")}
            </p>
          </div>
        )}
      </div>

      {/* Upcoming Operations Feed */}
      <div className="w-full max-w-sm space-y-3 relative z-10 pt-6 border-t border-white/5">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-500" /> Planned Operations
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-indigo-500/40 uppercase tracking-tighter italic">
              Live Sync
            </span>
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {nextEvents.length === 0 ? (
          <div className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic text-center py-4 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
            Buffer Empty / Standby Mode
          </div>
        ) : (
          <div className="space-y-2">
            {nextEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all group overflow-hidden relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors" />
                <div className="flex items-center gap-3 pl-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      event.type === "alert"
                        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                        : event.type === "info"
                          ? "bg-indigo-500"
                          : "bg-emerald-500",
                    )}
                  />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.05em] truncate w-36 group-hover:text-indigo-400 transition-colors">
                    {event.title}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-500 uppercase italic block leading-none">
                    {event.eventDate === format(new Date(), "yyyy-MM-dd")
                      ? "Today"
                      : format(
                          new Date(event.eventDate + "T00:00:00"),
                          "MMM d",
                        )}
                  </span>
                  <span className="text-[8px] text-slate-700 font-mono mt-1 block uppercase">
                    {event.eventTime || "TBD"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ShiftReportAddContent({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdd = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "shift_updates"), {
        content: content,
        timestamp: serverTimestamp(),
        author: auth.currentUser?.email || "Anonymous",
        status: "pending",
      });
      setContent("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePopout = () => {
    const standaloneUrl = window.location.href.split('#')[0] + '#/single-shift-report';
    window.open(
      standaloneUrl,
      'ShiftReportWindow',
      'width=1450,height=920,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
    );
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          Shift Operations
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-blue-400/20 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            Open Modal
          </button>
          <button
            type="button"
            onClick={handlePopout}
            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-white rounded-lg transition-all border border-emerald-400/20 cursor-pointer shadow-sm"
            title="Pop out standalone window by itself"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Quick Shift Update Entry
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="tactical-input w-full p-4 text-white font-mono text-xs leading-relaxed"
          placeholder="ENTER OPERATIONAL UPDATE TO BE INCLUDED IN SHIFT REPORT..."
        />
      </div>
      <button
        onClick={handleAdd}
        disabled={saving}
        className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 text-xs cursor-pointer"
      >
        {saving ? (
          <Activity className="w-4 h-4 animate-spin" />
        ) : (
          <PlusCircle className="w-4 h-4" />
        )}
        Inject into Operation Log
      </button>

      <ShiftReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

// sync
