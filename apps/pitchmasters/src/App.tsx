import { lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MembersPage from './pages/MembersPage';
import MemberProfilePage from './pages/MemberProfilePage';
import CommunityPage from './pages/CommunityPage';
import PagesListPage from './pages/PagesListPage';
const FaviconTestPage = import.meta.env.DEV ? lazy(() => import('./pages/FaviconTestPage')) : null;
import PublicPageViewPage from './pages/PublicPageViewPage';
import PageEditorPage from './pages/PageEditorPage';
import LearningDashboard from './pages/LearningDashboard';
import ProjectView from './pages/ProjectView';
import LearningAdmin from './pages/LearningAdmin';
import PathEditorPage from './pages/PathEditorPage';
import EvaluationTemplates from './pages/EvaluationTemplates';
import LearningAnalyticsPage from './pages/LearningAnalyticsPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
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
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes — wrapped in Layout */}
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><Layout><MembersPage /></Layout></ProtectedRoute>} />
      <Route path="/members/:memberId" element={<ProtectedRoute><Layout><MemberProfilePage /></Layout></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Layout><CommunityPage /></Layout></ProtectedRoute>} />
      <Route path="/pages" element={<ProtectedRoute><Layout><PagesListPage /></Layout></ProtectedRoute>} />
      <Route path="/pages/new" element={<ProtectedRoute><Layout><PageEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/pages/:slug/edit" element={<ProtectedRoute><Layout><PageEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/pages/:slug" element={<ProtectedRoute><Layout><PublicPageViewPage /></Layout></ProtectedRoute>} />

      {/* LMS — member-facing */}
      <Route path="/learn" element={<ProtectedRoute><Layout><LearningDashboard /></Layout></ProtectedRoute>} />
      <Route path="/learn/:pathSlug" element={<ProtectedRoute><Layout><LearningDashboard /></Layout></ProtectedRoute>} />
      <Route path="/learn/:pathSlug/project/:projectId" element={<ProtectedRoute><Layout><ProjectView /></Layout></ProtectedRoute>} />

      {/* LMS — officer/admin */}
      <Route path="/learn/admin" element={<ProtectedRoute><Layout><LearningAdmin /></Layout></ProtectedRoute>} />
      <Route path="/learn/admin/paths/new" element={<ProtectedRoute><Layout><PathEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/learn/admin/paths/:pathId" element={<ProtectedRoute><Layout><PathEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/learn/admin/templates" element={<ProtectedRoute><Layout><EvaluationTemplates /></Layout></ProtectedRoute>} />
      <Route path="/learn/admin/analytics" element={<ProtectedRoute><Layout><LearningAnalyticsPage /></Layout></ProtectedRoute>} />

      {/* Dev-only favicon test */}
      {import.meta.env.DEV && FaviconTestPage && (
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
