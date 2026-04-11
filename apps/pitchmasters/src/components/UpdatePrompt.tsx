import { logger } from '../utils/logger'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      if (!registration) return

      // Check for updates every hour
      logger.log('[PWA] Service worker registered. Checking for updates hourly.')
      setInterval(() => {
        logger.log('[PWA] Checking for updates...')
        registration.update()
      }, 60 * 60 * 1000)
    },
    onRegisterError(error: Error) {
      logger.error('[PWA] Service worker registration failed:', error)
    },
  })

  if (!needRefresh) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-[#E31F26] rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Update Available
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              A new version of Pitchmasters is ready to install.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 px-4 py-2 bg-[#E31F26] text-white rounded-lg hover:bg-[#C71C21] transition-colors font-medium text-sm"
              >
                Update Now
              </button>
              <button
                onClick={() => setNeedRefresh(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
