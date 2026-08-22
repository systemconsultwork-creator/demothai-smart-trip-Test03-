/// <reference types="vite/client" />
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc, Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth, User as FirebaseUser } from "firebase/auth";
import { isAdminEmail } from "../config/admin";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!apiKey) return null;
  if (!app) app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  return app;
};

export const getFirebaseDb = (): Firestore | null => {
  if (dbInstance) return dbInstance;
  const firebaseApp = getFirebaseApp();
  if (firebaseApp) dbInstance = getFirestore(firebaseApp);
  return dbInstance;
};

export const getFirebaseAuth = (): Auth | null => {
  if (authInstance) return authInstance;
  const firebaseApp = getFirebaseApp();
  if (firebaseApp) authInstance = getAuth(firebaseApp);
  return authInstance;
};

export const db = typeof window !== 'undefined' ? getFirebaseDb() : null;
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : null;
export const googleProvider = new GoogleAuthProvider();

export interface FirestoreUserProfile {
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
  createdAt: string;
  favorites: number[];
}

/**
 * The admin role is derived from the single designated admin email.
 * A normal Google account can never become admin by changing a client-side role value.
 */
export const ensureFirestoreUser = async (
  firebaseUser: FirebaseUser
): Promise<FirestoreUserProfile> => {
  const currentDb = getFirebaseDb();
  if (!currentDb) throw new Error('Firebase Firestore is not configured.');

  const userRef = doc(currentDb, 'users', firebaseUser.uid);
  const snapshot = await getDoc(userRef);
  const verifiedRole: 'admin' | 'user' = isAdminEmail(firebaseUser.email) ? 'admin' : 'user';

  if (snapshot.exists()) {
    const data = snapshot.data();
    const storedFavorites = Array.isArray(data.favorites)
      ? data.favorites.filter((id): id is number => typeof id === 'number')
      : [];

    return {
      name: typeof data.name === 'string'
        ? data.name
        : firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Explorer',
      email: typeof data.email === 'string' ? data.email : firebaseUser.email || '',
      avatar: typeof data.avatar === 'string'
        ? data.avatar
        : firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: verifiedRole,
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
      favorites: storedFavorites,
    };
  }

  const newProfile: FirestoreUserProfile = {
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Explorer',
    email: firebaseUser.email || '',
    avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    role: verifiedRole,
    createdAt: new Date().toISOString(),
    favorites: [],
  };

  await setDoc(userRef, newProfile);
  return newProfile;
};

export const loginWithGoogle = async () => {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth || !apiKey) {
    const error: any = new Error('Firebase Authentication is not configured with a valid API key.');
    error.code = 'auth/api-key-not-valid';
    throw error;
  }
  return signInWithPopup(currentAuth, googleProvider).then(result => result.user);
};

export const logout = async () => {
  const currentAuth = getFirebaseAuth();
  if (currentAuth) await signOut(currentAuth);
};
