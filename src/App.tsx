import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

// Lazy loaded page components
const LandingPage = lazy(() => import('./pages/LandingPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

// Page transition wrapper
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

// Premium visual route loader fallback
function RouteLoader() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center pt-24 text-center">
      <div className="relative w-14 h-14 mb-5">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-electric/10" />
        <div className="absolute inset-0 rounded-full border-2 border-t-indigo-electric border-r-indigo-electric animate-spin shadow-[0_0_15px_rgba(79,70,229,0.35)]" />
      </div>
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-[0.2em] animate-pulse">
        Setting up the stage...
      </p>
    </div>
  )
}

// Admin route guard
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, isAuthenticated } = useAuth()
  if (isLoading) return <RouteLoader />
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

// Pages that should not show the Navbar/Footer
const ADMIN_ROUTES = ['/admin']
const NO_FOOTER_ROUTES = ['/auth', '/admin']

export default function App() {
  const location = useLocation()
  const showFooter = !NO_FOOTER_ROUTES.some(r => location.pathname.startsWith(r))
  const showNavbar = !ADMIN_ROUTES.some(r => location.pathname.startsWith(r))

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        {showNavbar && <Navbar />}
        <main className="flex-1">
          <Suspense fallback={<RouteLoader />}>
            <AnimatePresence mode="wait" initial={false}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
                <Route path="/events" element={<PageWrapper><EventsPage /></PageWrapper>} />
                <Route path="/events/:id" element={<PageWrapper><EventDetailPage /></PageWrapper>} />
                <Route path="/book" element={<PageWrapper><BookingPage /></PageWrapper>} />
                <Route path="/auth" element={<PageWrapper><AuthPage /></PageWrapper>} />
                <Route path="/profile" element={<PageWrapper><ProfilePage /></PageWrapper>} />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                } />
                {/* 404 fallback */}
                <Route path="*" element={
                  <PageWrapper>
                    <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-4">
                      <div className="text-8xl mb-6">🎭</div>
                      <h1 className="font-heading font-black text-5xl text-white mb-3">404</h1>
                      <p className="text-gray-400 text-lg mb-8 max-w-md">
                        Looks like this page took a wrong turn. Let's get you back to the show.
                      </p>
                      <a href="/" className="btn-primary text-base px-8 py-3.5">Back to Home</a>
                    </div>
                  </PageWrapper>
                } />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </main>
        {showFooter && <Footer />}
      </div>
    </AuthProvider>
  )
}
