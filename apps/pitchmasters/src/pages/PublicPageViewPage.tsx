import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader, ArrowLeft } from 'lucide-react';
import PublicPageView from '../components/cms/PublicPageView';
import { usePublicPages } from '../hooks/usePublicPages';
import { useAuth } from '../hooks/useAuth';
import { PublicPage } from '../types';

export default function PublicPageViewPage() {
  const { slug } = useParams<{ slug: string }>();
  // Pass the user's club_id if logged in; the hook falls back to
  // VITE_DEMO_CLUB_ID for unauthenticated visitors so public pages still load.
  // RLS enforces visibility at the database level — members-only pages return
  // null for unauthenticated callers, triggering the "not found" state.
  const { user } = useAuth();
  const { getPage } = usePublicPages(user?.club_id ?? null);
  const [page, setPage] = useState<PublicPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setNotFound(false);
    setPage(null);
    getPage(slug).then((result) => {
      // Draft pages are never viewable here — only members/public
      if (!result || result.visibility === 'draft') {
        setNotFound(true);
      } else {
        setPage(result);
      }
      setIsLoading(false);
    });
  }, [slug, getPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-8 h-8 text-tm-blue animate-spin" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="max-w-2xl mx-auto mt-24 text-center">
        <h1 className="text-3xl font-jakarta font-bold text-tm-blue mb-4">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          This page doesn't exist or hasn't been published yet.
        </p>
        <Link
          to="/about"
          className="inline-flex items-center gap-2 text-tm-blue hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PublicPageView page={page} />
    </div>
  );
}
