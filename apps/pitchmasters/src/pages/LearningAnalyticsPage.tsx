import { Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LearningAnalytics from '../components/lms/LearningAnalytics';

export default function LearningAnalyticsPage() {
  const { user } = useAuth();
  const isOfficer = user?.role === 'officer' || user?.role === 'admin';

  if (!isOfficer) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Lock className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">Officers and admins only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <LearningAnalytics />
    </div>
  );
}
