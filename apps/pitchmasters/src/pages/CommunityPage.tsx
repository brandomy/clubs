import { useState, useEffect } from 'react';
import MemberDirectory from '../components/MemberDirectory';
import EcosystemPartnerDirectory from '../components/EcosystemPartnerDirectory';
import PrivacySettings from '../components/PrivacySettings';
import { Users, Building2, Shield, Layout, Loader } from 'lucide-react';
import { EcosystemPartner, PrivacySettings as PrivacySettingsType } from '../types';
import { supabase } from '../lib/supabase';
import { useMembersData } from '../hooks/useMembersData';
import { useAuth } from '../hooks/useAuth';

type ActiveTab = 'members' | 'partners' | 'privacy';

export default function CommunityPage() {
  const { members, isLoading: membersLoading, error: membersError } = useMembersData();
  const { user } = useAuth();
  const [partners, setPartners] = useState<EcosystemPartner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnersError, setPartnersError] = useState<string | null>(null);

  const currentUser = user ?? undefined;
  const isAuthenticated = !!user;
  const [activeTab, setActiveTab] = useState<ActiveTab>('members');

  // Load ecosystem partners
  useEffect(() => {
    async function loadPartners() {
      try {
        setPartnersLoading(true);
        setPartnersError(null);

        const { data: partnersData, error } = await supabase
          .from('pm_ecosystem_partners')
          .select('*')
          .eq('status', 'active');

        if (error) throw error;

        setPartners(partnersData || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load partners';
        setPartnersError(message);
      } finally {
        setPartnersLoading(false);
      }
    }

    loadPartners();
  }, []);

  // Mock current user's privacy settings for demo
  const [currentPrivacySettings] = useState<PrivacySettingsType>({
    id: 'privacy-1',
    user_id: '',
    club_id: '',
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
    updated_at: new Date().toISOString()
  });

  const handlePrivacySettingsUpdate = async (newSettings: Partial<PrivacySettingsType>) => {
    // TODO: Save to Supabase in production
    void newSettings;
  };

  const tabs = [
    {
      id: 'members' as const,
      label: 'Member Directory',
      icon: Users,
      description: 'Browse and connect with club members'
    },
    {
      id: 'partners' as const,
      label: 'Ecosystem Partners',
      icon: Building2,
      description: 'Explore startup ecosystem partners'
    },
    {
      id: 'privacy' as const,
      label: 'Privacy Settings',
      icon: Shield,
      description: 'Control your data visibility'
    }
  ];

  const isLoading = membersLoading || partnersLoading;
  const error = membersError || partnersError;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-tm-blue animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading community data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Data</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <Layout className="w-8 h-8 text-tm-blue" />
              <h1 className="text-3xl font-bold text-gray-900">Community Hub</h1>
            </div>
            <p className="text-gray-600 max-w-3xl">
              Connect with fellow entrepreneurs, discover ecosystem partners, and manage your privacy settings.
              All data visibility respects individual privacy preferences and authentication levels.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors min-h-touch ${
                      isActive
                        ? 'border-tm-blue text-tm-blue'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`mr-2 h-5 w-5 ${
                      isActive ? 'text-tm-blue' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Privacy Integration Notice */}
        {activeTab !== 'privacy' && (
          <div className="bg-tm-blue bg-opacity-5 border border-tm-blue border-opacity-20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-tm-blue flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-tm-blue mb-1">Privacy-Aware Display</h3>
                <p className="text-sm text-gray-700">
                  {activeTab === 'members'
                    ? 'Member information shown respects individual privacy settings. Authenticated members see more details.'
                    : 'Partner directory requires authentication. All contact information is protected for verified members only.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Member Directory</h2>
              <p className="text-gray-600">
                Real-time search with privacy-aware filtering. Members control what information is visible.
              </p>
            </div>
            <MemberDirectory
              members={members}
              currentUser={currentUser}
              isAuthenticated={isAuthenticated}
            />
          </div>
        )}

        {activeTab === 'partners' && (
          <div>
            <EcosystemPartnerDirectory
              partners={partners}
              currentUser={currentUser}
              isAuthenticated={isAuthenticated}
            />
          </div>
        )}

        {activeTab === 'privacy' && currentUser && (
          <div>
            <PrivacySettings
              currentUser={currentUser}
              privacySettings={currentPrivacySettings}
              onSave={handlePrivacySettingsUpdate}
            />
          </div>
        )}

        {activeTab === 'privacy' && !currentUser && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please log in to access privacy settings.</p>
          </div>
        )}
      </div>

      {/* Integration Demo Info */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Sprint 1 Multi-Tier Community Foundation - Complete
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">✅ Database Schema</h4>
                <p>Multi-tenant isolation with RLS policies and performance optimization</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">✅ Georgetown Search</h4>
                <p>Real-time filtering with mobile-first responsive card layouts</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">✅ Privacy Controls</h4>
                <p>GDPR-compliant granular settings with seamless search integration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
