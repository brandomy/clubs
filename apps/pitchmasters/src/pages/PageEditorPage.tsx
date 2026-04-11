import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import PageEditor from '../components/cms/PageEditor';
import { usePublicPages } from '../hooks/usePublicPages';
import { useAuth } from '../hooks/useAuth';
import { PublicPage } from '../types';

export default function PageEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isNew = !slug;

  const { user } = useAuth();
  const clubId = user?.club_id ?? null;

  const { getPage, savePage, publishPage, deletePage } = usePublicPages(clubId);
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
    const result = await savePage({ ...data, club_id: clubId ?? '' });
    if (result && !page) {
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

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <PageEditor
        page={page}
        currentUser={user}
        onSave={handleSave}
        onPublish={publishPage}
        onDelete={handleDelete}
        onCancel={() => navigate('/pages')}
      />
    </div>
  );
}
