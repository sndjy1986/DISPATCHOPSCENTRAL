export interface Camera {
  id: string;
  name: string;
  url: string;
  description: string;
  lat: number;
  lng: number;
  direction: string;
}

export interface Detection {
  label: string;
  confidence: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export interface AiAnalysisResult {
  detections: Detection[];
  summary: string;
  flow: 'LOW' | 'MODERATE' | 'HIGH' | 'STAMPEDE';
  timestamp: string;
}
