import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { EvaluationTemplate, EvaluationField, EvaluationSubmission } from '../../types';
import RatingField from './RatingField';

interface EvaluationFormProps {
  template: EvaluationTemplate;
  completionId: string;
  onSubmit: (data: EvaluationSubmission) => Promise<void>;
  readOnly?: boolean;
  initialData?: EvaluationSubmission;
}

const DRAFT_KEY = (id: string) => `eval_draft_${id}`;

function getDefaultValue(field: EvaluationField): string | number | boolean {
  switch (field.type) {
    case 'rating': return 0;
    case 'checkbox': return false;
    default: return '';
  }
}

export default function EvaluationForm({
  template,
  completionId,
  onSubmit,
  readOnly = false,
  initialData,
}: EvaluationFormProps) {
  const [values, setValues] = useState<EvaluationSubmission>(() => {
    if (initialData) return initialData;

    // Restore draft from localStorage
    try {
      const saved = localStorage.getItem(DRAFT_KEY(completionId));
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }

    // Initialize from template defaults
    return Object.fromEntries(
      template.fields.map((f) => [f.id, getDefaultValue(f)])
    );
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save to localStorage as the evaluator types
  useEffect(() => {
    if (readOnly || submitted) return;
    try {
      localStorage.setItem(DRAFT_KEY(completionId), JSON.stringify(values));
    } catch {
      // quota exceeded — ignore
    }
  }, [values, completionId, readOnly, submitted]);

  const setValue = useCallback(
    (fieldId: string, value: string | number | boolean) => {
      setValues((prev) => ({ ...prev, [fieldId]: value }));
    },
    []
  );

  const allRequiredFilled = template.fields.every((field) => {
    if (!field.required) return true;
    const val = values[field.id];
    if (field.type === 'rating') return typeof val === 'number' && val > 0;
    if (field.type === 'checkbox') return val === true;
    return typeof val === 'string' && val.trim().length > 0;
  });

  const handleSubmit = async () => {
    if (!allRequiredFilled) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
      localStorage.removeItem(DRAFT_KEY(completionId));
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="text-lg font-medium text-gray-800">Evaluation submitted!</p>
        <p className="text-sm text-gray-500">
          Your feedback has been recorded and the member will be notified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{template.name}</h3>
        {template.description && (
          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
        )}
      </div>

      <div className="space-y-5">
        {template.fields.map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(val) => setValue(field.id, val)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allRequiredFilled || submitting}
          className="w-full py-3 px-4 rounded-lg font-medium text-white bg-tm-blue hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
        >
          {submitting ? 'Submitting…' : 'Submit Evaluation'}
        </button>
      )}

      {!readOnly && !allRequiredFilled && (
        <p className="text-xs text-gray-400 text-center">
          Complete all required fields to submit.
        </p>
      )}
    </div>
  );
}

// ============================================================
// Field dispatcher
// ============================================================

interface FieldRendererProps {
  field: EvaluationField;
  value: string | number | boolean | undefined;
  onChange: (val: string | number | boolean) => void;
  readOnly: boolean;
}

function FieldRenderer({ field, value, onChange, readOnly }: FieldRendererProps) {
  switch (field.type) {
    case 'rating':
      return (
        <RatingField
          label={field.label}
          max={field.max ?? 5}
          required={field.required}
          value={typeof value === 'number' ? value : 0}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
        />
      );

    case 'textarea':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-tm-maroon ml-1">*</span>}
          </label>
          <textarea
            rows={4}
            disabled={readOnly}
            placeholder={field.placeholder ?? ''}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue disabled:bg-gray-50 disabled:text-gray-500 resize-none"
          />
        </div>
      );

    case 'text':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-tm-maroon ml-1">*</span>}
          </label>
          <input
            type="text"
            disabled={readOnly}
            placeholder={field.placeholder ?? ''}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            disabled={readOnly}
            checked={typeof value === 'boolean' ? value : false}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-tm-blue focus:ring-tm-blue"
          />
          <span className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-tm-maroon ml-1">*</span>}
          </span>
        </label>
      );

    case 'select':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-tm-maroon ml-1">*</span>}
          </label>
          <select
            disabled={readOnly}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue disabled:bg-gray-50 min-h-touch"
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );

    default:
      return null;
  }
}
