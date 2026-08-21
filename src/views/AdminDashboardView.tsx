import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Place, PendingPlace, Review, Category } from '../types';
import { 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  Layers, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Eye, 
  Sparkles,
  AlertCircle,
  X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export const AdminDashboardView: React.FC = () => {
  const { t, lang, getLocalized, showToast, setSelectedPlaceId, user } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'places' | 'pending' | 'reviews'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [pendingList, setPendingList] = useState<PendingPlace[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Edit / Add Place Modal
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formPlace, setFormPlace] = useState<Partial<Place>>({});

  const refreshData = async () => {
    setLoading(true);
    try {
      const [statsData, placesData, subsData, revsData] = await Promise.all([
        api.getAdminStats(),
        api.getPlaces(),
        api.getSubmissions(),
        api.getReviews()
      ]);
      setStats(statsData);
      setPlaces(placesData.places);
      setPendingList(subsData);
      setReviewsList(revsData);
    } catch (err) {
      console.error('Failed to load admin data', err);
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleApproveSubmission = async (id: string) => {
    try {
      const res = await api.approveSubmission(id);
      showToast(`Approved "${res.place.name.th}" to main database!`, 'success');
      refreshData();
    } catch (err) {
      console.error('Approve failed', err);
      showToast('Error approving submission', 'error');
    }
  };

  const handleRejectSubmission = async (id: string) => {
    try {
      await api.rejectSubmission(id);
      showToast('Submission rejected', 'info');
      refreshData();
    } catch (err) {
      console.error('Reject failed', err);
      showToast('Error rejecting submission', 'error');
    }
  };

  const handleDeletePlace = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deletePlace(id);
      showToast(`Deleted place #${id}`, 'success');
      refreshData();
    } catch (err) {
      console.error('Delete failed', err);
      showToast('Error deleting place', 'error');
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await api.deleteReview(id);
      showToast('Review removed', 'success');
      refreshData();
    } catch (err) {
      console.error('Delete review failed', err);
      showToast('Error deleting review', 'error');
    }
  };

  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlace) {
        await api.updatePlace(editingPlace.id, formPlace);
        showToast('Place updated successfully!', 'success');
      } else {
        await api.createPlace(formPlace);
        showToast('New destination added successfully!', 'success');
      }
      setEditingPlace(null);
      setIsAddingNew(false);
      refreshData();
    } catch (err) {
      console.error('Save place failed', err);
      showToast('Error saving destination', 'error');
    }
  };

  const filteredPlaces = places.filter(p => {
    const matchesSearch = !searchFilter || 
      p.name?.th?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.name?.en?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.province?.th?.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesRegion = regionFilter === 'all' || p.regionId === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const chartData = stats?.regionalStats ? [
    { name: lang === 'th' ? 'ภาคเหนือ' : 'North', count: stats.regionalStats.north, color: '#10B981' },
    { name: lang === 'th' ? 'ภาคกลาง' : 'Central', count: stats.regionalStats.central, color: '#F59E0B' },
    { name: lang === 'th' ? 'ภาคอีสาน' : 'Isan', count: stats.regionalStats.northeast, color: '#F97316' },
    { name: lang === 'th' ? 'ภาคใต้' : 'South', count: stats.regionalStats.south, color: '#06B6D4' },
  ] : [];

  return (
    <div id="admin-dashboard-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {t('admin.dashboard')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase shadow-2xs">
                Admin Panel
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Thai Smart Trip Content Management & Moderation Center
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              activeTab === 'overview' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('admin.dashboard')}
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              activeTab === 'places' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('admin.manage_places')} ({places.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative shadow-2xs ${
              activeTab === 'pending' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('admin.pending_approvals')}
            {pendingList.filter(s => s.status === 'pending').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                {pendingList.filter(s => s.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              activeTab === 'reviews' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('admin.manage_reviews')} ({reviewsList.length})
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Stats Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase">{t('admin.total_places')}</span>
                <Layers className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats?.totalPlaces || places.length}</p>
              <p className="text-xs text-emerald-700 font-medium">100% Curated & GPS Verified</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase">{t('admin.pending_count')}</span>
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-amber-600">{stats?.pendingSubmissions || 0}</p>
              <p className="text-xs text-slate-500">Awaiting editorial review</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase">{t('admin.total_reviews')}</span>
                <MessageSquare className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-3xl font-extrabold text-teal-700">{stats?.totalReviews || reviewsList.length}</p>
              <p className="text-xs text-slate-500">User reviews & ratings</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase">{t('admin.total_users')}</span>
                <Users className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-3xl font-extrabold text-rose-600">{stats?.totalUsers || 2}</p>
              <p className="text-xs text-slate-500">Registered member profiles</p>
            </div>
          </div>

          {/* Regional Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Regional Bar Distribution */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <span>Regional Place Distribution (200 Total)</span>
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions & System Health */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>System Health & Quick Links</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span>Database Engine:</span>
                    <strong className="text-emerald-700 font-mono">200 Verified Entries (JSON Storage)</strong>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span>Language Engines:</span>
                    <strong className="text-teal-700 font-mono">TH (ไทย) / EN (English) / ZH (中文)</strong>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span>Server Status:</span>
                    <strong className="text-cyan-700 font-mono">Port 3000 Ingress Ready</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setIsAddingNew(true);
                    setEditingPlace(null);
                    setFormPlace({
                      name: { th: '', en: '', zh: '' },
                      province: { th: 'เชียงใหม่', en: 'Chiang Mai', zh: '清迈' },
                      category: { th: 'ธรรมชาติและภูเขา', en: 'Nature & Mountains', zh: '自然与山脉' },
                      categoryId: 'nature',
                      region: { th: 'ภาคเหนือ', en: 'Northern Thailand', zh: '泰国北部' },
                      regionId: 'north',
                      description: { th: '', en: '', zh: '' },
                      price: { th: 'เข้าชมฟรี', en: 'Free Entry', zh: '免费入场' },
                      hours: '08:00 - 17:00',
                      lat: 18.7883,
                      lng: 98.9853,
                      images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80']
                    });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('admin.add_place')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('pending')}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
                >
                  Review Submissions ({pendingList.filter(s => s.status === 'pending').length})
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: DESTINATIONS MANAGEMENT */}
      {activeTab === 'places' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={t('admin.search_places')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors"
              >
                <option value="all">All Regions ({places.length})</option>
                <option value="north">North (50)</option>
                <option value="central">Central (50)</option>
                <option value="northeast">Isan (50)</option>
                <option value="south">South (50)</option>
              </select>
            </div>

            <button
              onClick={() => {
                setIsAddingNew(true);
                setEditingPlace(null);
                setFormPlace({
                  name: { th: '', en: '', zh: '' },
                  province: { th: 'เชียงใหม่', en: 'Chiang Mai', zh: '清迈' },
                  category: { th: 'ธรรมชาติและภูเขา', en: 'Nature & Mountains', zh: '自然与山脉' },
                  categoryId: 'nature',
                  region: { th: 'ภาคเหนือ', en: 'Northern Thailand', zh: '泰国北部' },
                  regionId: 'north',
                  description: { th: '', en: '', zh: '' },
                  price: { th: 'เข้าชมฟรี', en: 'Free Entry', zh: '免费入场' },
                  hours: '08:00 - 17:00',
                  lat: 18.7883,
                  lng: 98.9853,
                  images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80']
                });
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('admin.add_place')}</span>
            </button>
          </div>

          {/* Places Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Destination</th>
                    <th className="px-5 py-3.5">Province</th>
                    <th className="px-5 py-3.5">Region</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Rating</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlaces.slice(0, 50).map((place) => (
                    <tr key={place.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-emerald-700 font-bold">#{place.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={place.images[0] || 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=150&q=80'}
                            alt={place.name.th}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=150&q=80';
                            }}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{place.name.th}</p>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{place.name.en}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-700">{place.province.th}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-500">
                        {place.regionId.toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-medium">
                          {place.category.th}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-amber-600">
                        ★ {place.rating.toFixed(1)} ({place.reviewCount})
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPlaceId(place.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Preview destination"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPlace(place);
                              setFormPlace({ ...place });
                              setIsAddingNew(false);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                            title="Edit destination"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlace(place.id, place.name.th)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors"
                            title="Delete destination"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPlaces.length > 50 && (
              <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                Showing first 50 results. Use search filter above to narrow down.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {pendingList.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">All Caught Up!</h3>
              <p className="text-xs text-slate-500">No pending destination submissions at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingList.map((sub) => (
                <div
                  key={sub.id}
                  className={`p-6 rounded-3xl bg-white border space-y-4 shadow-sm ${
                    sub.status === 'pending'
                      ? 'border-amber-300'
                      : sub.status === 'approved'
                      ? 'border-emerald-200 opacity-75'
                      : 'border-rose-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        sub.status === 'pending' ? 'bg-amber-100 text-amber-800' : sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sub.status}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{sub.name.th}</h3>
                      <p className="text-xs text-slate-500">{sub.name.en} • {sub.province.th}</p>
                    </div>

                    <img
                      src={sub.images[0] || 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=300&q=80'}
                      alt={sub.name.th}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=300&q=80';
                      }}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                    />
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {sub.description.th}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Submitted by:</span>
                      <strong className="text-slate-800">{sub.submittedBy.userName} ({sub.submittedBy.email})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours / Price:</span>
                      <span className="text-slate-850">{sub.hours} | {sub.price.th}</span>
                    </div>
                  </div>

                  {sub.status === 'pending' && (
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleApproveSubmission(sub.id)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('admin.approve')}</span>
                      </button>
                      <button
                        onClick={() => handleRejectSubmission(sub.id)}
                        className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{t('admin.reject')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Reviewer</th>
                    <th className="px-5 py-3.5">Place ID</th>
                    <th className="px-5 py-3.5">Rating</th>
                    <th className="px-5 py-3.5">Comment</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviewsList.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{rev.userName}</td>
                      <td className="px-5 py-3.5 font-mono text-emerald-700 font-semibold">#{rev.placeId}</td>
                      <td className="px-5 py-3.5 font-bold text-amber-500">★ {rev.rating}.0</td>
                      <td className="px-5 py-3.5 max-w-xs truncate text-slate-600">{rev.comment}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Place Modal */}
      {(editingPlace || isAddingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => { setEditingPlace(null); setIsAddingNew(false); }}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900">
              {editingPlace ? `Edit Destination #${editingPlace.id}` : 'Add New Destination'}
            </h2>

            <form onSubmit={handleSavePlace} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Name (Thai)</label>
                  <input
                    type="text"
                    value={formPlace.name?.th || ''}
                    onChange={(e) => setFormPlace({
                      ...formPlace,
                      name: { ...formPlace.name, th: e.target.value } as any
                    })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Name (English)</label>
                  <input
                    type="text"
                    value={formPlace.name?.en || ''}
                    onChange={(e) => setFormPlace({
                      ...formPlace,
                      name: { ...formPlace.name, en: e.target.value } as any
                    })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Name (Chinese)</label>
                  <input
                    type="text"
                    value={formPlace.name?.zh || ''}
                    onChange={(e) => setFormPlace({
                      ...formPlace,
                      name: { ...formPlace.name, zh: e.target.value } as any
                    })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Province</label>
                  <input
                    type="text"
                    value={formPlace.province?.th || ''}
                    onChange={(e) => setFormPlace({
                      ...formPlace,
                      province: { th: e.target.value, en: e.target.value, zh: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Region</label>
                  <select
                    value={formPlace.regionId || 'north'}
                    onChange={(e) => setFormPlace({ ...formPlace, regionId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="north">North</option>
                    <option value="central">Central</option>
                    <option value="northeast">Northeast</option>
                    <option value="south">South</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description (Thai)</label>
                <textarea
                  rows={3}
                  value={formPlace.description?.th || ''}
                  onChange={(e) => setFormPlace({
                    ...formPlace,
                    description: { ...formPlace.description, th: e.target.value } as any
                  })}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Hours</label>
                  <input
                    type="text"
                    value={formPlace.hours || ''}
                    onChange={(e) => setFormPlace({ ...formPlace, hours: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Price / Entrance Fee</label>
                  <input
                    type="text"
                    value={formPlace.price?.th || ''}
                    onChange={(e) => setFormPlace({
                      ...formPlace,
                      price: { th: e.target.value, en: e.target.value, zh: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setEditingPlace(null); setIsAddingNew(false); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
                >
                  Save Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
