import React, { createContext, useContext, useState, useEffect } from 'react';

type EmergencyLevel = 'NORMAL' | 'CAUTION' | 'CRITICAL' | 'LOCKDOWN';
export type AppTheme = 'paper' | 'midnight' | 'cream' | 'mint' | 'clay' | 'arctic' | 'ivory' | 'frost' | 'sky';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}

interface TerminalContextType {
  emergencyLevel: EmergencyLevel;
  setEmergencyLevel: (level: EmergencyLevel) => void;
  manualEmergencyMode: boolean;
  setManualEmergencyMode: (val: boolean) => void;
  emergencyOpacity: number;
  setEmergencyOpacity: (val: number) => void;
  weatherZip: string | null;
  setWeatherZip: (zip: string | null) => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
  appBackgroundImage: string | null;
  setAppBackgroundImage: (url: string | null) => void;
  toneTestMode: boolean;
  setToneTestMode: (val: boolean) => void;
  notifications: Notification[];
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission | undefined>;
  addNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
  terminalUser: { username: string; role: string } | null;
  loginTerminalUser: (username: string, role: string) => void;
  logoutTerminalUser: () => void;
  firebaseUser: any | null;
  userSettings: any | null;
  isUserSettingsLoaded: boolean;
  updateUserSettings: (key: string, value: any) => Promise<void>;
  isSavingGlobal: boolean;
  setIsSavingGlobal: (val: boolean) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  // 1. All state declarations first to avoid TDZ (Temporal Dead Zone) issues
  const [userSettings, setUserSettings] = useState<any | null>(null);
  const [isUserSettingsLoaded, setIsUserSettingsLoaded] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('NORMAL');
  const [manualEmergencyMode, setManualEmergencyMode] = useState(false);
  const [emergencyOpacity, setEmergencyOpacity] = useState(0.2);
  const [weatherZip, setWeatherZip] = useState<string | null>(null);
  const [appTheme, setAppTheme] = useState<AppTheme>('paper');
  const [appBackgroundImage, setAppBackgroundImage] = useState<string | null>(null);
  const [isSyncingTheme, setIsSyncingTheme] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [toneTestMode, setToneTestMode] = useState<boolean>(() => localStorage.getItem('toneTestMode') !== 'false');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [terminalUser, setTerminalUser] = useState<{ username: string; role: string } | null>(() => {
    const saved = localStorage.getItem('terminalUser');
    return saved ? JSON.parse(saved) : null;
  });

  // 2. Function declarations (hoisted within the functional component scope)
  async function updateUserSettings(key: string, value: any) {
    const userKey = firebaseUser?.uid || (terminalUser ? `terminal_${terminalUser.username}` : null);
    // Update local state first for responsiveness
    setUserSettings((prev: any) => {
      const merged = { ...prev, [key]: value };
      if (userKey) {
        localStorage.setItem(`userSettings_${userKey}`, JSON.stringify(merged));
      }
      return merged;
    });
    
    if (userKey) {
      try {
        const { db, doc, setDoc } = await import('../lib/firebase');
        await setDoc(doc(db, 'users', userKey, 'settings', 'terminal'), {
          [key]: value
        }, { merge: true });
      } catch (err) {
        console.error('Failed to sync user settings:', err);
      }
    }
  }

  function setWeatherZipGlobal(zip: string | null) {
    setWeatherZip(zip);
    if (zip) {
      localStorage.setItem('weatherZip', zip);
    } else {
      localStorage.removeItem('weatherZip');
    }
    updateUserSettings('weatherZip', zip);
  }

