import { logger } from '../utils/logger'
import { useEffect, useState } from 'react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      logger.log('[Offline Indicator] Connection restored')
      setIsOffline(false)

      // Hide banner after brief delay
      setTimeout(() => {
        setShowBanner(false)
      }, 3000)
    }

    const handleOffline = () => {
      logger.log('[Offline Indicator] Connection lost')
      setIsOffline(true)
      setShowBanner(true)
    }

    // Set initial state
    setIsOffline(!navigator.onLine)
    setShowBanner(!navigator.onLine)

    // Listen for connection changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner) {
    return null
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOffline ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className={`${
          isOffline
            ? 'bg-amber-500 text-amber-900'
            : 'bg-green-500 text-green-900'
        } px-4 py-3`}
      >
        <div className="container mx-auto flex items-center gap-3">
          <span className="text-2xl">
            {isOffline ? '📡' : '✅'}
          </span>
          <div className="flex-1">
            <div className="font-semibold">
              {isOffline ? "You're offline" : 'Back online!'}
            </div>
            <div className="text-sm opacity-90">
              {isOffline
                ? 'Some features may be unavailable. Viewing cached data.'
                : 'Connection restored. All features available.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
