import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Loader2, ClipboardList } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  listEvaluationTemplates,
  deleteEvaluationTemplate,
} from '../hooks/useLearning';
import EvaluationTemplateEditor from '../components/lms/EvaluationTemplateEditor';
import type { EvaluationTemplate } from '../types';

export default function EvaluationTemplates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clubId = user?.club_id ?? '';

  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EvaluationTemplate | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) return;
    listEvaluationTemplates(clubId)
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clubId]);

  const handleSaved = (saved: EvaluationTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev];
    });
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteEvaluationTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto">
        <EvaluationTemplateEditor
          template={editing === 'new' ? undefined : editing}
          clubId={clubId}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Evaluation Templates
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/learn/admin')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Admin
          </button>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tm-blue text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-tm-blue" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No evaluation templates yet.</p>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="mt-3 text-sm text-tm-blue hover:underline"
          >
            Create the first template →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{t.name}</p>
                {t.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{t.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {t.fields.length} field{t.fields.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:border-tm-blue hover:text-tm-blue transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  disabled={deletingId === t.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  {deletingId === t.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
