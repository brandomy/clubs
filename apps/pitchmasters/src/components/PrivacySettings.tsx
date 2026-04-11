import { logger } from '../utils/logger'
import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Info, Check, X, AlertCircle } from 'lucide-react';
import { PrivacySettings as PrivacySettingsType, User } from '../types';

interface PrivacySettingsProps {
  currentUser: User;
  privacySettings: PrivacySettingsType;
  onSave: (settings: Partial<PrivacySettingsType>) => Promise<void>;
}

interface SettingInfo {
  title: string;
  description: string;
  whyItMatters: string;
  whoCanSee: string;
  recommendedSetting: boolean;
}

export default function PrivacySettings({ privacySettings, onSave }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettingsType>(privacySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showRecommended, setShowRecommended] = useState(false);

  // Track changes to enable save button
  useEffect(() => {
    const hasChanged = Object.keys(settings).some(
      key => settings[key as keyof PrivacySettingsType] !== privacySettings[key as keyof PrivacySettingsType]
    );
    setHasChanges(hasChanged);
  }, [settings, privacySettings]);

  // Privacy setting configurations with explanations
  const settingsConfig: Record<string, SettingInfo> = {
    show_photo: {
      title: 'Profile Photo',
      description: 'Show your profile photo to other members and visitors',
      whyItMatters: 'A profile photo helps create personal connections and makes networking more effective.',
      whoCanSee: 'All club members and website visitors',
      recommendedSetting: true
    },
    show_venture_info: {
      title: 'Venture Information',
      description: 'Display your startup name, description, and stage',
      whyItMatters: 'Sharing venture details helps members understand your business and offer relevant support.',
      whoCanSee: 'All club members and website visitors',
      recommendedSetting: true
    },
    show_expertise: {
      title: 'Areas of Expertise',
      description: 'Show your professional skills and knowledge areas',
      whyItMatters: 'Expertise visibility enables other members to find you for collaboration and advice.',
      whoCanSee: 'All club members and website visitors',
      recommendedSetting: true
    },
    show_bio: {
      title: 'Professional Bio',
      description: 'Display your professional background and story',
      whyItMatters: 'Your bio helps others understand your journey and find common ground for networking.',
      whoCanSee: 'All club members and website visitors',
      recommendedSetting: true
    },
    show_contact_info: {
      title: 'Contact Information',
      description: 'Share your email and phone number with authenticated members',
      whyItMatters: 'Contact details enable meaningful follow-up conversations and business connections.',
      whoCanSee: 'Authenticated club members only',
      recommendedSetting: true
    },
    show_social_links: {
      title: 'Social Media & Website',
      description: 'Display your LinkedIn, website, and other professional links',
      whyItMatters: 'Professional links help members learn more about you and your work.',
      whoCanSee: 'Authenticated club members only',
      recommendedSetting: true
    },
    show_networking_interests: {
      title: 'Networking Interests',
      description: 'Show your general networking preferences and interests',
      whyItMatters: 'Interest visibility helps other members understand how they might connect with you.',
      whoCanSee: 'Authenticated club members only',
      recommendedSetting: true
    },
    show_speech_progress: {
      title: 'Speech Progress',
      description: 'Display your speech count, evaluations, and Toastmasters achievements',
      whyItMatters: 'Progress visibility helps identify speaking mentors and evaluation opportunities.',
      whoCanSee: 'Authenticated club members only',
      recommendedSetting: true
    },
    show_looking_for: {
      title: 'What You\'re Looking For',
      description: 'Share what kind of support, partnerships, or resources you need',
      whyItMatters: 'Clearly stating your needs helps members identify how they can assist you.',
      whoCanSee: 'Authenticated club members only',
      recommendedSetting: true
    },
    show_offering: {
      title: 'What You\'re Offering',
      description: 'Display the services, expertise, or support you can provide',
      whyItMatters: 'Sharing what you offer helps members know when to reach out for collaboration.',
      whoCanSee: 'Authenticated club members only',
      recommendedSetting: true
    },
    allow_officer_notes: {
      title: 'Officer Notes',
      description: 'Allow club officers to add private notes to your profile',
      whyItMatters: 'Officer notes help track your progress and provide personalized support.',
      whoCanSee: 'Club officers and administrators only',
      recommendedSetting: true
    }
  };

  const handleToggle = (setting: keyof PrivacySettingsType) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      setHasChanges(false);
    } catch (error) {
      logger.error('Error saving privacy settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const applyRecommendedSettings = () => {
    const recommendedSettings = Object.entries(settingsConfig).reduce((acc, [key, config]) => {
      (acc as any)[key] = config.recommendedSetting;
      return acc;
    }, {} as Partial<PrivacySettingsType>);

    setSettings(prev => ({ ...prev, ...recommendedSettings }));
    setShowRecommended(false);
  };

  const resetToDefaults = () => {
    setSettings(privacySettings);
  };

  const renderSettingCard = (settingKey: keyof PrivacySettingsType, config: SettingInfo) => {
    const isEnabled = settings[settingKey];
    const isRecommended = config.recommendedSetting;

    return (
      <div key={settingKey} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-medium text-gray-900">{config.title}</h3>
              {isRecommended && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  Recommended
                </span>
              )}
              <button
                onClick={() => setShowInfoModal(settingKey)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors min-h-touch min-w-touch"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">{config.description}</p>
            <div className="flex items-center gap-2 text-sm">
              {isEnabled ? (
                <Eye className="w-4 h-4 text-green-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
              <span className={isEnabled ? 'text-green-600' : 'text-gray-500'}>
                {isEnabled ? 'Visible' : 'Hidden'}
              </span>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex-shrink-0">
            <button
              onClick={() => handleToggle(settingKey)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-tm-blue focus:ring-offset-2 min-h-touch ${
                isEnabled ? 'bg-tm-blue' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Group settings by access level
  const publicSettings = ['show_photo', 'show_venture_info', 'show_expertise', 'show_bio'] as const;
  const memberSettings = ['show_contact_info', 'show_social_links', 'show_networking_interests', 'show_speech_progress', 'show_looking_for', 'show_offering'] as const;
  const privateSettings = ['allow_officer_notes'] as const;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-tm-blue" />
          <h1 className="text-2xl font-bold text-gray-900">Privacy Settings</h1>
        </div>
        <p className="text-gray-600 mb-4">
          Control what information you share with other members and visitors. You can change these settings anytime.
        </p>

        {/* Privacy Overview */}
        <div className="bg-tm-blue bg-opacity-5 border border-tm-blue border-opacity-20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-tm-blue flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-tm-blue mb-1">Your Privacy Rights</h3>
              <p className="text-sm text-gray-700">
                You have complete control over your personal data. You can update these settings anytime,
                request data deletion, or withdraw consent. Changes take effect immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowRecommended(true)}
          className="flex items-center justify-center px-4 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors min-h-touch"
        >
          Apply Recommended Settings
        </button>
        <button
          onClick={resetToDefaults}
          className="flex items-center justify-center px-4 py-2 text-sm bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors min-h-touch"
          disabled={!hasChanges}
        >
          Reset Changes
        </button>
      </div>

      {/* Public Settings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Public Information</h2>
        <p className="text-sm text-gray-600 mb-4">Visible to all website visitors and club members</p>
        <div className="space-y-4">
          {publicSettings.map(setting => {
          const config = settingsConfig[setting];
          return config ? renderSettingCard(setting, config) : null;
        })}
        </div>
      </div>

      {/* Member-Only Settings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Member-Only Information</h2>
        <p className="text-sm text-gray-600 mb-4">Only visible to authenticated club members</p>
        <div className="space-y-4">
          {memberSettings.map(setting => {
          const config = settingsConfig[setting];
          return config ? renderSettingCard(setting, config) : null;
        })}
        </div>
      </div>

      {/* Private Settings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Private Settings</h2>
        <p className="text-sm text-gray-600 mb-4">Only visible to you and club officers</p>
        <div className="space-y-4">
          {privateSettings.map(setting => {
            const config = settingsConfig[setting];
            return config ? renderSettingCard(setting, config) : null;
          })}
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">You have unsaved changes</p>
              <p className="text-sm text-gray-600">Save your privacy preferences to apply changes.</p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center px-6 py-3 bg-tm-blue text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-touch font-medium"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && settingsConfig[showInfoModal] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {settingsConfig[showInfoModal]!.title}
              </h3>
              <button
                onClick={() => setShowInfoModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors min-h-touch min-w-touch"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">What this controls:</h4>
                <p className="text-sm text-gray-600">{settingsConfig[showInfoModal]!.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Why it matters:</h4>
                <p className="text-sm text-gray-600">{settingsConfig[showInfoModal]!.whyItMatters}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Who can see this:</h4>
                <p className="text-sm text-gray-600">{settingsConfig[showInfoModal]!.whoCanSee}</p>
              </div>

              {settingsConfig[showInfoModal]!.recommendedSetting && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Recommended Setting</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    We recommend enabling this setting to maximize your networking opportunities.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(null)}
                className="flex items-center justify-center px-4 py-2 bg-tm-blue text-white rounded-lg hover:bg-opacity-90 transition-all min-h-touch"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Settings Modal */}
      {showRecommended && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Apply Recommended Settings</h3>
              <button
                onClick={() => setShowRecommended(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors min-h-touch min-w-touch"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Our recommended settings balance privacy with networking opportunities.
              You can always adjust individual settings later.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-green-800">
                This will enable most visibility options to maximize your networking potential
                while maintaining appropriate privacy controls.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRecommended(false)}
                className="flex flex-1 items-center justify-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-touch"
              >
                Cancel
              </button>
              <button
                onClick={applyRecommendedSettings}
                className="flex flex-1 items-center justify-center px-4 py-2 bg-tm-blue text-white rounded-lg hover:bg-opacity-90 transition-all min-h-touch"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}