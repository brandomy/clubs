/**
 * Badge Award Engine
 *
 * Pure utility — no React, no hooks. Safe to call from any context.
 *
 * Usage:
 *   await awardBadgesForCompletion(memberId, projectId, clubId);
 *   await awardBadgesForLevelCompletion(memberId, levelId, pathId, clubId);
 *   await awardBadgesForPathCompletion(memberId, pathId, clubId);
 */

import { supabase } from './supabase';

// ============================================================
// Award badges triggered by a single project completion
// ============================================================
export async function awardBadgesForCompletion(
  memberId: string,
  projectId: string,
  clubId: string
): Promise<void> {
  // Find any badges that trigger on this specific project
  const { data: badges, error } = await supabase
    .from('pm_learning_badges')
    .select('id')
    .eq('club_id', clubId)
    .eq('trigger_type', 'project_complete')
    .eq('trigger_ref_id', projectId);

  if (error || !badges?.length) return;

  for (const badge of badges) {
    // Only insert if not already earned (upsert with onConflict ignore)
    await supabase
      .from('pm_member_badges')
      .upsert(
        {
          member_id: memberId,
          badge_id: badge.id,
          club_id: clubId,
          earned_at: new Date().toISOString(),
        },
        { onConflict: 'member_id,badge_id', ignoreDuplicates: true }
      );
  }
}

// ============================================================
// Award badges triggered by completing an entire level
// Also updates current_level_id on the enrollment
// ============================================================
export async function awardBadgesForLevelCompletion(
  memberId: string,
  levelId: string,
  pathId: string,
  clubId: string
): Promise<void> {
  // Check if the member has completed all required projects in this level
  const { data: level } = await supabase
    .from('pm_learning_levels')
    .select('required_projects')
    .eq('id', levelId)
    .single();

  if (!level) return;

  const { data: levelProjects } = await supabase
    .from('pm_learning_projects')
    .select('id')
    .eq('level_id', levelId)
    .eq('is_elective', false);

  if (!levelProjects?.length) return;

  const { data: completions } = await supabase
    .from('pm_member_project_completions')
    .select('project_id')
    .eq('member_id', memberId)
    .eq('path_id', pathId)
    .in(
      'project_id',
      levelProjects.map((p) => p.id)
    );

  const completedCount = completions?.length ?? 0;
  if (completedCount < level.required_projects) return;

  // Level complete — award level badges
  const { data: badges } = await supabase
    .from('pm_learning_badges')
    .select('id')
    .eq('club_id', clubId)
    .eq('trigger_type', 'level_complete')
    .eq('trigger_ref_id', levelId);

  if (badges?.length) {
    for (const badge of badges) {
      await supabase
        .from('pm_member_badges')
        .upsert(
          {
            member_id: memberId,
            badge_id: badge.id,
            club_id: clubId,
            earned_at: new Date().toISOString(),
          },
          { onConflict: 'member_id,badge_id', ignoreDuplicates: true }
        );
    }
  }

  // Find the next level in this path (higher order_index)
  const { data: currentLevel } = await supabase
    .from('pm_learning_levels')
    .select('order_index')
    .eq('id', levelId)
    .single();

  if (currentLevel) {
    const { data: nextLevel } = await supabase
      .from('pm_learning_levels')
      .select('id')
      .eq('path_id', pathId)
      .gt('order_index', currentLevel.order_index)
      .order('order_index', { ascending: true })
      .limit(1)
      .maybeSingle();

    // Update enrollment to point to next level
    await supabase
      .from('pm_member_path_enrollments')
      .update({ current_level_id: nextLevel?.id ?? null })
      .eq('member_id', memberId)
      .eq('path_id', pathId);
  }
}

// ============================================================
// Award badges and mark path complete
// Called when all required levels/projects in a path are done
// ============================================================
export async function awardBadgesForPathCompletion(
  memberId: string,
  pathId: string,
  clubId: string
): Promise<void> {
  // Verify all required projects across all levels are complete
  const { data: allProjects } = await supabase
    .from('pm_learning_projects')
    .select('id')
    .eq('path_id', pathId)
    .eq('is_elective', false);

  if (!allProjects?.length) return;

  const { data: completions } = await supabase
    .from('pm_member_project_completions')
    .select('project_id')
    .eq('member_id', memberId)
    .eq('path_id', pathId);

  const completedIds = new Set(completions?.map((c) => c.project_id) ?? []);
  const allDone = allProjects.every((p) => completedIds.has(p.id));
  if (!allDone) return;

  // Mark enrollment as complete
  const now = new Date().toISOString();
  await supabase
    .from('pm_member_path_enrollments')
    .update({ completed_at: now })
    .eq('member_id', memberId)
    .eq('path_id', pathId)
    .is('completed_at', null);

  // Award path-level badges
  const { data: badges } = await supabase
    .from('pm_learning_badges')
    .select('id')
    .eq('club_id', clubId)
    .eq('trigger_type', 'path_complete')
    .eq('trigger_ref_id', pathId);

  if (badges?.length) {
    for (const badge of badges) {
      await supabase
        .from('pm_member_badges')
        .upsert(
          {
            member_id: memberId,
            badge_id: badge.id,
            club_id: clubId,
            earned_at: now,
          },
          { onConflict: 'member_id,badge_id', ignoreDuplicates: true }
        );
    }
  }
}

// ============================================================
// Convenience: run all badge checks after a project completion
// ============================================================
export async function runBadgeChecks(
  memberId: string,
  projectId: string,
  levelId: string,
  pathId: string,
  clubId: string
): Promise<void> {
  await awardBadgesForCompletion(memberId, projectId, clubId);
  await awardBadgesForLevelCompletion(memberId, levelId, pathId, clubId);
  await awardBadgesForPathCompletion(memberId, pathId, clubId);
}
