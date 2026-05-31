import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase must only initialize in the browser — never during SSR
function createFirebase() {
  try {
    const app = getApps()[0] ?? initializeApp(firebaseConfig)
    return {
      auth: getAuth(app),
      db: getFirestore(app),
      googleProvider: new GoogleAuthProvider(),
      configured: true,
    }
  } catch {
    return {
      auth: null as unknown as Auth,
      db: null as unknown as Firestore,
      googleProvider: null as unknown as GoogleAuthProvider,
      configured: false,
    }
  }
}

const fb = typeof window !== 'undefined'
  ? createFirebase()
  : { auth: null as unknown as Auth, db: null as unknown as Firestore, googleProvider: null as unknown as GoogleAuthProvider, configured: false }

export const auth = fb.auth
export const db = fb.db
export const googleProvider = fb.googleProvider
export const firebaseConfigured = fb.configured
