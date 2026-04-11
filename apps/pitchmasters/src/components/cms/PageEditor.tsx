import { useState, useCallback } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { Save, Globe, GlobeLock, Trash2 } from 'lucide-react';
import { PublicPage, User } from '../../types';

interface PageEditorProps {
  page?: PublicPage;
  currentUser: User;
  onSave: (page: Partial<PublicPage> & { title: string; content: any }) => Promise<PublicPage | null>;
  onPublish: (pageId: string, published: boolean) => Promise<void>;
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
  onPublish,
  onDelete,
  onCancel,
}: PageEditorProps) {
  const [title, setTitle] = useState(page?.title ?? '');
  const [slug, setSlug] = useState(page?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(!!page?.slug);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const editor = useCreateBlockNote({
    initialContent: page?.content?.length ? page.content : undefined,
  });

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    if (!slugEdited) {
      setSlug(generateSlug(value));
    }
  }, [slugEdited]);

  const handleSlugChange = useCallback((value: string) => {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
    setSlugEdited(true);
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({
        ...(page ?? {}),
        title: title.trim(),
        slug: slug || generateSlug(title),
        content: editor.document,
        published: false,
        author_id: currentUser.id,
      });
    } catch (err: any) {
      setSaveError(err.message ?? 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [title, slug, editor, page, currentUser.id, onSave]);

  const handlePublishToggle = useCallback(async () => {
    if (!page?.id) {
      // Save first, then publish
      setIsSaving(true);
      setSaveError(null);
      try {
        const saved = await onSave({
          title: title.trim(),
          slug: slug || generateSlug(title),
          content: editor.document,
          published: true,
          author_id: currentUser.id,
        });
        if (!saved) setSaveError('Failed to publish');
      } catch (err: any) {
        setSaveError(err.message ?? 'Publish failed');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsPublishing(true);
    setSaveError(null);
    try {
      // Save latest content first
      await onSave({
        ...page,
        title: title.trim(),
        slug: slug || generateSlug(title),
        content: editor.document,
        published: !page.published,
        author_id: currentUser.id,
      });
      await onPublish(page.id, !page.published);
    } catch (err: any) {
      setSaveError(err.message ?? 'Publish toggle failed');
    } finally {
      setIsPublishing(false);
    }
  }, [page, title, slug, editor, currentUser.id, onSave, onPublish]);

  const handleDelete = useCallback(async () => {
    if (!page?.id || !onDelete) return;
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await onDelete(page.id);
    } catch (err: any) {
      setSaveError(err.message ?? 'Delete failed');
      setIsDeleting(false);
    }
  }, [page, onDelete]);

  const isAdmin = currentUser.role === 'admin';
  const isPublished = page?.published ?? false;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Page title"
          className="w-full text-2xl font-montserrat font-semibold text-tm-blue border-0 border-b-2 border-gray-200 focus:border-tm-blue focus:outline-none pb-2 bg-transparent"
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
        <BlockNoteView editor={editor} theme="light" />
      </div>

      {/* Error */}
      {saveError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {saveError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSaveDraft}
          disabled={!title.trim() || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving…' : 'Save Draft'}
        </button>

        <button
          onClick={handlePublishToggle}
          disabled={!title.trim() || isPublishing || isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 min-h-[44px] ${
            isPublished
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              : 'bg-tm-blue text-white hover:bg-blue-700'
          }`}
        >
          {isPublished ? (
            <>
              <GlobeLock className="w-4 h-4" />
              {isPublishing ? 'Unpublishing…' : 'Unpublish'}
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              {isPublishing ? 'Publishing…' : 'Publish'}
            </>
          )}
        </button>

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
    </div>
  );
}
