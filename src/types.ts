export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt?: any;
}

export type UnitStatus = 'READY' | 'CALL' | 'DEST' | 'LOGS' | 'OOS';

export interface UnitState {
  id: string;
  type: UnitStatus;
  start: number;
}

export interface AppSettings {
  id?: string;
  emergencyMode: boolean;
  emergencyBackgroundOpacity?: number;
  ambienceMode?: 'slate-glow' | 'emergency';
  updatedAt?: string;
  updatedBy?: string;
}

export interface ToneTestRecord {
  id: string;
  unit: string;
  date: string;
  time: string;
  callSign: string;
  tenFortyTwo: string;
  ttDone: boolean;
  lateStatus?: string;
  updatedAt?: string;
  updatedBy?: string;
}
