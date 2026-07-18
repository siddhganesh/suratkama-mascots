import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { User, AuthState, Booking } from '../types'
import { MOCK_USER } from '../data/mockData'
import { auth, db, isFirebaseEnabled } from '../config/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

// ── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshBookings: () => Promise<void>
  setLocalUserBookings: (bookings: Booking[]) => void
  isAdmin: boolean
}

// ── Helper: fetch admin role from Firestore ───────────────────────────────────
async function fetchUserRole(uid: string): Promise<boolean> {
  if (!db) return false
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return userDoc.data()?.role === 'admin'
    }
    return false
  } catch {
    return false
  }
}

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    if (isFirebaseEnabled) {
      return {
        user: null,
        isAuthenticated: false,
        isLoading: true, // Wait for onAuthStateChanged to resolve
      }
    }
    const token = localStorage.getItem('sk_session')
    
    // Check if a Google user was stored (by AuthPage Google OAuth flow)
    let googleUser: User | null = null
    try {
      const gStored = localStorage.getItem('sk_google_user')
      if (gStored && token?.startsWith('google-')) {
        googleUser = JSON.parse(gStored) as User
      }
    } catch { /* ignore */ }

    let localBookings: Booking[] = []
    try {
      const stored = localStorage.getItem('sk_bookings')
      if (stored) {
        localBookings = JSON.parse(stored)
      } else {
        localBookings = MOCK_USER.bookings
        localStorage.setItem('sk_bookings', JSON.stringify(localBookings))
      }
    } catch {
      localBookings = MOCK_USER.bookings
    }

    const resolvedUser = token
      ? googleUser
        ? { ...googleUser, bookings: localBookings }
        : { ...MOCK_USER, bookings: localBookings }
      : null

    return {
      user: resolvedUser,
      isAuthenticated: !!token,
      isLoading: false,
    }
  })

  // Refresh bookings helper (e.g., after booking completion)
  const refreshBookings = useCallback(async () => {
    if (!state.user) return

    if (isFirebaseEnabled && db) {
      try {
        const q = query(collection(db, 'bookings'), where('userId', '==', state.user.id))
        const querySnapshot = await getDocs(q)
        const fbBookings = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Booking))
        fbBookings.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
        
        setState(s => {
          if (!s.user) return s
          return {
            ...s,
            user: {
              ...s.user,
              bookings: fbBookings
            }
          }
        })
      } catch (e) {
        console.error('Error refreshing bookings from Firestore:', e)
      }
    } else {
      // Local fallback refresh
      try {
        const stored = localStorage.getItem('sk_bookings')
        const localBookings = stored ? JSON.parse(stored) : []
        setState(s => {
          if (!s.user) return s
          return {
            ...s,
            user: {
              ...s.user,
              bookings: localBookings
            }
          }
        })
      } catch (e) {
        console.error('Error refreshing local bookings:', e)
      }
    }
  }, [state.user])

  // Helper to update bookings array in local state directly
  const setLocalUserBookings = useCallback((bookings: Booking[]) => {
    setState(s => {
      if (!s.user) return s
      return {
        ...s,
        user: {
          ...s.user,
          bookings
        }
      }
    })
  }, [])

  // Sync auth state with Firebase Auth if enabled
  useEffect(() => {
    if (!isFirebaseEnabled || !auth) {
      // If Firebase is disabled or fails to load, ensure loading turns off
      if (state.isLoading) {
        setState(s => ({ ...s, isLoading: false }))
      }
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let fbBookings: Booking[] = []
        let isAdmin = false
        if (db) {
          try {
            const q = query(collection(db, 'bookings'), where('userId', '==', firebaseUser.uid))
            const querySnapshot = await getDocs(q)
            fbBookings = querySnapshot.docs.map(d => ({
              id: d.id,
              ...d.data()
            } as Booking))
            fbBookings.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
            isAdmin = await fetchUserRole(firebaseUser.uid)
          } catch (e) {
            console.error('Error fetching bookings on login:', e)
          }
        }

        setState({
          user: {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Attendee',
            email: firebaseUser.email || '',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}&backgroundColor=b6e3f4`,
            joinedAt: firebaseUser.metadata.creationTime
              ? new Date(firebaseUser.metadata.creationTime).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            bookings: fbBookings,
            isAdmin,
          },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    })

    return () => unsubscribe()
  }, [])

  /** Login handler */
  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, isLoading: true }))

    if (isFirebaseEnabled && auth) {
      try {
        await signInWithEmailAndPassword(auth, email, password)
        return { success: true }
      } catch (error: any) {
        setState(s => ({ ...s, isLoading: false }))
        const errMsg = error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential'
          ? 'Invalid email or password combination.'
          : error.message || 'Authentication failed.'
        return { success: false, error: errMsg }
      }
    } else {
      // Simulated mock login — accepts any passwords
      await new Promise(r => setTimeout(r, 950))

      if (!email.includes('@')) {
        setState(s => ({ ...s, isLoading: false }))
        return { success: false, error: 'Please enter a valid email address.' }
      }

      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock'
      localStorage.setItem('sk_session', mockToken)
      
      let localBookings: Booking[] = []
      try {
        const stored = localStorage.getItem('sk_bookings')
        localBookings = stored ? JSON.parse(stored) : MOCK_USER.bookings
      } catch {
        localBookings = MOCK_USER.bookings
      }

      setState({
        user: { ...MOCK_USER, email, bookings: localBookings },
        isAuthenticated: true,
        isLoading: false,
      })
      return { success: true }
    }
  }, [])

  /** Sign-up handler */
  const signup = useCallback(async (name: string, email: string, password: string) => {
    setState(s => ({ ...s, isLoading: true }))

    if (isFirebaseEnabled && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(userCredential.user, { displayName: name })
        
        // Update user name inside state
        setState(s => {
          if (s.user) {
            return {
              ...s,
              user: { ...s.user, name },
              isLoading: false
            }
          }
          return s
        })
        return { success: true }
      } catch (error: any) {
        setState(s => ({ ...s, isLoading: false }))
        const errMsg = error.code === 'auth/email-already-in-use'
          ? 'An account with this email address already exists.'
          : error.message || 'Registration failed.'
        return { success: false, error: errMsg }
      }
    } else {
      // Simulated mock signup
      await new Promise(r => setTimeout(r, 1100))

      if (!email.includes('@')) {
        setState(s => ({ ...s, isLoading: false }))
        return { success: false, error: 'Please enter a valid email address.' }
      }

      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock'
      localStorage.setItem('sk_session', mockToken)
      localStorage.setItem('sk_bookings', JSON.stringify([])) // Clear/new booking history for signup

      const newUser: User = {
        id: `usr-${Math.random().toString(36).substring(2, 9)}`,
        name,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`,
        joinedAt: new Date().toISOString().split('T')[0],
        bookings: []
      }

      setState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
      })
      return { success: true }
    }
  }, [])

  /** Logout handler */
  const logout = useCallback(async () => {
    if (isFirebaseEnabled && auth) {
      try {
        await signOut(auth)
      } catch (error) {
        console.error('Error logging out of Firebase:', error)
      }
    } else {
      localStorage.removeItem('sk_session')
      localStorage.removeItem('sk_google_user')
      sessionStorage.removeItem('sk_session')
      setState({ user: null, isAuthenticated: false, isLoading: false })
    }
  }, [])

  const isAdmin = state.user?.isAdmin === true

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, refreshBookings, setLocalUserBookings, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
