import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronRight,
  Save,
  Loader2,
  Globe,
  GlobeLock,
  BookOpen,
  Layers,
  FileText,
} from 'lucide-react';
import type { LearningSkill, LearningLevel, LearningProject, EvaluationTemplate, ProjectType } from '../../types';
import {
  saveSkill,
  saveLevel,
  saveProject,
  deleteLevel,
  deleteProject,
  getLevels,
  getProjects,
  listEvaluationTemplates,
  reorderLevels,
  reorderProjects,
} from '../../hooks/useLearning';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

interface SkillEditorProps {
  skill?: LearningSkill;
  clubId: string;
  onSaved: (skill: LearningSkill) => void;
  onCancel: () => void;
}

type Panel = 'settings' | 'levels' | 'project';

// ============================================================
// Sortable level row
// ============================================================
function SortableLevelRow({
  level,
  isSelected,
  onSelect,
  onDelete,
  onEditContent,
}: {
  level: LearningLevel;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEditContent: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: level.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
        isSelected
          ? 'border-tm-blue bg-blue-50'
          : 'border-transparent hover:bg-gray-50'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 text-left min-w-0"
      >
        <p className="text-sm text-gray-800 font-medium truncate">{level.title || 'Untitled Level'}</p>
        {level.description && (
          <p className="text-xs text-gray-400 truncate">{level.description}</p>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onEditContent(); }}
        className="text-gray-400 hover:text-tm-blue transition-colors flex-shrink-0"
        title="Edit learning materials"
        aria-label="Edit learning materials"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Delete "${level.title}"? This cannot be undone.`)) onDelete();
        }}
        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        aria-label="Delete level"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ============================================================
// Sortable project row
// ============================================================
function SortableProjectRow({
  project,
  isSelected,
  onSelect,
  onDelete,
}: {
  project: LearningProject;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
        isSelected
          ? 'border-tm-blue bg-blue-50'
          : 'border-transparent hover:bg-gray-50'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 text-left text-sm text-gray-700 truncate"
      >
        {project.title || 'Untitled Project'}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Delete "${project.title}"? This cannot be undone.`)) onDelete();
        }}
        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        aria-label="Delete project"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ============================================================
