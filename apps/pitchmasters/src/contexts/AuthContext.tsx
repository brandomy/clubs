import { logger } from '../utils/logger'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_CACHE_KEY = 'pm_user_cache';

function getCachedUser(authUserId: string): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    return parsed.id === authUserId ? parsed : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: User) {
  try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user)); } catch { /* ignore */ }
}

function clearCachedUser() {
  try { localStorage.removeItem(USER_CACHE_KEY); } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let resolved = false;

    // Safety net: if INITIAL_SESSION never fires, unblock after 5s
    const timeout = setTimeout(() => {
      if (!resolved) {
        logger.error('Auth timeout — INITIAL_SESSION did not fire within 5s');
        setUser(null);
        setIsLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      resolved = true;
      clearTimeout(timeout);

      if (!session?.user) {
        clearCachedUser();
        setUser(null);
        setIsLoading(false);
        return;
      }

      const authUserId = session.user.id;

      // If we have a cached user for this auth ID, show the app immediately —
      // no DB round-trip needed. Validate in background and update if changed.
      const cached = getCachedUser(authUserId);
      if (cached) {
        setUser(cached);
        setIsLoading(false);
        // Background refresh — fire and forget, update user if it succeeds
        fetchUserFromDb(authUserId).then(fresh => {
          if (fresh) {
            setCachedUser(fresh);
            setUser(fresh);
          } else {
            // DB returned nothing (token stale, member removed, etc.) — force re-login
            clearCachedUser();
            setUser(null);
          }
        });
        return;
      }

      // No cache — must wait for DB (first login after clearing storage)
      const fresh = await fetchUserFromDb(authUserId);
      if (fresh) {
        setCachedUser(fresh);
        setUser(fresh);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // fetchUser triggered by onAuthStateChange SIGNED_IN event
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    clearCachedUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

async function fetchUserFromDb(authUserId: string): Promise<User | null> {
  const fetchPromise = supabase
    .from('pm_members')
    .select('*')
    .eq('id', authUserId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        logger.error('fetchUserFromDb error:', JSON.stringify(error));
        return null;
      }
      return data as User;
    });

  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => {
      logger.error('fetchUserFromDb timed out — pm_members SELECT hanging');
      resolve(null);
    }, 8000)
  );

  return Promise.race([fetchPromise, timeoutPromise]);
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
