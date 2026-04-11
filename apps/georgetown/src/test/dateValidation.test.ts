import { describe, it, expect } from 'vitest'
import { validateScheduledDate, validateDateRange } from '../utils/dateValidation'

const today = new Date()
today.setHours(0, 0, 0, 0)

const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)

const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

const fmt = (d: Date) => d.toISOString().split('T')[0]

describe('validateScheduledDate', () => {
  it('returns null for missing date (optional field)', () => {
    expect(validateScheduledDate(null, 'spoken')).toBeNull()
    expect(validateScheduledDate(undefined, 'spoken')).toBeNull()
  })

  it('returns error when spoken status has future date', () => {
    const result = validateScheduledDate(fmt(tomorrow), 'spoken')
    expect(result).toMatch(/past/)
  })

  it('returns null when spoken status has past date', () => {
    expect(validateScheduledDate(fmt(yesterday), 'spoken')).toBeNull()
  })

  it('returns error when scheduled status has past date', () => {
    const result = validateScheduledDate(fmt(yesterday), 'scheduled')
    expect(result).toMatch(/future/)
  })

  it('returns null when scheduled status has future date', () => {
    expect(validateScheduledDate(fmt(tomorrow), 'scheduled')).toBeNull()
  })

  it('returns null for other statuses regardless of date', () => {
    expect(validateScheduledDate(fmt(yesterday), 'ideas')).toBeNull()
    expect(validateScheduledDate(fmt(tomorrow), 'ideas')).toBeNull()
  })
})

describe('validateDateRange', () => {
  it('returns null when either date is missing', () => {
    expect(validateDateRange(null, fmt(tomorrow))).toBeNull()
    expect(validateDateRange(fmt(yesterday), null)).toBeNull()
  })

  it('returns null when end date is after start date', () => {
    expect(validateDateRange(fmt(yesterday), fmt(tomorrow))).toBeNull()
  })

  it('returns null when start and end dates are equal', () => {
    expect(validateDateRange(fmt(today), fmt(today))).toBeNull()
  })

  it('returns error when end date is before start date', () => {
    const result = validateDateRange(fmt(tomorrow), fmt(yesterday))
    expect(result).toMatch(/after/)
  })
})
