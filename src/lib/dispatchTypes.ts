export type UnitStatus = 'CALL' | 'DEST' | 'LOGS' | 'READY' | 'OOS';

export interface UnitState {
  id: string;
  type: UnitStatus;
  start: number;
}

export interface Post {
  name: string;
  lat: number;
  lon: number;
}

export interface Unit {
  id: string;
  home: string;
}

export interface DragPosition {
  left?: string;
  top?: string;
  lat?: number;
  lon?: number;
}

export interface Recommendation {
  post: string;
  unitId: string;
  dist: number;
  type: 'GAP' | 'MUTUAL_AID';
}
