import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Member } from '../types/database'
import ImageUpload from './ImageUpload'
import { FaFacebook, FaLinkedin, FaInstagram, FaTwitter, FaWhatsapp, FaYoutube, FaTiktok, FaTelegram } from 'react-icons/fa'
import { SiWechat } from 'react-icons/si'

interface MemberModalProps {
  member: Member | null  // null = Add mode, object = Edit mode
  onClose: () => void
}

export default function MemberModal({ member, onClose }: MemberModalProps) {
  const isEditing = !!member

  const [formData, setFormData] = useState({
    prefix: member?.prefix || '',
    name: member?.name || '',
    job_title: member?.job_title || '',
    birth_month: member?.birth_month || undefined,
    birth_day: member?.birth_day || undefined,
    gender: member?.gender || '',
    citizenship: member?.citizenship || 'Malaysia',
    rotary_id: member?.rotary_id || '',
    rotary_profile_url: member?.rotary_profile_url || '',
    rotary_resume: member?.rotary_resume || '',
    roles: member?.roles || [],
    type: member?.type || 'Active',
    rotary_join_date: member?.rotary_join_date || '',
    member_since: member?.member_since || '',
    email: member?.email || '',
    mobile: member?.mobile || '',
    phf: member?.phf || '',
    charter_member: member?.charter_member || false,
    classification: member?.classification || '',
    linkedin: member?.linkedin || '',
    company_name: member?.company_name || '',
    company_url: member?.company_url || '',
    portrait_url: member?.portrait_url || '',
    social_media_links: member?.social_media_links || {} as Record<string, string>,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Please enter a member name.')
      return
    }

    setIsSubmitting(true)

    try {
      // Clean social media links (only non-empty values)
      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(formData.social_media_links).filter(([_, url]) => url && url.trim() !== '') // eslint-disable-line @typescript-eslint/no-unused-vars
      )

      const saveData = {
        ...formData,
        birth_month: formData.birth_month ?? null,
        birth_day: formData.birth_day ?? null,
        active: formData.type === 'Active',
        social_media_links: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : null,
      }

      if (isEditing) {
        // UPDATE operation
        const updateData = {
          ...saveData,
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('members')
          .update(updateData)
          .eq('id', member.id)

        if (error) {
          console.error('Error updating member:', error) // eslint-disable-line no-console
          alert('Error updating member. Please try again.')
          return
        }

        alert('Member updated successfully!')
      } else {
        const { error } = await supabase
          .from('members')
          .insert(saveData)

        if (error) {
          console.error('Error creating member:', error) // eslint-disable-line no-console
          alert('Error creating member. Please try again.')
          return
        }

        alert('Member created successfully!')
      }

      // Force a page refresh to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error:', error)
      alert(`Error ${isEditing ? 'updating' : 'creating'} member. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!member || deleteConfirmation !== member.name) {
      alert('Please type the member name exactly to confirm deletion.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', member.id)

      if (error) {
        console.error('Error deleting member:', error)
        alert('Error deleting member. Please try again.')
        return
      }

      onClose()
      window.location.reload()
    } catch (error) {
      console.error('Error:', error)
      alert('Error deleting member. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#0067c8] p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {isEditing ? 'Edit Member' : 'Add Member'}
              </h2>
              <p className="text-blue-100 text-sm">Georgetown Rotary Club</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VISUAL IDENTITY SECTION */}
            {/* Member Portrait - At top for visual prominence */}
            <div className="md:col-span-2">
              <ImageUpload
                label="Member Portrait"
                currentImageUrl={formData.portrait_url}
                onImageChange={(url) => setFormData({ ...formData, portrait_url: url || '' })}
                bucketName="member-portraits"
                filePrefix={`member-${formData.email?.split('@')[0] || 'unknown'}-`}
                aspectRatio="1:1"
                maxSizeMB={5}
                showPositionControl={false}
                helpText="Square headshot recommended • 400×400px minimum • 800×800px ideal • Max 5MB"
              />
            </div>

            {/* CORE IDENTITY SECTION */}
            {/* Name Fields */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label htmlFor="prefix" className="block text-sm font-medium text-gray-700 mb-1">
                    Prefix
                  </label>
                  <input
                    type="text"
                    id="prefix"
                    name="prefix"
                    value={formData.prefix}
                    onChange={handleChange}
                    placeholder="Dr., Mr., Ms."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Rotary Membership Dates */}
            <div>
              <label htmlFor="rotary_join_date" className="block text-sm font-medium text-gray-700 mb-1">
                Original Rotary Join Date
              </label>
              <input
                type="date"
                id="rotary_join_date"
                name="rotary_join_date"
                value={formData.rotary_join_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                When they first joined any Rotary club
              </p>
            </div>

            <div>
              <label htmlFor="member_since" className="block text-sm font-medium text-gray-700 mb-1">
                Georgetown Club Join Date
              </label>
              <input
                type="date"
                id="member_since"
                name="member_since"
                value={formData.member_since}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                When they joined Georgetown Rotary Club
              </p>
            </div>

            {/* Membership Status */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Membership Status
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option value="Active">Active</option>
                <option value="Honorary">Honorary</option>
                <option value="Former Member">Former Member</option>
              </select>
            </div>

            {/* Charter Member */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="charter_member"
                  name="charter_member"
                  checked={formData.charter_member}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#f7a81b] focus:ring-[#f7a81b] border-gray-300 rounded"
                />
                <label htmlFor="charter_member" className="text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    Charter Member
                    <span className="text-xs text-gray-500">(Founding Member)</span>
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Check if this member was a founding member of Georgetown Rotary Club
              </p>
            </div>

            {/* ROTARY IDENTITY SECTION */}
            {/* Club Roles */}
            <div>
              <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">
                Club Roles (hold Ctrl/Cmd to select multiple)
              </label>
              <select
                id="roles"
                name="roles"
                multiple
                value={formData.roles}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value)
                  setFormData(prev => ({ ...prev, roles: selected }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                size={8}
              >
                <optgroup label="Club Officers">
                  <option value="President">President</option>
                  <option value="President-Elect">President-Elect</option>
                  <option value="Immediate Past President">Immediate Past President</option>
                  <option value="Vice President">Vice President</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Sergeant-at-Arms">Sergeant-at-Arms</option>
                </optgroup>
                <optgroup label="Club Committee Chairs">
                  <option value="Club Service Chair">Club Service Chair</option>
                  <option value="Foundation Chair">Foundation Chair</option>
                  <option value="International Service Chair">International Service Chair</option>
                  <option value="Membership Chair">Membership Chair</option>
                  <option value="Public Image Chair">Public Image Chair</option>
                  <option value="Service Projects Chair">Service Projects Chair</option>
                  <option value="Youth Service Chair">Youth Service Chair</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="Director">Director</option>
                  <option value="Member">Member</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selected: {formData.roles.length > 0 ? formData.roles.join(', ') : 'None'}
              </p>
            </div>

            {/* Paul Harris Fellow + Rotary ID */}
            <div>
              <label htmlFor="phf" className="block text-sm font-medium text-gray-700 mb-1">
                Paul Harris Fellow Level
              </label>
              <input
                type="text"
                id="phf"
                name="phf"
                value={formData.phf}
                onChange={handleChange}
                placeholder="e.g., PHF+2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            {/* Rotary ID Number */}
            <div className="md:col-span-2">
              <label htmlFor="rotary_id" className="block text-sm font-medium text-gray-700 mb-1">
                Rotary ID Number
              </label>
              <input
                type="text"
                id="rotary_id"
                name="rotary_id"
                value={formData.rotary_id}
                onChange={handleChange}
                placeholder="e.g., 12345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            {/* PROFESSIONAL IDENTITY SECTION */}
            {/* Job Title */}
            <div className="md:col-span-2">
              <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                id="job_title"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                placeholder="e.g., Chief Executive Officer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            {/* Professional Classification */}
            <div className="md:col-span-2">
              <label htmlFor="classification" className="block text-sm font-medium text-gray-700 mb-1">
                Professional Classification
              </label>
              <input
                type="text"
                id="classification"
                name="classification"
                value={formData.classification}
                onChange={handleChange}
                placeholder="e.g., Business Intelligence Services"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            {/* Company Name + Website */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g., Georgetown Business Solutions"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="company_url" className="block text-sm font-medium text-gray-700 mb-1">
                Company Website
              </label>
              <input
                type="url"
                id="company_url"
                name="company_url"
                value={formData.company_url}
                onChange={handleChange}
                placeholder="https://www.example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            {/* CONTACT INFORMATION SECTION */}
            {/* Email + Mobile */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Phone
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            {/* LinkedIn */}
            <div className="md:col-span-2">
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://www.linkedin.com/in/username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            {/* Social Media Links */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Media Links
              </label>

              {/* LinkedIn */}
              <div className="flex items-center gap-2">
                <span className="text-[#0A66C2] flex-shrink-0"><FaLinkedin size={18} /></span>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.social_media_links?.linkedin || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      linkedin: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* Facebook */}
              <div className="flex items-center gap-2">
                <span className="text-[#1877F2] flex-shrink-0"><FaFacebook size={18} /></span>
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={formData.social_media_links?.facebook || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      facebook: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* Instagram */}
              <div className="flex items-center gap-2">
                <span className="text-[#E4405F] flex-shrink-0"><FaInstagram size={18} /></span>
                <input
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={formData.social_media_links?.instagram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      instagram: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-2">
                <span className="text-[#25D366] flex-shrink-0"><FaWhatsapp size={18} /></span>
                <input
                  type="url"
                  placeholder="https://wa.me/..."
                  value={formData.social_media_links?.whatsapp || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      whatsapp: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* WeChat */}
              <div className="flex items-center gap-2">
                <span className="text-[#07C160] flex-shrink-0"><SiWechat size={18} /></span>
                <input
                  type="text"
                  placeholder="WeChat ID"
                  value={formData.social_media_links?.wechat || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      wechat: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* Telegram */}
              <div className="flex items-center gap-2">
                <span className="text-[#0088cc] flex-shrink-0"><FaTelegram size={18} /></span>
                <input
                  type="url"
                  placeholder="https://t.me/..."
                  value={formData.social_media_links?.telegram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      telegram: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* YouTube */}
              <div className="flex items-center gap-2">
                <span className="text-[#FF0000] flex-shrink-0"><FaYoutube size={18} /></span>
                <input
                  type="url"
                  placeholder="https://youtube.com/@..."
                  value={formData.social_media_links?.youtube || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      youtube: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* Twitter/X */}
              <div className="flex items-center gap-2">
                <span className="text-[#1DA1F2] flex-shrink-0"><FaTwitter size={18} /></span>
                <input
                  type="url"
                  placeholder="https://twitter.com/... or https://x.com/..."
                  value={formData.social_media_links?.twitter || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      twitter: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* TikTok */}
              <div className="flex items-center gap-2">
                <span className="text-[#000000] flex-shrink-0"><FaTiktok size={18} /></span>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@..."
                  value={formData.social_media_links?.tiktok || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      tiktok: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* PERSONAL INFORMATION SECTION */}
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === 'Female'}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#0067c8] border-gray-300 focus:ring-[#0067c8]"
                  />
                  <span className="text-sm text-gray-700">Female</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === 'Male'}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#0067c8] border-gray-300 focus:ring-[#0067c8]"
                  />
                  <span className="text-sm text-gray-700">Male</span>
                </label>
              </div>
            </div>

            {/* Citizenship */}
            <div>
              <label htmlFor="citizenship" className="block text-sm font-medium text-gray-700 mb-1">
                Citizenship
              </label>
              <select
                id="citizenship"
                name="citizenship"
                value={formData.citizenship}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              >
                <option value="">Select Country</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Singapore">Singapore</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="China">China</option>
                <option value="India">India</option>
                <option value="Indonesia">Indonesia</option>
                <option value="Thailand">Thailand</option>
                <option value="Philippines">Philippines</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Japan">Japan</option>
                <option value="South Korea">South Korea</option>
                <option value="Canada">Canada</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Birthday Fields */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="birth_month" className="block text-sm font-medium text-gray-700 mb-1">
                  Birthday Month
                </label>
                <select
                  id="birth_month"
                  name="birth_month"
                  value={formData.birth_month || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                >
                  <option value="">Select Month</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div>
                <label htmlFor="birth_day" className="block text-sm font-medium text-gray-700 mb-1">
                  Birthday Day
                </label>
                <select
                  id="birth_day"
                  name="birth_day"
                  value={formData.birth_day || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                >
                  <option value="">Select Day</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                  <option value="13">13</option>
                  <option value="14">14</option>
                  <option value="15">15</option>
                  <option value="16">16</option>
                  <option value="17">17</option>
                  <option value="18">18</option>
                  <option value="19">19</option>
                  <option value="20">20</option>
                  <option value="21">21</option>
                  <option value="22">22</option>
                  <option value="23">23</option>
                  <option value="24">24</option>
                  <option value="25">25</option>
                  <option value="26">26</option>
                  <option value="27">27</option>
                  <option value="28">28</option>
                  <option value="29">29</option>
                  <option value="30">30</option>
                  <option value="31">31</option>
                </select>
              </div>
            </div>

            {/* ROTARY PROFILE SECTION */}
            {/* Rotary Profile URL */}
            <div className="md:col-span-2">
              <label htmlFor="rotary_profile_url" className="block text-sm font-medium text-gray-700 mb-1">
                Rotary Profile URL
              </label>
              <input
                type="url"
                id="rotary_profile_url"
                name="rotary_profile_url"
                value={formData.rotary_profile_url}
                onChange={handleChange}
                placeholder="https://my.rotary.org/en/profile/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            {/* Rotary Resume */}
            <div className="md:col-span-2">
              <label htmlFor="rotary_resume" className="block text-sm font-medium text-gray-700 mb-1">
                Rotary Resume
              </label>
              <textarea
                id="rotary_resume"
                name="rotary_resume"
                value={formData.rotary_resume}
                onChange={handleChange}
                rows={6}
                placeholder="Enter your Rotary background, experience, and achievements..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-1">
                Share your Rotary journey, leadership positions, service projects, and achievements.
              </p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
            {/* Delete Section - Only in Edit Mode */}
            {isEditing && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(deleteConfirmation ? '' : 'confirm')}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  Delete Member
                </button>

                {deleteConfirmation && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Type "${member.name}" to confirm`}
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="px-2 py-1 text-sm border border-red-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting || deleteConfirmation !== member.name}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Spacer for Add mode */}
            {!isEditing && <div></div>}

            {/* Save/Cancel Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#0067c8] text-white rounded-lg hover:bg-[#004a8a] transition-colors disabled:opacity-50"
              >
                {isSubmitting
                  ? (isEditing ? 'Updating...' : 'Adding...')
                  : (isEditing ? 'Update Member' : 'Add Member')
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
