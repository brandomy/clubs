import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import PageEditor from '../components/cms/PageEditor';
import { usePublicPages } from '../hooks/usePublicPages';
import { PublicPage, User } from '../types';

// Demo admin user — matches simulated auth pattern
const DEMO_ADMIN: User = {
  id: 'demo-admin',
  email: 'admin@pitchmasters.club',
  full_name: 'Demo Admin',
  club_id: 'demo-club',
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_CLUB_ID = import.meta.env.VITE_DEMO_CLUB_ID ?? null;

export default function PageEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isNew = !slug;

  const { getPage, savePage, publishPage, deletePage } = usePublicPages(DEMO_CLUB_ID);
  const [page, setPage] = useState<PublicPage | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew || !slug) return;
    setIsLoading(true);
    getPage(slug).then((result) => {
      setPage(result ?? undefined);
      setIsLoading(false);
    });
  }, [slug, isNew, getPage]);

  const handleSave = async (data: Partial<PublicPage> & { title: string; content: any }) => {
    const result = await savePage({ ...data, club_id: DEMO_CLUB_ID ?? '' });
    if (result && !page) {
      // New page saved — redirect to its edit URL
      navigate(`/pages/${result.slug}/edit`, { replace: true });
    }
    return result;
  };

  const handleDelete = async (pageId: string) => {
    await deletePage(pageId);
    navigate('/pages', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-8 h-8 text-tm-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageEditor
        page={page}
        currentUser={DEMO_ADMIN}
        onSave={handleSave}
        onPublish={publishPage}
        onDelete={handleDelete}
        onCancel={() => navigate('/pages')}
      />
    </div>
  );
}
