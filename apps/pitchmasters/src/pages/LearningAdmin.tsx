import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Plus, Edit, BarChart2, ClipboardList, BookOpen, Lock, GripVertical } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { listSkills, reorderSkills } from '../hooks/useLearning';
import type { LearningSkill } from '../types';

// ── Sortable skill row ────────────────────────────────────────────────────────

function SortableSkillRow({
  skill,
  onEdit,
}: {
  skill: LearningSkill;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: skill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{skill.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {skill.description?.replace(/<[^>]+>/g, ' ').trim()}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              skill.published
                ? 'bg-green-50 text-green-600'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {skill.published ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:border-tm-blue hover:text-tm-blue transition-colors flex-shrink-0"
      >
        <Edit className="w-3.5 h-3.5" />
        Edit
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LearningAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [skills, setSkills] = useState<LearningSkill[]>([]);
  const [loading, setLoading] = useState(true);

  const clubId = user?.club_id ?? '';
  const isOfficer = user?.role === 'officer' || user?.role === 'admin';

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (!clubId || !isOfficer) return;
    listSkills(clubId)
      .then(setSkills)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clubId, isOfficer]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = skills.findIndex((s) => s.id === active.id);
    const newIndex = skills.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(skills, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order_index: i,
    }));

    setSkills(reordered);
    await reorderSkills(reordered.map((s) => ({ id: s.id, order_index: s.order_index })));
  };

  if (!isOfficer) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Lock className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">Officers and admins only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Learning Admin</h1>
        <button
          type="button"
          onClick={() => navigate('/learn')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Member view →
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: 'New Learning Skill',
            icon: <Plus className="w-5 h-5" />,
            onClick: () => navigate('/learn/admin/skills/new'),
            accent: true,
          },
          {
            label: 'Evaluation Templates',
            icon: <ClipboardList className="w-5 h-5" />,
            onClick: () => navigate('/learn/admin/templates'),
          },
          {
            label: 'Analytics',
            icon: <BarChart2 className="w-5 h-5" />,
            onClick: () => navigate('/learn/admin/analytics'),
          },
        ].map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left font-medium text-sm transition-all min-h-touch ${
              action.accent
                ? 'bg-tm-blue text-white border-tm-blue hover:bg-blue-700'
                : 'bg-white text-gray-700 border-gray-200 hover:border-tm-blue hover:text-tm-blue'
            }`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* Skill list */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Learning Skills ({skills.length})
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : skills.length === 0 ? (
          <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No learning skills yet.</p>
            <button
              type="button"
              onClick={() => navigate('/learn/admin/skills/new')}
              className="mt-3 text-sm text-tm-blue hover:underline"
            >
              Create the first skill →
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={skills.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {skills.map((s) => (
                  <SortableSkillRow
                    key={s.id}
                    skill={s}
                    onEdit={() => navigate(`/learn/admin/skills/${s.id}`)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>
    </div>
  );
}
