import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
  signInAnonymously,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  onSnapshot as firebaseOnSnapshot,
  setDoc,
  updateDoc,
  terminate,
  clearIndexedDbPersistence,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
// Use the specific database ID from the config if available
export const db = getFirestore(
  app,
  (firebaseConfig as any).firestoreDatabaseId || "(default)",
);

// Attempt to clear persistence to avoid "INTERNAL ASSERTION FAILED"
clearIndexedDbPersistence(db).catch(() => {});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType | string;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType | string,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  const jsonError = JSON.stringify(errInfo);
  console.warn(
    "Firestore Access Warning (Bypassed / Offline Fallback): ",
    jsonError,
  );
  // We do not throw a fresh error to make sure components do not crash when firewalled/offline
}

export async function signIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === "auth/unauthorized-domain") {
      const currentDomain = window.location.hostname;
      console.error(
        `Firebase Error: Unauthorized Domain. Please add "${currentDomain}" to your authorized domains in the Firebase Console (Authentication > Settings > Authorized Domains).`,
      );
      alert(
        `Firebase Error: Unauthorized Domain. \n\nPlease add "${currentDomain}" to your authorized domains in the Firebase Console (Authentication > Settings > Authorized Domains).`,
      );
    }
    console.error("Error signing in:", error);
    throw error;
  }
}

export async function logOut() {
  await signOut(auth);
}

// Test connection as required by instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export type Certification = {
  id: string;
  name: string;
  expirationDate: string;
  required: boolean;
};

export type PersonnelMember = {
  id: string;
  name: string;
  shift: "A" | "B" | "C" | "D" | "Other";
  phone?: string;
  email?: string;
  username?: string;
  role?: string;
  certifications?: Certification[];
};

export type UnitConfig = {
  id: string;
  name: string;
  homePost: string;
  address: string;
  type: "transport" | "qrv";
};

export type SidebarLink = {
  id: string;
  label: string;
  path: string;
  icon: string;
  external: boolean;
};

export type ThemeOverrides = {
  brandBlue?: string;
  brandIndigo?: string;
  brandEmerald?: string;
  brandPanel?: string;
  brandBorder?: string;
  brandBg?: string;
  brandField?: string;
  brandAccent?: string;
  headerLogoColor?: string;
  bgMain?: string;
  bgSurface?: string;
  textMain?: string;
  textDim?: string;
  panelOpacity?: number;
  globalScale?: number;
};

export type GlobalSettings = {
  backgroundStyle: "glow" | "emergency";
  lightIntensity: number;
  employees?: string[];
  personnel?: PersonnelMember[];
  supervisors?: Record<string, string>;
  alssupOptions?: string[];
  zuluOptions?: string[];
  defaultCameraIds?: string[];
  fleetConfigs?: UnitConfig[];
  sidebarLinks?: SidebarLink[];
  weatherModules?: {
    showPressure: boolean;
    showTimeline: boolean;
    showTomorrow: boolean;
    showCurrent: boolean;
  };
  themeOverrides?: ThemeOverrides;
  updatedAt?: any;
  updatedBy?: string | null;
};

export async function updateGlobalSettings(settings: Partial<GlobalSettings>) {
  // 1. Instantly update the local storage cache first
  try {
    const existingCache = localStorage.getItem("cached_global_settings");
    const existingObj = existingCache ? JSON.parse(existingCache) : {};
    const merged = { ...existingObj, ...settings };
    localStorage.setItem("cached_global_settings", JSON.stringify(merged));
  } catch (err) {
    console.warn("Could not save settings to offline cache:", err);
  }

  // 2. Perform online Firestore update (best-effort)
  try {
    const settingsRef = doc(db, "settings", "global");
    await setDoc(
      settingsRef,
      {
        ...settings,
        updatedAt: Timestamp.now(),
        updatedBy:
          auth.currentUser?.email || auth.currentUser?.uid || "anonymous",
      },
      { merge: true },
    );
  } catch (error) {
    console.warn("Firestore settings update skipped (firewall/blocked):", error);
  }
}

export type ShiftReport = {
  id?: string;
  name: string;
  date: string;
  shift: string;
  createdAt: any;
  data: any;
  htmlReport: string;
  plainReport: string;
};

