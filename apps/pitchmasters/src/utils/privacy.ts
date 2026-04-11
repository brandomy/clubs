import { MemberWithProfile, PrivacySettings, User } from '../types';

export interface VisibleMemberData {
  // Always visible
  name: string;
  pathLevel: string;
  currentPath: string;
  industry?: string;

  // Public tier (controlled by privacy settings)
  photo?: string;
  venture?: {
    name?: string;
    description?: string;
    stage?: string;
  };
  expertise: string[];
  bio?: string;

  // Member-only tier
  contact?: {
    phone?: string;
    email: string;
  };
  socialLinks?: {
    linkedin?: string;
    website?: string;
  };
  networking?: {
    interests: string[];
    lookingFor: string[];
    offering: string[];
  };
  speechProgress?: {
    speechCount: number;
    evaluationCount: number;
    leadershipRoles: string[];
  };

  // Private tier
  privateData?: {
    personalGoals?: string;
    communicationGoals?: string;
    leadershipGoals?: string;
    nextSpeechPlan?: string;
    officerNotes?: string;
  };
}

/**
 * Determines what data should be visible based on privacy settings and user permissions
 */
export function getVisibleMemberData(
  member: MemberWithProfile,
  currentUser?: User,
  isAuthenticated: boolean = false
): VisibleMemberData | null {
  const profile = member.profile;
  const privacy = member.privacy_settings;

  if (!profile) return null;

  const isOwnProfile = currentUser?.id === member.id;
  const isOfficer = currentUser?.role === 'officer' || currentUser?.role === 'admin';

  return {
    // Always visible data
    name: member.full_name,
    pathLevel: profile.path_level,
    currentPath: profile.current_path,
    industry: profile.industry,

    // Public tier data (controlled by privacy settings)
    photo: privacy?.show_photo ? profile.photo_url : undefined,
    venture: privacy?.show_venture_info ? {
      name: profile.venture_name,
      description: profile.venture_description,
      stage: profile.venture_stage
    } : undefined,
    expertise: privacy?.show_expertise ? profile.expertise_areas : [],
    bio: privacy?.show_bio ? profile.bio : undefined,

    // Member-only tier data (only if authenticated and privacy allows)
    contact: isAuthenticated && privacy?.show_contact_info ? {
      phone: profile.phone,
      email: member.email
    } : undefined,
    socialLinks: isAuthenticated && privacy?.show_social_links ? {
      linkedin: profile.linkedin_url,
      website: profile.website_url
    } : undefined,
    networking: isAuthenticated && privacy?.show_networking_interests ? {
      interests: profile.networking_interests,
      lookingFor: privacy.show_looking_for ? profile.looking_for : [],
      offering: privacy.show_offering ? profile.offering : []
    } : undefined,
    speechProgress: isAuthenticated && privacy?.show_speech_progress ? {
      speechCount: profile.speech_count,
      evaluationCount: profile.evaluation_count,
      leadershipRoles: profile.leadership_roles
    } : undefined,

    // Private tier data (own profile or officers only)
    privateData: (isOwnProfile || isOfficer) ? {
      personalGoals: profile.personal_goals,
      communicationGoals: profile.communication_goals,
      leadershipGoals: profile.leadership_goals,
      nextSpeechPlan: profile.next_speech_plan,
      officerNotes: isOfficer && privacy?.allow_officer_notes ? profile.officer_notes : undefined
    } : undefined
  };
}

/**
 * Checks if a member's data matches search criteria while respecting privacy settings
 */
export function memberMatchesSearch(
  member: MemberWithProfile,
  searchTerm: string,
  currentUser?: User,
  isAuthenticated: boolean = false
): boolean {
  if (!searchTerm.trim()) return true;

  const visibleData = getVisibleMemberData(member, currentUser, isAuthenticated);
  if (!visibleData) return false;

  const searchLower = searchTerm.toLowerCase();

  // Always searchable fields
  if (visibleData.name.toLowerCase().includes(searchLower)) return true;
  if (visibleData.pathLevel.toLowerCase().includes(searchLower)) return true;
  if (visibleData.currentPath.toLowerCase().includes(searchLower)) return true;
  if (visibleData.industry?.toLowerCase().includes(searchLower)) return true;

  // Public tier searchable fields (if visible)
  if (visibleData.venture?.name?.toLowerCase().includes(searchLower)) return true;
  if (visibleData.venture?.description?.toLowerCase().includes(searchLower)) return true;
  if (visibleData.bio?.toLowerCase().includes(searchLower)) return true;
  if (visibleData.expertise.some(area => area.toLowerCase().includes(searchLower))) return true;

  // Member-only tier searchable fields (if visible and authenticated)
  if (isAuthenticated) {
    if (visibleData.networking?.interests.some(interest =>
      interest.toLowerCase().includes(searchLower)
    )) return true;
    if (visibleData.networking?.lookingFor.some(item =>
      item.toLowerCase().includes(searchLower)
    )) return true;
    if (visibleData.networking?.offering.some(item =>
      item.toLowerCase().includes(searchLower)
    )) return true;
    if (visibleData.speechProgress?.leadershipRoles.some(role =>
      role.toLowerCase().includes(searchLower)
    )) return true;
  }

  return false;
}

