import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CheckCircle, Circle, ArrowRight, Award, Download, Flag, Loader2, Lock } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { downloadCertificate } from '../lib/certificate';
import { supabase } from '../lib/supabase';
import {
  listSkills,
  getSkillBySlug,
  getLevels,
  getProjectsBySkill,
  getMyEnrollment,
  getMyCompletions,
  getMyBadges,
  enrollInSkill,
} from '../hooks/useLearning';
import type {
  LearningSkill,
  LearningLevel,
  LearningProject,
  MemberSkillEnrollment,
  MemberProjectCompletion,
  MemberBadge,
} from '../types';

export default function LearningDashboard() {
  const { skillSlug } = useParams<{ skillSlug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [skills, setSkills] = useState<LearningSkill[]>([]);
  const [activeSkill, setActiveSkill] = useState<LearningSkill | null>(null);
  const [levels, setLevels] = useState<LearningLevel[]>([]);
  const [projects, setProjects] = useState<LearningProject[]>([]);
  const [enrollment, setEnrollment] = useState<MemberSkillEnrollment | null>(null);
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
    listSkills(clubId)
      .then(setSkills)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    supabase
      .from('pm_clubs')
      .select('name')
      .eq('id', clubId)
      .single()
      .then(({ data }) => { if (data?.name) setClubName(data.name); });
  }, [clubId]);

  // When skillSlug changes, load that skill's data
  useEffect(() => {
    if (!skillSlug || !clubId || !user) return;

    setLoading(true);
    setError(null);

    Promise.all([
      getSkillBySlug(clubId, skillSlug),
      getMyBadges(user.id),
    ])
      .then(async ([skill, earnedBadges]) => {
        if (!skill) {
          setError('Learning skill not found.');
          return;
        }
        setActiveSkill(skill);
        setBadges(earnedBadges);

        const [lvls, projs, enroll] = await Promise.all([
          getLevels(skill.id),
          getProjectsBySkill(skill.id),
          getMyEnrollment(user.id, skill.id),
        ]);
        setLevels(lvls);
        setProjects(projs);
        setEnrollment(enroll);

        if (enroll) {
          const done = await getMyCompletions(user.id, skill.id);
          setCompletions(done);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [skillSlug, clubId, user]);

  const handleEnroll = async () => {
    if (!activeSkill || !user) return;
    setEnrolling(true);
    setError(null);
    try {
      const enroll = await enrollInSkill(user.id, activeSkill.id, clubId);
      setEnrollment(enroll);
      setCompletions([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!activeSkill || !user) return;
    setDownloadingCert(true);
    try {
      await downloadCertificate({
        memberName: user.full_name || user.email || 'Member',
        skillTitle: activeSkill.title,
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

  // ---- Skill selection screen ----
  if (!skillSlug) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning</h1>
          <p className="text-sm text-gray-500 mt-1">
            Practical skills for startup founders — built in-house, just for Pitchmasters.
          </p>
        </div>

        {skills.filter((s) => s.published || user?.role !== 'member').length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No learning skills published yet.</p>
            {user?.role !== 'member' && (
              <button
                type="button"
                onClick={() => navigate('/learn/admin/skills/new')}
                className="mt-4 text-sm text-tm-blue hover:underline"
              >
                Create the first skill →
              </button>
            )}
          </div>
        )}

        <div className="grid gap-4">
          {skills
            .filter((s) => s.published || user?.role !== 'member')
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => navigate(`/learn/${s.slug}`)}
                className="w-full text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-tm-blue hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{s.title}</h3>
                    {s.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description.replace(/<[^>]+>/g, ' ').trim()}</p>
                    )}
                    {!s.published && (
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

  // ---- No skill found ----
  if (!activeSkill) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center text-gray-400">
        <p>Skill not found.</p>
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
            <h1 className="text-xl font-bold text-gray-900">{activeSkill.title}</h1>
            {activeSkill.description && (
              <div className="text-sm text-gray-600 mt-2 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mt-0.5" dangerouslySetInnerHTML={{ __html: activeSkill.description }} />
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
            {enrolling ? 'Enrolling…' : 'Enroll in this skill'}
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
          <h1 className="text-xl font-bold text-gray-900">{activeSkill.title}</h1>
        </div>
        {badges.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
            <Award className="w-4 h-4" />
            {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
          </div>
        )}
      </div>

      {/* Level node tracker */}
      {levels.length > 0 && (() => {
        const levelStatuses = levels.map((level) => {
          const { done, total } = progressForLevel(level);
          return total > 0 && done === total;
        });
        const currentIndex = levelStatuses.findIndex((done) => !done);

        return (
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
            <div className="flex items-start w-full">
              {levels.map((level, i) => {
                const isComplete = levelStatuses[i];
                const isCurrent = i === currentIndex;

                return (
                  <div key={level.id} className={`flex items-center ${i > 0 ? 'flex-1' : ''}`}>
                    {/* Connector line — grows to fill space between nodes */}
                    {i > 0 && (
                      <div
                        className={`flex-1 h-0.5 mt-4 ${
                          levelStatuses[i - 1] ? 'bg-green-400' : 'bg-gray-200'
                        }`}
                      />
                    )}

                    {/* Node */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                          isComplete
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-gray-200 text-gray-600 ring-2 ring-gray-400 ring-offset-1'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className="text-xs text-gray-500 text-center w-24 leading-tight line-clamp-2">
                        {level.title}
                      </span>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        );
      })()}

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
                {total > 0 && <span className="text-xs text-gray-500">{done}/{total}</span>}
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
                        `/learn/${activeSkill.slug}/project/${project.id}`
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

      {/* End of skill marker */}
      <div className="flex items-center gap-3 text-gray-200">
        <div className="flex-1 h-px bg-gray-200" />
        <Flag className="w-3.5 h-3.5 text-gray-300" />
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Path complete */}
      {enrollment.completed_at && (
        <div className="flex flex-col items-center gap-3 py-8 text-center bg-white border border-green-200 rounded-xl">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className="font-semibold text-gray-900">Skill complete!</p>
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
