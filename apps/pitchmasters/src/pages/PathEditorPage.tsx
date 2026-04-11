import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getPath } from '../hooks/useLearning';
import PathEditor from '../components/lms/PathEditor';
import type { LearningPath } from '../types';

export default function PathEditorPage() {
  const { pathId } = useParams<{ pathId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clubId = user?.club_id ?? '';

  const [path, setPath] = useState<LearningPath | undefined>(undefined);
  const [loading, setLoading] = useState(!!pathId);
  const [error, setError] = useState<string | null>(null);

  const isOfficer = user?.role === 'officer' || user?.role === 'admin';

  useEffect(() => {
    if (!pathId) return;
    getPath(pathId)
      .then((p) => {
        if (!p) setError('Path not found.');
        else setPath(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [pathId]);

  if (!isOfficer) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Lock className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">Officers and admins only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-tm-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {path ? `Edit: ${path.title}` : 'New Learning Path'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/learn/admin')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Admin
        </button>
      </div>
      <PathEditor
        path={path}
        clubId={clubId}
        onSaved={(saved) => {
          setPath(saved);
          // Update URL to edit URL once created
          if (!pathId) {
            navigate(`/learn/admin/paths/${saved.id}`, { replace: true });
          }
        }}
        onCancel={() => navigate('/learn/admin')}
      />
    </div>
  );
}