  async function setAppThemeGlobal(theme: AppTheme) {
    setAppTheme(theme);
    localStorage.setItem('appTheme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    updateUserSettings('appTheme', theme);

    // Also attempt to sync to global settings if user is admin/root
    setIsSavingGlobal(true);
    try {
      const { db, doc, updateDoc } = await import('../lib/firebase');
      await updateDoc(doc(db, 'settings', 'global'), {
        appTheme: theme
      });
    } catch (e) {
      // Silently fail if not admin
    } finally {
      setTimeout(() => setIsSavingGlobal(false), 2000);
    }
  }

  async function setAppBackgroundImageGlobal(url: string | null) {
    setAppBackgroundImage(url);
    if (url) localStorage.setItem('appBackgroundImage', url);
    else localStorage.removeItem('appBackgroundImage');
    updateUserSettings('appBackgroundImage', url);
  }

  function loginTerminalUser(username: string, role: string) {
    const user = { username, role };
    setTerminalUser(user);
    localStorage.setItem('terminalUser', JSON.stringify(user));
  }

  function logoutTerminalUser() {
    setTerminalUser(null);
    localStorage.removeItem('terminalUser');
  }

  // 3. Effects last
  useEffect(() => {
    const savedLocal = localStorage.getItem('appBackgroundImage');
    const savedRemote = userSettings?.appBackgroundImage;
    
    if (savedRemote !== undefined && savedRemote !== appBackgroundImage) {
      setAppBackgroundImage(savedRemote);
    } else if (savedLocal && !savedRemote && savedLocal !== appBackgroundImage) {
      setAppBackgroundImage(savedLocal);
    }
  }, [userSettings?.appBackgroundImage]);

  useEffect(() => {
    const savedLocal = localStorage.getItem('weatherZip');
    const savedRemote = userSettings?.weatherZip;
    if (savedRemote && savedRemote !== weatherZip) {
      setWeatherZip(savedRemote);
    } else if (savedLocal && !savedRemote && savedLocal !== weatherZip) {
      setWeatherZip(savedLocal);
    }
  }, [userSettings?.weatherZip]);

  useEffect(() => {
    const savedLocal = localStorage.getItem('appTheme') as AppTheme;
    const savedRemote = userSettings?.appTheme as AppTheme;
    
    if (savedRemote && savedRemote !== appTheme) {
      setAppTheme(savedRemote);
      document.documentElement.setAttribute('data-theme', savedRemote);
    } else if (savedLocal && !savedRemote && savedLocal !== appTheme) {
      setAppTheme(savedLocal);
      document.documentElement.setAttribute('data-theme', savedLocal);
    }
  }, [userSettings?.appTheme]);
  // Sync user settings from Firestore with offline local storage fallbacks
  useEffect(() => {
    let unsub: any = null;
    const userKey = firebaseUser?.uid || (terminalUser ? `terminal_${terminalUser.username}` : null);
    if (userKey) {
      // 1. Load instantly from offline cache
      const cached = localStorage.getItem(`userSettings_${userKey}`);
      if (cached) {
        try {
          setUserSettings(JSON.parse(cached));
          setIsUserSettingsLoaded(true);
        } catch (e) {
          console.warn("Error parsing local offline cache settings:", e);
        }
      }

      // 2. Dynamically subscribe to Firebase
      import('../lib/firebase').then(({ db, doc, onSnapshot }) => {
        unsub = onSnapshot(doc(db, 'users', userKey, 'settings', 'terminal'), (s) => {
          if (s.exists()) {
            const data = s.data();
            setUserSettings(data);
            localStorage.setItem(`userSettings_${userKey}`, JSON.stringify(data));
          }
          setIsUserSettingsLoaded(true);
        }, (err) => {
          console.warn("Firestore settings listen offline or blocked:", err);
          setIsUserSettingsLoaded(true);
        });
      }).catch(err => {
        console.warn("Firebase import failed during userSettings listen:", err);
        setIsUserSettingsLoaded(true);
      });
    } else {
      setUserSettings(null);
      setIsUserSettingsLoaded(true);
    }
    return () => { if (unsub) unsub(); };
  }, [firebaseUser, terminalUser]);

  // ONE-TIME CLEANUP: Managed via backend seed script
  useEffect(() => {
    console.log("Terminal Authentication Matrix Online. System user configured: sndjy (root)");
  }, []);

  useEffect(() => {
    // Lazy import auth to avoid initialization issues
    import('../lib/firebase').then(({ auth }) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setFirebaseUser(user);
      });
      return () => unsubscribe();
    });
  }, []);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Sync permission state
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    const checkPermission = () => {
      if (Notification.permission !== notificationPermission) {
        setNotificationPermission(Notification.permission);
      }
    };
    const interval = setInterval(checkPermission, 2000);
    return () => clearInterval(interval);
  }, [notificationPermission]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } catch (error) {
      console.error("Permission request failed:", error);
      return 'denied';
    }
  };

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newNote: Notification = {
      id,
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [newNote, ...prev].slice(0, 5));

    // System Level Notification (Desktop)
    if (typeof Notification !== 'undefined') {
      const isIframe = window.self !== window.top;
      console.log('Attempting Desktop Notification. Permission:', Notification.permission, 'Iframe:', isIframe);
      
      if (Notification.permission === 'granted') {
        try {
          // Use a data URI for a generic "alert" icon to ensure it loads
          const iconUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2MzY2ZjEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTggOGE2IDYgMCAwIDAtMTItMGE2IDYgMCAwIDAgMTIgMFoiLz48cGF0aCBkPSJNMTggOGE2IDYgMCAwIDAtMTItMGE2IDYgMCAwIDAgMTIgMFoiLz48cGF0aCBkPSJNOSAxMiA3IDEwIDUgMTIiLz48cGF0aCBkPSJNMTUgMTIgMTcgMTAgMTkgMTIiLz48L3N2Zz4=';

          const n = new Notification(`DISPATCH ALERT`, {
            body: message,
            icon: iconUrl,
            tag: 'alert-' + type,
            renotify: true,
            silent: false,
            requireInteraction: true // Forcing Windows to keep it visible
          } as any);
          
          n.onclick = (e) => {
            e.preventDefault();
            window.focus();
            n.close();
          };
        } catch (e) {
          console.warn('Desktop notification constructor failed:', e);
        }
      }
    }

    // Auto remove after 8 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Sync weatherZip to local
  useEffect(() => {
    if (weatherZip) {
      localStorage.setItem('weatherZip', weatherZip);
    } else {
      localStorage.removeItem('weatherZip');
    }
  }, [weatherZip]);

  useEffect(() => {
    localStorage.setItem('appTheme', appTheme);
    document.documentElement.setAttribute('data-theme', appTheme);
  }, [appTheme]);

  useEffect(() => {
    localStorage.setItem('toneTestMode', toneTestMode.toString());
  }, [toneTestMode]);

  // Apply theme overrides from global settings
  useEffect(() => {
    let unsubPromise: Promise<() => void> | null = null;
    
    unsubPromise = import('../lib/firebase').then(({ db, doc, onSnapshot, handleFirestoreError, OperationType }) => {
      return onSnapshot(doc(db, 'settings', 'global'), (s) => {
        if (s.exists() && !isSavingGlobal) {
          const data = s.data();
          if (data.themeOverrides) {
            const overrides = data.themeOverrides;
            const root = document.documentElement;
            
            const vars: Record<string, string | undefined> = {
              '--brand-blue': overrides.brandBlue,
              '--brand-indigo': overrides.brandIndigo,
              '--brand-emerald': overrides.brandEmerald,
              '--brand-panel': overrides.brandPanel,
              '--brand-border': overrides.brandBorder,
              '--brand-bg': overrides.brandBg,
              '--brand-field': overrides.brandField,
              '--brand-accent': overrides.brandAccent,
              '--header-logo-color': overrides.headerLogoColor,
              '--bg-main': overrides.bgMain,
              '--bg-surface': overrides.bgSurface,
              '--text-main': overrides.textMain,
              '--text-dim': overrides.textDim,
              '--panel-opacity': overrides.panelOpacity?.toString(),
              '--global-scale': overrides.globalScale?.toString(),
            };

            if (data.appTheme && !localStorage.getItem('appTheme')) {
              setAppTheme(data.appTheme);
              document.documentElement.setAttribute('data-theme', data.appTheme);
            }

            Object.entries(vars).forEach(([key, value]) => {
              if (value !== undefined) root.style.setProperty(key, value);
            });

            if (overrides.globalScale !== undefined) {
              root.style.fontSize = `${16 * overrides.globalScale}px`;
            }
          }
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/global'));
    });

    return () => {
      unsubPromise?.then(unsub => unsub());
    };
  }, []);

  return (
    <TerminalContext.Provider value={{ 
      emergencyLevel, 
      setEmergencyLevel,
      manualEmergencyMode,
      setManualEmergencyMode,
      emergencyOpacity,
      setEmergencyOpacity,
      weatherZip,
      setWeatherZip: setWeatherZipGlobal,
      appTheme,
      setAppTheme: setAppThemeGlobal,
      appBackgroundImage,
      setAppBackgroundImage: setAppBackgroundImageGlobal,
      toneTestMode,
      setToneTestMode,
      notifications,
      notificationPermission,
      requestNotificationPermission,
      addNotification,
      removeNotification,
      terminalUser,
      loginTerminalUser,
      logoutTerminalUser,
      firebaseUser,
      userSettings,
      isUserSettingsLoaded,
      updateUserSettings,
      isSavingGlobal,
      setIsSavingGlobal
    }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}
