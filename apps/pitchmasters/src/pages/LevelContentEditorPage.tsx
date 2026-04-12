import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { ChevronLeft, Save, Loader2, BookOpen, CheckCircle, AlertCircle, Eye, X } from 'lucide-react';
import { getLevel, getSkill, saveLevel } from '../hooks/useLearning';
import type { LearningLevel, LearningSkill } from '../types';

// ─── Parse content from DB ────────────────────────────────────────────────────
// The content column may come back as a JSON string (text type) or parsed object
// (jsonb type). Handle both defensively.
function parseContent(raw: any): any[] | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return undefined; }
  }
  if (Array.isArray(raw) && raw.length > 0) return raw;
  return undefined;
}

// ─── BlockNote editor wrapped in forwardRef ───────────────────────────────────
// useCreateBlockNote must be called at component top-level.
// forwardRef + useImperativeHandle lets the parent call getDocument() at save
// time (same pattern as PageEditor) instead of tracking content in state.
interface EditorHandle {
  getDocument: () => any[];
}

const ContentEditor = forwardRef<EditorHandle, { initialContent?: any[]; editable?: boolean }>(
  ({ initialContent, editable = true }, ref) => {
    const editor = useCreateBlockNote({ initialContent });

    useImperativeHandle(ref, () => ({
      getDocument: () => editor.document,
    }));

    return <BlockNoteView editor={editor} editable={editable} theme="light" />;
  }
);
ContentEditor.displayName = 'ContentEditor';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LevelContentEditorPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<EditorHandle>(null);

  const [level, setLevel] = useState<LearningLevel | null>(null);
  const [skill, setSkill] = useState<LearningSkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!levelId) return;
    setLoading(true);
    getLevel(levelId)
      .then(async (lvl) => {
        if (!lvl) return;
        setLevel(lvl);
        const sk = await getSkill(lvl.skill_id);
        setSkill(sk);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load level'))
      .finally(() => setLoading(false));
  }, [levelId]);

  const handleSave = async () => {
    if (!level) return;
    setSaving(true);
    setError(null);
    try {
      const content = editorRef.current?.getDocument() ?? null;
      await saveLevel({
        id: level.id,
        skill_id: level.skill_id,
        club_id: level.club_id,
        title: level.title,
        description: level.description,
        order_index: level.order_index,
        required_projects: level.required_projects,
        content,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const backPath = level ? `/learn/admin/skills/${level.skill_id}` : '/learn/admin';

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  // ── Not found ──
  if (!level) {
    return (
      <div className="p-8 text-center text-gray-500">
        Level not found.{' '}
        <button
          type="button"
          onClick={() => navigate('/learn/admin')}
          className="text-tm-blue underline"
        >
          Back to admin
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            {skill?.title ?? 'Back'}
          </button>
          <span className="text-gray-300 flex-shrink-0">/</span>
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-tm-blue flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400 leading-none">Learning Materials</p>
              <h1 className="text-sm font-semibold text-gray-800 truncate">{level.title}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setPreviewing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-tm-blue text-white hover:bg-blue-700 disabled:opacity-50'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Intro ── */}
      <div className="px-6 pt-4 pb-2">
        <p className="text-sm text-gray-500">
          Add text, images, videos, and file links for members to review before starting projects in this level.
        </p>
      </div>

      {/* ── Editor ── */}
      <div className="px-4 pb-8">
        <div className="mx-auto max-w-4xl border border-gray-200 rounded-xl overflow-hidden min-h-[500px] bg-white">
          <ContentEditor
            key={level.id}
            ref={editorRef}
            initialContent={parseContent(level.content)}
          />
        </div>
      </div>

      {/* ── Preview modal ── */}
      {previewing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Member view</p>
                <h2 className="text-base font-semibold text-gray-800">{level.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewing(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Read-only content */}
            <div className="px-2 py-4">
              <ContentEditor
                key={`preview-${level.id}`}
                ref={null}
                initialContent={parseContent(editorRef.current?.getDocument() ?? level.content)}
                editable={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
