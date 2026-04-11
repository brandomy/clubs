import { Loader } from 'lucide-react';
import PagesList from '../components/cms/PagesList';
import { usePublicPages } from '../hooks/usePublicPages';
import { User } from '../types';

// Demo admin user — matches simulated auth pattern used in MembersPage
const DEMO_ADMIN: User = {
  id: 'demo-admin',
  email: 'admin@pitchmasters.club',
  full_name: 'Demo Admin',
  club_id: 'demo-club',
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Demo club ID — replace with real value once auth is wired up
const DEMO_CLUB_ID = import.meta.env.VITE_DEMO_CLUB_ID ?? null;

export default function PagesListPage() {
  const { pages, isLoading, error, publishPage, deletePage } = usePublicPages(DEMO_CLUB_ID);

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
      currentUser={DEMO_ADMIN}
      onPublish={publishPage}
      onDelete={deletePage}
    />
  );
}