/**
 * Filters members based on criteria while respecting privacy settings
 */
export function filterMembersByPrivacy<T extends keyof VisibleMemberData>(
  members: MemberWithProfile[],
  filterField: T,
  filterValue: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  currentUser?: User,
  isAuthenticated: boolean = false
): MemberWithProfile[] {
  return members.filter(member => {
    const visibleData = getVisibleMemberData(member, currentUser, isAuthenticated);
    if (!visibleData) return false;

    const fieldValue = visibleData[filterField];

    // Handle different field types
    if (Array.isArray(fieldValue)) {
      return Array.isArray(filterValue)
        ? filterValue.some(val => fieldValue.includes(val))
        : fieldValue.includes(filterValue);
    }

    if (typeof fieldValue === 'object' && fieldValue !== null) {
      // Handle nested objects like venture, contact, etc.
      return Object.values(fieldValue).some(val =>
        val?.toString().toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return fieldValue?.toString().toLowerCase() === filterValue.toLowerCase();
  });
}

/**
 * Gets privacy-aware search suggestions
 */
export function getPrivacyAwareSearchSuggestions(
  members: MemberWithProfile[],
  currentUser?: User,
  isAuthenticated: boolean = false
): {
  industries: string[];
  expertiseAreas: string[];
  ventureStages: string[];
  networkingInterests: string[];
} {
  const industries = new Set<string>();
  const expertiseAreas = new Set<string>();
  const ventureStages = new Set<string>();
  const networkingInterests = new Set<string>();

  members.forEach(member => {
    const visibleData = getVisibleMemberData(member, currentUser, isAuthenticated);
    if (!visibleData) return;

    // Always available
    if (visibleData.industry) industries.add(visibleData.industry);

    // Public tier (if visible)
    if (visibleData.venture?.stage) ventureStages.add(visibleData.venture.stage);
    visibleData.expertise.forEach(area => expertiseAreas.add(area));

    // Member-only tier (if authenticated and visible)
    if (isAuthenticated && visibleData.networking) {
      visibleData.networking.interests.forEach(interest => networkingInterests.add(interest));
      visibleData.networking.lookingFor.forEach(item => networkingInterests.add(item));
      visibleData.networking.offering.forEach(item => networkingInterests.add(item));
    }
  });

  return {
    industries: Array.from(industries).sort(),
    expertiseAreas: Array.from(expertiseAreas).sort(),
    ventureStages: Array.from(ventureStages).sort(),
    networkingInterests: Array.from(networkingInterests).sort()
  };
}

/**
 * Default privacy settings for new users
 */
export const DEFAULT_PRIVACY_SETTINGS: Omit<PrivacySettings, 'id' | 'user_id' | 'club_id' | 'created_at' | 'updated_at'> = {
  // Public tier - recommended to enable for networking
  show_photo: true,
  show_venture_info: true,
  show_expertise: true,
  show_bio: true,

  // Member-only tier - recommended to enable for member networking
  show_contact_info: true,
  show_social_links: true,
  show_networking_interests: true,
  show_speech_progress: true,
  show_looking_for: true,
  show_offering: true,

  // Private tier - allow officer support
  allow_officer_notes: true
};

/**
 * Validates privacy settings changes
 */
export function validatePrivacySettings(settings: Partial<PrivacySettings>): string[] {
  const errors: string[] = [];

  // Check for logical inconsistencies
  if (settings.show_looking_for && !settings.show_networking_interests) {
    errors.push('Cannot show "looking for" without showing networking interests');
  }

  if (settings.show_offering && !settings.show_networking_interests) {
    errors.push('Cannot show "offering" without showing networking interests');
  }

  // Warn about privacy implications
  const warnings: string[] = [];

  if (settings.show_contact_info === false) {
    warnings.push('Hiding contact info may limit networking opportunities');
  }

  if (settings.show_venture_info === false) {
    warnings.push('Hiding venture info may reduce collaboration opportunities');
  }

  // For now, return only hard errors. Warnings could be handled separately
  return errors;
}

/**
 * Checks if a user has sufficient permissions to view specific data
 */
export function canUserViewData(
  dataType: 'public' | 'member' | 'private',
  viewerUser?: User,
  targetUser?: User,
  isAuthenticated: boolean = false
): boolean {
  switch (dataType) {
    case 'public':
      return true;

    case 'member':
      return isAuthenticated;

    case 'private': {
      if (!viewerUser || !targetUser) return false;
      const isOwnProfile = viewerUser.id === targetUser.id;
      const isOfficer = viewerUser.role === 'officer' || viewerUser.role === 'admin';
      return isOwnProfile || isOfficer;
    }

    default:
      return false;
  }
}