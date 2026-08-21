import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Category, ProvinceItem } from '../types';
import { 
  PlusCircle, 
  Send, 
  Image as ImageIcon, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Globe2, 
  Clock, 
  DollarSign, 
  Layers 
} from 'lucide-react';

export const SubmitPlaceView: React.FC = () => {
  const { t, lang, getLocalized, user, setIsAuthModalOpen, showToast, setCurrentView } = useApp();

  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [nameTh, setNameTh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameZh, setNameZh] = useState('');
  const [provinceTh, setProvinceTh] = useState('เชียงใหม่');
  const [categoryId, setCategoryId] = useState('nature');
  const [regionId, setRegionId] = useState('north');
  const [descTh, setDescTh] = useState('');
  const [descEn, setDescEn] = useState('');
  const [hours, setHours] = useState('08:00 - 17:00');
  const [priceTh, setPriceTh] = useState('เข้าชมฟรี');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80');

  useEffect(() => {
    Promise.all([
      api.getCategories(),
      api.getProvinces()
    ])
      .then(([cats, provs]) => {
        setCategories(cats);
        setProvinces(provs);
      })
      .catch(err => console.error('Failed to load categories/provinces', err));
  }, []);

  const handleProvinceChange = (provName: string) => {
    setProvinceTh(provName);
    const p = provinces.find(item => item.name.th === provName);
    if (p) {
      setRegionId(p.regionId);
    }
  };

  const handleSampleFill = () => {
    setNameTh('จุดชมวิวผาช่อ อุทยานแห่งชาติแม่วาง');
    setNameEn('Pha Chor Canyon, Mae Wang');
    setNameZh('帕冲大峡谷（清迈大峡谷）');
    setProvinceTh('เชียงใหม่');
    setRegionId('north');
    setCategoryId('nature');
    setDescTh('ปรากฏการณ์ธรรมชาติหน้าผาดินและเสาดินรูปร่างแปลกตาสูงกว่า 30 เมตร แกรนด์แคนยอนเมืองไทย');
    setDescEn('Dramatic natural 30-meter high sediment canyon pillars and walking trails in Chiang Mai.');
    setHours('08:30 - 16:30');
    setPriceTh('คนไทย 20 / ต่างชาติ 100 บาท');
    setImageUrl('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80');
    showToast('Filled sample unseen destination data', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameTh.trim() || !descTh.trim()) {
      showToast('Please fill in required Thai name and description', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const catObj = categories.find(c => c.id === categoryId)?.name || { th: 'ท่องเที่ยว', en: 'Travel', zh: '旅游' };
      const selectedProvObj = provinces.find(p => p.name.th === provinceTh)?.name || { th: provinceTh, en: provinceTh, zh: provinceTh };

      const regionMapName: Record<string, any> = {
        north: { th: 'ภาคเหนือ', en: 'Northern Thailand', zh: '泰国北部' },
        central: { th: 'ภาคกลาง', en: 'Central Thailand', zh: '泰国中部' },
        northeast: { th: 'ภาคตะวันออกเฉียงเหนือ', en: 'Northeastern Thailand', zh: '泰国东北部' },
        south: { th: 'ภาคใต้', en: 'Southern Thailand', zh: '泰国南部' }
      };

      await api.submitPlace({
        name: {
          th: nameTh.trim(),
          en: nameEn.trim() || nameTh.trim(),
          zh: nameZh.trim() || nameTh.trim()
        },
        province: selectedProvObj,
        category: catObj,
        categoryId: categoryId,
        region: regionMapName[regionId] || regionMapName.central,
        regionId: regionId,
        description: {
          th: descTh.trim(),
          en: descEn.trim() || descTh.trim(),
          zh: descTh.trim()
        },
        hours: hours.trim() || '08:00 - 17:00',
        price: {
          th: priceTh.trim() || 'เข้าชมฟรี',
          en: priceTh.trim() || 'Free Entry',
          zh: priceTh.trim() || '免费入场'
        },
        images: [imageUrl],
        submittedBy: {
          userId: user?.id || 'guest',
          userName: user?.name || 'Anonymous Contributor',
          email: user?.email || 'contributor@thaismarttrip.com'
        }
      });

      setSubmittedSuccess(true);
      showToast(t('submit_place.success_title'), 'success');
    } catch (err) {
      console.error('Failed to submit place', err);
      showToast('Error submitting destination', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="submit-place-view" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Community Contribution Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          {t('submit_place.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          {t('submit_place.subtitle')}
        </p>
      </div>

      {submittedSuccess ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-emerald-200 text-center space-y-5 shadow-lg animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{t('submit_place.success_title')}</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {t('submit_place.success_desc')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setSubmittedSuccess(false);
                setNameTh('');
                setNameEn('');
                setNameZh('');
                setDescTh('');
                setDescEn('');
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
            >
              Recommend Another Place
            </button>
            <button
              onClick={() => setCurrentView('discover')}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Explore 200 Places
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-8">
          
          {/* Quick autofill sample helper */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-600">Want to test quickly with sample data?</span>
            <button
              type="button"
              onClick={handleSampleFill}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold border border-emerald-300 transition-colors shadow-2xs"
            >
              Auto-Fill Sample
            </button>
          </div>

          {/* Destination Names (TH, EN, ZH) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-600" />
              <span>1. Destination Names (Multilingual)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('submit_place.name_th')} *</label>
                <input
                  type="text"
                  value={nameTh}
                  onChange={(e) => setNameTh(e.target.value)}
                  placeholder="เช่น ถ้ำนาคา, วัดร่องขุ่น"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('submit_place.name_en')}</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Naka Cave, White Temple"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('submit_place.name_zh')}</label>
                <input
                  type="text"
                  value={nameZh}
                  onChange={(e) => setNameZh(e.target.value)}
                  placeholder="例如 娜迦神龙洞、白庙"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Classification: Category, Region & Province */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>2. Category & Geographic Location</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('submit_place.category')} *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getLocalized(c.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('submit_place.province')} *</label>
                <select
                  value={provinceTh}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {provinces.map((p) => (
                    <option key={p.id} value={p.name.th}>
                      {getLocalized(p.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('submit_place.region')}</label>
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="north">ภาคเหนือ (Northern)</option>
                  <option value="central">ภาคกลาง (Central)</option>
                  <option value="northeast">ภาคตะวันออกเฉียงเหนือ (Isan)</option>
                  <option value="south">ภาคใต้ (Southern)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>3. Detailed Description & Travel Highlights</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('submit_place.description_th')} *</label>
                <textarea
                  rows={3}
                  value={descTh}
                  onChange={(e) => setDescTh(e.target.value)}
                  placeholder="บอกเล่าความงดงาม จุดเด่น และประสบการณ์ที่นักเดินทางจะได้รับ..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('submit_place.description_en')}</label>
                <textarea
                  rows={2}
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder="English summary of highlights and experiences..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Practical Info & Image */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>4. Operating Hours, Fee & Photos</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('submit_place.hours')}</label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="08:00 - 17:00 / 24 ชั่วโมง"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t('submit_place.price')}</label>
                <input
                  type="text"
                  value={priceTh}
                  onChange={(e) => setPriceTh(e.target.value)}
                  placeholder="เข้าชมฟรี / คนไทย 40 ต่างชาติ 200 บาท"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">{t('submit_place.image_url')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {imageUrl && (
                  <div className="w-20 h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {user ? (
                <span>Submitting as <strong className="text-slate-900">{user.name}</strong> ({user.email})</span>
              ) : (
                <span>Submitting as guest. <button type="button" onClick={() => setIsAuthModalOpen(true)} className="text-emerald-700 font-semibold hover:underline">Log in</button> to link to your profile.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xs transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? t('submit_place.submitting') : t('submit_place.submit_button')}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
