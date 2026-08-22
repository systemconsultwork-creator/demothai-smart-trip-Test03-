import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { AdminRoute } from '../components/AdminRoute';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Category, Place, ProvinceItem } from '../types';

const EMPTY_LANG = { th: '', en: '', zh: '' };
const REGIONS = [
  { id: 'north', name: { th: 'ภาคเหนือ', en: 'Northern Thailand', zh: '泰国北部' } },
  { id: 'central', name: { th: 'ภาคกลาง', en: 'Central Thailand', zh: '泰国中部' } },
  { id: 'northeast', name: { th: 'ภาคตะวันออกเฉียงเหนือ', en: 'Northeastern Thailand', zh: '泰国东北部' } },
  { id: 'south', name: { th: 'ภาคใต้', en: 'Southern Thailand', zh: '泰国南部' } },
] as const;

const makeEmptyPlace = (): Partial<Place> => ({
  name: { ...EMPTY_LANG },
  province: { ...EMPTY_LANG },
  category: { ...EMPTY_LANG },
  categoryId: '',
  region: { ...EMPTY_LANG },
  regionId: 'north',
  description: { ...EMPTY_LANG },
  rating: 5,
  reviewCount: 0,
  price: { th: 'เข้าชมฟรี', en: 'Free Entry', zh: '免费入场' },
  hours: '08:00 - 17:00',
  lat: 13.7563,
  lng: 100.5018,
  images: [''],
  address: { ...EMPTY_LANG },
  contact: '',
  location: { map_url: '' },
  tags: [],
  featured: false,
  popular: false,
  recommended: false,
});

