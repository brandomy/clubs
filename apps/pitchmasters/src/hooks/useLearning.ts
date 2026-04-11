import { supabase } from '../lib/supabase';
import type {
  LearningPath,
  LearningLevel,
  LearningProject,
  EvaluationTemplate,
  MemberPathEnrollment,
  MemberProjectCompletion,
  MemberBadge,
  EvaluationSubmission,
} from '../types';

// ============================================================
// Member-facing operations
// ============================================================

export async function getMyEnrollment(
  memberId: string,
  pathId: string
): Promise<MemberPathEnrollment | null> {
  const { data, error } = await supabase
    .from('pm_member_path_enrollments')
    .select('*')
    .eq('member_id', memberId)
    .eq('path_id', pathId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMyEnrollments(memberId: string): Promise<MemberPathEnrollment[]> {
  const { data, error } = await supabase
    .from('pm_member_path_enrollments')
    .select('*')
    .eq('member_id', memberId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMyCompletions(
  memberId: string,
  pathId: string
): Promise<MemberProjectCompletion[]> {
  const { data, error } = await supabase
    .from('pm_member_project_completions')
    .select('*')
    .eq('member_id', memberId)
    .eq('path_id', pathId);

  if (error) throw error;
  return data ?? [];
}

export async function getMyBadges(memberId: string): Promise<MemberBadge[]> {
  const { data, error } = await supabase
    .from('pm_member_badges')
    .select('*')
    .eq('member_id', memberId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function enrollInPath(
  memberId: string,
  pathId: string,
  clubId: string
): Promise<MemberPathEnrollment> {
  const { data, error } = await supabase
    .from('pm_member_path_enrollments')
    .insert({ member_id: memberId, path_id: pathId, club_id: clubId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function submitProjectCompletion(
  memberId: string,
  projectId: string,
  pathId: string,
  clubId: string,
  speechId?: string
): Promise<MemberProjectCompletion> {
  const { data, error } = await supabase
    .from('pm_member_project_completions')
    .insert({
      member_id: memberId,
      project_id: projectId,
      path_id: pathId,
      club_id: clubId,
      speech_id: speechId ?? null,
      status: 'pending_evaluation',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function submitEvaluation(
  completionId: string,
  evaluatorId: string,
  formData: EvaluationSubmission
): Promise<void> {
  const { error } = await supabase
    .from('pm_member_project_completions')
    .update({
      evaluation_data: formData,
      evaluator_id: evaluatorId,
      status: 'completed',
    })
    .eq('id', completionId);

  if (error) throw error;
}

// ============================================================
// Shared read operations
// ============================================================

export async function listPaths(clubId: string): Promise<LearningPath[]> {
  const { data, error } = await supabase
    .from('pm_learning_paths')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPath(pathId: string): Promise<LearningPath | null> {
  const { data, error } = await supabase
    .from('pm_learning_paths')
    .select('*')
    .eq('id', pathId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPathBySlug(
  clubId: string,
  slug: string
): Promise<LearningPath | null> {
  const { data, error } = await supabase
    .from('pm_learning_paths')
    .select('*')
    .eq('club_id', clubId)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getLevels(pathId: string): Promise<LearningLevel[]> {
  const { data, error } = await supabase
    .from('pm_learning_levels')
    .select('*')
    .eq('path_id', pathId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProjects(levelId: string): Promise<LearningProject[]> {
  const { data, error } = await supabase
    .from('pm_learning_projects')
    .select('*')
    .eq('level_id', levelId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProject(projectId: string): Promise<LearningProject | null> {
  const { data, error } = await supabase
    .from('pm_learning_projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProjectsByPath(pathId: string): Promise<LearningProject[]> {
  const { data, error } = await supabase
    .from('pm_learning_projects')
    .select('*')
    .eq('path_id', pathId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ============================================================
// Officer / Admin operations
// ============================================================

export async function savePath(
  path: Partial<LearningPath> & { club_id: string; title: string; slug: string }
): Promise<LearningPath> {
  if (path.id) {
    const { data, error } = await supabase
      .from('pm_learning_paths')
      .update({
        title: path.title,
        description: path.description,
        slug: path.slug,
        published: path.published,
        cover_image_url: path.cover_image_url,
      })
      .eq('id', path.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('pm_learning_paths')
    .insert({
      club_id: path.club_id,
      title: path.title,
      description: path.description ?? '',
      slug: path.slug,
      published: path.published ?? false,
      cover_image_url: path.cover_image_url ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveLevel(
  level: Partial<LearningLevel> & { path_id: string; club_id: string; title: string }
): Promise<LearningLevel> {
  if (level.id) {
    const { data, error } = await supabase
      .from('pm_learning_levels')
      .update({
        title: level.title,
        description: level.description,
        order_index: level.order_index,
        required_projects: level.required_projects,
      })
      .eq('id', level.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('pm_learning_levels')
    .insert({
      path_id: level.path_id,
      club_id: level.club_id,
      title: level.title,
      description: level.description ?? '',
      order_index: level.order_index ?? 0,
      required_projects: level.required_projects ?? 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLevel(levelId: string): Promise<void> {
  const { error } = await supabase
    .from('pm_learning_levels')
    .delete()
    .eq('id', levelId);
  if (error) throw error;
}

export async function saveProject(
  project: Partial<LearningProject> & {
    level_id: string;
    path_id: string;
    club_id: string;
    title: string;
  }
): Promise<LearningProject> {
  if (project.id) {
    const { data, error } = await supabase
      .from('pm_learning_projects')
      .update({
        title: project.title,
        description: project.description,
        content: project.content,
        project_type: project.project_type,
        evaluation_template_id: project.evaluation_template_id,
        order_index: project.order_index,
        is_elective: project.is_elective,
        time_estimate_minutes: project.time_estimate_minutes,
      })
      .eq('id', project.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('pm_learning_projects')
    .insert({
      level_id: project.level_id,
      path_id: project.path_id,
      club_id: project.club_id,
      title: project.title,
      description: project.description ?? '',
      content: project.content ?? [],
      project_type: project.project_type ?? 'speech',
      evaluation_template_id: project.evaluation_template_id ?? null,
      order_index: project.order_index ?? 0,
      is_elective: project.is_elective ?? false,
      time_estimate_minutes: project.time_estimate_minutes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('pm_learning_projects')
    .delete()
    .eq('id', projectId);
  if (error) throw error;
}

export async function getPendingApprovals(
  clubId: string
): Promise<MemberProjectCompletion[]> {
  const { data, error } = await supabase
    .from('pm_member_project_completions')
    .select('*')
    .eq('club_id', clubId)
    .eq('status', 'pending_evaluation')
    .order('completed_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function approveCompletion(
  completionId: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('pm_member_project_completions')
    .update({
      status: 'approved_by_officer',
      approved_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq('id', completionId);

  if (error) throw error;
}

export async function getClubAnalytics(clubId: string) {
  const [enrollmentsResult, completionsResult] = await Promise.all([
    supabase
      .from('pm_member_path_enrollments')
      .select('*, path:pm_learning_paths(title)')
      .eq('club_id', clubId),
    supabase
      .from('pm_member_project_completions')
      .select('*')
      .eq('club_id', clubId),
  ]);

  if (enrollmentsResult.error) throw enrollmentsResult.error;
  if (completionsResult.error) throw completionsResult.error;

  return {
    enrollments: enrollmentsResult.data ?? [],
    completions: completionsResult.data ?? [],
  };
}

export async function saveEvaluationTemplate(
  template: Partial<EvaluationTemplate> & { club_id: string; name: string }
): Promise<EvaluationTemplate> {
  if (template.id) {
    const { data, error } = await supabase
      .from('pm_evaluation_templates')
      .update({
        name: template.name,
        description: template.description,
        fields: template.fields,
      })
      .eq('id', template.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('pm_evaluation_templates')
    .insert({
      club_id: template.club_id,
      name: template.name,
      description: template.description ?? '',
      fields: template.fields ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listEvaluationTemplates(
  clubId: string
): Promise<EvaluationTemplate[]> {
  const { data, error } = await supabase
    .from('pm_evaluation_templates')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteEvaluationTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('pm_evaluation_templates')
    .delete()
    .eq('id', templateId);
  if (error) throw error;
}

// Reorder levels by saving new order_index values
export async function reorderLevels(
  levels: Array<{ id: string; order_index: number }>
): Promise<void> {
  await Promise.all(
    levels.map(({ id, order_index }) =>
      supabase
        .from('pm_learning_levels')
        .update({ order_index })
        .eq('id', id)
    )
  );
}

// Reorder projects within a level
export async function reorderProjects(
  projects: Array<{ id: string; order_index: number }>
): Promise<void> {
  await Promise.all(
    projects.map(({ id, order_index }) =>
      supabase
        .from('pm_learning_projects')
        .update({ order_index })
        .eq('id', id)
    )
  );
}
