import { logger } from './logger'
/**
 * Umami Analytics Integration
 *
 * Comprehensive event tracking for Georgetown Rotary Club app.
 * Follows Brandmine patterns: track user intent (attempts) AND outcomes (success/error).
 *
 * Loads Umami analytics script only in production environment.
 * Development builds skip analytics to avoid polluting metrics.
 */

// Extend Window interface for Umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
  }
}

/**
 * Event data interface for type safety
 */
export interface EventData {
  // CTA tracking
  ctaText?: string;
  ctaLocation?: string;
  ctaDestination?: string;

  // Form tracking
  formName?: string;
  formStep?: number;
  fieldName?: string;

  // User interactions
  action?: string;
  target?: string;
  value?: string | number;

  // Navigation
  fromPage?: string;
  toPage?: string;
  viewMode?: string;

  // Errors
  error?: string;
  errorType?: string;

  // Metadata (JSONB-friendly)
  metadata?: Record<string, unknown>;

  // Index signature for compatibility with Umami
  [key: string]: string | number | Record<string, unknown> | undefined;
}

/**
 * Initialize Umami analytics script
 */
export function initializeAnalytics(): void {
  // Only load analytics in production
  if (import.meta.env.PROD) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://umami-production-6e7f.up.railway.app/script.js';
    script.setAttribute('data-website-id', '36c9af24-a97b-47df-bbad-fd8c7f478724');

    // Add error handling
    script.onerror = () => {
      logger.warn('Umami analytics failed to load');
    };

    document.head.appendChild(script);
  } else {
    logger.log('Analytics disabled in development mode');
  }
}

/**
 * Track custom event with optional data
 *
 * @param eventName - Event name in kebab-case (e.g., 'speaker-created', 'view-mode-changed')
 * @param eventData - Optional event metadata
 *
 * @example
 * trackEvent('speaker-created', { formName: 'add-speaker-modal' });
 * trackEvent('cta-click', { ctaText: 'view-speakers', ctaLocation: 'dashboard' });
 */
export function trackEvent(eventName: string, eventData?: EventData): void {
  if (import.meta.env.PROD) {
    // Production: send to Umami
    if (window.umami) {
      window.umami.track(eventName, eventData);
    } else {
      logger.warn('Umami not loaded, event not tracked:', eventName);
    }
  } else {
    // Development: console log for debugging
    logger.log('[Analytics]', eventName, eventData || '');
  }
}

/**
 * Track page view (for SPA route changes)
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  trackEvent('page-view', {
    toPage: pagePath,
    value: pageTitle || pagePath,
  });
}

/**
 * Track CTA button clicks
 */
export function trackCTA(ctaText: string, ctaLocation: string, ctaDestination: string): void {
  trackEvent('cta-click', {
    ctaText,
    ctaLocation,
    ctaDestination,
  });
}

/**
 * Track form interactions following Brandmine patterns
 */
export const trackForm = {
  /**
   * Track form step progression (multi-step forms)
   */
  step: (formName: string, stepNumber: number): void => {
    trackEvent(`${formName}-step-${stepNumber}`, { formName, formStep: stepNumber });
  },

  /**
   * Track field interactions (focus/blur)
   */
  field: (formName: string, fieldName: string, action: 'focus' | 'blur'): void => {
    trackEvent(`${formName}-field-${action}`, { formName, fieldName, action });
  },

  /**
   * Track form submit attempt (before API call)
   * This tracks user INTENT even if API fails
   */
  attempt: (formName: string): void => {
    trackEvent(`${formName}-submit-attempt`, { formName });
  },

  /**
   * Track form submit success
   */
  success: (formName: string, metadata?: Record<string, unknown>): void => {
    trackEvent(`${formName}-submit-success`, { formName, metadata });
  },

  /**
   * Track form submit error
   */
  error: (formName: string, error: string): void => {
    trackEvent(`${formName}-submit-error`, { formName, error, errorType: 'form-submission' });
  },
};

/**
 * Track modal interactions
 */
export const trackModal = {
  open: (modalName: string, trigger?: string): void => {
    trackEvent(`${modalName}-opened`, { target: modalName, action: 'open', value: trigger });
  },

  close: (modalName: string): void => {
    trackEvent(`${modalName}-closed`, { target: modalName, action: 'close' });
  },
};

/**
 * Track navigation events
 */
export function trackNavigation(fromPage: string, toPage: string, navLocation: string): void {
  trackEvent('navigation', { fromPage, toPage, ctaLocation: navLocation });
}

/**
 * Track user interactions (drag-and-drop, filters, view changes)
 */
export function trackInteraction(action: string, target: string, value?: string | number): void {
  trackEvent('user-interaction', { action, target, value });
}

/**
 * Track errors (failed operations, network issues)
 */
export function trackError(errorType: string, error: string, metadata?: Record<string, unknown>): void {
  trackEvent('error', { errorType, error, metadata });
}
