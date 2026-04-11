import { logger } from '../utils/logger'
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeft,
  User as UserIcon,
  Briefcase,
  Target,
  Phone,
  Mail,
  ExternalLink,
  Edit3,
  Award,
  Loader,
  Save,
  X,
  Trash2,
  MapPin,
  Building
} from 'lucide-react';
import { MemberWithProfile } from '../types';
import { supabase } from '../lib/supabase';
import { getVisibleMemberData } from '../utils/privacy';
import { hasPermission } from '../utils/permissions';

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { user } = useAuth();
  const currentUser = user ?? undefined;
  const isAuthenticated = !!user;

  useEffect(() => {
    async function loadMemberProfile() {
      if (!memberId) {
        setError('Member ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Load specific member with profile and privacy settings
        const { data: userData, error: userError } = await supabase
          .from('pm_members')
          .select(`
            *,
            profile:member_profiles(*),
            privacy_settings:privacy_settings(*)
          `)
          .eq('id', memberId)
          .single();

        if (userError) throw userError;

        if (!userData) {
          setError('Member not found');
          setIsLoading(false);
          return;
        }

        const memberWithProfile: MemberWithProfile = {
          ...userData,
          profile: userData.profile || null,
          privacy_settings: userData.privacy_settings || null
        };

        setMember(memberWithProfile);

      } catch (err: any) {
        logger.error('Error loading member profile:', err);
        setError(err.message || 'Failed to load member profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadMemberProfile();
  }, [memberId]);

  // Save changes function
  async function handleSave() {
    if (!member || !member.profile) return;

    try {
      setIsSaving(true);
      setError(null);

      // Update member profile
      const { error: updateError } = await supabase
        .from('pm_member_profiles')
        .update({
          bio: member.profile.bio,
          phone: member.profile.phone,
          linkedin_url: member.profile.linkedin_url,
          website_url: member.profile.website_url,
          city: member.profile.city,
          country: member.profile.country,
          organization: member.profile.organization,
          job_title: member.profile.job_title,
          venture_name: member.profile.venture_name,
          venture_description: member.profile.venture_description,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', member.id);

      if (updateError) throw updateError;

      setIsEditing(false);
      logger.log('Profile updated successfully');

    } catch (err: any) {
      logger.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  // Delete member function
  async function handleDelete() {
    if (!member) return;

    try {
      setIsDeleting(true);
      setError(null);

      // Delete in correct order due to foreign key constraints
      const { error: privacyError } = await supabase
        .from('pm_privacy_settings')
        .delete()
        .eq('user_id', member.id);

      if (privacyError) throw privacyError;

      const { error: profileError } = await supabase
        .from('pm_member_profiles')
        .delete()
        .eq('user_id', member.id);

      if (profileError) throw profileError;

      const { error: userError } = await supabase
        .from('pm_members')
        .delete()
        .eq('id', member.id);

      if (userError) throw userError;

      // Navigate back to directory
      navigate('/members');

    } catch (err: any) {
      logger.error('Error deleting member:', err);
      setError(err.message || 'Failed to delete member');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  // Update member data in local state
  function updateMemberProfile(field: string, value: any) {
    if (!member?.profile) return;

    setMember(prev => {
      if (!prev?.profile) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          [field]: value
        }
      };
    });
  }

  // Check edit permissions using the permissions utility
  const canEdit = hasPermission('edit', currentUser, member || undefined, isAuthenticated);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-tm-blue animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading member profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !member) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Profile</h2>
        <p className="text-red-700 mb-4">{error || 'Member not found'}</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/members')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const visibleData = getVisibleMemberData(member, currentUser, isAuthenticated);

  if (!visibleData) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-xl font-bold text-yellow-900 mb-2">Profile Not Available</h2>
        <p className="text-yellow-700 mb-4">
          This member's profile is not visible with your current permissions.
        </p>
        <button
          onClick={() => navigate('/members')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <Link
                  to="/members"
                  className="flex items-center justify-center p-2 text-gray-600 hover:text-tm-blue hover:bg-gray-100 rounded-lg transition-all min-h-touch min-w-touch active:scale-95"
                  aria-label="Back to member directory"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {member?.full_name || 'Member Profile'}
                  </h1>
                  <p className="text-sm text-gray-500 truncate">
                    {member?.profile?.path_level || 'Level 1'} • {member?.profile?.current_path || 'Dynamic Leadership'}
                  </p>
                </div>
              </div>

              {/* Edit Controls */}
              {canEdit && (
                <div className="flex items-center gap-3">
                  {isEditing && (
                    <>
                      {/* Delete Button - More Discrete (Left Side) */}
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isSaving || isDeleting}
                        className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg border border-gray-300"
                        title="Delete member"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm">Delete</span>
                      </button>

                      {/* Cancel Button */}
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setError(null);
                          // Reload data to reset any unsaved changes
                          window.location.reload();
                        }}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>

                      {/* Save Button (Right Side) */}
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        {isSaving ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                      </button>
                    </>
                  )}

                  {!isEditing && (
                    /* Edit Toggle Button */
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-tm-blue text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit Profile</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Member Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              {/* Profile Photo - Mobile Optimized */}
              <div className="text-center mb-4 sm:mb-6">
                {visibleData.photo ? (
                  <img
                    src={visibleData.photo}
                    alt={visibleData.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mx-auto mb-3 sm:mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <UserIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                  </div>
                )}
                <h2 className="text-xl font-semibold text-gray-900">{member?.full_name}</h2>
                <p className="text-gray-600">{member?.profile?.path_level || 'Level 1'} • {member?.profile?.current_path || 'Dynamic Leadership'}</p>
                {member?.profile?.industry && (
                  <p className="text-sm text-gray-500 mt-1">{member.profile.industry}</p>
                )}
              </div>

              {/* Contact Information */}
              {(visibleData.contact || isEditing) && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {member?.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="tel"
                          value={member?.profile?.phone || ''}
                          onChange={(e) => updateMemberProfile('phone', e.target.value)}
                          placeholder="Phone number"
                          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">
                          {member?.profile?.phone || 'Not provided'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Location Information */}
              {((member?.profile?.city || member?.profile?.country) || isEditing) && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Location</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={member?.profile?.city || ''}
                            onChange={(e) => updateMemberProfile('city', e.target.value)}
                            placeholder="City"
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={member?.profile?.country || ''}
                            onChange={(e) => updateMemberProfile('country', e.target.value)}
                            placeholder="Country"
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-700">
                          {member?.profile?.city && member?.profile?.country
                            ? `${member.profile.city}, ${member.profile.country}`
                            : member?.profile?.country || member?.profile?.city || 'Not provided'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Information */}
              {((member?.profile?.organization || member?.profile?.job_title) || isEditing) && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Professional</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={member?.profile?.organization || ''}
                            onChange={(e) => updateMemberProfile('organization', e.target.value)}
                            placeholder="Organization"
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={member?.profile?.job_title || ''}
                            onChange={(e) => updateMemberProfile('job_title', e.target.value)}
                            placeholder="Job Title"
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                          />
                          <input
                            type="url"
                            value={member?.profile?.website_url || ''}
                            onChange={(e) => updateMemberProfile('website_url', e.target.value)}
                            placeholder="Company website"
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700">
                          {member?.profile?.job_title && (
                            <div>{member.profile.job_title}</div>
                          )}
                          {member?.profile?.organization && (
                            <div className="text-gray-600">{member.profile.organization}</div>
                          )}
                          {member?.profile?.website_url && (
                            <div className="mt-1">
                              <a
                                href={member.profile.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-tm-blue hover:opacity-80 text-sm"
                              >
                                Company Website
                              </a>
                            </div>
                          )}
                          {!member?.profile?.job_title && !member?.profile?.organization && !member?.profile?.website_url && (
                            <span>Not provided</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* LinkedIn Profile */}
              {(member?.profile?.linkedin_url || isEditing) && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">LinkedIn</h3>
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="url"
                        value={member?.profile?.linkedin_url || ''}
                        onChange={(e) => updateMemberProfile('linkedin_url', e.target.value)}
                        placeholder="LinkedIn URL"
                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                      />
                    ) : (
                      member?.profile?.linkedin_url && (
                        <a
                          href={member.profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-tm-blue hover:opacity-80 text-sm"
                        >
                          View LinkedIn Profile
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Bio */}
            {(visibleData.bio || isEditing) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                {isEditing ? (
                  <textarea
                    value={member?.profile?.bio || ''}
                    onChange={(e) => updateMemberProfile('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-tm-blue focus:border-transparent resize-none"
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {member?.profile?.bio || 'No biography provided'}
                  </p>
                )}
              </div>
            )}

            {/* Venture Information */}
            {(visibleData.venture || isEditing) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Venture
                </h3>
                <div className="space-y-3">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={member?.profile?.venture_name || ''}
                        onChange={(e) => updateMemberProfile('venture_name', e.target.value)}
                        placeholder="Venture name"
                        className="w-full font-medium border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                      />
                    ) : (
                      <h4 className="font-medium text-gray-900">
                        {member?.profile?.venture_name || 'No venture specified'}
                      </h4>
                    )}
                  </div>

                  {isEditing ? (
                    <textarea
                      value={member?.profile?.venture_description || ''}
                      onChange={(e) => updateMemberProfile('venture_description', e.target.value)}
                      placeholder="Describe your venture..."
                      rows={3}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-tm-blue focus:border-transparent resize-none"
                    />
                  ) : (
                    member?.profile?.venture_description && (
                      <p className="text-gray-700">{member.profile.venture_description}</p>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Expertise Areas */}
            {visibleData.expertise.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {visibleData.expertise.map((area, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-tm-blue bg-opacity-10 text-tm-blue rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Networking Information */}
            {visibleData.networking && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Networking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {visibleData.networking.lookingFor.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Looking For</h4>
                      <div className="space-y-1">
                        {visibleData.networking.lookingFor.map((item, index) => (
                          <span key={index} className="block text-sm text-gray-700">
                            • {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {visibleData.networking.offering.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Offering</h4>
                      <div className="space-y-1">
                        {visibleData.networking.offering.map((item, index) => (
                          <span key={index} className="block text-sm text-gray-700">
                            • {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Speech Progress */}
            {visibleData.speechProgress && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Toastmasters Progress
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-tm-blue">
                      {visibleData.speechProgress.speechCount}
                    </div>
                    <div className="text-sm text-gray-600">Speeches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-tm-blue">
                      {visibleData.speechProgress.evaluationCount}
                    </div>
                    <div className="text-sm text-gray-600">Evaluations</div>
                  </div>
                  <div className="text-center col-span-2 md:col-span-1">
                    <div className="text-sm text-gray-600">Leadership Roles</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {visibleData.speechProgress.leadershipRoles.length > 0
                        ? visibleData.speechProgress.leadershipRoles.join(', ')
                        : 'None yet'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Member</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{visibleData?.name}</strong>?
              This will permanently remove their profile, privacy settings, and all associated data.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}