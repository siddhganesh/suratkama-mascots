/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  // Firebase
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  // Razorpay
  readonly VITE_RAZORPAY_KEY_ID: string
  // Google Analytics
  readonly VITE_GA_MEASUREMENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*/SplashCursor' {
  const SplashCursor: React.ComponentType<any>;
  export default SplashCursor;
}

declare module '*/Lightfall' {
  const Lightfall: React.ComponentType<any>;
  export default Lightfall;
}
