import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader, ArrowLeft } from 'lucide-react';
import PublicPageView from '../components/cms/PublicPageView';
import { usePublicPages } from '../hooks/usePublicPages';
import { PublicPage } from '../types';

const DEMO_CLUB_ID = import.meta.env.VITE_DEMO_CLUB_ID ?? null;

export default function PublicPageViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getPage } = usePublicPages(DEMO_CLUB_ID);
  const [page, setPage] = useState<PublicPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    getPage(slug).then((result) => {
      if (!result || (!result.published)) {
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
        <h1 className="text-3xl font-montserrat font-bold text-tm-blue mb-4">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          This page doesn't exist or hasn't been published yet.
        </p>
        <Link
          to="/pages"
          className="inline-flex items-center gap-2 text-tm-blue hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pages
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/pages"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-tm-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Pages
        </Link>
      </div>
      <PublicPageView page={page} />
    </div>
  );
}
