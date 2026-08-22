/// <reference types="vite/client" />
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc, Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth, User as FirebaseUser } from "firebase/auth";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: apiKey,
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
  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseDb = (): Firestore | null => {
  if (dbInstance) return dbInstance;
  const firebaseApp = getFirebaseApp();
  if (firebaseApp) {
    dbInstance = getFirestore(firebaseApp);
  }
  return dbInstance;
};

export const getFirebaseAuth = (): Auth | null => {
  if (authInstance) return authInstance;
  const firebaseApp = getFirebaseApp();
  if (firebaseApp) {
    authInstance = getAuth(firebaseApp);
  }
  return authInstance;
};

// Safe legacy getters/proxies for compatibility
export const db = typeof window !== 'undefined' ? getFirebaseDb() : null;
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : null;

export const googleProvider = new GoogleAuthProvider();

export interface FirestoreUserProfile {
  name: string;
  email: string;
  avatar: string;
  role?: 'admin' | 'user';
  createdAt: string;
}

/**
 * STEP 2: Ensure the authenticated user's Firestore profile exists.
 *
 * Existing documents are read without being overwritten. New users get
 * a single profile document keyed by their Firebase UID.
 * Favorite synchronization is intentionally handled in a later step.
 */
export const ensureFirestoreUser = async (
  firebaseUser: FirebaseUser,
  role: 'admin' | 'user'
): Promise<FirestoreUserProfile> => {
  const currentDb = getFirebaseDb();
  if (!currentDb) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const userRef = doc(currentDb, 'users', firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data();

    return {
      name: typeof data.name === 'string'
        ? data.name
        : firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Explorer',
      email: typeof data.email === 'string'
        ? data.email
        : firebaseUser.email || '',
      avatar: typeof data.avatar === 'string'
        ? data.avatar
        : firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: data.role === 'admin' || data.role === 'user' ? data.role : role,
      createdAt: typeof data.createdAt === 'string'
        ? data.createdAt
        : new Date().toISOString(),
    };
  }

  const newProfile: FirestoreUserProfile = {
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Explorer',
    email: firebaseUser.email || '',
    avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    role,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userRef, newProfile);
  return newProfile;
};

export const loginWithGoogle = async () => {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth || !apiKey) {
    const error: any = new Error("Firebase Authentication is not configured with a valid API key.");
    error.code = "auth/api-key-not-valid";
    throw error;
  }
  try {
    const result = await signInWithPopup(currentAuth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Suppress unhandled crash logs if expected user cancellations or config warnings
    if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
      console.warn("Google login notification:", error?.message || error);
    }
    throw error;
  }
};

export const logout = () => {
  const currentAuth = getFirebaseAuth();
  if (currentAuth) {
    return signOut(currentAuth);
  }
  return Promise.resolve();
};
