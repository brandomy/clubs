import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  listPaths,
  getPendingApprovals,
  approveCompletion,
  getProjectsByPath,
} from '../../hooks/useLearning';
import type {
  LearningPath,
  LearningProject,
  MemberProjectCompletion,
} from '../../types';

interface EnrollmentRow {
  member_id: string;
  member_name: string;
  path_id: string;
  path_title: string;
  current_level_id: string | null;
  enrolled_at: string;
  completed_at: string | null;
  completion_count: number;
}

interface StallAlert {
  member_id: string;
  member_name: string;
  path_title: string;
  last_activity: string;
  days_stalled: number;
}

export default function LearningAnalytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clubId = user?.club_id ?? '';

  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [completions, setCompletions] = useState<MemberProjectCompletion[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<MemberProjectCompletion[]>([]);
  const [projects, setProjects] = useState<Record<string, LearningProject[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [expandedApproval, setExpandedApproval] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) return;
    loadData();
  }, [clubId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pathList, pending] = await Promise.all([
        listPaths(clubId),
        getPendingApprovals(clubId),
      ]);
      setPaths(pathList);
      setPendingApprovals(pending);

      // Load enrollments with member names
      const { data: enrollData, error: enrollErr } = await supabase
        .from('pm_member_path_enrollments')
        .select('*, member:pm_members(full_name), path:pm_learning_paths(title)')
        .eq('club_id', clubId)
        .order('enrolled_at', { ascending: false });

      if (enrollErr) throw enrollErr;

      // Load all completions
      const { data: compData, error: compErr } = await supabase
        .from('pm_member_project_completions')
        .select('*')
        .eq('club_id', clubId);

      if (compErr) throw compErr;

      const compList = compData ?? [];
      setCompletions(compList);

      // Enrich enrollment rows
      const compCountByMemberPath: Record<string, number> = {};
      for (const c of compList) {
        const key = `${c.member_id}:${c.path_id}`;
        compCountByMemberPath[key] = (compCountByMemberPath[key] ?? 0) + 1;
      }

      const rows: EnrollmentRow[] = (enrollData ?? []).map((e: any) => ({
        member_id: e.member_id,
        member_name: e.member?.full_name ?? 'Unknown',
        path_id: e.path_id,
        path_title: e.path?.title ?? 'Unknown',
        current_level_id: e.current_level_id,
        enrolled_at: e.enrolled_at,
        completed_at: e.completed_at,
        completion_count: compCountByMemberPath[`${e.member_id}:${e.path_id}`] ?? 0,
      }));
      setEnrollments(rows);

      // Load projects for all paths
      const projMap: Record<string, LearningProject[]> = {};
      await Promise.all(
        pathList.map(async (p) => {
          const projs = await getProjectsByPath(p.id);
          projMap[p.id] = projs;
        })
      );
      setProjects(projMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (completionId: string) => {
    setApprovingId(completionId);
    try {
      await approveCompletion(completionId);
      setPendingApprovals((prev) => prev.filter((c) => c.id !== completionId));
    } finally {
      setApprovingId(null);
    }
  };

  // ---- Stall alerts: enrolled members with no completion in 30+ days ----
  const stallAlerts: StallAlert[] = enrollments
    .filter((e) => !e.completed_at)
    .filter((e) => {
      const lastComp = completions
        .filter((c) => c.member_id === e.member_id && c.path_id === e.path_id)
        .sort((a, b) => b.completed_at.localeCompare(a.completed_at))[0];
      const referenceDate = lastComp
        ? new Date(lastComp.completed_at)
        : new Date(e.enrolled_at);
      const daysSince = Math.floor(
        (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince >= 30;
    })
    .map((e) => {
      const lastComp = completions
        .filter((c) => c.member_id === e.member_id && c.path_id === e.path_id)
        .sort((a, b) => b.completed_at.localeCompare(a.completed_at))[0];
      const referenceDate = lastComp
        ? new Date(lastComp.completed_at)
        : new Date(e.enrolled_at);
      return {
        member_id: e.member_id,
        member_name: e.member_name,
        path_title: e.path_title,
        last_activity: referenceDate.toLocaleDateString(),
        days_stalled: Math.floor(
          (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    })
    .sort((a, b) => b.days_stalled - a.days_stalled)
    .slice(0, 10);

  const filteredEnrollments =
    selectedPath === 'all'
      ? enrollments
      : enrollments.filter((e) => e.path_id === selectedPath);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-tm-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Learning Analytics</h2>
        <button
          type="button"
          onClick={() => navigate('/learn/admin')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Admin
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total enrolled',
            value: enrollments.length,
            icon: <Users className="w-5 h-5 text-tm-blue" />,
          },
          {
            label: 'Completed paths',
            value: enrollments.filter((e) => e.completed_at).length,
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          },
          {
            label: 'Pending approvals',
            value: pendingApprovals.length,
            icon: <Clock className="w-5 h-5 text-amber-500" />,
          },
          {
            label: 'Stall alerts',
            value: stallAlerts.length,
            icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-xl p-4 space-y-2"
          >
            {card.icon}
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Pending approvals */}
      {pendingApprovals.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Approvals ({pendingApprovals.length})
          </h3>
          <div className="space-y-2">
            {pendingApprovals.map((completion) => {
              const projectName =
                Object.values(projects)
                  .flat()
                  .find((p) => p.id === completion.project_id)?.title ?? 'Unknown project';

              return (
                <div
                  key={completion.id}
                  className="bg-white border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {projectName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Submitted {new Date(completion.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedApproval(
                            expandedApproval === completion.id ? null : completion.id
                          )
                        }
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        Details
                        {expandedApproval === completion.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(completion.id)}
                        disabled={approvingId === completion.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {approvingId === completion.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-3.5 h-3.5" />
                        )}
                        Approve
                      </button>
                    </div>
                  </div>

                  {expandedApproval === completion.id && completion.evaluation_data && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Evaluation data:
                      </p>
                      <pre className="text-xs bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(completion.evaluation_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Stall alerts */}
      {stallAlerts.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Stall Alerts — no progress in 30+ days
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Member</th>
                  <th className="px-4 py-2 text-left">Path</th>
                  <th className="px-4 py-2 text-left">Last activity</th>
                  <th className="px-4 py-2 text-right">Days stalled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stallAlerts.map((alert) => (
                  <tr key={`${alert.member_id}-${alert.path_title}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {alert.member_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{alert.path_title}</td>
                    <td className="px-4 py-3 text-gray-500">{alert.last_activity}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">
                      {alert.days_stalled}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Individual member progress */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-tm-blue" />
            Member Progress
          </h3>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-tm-blue"
          >
            <option value="all">All paths</option>
            {paths.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {filteredEnrollments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No enrollments yet.
          </p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Member</th>
                  <th className="px-4 py-2 text-left hidden sm:table-cell">Path</th>
                  <th className="px-4 py-2 text-right">Projects done</th>
                  <th className="px-4 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEnrollments.map((row) => {
                  const pathProjects = projects[row.path_id] ?? [];
                  const total = pathProjects.filter((p) => !p.is_elective).length;
                  const pct = total > 0 ? Math.round((row.completion_count / total) * 100) : 0;

                  return (
                    <tr key={`${row.member_id}-${row.path_id}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.member_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {row.path_title}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-700">
                          {row.completion_count}/{total}
                        </span>
                        <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-tm-blue h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.completed_at ? (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            Complete
                          </span>
                        ) : pct === 0 ? (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            Not started
                          </span>
                        ) : (
                          <span className="text-xs text-tm-blue bg-blue-50 px-2 py-0.5 rounded-full">
                            {pct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
