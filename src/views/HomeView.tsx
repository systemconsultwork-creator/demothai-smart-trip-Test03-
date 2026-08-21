import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Place, Category } from '../types';
import { PlaceCard } from '../components/PlaceCard';
import { 
  Search, 
  Compass, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Mountain, 
  Waves, 
  Landmark, 
  ShoppingBag, 
  TreePine, 
  Users, 
  Star,
  ShieldCheck,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';

export const HomeView: React.FC = () => {
  const { 
    t, 
    lang, 
    getLocalized, 
    setCurrentView, 
    setActiveCategory, 
    setActiveRegion, 
    setSearchQuery, 
    quickSearch 
  } = useApp();

  const [searchInput, setSearchInput] = useState('');
  const [popularPlaces, setPopularPlaces] = useState<Place[]>([]);
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getPlaces({ popular: true, limit: 6 }),
      api.getPlaces({ recommended: true, limit: 4 }),
      api.getCategories()
    ])
      .then(([pop, rec, cats]) => {
        setPopularPlaces(pop.places);
        setRecommendedPlaces(rec.places);
        setCategories(cats);
      })
      .catch(err => console.error('Failed to load home data', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      quickSearch(searchInput.trim());
    } else {
      setCurrentView('discover');
    }
  };

  const categoryIcons: Record<string, any> = {
    nature: Mountain,
    temple: Landmark,
    sea: Waves,
    market: ShoppingBag,
    history: Landmark,
    lifestyle: Users,
  };

  const regions = [
    {
      id: 'north',
      name: { th: 'ภาคเหนือ', en: 'Northern Thailand', zh: '泰国北部' },
      placesCount: 50,
      description: {
        th: 'ดินแดนแห่งขุนเขา ทะเลหมอก วัฒนธรรมล้านนา และยอดดอยสูงสุดในสยาม',
        en: 'Mist-shrouded mountain peaks, rich Lanna heritage, and ancient teak temples.',
        zh: '云雾缭绕的高山峻岭、悠久兰纳历史与壮阔自然茶园。'
      },
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      gradient: 'from-emerald-900/80 to-slate-950'
    },
    {
      id: 'central',
      name: { th: 'ภาคกลาง & ตะวันออก', en: 'Central & Eastern', zh: '泰国中部与东部' },
      placesCount: 50,
      description: {
        th: 'อารยธรรมกรุงรัตนโกสินทร์ โบราณสถานอยุธยา มหานครกรุงเทพฯ และชายหาดพัทยา',
        en: 'Royal Grand Palace, ancient Ayutthaya capitals, and vibrant Gulf beaches.',
        zh: '大皇宫皇家气派、大城府世界文化遗产与曼谷都会风情。'
      },
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      gradient: 'from-amber-900/80 to-slate-950'
    },
    {
      id: 'northeast',
      name: { th: 'ภาคตะวันออกเฉียงเหนือ (อีสาน)', en: 'Northeastern (Isan)', zh: '泰国东北部（伊森）' },
      placesCount: 50,
      description: {
        th: 'มหาพุทธศิลป์ ถ้ำนาคา ปราสาทหินขอมพันปี และวิถีริมฝั่งโขงอันเงียบสงบ',
        en: 'Prehistoric wonders, Naga caves, thousand-year Khmer sanctuaries, and Mekong tranquility.',
        zh: '神奇娜迦神龙洞、千年高棉石宫与宁静湄公河畔原生态文化。'
      },
      image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
      gradient: 'from-orange-900/80 to-slate-950'
    },
    {
      id: 'south',
      name: { th: 'ภาคใต้', en: 'Southern Thailand', zh: '泰国南部' },
      placesCount: 50,
      description: {
        th: 'สวรรค์ทะเลสองฝั่ง อ่าวไทยและอันดามัน ปะการังน้ำใส และเกาะระดับโลก',
        en: 'Two-ocean tropical paradise: Similan reefs, Maya Bay, and azure emerald lagoons.',
        zh: '双海热带天堂：斯米兰世界潜水胜地、玛雅湾与清澈果冻海。'
      },
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      gradient: 'from-cyan-900/80 to-slate-950'
    },
  ];

  return (
    <div id="home-view" className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative min-h-[580px] sm:min-h-[640px] flex items-center justify-center overflow-hidden rounded-b-[40px] border-b border-slate-200 bg-slate-900 shadow-sm">
        
        {/* Background Image & Cinematic Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=2000&q=80"
            alt="Thailand Travel Hero"
            className="w-full h-full object-cover opacity-75 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-slate-900/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-7 py-12">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs sm:text-sm font-semibold backdrop-blur-md shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>200 Verified Destinations • 4 Regions • Trilingual Guide</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-sm"
          >
            {t('hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-slate-100 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-xs"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Search Box */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl sm:rounded-full bg-white border border-slate-200 shadow-2xl"
          >
            <div className="flex items-center gap-3 px-4 py-2 w-full">
              <Search className="w-5 h-5 text-emerald-600 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('hero.search_placeholder')}
                className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-md transition-all shrink-0"
            >
              {t('hero.search_button')}
            </button>
          </motion.form>

          {/* Quick Search Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-2 text-xs"
          >
            <span className="text-white/90 font-semibold drop-shadow-xs">{t('hero.popular_tags')}</span>
            {['ดอยอินทนนท์', 'วัดพระแก้ว', 'อ่าวมาหยา', 'ถ้ำนาคา', 'เกาะหลีเป๊ะ', 'เมืองเก่าสงขลา'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => quickSearch(tag)}
                className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-white/80 hover:border-emerald-300 shadow-sm backdrop-blur-md transition-colors font-medium"
              >
                {tag}
              </button>
            ))}
          </motion.div>

        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
          <div className="text-center p-3 border-r border-slate-100 last:border-r-0">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-700">200</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{t('home.total_places')}</p>
          </div>
          <div className="text-center p-3 border-r border-slate-100 last:border-r-0">
            <p className="text-3xl sm:text-4xl font-extrabold text-teal-600">4</p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {lang === 'th' ? 'ภูมิภาคครอบคลุม' : lang === 'zh' ? '全泰四大区域' : 'Major Regions'}
            </p>
          </div>
          <div className="text-center p-3 border-r border-slate-100 last:border-r-0">
            <p className="text-3xl sm:text-4xl font-extrabold text-amber-500">77</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{t('home.provinces_count')}</p>
          </div>
          <div className="text-center p-3">
            <p className="text-3xl sm:text-4xl font-extrabold text-rose-500">100%</p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {lang === 'th' ? 'พิกัด GPS แม่นยำ' : lang === 'zh' ? 'GPS精准校验' : 'Verified Coordinates'}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Categories</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {t('home.categories_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('home.categories_subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat.id] || Compass;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setCurrentView('discover');
                  window.scrollTo(0, 0);
                }}
                className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all text-left flex flex-col justify-between h-36"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {getLocalized(cat.name)}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {cat.count || 30}+ {lang === 'th' ? 'แห่ง' : lang === 'zh' ? '处' : 'places'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Popular Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Must Visit</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {t('home.popular_destinations')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('home.popular_subtitle')}
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentView('discover');
              window.scrollTo(0, 0);
            }}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>{t('home.view_all')} (200)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>

        <div className="text-center sm:hidden pt-4">
          <button
            onClick={() => {
              setCurrentView('discover');
              window.scrollTo(0, 0);
            }}
            className="w-full py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-2 shadow-xs"
          >
            <span>{t('home.view_all')} (200)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4 Regions Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Geographic Portal</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {t('home.regions_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('home.regions_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {regions.map((reg) => (
            <div
              key={reg.id}
              onClick={() => {
                setActiveRegion(reg.id);
                setCurrentView('discover');
                window.scrollTo(0, 0);
              }}
              className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer border border-slate-200 hover:border-emerald-400 shadow-md hover:shadow-xl flex flex-col justify-end p-6 transition-all"
            >
              <img
                src={reg.image || 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80'}
                alt={getLocalized(reg.name)}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80';
                }}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${reg.gradient}`} />

              <div className="relative z-10 space-y-2">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold shadow-xs">
                  {reg.placesCount} {lang === 'th' ? 'สถานที่' : lang === 'zh' ? '个景点' : 'places'}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  {getLocalized(reg.name)}
                </h3>
                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                  {getLocalized(reg.description)}
                </p>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-300 pt-1">
                  <span>{lang === 'th' ? 'สำรวจภาคนี้' : lang === 'zh' ? '探索本区域' : 'Explore Region'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Unseen Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Unseen Thailand</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {t('home.recommended_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('home.recommended_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recommendedPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>

      {/* Community Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 border border-emerald-700/50 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl text-white">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Community Co-Creation</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              {lang === 'th' 
                ? 'ค้นพบที่เที่ยวใหม่ที่ยังไม่มีในระบบ?' 
                : lang === 'zh'
                ? '发现了尚未收录的宝藏小众秘境？'
                : 'Discovered a hidden gem not yet in our guide?'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {lang === 'th'
                ? 'ร่วมเป็นส่วนหนึ่งในการส่งเสริมการท่องเที่ยวไทย ส่งข้อมูลสถานที่ท่องเที่ยวเพื่อให้แอดมินตรวจสอบและเผยแพร่สู่สายตาโลก'
                : lang === 'zh'
                ? '推荐您心中的绝美小众打卡地，经审核后将收录上线，与全球旅行爱好者共享！'
                : 'Submit your travel recommendations to our editorial admin team and share unseen wonders with the world.'}
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentView('submit_place');
              window.scrollTo(0, 0);
            }}
            className="px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow-xl transition-all shrink-0"
          >
            {t('nav.submit_place')}
          </button>
        </div>
      </section>

    </div>
  );
};
