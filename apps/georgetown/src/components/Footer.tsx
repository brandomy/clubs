import { Link } from 'react-router-dom'

// Auto-inject version from package.json at build time
const APP_VERSION = __APP_VERSION__

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      {/* Footer info with space for BottomNav on all screen sizes */}
      <div className="px-4 py-3 pb-20">
        <p className="text-center text-xs text-gray-600 leading-relaxed">
          v{APP_VERSION} • Built by{' '}
          <a
            href="https://brandmine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800 hover:underline transition-colors duration-200"
          >
            Brandmine.ai
          </a>{' '}
          with ♡ for{' '}
          <Link
            to="/availability"
            className="text-gray-600 hover:text-gray-800 hover:underline transition-colors duration-200"
          >
            HuaQiao.asia
          </Link>{' '}
          •{' '}
          <Link
            to="/availability"
            className="text-gray-600 hover:text-gray-800 hover:underline transition-colors duration-200"
          >
            Available
          </Link>{' '}
          under{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800 hover:underline transition-colors duration-200"
          >
            CC BY 4.0 License
          </a>
          {' '}•{' '}
          <a
            href={`mailto:randal@brandmine.io?subject=Georgetown%20Rotary%20App%20Feedback&body=Version:%20v${APP_VERSION}%0D%0A%0D%0APage:%20${window.location.pathname}%0D%0A%0D%0A---%0D%0AFeedback:%0D%0A`}
            className="text-gray-600 hover:text-gray-800 hover:underline transition-colors duration-200"
          >
            Feedback
          </a>
        </p>
      </div>
    </footer>
  )
}