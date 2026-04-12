import { Loader } from 'lucide-react';
import PagesList from '../components/cms/PagesList';
import { usePublicPages } from '../hooks/usePublicPages';
import { useAuth } from '../hooks/useAuth';

export default function PagesListPage() {
  const { user } = useAuth();
  // Use the authenticated club_id if available; hook falls back to
  // VITE_DEMO_CLUB_ID so anonymous visitors can browse public pages.
  const clubId = user?.club_id ?? null;
  const { pages, isLoading, error, setVisibility, deletePage } = usePublicPages(clubId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-8 h-8 text-tm-blue animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Pages</h2>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <PagesList
      pages={pages}
      currentUser={user}
      onSetVisibility={setVisibility}
      onDelete={deletePage}
    />
  );
}
