import { Loader, Users } from 'lucide-react';
import MemberDirectory from '../components/MemberDirectory';
import { useMembersData } from '../hooks/useMembersData';
import { useAuth } from '../hooks/useAuth';

export default function MembersPage() {
  const { members, isLoading, error } = useMembersData();
  const { user } = useAuth();

  const currentUser = user ?? undefined;
  const isAuthenticated = !!user;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-tm-blue animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Data</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-tm-blue" />
              <h1 className="text-2xl sm:text-[2rem] font-bold text-gray-900">Member Directory</h1>
            </div>
            <p className="text-gray-500 max-w-3xl">
              Connect with fellow entrepreneurs and club members. All member information shown
              respects individual privacy settings and visibility preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Member Directory Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MemberDirectory
          members={members}
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}
