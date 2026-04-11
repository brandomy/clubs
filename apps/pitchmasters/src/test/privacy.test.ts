import { describe, it, expect } from 'vitest'
import { getVisibleMemberData, memberMatchesSearch } from '../utils/privacy'
import type { MemberWithProfile, User, MemberProfile, PrivacySettings } from '../types'

// Minimal fixtures — only the fields the functions actually use
const makeProfile = (overrides: Partial<MemberProfile> = {}): MemberProfile => ({
  id: 'profile-1',
  user_id: 'user-1',
  club_id: 'club-1',
  path_level: 'Level 1',
  current_path: 'Presentation Mastery',
  expertise_areas: ['Sales', 'Marketing'],
  networking_interests: [],
  looking_for: ['Investors'],
  offering: ['Mentorship'],
  speech_count: 3,
  evaluation_count: 2,
  leadership_roles: ['Timer'],
  completed_pathways: [],
  dtm: false,
  is_founder: true,
  is_rotarian: false,
  feedback_preferences: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

const makePrivacy = (overrides: Partial<PrivacySettings> = {}): PrivacySettings => ({
  id: 'privacy-1',
  user_id: 'user-1',
  club_id: 'club-1',
  show_photo: true,
  show_venture_info: true,
  show_expertise: true,
  show_bio: true,
  show_contact_info: true,
  show_social_links: true,
  show_networking_interests: true,
  show_speech_progress: true,
  show_looking_for: true,
  show_offering: true,
  allow_officer_notes: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

const makeMember = (overrides: Partial<MemberWithProfile> = {}): MemberWithProfile => ({
  id: 'user-1',
  email: 'alice@example.com',
  full_name: 'Alice Chen',
  club_id: 'club-1',
  role: 'member',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  profile: makeProfile(),
  privacy_settings: makePrivacy(),
  ...overrides,
})

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'other-user',
  email: 'bob@example.com',
  full_name: 'Bob Smith',
  club_id: 'club-1',
  role: 'member',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

describe('getVisibleMemberData', () => {
  it('returns null when profile is missing', () => {
    const member = makeMember({ profile: undefined })
    expect(getVisibleMemberData(member)).toBeNull()
  })

  it('always exposes name, pathLevel, currentPath', () => {
    const result = getVisibleMemberData(makeMember())
    expect(result?.name).toBe('Alice Chen')
    expect(result?.pathLevel).toBe('Level 1')
    expect(result?.currentPath).toBe('Presentation Mastery')
  })

  it('hides contact info for unauthenticated users even if privacy allows it', () => {
    const member = makeMember()
    const result = getVisibleMemberData(member, undefined, false)
    expect(result?.contact).toBeUndefined()
  })

  it('shows contact info for authenticated users when privacy allows', () => {
    const member = makeMember({ email: 'alice@example.com' })
    const currentUser = makeUser()
    const result = getVisibleMemberData(member, currentUser, true)
    expect(result?.contact?.email).toBe('alice@example.com')
  })

  it('hides contact info when privacy disables it even for authenticated users', () => {
    const member = makeMember({
      privacy_settings: makePrivacy({ show_contact_info: false }),
    })
    const currentUser = makeUser()
    const result = getVisibleMemberData(member, currentUser, true)
    expect(result?.contact).toBeUndefined()
  })

  it('shows private data to the member themselves', () => {
    const member = makeMember({ profile: makeProfile({ personal_goals: 'Learn to pitch' }) })
    const currentUser = makeUser({ id: 'user-1' }) // same id as member
    const result = getVisibleMemberData(member, currentUser, true)
    expect(result?.privateData?.personalGoals).toBe('Learn to pitch')
  })

  it('shows private data to officers', () => {
    const member = makeMember({ profile: makeProfile({ personal_goals: 'Learn to pitch' }) })
    const officer = makeUser({ role: 'officer' })
    const result = getVisibleMemberData(member, officer, true)
    expect(result?.privateData?.personalGoals).toBe('Learn to pitch')
  })

  it('hides private data from other members', () => {
    const member = makeMember({ profile: makeProfile({ personal_goals: 'Learn to pitch' }) })
    const otherMember = makeUser({ id: 'different-user', role: 'member' })
    const result = getVisibleMemberData(member, otherMember, true)
    expect(result?.privateData).toBeUndefined()
  })
})

describe('memberMatchesSearch', () => {
  it('returns true for empty search term', () => {
    expect(memberMatchesSearch(makeMember(), '')).toBe(true)
    expect(memberMatchesSearch(makeMember(), '   ')).toBe(true)
  })

  it('matches on visible name', () => {
    const member = makeMember()
    expect(memberMatchesSearch(member, 'Alice')).toBe(true)
    expect(memberMatchesSearch(member, 'alice')).toBe(true) // case-insensitive
  })

  it('returns false when no visible fields match', () => {
    const member = makeMember()
    expect(memberMatchesSearch(member, 'Nonexistent')).toBe(false)
  })
})
