import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Helper to check if credentials are valid and not placeholders
const hasValidConfig = () => {
  const keys = Object.keys(firebaseConfig) as Array<keyof typeof firebaseConfig>
  return keys.every(key => {
    const value = firebaseConfig[key]
    return (
      value && 
      value !== '' && 
      !value.includes('your_') && 
      !value.includes('your-')
    );
  })
}

export let app: ReturnType<typeof initializeApp> | null = null
export let auth: Auth | null = null
export let db: Firestore | null = null
export let storage: FirebaseStorage | null = null
export let isFirebaseEnabled = false

if (hasValidConfig()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    isFirebaseEnabled = true
    console.log('🔥 Firebase successfully initialized (Auth + Firestore + Storage)!')
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error)
    isFirebaseEnabled = false
  }
} else {
  console.warn(
    '⚠️ Firebase configuration is incomplete or contains placeholders. ' +
    'Falling back to simulated/local mock services.'
  )
  isFirebaseEnabled = false
}
