// Development-only logger
const isDev = import.meta.env.DEV

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args) // eslint-disable-line no-console
    }
  },

  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args) // eslint-disable-line no-console
    }
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  },

  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args) // eslint-disable-line no-console
    }
  },

  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args) // eslint-disable-line no-console
    }
  },

  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args) // eslint-disable-line no-console
    }
  },
}