// Main SkillEditor
// ============================================================
export default function SkillEditor({ skill, clubId, onSaved, onCancel }: SkillEditorProps) {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<Panel>('settings');

  // Skill settings state
  const [title, setTitle] = useState(skill?.title ?? '');
  const [description, setDescription] = useState(skill?.description ?? '');
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [slug, setSlug] = useState(skill?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(!!skill?.slug);
  const [published, setPublished] = useState(skill?.published ?? false);
  const [skillSaving, setSkillSaving] = useState(false);
  const [savedSkill, setSavedSkill] = useState<LearningSkill | undefined>(skill);

  // Levels state
  const [levels, setLevels] = useState<LearningLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel | null>(null);
  const [levelTitle, setLevelTitle] = useState('');
  const [levelDescription, setLevelDescription] = useState('');
  const [requiredProjects, setRequiredProjects] = useState(1);
  const [levelSaving, setLevelSaving] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<LearningProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<LearningProject | null>(null);
  const [evalTemplates, setEvalTemplates] = useState<EvaluationTemplate[]>([]);
  const [projectSaving, setProjectSaving] = useState(false);

  // Project editor state
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('speech');
  const [evalTemplateId, setEvalTemplateId] = useState<string>('');
  const [isElective, setIsElective] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState<number | ''>('');

  const editor = useCreateBlockNote({
    initialContent: selectedProject?.content ?? undefined,
  });

  const sensors = useSensors(useSensor(PointerSensor));

  // Sync description HTML into contenteditable on mount
  useEffect(() => {
    if (descriptionRef.current && skill?.description) {
      descriptionRef.current.innerHTML = skill.description;
    }
  }, [skill?.description]);

  // Load levels when skill is saved
  useEffect(() => {
    if (!savedSkill) return;
    getLevels(savedSkill.id).then(setLevels).catch(console.error);
    listEvaluationTemplates(clubId).then(setEvalTemplates).catch(console.error);
  }, [savedSkill, clubId]);

  // Load projects when a level is selected
  useEffect(() => {
    if (!selectedLevel) {
      setProjects([]);
      setSelectedProject(null);
      return;
    }
    getProjects(selectedLevel.id).then(setProjects).catch(console.error);
  }, [selectedLevel]);

  // Populate project editor fields when selected project changes
  useEffect(() => {
    if (selectedProject) {
      setProjectTitle(selectedProject.title);
      setProjectDescription(selectedProject.description);
      setProjectType(selectedProject.project_type);
      setEvalTemplateId(selectedProject.evaluation_template_id ?? '');
      setIsElective(selectedProject.is_elective);
      setTimeEstimate(selectedProject.time_estimate_minutes ?? '');
    } else {
      setProjectTitle('');
      setProjectDescription('');
      setProjectType('speech');
      setEvalTemplateId('');
      setIsElective(false);
      setTimeEstimate('');
    }
  }, [selectedProject]);

  // ---- Title → slug auto-generation ----
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugEdited) setSlug(generateSlug(val));
  };

  // ---- Save skill settings ----
  const handleSaveSkill = async () => {
    if (!title.trim()) return;
    setSkillSaving(true);
    try {
      const saved = await saveSkill({
        id: savedSkill?.id,
        club_id: clubId,
        title: title.trim(),
        description: description.trim(),
        slug: slug.trim() || generateSlug(title),
        published,
      });
      setSavedSkill(saved);
      onSaved(saved);
    } finally {
      setSkillSaving(false);
    }
  };

  // ---- Add / save level ----
  const handleAddLevel = async () => {
    if (!savedSkill) return;
    const newLevel = await saveLevel({
      skill_id: savedSkill.id,
      club_id: clubId,
      title: `Level ${levels.length + 1}`,
      order_index: levels.length,
    });
    setLevels((prev) => [...prev, newLevel]);
    selectLevel(newLevel);
    setActivePanel('levels');
  };

  const selectLevel = (level: LearningLevel) => {
    setSelectedLevel(level);
    setLevelTitle(level.title);
    setLevelDescription(level.description);
    setRequiredProjects(level.required_projects);
    setSelectedProject(null);
    setActivePanel('levels');
  };

  const handleSaveLevel = async () => {
    if (!selectedLevel) return;
    setLevelSaving(true);
    try {
      const updated = await saveLevel({
        id: selectedLevel.id,
        skill_id: selectedLevel.skill_id,
        club_id: clubId,
        title: levelTitle,
        description: levelDescription,
        order_index: selectedLevel.order_index,
        required_projects: requiredProjects,
      });
      setLevels((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setSelectedLevel(updated);
    } finally {
      setLevelSaving(false);
    }
  };

  const handleDeleteLevel = async (levelId: string) => {
    await deleteLevel(levelId);
    setLevels((prev) => prev.filter((l) => l.id !== levelId));
    if (selectedLevel?.id === levelId) {
      setSelectedLevel(null);
      setActivePanel('settings');
    }
  };

  const handleLevelDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = levels.findIndex((l) => l.id === active.id);
    const newIndex = levels.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(levels, oldIndex, newIndex).map((l, i) => ({
      ...l,
      order_index: i,
    }));
    setLevels(reordered);
    await reorderLevels(reordered.map((l) => ({ id: l.id, order_index: l.order_index })));
  };

  // ---- Add / save project ----
  const handleAddProject = async () => {
    if (!selectedLevel || !savedSkill) return;
    const newProject = await saveProject({
      level_id: selectedLevel.id,
      skill_id: savedSkill.id,
      club_id: clubId,
      title: 'New Project',
      order_index: projects.length,
    });
    setProjects((prev) => [...prev, newProject]);
    setSelectedProject(newProject);
    setActivePanel('project');
  };

  const handleSaveProject = useCallback(async () => {
    if (!selectedLevel || !savedSkill) return;
    setProjectSaving(true);
    try {
      const content = editor.document;
      const updated = await saveProject({
        id: selectedProject?.id,
        level_id: selectedLevel.id,
        skill_id: savedSkill.id,
        club_id: clubId,
        title: projectTitle,
        description: projectDescription,
        content,
        project_type: projectType,
        evaluation_template_id: evalTemplateId || null,
        is_elective: isElective,
        time_estimate_minutes: timeEstimate === '' ? null : Number(timeEstimate),
        order_index: selectedProject?.order_index ?? projects.length,
      });
      setProjects((prev) =>
        selectedProject
          ? prev.map((p) => (p.id === updated.id ? updated : p))
          : [...prev, updated]
      );
      setSelectedProject(updated);
    } finally {
      setProjectSaving(false);
    }
  }, [
    selectedLevel, savedSkill, clubId, editor, selectedProject,
    projectTitle, projectDescription, projectType, evalTemplateId,
    isElective, timeEstimate, projects.length,
  ]);

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProject?.id === projectId) setSelectedProject(null);
  };

  const handleProjectDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(projects, oldIndex, newIndex).map((p, i) => ({
      ...p,
      order_index: i,
    }));
    setProjects(reordered);
    await reorderProjects(
      reordered.map((p) => ({ id: p.id, order_index: p.order_index }))
    );
  };

  // ============================================================
  // Panel: Skill Settings
  // ============================================================
  const renderSettingsPanel = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <BookOpen className="w-4 h-4" />
        Skill Settings
      </h3>
      <input
        type="text"
        placeholder="Skill title (e.g., Pitchmasters Fundamentals)"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
      />
      <div className="rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-tm-blue overflow-hidden">
        <div className="flex gap-1 px-2 py-1 border-b border-gray-200 bg-gray-50">
          {[
            { cmd: 'bold',                label: 'B', cls: 'font-bold' },
            { cmd: 'italic',              label: 'I', cls: 'italic' },
            { cmd: 'insertUnorderedList', label: '• List', cls: '' },
            { cmd: 'insertOrderedList',   label: '1. List', cls: '' },
          ].map(({ cmd, label, cls }) => (
            <button
              key={cmd}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); document.execCommand(cmd); }}
              className={`px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200 rounded ${cls}`}
              title={label}
            >{label}</button>
          ))}
        </div>
        <div className="relative">
          <div
            ref={descriptionRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => setDescription(descriptionRef.current?.innerHTML ?? '')}
            className="w-full min-h-[80px] px-3 py-2 text-sm text-gray-900 outline-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
          />
          {!description && (
            <span className="absolute top-2 left-3 text-sm text-gray-400 pointer-events-none select-none">
              Short description shown on the enrollment screen
            </span>
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">URL slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
          placeholder="url-friendly-name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue font-mono"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="rounded border-gray-300 text-tm-blue"
        />
        <span className="text-sm flex items-center gap-1">
          {published ? (
            <span className="text-green-700 flex items-center gap-1"><Globe className="w-4 h-4" /> Published — visible to all members</span>
          ) : (
            <span className="text-gray-500 flex items-center gap-1"><GlobeLock className="w-4 h-4" /> Check to publish — currently draft (officers only)</span>
          )}
        </span>
      </label>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSaveSkill}
          disabled={skillSaving || !title.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tm-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {skillSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {skillSaving ? 'Saving…' : 'Save Skill'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // ============================================================
  // Panel: Level Manager
  // ============================================================
  const renderLevelsPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Levels
        </h3>
        {savedSkill && (
          <button
            type="button"
            onClick={handleAddLevel}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 hover:border-tm-blue hover:text-tm-blue transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Level
          </button>
        )}
      </div>

      {!savedSkill && (
        <p className="text-xs text-gray-400 text-center py-4">
          Save the skill settings first to add levels.
        </p>
      )}

      {savedSkill && levels.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">
          No levels yet. Add one above.
        </p>
      )}

      {savedSkill && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleLevelDragEnd}
        >
          <SortableContext
            items={levels.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {levels.map((level) => (
                <SortableLevelRow
                  key={level.id}
                  level={level}
                  isSelected={selectedLevel?.id === level.id}
                  onSelect={() => selectLevel(level)}
                  onDelete={() => handleDeleteLevel(level.id)}
                  onEditContent={() => navigate(`/learn/admin/levels/${level.id}/content`)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Level settings when one is selected */}
      {selectedLevel && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Level Settings
          </p>
          <input
            type="text"
            placeholder="Level title"
            value={levelTitle}
            onChange={(e) => setLevelTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
          />
          <input
            type="text"
            placeholder="Brief description (optional)"
            value={levelDescription}
            onChange={(e) => setLevelDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
          />
          <button
            type="button"
            onClick={() => navigate(`/learn/admin/levels/${selectedLevel.id}/content`)}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-gray-300 hover:border-tm-blue hover:bg-blue-50 text-sm text-gray-700 hover:text-tm-blue transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Edit Learning Materials
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Projects required to complete:
            <input
              type="number"
              min={1}
              value={requiredProjects}
              onChange={(e) => setRequiredProjects(Number(e.target.value))}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
            />
          </label>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSaveLevel}
              disabled={levelSaving}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-tm-blue text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {levelSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Level
            </button>
            <button
              type="button"
              onClick={handleAddProject}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md border border-gray-300 hover:border-tm-blue hover:text-tm-blue transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Project
            </button>
          </div>

          {/* Project list for this level */}
          {projects.length > 0 && (
            <div className="pt-2 space-y-1">
              <p className="text-xs text-gray-500 font-medium">Projects:</p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleProjectDragEnd}
              >
                <SortableContext
                  items={projects.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {projects.map((project) => (
                    <SortableProjectRow
                      key={project.id}
                      project={project}
                      isSelected={selectedProject?.id === project.id}
                      onSelect={() => { setSelectedProject(project); setActivePanel('project'); }}
                      onDelete={() => handleDeleteProject(project.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ============================================================
  // Panel: Project Editor
  // ============================================================
  const renderProjectPanel = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        {selectedProject ? 'Edit Project' : 'New Project'}
      </h3>

      <input
        type="text"
        placeholder="Project title"
        value={projectTitle}
        onChange={(e) => setProjectTitle(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
      />

      <input
        type="text"
        placeholder="Short summary (shown in listings)"
        value={projectDescription}
        onChange={(e) => setProjectDescription(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Project type
          </label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as ProjectType)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
          >
            <option value="speech">Speech</option>
            <option value="assignment">Assignment</option>
            <option value="evaluation_exercise">Evaluation Exercise</option>
            <option value="elective">Elective</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Time estimate (min)
          </label>
          <input
            type="number"
            min={1}
            placeholder="e.g., 30"
            value={timeEstimate}
            onChange={(e) =>
              setTimeEstimate(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Evaluation template
        </label>
        <select
          value={evalTemplateId}
          onChange={(e) => setEvalTemplateId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
        >
          <option value="">None</option>
          {evalTemplates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={isElective}
          onChange={(e) => setIsElective(e.target.checked)}
          className="rounded border-gray-300 text-tm-blue"
        />
        This is an elective (optional) project
      </label>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Project content
        </label>
        <div className="border border-gray-300 rounded-lg overflow-hidden min-h-[200px]">
          <BlockNoteView editor={editor} theme="light" />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSaveProject}
        disabled={projectSaving || !projectTitle.trim()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tm-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {projectSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {projectSaving ? 'Saving…' : 'Save Project'}
      </button>
    </div>
  );

  // ============================================================
  // Layout
  // ============================================================
  return (
    <div className="space-y-4">
      {/* Panel tabs (mobile-friendly) */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(
          [
            { key: 'settings', label: 'Settings', icon: BookOpen },
            { key: 'levels', label: 'Levels', icon: Layers },
            { key: 'project', label: 'Project', icon: FileText },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActivePanel(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activePanel === key
                ? 'bg-white text-tm-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {activePanel === 'settings' && renderSettingsPanel()}
        {activePanel === 'levels' && renderLevelsPanel()}
        {activePanel === 'project' && selectedLevel && renderProjectPanel()}
        {activePanel === 'project' && !selectedLevel && (
          <p className="text-sm text-gray-400 text-center py-8">
            Select a level first to add or edit projects.
          </p>
        )}
      </div>
    </div>
  );
}
