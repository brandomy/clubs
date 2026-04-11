import { logger } from '../utils/logger'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { RotaryYear } from '../types/database'

interface NarrativeEditorProps {
  rotaryYear: RotaryYear
  onClose: () => void
}

type SaveStatus = 'saved' | 'saving' | 'error'

export default function NarrativeEditor({
  rotaryYear,
  onClose,
}: NarrativeEditorProps) {
  const [formData, setFormData] = useState({
    summary: rotaryYear.summary || '',
    narrative: rotaryYear.narrative || '',
    highlights: rotaryYear.highlights || [],
    challenges: rotaryYear.challenges || [],
    member_count_year_end: rotaryYear.member_count_year_end || 0,
  })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [hasChanges, setHasChanges] = useState(false)

  // Debounced auto-save effect
  useEffect(() => {
    if (!hasChanges) return

    const timer = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const { error } = await supabase
          .from('gt_rotary_years')
          .update({
            summary: formData.summary || null,
            narrative: formData.narrative || null,
            highlights: formData.highlights,
            challenges: formData.challenges,
            member_count_year_end: formData.member_count_year_end || null,
          })
          .eq('id', rotaryYear.id)

        if (error) throw error
        setSaveStatus('saved')
        setHasChanges(false)
      } catch (error) {
        logger.error('Error auto-saving narrative:', error)
        setSaveStatus('error')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [formData, hasChanges, rotaryYear.id])

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleAddHighlight = () => {
    const newHighlights = [
      ...formData.highlights,
      { title: '', description: '' },
    ]
    setFormData((prev) => ({ ...prev, highlights: newHighlights }))
    setHasChanges(true)
  }

  const handleUpdateHighlight = (
    index: number,
    field: 'title' | 'description',
    value: string
  ) => {
    const newHighlights = [...formData.highlights]
    newHighlights[index] = { ...newHighlights[index], [field]: value }
    setFormData((prev) => ({ ...prev, highlights: newHighlights }))
    setHasChanges(true)
  }

  const handleRemoveHighlight = (index: number) => {
    const newHighlights = formData.highlights.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, highlights: newHighlights }))
    setHasChanges(true)
  }

  const handleAddChallenge = () => {
    const newChallenges = [
      ...formData.challenges,
      { issue: '', resolution: '' },
    ]
    setFormData((prev) => ({ ...prev, challenges: newChallenges }))
    setHasChanges(true)
  }

  const handleUpdateChallenge = (
    index: number,
    field: 'issue' | 'resolution',
    value: string
  ) => {
    const newChallenges = [...formData.challenges]
    newChallenges[index] = { ...newChallenges[index], [field]: value }
    setFormData((prev) => ({ ...prev, challenges: newChallenges }))
    setHasChanges(true)
  }

  const handleRemoveChallenge = (index: number) => {
    const newChallenges = formData.challenges.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, challenges: newChallenges }))
    setHasChanges(true)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#0067c8] p-6 rounded-t-lg sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Edit Year Narrative
              </h2>
              <p className="text-sm text-white/80 mt-1">
                {rotaryYear.rotary_year}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Member Count at Year End */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Count (Year End)
            </label>
            <input
              type="number"
              value={formData.member_count_year_end}
              onChange={(e) => handleChange('member_count_year_end', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              placeholder="Total members as of June 30"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total club membership as of the end of the Rotary year (June 30). This statistic is used for year-over-year growth tracking.
            </p>
          </div>

          {/* Year Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year Summary
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              placeholder="Brief overview paragraph for this Rotary year (2-3 sentences). Supports markdown: **bold** and *italics*"
            />
            <p className="text-xs text-gray-500 mt-1">
              Short narrative summary - appears in "Year Summary" section. Supports **bold** and *italics*.
            </p>
          </div>

          {/* Detailed Narrative */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Narrative
            </label>
            <textarea
              value={formData.narrative}
              onChange={(e) => handleChange('narrative', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              placeholder="Full story of the Rotary year - major initiatives, themes, accomplishments, memorable moments. Supports markdown: **bold** and *italics*"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tell the story of this year - what made it special? Supports **bold** and *italics*.
            </p>
          </div>

          {/* Highlights Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Year Highlights
              </label>
              <button
                type="button"
                onClick={handleAddHighlight}
                className="text-sm text-[#0067c8] hover:text-[#004a8a] font-medium"
              >
                + Add Highlight
              </button>
            </div>

            {formData.highlights.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No highlights added yet. Click "Add Highlight" to start.
              </p>
            )}

            {formData.highlights.map((highlight, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg space-y-2 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Highlight {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(index)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  value={highlight.title}
                  onChange={(e) =>
                    handleUpdateHighlight(index, 'title', e.target.value)
                  }
                  placeholder="Highlight title (e.g., 'Record Fundraising Year')"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                />
                <textarea
                  value={highlight.description}
                  onChange={(e) =>
                    handleUpdateHighlight(index, 'description', e.target.value)
                  }
                  rows={2}
                  placeholder="Description of this highlight..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                />
              </div>
            ))}
          </div>

          {/* Challenges Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Challenges & Resolutions
              </label>
              <button
                type="button"
                onClick={handleAddChallenge}
                className="text-sm text-[#0067c8] hover:text-[#004a8a] font-medium"
              >
                + Add Challenge
              </button>
            </div>

            {formData.challenges.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No challenges recorded yet. Click "Add Challenge" to document lessons learned.
              </p>
            )}

            {formData.challenges.map((challenge, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg space-y-2 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Challenge {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChallenge(index)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  value={challenge.issue}
                  onChange={(e) =>
                    handleUpdateChallenge(index, 'issue', e.target.value)
                  }
                  placeholder="Challenge or issue faced..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                />
                <textarea
                  value={challenge.resolution}
                  onChange={(e) =>
                    handleUpdateChallenge(index, 'resolution', e.target.value)
                  }
                  rows={2}
                  placeholder="How it was resolved or what was learned..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                />
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Auto-save enabled:</strong> Changes are automatically saved every 2 seconds.
              You can close this window anytime - your work is preserved.
            </p>
          </div>

          {/* Save and Close Button */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {saveStatus === 'saved' && !hasChanges && '✓ All changes saved'}
              {saveStatus === 'saving' && 'Saving changes...'}
              {saveStatus === 'error' && '✗ Error saving - please try again'}
              {hasChanges && saveStatus === 'saved' && 'Unsaved changes'}
            </div>
            <button
              type="button"
              onClick={async () => {
                // Force immediate save before closing
                if (hasChanges) {
                  setSaveStatus('saving')
                  try {
                    const { error } = await supabase
                      .from('gt_rotary_years')
                      .update({
                        summary: formData.summary || null,
                        narrative: formData.narrative || null,
                        highlights: formData.highlights,
                        challenges: formData.challenges,
                        member_count_year_end: formData.member_count_year_end || null,
                      })
                      .eq('id', rotaryYear.id)

                    if (error) throw error
                    setSaveStatus('saved')
                    setHasChanges(false)
                    // Close after successful save
                    setTimeout(onClose, 300)
                  } catch (error) {
                    logger.error('Error saving narrative:', error)
                    setSaveStatus('error')
                    // Don't close if save failed
                  }
                } else {
                  onClose()
                }
              }}
              className="px-6 py-2 bg-[#0067c8] text-white rounded-lg hover:bg-[#004a8a] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={saveStatus === 'saving'}
            >
              {hasChanges ? 'Update Narrative' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
