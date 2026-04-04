import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, type Session, type User } from '../lib/supabaseClient'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithOtp: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>
  signInWithProvider: (provider: 'google' | 'apple') => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        setSession(data.session ?? null)
        setUser(data.session?.user ?? null)
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, []);

  // Presence Tracking: Update last_seen for current user
  useEffect(() => {
    if (!session?.user?.id) return;

    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', session.user.id);
    };

    // Update on mount
    updateLastSeen();

    // Update on refocus
    const handleFocus = () => updateLastSeen();
    window.addEventListener('focus', handleFocus);
    
    // Periodic update (every 4 minutes) to keep "Green" status while active
    const interval = setInterval(updateLastSeen, 1000 * 60 * 4);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [session?.user?.id]);

  const signInWithOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) return { ok: false as const, error: error.message }
      return { ok: true as const }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      return { ok: false as const, error: message }
    }
  }

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      signInWithOtp,
      signInWithProvider,
      signOut,
    }),
    [session, user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within SupabaseAuthProvider')
  return value
}

