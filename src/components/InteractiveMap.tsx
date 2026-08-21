import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Place } from '../types';
import { useApp } from '../context/AppContext';
import { geoMercator } from 'd3-geo';
import { THAILAND_MAP_PROJECTION, THAILAND_PROVINCES } from '../data/thailandMapData';
import { Star, ZoomIn, ZoomOut, RotateCcw, ExternalLink, ChevronRight, Sparkles, Compass, MapPin } from 'lucide-react';

interface InteractiveMapProps { places: Place[]; onSelectPlace: (id: number) => void; }

const projection = geoMercator().scale(THAILAND_MAP_PROJECTION.scale).translate(THAILAND_MAP_PROJECTION.translate);
export const projectGeoToSvg = (lat: number, lng: number): { x: number; y: number } => {
  const coords = projection([lng, lat]);
  if (!coords) return { x: 300, y: 500 };
  return { x: coords[0], y: coords[1] };
};

export const REGION_STYLES: Record<string, { name: { th: string; en: string; zh: string }; color: string; fill: string; border: string; badgeBg: string; text: string; centroid: { x: number; y: number } }> = {
  north: { name: { th: 'ภาคเหนือ', en: 'Northern Thailand', zh: '泰国北部' }, color: '#059669', fill: '#A7F3D0', border: '#059669', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'text-emerald-700', centroid: { x: 160, y: 190 } },
  central: { name: { th: 'ภาคกลาง', en: 'Central Thailand', zh: '泰国中部' }, color: '#D97706', fill: '#FDE68A', border: '#D97706', badgeBg: 'bg-amber-50 text-amber-900 border-amber-200', text: 'text-amber-700', centroid: { x: 235, y: 490 } },
  northeast: { name: { th: 'ภาคอีสาน', en: 'Northeastern (Isan)', zh: '泰东北 (伊森)' }, color: '#EA580C', fill: '#FED7AA', border: '#EA580C', badgeBg: 'bg-orange-50 text-orange-900 border-orange-200', text: 'text-orange-700', centroid: { x: 440, y: 360 } },
  east: { name: { th: 'ภาคตะวันออก', en: 'Eastern Thailand', zh: '泰国东部' }, color: '#9333EA', fill: '#E9D5FF', border: '#9333EA', badgeBg: 'bg-purple-50 text-purple-900 border-purple-200', text: 'text-purple-700', centroid: { x: 330, y: 580 } },
  south: { name: { th: 'ภาคใต้', en: 'Southern Thailand', zh: '泰国南部' }, color: '#0284C7', fill: '#BAE6FD', border: '#0284C7', badgeBg: 'bg-sky-50 text-sky-900 border-sky-200', text: 'text-sky-700', centroid: { x: 175, y: 880 } }
};
interface Cluster { id: string; x: number; y: number; places: Place[]; regionId: string; }
type MappedPlace = Place & { svgX: number; svgY: number; effectiveRegion: string };

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ places, onSelectPlace }) => {
  const { getLocalized, lang, activeRegion, setActiveRegion } = useApp();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    if (places.length > 0) {
      if (!selectedPlace || !places.some(p => p.id === selectedPlace.id)) setSelectedPlace(places[0]);
    } else setSelectedPlace(null);
  }, [places]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { north: 0, central: 0, northeast: 0, east: 0, south: 0 };
    places.forEach(p => {
      const province = (p.province?.en || '').toLowerCase();
      const east = ['chonburi','rayong','trat','chanthaburi','chachoengsao','sa kaeo','prachinburi'].some(v => province.includes(v));
      if (p.regionId === 'north') counts.north++; else if (p.regionId === 'northeast') counts.northeast++; else if (p.regionId === 'south') counts.south++; else if (east) counts.east++; else counts.central++;
    });
    return counts;
  }, [places]);

  const handleMarkerClick = (place: Place, e?: React.MouseEvent) => { e?.stopPropagation(); if (hasDraggedRef.current) return; setSelectedPlace(place); };
  const handleResetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); if (activeRegion !== 'all') setActiveRegion('all'); };

  // Wheel zoom is exclusive to the map viewport. Page scrolling is blocked here.
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomDelta = -e.deltaY * 0.0015;
    setZoom(prev => Math.min(Math.max(prev + zoomDelta, 0.8), 3.2));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    hasDraggedRef.current = false;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) >= 5) hasDraggedRef.current = true;
    setPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy });
  };
  const handleMouseUp = () => setIsDragging(false);

  // Touch/trackpad gesture lock: touching the map never scrolls the page.
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    hasDraggedRef.current = false;
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY, panX: pan.x, panY: pan.y };
    e.preventDefault();
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) >= 5) hasDraggedRef.current = true;
    setPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy });
    e.preventDefault();
  };
  const handleTouchEnd = () => setIsDragging(false);

  const handleRegionClick = (regId: string) => {
    if (activeRegion === regId || (regId === 'east' && activeRegion === 'central')) setActiveRegion('all');
    else setActiveRegion(regId === 'east' ? 'central' : regId);
  };

  const mappedPlaces = useMemo<MappedPlace[]>(() => places.map(place => {
    const { x, y } = projectGeoToSvg(place.lat, place.lng);
    const province = (place.province?.en || '').toLowerCase();
    const east = ['chonburi','rayong','trat','chanthaburi'].some(v => province.includes(v));
    return { ...place, svgX: x, svgY: y, effectiveRegion: east ? 'east' : place.regionId };
  }), [places]);

  const { clusters, singleMarkers } = useMemo(() => {
    if (zoom >= 1.4) return { clusters: [] as Cluster[], singleMarkers: mappedPlaces };
    const distance = zoom <= 1 ? 16 : 10;
    const clusterList: Cluster[] = [], singles: MappedPlace[] = [];
    const used = new Set<number>();
    for (let i = 0; i < mappedPlaces.length; i++) {
      const p1 = mappedPlaces[i]; if (used.has(p1.id)) continue;
      const group: MappedPlace[] = [p1];
      for (let j = i + 1; j < mappedPlaces.length; j++) {
        const p2 = mappedPlaces[j]; if (used.has(p2.id)) continue;
        if (Math.hypot(p1.svgX - p2.svgX, p1.svgY - p2.svgY) < distance) { group.push(p2); used.add(p2.id); }
      }
      if (group.length > 1) {
        used.add(p1.id);
        clusterList.push({ id: `cluster-${p1.id}`, x: group.reduce((a,p) => a + p.svgX, 0) / group.length, y: group.reduce((a,p) => a + p.svgY, 0) / group.length, places: group, regionId: p1.effectiveRegion });
      } else singles.push(p1);
    }
    return { clusters: clusterList, singleMarkers: singles };
  }, [mappedPlaces, zoom]);

  const visibleClusters = useMemo(() => activeRegion === 'all' ? clusters : clusters.filter(c => c.regionId === activeRegion || (activeRegion === 'central' && c.regionId === 'east')), [clusters, activeRegion]);
  const visibleSingleMarkers = useMemo(() => activeRegion === 'all' ? singleMarkers : singleMarkers.filter(p => p.effectiveRegion === activeRegion || (activeRegion === 'central' && p.effectiveRegion === 'east')), [singleMarkers, activeRegion]);

  return (
    <div id="thailand-interactive-map-section" className="relative w-full rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden flex flex-col lg:flex-row">
      <div
        className={`relative flex-1 min-h-[580px] sm:min-h-[660px] lg:min-h-[740px] bg-gradient-to-b from-[#F0F9FF] via-[#E6F4FA] to-[#DCF0F7] overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ overscrollBehavior: 'contain', touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center will-change-transform" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center' }}>
          <svg viewBox={`0 0 ${THAILAND_MAP_PROJECTION.width} ${THAILAND_MAP_PROJECTION.height}`} className="w-[360px] sm:w-[440px] md:w-[490px] lg:w-[530px] h-auto overflow-visible" style={{ maxHeight: '94%' }}>
            <defs><filter id="thailand-coastal-relief" x="-8%" y="-8%" width="120%" height="120%"><feDropShadow dx="2" dy="5" stdDeviation="6" floodColor="#0F766E" floodOpacity="0.12" /><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.08" /></filter></defs>
            <g id="static-thailand-provinces-layer" filter="url(#thailand-coastal-relief)" pointerEvents="none" className="pointer-events-none select-none">
              {THAILAND_PROVINCES.map(prov => { const style = REGION_STYLES[prov.region] || REGION_STYLES.central; return <path key={prov.name} d={prov.path} fill={style.fill} stroke="#FFFFFF" strokeWidth="0.75" strokeLinejoin="round" strokeLinecap="round" opacity={1} pointerEvents="none" />; })}
            </g>
            <g id="interactive-destination-markers-layer" pointerEvents="auto">
              {visibleClusters.map(cluster => { const style = REGION_STYLES[cluster.regionId] || REGION_STYLES.central; return <g key={cluster.id} transform={`translate(${cluster.x}, ${cluster.y})`} className="cursor-pointer" onClick={e => { e.stopPropagation(); if (hasDraggedRef.current) return; if (cluster.places.length) setSelectedPlace(cluster.places[0]); }}><circle r="13" fill="transparent" /><circle r="11" fill={style.color} stroke="#FFFFFF" strokeWidth="2" pointerEvents="none" /><text textAnchor="middle" dy="3.5" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="sans-serif" pointerEvents="none">{cluster.places.length}</text></g>; })}
              {visibleSingleMarkers.map(place => { const isSelected = selectedPlace?.id === place.id; const isHovered = hoveredPlace?.id === place.id; const style = REGION_STYLES[place.effectiveRegion] || REGION_STYLES.central; return <g key={place.id} transform={`translate(${place.svgX}, ${place.svgY})`} className="cursor-pointer" onClick={e => handleMarkerClick(place, e)} onMouseEnter={() => setHoveredPlace(place)} onMouseLeave={() => setHoveredPlace(null)}><circle r="14" fill="transparent" />{isSelected && <circle r="12" fill="none" stroke={style.color} strokeWidth="2" strokeDasharray="3 2" pointerEvents="none" />}<circle r={isSelected ? 7 : 5.5} fill={style.color} stroke="#FFFFFF" strokeWidth={isSelected ? 2.5 : 1.5} pointerEvents="none" /><circle r={isSelected ? 2.5 : 1.8} fill="#FFFFFF" pointerEvents="none" />{(isHovered || isSelected) && <g transform="translate(0, -16)" pointerEvents="none" className="select-none"><rect x={-Math.min(getLocalized(place.name).length * 4.5 + 14, 75)} y="-17" width={Math.min(getLocalized(place.name).length * 9 + 28, 150)} height="20" rx="5" fill="#0F172A" opacity="0.95" /><polygon points="-3,3 3,3 0,7" fill="#0F172A" opacity="0.95" /><text x="0" y="-3.5" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="700" fontFamily="sans-serif">{getLocalized(place.name)}</text></g>}</g>; })}
            </g>
          </svg>
        </div>

        <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-20">
          <div className="flex items-start justify-between gap-2">
            {(['north','northeast'] as const).map(reg => { const style = REGION_STYLES[reg]; return <button key={reg} onClick={() => handleRegionClick(reg)} className="pointer-events-auto flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/95 border border-slate-200/90 shadow-md text-left"><span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: style.color }} /><div><p className="text-[11px] font-black text-slate-900">{lang === 'th' ? style.name.th : lang === 'zh' ? style.name.zh : style.name.en}</p><p className="text-[10px] font-semibold" style={{ color: style.color }}>{regionCounts[reg]} {lang === 'th' ? 'สถานที่' : lang === 'zh' ? '处景点' : 'places'}</p></div></button>; })}
          </div>
          <div className="flex justify-end pr-2 sm:pr-6"><button onClick={() => handleRegionClick('east')} className="pointer-events-auto flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/95 border border-slate-200/90 shadow-md text-left"><span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" /><div><p className="text-[11px] font-black text-slate-900">{lang === 'th' ? 'ภาคตะวันออก' : lang === 'zh' ? '泰国东部' : 'Eastern Thailand'}</p><p className="text-[10px] font-semibold text-purple-700">{regionCounts.east} {lang === 'th' ? 'สถานที่' : lang === 'zh' ? '处景点' : 'places'}</p></div></button></div>
          <div className="flex items-end justify-between gap-2"><button onClick={() => handleRegionClick('south')} className="pointer-events-auto flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/95 border border-slate-200/90 shadow-md text-left"><span className="w-3 h-3 rounded-full bg-sky-500 shrink-0" /><div><p className="text-[11px] font-black text-slate-900">{lang === 'th' ? 'ภาคใต้' : lang === 'zh' ? '泰国南部' : 'Southern Thailand'}</p><p className="text-[10px] font-semibold text-sky-700">{regionCounts.south} {lang === 'th' ? 'สถานที่' : lang === 'zh' ? '处景点' : 'places'}</p></div></button><button onClick={() => handleRegionClick('central')} className="pointer-events-auto flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/95 border border-slate-200/90 shadow-md text-left"><span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" /><div><p className="text-[11px] font-black text-slate-900">{lang === 'th' ? 'ภาคกลาง' : lang === 'zh' ? '泰国中部' : 'Central Thailand'}</p><p className="text-[10px] font-semibold text-amber-700">{regionCounts.central} {lang === 'th' ? 'สถานที่' : lang === 'zh' ? '处景点' : 'places'}</p></div></button></div>
        </div>

        <div className="absolute top-5 right-5 flex flex-col gap-2 z-30 pointer-events-auto">
          <button onClick={() => setZoom(prev => Math.min(prev + 0.35, 3.2))} className="w-10 h-10 rounded-2xl bg-white/95 text-slate-700 border border-slate-200/90 shadow-md flex items-center justify-center" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => setZoom(prev => Math.max(prev - 0.35, 0.8))} className="w-10 h-10 rounded-2xl bg-white/95 text-slate-700 border border-slate-200/90 shadow-md flex items-center justify-center" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
          <button onClick={handleResetView} className="w-10 h-10 rounded-2xl bg-white/95 text-slate-700 border border-slate-200/90 shadow-md flex items-center justify-center" title="Reset Map View"><RotateCcw className="w-4 h-4" /></button>
        </div>
      </div>

      <div id="selected-destination-sidebar" className="w-full lg:w-[360px] xl:w-[390px] p-6 bg-white border-t lg:border-t-0 lg:border-l border-slate-200/90 flex flex-col justify-between gap-6">
        {selectedPlace ? <div className="space-y-5"><div className="flex items-center justify-between"><span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Selected Destination</span><span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">ID #{selectedPlace.id}</span></div><div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm"><img src={selectedPlace.images[0] || 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80'} alt={getLocalized(selectedPlace.name)} className="w-full h-full object-cover" onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80'; }} /><div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-xs font-bold"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><span>{selectedPlace.rating.toFixed(1)}</span><span className="text-[10px] text-slate-300 font-normal">({selectedPlace.reviewCount})</span></div></div><div className="space-y-2"><div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><MapPin className="w-4 h-4" /><span>{getLocalized(selectedPlace.province)} • {getLocalized(selectedPlace.region)}</span></div><h3 className="text-xl font-extrabold text-slate-900">{getLocalized(selectedPlace.name)}</h3><p className="text-xs text-slate-600 leading-relaxed line-clamp-4">{getLocalized(selectedPlace.description)}</p></div><div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs"><div><p className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'th' ? 'เวลาทำการ' : lang === 'zh' ? '开放时间' : 'Opening Hours'}</p><p className="font-semibold text-slate-800 truncate">{selectedPlace.hours || '08:30 - 17:00'}</p></div><div><p className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'th' ? 'ค่าเข้าชม' : lang === 'zh' ? '参考票价' : 'Admission'}</p><p className="font-semibold text-slate-800 truncate">{getLocalized(selectedPlace.price) || 'Free'}</p></div></div><div className="space-y-2.5 pt-2 border-t border-slate-100"><button onClick={() => onSelectPlace(selectedPlace.id)} className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2"><span>{lang === 'th' ? 'ดูรายละเอียดและรีวิว' : lang === 'zh' ? '查看详情与评价' : 'View Full Details & Reviews'}</span><ChevronRight className="w-4 h-4" /></button><a href={selectedPlace.location?.map_url || `https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /><span>Google Maps</span></a></div></div> : <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4"><div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Compass className="w-8 h-8" /></div><div><h4 className="text-sm font-bold text-slate-800">{lang === 'th' ? 'เลือกสถานที่บนแผนที่' : lang === 'zh' ? '在地图上选择景点' : 'Select a Destination'}</h4><p className="text-xs text-slate-500 max-w-xs leading-relaxed">{lang === 'th' ? 'คลิกที่หมุดสถานที่บนแผนที่ประเทศไทย เพื่อดูรายละเอียดพิกัด ภาพถ่าย และข้อมูลการท่องเที่ยว' : lang === 'zh' ? '点击泰国地图上的景点图钉，即可快速预览景点详情、实景图集与旅游指南。' : 'Click on any destination pin on the Thailand map to preview photos, ratings, and travel info.'}</p></div></div>}
      </div>
    </div>
  );
};