import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Eye, Globe, GlobeLock, Trash2, FileText } from 'lucide-react';
import { PublicPage, User } from '../../types';

interface PagesListProps {
  pages: PublicPage[];
  currentUser: User | null;
  onPublish: (pageId: string, published: boolean) => Promise<void>;
  onDelete: (pageId: string) => Promise<void>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PagesList({ pages, currentUser, onPublish, onDelete }: PagesListProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const isOfficerOrAdmin = currentUser?.role === 'officer' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  const handlePublishToggle = async (page: PublicPage) => {
    setLoadingId(page.id);
    setActionError(null);
    try {
      await onPublish(page.id, !page.published);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (page: PublicPage) => {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    setLoadingId(page.id);
    setActionError(null);
    try {
      await onDelete(page.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Delete failed');
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-montserrat font-semibold text-tm-blue">Club Pages</h1>
        {isOfficerOrAdmin && (
          <Link
            to="/pages/new"
            className="flex items-center gap-2 px-4 py-2 bg-tm-blue text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            New Page
          </Link>
        )}
      </div>

      {/* Error */}
      {actionError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {actionError}
        </div>
      )}

      {/* Empty state */}
      {pages.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No pages yet</p>
          {isOfficerOrAdmin && (
            <p className="text-sm mt-1">
              Create your first page — About Us, How to Visit, Club History…
            </p>
          )}
        </div>
      )}

      {/* Pages list */}
      <div className="space-y-3">
        {pages.map((page) => {
          const isLoading = loadingId === page.id;

          return (
            <div
              key={page.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-gray-900 truncate">{page.title}</h2>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        page.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {page.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    /pages/{page.slug} · Updated {formatDate(page.updated_at)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* View — only if published */}
                  {page.published && (
                    <Link
                      to={`/pages/${page.slug}`}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]"
                      title="View page"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </Link>
                  )}

                  {/* Edit — officers and admins */}
                  {isOfficerOrAdmin && (
                    <Link
                      to={`/pages/${page.slug}/edit`}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-tm-blue bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors min-h-[44px]"
                      title="Edit page"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Link>
                  )}

                  {/* Publish/Unpublish — officers and admins */}
                  {isOfficerOrAdmin && (
                    <button
                      onClick={() => handlePublishToggle(page)}
                      disabled={isLoading}
                      className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 min-h-[44px] ${
                        page.published
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                          : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                      title={page.published ? 'Unpublish' : 'Publish'}
                    >
                      {page.published ? (
                        <GlobeLock className="w-4 h-4" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {page.published ? 'Unpublish' : 'Publish'}
                      </span>
                    </button>
                  )}

                  {/* Delete — admins only */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(page)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 min-h-[44px]"
                      title="Delete page"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
