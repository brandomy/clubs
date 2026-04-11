import { describe, it, expect } from 'vitest'
import { isValidUrl, sanitizeUrl, getUrlError } from '../utils/urlValidation'

describe('isValidUrl', () => {
  it('returns true for empty string (optional field)', () => {
    expect(isValidUrl('')).toBe(true)
  })

  it('returns true for whitespace-only string', () => {
    expect(isValidUrl('   ')).toBe(true)
  })

  it('returns true for valid https URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
  })

  it('returns true for valid http URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('returns false for ftp URL', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false)
  })

  it('returns false for plain string without protocol', () => {
    expect(isValidUrl('not-a-url')).toBe(false)
  })

  it('returns false for javascript: protocol', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })
})

describe('sanitizeUrl', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeUrl('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeUrl('   ')).toBe('')
  })

  it('adds https:// when no protocol present', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com')
  })

  it('preserves existing https:// prefix', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
  })

  it('preserves existing http:// prefix', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
  })
})

describe('getUrlError', () => {
  it('returns null for empty string', () => {
    expect(getUrlError('')).toBeNull()
  })

  it('returns null for valid URL', () => {
    expect(getUrlError('https://example.com')).toBeNull()
  })

  it('returns error message for invalid URL', () => {
    expect(getUrlError('not-a-url')).toBe('Please enter a valid URL (e.g., https://example.com)')
  })
})
