import { lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
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
import SkillEditorPage from './pages/SkillEditorPage';
import EvaluationTemplates from './pages/EvaluationTemplates';
import LearningAnalyticsPage from './pages/LearningAnalyticsPage';
import LevelContentEditorPage from './pages/LevelContentEditorPage';
import MeetingsPage from './pages/MeetingsPage';
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
      {/* Public routes — no auth required */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/about" element={<Navigate to="/pages/about" replace />} />
      <Route path="/p/:slug" element={<PublicLayout><PublicPageViewPage /></PublicLayout>} />
      <Route path="/pages" element={<Layout><PagesListPage /></Layout>} />
      <Route path="/pages/:slug" element={<Layout><PublicPageViewPage /></Layout>} />

      {/* Protected routes — members only */}
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/meetings" element={<ProtectedRoute><Layout><MeetingsPage /></Layout></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><Layout><MembersPage /></Layout></ProtectedRoute>} />
      <Route path="/members/:memberId" element={<ProtectedRoute><Layout><MemberProfilePage /></Layout></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Layout><CommunityPage /></Layout></ProtectedRoute>} />
      <Route path="/pages/new" element={<ProtectedRoute><Layout><PageEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/pages/:slug/edit" element={<ProtectedRoute><Layout><PageEditorPage /></Layout></ProtectedRoute>} />

      {/* LMS — member-facing */}
      <Route path="/learn" element={<ProtectedRoute><Layout><LearningDashboard /></Layout></ProtectedRoute>} />
      <Route path="/learn/:skillSlug" element={<ProtectedRoute><Layout><LearningDashboard /></Layout></ProtectedRoute>} />
      <Route path="/learn/:skillSlug/project/:projectId" element={<ProtectedRoute><Layout><ProjectView /></Layout></ProtectedRoute>} />

      {/* LMS — officer/admin */}
      <Route path="/learn/admin" element={<ProtectedRoute><Layout><LearningAdmin /></Layout></ProtectedRoute>} />
      <Route path="/learn/admin/skills/new" element={<ProtectedRoute><Layout><SkillEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/learn/admin/skills/:skillId" element={<ProtectedRoute><Layout><SkillEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/learn/admin/levels/:levelId/content" element={<ProtectedRoute><Layout><LevelContentEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/learn/admin/templates" element={<ProtectedRoute><Layout><EvaluationTemplates /></Layout></ProtectedRoute>} />
      <Route path="/learn/admin/analytics" element={<ProtectedRoute><Layout><LearningAnalyticsPage /></Layout></ProtectedRoute>} />

      {/* Dev-only favicon test */}
      {import.meta.env.DEV && FaviconTestPage && (
        <Route path="/favicon-test" element={<Layout><FaviconTestPage /></Layout>} />
      )}

      <Route path="*" element={<Navigate to="/pages/about" replace />} />
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
