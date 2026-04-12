import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Eye, Globe, Lock, FileText, Trash2 } from 'lucide-react';
import { PublicPage, PageVisibility, User } from '../../types';

interface PagesListProps {
  pages: PublicPage[];
  currentUser: User | null;
  onSetVisibility: (pageId: string, visibility: PageVisibility) => Promise<void>;
  onDelete: (pageId: string) => Promise<void>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const VISIBILITY_BADGE: Record<PageVisibility, { label: string; classes: string; Icon: typeof Globe }> = {
  draft:   { label: 'Draft',        classes: 'bg-gray-100 text-gray-600',   Icon: FileText },
  members: { label: 'Members only', classes: 'bg-blue-100 text-blue-800',   Icon: Lock },
  public:  { label: 'Public',       classes: 'bg-green-100 text-green-800', Icon: Globe },
};

// Cycle: draft → members → public → draft
const NEXT_VISIBILITY: Record<PageVisibility, PageVisibility> = {
  draft: 'members',
  members: 'public',
  public: 'draft',
};

const NEXT_VISIBILITY_LABEL: Record<PageVisibility, string> = {
  draft: 'Make members-only',
  members: 'Make public',
  public: 'Make draft',
};

export default function PagesList({ pages, currentUser, onSetVisibility, onDelete }: PagesListProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const isOfficerOrAdmin = currentUser?.role === 'officer' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  const handleVisibilityCycle = async (page: PublicPage) => {
    setLoadingId(page.id);
    setActionError(null);
    try {
      await onSetVisibility(page.id, NEXT_VISIBILITY[page.visibility]);
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
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-jakarta font-semibold text-tm-blue">Club Pages</h1>
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

      {/* Visibility legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
        <span className="font-medium text-gray-600 mr-1">Visibility:</span>
        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Draft — officers &amp; admins only</span>
        <span className="text-gray-300">·</span>
        <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Members only — signed-in members</span>
        <span className="text-gray-300">·</span>
        <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Public — anyone on the internet</span>
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
          const badge = VISIBILITY_BADGE[page.visibility];
          const BadgeIcon = badge.Icon;

          return (
            <div
              key={page.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-gray-900 truncate">{page.title}</h2>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                      <BadgeIcon className="w-3 h-3" />
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {page.visibility === 'public'
                      ? `/p/${page.slug}`
                      : page.visibility === 'members'
                        ? `/pages/${page.slug}`
                        : `draft · /pages/${page.slug}`}
                    {' '}· Updated {formatDate(page.updated_at)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* View — public pages go to /p/slug, members pages go to /pages/slug */}
                  {page.visibility !== 'draft' && (
                    <Link
                      to={page.visibility === 'public' ? `/p/${page.slug}` : `/pages/${page.slug}`}
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

                  {/* Visibility cycle — officers and admins */}
                  {isOfficerOrAdmin && (
                    <button
                      onClick={() => handleVisibilityCycle(page)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 min-h-[44px]"
                      title={NEXT_VISIBILITY_LABEL[page.visibility]}
                    >
                      <BadgeIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {NEXT_VISIBILITY_LABEL[page.visibility]}
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
