import { ReactNode, useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

const navLink = (active: boolean) =>
  `flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-touch ${
    active ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
  }`;

const mobileNavLink = (active: boolean) =>
  `block px-3 py-2 rounded-md text-base font-medium text-white min-h-touch ${
    active ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
  }`;

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const at = (path: string) => location.pathname === path;
  const startsWith = (path: string) => location.pathname.startsWith(path);

  const closeMobile = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-tm-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to={user ? '/' : '/pages/about'} className="flex items-center">
                <h1 className="text-xl font-jakarta font-semibold text-white">Pitchmasters</h1>
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-baseline space-x-1 ml-10">
              {/* Public — always visible */}
              <Link to="/pages/about"  className={navLink(at('/pages/about'))}>About</Link>
              <Link to="/pages/join-us" className={navLink(at('/pages/join-us'))}>Join Us</Link>

              {/* Members only — appended after public items */}
              {user && (
                <>
                  <Link to="/meetings" className={navLink(startsWith('/meetings'))}>Meetings</Link>
                  <Link to="/learn"    className={navLink(startsWith('/learn'))}>Learn</Link>
                  <Link to="/pages"    className={navLink(startsWith('/pages') && !at('/pages/about') && !at('/pages/join-us'))}>Pages</Link>
                </>
              )}
            </nav>

            {/* Right: Sign In or user + Sign out */}
            <div className="hidden md:flex items-center gap-3 ml-4">
              {user ? (
                <>
                  <span className="text-sm text-white/80 truncate max-w-[160px]">{user.full_name}</span>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white hover:bg-white/10 transition-colors min-h-touch"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium border border-white/60 hover:bg-white hover:text-tm-blue transition-colors"
                >
                  Member Sign In
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white min-h-touch min-w-touch"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-tm-blue/95">
            {/* Public — always visible */}
            <Link to="/pages/about"  onClick={closeMobile} className={mobileNavLink(at('/pages/about'))}>About</Link>
            <Link to="/pages/join-us" onClick={closeMobile} className={mobileNavLink(at('/pages/join-us'))}>Join Us</Link>

            {/* Members only */}
            {user && (
              <>
                <Link to="/meetings" onClick={closeMobile} className={mobileNavLink(startsWith('/meetings'))}>Meetings</Link>
                <Link to="/learn"    onClick={closeMobile} className={mobileNavLink(startsWith('/learn'))}>Learn</Link>
                <Link to="/pages"    onClick={closeMobile} className={mobileNavLink(startsWith('/pages') && !at('/pages/about') && !at('/pages/join-us'))}>Pages</Link>
                <button
                  onClick={() => { signOut(); closeMobile(); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10 min-h-touch mt-2 border-t border-white/20 pt-3"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out ({user.full_name})
                </button>
              </>
            )}

            {!user && (
              <Link
                to="/login"
                onClick={closeMobile}
                className="block px-3 py-2 rounded-md text-base font-medium text-white min-h-touch border border-white/40 mt-2"
              >
                Member Sign In
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Pitchmasters</h3>
              <p className="text-sm text-gray-700 mb-2">Asia's first startup-focused Toastmasters club</p>
              <p className="text-sm text-gray-500">Building communication excellence for entrepreneurs</p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/pages/about"   className="text-sm text-gray-500 hover:text-gray-900 transition-colors">About</Link></li>
                <li><Link to="/pages/join-us" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Join Us</Link></li>
                {!user && <li><Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Member Sign In</Link></li>}
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Club Details</h3>
              <p className="text-sm text-gray-700 mb-3">CB-28679395</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                This website is maintained by club members for club business only.
                Content is not endorsed by Toastmasters International.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Pitchmasters. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Attribution */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-center">
          <p className="text-xs text-gray-500">
            Built by <a href="https://brandmine.ai" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-tm-blue transition-colors">Brandmine.ai</a> • {new Date().getFullYear()} • Available under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-tm-blue transition-colors">CC BY 4.0 License</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
