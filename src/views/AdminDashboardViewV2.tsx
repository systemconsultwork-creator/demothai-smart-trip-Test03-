import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Eye,
  Layers,
  MessageSquare,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { syncApprovedPlaceToFirestore } from '../services/adminPlaceSync';
import { PendingPlace, Review, Place } from '../types';
import { AdminPlacesView } from './AdminPlacesView';

type AdminTab = 'overview' | 'places' | 'pending' | 'reviews';

type AdminStats = {
  pendingSubmissions?: number;
  totalReviews?: number;
  totalUsers?: number;
};

const tabBase = 'px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap';

export const AdminDashboardViewV2: React.FC = () => {
  const { t, lang, showToast, setSelectedPlaceId } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [pendingList, setPendingList] = useState<PendingPlace[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const localized = useCallback((value?: { th: string; en: string; zh: string }) => {
    if (!value) return '-';
    return value[lang] || value.th || value.en || value.zh || '-';
  }, [lang]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Places are read from Firestore through api.getPlaces(). This is the
      // source of truth for the Admin dashboard and public discovery pages.
      const [placesData, statsData, submissionsData, reviewsData] = await Promise.all([
        api.getPlaces(),
        api.getAdminStats(),
        api.getSubmissions(),
        api.getReviews(),
      ]);
      setPlaces(placesData.places || []);
      setStats(statsData as AdminStats);
      setPendingList(submissionsData || []);
      setReviewsList(reviewsData || []);
    } catch (error) {
      console.error('Failed to load admin data', error);
      showToast('โหลดข้อมูล Admin ไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const pendingCount = useMemo(
    () => pendingList.filter(item => item.status === 'pending').length,
    [pendingList],
  );

  const regionalCounts = useMemo(() => ({
    north: places.filter(place => place.regionId === 'north').length,
    central: places.filter(place => place.regionId === 'central').length,
    northeast: places.filter(place => place.regionId === 'northeast').length,
    south: places.filter(place => place.regionId === 'south').length,
  }), [places]);

  const chartData = useMemo(() => [
    { name: lang === 'th' ? 'เหนือ' : lang === 'zh' ? '北部' : 'North', count: regionalCounts.north },
    { name: lang === 'th' ? 'กลาง' : lang === 'zh' ? '中部' : 'Central', count: regionalCounts.central },
    { name: lang === 'th' ? 'อีสาน' : lang === 'zh' ? '东北部' : 'Northeast', count: regionalCounts.northeast },
    { name: lang === 'th' ? 'ใต้' : lang === 'zh' ? '南部' : 'South', count: regionalCounts.south },
  ], [lang, regionalCounts]);

  const handleApproveSubmission = async (id: string) => {
    try {
      const result = await api.approveSubmission(id);
      if (!result.place) throw new Error('Approval succeeded without a place payload.');

      // Critical fix: approval must immediately create/update the Firestore
      // document because Firestore is the primary database used by the UI.
      const syncedPlace = await syncApprovedPlaceToFirestore(result.place);

      showToast(`อนุมัติ ${syncedPlace.name?.th || 'สถานที่'} และบันทึก Firebase เรียบร้อยแล้ว`, 'success');
      await refreshData();
    } catch (error) {
      console.error('Approve failed', error);
      showToast('อนุมัติสถานที่ไม่สำเร็จ หรือบันทึก Firebase ไม่สำเร็จ', 'error');
      await refreshData();
    }
  };

  const handleRejectSubmission = async (id: string) => {
    try {
      await api.rejectSubmission(id);
      showToast('ปฏิเสธคำขอเรียบร้อยแล้ว', 'success');
      await refreshData();
    } catch (error) {
      console.error('Reject failed', error);
      showToast('ปฏิเสธคำขอไม่สำเร็จ', 'error');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('ต้องการลบรีวิวนี้หรือไม่?')) return;
    try {
      await api.deleteReview(id);
      showToast('ลบรีวิวเรียบร้อยแล้ว', 'success');
      await refreshData();
    } catch (error) {
      console.error('Delete review failed', error);
      showToast('ลบรีวิวไม่สำเร็จ', 'error');
    }
  };

  const totalPlaces = places.length;
  const totalReviews = stats?.totalReviews ?? reviewsList.length;
  const totalUsers = stats?.totalUsers ?? 0;
  const pendingTotal = stats?.pendingSubmissions ?? pendingCount;

  return (
    <div id="admin-dashboard-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('admin.dashboard')}</h1>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase">Admin Panel</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Thai Smart Trip Content Management & Moderation Center</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 overflow-x-auto max-w-full">
          <button type="button" onClick={() => setActiveTab('overview')} className={`${tabBase} ${activeTab === 'overview' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>แดชบอร์ดภาพรวม</button>
          <button type="button" onClick={() => setActiveTab('places')} className={`${tabBase} ${activeTab === 'places' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>จัดการสถานที่ท่องเที่ยว ({totalPlaces})</button>
          <button type="button" onClick={() => setActiveTab('pending')} className={`${tabBase} relative ${activeTab === 'pending' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>คำขออนุมัติสถานที่{pendingCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] leading-none">{pendingCount}</span>}</button>
          <button type="button" onClick={() => setActiveTab('reviews')} className={`${tabBase} ${activeTab === 'reviews' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>จัดการรีวิว ({reviewsList.length})</button>
        </div>
      </div>

      {loading && activeTab !== 'places' && <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-sm text-slate-500">กำลังโหลดข้อมูล Admin จาก Firebase...</div>}

      {!loading && activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm"><div className="flex items-center justify-between text-slate-500"><span className="text-xs font-semibold uppercase">สถานที่ทั้งหมด</span><Layers className="w-5 h-5 text-emerald-600" /></div><p className="text-3xl font-extrabold text-slate-900 mt-2">{totalPlaces}</p><p className="text-xs text-emerald-700 mt-1">ข้อมูลจาก Firebase Firestore</p></div>
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm"><div className="flex items-center justify-between text-slate-500"><span className="text-xs font-semibold uppercase">รออนุมัติ</span><AlertCircle className="w-5 h-5 text-amber-500" /></div><p className="text-3xl font-extrabold text-amber-600 mt-2">{pendingTotal}</p><p className="text-xs text-slate-500 mt-1">คำขอเพิ่มสถานที่ใหม่</p></div>
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm"><div className="flex items-center justify-between text-slate-500"><span className="text-xs font-semibold uppercase">รีวิวทั้งหมด</span><MessageSquare className="w-5 h-5 text-teal-600" /></div><p className="text-3xl font-extrabold text-teal-700 mt-2">{totalReviews}</p><p className="text-xs text-slate-500 mt-1">รีวิวและคะแนนจากสมาชิก</p></div>
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm"><div className="flex items-center justify-between text-slate-500"><span className="text-xs font-semibold uppercase">สมาชิก</span><Users className="w-5 h-5 text-rose-500" /></div><p className="text-3xl font-extrabold text-rose-600 mt-2">{totalUsers}</p><p className="text-xs text-slate-500 mt-1">Registered member profiles</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-emerald-700" />จำนวนสถานที่แยกตามภูมิภาค</h3>
              <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900">สถานะระบบ</h3>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><p className="text-xs text-slate-500">Database</p><p className="font-bold text-emerald-700 mt-1">Firebase Firestore · {totalPlaces} Places</p><p className="text-xs text-emerald-700/80 mt-1">Primary database · บันทึก Admin แบบทันที</p></div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><p className="text-xs text-slate-500">Languages</p><p className="font-bold text-slate-800 mt-1">TH / EN / ZH</p></div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><p className="text-xs text-slate-500">Admin Session</p><p className="font-bold text-slate-800 mt-1">Authenticated</p></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'places' && <div className="space-y-4"><AdminPlacesView /></div>}

      {!loading && activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingCount === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center"><CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" /><p className="font-bold text-slate-900 mt-3">ไม่มีคำขอที่รออนุมัติ</p><p className="text-sm text-slate-500 mt-1">ทุกคำขอได้รับการจัดการแล้ว</p></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {pendingList.filter(item => item.status === 'pending').map(item => (
                <div key={item.id} className="bg-white border border-amber-300 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4"><div className="min-w-0"><span className="inline-flex px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">Pending</span><h3 className="text-lg font-extrabold text-slate-900 mt-2">{localized(item.name)}</h3><p className="text-xs text-slate-500 mt-1">{localized(item.province)} · {localized(item.category)}</p></div>{item.images?.[0] && <img src={item.images[0]} alt={item.name.th} className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />}</div>
                  <p className="text-sm text-slate-600 mt-4 line-clamp-3">{localized(item.description)}</p>
                  <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs"><div className="flex justify-between gap-3"><span className="text-slate-500">Submitted by:</span><strong className="text-slate-800 text-right">{item.submittedBy.userName} ({item.submittedBy.email})</strong></div><div className="flex justify-between gap-3 mt-2"><span className="text-slate-500">Hours / Price:</span><strong className="text-slate-800 text-right">{item.hours || '-'} · {localized(item.price)}</strong></div></div>
                  <div className="grid grid-cols-2 gap-2 mt-4"><button type="button" onClick={() => handleApproveSubmission(item.id)} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />อนุมัติ + Firebase</button><button type="button" onClick={() => handleRejectSubmission(item.id)} className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-sm font-bold flex items-center justify-center gap-2"><XCircle className="w-4 h-4" />ปฏิเสธ</button></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'reviews' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {reviewsList.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">ยังไม่มีรีวิว</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Reviewer</th><th className="px-5 py-3">Place ID</th><th className="px-5 py-3">Rating</th><th className="px-5 py-3">Comment</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{reviewsList.map(review => <tr key={review.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">{review.userName}</td><td className="px-5 py-4 whitespace-nowrap"><button type="button" onClick={() => setSelectedPlaceId(review.placeId)} className="text-emerald-700 font-bold hover:underline">#{review.placeId}</button></td><td className="px-5 py-4 whitespace-nowrap font-semibold text-amber-600">★ {Number(review.rating || 0).toFixed(1)}</td><td className="px-5 py-4 min-w-[320px] max-w-[520px] text-slate-600"><div className="truncate" title={review.comment}>{review.comment}</div></td><td className="px-5 py-4 whitespace-nowrap text-slate-500">{new Date(review.createdAt).toLocaleDateString('th-TH')}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedPlaceId(review.placeId)} className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" title="ดูสถานที่"><Eye className="w-4 h-4" /></button><button type="button" onClick={() => handleDeleteReview(review.id)} className="p-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100" title="ลบรีวิว"><Trash2 className="w-4 h-4" /></button></div></td></tr>)}</tbody></table></div>}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardViewV2;
