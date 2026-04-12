/**
 * InstallPrompt Component
 * Guides iOS users to install the PWA via "Add to Home Screen"
 *
 * Features:
 * - Detects iOS Safari (not installed as PWA)
 * - Shows dismissible banner with visual instructions
 * - Persists dismissal in localStorage
 * - Rotary brand styling
 * - Touch-friendly (44px min height)
 * - Accessible (ARIA labels, keyboard support)
 */

import { useState, useEffect } from 'react'
import { X, Share, Plus } from 'lucide-react'

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-prompt-dismissed')
    if (dismissed === 'true') {
      return
    }

    // Detect iOS Safari (not in standalone mode)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent)

    // Show prompt only for iOS Safari users who haven't installed the app
    if (isIOS && isSafari && !isInStandaloneMode) {
      // Delay showing prompt by 3 seconds to avoid overwhelming new users
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-prompt-dismissed', 'true')
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
    >
      <div className="bg-white rounded-lg shadow-2xl border-2 border-[#0067c8] p-4 max-w-md mx-auto">
        {/* Header with Close Button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-[#0067c8] rounded-lg p-2">
              <img
                src="/icons/favicon-32x32.png"
                alt="Georgetown Rotary"
                className="w-6 h-6"
              />
            </div>
            <div>
              <h2
                id="install-prompt-title"
                className="text-sm font-bold text-gray-900"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                Install Our App
              </h2>
              <p className="text-xs text-gray-600">
                For the best experience
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Dismiss installation prompt"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Instructions */}
        <div
          id="install-prompt-description"
          className="space-y-2 text-sm text-gray-700 mb-4"
        >
          <p className="font-medium">To install this app:</p>
          <ol className="space-y-2 pl-1">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#0067c8] text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span className="pt-0.5">
                Tap the <Share size={16} className="inline text-[#0067c8]" /> <strong>Share</strong> button below
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#0067c8] text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span className="pt-0.5">
                Scroll down and tap <Plus size={16} className="inline text-[#0067c8]" /> <strong>"Add to Home Screen"</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#0067c8] text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span className="pt-0.5">
                Tap <strong>"Add"</strong> to confirm
              </span>
            </li>
          </ol>
        </div>

        {/* Visual Share Button Indicator */}
        <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Share size={20} className="text-[#0067c8]" />
          <span className="text-sm text-gray-700">
            Look for the Share button in your browser
          </span>
        </div>

        {/* Dismiss Link */}
        <button
          onClick={handleDismiss}
          className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700 underline min-h-[44px] flex items-center justify-center"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
