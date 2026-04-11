import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${destructive ? 'bg-red-100' : 'bg-rotary-azure/10'}`}>
              <AlertTriangle className={`w-5 h-5 ${destructive ? 'text-red-600' : 'text-rotary-azure'}`} />
            </div>
            <div>
              <h2 id="confirm-modal-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
              <div className="mt-1 text-sm text-gray-600">{message}</div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors ${
                destructive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-rotary-azure hover:bg-rotary-azure/90'
              }`}
            >
              {isLoading ? 'Processing…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
