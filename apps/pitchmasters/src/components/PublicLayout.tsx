import { ReactNode, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-tm-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/pages" className="flex items-center">
                <h1 className="text-xl font-jakarta font-semibold text-white">
                  Pitchmasters
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/pages"
                  className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-touch ${
                    isActive('/pages') ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  Pages
                </Link>
              </div>
            </nav>

            {/* Sign In (desktop) */}
            <div className="hidden md:flex items-center ml-4">
              <Link
                to="/login"
                className="px-4 py-2 rounded-md text-sm font-medium border border-white border-opacity-60 hover:bg-white hover:text-tm-blue transition-colors"
              >
                Member Sign In
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white min-h-touch min-w-touch"
                aria-expanded={isMobileMenuOpen}
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
                to="/pages"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium text-white min-h-touch ${
                  isActive('/pages') ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Pages
              </Link>
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white min-h-touch border border-white border-opacity-40 mt-2"
              >
                Member Sign In
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-base font-semibold text-tm-blue mb-3">Pitchmasters</h3>
              <p className="text-sm text-gray-600 mb-2">
                Asia's first startup-focused Toastmasters club
              </p>
              <p className="text-sm text-gray-500">
                Building communication excellence for entrepreneurs
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-tm-blue mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/pages" className="text-sm text-gray-600 hover:text-tm-blue transition-colors">
                    Pages
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-sm text-gray-600 hover:text-tm-blue transition-colors">
                    Member Sign In
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold text-tm-blue mb-3">Club Details</h3>
              <p className="text-sm text-gray-600 mb-3">CB-28679395</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                This website is maintained by club members for club business only.
                Content is not endorsed by Toastmasters International.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Pitchmasters. All rights reserved.
              </p>
              <p className="text-xs text-gray-400">
                Built by{' '}
                <a href="https://brandmine.ai" target="_blank" rel="noopener noreferrer" className="hover:text-tm-blue transition-colors">
                  Brandmine.ai
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
