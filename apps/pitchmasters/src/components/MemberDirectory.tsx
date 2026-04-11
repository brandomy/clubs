import { useState, useMemo } from 'react';
import { Search, Filter, User as UserIcon } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { MemberWithProfile, User } from '../types';
import { getVisibleMemberData, memberMatchesSearch, getPrivacyAwareSearchSuggestions } from '../utils/privacy';
import MemberCard from './MemberCard';

interface MemberDirectoryProps {
  members: MemberWithProfile[];
  currentUser?: MemberWithProfile | User;
  isAuthenticated: boolean;
}

interface FilterOptions {
  industry: string;
  pathLevel: string;
  ventureStage: string;
  lookingFor: string;
  location: string;
  isFounder: string;
  memberType: string;
}

export default function MemberDirectory({ members, currentUser, isAuthenticated }: MemberDirectoryProps) {

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    industry: '',
    pathLevel: '',
    ventureStage: '',
    lookingFor: '',
    location: '',
    isFounder: '',
    memberType: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get unique filter options from members data (privacy-aware)
  const filterOptions = useMemo(() => {
    const privacyAwareSuggestions = getPrivacyAwareSearchSuggestions(members, currentUser, isAuthenticated);
    const pathLevels = new Set<string>();
    const locations = new Set<string>();
    const memberTypes = new Set<string>();

    members.forEach(member => {
      const visibleData = getVisibleMemberData(member, currentUser, isAuthenticated);
      if (visibleData) {
        pathLevels.add(visibleData.pathLevel);
      }

      // Location from CSV fields (city, country)
      if (member.profile?.city && member.profile?.country) {
        locations.add(`${member.profile.city}, ${member.profile.country}`);
      } else if (member.profile?.country) {
        locations.add(member.profile.country);
      }

      // Member type from CSV
      if (member.profile?.member_type) {
        memberTypes.add(member.profile.member_type);
      }
    });

    return {
      industries: privacyAwareSuggestions.industries,
      pathLevels: Array.from(pathLevels).sort(),
      ventureStages: privacyAwareSuggestions.ventureStages,
      lookingForOptions: privacyAwareSuggestions.networkingInterests,
      locations: Array.from(locations).sort(),
      memberTypes: Array.from(memberTypes).sort()
    };
  }, [members, currentUser, isAuthenticated]);

  // Filter and search members based on search term and filters (privacy-aware)
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const visibleData = getVisibleMemberData(member, currentUser, isAuthenticated);
      if (!visibleData) return false;

      // Search term filtering (privacy-aware)
      if (debouncedSearchTerm) {
        if (!memberMatchesSearch(member, debouncedSearchTerm, currentUser, isAuthenticated)) {
          return false;
        }
      }

      // Filter by industry (using visible data)
      if (filters.industry && visibleData.industry !== filters.industry) return false;

      // Filter by path level (always visible)
      if (filters.pathLevel && visibleData.pathLevel !== filters.pathLevel) return false;

      // Filter by venture stage (using visible data)
      if (filters.ventureStage && visibleData.venture?.stage !== filters.ventureStage) return false;

      // Filter by looking for (only if networking data is visible)
      if (filters.lookingFor && visibleData.networking) {
        if (!visibleData.networking.lookingFor.includes(filters.lookingFor)) return false;
      } else if (filters.lookingFor) {
        // If looking for filter is set but networking data is not visible, exclude
        return false;
      }

      // Filter by location (city, country)
      if (filters.location) {
        const memberLocation = member.profile?.city && member.profile?.country
          ? `${member.profile.city}, ${member.profile.country}`
          : member.profile?.country || '';
        if (memberLocation !== filters.location) return false;
      }

      // Filter by founder status
      if (filters.isFounder) {
        const isFounder = member.profile?.is_founder || false;
        if (filters.isFounder === 'yes' && !isFounder) return false;
        if (filters.isFounder === 'no' && isFounder) return false;
      }

      // Filter by member type
      if (filters.memberType && member.profile?.member_type !== filters.memberType) return false;

      return true;
    });
  }, [members, debouncedSearchTerm, filters, currentUser, isAuthenticated]);


  const resetFilters = () => {
    setFilters({
      industry: '',
      pathLevel: '',
      ventureStage: '',
      lookingFor: '',
      location: '',
      isFounder: '',
      memberType: ''
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search members by name, venture, expertise, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tm-blue focus:border-transparent text-base min-h-touch"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-touch min-w-touch"
          >
            <Filter className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <select
                  value={filters.industry}
                  onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                >
                  <option value="">All Industries</option>
                  {filterOptions.industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Path Level</label>
                <select
                  value={filters.pathLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, pathLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                >
                  <option value="">All Levels</option>
                  {filterOptions.pathLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venture Stage</label>
                <select
                  value={filters.ventureStage}
                  onChange={(e) => setFilters(prev => ({ ...prev, ventureStage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                >
                  <option value="">All Stages</option>
                  {filterOptions.ventureStages.map(stage => (
                    <option key={stage} value={stage}>{stage.charAt(0).toUpperCase() + stage.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Looking For</label>
                <select
                  value={filters.lookingFor}
                  onChange={(e) => setFilters(prev => ({ ...prev, lookingFor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                >
                  <option value="">All Needs</option>
                  {filterOptions.lookingForOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {filterOptions.locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Founder Status</label>
                <select
                  value={filters.isFounder}
                  onChange={(e) => setFilters(prev => ({ ...prev, isFounder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                >
                  <option value="">All Members</option>
                  <option value="yes">Founders</option>
                  <option value="no">Non-Founders</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Member Type</label>
                <select
                  value={filters.memberType}
                  onChange={(e) => setFilters(prev => ({ ...prev, memberType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {filterOptions.memberTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredMembers.length} of {members.length} members
        </p>
      </div>

      {/* Member Cards Grid - Mobile-First Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredMembers.map(member => {
          const visibleData = getVisibleMemberData(member, currentUser, isAuthenticated);
          if (!visibleData) return null;

          return (
            <MemberCard key={member.id} member={member} visibleData={visibleData} />
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}