export async function saveReport(
  report: Omit<ShiftReport, "id" | "createdAt">,
) {
  const newId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullReport: ShiftReport = {
    id: newId,
    createdAt: new Date().toISOString(),
    ...report
  };

  // 1. Save to Local Storage Cache
  try {
    const local = localStorage.getItem("cached_local_reports");
    const list: ShiftReport[] = local ? JSON.parse(local) : [];
    list.unshift(fullReport);
    localStorage.setItem("cached_local_reports", JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.warn("Local storage save report failed:", e);
  }

  // 2. Save to Firestore as best effort
  try {
    await addDoc(collection(db, "reports"), {
      ...report,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Firestore save report skipped (firewall/blocked):", error);
  }

  return newId;
}

export async function getReports(limitCount: number = 50): Promise<ShiftReport[]> {
  const allReports: ShiftReport[] = [];

  // 1. Read from Local Storage
  try {
    const local = localStorage.getItem("cached_local_reports");
    if (local) {
      const list = JSON.parse(local);
      allReports.push(...list);
    }
  } catch (e) {
    console.warn("Failed reading local reports cache:", e);
  }

  // 2. Fetch from Firestore (best-effort)
  try {
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    const fsReports = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ShiftReport);
    allReports.push(...fsReports);
  } catch (error) {
    console.warn("Firestore getReports skipped (firewall/blocked):", error);
  }

  // Deduplicate by ID and sort descending
  const map = new Map<string, ShiftReport>();
  for (const r of allReports) {
    if (r.id && !map.has(r.id)) {
      map.set(r.id, r);
    }
  }
  const result = Array.from(map.values());
  result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return result.slice(0, limitCount);
}

export async function saveTurnoverReport(data: any) {
  const newId = `turn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullTurnover = {
    id: newId,
    submittedAt: new Date().toISOString(),
    ...data
  };

  // 1. Save to Local Storage Cache
  try {
    const local = localStorage.getItem("cached_local_turnovers");
    const list = local ? JSON.parse(local) : [];
    list.unshift(fullTurnover);
    localStorage.setItem("cached_local_turnovers", JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.warn("Local storage save turnover failed:", e);
  }

  // 2. Save to Firestore (best-effort)
  try {
    await addDoc(collection(db, "shift_turnovers"), {
      ...data,
      submittedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn("Firestore save turnover skipped (firewall/blocked):", error);
  }

  return newId;
}

export async function getTurnoverReports(limitCount: number = 50) {
  const allTurnovers: any[] = [];

  // 1. Read from Local Storage
  try {
    const local = localStorage.getItem("cached_local_turnovers");
    if (local) {
      allTurnovers.push(...JSON.parse(local));
    }
  } catch (e) {
    console.warn("Failed reading local turnovers cache:", e);
  }

  // 2. Fetch from Firestore (best-effort)
  try {
    const q = query(
      collection(db, "shift_turnovers"),
      orderBy("submittedAt", "desc"),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    allTurnovers.push(...snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.warn("Firestore getTurnoverReports skipped (firewall/blocked):", error);
  }

  // Deduplicate by ID and sort descending
  const map = new Map<string, any>();
  for (const t of allTurnovers) {
    if (t.id && !map.has(t.id)) {
      map.set(t.id, t);
    }
  }
  const result = Array.from(map.values());
  result.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  return result.slice(0, limitCount);
}

export const onSnapshot = (...args: any[]) => {
  const errorHandler = (err: any) => {
    console.warn("Firestore onSnapshot error (Quota Exceeded / Offline):", err);
  };

  try {
    // If the 2nd arg is an object with 'next' (observer)
    if (
      args.length === 2 &&
      typeof args[1] === "object" &&
      args[1] !== null &&
      "next" in args[1]
    ) {
      const observer = args[1];
      if (!observer.error) observer.error = errorHandler;
      return (firebaseOnSnapshot as any)(args[0], observer);
    }
    // If the 3rd arg is an object with 'next' (options + observer)
    if (
      args.length === 3 &&
      typeof args[2] === "object" &&
      args[2] !== null &&
      "next" in args[2]
    ) {
      const observer = args[2];
      if (!observer.error) observer.error = errorHandler;
      return (firebaseOnSnapshot as any)(args[0], args[1], observer);
    }

    // For standalone callbacks: (ref, next, error?, cb?) or (ref, options, next, error?, cb?)
    if (args.length === 2 && typeof args[1] === "function") {
      return (firebaseOnSnapshot as any)(args[0], args[1], errorHandler);
    }
    if (
      args.length === 3 &&
      typeof args[1] === "object" &&
      typeof args[2] === "function"
    ) {
      return (firebaseOnSnapshot as any)(
        args[0],
        args[1],
        args[2],
        errorHandler,
      );
    }

    return (firebaseOnSnapshot as any)(...args);
  } catch (err) {
    errorHandler(err);
    return () => {}; // return dummy unsub
  }
};

export {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
  doc,
  query,
  orderBy,
  collection,
  addDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  setDoc,
  deleteDoc,
  getDocs,
};
