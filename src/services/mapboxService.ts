import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../lib/distanceConstants';

export async function geocode(address: string): Promise<[number, number]> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.features || data.features.length === 0) throw new Error("Location not found");
  return data.features[0].center; // [lng, lat]
}

export interface MatrixResult {
  distances: number[][];
  durations: number[][];
}

export async function getMatrix(dest: [number, number], sources: [number, number][]): Promise<MatrixResult> {
  if (sources.length === 0) return { distances: [[]], durations: [[]] };
  
  const MAX_SOURCES = 24;
  const results: MatrixResult = { distances: [[]], durations: [[]] };
  
  for (let i = 0; i < sources.length; i += MAX_SOURCES) {
    const chunk = sources.slice(i, i + MAX_SOURCES);
    const coordString = [dest.join(','), ...chunk.map(c => c.join(','))].join(';');
    const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordString}?sources=0&annotations=distance,duration&access_token=${MAPBOX_TOKEN}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.code !== 'Ok') throw new Error("Calculation failure");
    
    if (data.distances && data.distances[0]) {
      results.distances[0].push(...data.distances[0].slice(1));
    }
    if (data.durations && data.durations[0]) {
      results.durations[0].push(...data.durations[0].slice(1));
    }
  }
  
  return results;
}

export async function fetchCurrentUsage(): Promise<number> {
  return 0; // Disabled external tracking
}

export async function incrementUsage(amount: number): Promise<number> {
  return 0; // Disabled external tracking
}
