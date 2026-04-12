import { Mail, Users, Heart, Globe, ArrowRight, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function JoinUsPage() {
  return (
    <main className="px-4 py-8 max-w-4xl mx-auto w-full">

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0067c8] to-[#004a8a] rounded-lg p-6 md:p-10 shadow-lg text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Join Georgetown Rotary
        </h1>
        <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
          Become part of a global network of professionals committed to service, fellowship, and positive change in our community.
        </p>
        <a
          href="mailto:info@georgetown-rotary.org?subject=Membership%20Enquiry"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#f7a81b] hover:bg-[#f4b000] text-[#0067c8] rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
        >
          <Mail className="w-5 h-5" />
          <span>Contact Us to Join</span>
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>

      {/* Why Join */}
      <div className="bg-white rounded-lg p-6 md:p-8 shadow mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Why Join Rotary?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-start gap-3">
            <div className="w-10 h-10 bg-[#0067c8]/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#0067c8]" />
            </div>
            <h3 className="font-semibold text-gray-900">Make a Difference</h3>
            <p className="text-sm text-gray-600">
              Work alongside dedicated professionals on service projects that improve lives locally and globally across Rotary's seven areas of focus.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <div className="w-10 h-10 bg-[#0067c8]/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#0067c8]" />
            </div>
            <h3 className="font-semibold text-gray-900">Build Connections</h3>
            <p className="text-sm text-gray-600">
              Join a diverse community of ~50 local members and connect with over 1.4 million Rotarians in 200+ countries and geographic areas.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <div className="w-10 h-10 bg-[#0067c8]/10 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#0067c8]" />
            </div>
            <h3 className="font-semibold text-gray-900">Develop as a Leader</h3>
            <p className="text-sm text-gray-600">
              Access Rotary's world-class leadership development programs, speaker events, and professional networking opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Membership Details */}
      <div className="bg-white rounded-lg p-6 md:p-8 shadow mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Membership Details</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-medium text-gray-900">Weekly Meetings</p>
              <p className="text-gray-600">Every Wednesday at 7:00 PM</p>
              <p className="text-gray-500 text-sm">Penang Island City Council Building, George Town</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌏</span>
            <div>
              <p className="font-medium text-gray-900">District 3300</p>
              <p className="text-gray-600">Part of Rotary International's Southeast Asia district network</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-medium text-gray-900">Diverse Membership</p>
              <p className="text-gray-600">~50 members including business leaders, educators, healthcare professionals, and entrepreneurs</p>
            </div>
          </div>
        </div>
      </div>

      {/* What to Expect */}
      <div className="bg-white rounded-lg p-6 md:p-8 shadow mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">What to Expect</h2>
        <ul className="space-y-3">
          {[
            'Attend a meeting as a guest — no commitment required',
            'Meet with our membership committee to learn more about Rotary',
            'Be proposed for membership by an existing member',
            'Complete your membership application and orientation',
            'Join over 50 members serving our community',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#0067c8] flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Areas of Focus */}
      <div className="bg-white rounded-lg p-6 md:p-8 shadow mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Rotary's Seven Areas of Focus</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Peacebuilding & Conflict Prevention', color: '#0067C8' },
            { label: 'Disease Prevention & Treatment', color: '#E02927' },
            { label: 'Water, Sanitation & Hygiene', color: '#00A2E0' },
            { label: 'Maternal & Child Health', color: '#901F93' },
            { label: 'Basic Education & Literacy', color: '#FF7600' },
            { label: 'Community Economic Development', color: '#00ADBB' },
            { label: 'Supporting the Environment', color: '#009739' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-[#f7a81b] to-[#f4b000] rounded-lg p-6 md:p-8 shadow-lg text-center">
        <h2 className="text-2xl font-bold text-[#0067c8] mb-3">Ready to Get Started?</h2>
        <p className="text-[#0067c8]/80 mb-6">
          Reach out to us and we'll arrange for you to attend a meeting as our guest.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:info@georgetown-rotary.org?subject=Membership%20Enquiry"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0067c8] hover:bg-[#004a8a] text-white rounded-lg font-semibold transition-all shadow-md"
          >
            <Mail className="w-5 h-5" />
            Email Us
          </a>
          <Link
            to="/about"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#0067c8] rounded-lg font-semibold transition-all shadow-md border border-[#0067c8]/20"
          >
            Learn More About Us
          </Link>
        </div>
      </div>

    </main>
  )
}
