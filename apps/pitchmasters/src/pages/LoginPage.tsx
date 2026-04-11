import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type View = 'login' | 'reset';

export default function LoginPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-tm-red rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl font-montserrat">PM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-montserrat">Pitchmasters</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {view === 'login' ? 'Sign in to your account' : 'Set up or reset your password'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {view === 'login' ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-tm-blue text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setView('reset'); setError(null); setResetSent(false); }}
                  className="text-sm text-tm-blue hover:underline"
                >
                  Forgot password / set up account?
                </button>
              </div>
            </form>
          ) : resetSent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">
                Check your inbox at <strong>{email}</strong> for a link to set your password.
              </p>
              <p className="text-xs text-gray-500">
                No email? Ask your club admin to confirm your address is registered.
              </p>
              <button
                type="button"
                onClick={() => { setView('login'); setResetSent(false); }}
                className="text-sm text-tm-blue hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-5">
              <p className="text-sm text-gray-600">
                Enter your email and we'll send you a link to set or reset your password.
                Your address must already be registered by a club admin.
              </p>

              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tm-blue focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-tm-blue text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
              >
                {isLoading ? 'Sending…' : 'Send password setup link'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(null); }}
                  className="text-sm text-tm-blue hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Pitchmasters Toastmasters · Asia's Startup Club
        </p>
      </div>
    </div>
  );
}
