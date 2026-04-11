import { ReactNode, useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-tm-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/assets/logos/ToastmastersLogoWhite.svg"
                  alt="Toastmasters International"
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-montserrat font-semibold text-white">
                  Pitchmasters
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-touch ${
                    isActive('/') ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/members"
                  className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-touch ${
                    isActive('/members') ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  Members
                </Link>
                <Link
                  to="/pages"
                  className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-touch ${
                    location.pathname.startsWith('/pages') ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  Pages
                </Link>
                <Link
                  to="/learn"
                  className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-touch ${
                    location.pathname.startsWith('/learn') ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  Learn
                </Link>
                <a
                  href="#"
                  className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-touch opacity-50 cursor-not-allowed"
                  title="Coming in Sprint 2"
                >
                  Meetings
                </a>
                <a
                  href="#"
                  className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-touch opacity-50 cursor-not-allowed"
                  title="Coming in Sprint 2"
                >
                  Speeches
                </a>
              </div>
            </nav>

            {/* User / Sign out (desktop) */}
            {user && (
              <div className="hidden md:flex items-center gap-3 ml-4">
                <span className="text-sm text-white text-opacity-80 truncate max-w-[160px]">
                  {user.full_name}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white hover:bg-white hover:bg-opacity-10 transition-colors min-h-touch"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white min-h-touch min-w-touch"
                aria-expanded="false"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-tm-blue bg-opacity-95">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium text-white min-h-touch ${
                  isActive('/') ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/members"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium text-white min-h-touch ${
                  isActive('/members') ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Members
              </Link>
              <Link
                to="/pages"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium text-white min-h-touch ${
                  location.pathname.startsWith('/pages') ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Pages
              </Link>
              <Link
                to="/learn"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium text-white min-h-touch ${
                  location.pathname.startsWith('/learn') ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Learn
              </Link>
              <a
                href="#"
                className="block px-3 py-2 rounded-md text-base font-medium text-white min-h-touch opacity-50"
              >
                Meetings (Sprint 2)
              </a>
              <a
                href="#"
                className="block px-3 py-2 rounded-md text-base font-medium text-white min-h-touch opacity-50"
              >
                Speeches (Sprint 2)
              </a>
              {user && (
                <button
                  onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white hover:bg-opacity-10 min-h-touch mt-2 border-t border-white border-opacity-20 pt-3"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out ({user.full_name})
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>

      {/* Georgetown-Style Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Club Info */}
            <div>
              <h3 className="text-base font-semibold text-tm-blue mb-3">Pitchmasters Toastmasters</h3>
              <p className="text-sm text-gray-600 mb-2">
                Asia's first startup-focused Toastmasters club
              </p>
              <p className="text-sm text-gray-500">
                Building communication excellence for entrepreneurs
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-base font-semibold text-tm-blue mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="https://www.toastmasters.org" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-tm-blue transition-colors">
                    Toastmasters International
                  </a>
                </li>
                <li>
                  <a href="https://www.toastmasters.org/pathways-overview" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-tm-blue transition-colors">
                    Pathways Learning Experience
                  </a>
                </li>
              </ul>
            </div>

            {/* Toastmasters Branding */}
            <div>
              <h3 className="text-base font-semibold text-tm-blue mb-3">Official Club</h3>
              <p className="text-sm text-gray-600 mb-3">
                CB-28679395
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                This website is maintained by club members for club business only.
                Content is not endorsed by Toastmasters International.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Pitchmasters. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Attribution Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Built by <a href="https://brandmine.ai" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-tm-blue transition-colors">Brandmine.ai</a> • {new Date().getFullYear()} • Available under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-tm-blue transition-colors">CC BY 4.0 License</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}