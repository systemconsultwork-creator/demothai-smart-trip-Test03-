import { Place, Category, ProvinceItem, Review, PendingPlace, User } from '../types';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './firebase';
import { isAdminEmail } from '../config/admin';

function getAuthHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const savedUser = localStorage.getItem('tst_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.id) headers['x-user-id'] = user.id;
      if (user.role) headers['x-user-role'] = user.role;
      if (user.email) headers['x-user-email'] = user.email;
      headers['Authorization'] = `Bearer ${user.id || 'token'}`;
    }
  } catch (e) {}
  return headers;
}

function getFirestorePlaces(): Promise<Place[]> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase Firestore is not configured.');
  return getDocs(collection(db, 'places')).then(snapshot =>
    snapshot.docs
      .map(snapshotDoc => snapshotDoc.data() as Place)
      .filter(place => Number.isFinite(Number(place.id)))
  );
}

function requireFirebaseAdmin() {
  const auth = getFirebaseAuth();
  const email = auth?.currentUser?.email;
  if (!auth?.currentUser || !isAdminEmail(email)) {
    throw new Error('Administrator privileges are required.');
  }
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase Firestore is not configured.');
  return db;
}

function filterPlaces(places: Place[], params: {
  q?: string;
  category?: string;
  region?: string;
  province?: string;
  minRating?: number;
  sort?: 'rating' | 'popular' | 'name';
  featured?: boolean;
  popular?: boolean;
  recommended?: boolean;
  limit?: number;
}): Place[] {
  let filtered = [...places];

  if (params.q) {
    const query = params.q.toLowerCase().trim();
    filtered = filtered.filter((p: any) => {
      const values = [
        p.name?.th, p.name?.en, p.name?.zh,
        p.province?.th, p.province?.en, p.province?.zh,
        p.description?.th, p.description?.en, p.description?.zh,
        ...(Array.isArray(p.tags) ? p.tags : [])
      ];
      return values.some(value => String(value || '').toLowerCase().includes(query));
    });
  }

  if (params.category && params.category !== 'all') {
    filtered = filtered.filter(p => p.categoryId === params.category);
  }
  if (params.region && params.region !== 'all') {
    filtered = filtered.filter(p => p.regionId === params.region);
  }
  if (params.province && params.province !== 'all') {
    filtered = filtered.filter((p: any) =>
      p.province?.th === params.province || p.province?.en === params.province || p.province?.zh === params.province
    );
  }
  if (params.minRating) {
    filtered = filtered.filter(p => (p.rating || 0) >= params.minRating!);
  }
  if (params.featured) filtered = filtered.filter(p => Boolean((p as any).featured));
  if (params.popular) filtered = filtered.filter(p => Boolean((p as any).popular));
  if (params.recommended) filtered = filtered.filter(p => Boolean((p as any).recommended));

  if (params.sort === 'rating') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (params.sort === 'popular') {
    filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
  } else if (params.sort === 'name') {
    filtered.sort((a, b) => (a.name?.th || '').localeCompare(b.name?.th || ''));
  }

  if (params.limit && params.limit > 0) filtered = filtered.slice(0, params.limit);
  return filtered;
}

