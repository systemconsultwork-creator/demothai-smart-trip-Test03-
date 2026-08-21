import React from 'react';
import { Place } from '../types';
import { useApp } from '../context/AppContext';
import { Star, Heart, MapPin, Clock, Tag } from 'lucide-react';
import { motion } from 'motion/react';

interface PlaceCardProps {
  place: Place;
  priority?: boolean;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  const { getLocalized, setSelectedPlaceId, favorites, toggleFavorite, lang } = useApp();
  const isFav = favorites.includes(place.id);

  const regionColorMap: Record<string, string> = {
    north: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    central: 'bg-amber-50 text-amber-900 border-amber-200 font-semibold',
    northeast: 'bg-orange-50 text-orange-900 border-orange-200 font-semibold',
    south: 'bg-cyan-50 text-cyan-900 border-cyan-200 font-semibold',
  };

  const getRegionName = (regId: string) => {
    switch (regId) {
      case 'north': return lang === 'th' ? 'ภาคเหนือ' : lang === 'zh' ? '泰北' : 'North';
      case 'central': return lang === 'th' ? 'ภาคกลาง' : lang === 'zh' ? '中部' : 'Central';
      case 'northeast': return lang === 'th' ? 'อีสาน' : lang === 'zh' ? '东北' : 'Isan';
      case 'south': return lang === 'th' ? 'ภาคใต้' : lang === 'zh' ? '泰南' : 'South';
      default: return getLocalized(place.region);
    }
  };

  const fallbackImage = 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80';
  const imgUrl = (place.images && place.images.length > 0) ? place.images[0] : fallbackImage;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={() => setSelectedPlaceId(place.id)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-xl cursor-pointer flex flex-col transition-all duration-300"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={imgUrl}
          alt={getLocalized(place.name)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

        {/* Region & Category Pills */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
          <span className={`text-[11px] px-2.5 py-0.8 rounded-full border shadow-xs backdrop-blur-md ${regionColorMap[place.regionId] || 'bg-white/90 text-slate-800 border-slate-200'}`}>
            {getRegionName(place.regionId)}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.8 rounded-full bg-white/95 text-slate-700 border border-slate-200 shadow-xs backdrop-blur-md">
            {getLocalized(place.category)}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(place.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 z-10 shadow-sm ${
            isFav
              ? 'bg-rose-500 text-white shadow-rose-500/30'
              : 'bg-white/90 text-slate-600 hover:text-rose-600 hover:bg-white border border-slate-200'
          }`}
          aria-label="Save to favorites"
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-white stroke-white' : ''}`} />
        </button>

        {/* Rating overlay badge */}
        <div className="absolute bottom-2.5 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 border border-slate-200/90 text-slate-900 text-xs font-bold shadow-sm backdrop-blur-md">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{place.rating.toFixed(1)}</span>
          <span className="text-[10px] text-slate-500 font-normal">({place.reviewCount})</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Province & Place Name */}
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{getLocalized(place.province)}</span>
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {getLocalized(place.name)}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
            {getLocalized(place.description)}
          </p>
        </div>

        {/* Footer Details: Fee & Hours */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-[11px] truncate max-w-[55%]">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{place.hours}</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-800 truncate max-w-[42%] text-right">
            {getLocalized(place.price)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
