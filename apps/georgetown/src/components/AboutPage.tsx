import { Link } from 'react-router-dom'
import { Mail, Phone, Facebook, Linkedin, Instagram, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
        {/* Club Overview */}
        <div className="bg-white rounded-lg p-6 md:p-8 shadow-lg mb-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src="/rotary-wheel.svg"
              alt="Rotary Logo"
              className="w-16 h-16 md:w-20 md:h-20"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Georgetown Rotary Club
              </h1>
              <p className="text-gray-600">District 3300 • Penang, Malaysia</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              Georgetown Rotary Club is part of Rotary International, District 3300.
              We are a diverse group of professionals and community leaders dedicated
              to serving our local community and making a positive impact through
              service projects, fellowship, and international partnerships.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our club focuses on the seven Areas of Focus defined by Rotary International:
              Peace & Conflict Prevention, Disease Prevention & Treatment, Water & Sanitation,
              Maternal & Child Health, Basic Education & Literacy, Community Economic Development,
              and Environmental Sustainability.
            </p>
          </div>
        </div>

        {/* Meeting Details */}
        <div className="bg-white rounded-lg p-6 md:p-8 shadow mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Meeting Details</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-medium text-gray-900">When</p>
                <p className="text-gray-600">Every Wednesday at 7:00 PM</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="font-medium text-gray-900">Where</p>
                <p className="text-gray-600">
                  Penang Island City Council Building<br />
                  George Town, Penang, Malaysia
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg p-6 md:p-8 shadow mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <div className="space-y-3">
            <a
              href="mailto:info@georgetown-rotary.org"
              className="flex items-center gap-3 text-gray-700 hover:text-[#0067c8] transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span>info@georgetown-rotary.org</span>
            </a>
            <a
              href="tel:+60412345678"
              className="flex items-center gap-3 text-gray-700 hover:text-[#0067c8] transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>+60 4 123 4567</span>
            </a>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white rounded-lg p-6 md:p-8 shadow mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Connect With Us</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://facebook.com/georgetownrotary"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Facebook className="w-5 h-5" />
              <span>Facebook</span>
            </a>
            <a
              href="https://linkedin.com/company/georgetown-rotary"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Linkedin className="w-5 h-5" />
              <span>LinkedIn</span>
            </a>
            <a
              href="https://instagram.com/georgetownrotary"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span>Instagram</span>
            </a>
          </div>
        </div>

        {/* Member Login CTA */}
        <div className="bg-gradient-to-br from-[#0067c8] to-[#004a8a] rounded-lg p-6 md:p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Are You a Member?</h2>
          <p className="text-white/90 mb-6">
            Access the member toolkit to manage speakers, projects, and more.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#f7a81b] hover:bg-[#f4b000] text-[#0067c8] rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <span>Member Sign In</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}
