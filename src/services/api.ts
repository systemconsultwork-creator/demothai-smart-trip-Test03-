import { Place, Category, ProvinceItem, Review, PendingPlace, User } from '../types';

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

export const api = {
  // Places
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
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.region && params.region !== 'all') query.append('region', params.region);
    if (params.province && params.province !== 'all') query.append('province', params.province);
    if (params.minRating) query.append('minRating', params.minRating.toString());
    if (params.sort) query.append('sort', params.sort);
    if (params.featured) query.append('featured', 'true');
    if (params.popular) query.append('popular', 'true');
    if (params.recommended) query.append('recommended', 'true');
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`/api/places?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch places');
    return res.json();
  },

  async getPlace(id: number): Promise<Place> {
    const res = await fetch(`/api/places/${id}`);
    if (!res.ok) throw new Error('Place not found');
    return res.json();
  },

  async createPlace(place: Partial<Place>): Promise<Place> {
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(place),
    });
    if (!res.ok) throw new Error('Failed to create place');
    return res.json();
  },

  async updatePlace(id: number, place: Partial<Place>): Promise<Place> {
    const res = await fetch(`/api/places/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: JSON.stringify(place),
    });
    if (!res.ok) throw new Error('Failed to update place');
    return res.json();
  },

  async deletePlace(id: number): Promise<{
    success: boolean;
    message: string;
    submissionUpdated?: boolean;
    deletedAt?: string;
  }> {
    const res = await fetch(`/api/places/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    if (!res.ok) {
      let message = 'Failed to delete place';
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch (e) {}
      throw new Error(message);
    }
    return res.json();
  },

  // Categories & Provinces
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
