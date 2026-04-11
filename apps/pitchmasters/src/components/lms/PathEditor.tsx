import { useState, useEffect, useCallback } from 'react';
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
import type { LearningPath, LearningLevel, LearningProject, EvaluationTemplate, ProjectType } from '../../types';
import {
  savePath,
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

interface PathEditorProps {
  path?: LearningPath;
  clubId: string;
  onSaved: (path: LearningPath) => void;
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
}: {
  level: LearningLevel;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${
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
        className="flex-1 text-left text-sm text-gray-800 font-medium truncate"
      >
        {level.title || 'Untitled Level'}
      </button>
      <ChevronRight
        className={`w-4 h-4 flex-shrink-0 transition-colors ${
          isSelected ? 'text-tm-blue' : 'text-gray-400'
        }`}
      />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${
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
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
        aria-label="Delete project"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ============================================================
// Main PathEditor
// ============================================================
export default function PathEditor({ path, clubId, onSaved, onCancel }: PathEditorProps) {
  const [activePanel, setActivePanel] = useState<Panel>('settings');

  // Path settings state
  const [title, setTitle] = useState(path?.title ?? '');
  const [description, setDescription] = useState(path?.description ?? '');
  const [slug, setSlug] = useState(path?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(!!path?.slug);
  const [published, setPublished] = useState(path?.published ?? false);
  const [pathSaving, setPathSaving] = useState(false);
  const [savedPath, setSavedPath] = useState<LearningPath | undefined>(path);

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

  // Load levels when path is saved
  useEffect(() => {
    if (!savedPath) return;
    getLevels(savedPath.id).then(setLevels).catch(console.error);
    listEvaluationTemplates(clubId).then(setEvalTemplates).catch(console.error);
  }, [savedPath, clubId]);

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

  // ---- Save path settings ----
  const handleSavePath = async () => {
    if (!title.trim()) return;
    setPathSaving(true);
    try {
      const saved = await savePath({
        id: savedPath?.id,
        club_id: clubId,
        title: title.trim(),
        description: description.trim(),
        slug: slug.trim() || generateSlug(title),
        published,
      });
      setSavedPath(saved);
      onSaved(saved);
    } finally {
      setPathSaving(false);
    }
  };

  // ---- Add / save level ----
  const handleAddLevel = async () => {
    if (!savedPath) return;
    const newLevel = await saveLevel({
      path_id: savedPath.id,
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
        path_id: selectedLevel.path_id,
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
    if (!selectedLevel || !savedPath) return;
    const newProject = await saveProject({
      level_id: selectedLevel.id,
      path_id: savedPath.id,
      club_id: clubId,
      title: 'New Project',
      order_index: projects.length,
    });
    setProjects((prev) => [...prev, newProject]);
    setSelectedProject(newProject);
    setActivePanel('project');
  };

  const handleSaveProject = useCallback(async () => {
    if (!selectedLevel || !savedPath) return;
    setProjectSaving(true);
    try {
      const content = editor.document;
      const updated = await saveProject({
        id: selectedProject?.id,
        level_id: selectedLevel.id,
        path_id: savedPath.id,
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
    selectedLevel, savedPath, clubId, editor, selectedProject,
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
  // Panel: Path Settings
  // ============================================================
  const renderSettingsPanel = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <BookOpen className="w-4 h-4" />
        Path Settings
      </h3>
      <input
        type="text"
        placeholder="Path title (e.g., Pitchmasters Fundamentals)"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
      />
      <textarea
        rows={3}
        placeholder="Short description shown on the enrollment screen"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-tm-blue"
      />
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
        <span className="text-sm text-gray-700 flex items-center gap-1">
          {published ? (
            <><Globe className="w-4 h-4 text-green-600" /> Published (members can enroll)</>
          ) : (
            <><GlobeLock className="w-4 h-4 text-gray-400" /> Draft (only visible to officers)</>
          )}
        </span>
      </label>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSavePath}
          disabled={pathSaving || !title.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tm-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {pathSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {pathSaving ? 'Saving…' : 'Save Path'}
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
        {savedPath && (
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

      {!savedPath && (
        <p className="text-xs text-gray-400 text-center py-4">
          Save the path settings first to add levels.
        </p>
      )}

      {savedPath && levels.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">
          No levels yet. Add one above.
        </p>
      )}

      {savedPath && (
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
