import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingFallback from './components/LoadingFallback'
import Footer from './components/Footer'
import PublicLayout from './components/PublicLayout'
import JoinUsPage from './components/JoinUsPage'
import RouteTracker from './components/RouteTracker'
import { UpdatePrompt } from './components/UpdatePrompt'
import { OfflineIndicator } from './components/OfflineIndicator'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './components/LoginPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import './App.css'

// Eager load only the landing page for instant display
import Dashboard from './components/Dashboard'
import AboutPage from './components/AboutPage'

// Lazy load all other pages (loaded on demand)
const SpeakersPage = lazy(() => import('./components/SpeakersPage'))
const MemberDirectory = lazy(() => import('./components/MemberDirectory'))

// Lazy load route components for modal views
const SpeakerDetailRoute = lazy(() => import('./routes/SpeakerDetailRoute'))
const SpeakerEditRoute = lazy(() => import('./routes/SpeakerEditRoute'))
const ServiceProjectsPage = lazy(() => import('./components/ServiceProjectsPage'))
const ProjectDetailRoute = lazy(() => import('./routes/ProjectDetailRoute'))
const PartnersPage = lazy(() => import('./components/PartnersPage'))
const TimelineView = lazy(() => import('./components/TimelineView'))
const PhotoGallery = lazy(() => import('./components/PhotoGallery'))
const ImpactPage = lazy(() => import('./components/ImpactPage'))
const SpeakerBureauView = lazy(() => import('./components/SpeakerBureauView'))
const CalendarView = lazy(() => import('./components/CalendarView'))
const EventsListView = lazy(() => import('./components/EventsListView'))
const Availability = lazy(() => import('./components/Availability'))

// Development-only component for testing error boundary
const ErrorTest = import.meta.env.DEV ? lazy(() => import('./components/ErrorTest')) : null

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
          <RouteTracker />
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
                  <Route path="/join-us" element={<PublicLayout><JoinUsPage /></PublicLayout>} />

                  {/* Protected routes */}
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/members" element={<ProtectedRoute><MemberDirectory /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
                  <Route path="/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
                  <Route path="/photos" element={<ProtectedRoute><PhotoGallery /></ProtectedRoute>} />
                  <Route path="/partners" element={<ProtectedRoute><PartnersPage /></ProtectedRoute>} />
                  <Route path="/impact" element={<ProtectedRoute><ImpactPage /></ProtectedRoute>} />
                  <Route path="/speakers-bureau" element={<ProtectedRoute><SpeakerBureauView /></ProtectedRoute>} />
                  <Route path="/events-list" element={<ProtectedRoute><EventsListView /></ProtectedRoute>} />
                  <Route path="/availability" element={<ProtectedRoute><Availability /></ProtectedRoute>} />

                  {/* Projects - Nested routes */}
                  <Route path="/projects" element={<ProtectedRoute><ServiceProjectsPage /></ProtectedRoute>}>
                    <Route path=":projectId" element={<ProjectDetailRoute />} />
                  </Route>

                  {/* Speakers - Nested routes */}
                  <Route path="/speakers" element={<ProtectedRoute><SpeakersPage /></ProtectedRoute>}>
                    <Route path=":speakerId" element={<SpeakerDetailRoute />} />
                    <Route path=":speakerId/edit" element={<SpeakerEditRoute />} />
                  </Route>

                  {/* Redirects for backwards compatibility */}
                  <Route path="/service-projects" element={<Navigate to="/projects" replace />} />
                  <Route path="/speaker-bureau" element={<Navigate to="/speakers-bureau" replace />} />

                  {/* Development-only route for testing error boundary */}
                  {import.meta.env.DEV && ErrorTest && <Route path="/error-test" element={<ErrorTest />} />}
                </Routes>
              </Suspense>
            </div>
            <Footer />
          </div>

          {/* PWA Components */}
          <UpdatePrompt />
          <OfflineIndicator />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
