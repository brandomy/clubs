import { useState, useCallback, useRef } from 'react';
import {
  useCreateBlockNote,
  useBlockNoteEditor,
  FilePanel,
  EmbedTab,
  UploadTab,
  FilePanelController,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { Save, Globe, Lock, FileText, Trash2, CheckCircle, ChevronDown } from 'lucide-react';
import { PublicPage, PageVisibility, User } from '../../types';
import { supabase } from '../../lib/supabase';
import { cmsSchema } from './cmsSchema';

// ── Image upload ──────────────────────────────────────────────────────────────

async function uploadImage(file: File): Promise<string> {
  try {
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `pages/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('cms-images')
      .upload(path, file, { upsert: false });
    if (!error) {
      const { data } = supabase.storage.from('cms-images').getPublicUrl(path);
      return data.publicUrl;
    }
  } catch { /* fall through */ }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

// ── Custom file panel: images → Embed first; video → URL only ────────────────

function CustomFilePanel({ blockId }: { blockId: string }) {
  const editor = useBlockNoteEditor();
  const [, setLoading] = useState(false);
  const block = editor.getBlock(blockId);
  const isVideo = block?.type === 'video';

  if (isVideo) {
    return (
      <FilePanel
        blockId={blockId}
        tabs={[{ name: 'Embed', tabPanel: <EmbedTab blockId={blockId} /> }]}
        defaultOpenTab="Embed"
      />
    );
  }

  return (
    <FilePanel
      blockId={blockId}
      defaultOpenTab="Embed"
      tabs={[
        { name: 'Embed', tabPanel: <EmbedTab blockId={blockId} /> },
        { name: 'Upload', tabPanel: <UploadTab blockId={blockId} setLoading={setLoading} /> },
      ]}
    />
  );
}

// ── Visibility option config ──────────────────────────────────────────────────

const VISIBILITY_OPTIONS: {
  value: PageVisibility;
  label: string;
  description: string;
  icon: typeof Globe;
  colors: string;
}[] = [
  {
    value: 'draft',
    label: 'Draft',
    description: 'Officers & admins only',
    icon: FileText,
    colors: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  },
  {
    value: 'members',
    label: 'Members only',
    description: 'Signed-in members only',
    icon: Lock,
    colors: 'bg-blue-50 text-blue-800 hover:bg-blue-100',
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone on the internet',
    icon: Globe,
    colors: 'bg-green-50 text-green-800 hover:bg-green-100',
  },
];

// ── Visibility dropdown ───────────────────────────────────────────────────────

interface VisibilityDropdownProps {
  value: PageVisibility;
  onChange: (v: PageVisibility) => void;
  disabled?: boolean;
}

function VisibilityDropdown({ value, onChange, disabled }: VisibilityDropdownProps) {
  const [open, setOpen] = useState(false);
  const current = VISIBILITY_OPTIONS.find((o) => o.value === value)!;
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${current.colors} disabled:opacity-50`}
      >
        <Icon className="w-4 h-4" />
        {current.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            {VISIBILITY_OPTIONS.map((opt) => {
              const OptIcon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    opt.value === value ? 'bg-gray-50' : ''
                  }`}
                >
                  <OptIcon className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Editor component ──────────────────────────────────────────────────────────

interface PageEditorProps {
  page?: PublicPage;
  currentUser: User;
  onSave: (page: Partial<PublicPage> & { title: string; content: any }) => Promise<PublicPage | null>;
  onSetVisibility: (pageId: string, visibility: PageVisibility) => Promise<void>;
  onDelete?: (pageId: string) => Promise<void>;
  onCancel: () => void;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export default function PageEditor({
  page,
  currentUser,
  onSave,
  onSetVisibility,
  onDelete,
  onCancel,
}: PageEditorProps) {
  const [title, setTitle] = useState(page?.title ?? '');
  const [slug, setSlug] = useState(page?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(!!page?.slug);
  const [visibility, setVisibility] = useState<PageVisibility>(page?.visibility ?? 'draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingVisibility, setIsChangingVisibility] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useCreateBlockNote({
    schema: cmsSchema,
    initialContent: page?.content?.length ? page.content : undefined,
    uploadFile: uploadImage,
  });

  const showToast = useCallback(() => {
    setSaveSuccess(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setSaveSuccess(false), 2500);
  }, []);

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    if (!slugEdited) setSlug(generateSlug(value));
  }, [slugEdited]);

  const handleSlugChange = useCallback((value: string) => {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
    setSlugEdited(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({
        ...(page ?? {}),
        title: title.trim(),
        slug: slug || generateSlug(title),
        content: editor.document,
        visibility,
        author_id: currentUser.id,
      });
      showToast();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [title, slug, editor, page, currentUser.id, visibility, onSave, showToast]);

  const handleVisibilityChange = useCallback(async (newVisibility: PageVisibility) => {
    setVisibility(newVisibility);

    // If page exists, persist immediately; otherwise it's saved with the next Save
    if (page?.id) {
      setIsChangingVisibility(true);
      setSaveError(null);
      try {
        await onSave({
          ...page,
          title: title.trim() || page.title,
          slug: slug || page.slug,
          content: editor.document,
          visibility: newVisibility,
          author_id: currentUser.id,
        });
        await onSetVisibility(page.id, newVisibility);
        showToast();
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : 'Failed to update visibility');
        setVisibility(page.visibility); // revert
      } finally {
        setIsChangingVisibility(false);
      }
    }
  }, [page, title, slug, editor, currentUser.id, onSave, onSetVisibility, showToast]);

  const handleDelete = useCallback(async () => {
    if (!page?.id || !onDelete) return;
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await onDelete(page.id);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Delete failed');
      setIsDeleting(false);
    }
  }, [page, onDelete]);

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Page title"
          className="w-full text-2xl font-jakarta font-semibold text-tm-blue border-0 border-b-2 border-gray-200 focus:border-tm-blue focus:outline-none pb-2 bg-transparent"
        />
      </div>

      {/* Slug */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>/pages/</span>
        <input
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="page-slug"
          className="border border-gray-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-tm-blue"
        />
      </div>

      {/* BlockNote Editor */}
      <div className="border border-gray-200 rounded-lg overflow-hidden min-h-[400px]">
        <BlockNoteView editor={editor} theme="light" filePanel={false}>
          <FilePanelController filePanel={CustomFilePanel} />
        </BlockNoteView>
      </div>

      {/* Error */}
      {saveError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {saveError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 flex-wrap">
        <button
          onClick={handleSave}
          disabled={!title.trim() || isSaving || isChangingVisibility}
          className="flex items-center gap-2 px-4 py-2 bg-tm-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving…' : 'Save'}
        </button>

        <VisibilityDropdown
          value={visibility}
          onChange={handleVisibilityChange}
          disabled={isSaving || isChangingVisibility}
        />

        {isAdmin && page?.id && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 min-h-[44px] ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        )}

        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors min-h-[44px]"
        >
          Cancel
        </button>
      </div>

      {/* Save success toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg text-sm font-medium z-50">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Saved successfully
        </div>
      )}
    </div>
  );
}
