import { useState } from 'react'
import type { ReactNode } from 'react'
import { Menu, X, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface PublicLayoutProps {
  children: ReactNode
}

const navLink = (active: boolean) =>
  `flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
    active ? 'bg-white/20' : 'hover:bg-white/10'
  }`

const mobileNavLink = (active: boolean) =>
  `block px-3 py-2 rounded-md text-base font-medium text-white min-h-[44px] ${
    active ? 'bg-white/20' : 'hover:bg-white/10'
  }`

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const at = (path: string) => location.pathname === path

  const closeMobile = () => setIsMobileMenuOpen(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/about')
    closeMobile()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#0067c8] text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/about" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <img
                  src="/assets/images/logos/RotaryMBS-Simple_REV.svg"
                  alt="Rotary Logo"
                  className="h-8"
                />
                <span className="text-lg font-semibold text-white">Georgetown Rotary</span>
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-baseline space-x-1 ml-10">
              <Link to="/about"    className={navLink(at('/about'))}>About</Link>
              <Link to="/join-us"  className={navLink(at('/join-us'))}>Join Us</Link>
            </nav>

            {/* Right: Sign In or user + Sign out */}
            <div className="hidden md:flex items-center gap-3 ml-4">
              {user ? (
                <>
                  <span className="text-sm text-white/80 truncate max-w-[180px]">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white hover:bg-white/10 transition-colors min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium border border-white/60 hover:bg-white hover:text-[#0067c8] transition-colors"
                >
                  Member Sign In
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-[#004a8a] focus:outline-none focus:ring-2 focus:ring-white min-h-[44px] min-w-[44px]"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#0067c8]/95">
            <Link to="/about"   onClick={closeMobile} className={mobileNavLink(at('/about'))}>About</Link>
            <Link to="/join-us" onClick={closeMobile} className={mobileNavLink(at('/join-us'))}>Join Us</Link>

            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10 min-h-[44px] mt-2 border-t border-white/20 pt-3"
              >
                <LogOut className="w-4 h-4" />
                Sign out ({user.email})
              </button>
            ) : (
              <Link
                to="/login"
                onClick={closeMobile}
                className="block px-3 py-2 rounded-md text-base font-medium text-white min-h-[44px] border border-white/40 mt-2"
              >
                Member Sign In
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-base font-semibold text-[#0067c8] mb-3">Georgetown Rotary Club</h3>
              <p className="text-sm text-gray-600 mb-2">District 3300 • Penang, Malaysia</p>
              <p className="text-sm text-gray-500">Service Above Self</p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0067c8] mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/about"   className="text-sm text-gray-600 hover:text-[#0067c8] transition-colors">About</Link></li>
                <li><Link to="/join-us" className="text-sm text-gray-600 hover:text-[#0067c8] transition-colors">Join Us</Link></li>
                <li><Link to="/login"   className="text-sm text-gray-600 hover:text-[#0067c8] transition-colors">Member Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0067c8] mb-3">Club Details</h3>
              <p className="text-sm text-gray-600 mb-2">Rotary International District 3300</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                This website is maintained by club members for club business only.
                Content is not endorsed by Rotary International.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Georgetown Rotary Club. All rights reserved.</p>
            <p className="text-xs text-gray-400">
              Built by{' '}
              <a href="https://brandmine.ai" target="_blank" rel="noopener noreferrer" className="hover:text-[#0067c8] transition-colors">
                Brandmine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
