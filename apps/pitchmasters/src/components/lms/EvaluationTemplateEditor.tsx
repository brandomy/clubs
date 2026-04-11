import { useState, useCallback } from 'react';
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
  Trash2,
  Star,
  AlignLeft,
  Type,
  CheckSquare,
  ChevronDown,
  Save,
  Loader2,
} from 'lucide-react';
import type { EvaluationTemplate, EvaluationField } from '../../types';
import { saveEvaluationTemplate } from '../../hooks/useLearning';

interface EvaluationTemplateEditorProps {
  template?: EvaluationTemplate;
  clubId: string;
  onSaved: (template: EvaluationTemplate) => void;
  onCancel: () => void;
}

type FieldType = EvaluationField['type'];

const FIELD_TYPE_ICONS: Record<FieldType, React.ReactNode> = {
  rating: <Star className="w-4 h-4" />,
  textarea: <AlignLeft className="w-4 h-4" />,
  text: <Type className="w-4 h-4" />,
  checkbox: <CheckSquare className="w-4 h-4" />,
  select: <ChevronDown className="w-4 h-4" />,
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  rating: 'Star Rating',
  textarea: 'Long Text',
  text: 'Short Text',
  checkbox: 'Checkbox',
  select: 'Dropdown',
};

function makeField(type: FieldType): EvaluationField {
  return {
    id: crypto.randomUUID(),
    type,
    label: '',
    required: true,
    ...(type === 'rating' ? { max: 5 } : {}),
    ...(type === 'select' ? { options: [] } : {}),
  };
}

// ============================================================
// Sortable field row
// ============================================================
interface SortableFieldProps {
  field: EvaluationField;
  onChange: (updated: EvaluationField) => void;
  onDelete: () => void;
}

function SortableField({ field, onChange, onDelete }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Field type badge */}
        <span className="mt-1 flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
          {FIELD_TYPE_ICONS[field.type]}
          {FIELD_TYPE_LABELS[field.type]}
        </span>

        {/* Label input */}
        <input
          type="text"
          placeholder="Field label…"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
        />

        {/* Required toggle */}
        <label className="flex items-center gap-1.5 mt-1 text-xs text-gray-600 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
            className="rounded border-gray-300 text-tm-blue"
          />
          Required
        </label>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="mt-1 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Delete field"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Extra config per type */}
      {field.type === 'rating' && (
        <div className="ml-7 flex items-center gap-2 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            Max stars:
            <input
              type="number"
              min={3}
              max={10}
              value={field.max ?? 5}
              onChange={(e) => onChange({ ...field, max: Number(e.target.value) })}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
            />
          </label>
        </div>
      )}

      {field.type === 'select' && (
        <div className="ml-7 space-y-1">
          <p className="text-xs text-gray-500">Options (one per line):</p>
          <textarea
            rows={3}
            placeholder="Option A&#10;Option B&#10;Option C"
            value={(field.options ?? []).join('\n')}
            onChange={(e) =>
              onChange({
                ...field,
                options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
              })
            }
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue resize-none"
          />
        </div>
      )}

      {(field.type === 'text' || field.type === 'textarea') && (
        <div className="ml-7">
          <input
            type="text"
            placeholder="Placeholder text (optional)"
            value={field.placeholder ?? ''}
            onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main editor
// ============================================================
export default function EvaluationTemplateEditor({
  template,
  clubId,
  onSaved,
  onCancel,
}: EvaluationTemplateEditorProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [fields, setFields] = useState<EvaluationField[]>(template?.fields ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const addField = (type: FieldType) => {
    setFields((prev) => [...prev, makeField(type)]);
  };

  const updateField = useCallback((id: string, updated: EvaluationField) => {
    setFields((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }, []);

  const deleteField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((prev) => {
        const oldIndex = prev.findIndex((f) => f.id === active.id);
        const newIndex = prev.findIndex((f) => f.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await saveEvaluationTemplate({
        id: template?.id,
        club_id: clubId,
        name: name.trim(),
        description: description.trim(),
        fields,
      });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {template ? 'Edit Evaluation Template' : 'New Evaluation Template'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Build a reusable evaluation form that evaluators fill out on mobile.
        </p>
      </div>

      {/* Name + description */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Template name (e.g., Standard Pitch Evaluation)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue"
        />
      </div>

      {/* Field list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                No fields yet. Add one below.
              </p>
            )}
            {fields.map((field) => (
              <SortableField
                key={field.id}
                field={field}
                onChange={(updated) => updateField(field.id, updated)}
                onDelete={() => deleteField(field.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add field buttons */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          Add field
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addField(type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:border-tm-blue hover:text-tm-blue transition-colors"
            >
              {FIELD_TYPE_ICONS[type]}
              {FIELD_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tm-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving…' : 'Save Template'}
        </button>
      </div>
    </div>
  );
}
