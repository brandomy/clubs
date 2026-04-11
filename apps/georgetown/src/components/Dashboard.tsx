import { logger } from '../utils/logger'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Users, Calendar, Target, Mic, Clock, Handshake, BarChart3, Loader2, Camera } from 'lucide-react'
import AppHeader from './AppHeader'
import DesktopSecondaryNav from './DesktopSecondaryNav'
import BottomNav from './BottomNav'
import BottomNavSettings from './BottomNavSettings'
import { trackCTA } from '../utils/analytics'

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  honoraryMembers: number
  activeProjects: number
  upcomingSpeakers: number
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    honoraryMembers: 0,
    activeProjects: 0,
    upcomingSpeakers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)

      // Fetch Active members
      const { count: activeCount } = await supabase
        .from('gt_members')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'Active')

      // Fetch Honorary members
      const { count: honoraryCount } = await supabase
        .from('gt_members')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'Honorary')

      // Fetch active projects (Planning, Approved, Execution)
      const { count: projectsCount } = await supabase
        .from('gt_service_projects')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Planning', 'Approved', 'Execution'])

      // Fetch upcoming speakers (scheduled status with future dates)
      const today = new Date().toISOString().split('T')[0]
      const { count: speakersCount } = await supabase
        .from('gt_speakers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gte('scheduled_date', today)

      setStats({
        totalMembers: (activeCount || 0) + (honoraryCount || 0),
        activeMembers: activeCount || 0,
        honoraryMembers: honoraryCount || 0,
        activeProjects: projectsCount || 0,
        upcomingSpeakers: speakersCount || 0,
      })
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const toolkitCards = [
    {
      id: 'members',
      title: 'Members',
      description: 'Directory & Roles',
      icon: Users,
      color: 'from-[#17458f] to-[#004a8a]', // Rotary Royal Blue to Legacy Dark Blue
      path: '/members',
    },
    {
      id: 'calendar',
      title: 'Calendar',
      description: 'Meetings & Events',
      icon: Calendar,
      color: 'from-[#009739] to-[#007a2e]', // Grass Green (Community Economic Development)
      path: '/calendar',
    },
    {
      id: 'speakers',
      title: 'Speakers',
      description: 'Program Planning',
      icon: Mic,
      color: 'from-[#ff7600] to-[#d96300]', // Orange (Maternal & Child Health)
      path: '/speakers',
    },
    {
      id: 'projects',
      title: 'Projects',
      description: 'Service Initiatives',
      icon: Target,
      color: 'from-[#901f93] to-[#751877]', // Violet (Supporting the Environment)
      path: '/projects',
    },
    {
      id: 'partners',
      title: 'Partners',
      description: 'Community Links',
      icon: Handshake,
      color: 'from-[#00adbb] to-[#008e9a]', // Turquoise (Water, Sanitation & Hygiene)
      path: '/partners',
    },
    {
      id: 'impact',
      title: 'Impact',
      description: 'Our Reach & Results',
      icon: BarChart3,
      color: 'from-[#00a2e0] to-[#0085bd]', // Sky Blue (Basic Education & Literacy)
      path: '/impact',
    },
    {
      id: 'photos',
      title: 'Photos',
      description: 'Event Memories',
      icon: Camera,
      color: 'from-[#d41367] to-[#b01056]', // Cranberry (Rotaract - special occasions)
      path: '/photos',
    },
    {
      id: 'timeline',
      title: 'Timeline',
      description: 'Club History',
      icon: Clock,
      color: 'from-[#f7a81b] to-[#d99000]', // Rotary Gold gradient
      path: '/timeline',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        <AppHeader
          sectionName="DASHBOARD"
          showAddButton={false}
          showSettingsButton={true}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />
        <DesktopSecondaryNav />
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 pb-20 max-w-7xl mx-auto w-full">
        {/* Hero Card - Club Identity */}
        <div className="bg-gradient-to-br from-[#0067c8] to-[#004a8a] text-white rounded-lg p-6 shadow-lg mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src="/assets/images/logos/RotaryMBS-Simple_REV.svg"
              alt="Rotary Logo"
              className="h-16 md:h-20"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Georgetown Rotary Club</h1>
              <p className="text-sm md:text-base opacity-90">District 3300 • Penang, Malaysia</p>
            </div>
          </div>
          <div className="border-t border-white/20 pt-4 mt-4 space-y-1">
            <p className="text-sm md:text-base">📍 Meetings: 1st & 3rd Monday at 7:00 PM</p>
            <p className="text-sm md:text-base">🏛️ Gurney Bay Hotel, 53, Persiaran Gurney, 10250 Penang, Malaysia</p>
          </div>
        </div>

        {/* Quick Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#0067c8]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => {
                trackCTA('members', 'dashboard-stats', '/members')
                navigate('/members')
              }}
              className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-[#17458f]" />
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {stats.totalMembers}
                  </span>
                  <div className="flex items-baseline gap-1.5 text-xs font-medium">
                    <span className="text-[#0067c8]">{stats.activeMembers}A</span>
                    <span className="text-[#f7a81b]">{stats.honoraryMembers}H</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">Members</p>
            </button>

            <button
              onClick={() => {
                trackCTA('speakers', 'dashboard-stats', '/speakers')
                navigate('/speakers')
              }}
              className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <Mic className="w-8 h-8 text-[#ff7600]" />
                <span className="text-3xl font-bold text-gray-900">
                  {stats.upcomingSpeakers}
                </span>
              </div>
              <p className="text-sm text-gray-600">Upcoming Speakers</p>
            </button>

            <button
              onClick={() => {
                trackCTA('projects', 'dashboard-stats', '/projects')
                navigate('/projects')
              }}
              className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-[#901f93]" />
                <span className="text-3xl font-bold text-gray-900">
                  {stats.activeProjects}
                </span>
              </div>
              <p className="text-sm text-gray-600">Active Projects</p>
            </button>
          </div>
        )}

        {/* Your Toolkit */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Toolkit</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {toolkitCards.map((card) => {
              const Icon = card.icon
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    trackCTA(card.id, 'dashboard-toolkit', card.path)
                    navigate(card.path)
                  }}
                  className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-lg p-6 shadow text-center">
          <p className="text-gray-600">
            Welcome to the Georgetown Rotary Club Member Toolkit. Use the navigation above to access different sections.
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Bottom Nav Settings Modal */}
      <BottomNavSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
