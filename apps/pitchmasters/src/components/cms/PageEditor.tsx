import { useState, useCallback, useRef } from 'react';
import {
  useCreateBlockNote,
  useBlockNoteEditor,
  FilePanel,
  EmbedTab,
  UploadTab,
  FilePanelController,
  createReactBlockSpec,
  ResizableFileBlockWrapper,
  type ReactCustomBlockRenderProps,
} from '@blocknote/react';
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  createVideoBlockConfig,
  videoParse,
} from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { Save, Globe, GlobeLock, Trash2, CheckCircle, Video } from 'lucide-react';
import { PublicPage, User } from '../../types';
import { supabase } from '../../lib/supabase';

// ── Custom video block: YouTube/Vimeo iframe + S/M/L size picker ──────────────

function getEmbedInfo(url: string): { kind: 'iframe'; src: string } | { kind: 'video'; src: string } | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/);
  if (ytMatch) return { kind: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  return { kind: 'video', src: url };
}

function CustomVideoBlock(props: ReactCustomBlockRenderProps<typeof createVideoBlockConfig>) {
  const url = props.block.props.url;
  const embed = url ? getEmbedInfo(url) : null;

  return (
    <ResizableFileBlockWrapper {...(props as any)} buttonIcon={<Video size={24} />}>
      {embed?.kind === 'iframe' ? (
        <iframe
          src={embed.src}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
        />
      ) : embed?.kind === 'video' ? (
        <video className="bn-visual-media" src={embed.src} controls draggable={false} />
      ) : null}
    </ResizableFileBlockWrapper>
  );
}

const customVideoBlockSpec = createReactBlockSpec(
  createVideoBlockConfig,
  (config) => ({
    render: CustomVideoBlock,
    parse: videoParse(config),
  }),
);

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    video: customVideoBlockSpec(),
  },
});

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

// ── Editor component ──────────────────────────────────────────────────────────

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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useCreateBlockNote({
    schema,
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
        published: page?.published ?? false,
        author_id: currentUser.id,
      });
      showToast();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [title, slug, editor, page, currentUser.id, onSave, showToast]);

  const handlePublishToggle = useCallback(async () => {
    if (!page?.id) {
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
        else showToast();
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : 'Publish failed');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsPublishing(true);
    setSaveError(null);
    try {
      await onSave({
        ...page,
        title: title.trim(),
        slug: slug || generateSlug(title),
        content: editor.document,
        published: !page.published,
        author_id: currentUser.id,
      });
      await onPublish(page.id, !page.published);
      showToast();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Publish toggle failed');
    } finally {
      setIsPublishing(false);
    }
  }, [page, title, slug, editor, currentUser.id, onSave, onPublish, showToast]);

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
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSaveDraft}
          disabled={!title.trim() || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving…' : isPublished ? 'Save' : 'Save Draft'}
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

      {/* Save success toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg text-sm font-medium animate-fade-in z-50">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Saved successfully
        </div>
      )}
    </div>
  );
}
