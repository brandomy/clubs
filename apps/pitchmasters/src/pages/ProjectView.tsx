import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/mantine/style.css';
import {
  ArrowLeft,
  Clock,
  Mic,
  CheckCircle,
  Loader2,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import {
  getProject,
  getMyEnrollment,
  submitProjectCompletion,
  submitEvaluation,
} from '../hooks/useLearning';
import { runBadgeChecks } from '../lib/badge-engine';
import EvaluationForm from '../components/lms/EvaluationForm';
import type {
  LearningProject,
  EvaluationTemplate,
  MemberProjectCompletion,
  EvaluationSubmission,
} from '../types';

interface SpeechOption {
  id: string;
  title: string;
  meeting_date: string;
  meeting_title: string;
}

export default function ProjectView() {
  const { skillSlug, projectId } = useParams<{ skillSlug: string; projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<LearningProject | null>(null);
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null);
  const [speeches, setSpeeches] = useState<SpeechOption[]>([]);
  const [selectedSpeechId, setSelectedSpeechId] = useState<string>('');
  const [existingCompletion, setExistingCompletion] = useState<MemberProjectCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useCreateBlockNote({
    initialContent: undefined,
  });

  useEffect(() => {
    if (!projectId || !user) return;

    setLoading(true);
    setError(null);

    Promise.all([
      getProject(projectId),
      // Check if already completed
      supabase
        .from('pm_member_project_completions')
        .select('*')
        .eq('member_id', user.id)
        .eq('project_id', projectId)
        .maybeSingle(),
      // Load member's speeches for linking
      supabase
        .from('pm_speeches')
        .select('id, title, meeting:pm_meetings(title, date)')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])
      .then(async ([proj, completionResult, speechesResult]) => {
        if (!proj) {
          setError('Project not found.');
          return;
        }
        setProject(proj);

        // Update editor content
        if (proj.content && Array.isArray(proj.content) && proj.content.length > 0) {
          editor.replaceBlocks(editor.document, proj.content);
        }

        if (completionResult.data) {
          setExistingCompletion(completionResult.data);
          if (completionResult.data.speech_id) {
            setSelectedSpeechId(completionResult.data.speech_id);
          }
        }

        // Load evaluation template if present
        if (proj.evaluation_template_id) {
          const { data: tmpl } = await supabase
            .from('pm_evaluation_templates')
            .select('*')
            .eq('id', proj.evaluation_template_id)
            .single();
          if (tmpl) setTemplate(tmpl);
        }

        // Format speech options
        if (!speechesResult.error && speechesResult.data) {
          const opts: SpeechOption[] = speechesResult.data.map((s: any) => ({
            id: s.id,
            title: s.title,
            meeting_date: s.meeting?.date ?? '',
            meeting_title: s.meeting?.title ?? '',
          }));
          setSpeeches(opts);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, user, editor]);

  const handleSubmitCompletion = async () => {
    if (!project || !user) return;

    // Need enrollment to submit completion
    const enroll = await getMyEnrollment(user.id, project.skill_id);
    if (!enroll) {
      setError('You are not enrolled in this skill.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const completion = await submitProjectCompletion(
        user.id,
        project.id,
        project.skill_id,
        project.club_id,
        selectedSpeechId || undefined
      );
      setExistingCompletion(completion);
      setSubmitted(true);

      // Award any badges earned by this completion (fire-and-forget)
      if (project.level_id) {
        runBadgeChecks(user.id, project.id, project.level_id, project.skill_id, project.club_id).catch(
          (err) => logger.error('Badge check failed silently:', err)
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvaluationSubmit = async (data: EvaluationSubmission) => {
    if (!existingCompletion || !user) return;
    await submitEvaluation(existingCompletion.id, user.id, data);
    setExistingCompletion((prev) =>
      prev ? { ...prev, status: 'completed', evaluation_data: data } : prev
    );
  };

  const projectTypeLabel: Record<string, string> = {
    speech: 'Speech project',
    assignment: 'Assignment',
    evaluation_exercise: 'Evaluation exercise',
    elective: 'Elective',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-tm-blue" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error ?? 'Project not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(`/learn/${skillSlug}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to skill
      </button>

      {/* Project header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
        <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          {project.time_estimate_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~{project.time_estimate_minutes} min read
            </span>
          )}
          <span className="flex items-center gap-1">
            <Mic className="w-4 h-4" />
            {projectTypeLabel[project.project_type] ?? project.project_type}
          </span>
        </div>
        {project.description && (
          <p className="text-sm text-gray-600">{project.description}</p>
        )}
      </div>

      {/* Project content (BlockNote read-only) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <BlockNoteView editor={editor} editable={false} theme="light" />
      </div>

      {/* Completion section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        {existingCompletion ? (
          <>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium text-sm">
                {existingCompletion.status === 'approved_by_officer'
                  ? 'Approved by officer!'
                  : existingCompletion.status === 'completed'
                  ? 'Evaluation submitted'
                  : 'Submitted — awaiting evaluation'}
              </span>
            </div>

            {/* Show evaluation form if template exists and not yet evaluated */}
            {template &&
              existingCompletion.status === 'pending_evaluation' &&
              user?.role !== 'member' && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-700">
                    <ClipboardList className="w-4 h-4" />
                    Evaluator form
                  </div>
                  <EvaluationForm
                    template={template}
                    completionId={existingCompletion.id}
                    onSubmit={handleEvaluationSubmit}
                    readOnly={existingCompletion.status !== 'pending_evaluation'}
                    initialData={existingCompletion.evaluation_data ?? undefined}
                  />
                </div>
              )}

            {/* Read-only submitted evaluation */}
            {template && existingCompletion.evaluation_data && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
                  Submitted evaluation
                </p>
                <EvaluationForm
                  template={template}
                  completionId={existingCompletion.id}
                  onSubmit={async () => {}}
                  readOnly
                  initialData={existingCompletion.evaluation_data ?? undefined}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="font-semibold text-gray-900 text-sm">Mark as Complete</h3>

            {/* Speech linking — the key UX differentiator vs Pathways */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Link to a speech from a meeting{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Connecting your speech record means zero double-entry — the same speech
                appears in meetings and your learning history.
              </p>
              <select
                value={selectedSpeechId}
                onChange={(e) => setSelectedSpeechId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue min-h-touch"
              >
                <option value="">Select a meeting speech (optional)</option>
                {speeches.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                    {s.meeting_title ? ` — ${s.meeting_title}` : ''}
                    {s.meeting_date ? ` (${new Date(s.meeting_date).toLocaleDateString()})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {submitted ? (
              <div className="flex items-center gap-2 text-green-600 py-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium text-sm">Submitted for completion!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmitCompletion}
                disabled={submitting}
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-tm-blue hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  'Submit for Completion'
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
