import { logger } from '../utils/logger'
interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: unknown) => boolean
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on network errors, not on auth/permission errors
    const e = error as { code?: string | number; status?: number } | null
    const code = e?.code || e?.status
    return (
      code === 'NETWORK_ERROR' ||
      code === 'PGRST301' || // Supabase timeout
      code === 503 || // Service unavailable
      code === 502 // Bad gateway
    )
  },
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let lastError: unknown
  let delay = opts.initialDelay

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error

      // Don't retry if we shouldn't (e.g., auth errors)
      if (!opts.shouldRetry(error)) {
        throw error
      }

      // Don't retry if we've exhausted attempts
      if (attempt === opts.maxRetries) {
        break
      }

      // Log retry attempt in development
      if (import.meta.env.DEV) {
        logger.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`)
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Exponential backoff with max cap
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay)
    }
  }

  // All retries failed
  throw lastError
}