export const api = {
  // Places — Firestore is now the source of truth.
  async getPlaces(params: {
    q?: string;
    category?: string;
    region?: string;
    province?: string;
    minRating?: number;
    sort?: 'rating' | 'popular' | 'name';
    featured?: boolean;
    popular?: boolean;
    recommended?: boolean;
    limit?: number;
  } = {}): Promise<{ total: number; places: Place[] }> {
    const places = await getFirestorePlaces();
    const filtered = filterPlaces(places, params);
    return { total: filtered.length, places: filtered };
  },

  async getPlace(id: number): Promise<Place> {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firebase Firestore is not configured.');
    const snapshot = await getDoc(doc(db, 'places', String(id)));
    if (!snapshot.exists()) throw new Error('Place not found');
    return snapshot.data() as Place;
  },

  async createPlace(place: Partial<Place>): Promise<Place> {
    const db = requireFirebaseAdmin();
    const places = await getFirestorePlaces();
    const newId = places.length > 0 ? Math.max(...places.map(p => Number(p.id) || 0)) + 1 : 1;
    const newPlace = {
      ...place,
      id: newId,
      rating: Number(place.rating ?? 5),
      reviewCount: Number(place.reviewCount ?? 0),
      createdAt: new Date().toISOString(),
    } as Place;

    await setDoc(doc(db, 'places', String(newId)), newPlace);
    return newPlace;
  },

  async updatePlace(id: number, place: Partial<Place>): Promise<Place> {
    const db = requireFirebaseAdmin();
    const placeRef = doc(db, 'places', String(id));
    const snapshot = await getDoc(placeRef);
    if (!snapshot.exists()) throw new Error('Place not found');

    const updatedPlace = {
      ...snapshot.data(),
      ...place,
      id,
    } as Place;

    await setDoc(placeRef, updatedPlace);
    return updatedPlace;
  },

  async deletePlace(id: number): Promise<{
    success: boolean;
    message: string;
    submissionUpdated?: boolean;
    deletedAt?: string;
  }> {
    const db = requireFirebaseAdmin();
    const placeRef = doc(db, 'places', String(id));
    const snapshot = await getDoc(placeRef);
    if (!snapshot.exists()) throw new Error('Place not found');

    await deleteDoc(placeRef);
    const deletedAt = new Date().toISOString();
    return {
      success: true,
      message: `Place ${id} deleted successfully`,
      deletedAt,
    };
  },

  // Categories & Provinces remain configuration data for now.
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getProvinces(): Promise<ProvinceItem[]> {
    const res = await fetch('/api/provinces');
    if (!res.ok) throw new Error('Failed to fetch provinces');
    return res.json();
  },

  // Reviews
  async getReviews(params: { placeId?: number; userId?: string } = {}): Promise<Review[]> {
    const query = new URLSearchParams();
    if (params.placeId) query.append('placeId', params.placeId.toString());
    if (params.userId) query.append('userId', params.userId);

    const res = await fetch(`/api/reviews?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  async createReview(data: {
    placeId: number;
    rating: number;
    comment: string;
    userName?: string;
    userId?: string;
    userAvatar?: string;
    language?: string;
  }): Promise<Review> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return res.json();
  },

  async deleteReview(id: string): Promise<void> {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to delete review');
  },

  // Submissions (Pending Places)
  async getSubmissions(userId?: string): Promise<PendingPlace[]> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await fetch(`/api/submissions${query}`);
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return res.json();
  },

  async submitPlace(data: Partial<PendingPlace>): Promise<PendingPlace> {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit place');
    return res.json();
  },

  async approveSubmission(id: string): Promise<{ success: boolean; place: Place }> {
    const res = await fetch(`/api/submissions/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to approve submission');
    return res.json();
  },

  async rejectSubmission(id: string): Promise<void> {
    const res = await fetch(`/api/submissions/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to reject submission');
  },

  // Admin Stats
  async getAdminStats(): Promise<{
    totalPlaces: number;
    pendingSubmissions: number;
    totalReviews: number;
    totalUsers: number;
    regionalStats: { north: number; central: number; northeast: number; south: number };
  }> {
    const res = await fetch('/api/admin/stats', {
      headers: getAuthHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  // Auth & Users
  async login(email: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Failed to login');
    return res.json();
  },

  async register(name: string, email: string, role?: 'admin' | 'user'): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role }),
    });
    if (!res.ok) throw new Error('Failed to register');
    return res.json();
  },

  async logout(): Promise<void> {
    return Promise.resolve();
  },

  async toggleFavorite(userId: string, placeId: number): Promise<{ favorites: number[] }> {
    const res = await fetch('/api/users/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, placeId }),
    });
    if (!res.ok) throw new Error('Failed to update favorite');
    return res.json();
  }
};
