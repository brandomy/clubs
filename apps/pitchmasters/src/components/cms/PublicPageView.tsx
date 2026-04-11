import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { PublicPage } from '../../types';

interface PublicPageViewProps {
  page: PublicPage;
}

export default function PublicPageView({ page }: PublicPageViewProps) {
  const editor = useCreateBlockNote({
    initialContent: page.content?.length ? page.content : undefined,
  });

  const updatedDate = new Date(page.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-montserrat font-bold text-tm-blue mb-2">{page.title}</h1>
        <p className="text-sm text-gray-500">Last updated {updatedDate}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <BlockNoteView editor={editor} editable={false} theme="light" />
      </div>
    </div>
  );
}
