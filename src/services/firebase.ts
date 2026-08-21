/// <reference types="vite/client" />
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from "firebase/auth";

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
