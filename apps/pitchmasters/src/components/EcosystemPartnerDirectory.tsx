import { useState, useMemo } from 'react';
import { Search, Filter, Building2, MapPin, Star, Shield, ExternalLink, Phone, Mail, Users } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { EcosystemPartner, User } from '../types';

interface EcosystemPartnerDirectoryProps {
  partners: EcosystemPartner[];
  currentUser?: User;
  isAuthenticated: boolean;
}

interface PartnerFilterOptions {
  industry: string;
  partnershipType: string;
  location: string;
  companySize: string;
  minRating: number;
  verifiedOnly: boolean;
}

export default function EcosystemPartnerDirectory({ partners, isAuthenticated }: EcosystemPartnerDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PartnerFilterOptions>({
    industry: '',
    partnershipType: '',
    location: '',
    companySize: '',
    minRating: 0,
    verifiedOnly: false
  });
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get unique filter options from partners data
  const filterOptions = useMemo(() => {
    const industries = new Set<string>();
    const partnershipTypes = new Set<string>();
    const locations = new Set<string>();
    const companySizes = new Set<string>();

    partners.forEach(partner => {
      industries.add(partner.industry);
      partnershipTypes.add(partner.partnership_type);
      if (partner.location) locations.add(partner.location);
      companySizes.add(partner.company_size);
    });

    return {
      industries: Array.from(industries).sort(),
      partnershipTypes: Array.from(partnershipTypes).sort(),
      locations: Array.from(locations).sort(),
      companySizes: Array.from(companySizes).sort()
    };
  }, [partners]);

  // Filter and search partners
  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      // Only show active partners
      if (partner.status !== 'active') return false;

      // Search term filtering
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch = (
          partner.company_name.toLowerCase().includes(searchLower) ||
          (partner.company_description && partner.company_description.toLowerCase().includes(searchLower)) ||
          partner.industry.toLowerCase().includes(searchLower) ||
          partner.services_offered.some(service => service.toLowerCase().includes(searchLower)) ||
          (partner.location && partner.location.toLowerCase().includes(searchLower))
        );
        if (!matchesSearch) return false;
      }

      // Filter by industry
      if (filters.industry && partner.industry !== filters.industry) return false;

      // Filter by partnership type
      if (filters.partnershipType && partner.partnership_type !== filters.partnershipType) return false;

      // Filter by location
      if (filters.location && partner.location !== filters.location) return false;

      // Filter by company size
      if (filters.companySize && partner.company_size !== filters.companySize) return false;

      // Filter by minimum rating
      if (filters.minRating > 0 && partner.average_rating < filters.minRating) return false;

      // Filter by verification status
      if (filters.verifiedOnly && !partner.is_verified) return false;

      return true;
    });
  }, [partners, debouncedSearchTerm, filters]);

  const resetFilters = () => {
    setFilters({
      industry: '',
      partnershipType: '',
      location: '',
      companySize: '',
      minRating: 0,
      verifiedOnly: false
    });
  };

  const getPartnershipTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      investor: 'Investor',
      accelerator: 'Accelerator',
      service_provider: 'Service Provider',
      vendor: 'Vendor',
      client: 'Client',
      mentor: 'Mentor',
      advisor: 'Advisor'
    };
    return labels[type] || type;
  };

  const getCompanySizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      startup: 'Startup',
      small: 'Small (1-50)',
      medium: 'Medium (51-200)',
      large: 'Large (201-1000)',
      enterprise: 'Enterprise (1000+)'
    };
    return labels[size] || size;
  };

  const renderStarRating = (rating: number, reviewCount: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }

    return (
      <div className="flex items-center gap-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Member-Only Access</h2>
        <p className="text-gray-600 mb-6">
          The ecosystem partner directory is exclusively available to authenticated club members.
          This ensures privacy and appropriate access to our curated network of startup partners.
        </p>
        <div className="bg-tm-blue bg-opacity-5 border border-tm-blue border-opacity-20 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            Please log in to access our exclusive partner network including investors,
            accelerators, service providers, and other startup ecosystem partners.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ecosystem Partners</h1>
        <p className="text-gray-600">
          Curated network of investors, accelerators, service providers, and other startup ecosystem partners.
          Available exclusively to club members.
        </p>
      </div>

      {/* Search Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search partners by company, industry, services, or location..."
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Partnership Type</label>
                <select
                  value={filters.partnershipType}
                  onChange={(e) => setFilters(prev => ({ ...prev, partnershipType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {filterOptions.partnershipTypes.map(type => (
                    <option key={type} value={type}>{getPartnershipTypeLabel(type)}</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                <select
                  value={filters.companySize}
                  onChange={(e) => setFilters(prev => ({ ...prev, companySize: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                >
                  <option value="">All Sizes</option>
                  {filterOptions.companySizes.map(size => (
                    <option key={size} value={size}>{getCompanySizeLabel(size)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                >
                  <option value={0}>Any Rating</option>
                  <option value={1}>1+ Stars</option>
                  <option value={2}>2+ Stars</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={5}>5 Stars Only</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                    className="rounded border-gray-300 text-tm-blue focus:ring-tm-blue"
                  />
                  Verified partners only
                </label>
              </div>
            </div>

            <div className="flex justify-end">
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
          Showing {filteredPartners.length} of {partners.filter(p => p.status === 'active').length} active partners
        </p>
      </div>

      {/* Partner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map(partner => (
          <div key={partner.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0">
                  <Building2 className="w-12 h-12 text-tm-blue bg-tm-blue bg-opacity-5 rounded-lg p-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{partner.company_name}</h3>
                  <p className="text-sm text-gray-600">{getPartnershipTypeLabel(partner.partnership_type)}</p>
                  <p className="text-sm text-gray-500">{partner.industry}</p>
                </div>
              </div>
              {partner.is_verified && (
                <div className="flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>

            {/* Company Info */}
            <div className="mb-4">
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{getCompanySizeLabel(partner.company_size)}</span>
                </div>
                {partner.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{partner.location}</span>
                  </div>
                )}
              </div>

              {partner.company_description && (
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">{partner.company_description}</p>
              )}
            </div>

            {/* Rating */}
            {partner.review_count > 0 && (
              <div className="mb-4">
                {renderStarRating(partner.average_rating, partner.review_count)}
              </div>
            )}

            {/* Services */}
            {partner.services_offered.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                <div className="flex flex-wrap gap-2">
                  {partner.services_offered.slice(0, 3).map((service, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {service}
                    </span>
                  ))}
                  {partner.services_offered.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      +{partner.services_offered.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="border-t border-gray-100 pt-4">
              {partner.contact_name && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-900">{partner.contact_name}</p>
                  {partner.contact_title && (
                    <p className="text-sm text-gray-600">{partner.contact_title}</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {partner.contact_email && (
                  <a
                    href={`mailto:${partner.contact_email}`}
                    className="flex items-center gap-1 text-sm text-tm-blue hover:opacity-80 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="hidden sm:inline">Email</span>
                  </a>
                )}

                {partner.contact_phone && (
                  <a
                    href={`tel:${partner.contact_phone}`}
                    className="flex items-center gap-1 text-sm text-tm-blue hover:opacity-80 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="hidden sm:inline">Call</span>
                  </a>
                )}

                {partner.company_website && (
                  <a
                    href={partner.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-tm-blue hover:opacity-80 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPartners.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No partners found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters to find relevant partners.</p>
        </div>
      )}
    </div>
  );
}