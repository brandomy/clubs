/* eslint-disable react-refresh/only-export-components */
/**
 * Shared utilities for route components
 * Used across all entity route implementations (speakers, projects, members, etc.)
 */

/**
 * UUID validation regex
 * PostgreSQL UUIDs are lowercase hex digits separated by hyphens
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validates if a string is a properly formatted UUID
 * @param id - String to validate
 * @returns true if valid UUID format, false otherwise
 */
export function validateUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

/**
 * Loading modal component for route transitions
 * Displays while data is being fetched for modal views
 */
export function LoadingModal() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="animate-spin h-8 w-8 border-4 border-[#0067c8] border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Error modal component for route error handling
 * Displays when speaker/entity cannot be loaded or found
 */
interface ErrorModalProps {
  message: string
  onClose: () => void
}

export function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
        <div className="flex items-center text-red-600 mb-4">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold">Error</h2>
        </div>
        <p className="text-gray-700 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-[#0067c8] text-white px-4 py-2 rounded hover:bg-[#004a8a] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
