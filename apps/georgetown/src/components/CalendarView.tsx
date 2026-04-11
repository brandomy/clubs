import { logger } from '../utils/logger'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Speaker, Member } from '../types/database'
import { Calendar as CalendarIcon, List } from 'lucide-react'
import AppLayout from './AppLayout'
import { Calendar } from './Calendar'
import SpeakerDetailModal from './SpeakerDetailModal'
import SpeakerModal from './SpeakerModal'
import AddEventModal from './AddEventModal'
import EventViewModal from './EventViewModal'
import HolidayViewModal from './HolidayViewModal'
import { RSVPModal, RSVPListModal } from './meetings'

interface Event {
  id: string
  date: string
  type: 'club_meeting' | 'club_assembly' | 'board_meeting' | 'committee_meeting' | 'club_social' | 'service_project' | 'holiday' | 'observance'
  title: string
  description?: string
  agenda?: string
  location_id?: string
}

export default function CalendarView() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEventViewModalOpen, setIsEventViewModalOpen] = useState(false)
  const [isHolidayViewModalOpen, setIsHolidayViewModalOpen] = useState(false)
  const [isAddSpeakerModalOpen, setIsAddSpeakerModalOpen] = useState(false)
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // RSVP state
  const [showRSVPModal, setShowRSVPModal] = useState(false)
  const [showRSVPListModal, setShowRSVPListModal] = useState(false)
  const [selectedEventForRSVP, setSelectedEventForRSVP] = useState<Event | null>(null)
  const [rsvpSummaries, setRsvpSummaries] = useState<Record<string, { attending: number; total: number }>>({})

  // Fetch functions (defined before useEffect)
  const fetchSpeakers = async () => {
    const { data, error } = await supabase
      .from('speakers')
      .select('*')
      .order('scheduled_date', { ascending: true, nullsFirst: false })

    if (error) {
      logger.error('Error fetching speakers:', error)
    } else {
      setSpeakers(data || [])
    }
    setLoading(false)
  }

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        location:locations(*)
      `)
      .order('date', { ascending: true })

    if (error) {
      logger.error('Error fetching events:', error)
    } else {
      setEvents(data || [])
    }
  }

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error fetching members:', error)
    } else {
      setMembers(data || [])
    }
  }

  const fetchRSVPSummaries = async () => {
    const { data, error } = await supabase
      .from('meeting_rsvp_summary')
      .select('event_id, attending_count, total_headcount')

    if (error) {
      logger.error('Error fetching RSVP summaries:', error)
    } else if (data) {
      const summaries: Record<string, { attending: number; total: number }> = {}
      data.forEach(summary => {
        summaries[summary.event_id] = {
          attending: Number(summary.attending_count),
          total: Number(summary.total_headcount)
        }
      })
      setRsvpSummaries(summaries)
    }
  }

  useEffect(() => {
    fetchSpeakers()
    fetchEvents()
    fetchMembers()
    fetchRSVPSummaries()

    const speakersSubscription = supabase
      .channel('speakers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speakers' },
        handleRealtimeUpdate
      )
      .subscribe()

    const eventsSubscription = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        handleEventRealtimeUpdate
      )
      .subscribe()

    const rsvpSubscription = supabase
      .channel('rsvps-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_rsvps' },
        () => fetchRSVPSummaries()
      )
      .subscribe()

    return () => {
      speakersSubscription.unsubscribe()
      eventsSubscription.unsubscribe()
      rsvpSubscription.unsubscribe()
    }
  }, [])

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setSpeakers((prev) => [...prev, payload.new as Speaker])
    } else if (payload.eventType === 'UPDATE') {
      setSpeakers((prev) =>
        prev.map((speaker) =>
          speaker.id === payload.new.id ? (payload.new as Speaker) : speaker
        )
      )
    } else if (payload.eventType === 'DELETE') {
      setSpeakers((prev) =>
        prev.filter((speaker) => speaker.id !== payload.old.id)
      )
    }
  }

  const handleEventRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setEvents((prev) => [...prev, payload.new as Event])
    } else if (payload.eventType === 'UPDATE') {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === payload.new.id ? (payload.new as Event) : event
        )
      )
    } else if (payload.eventType === 'DELETE') {
      setEvents((prev) =>
        prev.filter((event) => event.id !== payload.old.id)
      )
    }
  }

  const handleSpeakerClick = (speaker: Speaker) => {
    setSelectedSpeaker(speaker)
    setIsViewModalOpen(true)
  }


  const handleAddSpeakerClick = () => {
    setIsAddSpeakerModalOpen(true)
  }

  const handleAddEventClick = () => {
    setIsAddEventModalOpen(true)
  }

  const handleEventClick = (event: any) => {
    if (event.type === 'holiday') {
      setSelectedHoliday(event)
      setIsHolidayViewModalOpen(true)
    } else {
      // All events (including meetings) open EventViewModal for Edit/Delete access
      setSelectedEvent(event)
      setIsEventViewModalOpen(true)
    }
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedSpeaker(null)
  }

  const handleCloseEventViewModal = () => {
    setIsEventViewModalOpen(false)
    setSelectedEvent(null)
  }

  const handleCloseHolidayViewModal = () => {
    setIsHolidayViewModalOpen(false)
    setSelectedHoliday(null)
  }

  const handleCloseAddSpeakerModal = () => {
    setIsAddSpeakerModalOpen(false)
    setSelectedDate(null)
  }

  const handleCloseAddEventModal = () => {
    setIsAddEventModalOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0067c8]"></div>
          </div>
          <div className="text-lg text-gray-600">Loading Georgetown Rotary Calendar...</div>
        </div>
      </div>
    )
  }

  const handleViewChange = (view: string) => {
    if (view === 'list') {
      navigate('/events-list')
    } else {
      setViewMode(view as 'calendar' | 'list')
    }
  }

  return (
    <AppLayout
      sectionName="CALENDAR"
      onAddClick={handleAddEventClick}
      addButtonLabel="+ Event"
      showAddButton={true}
      views={[
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        { id: 'list', label: 'List', icon: List },
      ]}
      activeView={viewMode}
      onViewChange={handleViewChange}
      showFilters={false}
    >
      <div className="w-full max-w-full overflow-x-hidden">
        <Calendar
          speakers={speakers}
          events={events}
          members={members}
          rsvpSummaries={rsvpSummaries}
          onSpeakerClick={handleSpeakerClick}
          onAddSpeakerClick={handleAddSpeakerClick}
          onAddEventClick={handleAddEventClick}
          onEventClick={handleEventClick}
          onRSVPBadgeClick={(event) => {
            setSelectedEventForRSVP(event)
            setShowRSVPListModal(true)
          }}
          onViewSpeakersClick={() => navigate('/')}
          onViewMembersClick={() => navigate('/members')}
          onViewListClick={() => navigate('/events-list')}
        />
      </div>

      {isViewModalOpen && selectedSpeaker && (
        <SpeakerDetailModal
          speaker={selectedSpeaker}
          onClose={handleCloseViewModal}
        />
      )}

      {isAddSpeakerModalOpen && (
        <SpeakerModal
          speaker={null}
          onClose={handleCloseAddSpeakerModal}
          defaultStatus="scheduled"
          defaultScheduledDate={selectedDate ? selectedDate.toISOString().split('T')[0] : undefined}
        />
      )}

      {isEventViewModalOpen && selectedEvent && (
        <EventViewModal
          event={selectedEvent}
          onClose={handleCloseEventViewModal}
          onEventUpdated={fetchEvents}
          onOpenRSVP={() => {
            setSelectedEventForRSVP(selectedEvent)
            setIsEventViewModalOpen(false)
            setShowRSVPModal(true)
          }}
        />
      )}

      {isHolidayViewModalOpen && selectedHoliday && (
        <HolidayViewModal
          holiday={selectedHoliday}
          onClose={handleCloseHolidayViewModal}
          onHolidayUpdated={() => {
            // In production, this would refetch holidays or update state
            logger.log('Holiday updated, refreshing calendar...')
          }}
        />
      )}

      {isAddEventModalOpen && (
        <AddEventModal
          onClose={handleCloseAddEventModal}
          onEventAdded={fetchEvents}
        />
      )}

      {/* RSVP Modal for Club Meetings */}
      {showRSVPModal && selectedEventForRSVP && (
        <RSVPModal
          eventId={selectedEventForRSVP.id}
          eventType={selectedEventForRSVP.type}
          eventDate={selectedEventForRSVP.date}
          isOpen={showRSVPModal}
          onClose={() => {
            setShowRSVPModal(false)
            setSelectedEventForRSVP(null)
          }}
        />
      )}

      {/* RSVP List Modal - Show Attendees */}
      {showRSVPListModal && selectedEventForRSVP && (
        <RSVPListModal
          eventId={selectedEventForRSVP.id}
          eventTitle={selectedEventForRSVP.title}
          eventDate={selectedEventForRSVP.date}
          isOpen={showRSVPListModal}
          onClose={() => {
            setShowRSVPListModal(false)
            setSelectedEventForRSVP(null)
          }}
          onEditRSVP={() => {
            setShowRSVPListModal(false)
            setShowRSVPModal(true)
            // selectedEventForRSVP already set from list modal
          }}
        />
      )}
    </AppLayout>
  )
}