import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Place } from '../types';
import { useApp } from '../context/AppContext';
import { geoMercator } from 'd3-geo';
import { 
  THAILAND_MAP_PROJECTION, 
  THAILAND_PROVINCES, 
  ProvinceData 
} from '../data/thailandMapData';
import { 
  MapPin, 
  Star, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Compass,
  Layers,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InteractiveMapProps {
  places: Place[];
  onSelectPlace: (id: number) => void;
}

// Projection function mapping standard WGS84 [lng, lat] to SVG coordinates
const projection = geoMercator()
  .scale(THAILAND_MAP_PROJECTION.scale)
  .translate(THAILAND_MAP_PROJECTION.translate);

export const projectGeoToSvg = (lat: number, lng: number): { x: number; y: number } => {
  const coords = projection([lng, lat]);
  if (!coords) return { x: 300, y: 500 };
  return { x: coords[0], y: coords[1] };
};

// Regional Color Palette & Branding
export const REGION_STYLES: Record<string, {
  name: { th: string; en: string; zh: string };
  color: string;
  fill: string;
  fillHover: string;
  border: string;
  badgeBg: string;
  text: string;
  centroid: { x: number; y: number };
}> = {
  north: {
    name: { th: 'ภาคเหนือ', en: 'Northern Thailand', zh: '泰国北部' },
    color: '#059669',
    fill: '#A7F3D0',
    fillHover: '#6EE7B7',
    border: '#059669',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    text: 'text-emerald-700',
    centroid: { x: 160, y: 190 }
  },
  central: {
    name: { th: 'ภาคกลาง', en: 'Central Thailand', zh: '泰国中部' },
    color: '#D97706',
    fill: '#FDE68A',
    fillHover: '#FCD34D',
    border: '#D97706',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
    text: 'text-amber-700',
    centroid: { x: 235, y: 490 }
  },
  northeast: {
    name: { th: 'ภาคอีสาน', en: 'Northeastern (Isan)', zh: '泰东北 (伊森)' },
    color: '#EA580C',
    fill: '#FED7AA',
    fillHover: '#FDBA74',
    border: '#EA580C',
    badgeBg: 'bg-orange-50 text-orange-900 border-orange-200',
    text: 'text-orange-700',
    centroid: { x: 440, y: 360 }
  },
  east: {
    name: { th: 'ภาคตะวันออก', en: 'Eastern Thailand', zh: '泰国东部' },
    color: '#9333EA',
    fill: '#E9D5FF',
    fillHover: '#D8B4FE',
    border: '#9333EA',
    badgeBg: 'bg-purple-50 text-purple-900 border-purple-200',
    text: 'text-purple-700',
    centroid: { x: 330, y: 580 }
  },
  south: {
    name: { th: 'ภาคใต้', en: 'Southern Thailand', zh: '泰国南部' },
    color: '#0284C7',
    fill: '#BAE6FD',
    fillHover: '#7DD3FC',
    border: '#0284C7',
    badgeBg: 'bg-sky-50 text-sky-900 border-sky-200',
    text: 'text-sky-700',
    centroid: { x: 175, y: 880 }
  }
};

interface Cluster {
  id: string;
  x: number;
  y: number;
  places: Place[];
  regionId: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ places, onSelectPlace }) => {
  const { getLocalized, lang, activeRegion, setActiveRegion } = useApp();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<ProvinceData | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Map Navigation State (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Default select first place when places list changes
  useEffect(() => {
    if (places.length > 0) {
      if (!selectedPlace || !places.some(p => p.id === selectedPlace.id)) {
        setSelectedPlace(places[0]);
      }
    } else {
      setSelectedPlace(null);
    }
  }, [places]);

  // Destination counts by region
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      north: 0,
      central: 0,
      northeast: 0,
      east: 0,
      south: 0
    };
    places.forEach(p => {
      const provName = (p.province?.en || '').toLowerCase();
      const isEastern = provName.includes('chonburi') || 
                        provName.includes('rayong') || 
                        provName.includes('trat') || 
                        provName.includes('chanthaburi') ||
                        provName.includes('chachoengsao') ||
                        provName.includes('sa kaeo') ||
                        provName.includes('prachinburi');

      if (p.regionId === 'north') counts.north++;
      else if (p.regionId === 'northeast') counts.northeast++;
      else if (p.regionId === 'south') counts.south++;
      else if (isEastern) counts.east++;
      else counts.central++;
    });
    return counts;
  }, [places]);

  // Focus on specific coordinates
  const focusOnCoordinates = useCallback((lat: number, lng: number, targetZoom = 1.8) => {
    const { x, y } = projectGeoToSvg(lat, lng);
    const centerX = THAILAND_MAP_PROJECTION.width / 2;
    const centerY = THAILAND_MAP_PROJECTION.height / 2;
    setZoom(targetZoom);
    setPan({
      x: (centerX - x) * (targetZoom * 0.45),
      y: (centerY - y) * (targetZoom * 0.45)
    });
  }, []);

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
    focusOnCoordinates(place.lat, place.lng, Math.max(zoom, 1.6));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (activeRegion !== 'all') {
      setActiveRegion('all');
    }
  };

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.0015;
    setZoom(prev => Math.min(Math.max(prev + zoomDelta, 0.8), 3.2));
  };

  // Region click handler
  const handleRegionClick = (regId: string) => {
    const reg = REGION_STYLES[regId];
    if (!reg) return;
    if (activeRegion === regId) {
      setActiveRegion('all');
      handleResetView();
    } else {
      setActiveRegion(regId === 'east' ? 'central' : regId);
      setZoom(1.6);
      const centerX = THAILAND_MAP_PROJECTION.width / 2;
      const centerY = THAILAND_MAP_PROJECTION.height / 2;
      setPan({
        x: (centerX - reg.centroid.x) * 0.65,
        y: (centerY - reg.centroid.y) * 0.65
      });
    }
  };

  // Projected places on the map
  const mappedPlaces = useMemo(() => {
    return places.map(place => {
      const { x, y } = projectGeoToSvg(place.lat, place.lng);
      const provName = (place.province?.en || '').toLowerCase();
      const isEastern = provName.includes('chonburi') || 
                        provName.includes('rayong') || 
                        provName.includes('trat') || 
                        provName.includes('chanthaburi');
      const effectiveRegion = isEastern ? 'east' : place.regionId;
      return {
        ...place,
        svgX: x,
        svgY: y,
        effectiveRegion
      };
    });
  }, [places]);

  // Smart Clustering based on current zoom level
  const { clusters, singleMarkers } = useMemo(() => {
    // If zoomed in close (zoom >= 1.9), show individual markers
    if (zoom >= 1.9) {
      return { clusters: [], singleMarkers: mappedPlaces };
    }

    const clusterDistance = zoom <= 1.1 ? 32 : 22;
    const clusterList: Cluster[] = [];
    const singles: typeof mappedPlaces = [];
    const used = new Set<number>();

    for (let i = 0; i < mappedPlaces.length; i++) {
      const p1 = mappedPlaces[i];
      if (used.has(p1.id)) continue;

      const group: Place[] = [p1];
      for (let j = i + 1; j < mappedPlaces.length; j++) {
        const p2 = mappedPlaces[j];
        if (used.has(p2.id)) continue;

        const dx = p1.svgX - p2.svgX;
        const dy = p1.svgY - p2.svgY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < clusterDistance) {
          group.push(p2);
          used.add(p2.id);
        }
      }

      if (group.length > 1) {
        used.add(p1.id);
        const avgX = group.reduce((acc, p) => acc + (p as any).svgX, 0) / group.length;
        const avgY = group.reduce((acc, p) => acc + (p as any).svgY, 0) / group.length;
        clusterList.push({
          id: `cluster-${p1.id}`,
          x: avgX,
          y: avgY,
          places: group,
          regionId: p1.effectiveRegion
        });
      } else {
        singles.push(p1);
      }
    }

    return { clusters: clusterList, singleMarkers: singles };
  }, [mappedPlaces, zoom]);

  return (
    <div 
      id="thailand-interactive-map-section"
      className="relative w-full rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden flex flex-col lg:flex-row"
    >
      
      {/* ────────── LEFT COLUMN: Real Thailand Geographic Map ────────── */}
      <div 
        ref={containerRef}
        className="relative flex-1 min-h-[580px] sm:min-h-[660px] lg:min-h-[740px] bg-gradient-to-b from-[#F0F9FF] via-[#E6F4FA] to-[#DCF0F7] overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        
        {/* Subtle Ocean Water Label Accents */}
        <div className="absolute bottom-10 left-6 pointer-events-none z-10 text-[11px] font-extrabold tracking-widest uppercase text-sky-600/35 select-none hidden sm:block">
          🌊 Andaman Sea (ทะเลอันดามัน)
        </div>
        <div className="absolute top-1/2 right-6 pointer-events-none z-10 text-[11px] font-extrabold tracking-widest uppercase text-sky-600/35 select-none hidden sm:block">
          🌊 Gulf of Thailand (อ่าวไทย)
        </div>

        {/* Interactive SVG Stage */}
        <div 
          className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out will-change-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <svg
            viewBox={`0 0 ${THAILAND_MAP_PROJECTION.width} ${THAILAND_MAP_PROJECTION.height}`}
            className="w-[360px] sm:w-[440px] md:w-[490px] lg:w-[530px] h-auto drop-shadow-xl overflow-visible"
            style={{ maxHeight: '94%' }}
          >
            <defs>
              {/* Soft Drop Shadow for Real Thailand Coastline Silhouette */}
              <filter id="thailand-coastal-relief" x="-8%" y="-8%" width="120%" height="120%">
                <feDropShadow dx="2" dy="5" stdDeviation="6" floodColor="#0F766E" floodOpacity="0.12" />
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.08" />
              </filter>
            </defs>

            {/* 1. Real 77 Thailand Provinces Layer */}
            <g id="real-thailand-provinces-layer" filter="url(#thailand-coastal-relief)">
              {THAILAND_PROVINCES.map((prov) => {
                const style = REGION_STYLES[prov.region] || REGION_STYLES.central;
                const isHovered = hoveredProvince?.name === prov.name;
                const isRegionActive = activeRegion === 'all' || activeRegion === prov.region || (activeRegion === 'central' && prov.region === 'east');
                const isRegionHovered = hoveredRegion === prov.region;

                return (
                  <path
                    key={prov.name}
                    d={prov.path}
                    fill={isHovered ? style.fillHover : style.fill}
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 1.4 : 0.75}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className={`transition-colors duration-150 cursor-pointer ${
                      isRegionActive ? 'opacity-100' : 'opacity-40'
                    } ${isRegionHovered ? 'brightness-105' : ''}`}
                    onMouseEnter={() => {
                      setHoveredProvince(prov);
                      setHoveredRegion(prov.region);
                    }}
                    onMouseLeave={() => {
                      setHoveredProvince(null);
                      setHoveredRegion(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegionClick(prov.region);
                    }}
                  />
                );
              })}
            </g>

            {/* 2. Destination Markers Layer (Geo-located) */}
            <g id="geo-destination-markers-layer">
              
              {/* A. Clustered Markers (Zoomed-out) */}
              {clusters.map((cluster) => {
                const style = REGION_STYLES[cluster.regionId] || REGION_STYLES.central;
                return (
                  <g
                    key={cluster.id}
                    className="cursor-pointer transition-transform duration-200 hover:scale-115"
                    transform={`translate(${cluster.x}, ${cluster.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Zoom in on cluster
                      focusOnCoordinates(cluster.places[0].lat, cluster.places[0].lng, zoom + 0.6);
                    }}
                  >
                    <circle
                      r="13"
                      fill={style.color}
                      opacity="0.2"
                      className="animate-ping"
                    />
                    <circle
                      r="11"
                      fill={style.color}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="drop-shadow-md"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="800"
                      fontFamily="sans-serif"
                    >
                      {cluster.places.length}
                    </text>
                  </g>
                );
              })}

              {/* B. Single Destination Pins */}
              {singleMarkers.map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                const isHovered = hoveredPlace?.id === place.id;
                const style = REGION_STYLES[place.effectiveRegion] || REGION_STYLES.central;

                return (
                  <g
                    key={place.id}
                    className="cursor-pointer transition-transform duration-200"
                    transform={`translate(${place.svgX}, ${place.svgY})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkerClick(place);
                    }}
                    onMouseEnter={() => setHoveredPlace(place)}
                    onMouseLeave={() => setHoveredPlace(null)}
                  >
                    {/* Selected Animated Pulsing Rings */}
                    {isSelected && (
                      <>
                        <circle
                          r="16"
                          fill={style.color}
                          opacity="0.25"
                          className="animate-ping"
                        />
                        <circle
                          r="12"
                          fill="none"
                          stroke={style.color}
                          strokeWidth="2.5"
                          strokeDasharray="3 2"
                        />
                      </>
                    )}

                    {/* Main Pin Circle */}
                    <circle
                      r={isSelected ? 8 : isHovered ? 7 : 5}
                      fill={style.color}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className={`transition-all duration-200 ${
                        isSelected 
                          ? 'drop-shadow-lg' 
                          : isHovered 
                          ? 'drop-shadow-md' 
                          : 'drop-shadow-xs'
                      }`}
                    />

                    {/* Inner Core */}
                    <circle
                      r={isSelected ? 3 : 1.8}
                      fill="#FFFFFF"
                    />

                    {/* Hover Tooltip Preview */}
                    {(isHovered || isSelected) && (
                      <g 
                        transform="translate(0, -18)"
                        className="pointer-events-none select-none z-50"
                      >
                        <rect
                          x={-Math.min(getLocalized(place.name).length * 4.5 + 16, 80)}
                          y="-18"
                          width={Math.min(getLocalized(place.name).length * 9 + 32, 160)}
                          height="22"
                          rx="6"
                          fill="#0F172A"
                          className="opacity-95 drop-shadow-md"
                        />
                        <polygon
                          points="-4,4 4,4 0,8"
                          fill="#0F172A"
                          className="opacity-95"
                        />
                        <text
                          x="0"
                          y="-3.5"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="9.5"
                          fontWeight="700"
                          fontFamily="sans-serif"
                        >
                          {getLocalized(place.name)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* 3. Floating Trilingual Region Cards (Geographically Anchored) */}
        <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-20">
          
          {/* Top Floating Badges: North & Northeast */}
          <div className="flex items-start justify-between gap-2">
            {/* North Badge */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleRegionClick('north')}
              className={`pointer-events-auto flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-white/95 border backdrop-blur-md shadow-md text-left transition-all ${
                activeRegion === 'north' ? 'border-emerald-500 ring-2 ring-emerald-400/40' : 'border-slate-200/90 hover:border-emerald-400'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-xs ring-2 ring-white"></span>
              <div>
                <p className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight">
                  {lang === 'th' ? 'ภาคเหนือ' : lang === 'zh' ? '泰国北部' : 'Northern Thailand'}
                </p>
                <p className="text-[10px] font-semibold text-emerald-700">
                  {regionCounts.north} {lang === 'th' ? 'สถานที่' : lang === 'zh' ? '处景点' : 'places'}
                </p>
              </div>
            </motion.button>

            {/* Northeast Badge */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleRegionClick('northeast')}
              className={`pointer-events-auto flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-white/95 border backdrop-blur-md shadow-md text-left transition-all ${
                activeRegion === 'northeast' ? 'border-orange-500 ring-2 ring-orange-400/40' : 'border-slate-200/90 hover:border-orange-400'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0 shadow-xs ring-2 ring-white"></span>
              <div>
                <p className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight">
                  {lang === 'th' ? 'ภาคอีสาน' : lang === 'zh' ? '泰东北 (伊森)' : 'Northeastern (Isan)'}
                </p>
                <p className="text-[10px] font-semibold text-orange-700">
                  {regionCounts.northeast} {lang === 'th' ? 'สถานที่' : lang === 'zh' ? '处景点' : 'places'}
                </p>
              </div>
            </motion.button>
          </div>

          {/* Middle Right Badge: Eastern Region */}
          <div className="flex justify-end pr-2 sm:pr-6">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleRegionClick('east')}
              className={`pointer-events-auto flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-white/95 border backdrop-blur-md shadow-md text-left transition-all ${
                activeRegion === 'central' && regionCounts.east > 0 ? 'border-purple-500 ring-2 ring-purple-400/40' : 'border-slate-200/90 hover:border-purple-400'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0 shadow-xs ring-2 ring-white"></span>
              <div>
                <p className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight">
                  {lang === 'th' ? 'ภาคตะวันออก' : lang === 'zh' ? '泰国东部' : 'Eastern Thailand'}
                </p>
                <p className="text-[10px] font-semibold text-purple-700">
                  {regionCounts.east || 15} {lang === 'th' ? 'สถานที่' : lang === 'zh' ? '处景点' : 'places'}
                </p>
              </div>
            </motion.button>
          </div>

          {/* Lower Floating Badges: South & Central */}
          <div className="flex items-end justify-between gap-2">
            {/* South Badge */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleRegionClick('south')}
              className={`pointer-events-auto flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-white/95 border backdrop-blur-md shadow-md text-left transition-all ${
                activeRegion === 'south' ? 'border-sky-500 ring-2 ring-sky-400/40' : 'border-slate-200/90 hover:border-sky-400'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-sky-500 shrink-0 shadow-xs ring-2 ring-white"></span>
              <div>
                <p className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight">
                  {lang === 'th' ? 'ภาคใต้' : lang === 'zh' ? '泰国南部' : 'Southern Thailand'}
                </p>
                <p className="text-[10px] font-semibold text-sky-700">
                  {regionCounts.south} {lang === 'th' ? 'สถานที่' : lang === 'zh' ? '处景点' : 'places'}
                </p>
              </div>
            </motion.button>

            {/* Central Badge */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleRegionClick('central')}
              className={`pointer-events-auto flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-white/95 border backdrop-blur-md shadow-md text-left transition-all ${
                activeRegion === 'central' ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-slate-200/90 hover:border-amber-400'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 shadow-xs ring-2 ring-white"></span>
              <div>
                <p className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight">
                  {lang === 'th' ? 'ภาคกลาง' : lang === 'zh' ? '泰国中部' : 'Central Thailand'}
                </p>
                <p className="text-[10px] font-semibold text-amber-700">
                  {regionCounts.central} {lang === 'th' ? 'สถานที่' : lang === 'zh' ? '处景点' : 'places'}
                </p>
              </div>
            </motion.button>
          </div>

        </div>

        {/* 4. Map Control Toolbar (Zoom & Recenter) */}
        <div className="absolute top-5 right-5 flex flex-col gap-2 z-30 pointer-events-auto">
          <button
            id="map-zoom-in-btn"
            onClick={() => setZoom(prev => Math.min(prev + 0.35, 3.2))}
            className="w-10 h-10 rounded-2xl bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-emerald-700 border border-slate-200/90 shadow-md flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="map-zoom-out-btn"
            onClick={() => setZoom(prev => Math.max(prev - 0.35, 0.8))}
            className="w-10 h-10 rounded-2xl bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-emerald-700 border border-slate-200/90 shadow-md flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            id="map-recenter-btn"
            onClick={handleResetView}
            className="w-10 h-10 rounded-2xl bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-emerald-700 border border-slate-200/90 shadow-md flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
            title="Reset Map View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 5. Bottom Legend Bar */}
        <div className="absolute bottom-4 left-4 p-2 sm:p-2.5 rounded-2xl bg-white/95 border border-slate-200/90 backdrop-blur-md shadow-md z-30 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
            <span>{lang === 'th' ? 'เหนือ' : lang === 'zh' ? '北' : 'North'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
            <span>{lang === 'th' ? 'กลาง' : lang === 'zh' ? '中' : 'Central'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs"></span>
            <span>{lang === 'th' ? 'อีสาน' : lang === 'zh' ? '东北' : 'Isan'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs"></span>
            <span>{lang === 'th' ? 'ออก' : lang === 'zh' ? '东' : 'East'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs"></span>
            <span>{lang === 'th' ? 'ใต้' : lang === 'zh' ? '南' : 'South'}</span>
          </div>
        </div>

        {/* 6. Active Hovered Province Info Bar */}
        {hoveredProvince && (
          <div className="absolute top-4 left-4 pointer-events-none z-30 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-xs text-white text-xs font-bold shadow-md flex items-center gap-1.5 animate-in fade-in duration-150">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {lang === 'th' 
                ? hoveredProvince.nameObj.th 
                : lang === 'zh' 
                ? hoveredProvince.nameObj.zh 
                : hoveredProvince.nameObj.en}
            </span>
          </div>
        )}

      </div>

      {/* ────────── RIGHT COLUMN: Selected Destination Card ────────── */}
      <div 
        id="selected-destination-sidebar"
        className="w-full lg:w-[360px] xl:w-[390px] p-6 bg-white border-t lg:border-t-0 lg:border-l border-slate-200/90 flex flex-col justify-between gap-6"
      >
        {selectedPlace ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Header / Sub-title */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Selected Destination</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
                ID #{selectedPlace.id}
              </span>
            </div>

            {/* Destination Image with Badges */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group">
              <img
                src={selectedPlace.images[0] || 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80'}
                alt={getLocalized(selectedPlace.name)}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* Category Pill */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-[11px] font-extrabold text-emerald-800 border border-slate-200 shadow-sm backdrop-blur-xs">
                {getLocalized(selectedPlace.category)}
              </div>

              {/* Rating Pill */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-xs font-bold backdrop-blur-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{selectedPlace.rating.toFixed(1)}</span>
                <span className="text-[10px] text-slate-300 font-normal">({selectedPlace.reviewCount})</span>
              </div>
            </div>

            {/* Destination Text Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <MapPin className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{getLocalized(selectedPlace.province)} • {getLocalized(selectedPlace.region)}</span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {getLocalized(selectedPlace.name)}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                {getLocalized(selectedPlace.description)}
              </p>
            </div>

            {/* Quick Metadata Box */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'th' ? 'เวลาทำการ' : lang === 'zh' ? '开放时间' : 'Opening Hours'}</p>
                <p className="font-semibold text-slate-800 truncate">{selectedPlace.hours || '08:30 - 17:00'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'th' ? 'ค่าเข้าชม' : lang === 'zh' ? '参考票价' : 'Admission'}</p>
                <p className="font-semibold text-slate-800 truncate">{getLocalized(selectedPlace.price) || 'Free'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <button
                id="map-view-details-btn"
                onClick={() => onSelectPlace(selectedPlace.id)}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{lang === 'th' ? 'ดูรายละเอียดและรีวิว' : lang === 'zh' ? '查看详情与评价' : 'View Full Details & Reviews'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <a
                href={selectedPlace.location?.map_url || `https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200 text-slate-700 hover:text-emerald-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </a>
            </div>

          </div>
        ) : (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <Compass className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                {lang === 'th' ? 'เลือกสถานที่บนแผนที่' : lang === 'zh' ? '在地图上选择景点' : 'Select a Destination'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                {lang === 'th'
                  ? 'คลิกที่หมุดหรือจังหวัดบนแผนที่ประเทศไทย เพื่อดูรายละเอียดพิกัด ภาพถ่าย และข้อมูลการท่องเที่ยว'
                  : lang === 'zh'
                  ? '点击泰国地图上的地标或省份，即可快速预览景点详情、实景图集与旅游指南。'
                  : 'Click on any destination pin or province on the Thailand map to preview photos, ratings, and travel info.'}
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
