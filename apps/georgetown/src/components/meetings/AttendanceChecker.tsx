import { useState, useEffect } from 'react'
import { X, UserCheck, Users, UserPlus } from 'lucide-react'
import { useAttendance } from '../../hooks/useAttendance'
import { usePermissions } from '../../hooks/usePermissions'
import { useRSVP } from '../../hooks/useRSVP'
import { supabase } from '../../lib/supabase'
import type { Member } from '../../types/database'
import { VisitorForm } from './VisitorForm'
import { GuestForm} from './GuestForm'

/**
 * AttendanceChecker Component
 * Purpose: Quick check-in interface for taking attendance
 *
 * Requirements:
 * - Only visible to officers/admins
 * - Pre-populated with members who RSVP'd "attending" (highlighted)
 * - Bulk actions: "Check in all RSVP'd" and "Check in all active members"
 * - Individual check-in with checkboxes
 * - Add visitor/guest buttons
 * - Summary stats
 *
 * Usage:
 * <AttendanceChecker eventId="uuid" isOpen={true} onClose={() => setIsOpen(false)} />
 */

interface AttendanceCheckerProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
}

export function AttendanceChecker({ eventId, isOpen, onClose }: AttendanceCheckerProps) {
  const { records, summary: _summary, checkInMember, checkOutMember, bulkCheckIn, isLoading: attendanceLoading } = useAttendance(eventId) // eslint-disable-line @typescript-eslint/no-unused-vars
  const { summary: _rsvpSummary } = useRSVP(eventId) // eslint-disable-line @typescript-eslint/no-unused-vars
  const { isOfficer } = usePermissions()

  const [members, setMembers] = useState<Member[]>([])
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set())
  const [rsvpedMemberIds, setRsvpedMemberIds] = useState<Set<string>>(new Set())
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [showVisitorForm, setShowVisitorForm] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)

  // Fetch active members
  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('active', true)
        .order('name')

      if (!error && data) {
        setMembers(data)
      }
    }

    if (isOpen) {
      fetchMembers()
    }
  }, [isOpen])

  // Track who's checked in
  useEffect(() => {
    const memberIds = new Set(
      records
        .filter(r => r.attendee_type === 'member' && r.member_id)
        .map(r => r.member_id!)
    )
    setCheckedInIds(memberIds)
  }, [records])

  // Track who RSVP'd attending
  useEffect(() => {
    const fetchRSVPs = async () => {
      const { data } = await supabase
        .from('meeting_rsvps')
        .select('member_id')
        .eq('event_id', eventId)
        .eq('status', 'attending')

      if (data) {
        setRsvpedMemberIds(new Set(data.map(r => r.member_id)))
      }
    }

    if (isOpen) {
      fetchRSVPs()
    }
  }, [isOpen, eventId])

  if (!isOfficer) {
    return null // Only officers/admins can take attendance
  }

  const handleToggleMember = async (memberId: string) => {
    setIsCheckingIn(true)
    try {
      if (checkedInIds.has(memberId)) {
        await checkOutMember(memberId)
      } else {
        await checkInMember(memberId)
      }
      // checkedInIds will update via real-time subscription
    } catch (error) {
      console.error('Failed to toggle attendance:', error)
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleBulkCheckInRSVP = async () => {
    const idsToCheckIn = Array.from(rsvpedMemberIds).filter(id => !checkedInIds.has(id))
    if (idsToCheckIn.length === 0) return

    setIsCheckingIn(true)
    try {
      await bulkCheckIn(idsToCheckIn)
    } catch (error) {
      console.error('Failed to bulk check in:', error)
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleBulkCheckInAll = async () => {
    const idsToCheckIn = members
      .map(m => m.id)
      .filter(id => !checkedInIds.has(id))

    if (idsToCheckIn.length === 0) return

    setIsCheckingIn(true)
    try {
      await bulkCheckIn(idsToCheckIn)
    } catch (error) {
      console.error('Failed to bulk check in all:', error)
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const totalMembers = members.length
  const checkedInCount = checkedInIds.size
  const visitorsCount = records.filter(r => r.attendee_type === 'visiting_rotarian').length
  const guestsCount = records.filter(r => r.attendee_type === 'guest').length
  const totalHeadcount = checkedInCount + visitorsCount + guestsCount

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50"
        onClick={handleOverlayClick}
      >
        <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Take Attendance</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-700">{checkedInCount}/{totalMembers}</div>
                <div className="text-sm text-blue-600">Members</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-700">{visitorsCount}</div>
                <div className="text-sm text-purple-600">Visitors</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-700">{guestsCount}</div>
                <div className="text-sm text-green-600">Guests</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{totalHeadcount}</div>
                <div className="text-sm text-gray-300">Total</div>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-col md:flex-row gap-3 mt-4">
              <button
                onClick={handleBulkCheckInRSVP}
                disabled={isCheckingIn || rsvpedMemberIds.size === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserCheck className="w-4 h-4" />
                <span>Check in all RSVP'd ({rsvpedMemberIds.size})</span>
              </button>

              <button
                onClick={handleBulkCheckInAll}
                disabled={isCheckingIn}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className="w-4 h-4" />
                <span>Check in all members</span>
              </button>
            </div>

            {/* Add Visitor/Guest */}
            <div className="flex flex-col md:flex-row gap-3 mt-3">
              <button
                onClick={() => setShowVisitorForm(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Visitor</span>
              </button>

              <button
                onClick={() => setShowGuestForm(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Guest</span>
              </button>
            </div>
          </div>

          {/* Member List */}
          <div className="p-6">
            {attendanceLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading members...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const isCheckedIn = checkedInIds.has(member.id)
                  const hasRSVP = rsvpedMemberIds.has(member.id)

                  return (
                    <button
                      key={member.id}
                      onClick={() => handleToggleMember(member.id)}
                      disabled={isCheckingIn}
                      className={`
                        w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all
                        ${isCheckedIn
                          ? 'bg-green-50 border-green-500'
                          : hasRSVP
                          ? 'bg-blue-50 border-blue-300 hover:border-blue-500'
                          : 'bg-white border-gray-200 hover:border-gray-400'
                        }
                        ${isCheckingIn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <div
                          className={`
                            w-6 h-6 rounded border-2 flex items-center justify-center
                            ${isCheckedIn
                              ? 'bg-green-600 border-green-600'
                              : 'bg-white border-gray-300'
                            }
                          `}
                        >
                          {isCheckedIn && <UserCheck className="w-4 h-4 text-white" />}
                        </div>

                        {/* Member Info */}
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{member.name}</div>
                          {member.classification && (
                            <div className="text-sm text-gray-500">{member.classification}</div>
                          )}
                        </div>
                      </div>

                      {/* RSVP Badge */}
                      {hasRSVP && !isCheckedIn && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          RSVP'd
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visitor Form Modal */}
      {showVisitorForm && (
        <VisitorForm
          eventId={eventId}
          isOpen={showVisitorForm}
          onClose={() => setShowVisitorForm(false)}
        />
      )}

      {/* Guest Form Modal */}
      {showGuestForm && (
        <GuestForm
          eventId={eventId}
          isOpen={showGuestForm}
          onClose={() => setShowGuestForm(false)}
        />
      )}
    </>
  )
}
