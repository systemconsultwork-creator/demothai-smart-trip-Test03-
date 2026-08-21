import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Place, Category, ProvinceItem } from '../types';
import { PlaceCard } from '../components/PlaceCard';
import { InteractiveMap } from '../components/InteractiveMap';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  LayoutGrid, 
  Map as MapIcon, 
  X, 
  SlidersHorizontal, 
  Compass,
  ArrowUpDown
} from 'lucide-react';

export const DiscoverView: React.FC = () => {
  const { 
    t, 
    lang, 
    getLocalized, 
    activeCategory, 
    setActiveCategory, 
    activeRegion, 
    setActiveRegion, 
    searchQuery, 
    setSearchQuery,
    setSelectedPlaceId
  } = useApp();

  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'name'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(24);

  // Load Categories & Provinces once
  useEffect(() => {
    Promise.all([
      api.getCategories(),
      api.getProvinces()
    ])
      .then(([cats, provs]) => {
        setCategories(cats);
        setProvinces(provs);
      })
      .catch(err => console.error('Failed to load filter metadata', err));
  }, []);

  // Fetch places on filter changes
  useEffect(() => {
    setLoading(true);
    api.getPlaces({
      q: searchQuery,
      category: activeCategory,
      region: activeRegion,
      province: selectedProvince,
      minRating: minRating,
      sort: sortBy
    })
      .then(res => {
        setPlaces(res.places);
        setDisplayCount(24);
      })
      .catch(err => console.error('Failed to query places', err))
      .finally(() => setLoading(false));
  }, [searchQuery, activeCategory, activeRegion, selectedProvince, minRating, sortBy]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setActiveRegion('all');
    setSelectedProvince('all');
    setMinRating(undefined);
    setSortBy('popular');
  };

  const filteredProvinces = provinces.filter(p => {
    if (activeRegion === 'all') return true;
    return p.regionId === activeRegion;
  });

  const regions = [
    { id: 'all', label: { th: 'ทุกภูมิภาค (200)', en: 'All Regions (200)', zh: '全部区域 (200)' } },
    { id: 'north', label: { th: 'ภาคเหนือ (50)', en: 'North (50)', zh: '泰北 (50)' } },
    { id: 'central', label: { th: 'ภาคกลาง & ตะวันออก (50)', en: 'Central (50)', zh: '中部 (50)' } },
    { id: 'northeast', label: { th: 'ภาคอีสาน (50)', en: 'Isan (50)', zh: '东北 (50)' } },
    { id: 'south', label: { th: 'ภาคใต้ (50)', en: 'South (50)', zh: '泰南 (50)' } },
  ];

  const hasActiveFilters = searchQuery || activeCategory !== 'all' || activeRegion !== 'all' || selectedProvince !== 'all' || minRating;

  return (
    <div id="discover-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Database Directory</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            {t('search.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'th' 
              ? 'รวบรวม 200 สถานที่ท่องเที่ยวชั้นนำ พร้อมฟิลเตอร์อัจฉริยะตามภาค หมวดหมู่ และคะแนน'
              : lang === 'zh'
              ? '收录泰国全境200处高分景点，支持按区域、主题、府治和星级精准智能筛选。'
              : 'Browse all 200 verified attractions with smart filtering by region, category, province, and rating.'}
          </p>
        </div>

        {/* View Switcher: Grid vs Map */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t('search.view_grid')}</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>{t('search.view_map')}</span>
          </button>
        </div>
      </div>

      {/* Filter Control Center */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        
        {/* Row 1: Search Bar & Sort Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-emerald-600 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('hero.search_placeholder')}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-10 pr-8 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white appearance-none cursor-pointer"
              >
                <option value="popular">{t('search.sort_popular')}</option>
                <option value="rating">{t('search.sort_rating')}</option>
                <option value="name">{t('search.sort_name')}</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3.5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold whitespace-nowrap transition-colors"
                title="Clear all filters"
              >
                {t('search.clear_filters')}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Region Tabs */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {t('search.filter_region')}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {regions.map((reg) => (
              <button
                key={reg.id}
                onClick={() => {
                  setActiveRegion(reg.id);
                  setSelectedProvince('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeRegion === reg.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {getLocalized(reg.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Category Pills & Province Dropdown & Min Rating */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t('search.filter_all')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {getLocalized(cat.name)}
              </button>
            ))}
          </div>

          {/* Secondary Controls: Province & Rating */}
          <div className="flex items-center gap-2.5">
            {/* Province Select */}
            <div className="relative">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
              >
                <option value="all">
                  {lang === 'th' ? 'ทุกจังหวัด' : lang === 'zh' ? '全部府治' : 'All Provinces'}
                </option>
                {filteredProvinces.map((prov) => (
                  <option key={prov.id} value={prov.name.th}>
                    {getLocalized(prov.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* 4.8+ Stars Toggle */}
            <button
              onClick={() => setMinRating(minRating ? undefined : 4.8)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                minRating
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${minRating ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>4.8+ Stars</span>
            </button>
          </div>

        </div>

      </div>

      {/* Results Header Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="font-semibold text-slate-800">
          {t('search.found_places', { count: places.length })}
        </span>
        <span>
          Showing {Math.min(displayCount, places.length)} of {places.length}
        </span>
      </div>

      {/* Main View Area (Cards Grid OR Interactive Map) */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading destination directory...</p>
        </div>
      ) : places.length === 0 ? (
        <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <Compass className="w-12 h-12 text-emerald-600/70 mx-auto stroke-1" />
          <h3 className="text-lg font-bold text-slate-900">{t('search.no_results_title')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t('search.no_results_desc')}</p>
          <button
            onClick={clearAllFilters}
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs"
          >
            {t('search.clear_filters')}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {places.slice(0, displayCount).map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>

          {displayCount < places.length && (
            <div className="text-center pt-4">
              <button
                onClick={() => setDisplayCount(prev => prev + 24)}
                className="px-8 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-300 shadow-sm transition-all"
              >
                Load More Places (+24)
              </button>
            </div>
          )}
        </div>
      ) : (
        <InteractiveMap places={places} onSelectPlace={(id) => setSelectedPlaceId(id)} />
      )}

    </div>
  );
};
