export type Language = 'th' | 'en' | 'zh';

export interface MultiLangString {
  th: string;
  en: string;
  zh: string;
}

export interface Category {
  id: string;
  name: MultiLangString;
  icon: string;
  description: MultiLangString;
  count?: number;
}

export interface Region {
  id: string;
  name: MultiLangString;
  color: string;
  bannerImage: string;
  provincesCount: number;
}

export interface Place {
  id: number;
  name: MultiLangString;
  province: MultiLangString;
  category: MultiLangString;
  categoryId: string;
  region: MultiLangString;
  regionId: string;
  description: MultiLangString;
  rating: number;
  reviewCount: number;
  price: MultiLangString;
  hours: string;
  lat: number;
  lng: number;
  images: string[];
  featured?: boolean;
  popular?: boolean;
  recommended?: boolean;
  address?: MultiLangString;
  contact?: string;
  location?: {
    map_url?: string;
  };
  tags?: string[];
  createdAt?: string;
}

export interface Review {
  id: string;
  placeId: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  language: string;
  createdAt: string;
}

export interface PendingPlace {
  id: string;
  name: MultiLangString;
  province: MultiLangString;
  category: MultiLangString;
  categoryId: string;
  region: MultiLangString;
  regionId: string;
  description: MultiLangString;
  rating?: number;
  reviewCount?: number;
  price: MultiLangString;
  hours: string;
  lat?: number;
  lng?: number;
  images: string[];
  submittedBy: {
    userId: string;
    userName: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
  favorites: number[];
}

export interface ProvinceItem {
  id: string;
  name: MultiLangString;
  regionId: string;
}
