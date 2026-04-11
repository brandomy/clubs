import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CheckCircle, Circle, ArrowRight, Award, Download, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { downloadCertificate } from '../lib/certificate';
import { supabase } from '../lib/supabase';
import {
  listPaths,
  getPathBySlug,
  getLevels,
  getProjectsByPath,
  getMyEnrollment,
  getMyCompletions,
  getMyBadges,
  enrollInPath,
} from '../hooks/useLearning';
import type {
  LearningPath,
  LearningLevel,
  LearningProject,
  MemberPathEnrollment,
  MemberProjectCompletion,
  MemberBadge,
} from '../types';

export default function LearningDashboard() {
  const { pathSlug } = useParams<{ pathSlug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [levels, setLevels] = useState<LearningLevel[]>([]);
  const [projects, setProjects] = useState<LearningProject[]>([]);
  const [enrollment, setEnrollment] = useState<MemberPathEnrollment | null>(null);
  const [completions, setCompletions] = useState<MemberProjectCompletion[]>([]);
  const [badges, setBadges] = useState<MemberBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [clubName, setClubName] = useState('Pitchmasters');
  const [error, setError] = useState<string | null>(null);

  const clubId = user?.club_id ?? '';

  // Load paths and club name on mount
  useEffect(() => {
    if (!clubId) return;
    listPaths(clubId)
      .then(setPaths)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    supabase
      .from('pm_clubs')
      .select('name')
      .eq('id', clubId)
      .single()
      .then(({ data }) => { if (data?.name) setClubName(data.name); });
  }, [clubId]);

  // When pathSlug changes, load that path's data
  useEffect(() => {
    if (!pathSlug || !clubId || !user) return;

    setLoading(true);
    setError(null);

    Promise.all([
      getPathBySlug(clubId, pathSlug),
      getMyBadges(user.id),
    ])
      .then(async ([path, earnedBadges]) => {
        if (!path) {
          setError('Learning path not found.');
          return;
        }
        setActivePath(path);
        setBadges(earnedBadges);

        const [lvls, projs, enroll] = await Promise.all([
          getLevels(path.id),
          getProjectsByPath(path.id),
          getMyEnrollment(user.id, path.id),
        ]);
        setLevels(lvls);
        setProjects(projs);
        setEnrollment(enroll);

        if (enroll) {
          const done = await getMyCompletions(user.id, path.id);
          setCompletions(done);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [pathSlug, clubId, user]);

  const handleEnroll = async () => {
    if (!activePath || !user) return;
    setEnrolling(true);
    setError(null);
    try {
      const enroll = await enrollInPath(user.id, activePath.id, clubId);
      setEnrollment(enroll);
      setCompletions([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!activePath || !user) return;
    setDownloadingCert(true);
    try {
      await downloadCertificate({
        memberName: user.full_name || user.email || 'Member',
        pathTitle: activePath.title,
        completedDate: enrollment?.completed_at
          ? new Date(enrollment.completed_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : new Date().toLocaleDateString(),
        clubName,
      });
    } finally {
      setDownloadingCert(false);
    }
  };

  const completedProjectIds = new Set(completions.map((c) => c.project_id));

  const progressForLevel = (level: LearningLevel) => {
    const levelProjects = projects.filter((p) => p.level_id === level.id && !p.is_elective);
    const done = levelProjects.filter((p) => completedProjectIds.has(p.id)).length;
    return { done, total: levelProjects.length };
  };

  const nextProject = () => {
    for (const level of levels) {
      for (const project of projects.filter((p) => p.level_id === level.id)) {
        if (!completedProjectIds.has(project.id)) return project;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-tm-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  // ---- Path selection screen ----
  if (!pathSlug) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning</h1>
          <p className="text-sm text-gray-500 mt-1">
            Custom curriculum built for startup founders — no Pathways login required.
          </p>
        </div>

        {paths.filter((p) => p.published || user?.role !== 'member').length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No learning paths published yet.</p>
            {user?.role !== 'member' && (
              <button
                type="button"
                onClick={() => navigate('/learn/admin/paths/new')}
                className="mt-4 text-sm text-tm-blue hover:underline"
              >
                Create the first path →
              </button>
            )}
          </div>
        )}

        <div className="grid gap-4">
          {paths
            .filter((p) => p.published || user?.role !== 'member')
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/learn/${p.slug}`)}
                className="w-full text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-tm-blue hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    {p.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                    )}
                    {!p.published && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        Draft
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
        </div>
      </div>
    );
  }

  // ---- No path found ----
  if (!activePath) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center text-gray-400">
        <p>Path not found.</p>
      </div>
    );
  }

  // ---- Enrollment screen ----
  if (!enrollment) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/learn')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Learning
        </button>
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{activePath.title}</h1>
            {activePath.description && (
              <p className="text-sm text-gray-600 mt-2">{activePath.description}</p>
            )}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{levels.length} levels · {projects.length} projects</p>
          </div>
          <button
            type="button"
            onClick={handleEnroll}
            disabled={enrolling}
            className="w-full py-3 rounded-lg bg-tm-blue text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors min-h-touch"
          >
            {enrolling ? 'Enrolling…' : 'Enroll in this path'}
          </button>
        </div>
      </div>
    );
  }

  // ---- Progress dashboard ----
  const next = nextProject();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/learn')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 block"
          >
            ← Learning
          </button>
          <h1 className="text-xl font-bold text-gray-900">{activePath.title}</h1>
        </div>
        {badges.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
            <Award className="w-4 h-4" />
            {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
          </div>
        )}
      </div>

      {/* Level progress */}
      {levels.map((level) => {
        const { done, total } = progressForLevel(level);
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const levelProjects = projects.filter((p) => p.level_id === level.id);

        return (
          <div key={level.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Level header */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-900 text-sm">{level.title}</h2>
                <span className="text-xs text-gray-500">{done}/{total}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-tm-blue h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Project list */}
            <div className="divide-y divide-gray-100">
              {levelProjects.map((project) => {
                const isDone = completedProjectIds.has(project.id);
                const isNext = next?.id === project.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/learn/${activePath.slug}/project/${project.id}`
                      )
                    }
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <span
                      className={`flex-1 text-sm ${
                        isDone ? 'text-gray-400 line-through' : 'text-gray-800'
                      }`}
                    >
                      {project.title}
                      {project.is_elective && (
                        <span className="ml-2 text-xs text-gray-400">(elective)</span>
                      )}
                    </span>
                    {isNext && !isDone && (
                      <span className="text-xs font-medium text-tm-blue bg-blue-50 px-2 py-0.5 rounded-full">
                        Next
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Path complete */}
      {enrollment.completed_at && (
        <div className="flex flex-col items-center gap-3 py-8 text-center bg-white border border-green-200 rounded-xl">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className="font-semibold text-gray-900">Path complete!</p>
          <p className="text-sm text-gray-500">
            Completed {new Date(enrollment.completed_at).toLocaleDateString()}
          </p>
          <button
            type="button"
            onClick={handleDownloadCertificate}
            disabled={downloadingCert}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tm-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {downloadingCert ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloadingCert ? 'Generating…' : 'Download Certificate'}
          </button>
        </div>
      )}
    </div>
  );
}
