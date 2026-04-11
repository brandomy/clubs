import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MembersPage from './pages/MembersPage';
import MemberProfilePage from './pages/MemberProfilePage';
import CommunityPage from './pages/CommunityPage';
import FaviconTestPage from './pages/FaviconTestPage';
import PagesListPage from './pages/PagesListPage';
import PublicPageViewPage from './pages/PublicPageViewPage';
import PageEditorPage from './pages/PageEditorPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';
import { UpdatePrompt } from './components/UpdatePrompt';
import { OfflineIndicator } from './components/OfflineIndicator';

function AppRoutes() {
  const { logMetrics, isGoodLCP, isGoodCLS, isGoodFCP } = usePerformanceMetrics();

  useEffect(() => {
    if (import.meta.env.DEV) {
      const timer = setTimeout(() => {
        logMetrics();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [logMetrics, isGoodLCP, isGoodCLS, isGoodFCP]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes — wrapped in Layout */}
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><Layout><MembersPage /></Layout></ProtectedRoute>} />
      <Route path="/members/:memberId" element={<ProtectedRoute><Layout><MemberProfilePage /></Layout></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Layout><CommunityPage /></Layout></ProtectedRoute>} />
      <Route path="/pages" element={<ProtectedRoute><Layout><PagesListPage /></Layout></ProtectedRoute>} />
      <Route path="/pages/new" element={<ProtectedRoute><Layout><PageEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/pages/:slug/edit" element={<ProtectedRoute><Layout><PageEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/pages/:slug" element={<ProtectedRoute><Layout><PublicPageViewPage /></Layout></ProtectedRoute>} />

      {/* Dev-only favicon test */}
      {import.meta.env.DEV && (
        <Route path="/favicon-test" element={<Layout><FaviconTestPage /></Layout>} />
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      <UpdatePrompt />
      <OfflineIndicator />
    </>
  );
}

export default App;
