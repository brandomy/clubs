import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GlobalSouthInterestModal from './GlobalSouthInterestModal'

export default function Availability() {
  const navigate = useNavigate()
  const [showInterestModal, setShowInterestModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0067c8] shadow-md">
        <div className="px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center space-x-3 md:space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <img
              src="/assets/images/logos/RotaryMBS-Simple_REV.svg"
              alt="Rotary International"
              className="h-6 md:h-7 w-auto"
              loading="eager"
              fetchPriority="high"
            />
            <div>
              <p className="text-xs text-blue-200 font-medium uppercase tracking-wide hidden md:block"
                 style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Open Source Project
              </p>
              <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}>
                ABOUT THIS SOFTWARE
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0067c8] mb-6">
            A Gift to Rotary Clubs Worldwide
          </h2>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="prose prose-lg max-w-none flex-1">
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                <strong className="text-[#0067c8]">HuaQiao Foundation</strong> generously provides this
                software license <strong>free of charge</strong> as a public service to Rotary clubs
                around the world.
              </p>

              <p className="text-lg text-gray-600 mb-6">
                We do so in full support of the <strong>Object of Rotary</strong>, on behalf of
                Chairman <strong>Frank Yih's vision</strong> to be a bridge of peace between China
                and the world.
              </p>
            </div>

            {/* Frank Yih Portrait */}
            <div className="flex-shrink-0">
              <img
                src="https://rmorlqozjwbftzowqmps.supabase.co/storage/v1/object/public/speaker-portraits/chairman-frank-yih-standing-aspirational-square2-492.jpeg"
                alt="Chairman Frank Yih"
                className="w-64 h-64 md:w-72 md:h-72 rounded-lg shadow-lg object-cover"
              />
            </div>
          </div>
        </div>

        {/* HuaQiao Foundation Story */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            About HuaQiao Foundation
          </h3>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Founded in <strong>2004</strong> by Chairman <strong>Frank Yih (叶守璋)</strong> — a
              Shanghai-born entrepreneur and Silicon Valley pioneer — together with a group of overseas
              Chinese (华侨), the <strong>HuaQiao Foundation (华桥基金会)</strong> was established with
              a powerful vision.
            </p>

            <p>
              The name <strong>"HuaQiao (华桥)"</strong> is meaningful wordplay: it sounds like <em>Huaqiao</em>
              (华侨, "overseas Chinese"), but literally means <strong>"Chinese Bridge"</strong> — symbolizing
              HuaQiao's mission to be a bridge of communication, understanding, and peace.
            </p>

            <div className="bg-blue-50 border-l-4 border-[#0067c8] p-6 my-6">
              <h4 className="font-bold text-[#0067c8] mb-3">Twenty Years of Service (2004–2025)</h4>
              <p className="mb-3">
                <strong>First 12 Years (2004–2016):</strong> Focused on humanitarian assistance within
                China — bringing education, healthcare, clean water, and disaster relief to underdeveloped
                regions of the country.
              </p>
              <p>
                <strong>Since 2016:</strong> Evolved to focus on <strong>bridging China with the outside world</strong>,
                with projects primarily outside of China that promote cultural exchange, mutual understanding,
                and peace between nations.
              </p>
            </div>

            <h4 className="text-xl font-bold text-gray-900 mt-8 mb-4">Achievements from the First 12 Years</h4>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border border-blue-100">
                <h5 className="font-bold text-[#0067c8] mb-3 flex items-center">
                  <span className="text-2xl mr-2">📚</span> Education
                </h5>
                <ul className="space-y-2 text-sm">
                  <li>• Sponsored <strong>1,379 volunteer teaching teams</strong></li>
                  <li>• Served <strong>21,860+ students</strong> across 11 provinces</li>
                  <li>• Provided scholarships to hundreds of students</li>
                  <li>• Donated <strong>100,000+ books</strong> and built reading rooms</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border border-green-100">
                <h5 className="font-bold text-green-800 mb-3 flex items-center">
                  <span className="text-2xl mr-2">🏥</span> Healthcare
                </h5>
                <ul className="space-y-2 text-sm">
                  <li>• Treated <strong>1,000+ children</strong> with heart disease</li>
                  <li>• Performed <strong>300+ cataract surgeries</strong></li>
                  <li>• Donated <strong>7,850 wheelchairs</strong> (USD $500,000)</li>
                  <li>• Provided hearing aids and cochlear implants</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-white p-6 rounded-lg border border-cyan-100">
                <h5 className="font-bold text-cyan-800 mb-3 flex items-center">
                  <span className="text-2xl mr-2">💧</span> Water & Infrastructure
                </h5>
                <ul className="space-y-2 text-sm">
                  <li>• Built pipelines in remote herding areas</li>
                  <li>• Installed water purification systems in schools</li>
                  <li>• Constructed an <strong>11 km road</strong> to enable safe school access</li>
                  <li>• Built modern housing for displaced families</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-lg border border-red-100">
                <h5 className="font-bold text-red-800 mb-3 flex items-center">
                  <span className="text-2xl mr-2">🆘</span> Disaster Relief
                </h5>
                <ul className="space-y-2 text-sm">
                  <li>• Responded to <strong>8+ major disasters</strong></li>
                  <li>• Yushu Earthquake (2010), Ya'an Earthquake (2013)</li>
                  <li>• Typhoon Haiyan — rebuilt school & 168 fishing boats</li>
                  <li>• Nepal Earthquake — "Dignity in Tent" project</li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-[#f7a81b] p-6 mt-6">
              <h4 className="font-bold text-gray-900 mb-3">Chairman Frank Yih's Vision</h4>
              <p className="italic text-gray-700">
                "Despite living abroad for most of my life, when I returned to Shanghai in 1992, I felt
                I had truly come home... I founded HuaQiao Foundation with the mission of building bridges —
                between East and West China, between China and the world, between poverty and wealth,
                between material and culture. This vision of being a <strong>bridge of peace</strong> has
                never changed."
              </p>
            </div>

            <div className="mt-8">
              <h4 className="font-bold text-lg text-gray-900 mb-3">International Recognition</h4>
              <p>
                Chairman Frank Yih received <strong>Rotary International's "Service Above Self Award"</strong> —
                Rotary's highest honor — for lifelong dedication to bridging cultures and improving lives
                through service. HuaQiao Foundation was also recognized as a <strong>Top 10 Foundation in
                China</strong> (2015 Kumquat Award) for transparent governance and impactful work.
              </p>
            </div>

            <div className="mt-8">
              <h4 className="font-bold text-lg text-gray-900 mb-3">Partnership with Rotary International</h4>
              <p>
                Throughout its history, HuaQiao Foundation has worked closely with <strong>Rotary Clubs
                worldwide</strong> to implement humanitarian projects. The "Gift Programs" — including
                Gift of Life, Gift of Sight, Gift of Sound, and Gift of Mobility — were collaborative
                efforts that brought international medical resources and expertise to communities in need.
              </p>
            </div>
          </div>
        </div>

        {/* License Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Open Source License
          </h3>

          <div className="space-y-4 text-gray-700">
            <p>
              This software is available under the{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0067c8] hover:text-[#004080] underline font-medium"
              >
                Creative Commons Attribution 4.0 International License (CC BY 4.0)
              </a>.
            </p>

            <div className="bg-blue-50 border-l-4 border-[#0067c8] p-6 my-6">
              <h4 className="font-bold text-[#0067c8] mb-3">You are free to:</h4>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-[#0067c8] mr-2">✓</span>
                  <span><strong>Share</strong> — copy and redistribute the material in any medium or format</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0067c8] mr-2">✓</span>
                  <span><strong>Adapt</strong> — remix, transform, and build upon the material for any purpose</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0067c8] mr-2">✓</span>
                  <span><strong>Use</strong> — deploy this software for your Rotary club or organization</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border-l-4 border-[#f7a81b] p-6">
              <h4 className="font-bold text-gray-900 mb-3">Under the following terms:</h4>
              <p>
                <strong>Attribution</strong> — You must give appropriate credit to HuaQiao Foundation
                and Brandmine, provide a link to the license, and indicate if changes were made.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-[#0067c8] to-[#004080] rounded-lg shadow-lg p-8 md:p-12 mt-8 text-white">
          <h3 className="text-2xl font-bold mb-4">
            Want This For Your Club?
          </h3>
          <p className="text-lg mb-6 text-blue-100">
            We're making this platform available to Rotary clubs worldwide.
            Join the waiting list to bring these tools to your club.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowInterestModal(true)}
              className="px-8 py-4 bg-white text-[#0067c8] rounded-lg font-bold text-lg hover:bg-blue-50 hover:shadow-xl transition-all text-center flex items-center justify-center gap-2"
            >
              <span>🌟</span> Join Waiting List
            </button>
          </div>
        </div>
      </main>

      {/* Global South Interest Modal */}
      <GlobalSouthInterestModal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
      />
    </div>
  )
}
