import { MemberWithProfile, User, PrivacySettings } from '../types';
import { getVisibleMemberData } from './privacy';

// Test data for comprehensive privacy testing
export const createTestUser = (id: string, role: 'member' | 'officer' | 'admin' = 'member'): User => ({
  id,
  email: `test${id}@example.com`,
  full_name: `Test User ${id}`,
  club_id: 'club-1',
  role,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

export const createTestPrivacySettings = (userId: string, overrides: Partial<PrivacySettings> = {}): PrivacySettings => ({
  id: `privacy-${userId}`,
  user_id: userId,
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
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createTestMemberProfile = (userId: string): MemberWithProfile => {
  const user = createTestUser(userId);

  return {
    ...user,
    profile: {
      id: `profile-${userId}`,
      user_id: userId,
      club_id: 'club-1',
      // Public tier
      photo_url: `https://example.com/photo-${userId}.jpg`,
      skill_level: 'Level 2',
      current_skill: 'Dynamic Leadership',
      venture_name: `Startup ${userId}`,
      venture_description: `An innovative startup by user ${userId}`,
      venture_stage: 'mvp',
      industry: 'Technology',
      expertise_areas: ['Product Management', 'Marketing'],
      bio: `Professional bio for user ${userId}`,
      // Member-only tier
      phone: `+1-555-${userId.padStart(4, '0')}`,
      linkedin_url: `https://linkedin.com/in/user${userId}`,
      website_url: `https://startup${userId}.com`,
      networking_interests: ['Funding', 'Partnerships'],
      looking_for: ['Investors', 'Technical Co-founder'],
      offering: ['Marketing Expertise', 'Product Strategy'],
      speech_count: 5,
      evaluation_count: 3,
      leadership_roles: ['VP Marketing'],
      // Additional required fields
      completed_skills: [],
      dtm: false,
      is_founder: true,
      is_rotarian: false,
      // Private tier
      personal_goals: `Personal development goals for user ${userId}`,
      communication_goals: 'Improve public speaking confidence',
      leadership_goals: 'Develop team management skills',
      next_speech_plan: 'Persuasive speaking project',
      feedback_preferences: { style: 'direct', frequency: 'after_each_speech' },
      officer_notes: `Officer notes for user ${userId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    privacy_settings: createTestPrivacySettings(userId)
  };
};

// Test scenarios for multi-tier access validation
export interface TestScenario {
  name: string;
  description: string;
  setup: () => {
    member: MemberWithProfile;
    viewer?: User;
    isAuthenticated: boolean;
  };
  expectations: {
    shouldSeePhoto: boolean;
    shouldSeeVentureInfo: boolean;
    shouldSeeContactInfo: boolean;
    shouldSeeNetworkingInfo: boolean;
    shouldSeePrivateData: boolean;
    shouldSeeOfficerNotes: boolean;
  };
}

export const accessTestScenarios: TestScenario[] = [
  {
    name: 'Unauthenticated User - Public Data Only',
    description: 'Non-logged-in visitor should only see public tier data based on privacy settings',
    setup: () => ({
      member: createTestMemberProfile('1'),
      viewer: undefined,
      isAuthenticated: false
    }),
    expectations: {
      shouldSeePhoto: true,
      shouldSeeVentureInfo: true,
      shouldSeeContactInfo: false,
      shouldSeeNetworkingInfo: false,
      shouldSeePrivateData: false,
      shouldSeeOfficerNotes: false
    }
  },
  {
    name: 'Authenticated Member - Member Tier Data',
    description: 'Logged-in member should see public + member-only tier data',
    setup: () => ({
      member: createTestMemberProfile('1'),
      viewer: createTestUser('2'),
      isAuthenticated: true
    }),
    expectations: {
      shouldSeePhoto: true,
      shouldSeeVentureInfo: true,
      shouldSeeContactInfo: true,
      shouldSeeNetworkingInfo: true,
      shouldSeePrivateData: false,
      shouldSeeOfficerNotes: false
    }
  },
  {
    name: 'Own Profile - All Data Visible',
    description: 'User viewing their own profile should see all data including private tier',
    setup: () => ({
      member: createTestMemberProfile('1'),
      viewer: createTestUser('1'),
      isAuthenticated: true
    }),
    expectations: {
      shouldSeePhoto: true,
      shouldSeeVentureInfo: true,
      shouldSeeContactInfo: true,
      shouldSeeNetworkingInfo: true,
      shouldSeePrivateData: true,
      shouldSeeOfficerNotes: false // User can't see officer notes about themselves
    }
  },
  {
    name: 'Officer Access - Officer Level Data',
    description: 'Club officer should see all data including officer notes',
    setup: () => ({
      member: createTestMemberProfile('1'),
      viewer: createTestUser('2', 'officer'),
      isAuthenticated: true
    }),
    expectations: {
      shouldSeePhoto: true,
      shouldSeeVentureInfo: true,
      shouldSeeContactInfo: true,
      shouldSeeNetworkingInfo: true,
      shouldSeePrivateData: true,
      shouldSeeOfficerNotes: true
    }
  },
  {
    name: 'Privacy Settings Disabled - Limited Visibility',
    description: 'Member with restrictive privacy settings should have limited data visible',
    setup: () => {
      const member = createTestMemberProfile('1');
      member.privacy_settings = createTestPrivacySettings('1', {
        show_photo: false,
        show_venture_info: false,
        show_contact_info: false,
        show_networking_interests: false,
        allow_officer_notes: false
      });
      return {
        member,
        viewer: createTestUser('2'),
        isAuthenticated: true
      };
    },
    expectations: {
      shouldSeePhoto: false,
      shouldSeeVentureInfo: false,
      shouldSeeContactInfo: false,
      shouldSeeNetworkingInfo: false,
      shouldSeePrivateData: false,
      shouldSeeOfficerNotes: false
    }
  },
  {
    name: 'Officer vs Private Privacy Settings',
    description: 'Officer should respect user privacy settings except for officer notes permission',
    setup: () => {
      const member = createTestMemberProfile('1');
      member.privacy_settings = createTestPrivacySettings('1', {
        show_contact_info: false,
        allow_officer_notes: true
      });
      return {
        member,
        viewer: createTestUser('2', 'officer'),
        isAuthenticated: true
      };
    },
    expectations: {
      shouldSeePhoto: true,
      shouldSeeVentureInfo: true,
      shouldSeeContactInfo: false, // Respects privacy setting
      shouldSeeNetworkingInfo: true,
      shouldSeePrivateData: true, // Officer privilege
      shouldSeeOfficerNotes: true // Officer privilege + permission
    }
  }
];

// Performance test scenarios
export interface PerformanceTestScenario {
  name: string;
  description: string;
  memberCount: number;
  searchTerm: string;
  expectedMaxTime: number; // milliseconds
}

export const performanceTestScenarios: PerformanceTestScenario[] = [
  {
    name: 'Small Dataset Search',
    description: 'Search performance with 50 members',
    memberCount: 50,
    searchTerm: 'technology',
    expectedMaxTime: 50
  },
  {
    name: 'Medium Dataset Search',
    description: 'Search performance with 200 members',
    memberCount: 200,
    searchTerm: 'startup',
    expectedMaxTime: 100
  },
  {
    name: 'Large Dataset Search',
    description: 'Search performance with 500 members',
    memberCount: 500,
    searchTerm: 'marketing',
    expectedMaxTime: 200
  },
  {
    name: 'Complex Filter Performance',
    description: 'Multi-criteria filtering performance',
    memberCount: 200,
    searchTerm: '',
    expectedMaxTime: 150
  }
];

// Run access control tests
export function runAccessTests(): { passed: number; failed: number; results: any[] } {
  const results: any[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🧪 Running Multi-Tier Access Control Tests...\n');

  accessTestScenarios.forEach((scenario, index) => {
    console.log(`Test ${index + 1}: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);

    const { member, viewer, isAuthenticated } = scenario.setup();
    const visibleData = getVisibleMemberData(member, viewer, isAuthenticated);

    const testResults = {
      scenario: scenario.name,
      passed: true,
      errors: [] as string[]
    };

    // Test photo visibility
    const hasPhoto = !!visibleData?.photo;
    if (hasPhoto !== scenario.expectations.shouldSeePhoto) {
      testResults.errors.push(`Photo visibility: expected ${scenario.expectations.shouldSeePhoto}, got ${hasPhoto}`);
      testResults.passed = false;
    }

    // Test venture info visibility
    const hasVentureInfo = !!visibleData?.venture;
    if (hasVentureInfo !== scenario.expectations.shouldSeeVentureInfo) {
      testResults.errors.push(`Venture info visibility: expected ${scenario.expectations.shouldSeeVentureInfo}, got ${hasVentureInfo}`);
      testResults.passed = false;
    }

    // Test contact info visibility
    const hasContactInfo = !!visibleData?.contact;
    if (hasContactInfo !== scenario.expectations.shouldSeeContactInfo) {
      testResults.errors.push(`Contact info visibility: expected ${scenario.expectations.shouldSeeContactInfo}, got ${hasContactInfo}`);
      testResults.passed = false;
    }

    // Test networking info visibility
    const hasNetworkingInfo = !!visibleData?.networking;
    if (hasNetworkingInfo !== scenario.expectations.shouldSeeNetworkingInfo) {
      testResults.errors.push(`Networking info visibility: expected ${scenario.expectations.shouldSeeNetworkingInfo}, got ${hasNetworkingInfo}`);
      testResults.passed = false;
    }

    // Test private data visibility
    const hasPrivateData = !!visibleData?.privateData;
    if (hasPrivateData !== scenario.expectations.shouldSeePrivateData) {
      testResults.errors.push(`Private data visibility: expected ${scenario.expectations.shouldSeePrivateData}, got ${hasPrivateData}`);
      testResults.passed = false;
    }

    // Test officer notes visibility
    const hasOfficerNotes = !!visibleData?.privateData?.officerNotes;
    if (hasOfficerNotes !== scenario.expectations.shouldSeeOfficerNotes) {
      testResults.errors.push(`Officer notes visibility: expected ${scenario.expectations.shouldSeeOfficerNotes}, got ${hasOfficerNotes}`);
      testResults.passed = false;
    }

    if (testResults.passed) {
      console.log('✅ PASSED\n');
      passed++;
    } else {
      console.log('❌ FAILED');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
      console.log('');
      failed++;
    }

    results.push(testResults);
  });

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  return { passed, failed, results };
}

// Generate test members for performance testing
export function generateTestMembers(count: number): MemberWithProfile[] {
  const members: MemberWithProfile[] = [];
  const industries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail'];
  const stages = ['idea', 'mvp', 'growth', 'scale', 'exit'] as const;

  for (let i = 1; i <= count; i++) {
    const member = createTestMemberProfile(i.toString());

    // Vary the data for realistic testing
    if (member.profile) {
      member.profile.industry = industries[i % industries.length];
      member.profile.venture_stage = stages[i % stages.length];
      member.profile.venture_name = `Startup ${i}`;
      member.profile.expertise_areas = [
        `Skill ${i % 10}`,
        `Expertise ${(i + 1) % 8}`
      ];
    }

    members.push(member);
  }

  return members;
}

// Performance testing utility
export function measureSearchPerformance(
  members: MemberWithProfile[],
  searchTerm: string,
  viewer?: User,
  isAuthenticated: boolean = true
): number {
  const start = performance.now();

  // Simulate the search filtering logic
  const filtered = members.filter(member => {
    const visibleData = getVisibleMemberData(member, viewer, isAuthenticated);
    if (!visibleData || !searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      visibleData.name.toLowerCase().includes(searchLower) ||
      visibleData.industry?.toLowerCase().includes(searchLower) ||
      visibleData.venture?.name?.toLowerCase().includes(searchLower) ||
      visibleData.expertise.some(area => area.toLowerCase().includes(searchLower))
    );
  });

  const end = performance.now();
  const duration = end - start;

  console.log(`Search for "${searchTerm}" in ${members.length} members: ${duration.toFixed(2)}ms (${filtered.length} results)`);

  return duration;
}