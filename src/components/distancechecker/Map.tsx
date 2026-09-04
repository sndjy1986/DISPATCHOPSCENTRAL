import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../../lib/distanceConstants';
import { useTerminal } from '../../context/TerminalContext';

interface MapProps {
  coords?: [number, number];
}

export default function Map({ coords }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { appTheme } = useTerminal();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    // Choose style based on theme
    const isDark = ['midnight', 'sky', 'arctic', 'clay'].includes(appTheme);
    const mapStyle = isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: coords || [-82.64857, 34.51336], // HQ Center
      zoom: 10,
    });

    return () => {
      map.current?.remove();
    };
  }, [appTheme]);

  useEffect(() => {
    if (!map.current || !coords) return;

    if (marker.current) {
      marker.current.remove();
    }

    marker.current = new mapboxgl.Marker({ color: '#2c82ff' })
      .setLngLat(coords)
      .addTo(map.current);

    map.current.flyTo({
      center: coords,
      zoom: 12,
      essential: true
    });
  }, [coords]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[450px] rounded-xl border border-white/10 overflow-hidden shadow-2xl" 
    />
  );
}
// sync
