import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastType = 'error' | 'success' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    const timer = setTimeout(() => dismiss(id), 5000)
    timersRef.current.set(id, timer)
  }, [dismiss])

  const colorMap: Record<ToastType, string> = {
    error: 'bg-red-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    info: 'bg-rotary-azure',
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          aria-atomic="false"
          className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full"
        >
          {toasts.map(toast => (
            <div
              key={toast.id}
              role="alert"
              className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${colorMap[toast.type]}`}
            >
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