export const AdminPlacesView: React.FC = () => {
  const { lang, showToast } = useApp();
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [provinceId, setProvinceId] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Place | null>(null);
  const [form, setForm] = useState<Partial<Place>>(makeEmptyPlace());
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    try {
      const [placeResult, categoryResult, provinceResult] = await Promise.all([
        api.getPlaces(),
        api.getCategories(),
        api.getProvinces(),
      ]);
      setPlaces(placeResult.places);
      setCategories(categoryResult);
      setProvinces(provinceResult);
    } catch (error) {
      console.error(error);
      showToast('โหลดข้อมูลสถานที่ไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter((place) => {
      const searchable = [
        place.name?.th,
        place.name?.en,
        place.name?.zh,
        place.province?.th,
        place.province?.en,
        place.province?.zh,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery = !q || searchable.includes(q);
      const matchesRegion = region === 'all' || place.regionId === region;
      const matchesCategory = categoryId === 'all' || place.categoryId === categoryId;
      const selectedProvince = provinces.find((item) => item.id === provinceId);
      const matchesProvince =
        provinceId === 'all' ||
        place.province?.th === selectedProvince?.name.th ||
        place.province?.en === selectedProvince?.name.en ||
        place.province?.zh === selectedProvince?.name.zh;

      return matchesQuery && matchesRegion && matchesCategory && matchesProvince;
    });
  }, [places, query, region, categoryId, provinceId, provinces]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visiblePlaces = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const setLangField = (
    field: 'name' | 'description' | 'province' | 'category' | 'region' | 'price' | 'address',
    language: 'th' | 'en' | 'zh',
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: {
        ...(current[field] || EMPTY_LANG),
        [language]: value,
      },
    }));
  };

  const chooseProvince = (id: string) => {
    const province = provinces.find((item) => item.id === id);
    if (!province) return;
    const regionItem = REGIONS.find((item) => item.id === province.regionId) || REGIONS[0];
    setForm((current) => ({
      ...current,
      province: { ...province.name },
      regionId: province.regionId,
      region: { ...regionItem.name },
    }));
  };

  const chooseCategory = (id: string) => {
    const category = categories.find((item) => item.id === id);
    if (!category) return;
    setForm((current) => ({
      ...current,
      categoryId: category.id,
      category: { ...category.name },
    }));
  };

  const chooseRegion = (id: string) => {
    const regionItem = REGIONS.find((item) => item.id === id) || REGIONS[0];
    setForm((current) => ({
      ...current,
      regionId: regionItem.id,
      region: { ...regionItem.name },
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(makeEmptyPlace());
  };

  const openEdit = (place: Place) => {
    setEditing(place);
    setForm({
      ...place,
      images: place.images?.length ? [...place.images] : [''],
      location: { map_url: place.location?.map_url || '' },
    });
  };

  const closeForm = () => {
    if (saving) return;
    setEditing(null);
    setForm(makeEmptyPlace());
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name?.th?.trim() || !form.province?.th?.trim() || !form.categoryId || !form.description?.th?.trim()) {
      showToast('กรุณากรอกชื่อภาษาไทย จังหวัด หมวดหมู่ และคำอธิบาย', 'error');
      return;
    }

    const cleanImages = (form.images || []).map((url) => url.trim()).filter(Boolean);
    if (cleanImages.length === 0) {
      showToast('กรุณาระบุ URL รูปภาพอย่างน้อย 1 รูป', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Place> = {
        ...form,
        images: cleanImages,
        rating: Number(form.rating || 0),
        reviewCount: Number(form.reviewCount || 0),
        lat: Number(form.lat || 0),
        lng: Number(form.lng || 0),
        location: { map_url: form.location?.map_url?.trim() || '' },
      };

      if (editing) {
        await api.updatePlace(editing.id, payload);
        showToast(`อัปเดต ${form.name?.th} เรียบร้อยแล้ว`, 'success');
      } else {
        await api.createPlace(payload);
        showToast(`เพิ่ม ${form.name?.th} เรียบร้อยแล้ว`, 'success');
      }
      closeForm();
      await load();
      setPage(1);
    } catch (error) {
      console.error(error);
      showToast('บันทึกสถานที่ไม่สำเร็จ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (place: Place) => {
    const confirmed = window.confirm(`ลบ “${place.name.th}” ออกจากฐานข้อมูลหรือไม่?\nการลบนี้ไม่สามารถย้อนกลับได้`);
    if (!confirmed) return;

    try {
      await api.deletePlace(place.id);
      showToast(`ลบ ${place.name.th} แล้ว`, 'success');
      await load();
      setPage((current) => Math.min(current, Math.max(1, Math.ceil((filtered.length - 1) / pageSize))));
    } catch (error) {
      console.error(error);
      showToast('ลบสถานที่ไม่สำเร็จ', 'error');
    }
  };

  const localized = (value: { th: string; en: string; zh: string } | undefined) =>
    value?.[lang] || value?.th || value?.en || value?.zh || '-';

  return (
    <AdminRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { window.location.href = '/admin'; }}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="กลับ Admin Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">B2 · Content Management</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">จัดการสถานที่ท่องเที่ยว</h1>
              <p className="text-sm text-slate-500 mt-1">เพิ่ม แก้ไข ลบ ค้นหา และตรวจสอบข้อมูลสถานที่ทั้ง 200 รายการ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> เพิ่มสถานที่
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="ค้นหาชื่อสถานที่ / จังหวัด"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select value={region} onChange={(event) => { setRegion(event.target.value); setPage(1); }} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500">
            <option value="all">ทุกภูมิภาค</option>
            {REGIONS.map((item) => <option key={item.id} value={item.id}>{item.name.th}</option>)}
          </select>
          <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500">
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name.th}</option>)}
          </select>
          <select value={provinceId} onChange={(event) => { setProvinceId(event.target.value); setPage(1); }} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500">
            <option value="all">ทุกจังหวัด</option>
            {provinces.map((item) => <option key={item.id} value={item.id}>{item.name.th}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>พบ {filtered.length} สถานที่</span>
          <span>หน้า {safePage} / {pageCount}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">กำลังโหลดข้อมูลสถานที่...</div>
          ) : visiblePlaces.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">ไม่พบสถานที่ตามเงื่อนไขที่เลือก</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">สถานที่</th>
                    <th className="px-5 py-3">จังหวัด</th>
                    <th className="px-5 py-3">ภูมิภาค</th>
                    <th className="px-5 py-3">หมวดหมู่</th>
                    <th className="px-5 py-3">Rating</th>
                    <th className="px-5 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiblePlaces.map((place) => (
                    <tr key={place.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 min-w-[280px]">
                        <div className="flex items-center gap-3">
                          {place.images?.[0] ? (
                            <img src={place.images[0]} alt={place.name.th} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-400" /></div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{localized(place.name)}</p>
                            <p className="text-xs text-slate-400">ID #{place.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-700">{localized(place.province)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">{localized(place.region)}</td>
                      <td className="px-5 py-4 whitespace-nowrap"><span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">{localized(place.category)}</span></td>
                      <td className="px-5 py-4 whitespace-nowrap font-semibold text-amber-600">★ {Number(place.rating || 0).toFixed(1)} <span className="text-slate-400 font-normal">({place.reviewCount || 0})</span></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {place.location?.map_url && (
                            <a href={place.location.map_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" title="เปิด Google Maps">
                              <MapPin className="w-4 h-4" />
                            </a>
                          )}
                          <button type="button" onClick={() => openEdit(place)} className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100" title="แก้ไข">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => remove(place)} className="p-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100" title="ลบ">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          <button type="button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-40">ก่อนหน้า</button>
          <span className="px-3 py-2 rounded-lg bg-slate-100 text-sm font-semibold">{safePage}</span>
          <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-40">ถัดไป</button>
        </div>

        {editing !== null || (form.name && !editing && form.name.th === '') ? (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="max-w-5xl mx-auto my-6 bg-white rounded-3xl shadow-2xl border border-slate-200">
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur border-b border-slate-200 rounded-t-3xl">
                <div>
                  <p className="text-xs font-bold text-emerald-700 uppercase">B2 · Place Editor</p>
                  <h2 className="text-xl font-extrabold text-slate-900">{editing ? `แก้ไขสถานที่ #${editing.id}` : 'เพิ่มสถานที่ใหม่'}</h2>
                </div>
                <button type="button" onClick={closeForm} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={save} className="p-6 space-y-6">
                <section className="space-y-3">
                  <h3 className="font-bold text-slate-900">ชื่อสถานที่ · TH / EN / ZH</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(['th', 'en', 'zh'] as const).map((language) => (
                      <input key={language} value={form.name?.[language] || ''} onChange={(event) => setLangField('name', language, event.target.value)} placeholder={`ชื่อ (${language.toUpperCase()})`} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required={language === 'th'} />
                    ))}
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">จังหวัด</label>
                    <select value={provinces.find((item) => item.name.th === form.province?.th)?.id || ''} onChange={(event) => chooseProvince(event.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                      <option value="">เลือกจังหวัด</option>
                      {provinces.map((item) => <option key={item.id} value={item.id}>{item.name.th}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">ภูมิภาค</label>
                    <select value={form.regionId || 'north'} onChange={(event) => chooseRegion(event.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                      {REGIONS.map((item) => <option key={item.id} value={item.id}>{item.name.th}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">หมวดหมู่</label>
                    <select value={form.categoryId || ''} onChange={(event) => chooseCategory(event.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                      <option value="">เลือกหมวดหมู่</option>
                      {categories.map((item) => <option key={item.id} value={item.id}>{item.name.th}</option>)}
                    </select>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-slate-900">คำอธิบาย · TH / EN / ZH</h3>
                  {(['th', 'en', 'zh'] as const).map((language) => (
                    <textarea key={language} rows={3} value={form.description?.[language] || ''} onChange={(event) => setLangField('description', language, event.target.value)} placeholder={`คำอธิบาย (${language.toUpperCase()})`} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required={language === 'th'} />
                  ))}
                </section>

                <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div><label className="block text-xs font-semibold mb-1">เวลาเปิด-ปิด</label><input value={form.hours || ''} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
                  <div><label className="block text-xs font-semibold mb-1">ราคา TH</label><input value={form.price?.th || ''} onChange={(e) => setLangField('price', 'th', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
                  <div><label className="block text-xs font-semibold mb-1">Latitude</label><input type="number" step="any" value={form.lat ?? ''} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
                  <div><label className="block text-xs font-semibold mb-1">Longitude</label><input type="number" step="any" value={form.lng ?? ''} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-slate-900">Google Maps / รูปภาพ</h3>
                  <div className="flex gap-2">
                    <input value={form.location?.map_url || ''} onChange={(e) => setForm({ ...form, location: { map_url: e.target.value } })} placeholder="Google Maps URL" className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                    {form.location?.map_url && <a href={form.location.map_url} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-100"><ExternalLink className="w-4 h-4" /></a>}
                  </div>
                  {(form.images || ['']).map((url, index) => (
                    <div key={`${index}-${url}`} className="flex gap-2">
                      <input value={url} onChange={(e) => setForm((current) => ({ ...current, images: (current.images || []).map((item, itemIndex) => itemIndex === index ? e.target.value : item) }))} placeholder={`Image URL ${index + 1}`} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                      <button type="button" disabled={(form.images || []).length <= 1} onClick={() => setForm((current) => ({ ...current, images: (current.images || []).filter((_, itemIndex) => itemIndex !== index) }))} className="p-2.5 rounded-xl bg-rose-50 text-rose-700 disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm((current) => ({ ...current, images: [...(current.images || []), ''] }))} className="text-xs font-bold text-emerald-700">+ เพิ่มรูปภาพ</button>
                </section>

                <section className="flex flex-wrap gap-4">
                  {(['featured', 'popular', 'recommended'] as const).map((flag) => (
                    <label key={flag} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={Boolean(form[flag])} onChange={(e) => setForm({ ...form, [flag]: e.target.checked })} />
                      {flag}
                    </label>
                  ))}
                </section>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button type="button" onClick={closeForm} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm">ยกเลิก</button>
                  <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-60">
                    <Check className="w-4 h-4" /> {saving ? 'กำลังบันทึก...' : 'บันทึกสถานที่'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </AdminRoute>
  );
};

export default AdminPlacesView;
