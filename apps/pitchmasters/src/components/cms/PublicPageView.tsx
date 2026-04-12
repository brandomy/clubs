import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { PublicPage } from '../../types';
import { cmsSchema } from './cmsSchema';

interface PublicPageViewProps {
  page: PublicPage;
}

export default function PublicPageView({ page }: PublicPageViewProps) {
  const editor = useCreateBlockNote({
    schema: cmsSchema,
    initialContent: page.content?.length ? page.content : undefined,
  });

  const updatedDate = new Date(page.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <BlockNoteView editor={editor} editable={false} theme="light" />
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">Last updated {updatedDate}</p>
    </div>
  );
}
