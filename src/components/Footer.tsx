import React from 'react';
import { useApp } from '../context/AppContext';
import { Compass, PhoneCall, Globe2, ShieldCheck, Heart, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t, setCurrentView, setActiveRegion, lang } = useApp();

  const handleRegionClick = (reg: string) => {
    setActiveRegion(reg);
    setCurrentView('discover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Description */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Compass className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">Thai Smart Trip</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              {t('footer.about')}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <PhoneCall className="w-4 h-4" />
              <span>{t('footer.contact')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('footer.quick_links')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => { setCurrentView('home'); window.scrollTo(0, 0); }} className="text-slate-600 hover:text-emerald-700 transition-colors">
                  {t('nav.home')}
                </button>
              </li>
              <li>
                <button onClick={() => { setCurrentView('discover'); window.scrollTo(0, 0); }} className="text-slate-600 hover:text-emerald-700 transition-colors">
                  {t('nav.discover')} (200 Places)
                </button>
              </li>
              <li>
                <button onClick={() => { setCurrentView('submit_place'); window.scrollTo(0, 0); }} className="text-slate-600 hover:text-emerald-700 transition-colors">
                  {t('nav.submit_place')}
                </button>
              </li>
              <li>
                <button onClick={() => { setCurrentView('admin'); window.scrollTo(0, 0); }} className="text-slate-600 hover:text-emerald-700 transition-colors">
                  {t('nav.admin')}
                </button>
              </li>
            </ul>
          </div>

          {/* Regional Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('footer.regions')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleRegionClick('north')} className="text-slate-600 hover:text-emerald-700 transition-colors">
                  {lang === 'th' ? 'ภาคเหนือ (50 แห่ง)' : lang === 'zh' ? '泰国北部 (50个景点)' : 'Northern Thailand (50 Places)'}
                </button>
              </li>
              <li>
                <button onClick={() => handleRegionClick('central')} className="text-slate-600 hover:text-emerald-700 transition-colors">
                  {lang === 'th' ? 'ภาคกลาง (50 แห่ง)' : lang === 'zh' ? '泰国中部 (50个景点)' : 'Central Thailand (50 Places)'}
                </button>
              </li>
              <li>
                <button onClick={() => handleRegionClick('northeast')} className="text-slate-600 hover:text-emerald-700 transition-colors">
                  {lang === 'th' ? 'ภาคตะวันออกเฉียงเหนือ (50 แห่ง)' : lang === 'zh' ? '泰国东北部 (50个景点)' : 'Northeastern Thailand (50 Places)'}
                </button>
              </li>
              <li>
                <button onClick={() => handleRegionClick('south')} className="text-slate-600 hover:text-emerald-700 transition-colors">
                  {lang === 'th' ? 'ภาคใต้ (50 แห่ง)' : lang === 'zh' ? '泰国南部 (50个景点)' : 'Southern Thailand (50 Places)'}
                </button>
              </li>
            </ul>
          </div>

          {/* Quality & Trilingual Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {lang === 'th' ? 'มาตรฐานข้อมูล' : lang === 'zh' ? '多语种数据标准' : 'Data Standards'}
            </h4>
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <Globe2 className="w-4 h-4 text-emerald-600" />
                <span>TH / EN / ZH Certified</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {lang === 'th' 
                  ? 'ข้อมูลสถานที่ 200 แห่ง ผ่านการตรวจสอบพิกัดภูมิศาสตร์ เวลาทำการ และค่าบริการเพื่อความแม่นยำสูงสุด'
                  : lang === 'zh'
                  ? '精选200大景点均经过地理坐标精准校验与中英泰三语对照，助您顺畅畅游全泰。'
                  : 'All 200 destinations curated with verified GPS coordinates, trilingual guides, and entrance details.'}
              </p>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>{t('footer.copyright')}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Powered by React + Tailwind + Express</span>
            <span>•</span>
            <span>200 Destination Database</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
