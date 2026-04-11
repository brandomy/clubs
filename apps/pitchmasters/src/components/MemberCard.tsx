import { memo } from 'react';
import { User as UserIcon, Briefcase, Target, Phone, Mail, ExternalLink, MapPin, Award, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MemberWithProfile } from '../types';
import type { VisibleMemberData } from '../utils/privacy';

interface MemberCardProps {
  member: MemberWithProfile;
  visibleData: VisibleMemberData;
}

const MemberCard = memo(function MemberCard({ member, visibleData }: MemberCardProps) {
  return (
    <Link
      to={`/members/${member.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-tm-blue hover:border-opacity-50 transition-all cursor-pointer active:scale-[0.98] active:bg-gray-50 min-h-touch"
    >
      {/* Header - Mobile Optimized */}
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex-shrink-0">
          {visibleData.photo ? (
            <img
              src={visibleData.photo}
              alt={visibleData.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate leading-tight">{visibleData.name}</h3>
          <p className="text-sm text-gray-600 leading-tight">{visibleData.pathLevel} • {visibleData.currentPath}</p>
          {visibleData.industry && (
            <p className="text-sm text-gray-500 leading-tight">{visibleData.industry}</p>
          )}

          {/* Location from CSV data */}
          {(member.profile?.city || member.profile?.country) && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-500">
                {member.profile?.city && member.profile?.country
                  ? `${member.profile.city}, ${member.profile.country}`
                  : member.profile?.country || member.profile?.city}
              </p>
            </div>
          )}

          {/* Officer Role from CSV data */}
          {member.profile?.officer_role && (
            <div className="flex items-center gap-1 mt-1">
              <Award className="w-3 h-3 text-tm-blue" />
              <span className="text-xs px-2 py-1 bg-tm-blue bg-opacity-10 text-tm-blue rounded-full">
                {member.profile.officer_role}
              </span>
            </div>
          )}

          {/* Founder Status */}
          {member.profile?.is_founder && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                Founder
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Venture/Organization Info */}
      {(visibleData.venture || member.profile?.organization) && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900">
              {visibleData.venture?.name || member.profile?.organization}
            </span>
            {visibleData.venture?.stage && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                {visibleData.venture.stage}
              </span>
            )}
          </div>
          {member.profile?.job_title && (
            <div className="flex items-center gap-2 mb-1">
              <Building className="w-3 h-3 text-gray-400" />
              <p className="text-sm text-gray-600">{member.profile.job_title}</p>
            </div>
          )}
          {visibleData.venture?.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{visibleData.venture.description}</p>
          )}
        </div>
      )}

      {/* Bio */}
      {visibleData.bio && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">{visibleData.bio}</p>
        </div>
      )}

      {/* Expertise Areas */}
      {visibleData.expertise.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {visibleData.expertise.slice(0, 3).map((area, index) => (
              <span key={index} className="text-xs px-2 py-1 bg-tm-blue bg-opacity-10 text-tm-blue rounded-full">
                {area}
              </span>
            ))}
            {visibleData.expertise.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                +{visibleData.expertise.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Networking Info (Members Only) */}
      {visibleData.networking && (
        <div className="mb-4 space-y-2">
          {visibleData.networking.lookingFor.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Looking for:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {visibleData.networking.lookingFor.slice(0, 2).map((item, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {visibleData.networking.offering.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-tm-blue" />
                <span className="text-sm font-medium text-gray-700">Offering:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {visibleData.networking.offering.slice(0, 2).map((item, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-tm-blue bg-opacity-10 text-tm-blue rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speech Progress (Members Only) */}
      {visibleData.speechProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Speeches: {visibleData.speechProgress.speechCount}</span>
            <span className="text-gray-600">Evaluations: {visibleData.speechProgress.evaluationCount}</span>
          </div>
        </div>
      )}

      {/* Contact Actions - Mobile Touch Optimized */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mt-3">
        {visibleData.contact?.email && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `mailto:${visibleData.contact?.email}`;
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-tm-blue hover:bg-tm-blue hover:bg-opacity-10 rounded-lg transition-all min-h-touch min-w-touch active:scale-95"
            aria-label="Send email"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </button>
        )}

        {visibleData.contact?.phone && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `tel:${visibleData.contact?.phone}`;
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-tm-blue hover:bg-tm-blue hover:bg-opacity-10 rounded-lg transition-all min-h-touch min-w-touch active:scale-95"
            aria-label="Call phone number"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Call</span>
          </button>
        )}

        {visibleData.socialLinks?.linkedin && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(visibleData.socialLinks?.linkedin, '_blank');
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-tm-blue hover:bg-tm-blue hover:bg-opacity-10 rounded-lg transition-all min-h-touch min-w-touch active:scale-95"
            aria-label="View LinkedIn profile"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">LinkedIn</span>
          </button>
        )}

        {visibleData.socialLinks?.website && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(visibleData.socialLinks?.website, '_blank');
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-tm-blue hover:bg-tm-blue hover:bg-opacity-10 rounded-lg transition-all min-h-touch min-w-touch active:scale-95"
            aria-label="Visit website"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Website</span>
          </button>
        )}
      </div>
    </Link>
  );
})

export default MemberCard
