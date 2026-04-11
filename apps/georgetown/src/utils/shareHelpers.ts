import { logger } from './logger'
/**
 * Web Share API utilities for Georgetown Rotary Club
 * Handles native sharing with clipboard fallback
 * China-safe, offline-capable, analytics-integrated
 */

import { trackEvent } from './analytics'

export interface ShareData {
  title: string
  text: string
  url: string
}

// Track pending share operation to prevent "InvalidStateError: An earlier share has not yet completed"
let isShareInProgress = false

/**
 * Main share function with Web Share API and clipboard fallback
 * @param contentType - Type of content being shared ('project', 'speaker', 'member', or 'partner')
 */
export async function shareContent(
  data: ShareData,
  contentType: 'project' | 'speaker' | 'member' | 'partner',
  onSuccess?: (method: 'native' | 'clipboard') => void,
  onError?: (error: Error) => void
): Promise<{ success: boolean; method?: 'native' | 'clipboard'; error?: Error }> {
  // Prevent multiple simultaneous share operations
  if (isShareInProgress) {
    logger.warn('Share already in progress, ignoring duplicate request')
    return { success: false }
  }

  try {
    // Try Web Share API first
    if (navigator.share && navigator.canShare && navigator.canShare(data)) {
      isShareInProgress = true
      await navigator.share(data)

      // Track analytics
      const contentId = extractIdFromUrl(data.url)
      trackEvent(`${contentType}-shared`, {
        method: 'native',
        [`${contentType}Id`]: contentId,
      })

      onSuccess?.('native')
      return { success: true, method: 'native' }
    } else {
      // Fallback to clipboard
      return await copyToClipboard(data.url, contentType, onSuccess, onError)
    }
  } catch (error) {
    const err = error as Error

    // User canceled share sheet - not an error
    if (err.name === 'AbortError') {
      return { success: false }
    }

    // Actual error - try clipboard fallback
    logger.error('Share failed:', err)
    return await copyToClipboard(data.url, contentType, onSuccess, onError)
  } finally {
    // Always reset the flag when share completes or fails
    isShareInProgress = false
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use shareContent instead
 */
export async function shareProject(
  data: ShareData,
  onSuccess?: (method: 'native' | 'clipboard') => void,
  onError?: (error: Error) => void
): Promise<{ success: boolean; method?: 'native' | 'clipboard'; error?: Error }> {
  return shareContent(data, 'project', onSuccess, onError)
}

/**
 * Copy URL to clipboard using modern Clipboard API
 */
export async function copyToClipboard(
  text: string,
  contentType: 'project' | 'speaker' | 'member' | 'partner' = 'project',
  onSuccess?: (method: 'native' | 'clipboard') => void,
  onError?: (error: Error) => void
): Promise<{ success: boolean; method?: 'native' | 'clipboard'; error?: Error }> {
  try {
    // Try modern Clipboard API
    await navigator.clipboard.writeText(text)

    // Track analytics
    const contentId = extractIdFromUrl(text)
    trackEvent(`${contentType}-shared`, {
      method: 'clipboard',
      [`${contentType}Id`]: contentId,
    })

    onSuccess?.('clipboard')
    return { success: true, method: 'clipboard' }
  } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Fallback to execCommand for older browsers
    return fallbackCopyToClipboard(text, contentType, onSuccess, onError)
  }
}

/**
 * Legacy clipboard fallback for older browsers
 */
function fallbackCopyToClipboard(
  text: string,
  contentType: 'project' | 'speaker' | 'member' | 'partner' = 'project',
  onSuccess?: (method: 'native' | 'clipboard') => void,
  onError?: (error: Error) => void
): { success: boolean; method?: 'native' | 'clipboard'; error?: Error } {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-9999px'
  textArea.style.top = '0'
  textArea.setAttribute('readonly', '')

  document.body.appendChild(textArea)
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      const contentId = extractIdFromUrl(text)
      trackEvent(`${contentType}-shared`, {
        method: 'clipboard',
        [`${contentType}Id`]: contentId,
      })

      onSuccess?.('clipboard')
      return { success: true, method: 'clipboard' }
    } else {
      throw new Error('execCommand copy failed')
    }
  } catch (error) {
    document.body.removeChild(textArea)
    const err = error as Error
    onError?.(err)
    return { success: false, error: err }
  }
}

/**
 * Generate shareable URL for a service project
 * Uses path parameter format (RESTful routing)
 */
export function generateProjectUrl(projectId: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/projects/${projectId}`
}

/**
 * Generate shareable URL for a speaker
 * Uses new hybrid modal + URL routing format
 */
export function generateSpeakerUrl(speakerId: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/speakers/${speakerId}`
}

/**
 * Generate shareable URL for a member
 */
export function generateMemberUrl(memberId: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/members/${memberId}`
}

/**
 * Generate shareable URL for a partner
 */
export function generatePartnerUrl(partnerId: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/partners/${partnerId}`
}

/**
 * Extract ID from URL (for analytics)
 * Works for projects, speakers, members, and partners
 * Supports both legacy query params (?id=...) and new path params (/:resource/:id)
 */
function extractIdFromUrl(url: string): string | undefined {
  try {
    const urlObj = new URL(url)

    // Try query parameter first (legacy format for backwards compatibility)
    const queryId = urlObj.searchParams.get('id')
    if (queryId) return queryId

    // Try path parameter (RESTful routing format)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    // For /speakers/:id, /projects/:id, /members/:id, /partners/:id, etc.
    // Return the ID (second segment)
    if (pathParts.length >= 2) {
      return pathParts[1]
    }

    return undefined
  } catch {
    return undefined
  }
}

/**
 * Optional: Detect WeChat browser for specific messaging
 */
export function isWeChat(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent)
}
