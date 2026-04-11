import { Star } from 'lucide-react';

interface RatingFieldProps {
  label: string;
  max?: number;
  required?: boolean;
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

export default function RatingField({
  label,
  max = 5,
  required = false,
  value,
  onChange,
  readOnly = false,
}: RatingFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-tm-maroon ml-1">*</span>}
      </label>
      <div className="flex items-center gap-1" role="group" aria-label={label}>
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onChange(star)}
            disabled={readOnly}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            aria-pressed={value >= star}
            className={`min-h-touch min-w-touch flex items-center justify-center transition-colors ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                value >= star
                  ? 'fill-tm-maroon text-tm-maroon'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-gray-500">
            {value}/{max}
          </span>
        )}
      </div>
    </div>
  );
}
