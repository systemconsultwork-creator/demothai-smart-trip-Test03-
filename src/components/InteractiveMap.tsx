import React, { useState } from 'react';
import { Place } from '../types';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, Star, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface InteractiveMapProps {
  places: Place[];
  onSelectPlace: (id: number) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ places, onSelectPlace }) => {
  const { getLocalized, lang } = useApp();
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Thailand Lat/Lng Bounding Box approx:
  // Lat: 5.6 to 20.5 (height ~ 15 deg)
  // Lng: 97.3 to 105.7 (width ~ 8.4 deg)
  const minLat = 5.5;
  const maxLat = 20.6;
  const minLng = 97.0;
  const maxLng = 105.9;

  // Project lat/lng to SVG percentage (0 to 100)
  const projectX = (lng: number) => {
    return ((lng - minLng) / (maxLng - minLng)) * 80 + 10;
  };

  const projectY = (lat: number) => {
    // Latitude inverted for SVG Y-axis
    return (1 - (lat - minLat) / (maxLat - minLat)) * 80 + 10;
  };

  const regionPinColors: Record<string, string> = {
    north: 'bg-emerald-500 border-white text-white',
    central: 'bg-teal-600 border-white text-white',
    northeast: 'bg-amber-500 border-white text-white',
    south: 'bg-sky-500 border-white text-white',
  };

  return (
    <div className="relative w-full h-[600px] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md flex flex-col md:flex-row">
      
      {/* Map Canvas / SVG Area */}
      <div className="relative flex-1 h-full bg-slate-50 overflow-hidden p-6 flex items-center justify-center">
        
        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />

        {/* Map Stage */}
        <div 
          className="relative w-full h-full max-w-[500px] max-h-[550px] transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Thailand Outline Silhouette Art */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full opacity-40 drop-shadow-sm fill-slate-200 stroke-slate-300 stroke-[0.4]"
          >
            {/* North */}
            <path d="M 28,12 Q 35,8 45,10 Q 52,14 48,25 Q 40,30 35,32 Q 25,28 25,18 Z" />
            {/* Northeast */}
            <path d="M 48,25 Q 65,22 80,32 Q 82,45 68,52 Q 50,52 45,35 Z" />
            {/* Central */}
            <path d="M 35,32 Q 45,35 48,48 Q 45,58 38,58 Q 30,52 32,38 Z" />
            {/* South */}
            <path d="M 35,58 Q 42,65 38,78 Q 42,92 38,96 Q 30,90 32,75 Q 30,62 35,58 Z" />
          </svg>

          {/* Place Pins */}
          {places.slice(0, 100).map((place) => {
            const x = projectX(place.lng);
            const y = projectY(place.lat);
            const isHovered = hoveredPlace?.id === place.id;
            const colorClass = regionPinColors[place.regionId] || 'bg-emerald-600 text-white';

            return (
              <div
                key={place.id}
                style={{ left: `${x}%`, top: `${y}%` }}
                onMouseEnter={() => setHoveredPlace(place)}
                onClick={() => onSelectPlace(place.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 shadow-md transition-transform duration-200 group-hover:scale-150 ${colorClass} ${isHovered ? 'scale-150 ring-4 ring-emerald-500/30' : ''}`} />
              </div>
            );
          })}
        </div>

        {/* Zoom & Control Tools */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2))}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-white/95 border border-slate-200 text-xs backdrop-blur-md flex flex-wrap items-center gap-3 shadow-sm z-20">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-700 font-medium">{lang === 'th' ? 'ภาคเหนือ' : lang === 'zh' ? '泰北' : 'North'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <span className="text-slate-700 font-medium">{lang === 'th' ? 'ภาคกลาง' : lang === 'zh' ? '中部' : 'Central'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-700 font-medium">{lang === 'th' ? 'อีสาน' : lang === 'zh' ? '东北' : 'Northeast'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span className="text-slate-700 font-medium">{lang === 'th' ? 'ภาคใต้' : lang === 'zh' ? '泰南' : 'South'}</span>
          </div>
        </div>
      </div>

      {/* Sidebar Place Detail Hover Card */}
      <div className="w-full md:w-80 p-5 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-between">
        {hoveredPlace ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={hoveredPlace.images[0] || 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80'}
                alt={getLocalized(hoveredPlace.name)}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-white/90 text-[10px] font-bold text-emerald-800 border border-slate-200 shadow-xs backdrop-blur-xs">
                {getLocalized(hoveredPlace.category)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>{getLocalized(hoveredPlace.province)}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900">{getLocalized(hoveredPlace.name)}</h4>
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                {getLocalized(hoveredPlace.description)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{hoveredPlace.rating.toFixed(1)}</span>
              </div>
              <button
                onClick={() => onSelectPlace(hoveredPlace.id)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                {lang === 'th' ? 'ดูรายละเอียด' : lang === 'zh' ? '查看详情' : 'View Details'}
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
            <Navigation className="w-8 h-8 text-emerald-600/50 stroke-1" />
            <p className="text-xs">
              {lang === 'th'
                ? 'เลื่อนเมาส์เหนือหมุดบนแผนที่เพื่อดูข้อมูลสถานที่อย่างรวดเร็ว'
                : lang === 'zh'
                ? '悬停地图上的图钉以快速预览景点信息'
                : 'Hover over map pins to preview destination details'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
