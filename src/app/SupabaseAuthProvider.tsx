import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, type Session, type User } from '../lib/supabaseClient'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  city: string | null
  stage: string | null
  bio: string | null
  interests: string[]
  role: string
  last_seen: string | null
  is_guide: boolean
}

type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithOtp: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>
  signInWithProvider: (provider: 'google' | 'apple') => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data as Profile
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const p = await fetchProfile(user.id)
      setProfile(p)
    }
  }, [user?.id, fetchProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sync profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    const syncProfile = async () => {
      const existing = await fetchProfile(user.id)
      if (existing) {
        setProfile(existing)
      } else {
        // Create profile ONLY if it doesn't exist
        const metadata = user.user_metadata
        const fullName = metadata?.full_name || metadata?.name
        const defaultName = fullName || `User #${user.id.slice(-4)}`
        const avatarUrl = metadata?.avatar_url || null
        
        try {
          // Use insert instead of upsert to be safe, or just provide role only on creation
          const { data: newProfile, error } = await supabase
            .from('profiles')
            .insert({ 
              id: user.id,
              display_name: defaultName,
              avatar_url: avatarUrl,
              role: 'user'
            })
            .select()
            .single()
          
          if (!error && newProfile) {
            setProfile(newProfile as Profile)
          } else if (error && error.code === '23505') {
            // Conflict (already exists), just fetch it again
            const refreshed = await fetchProfile(user.id)
            if (refreshed) setProfile(refreshed)
          }
        } catch (e) {
          console.error('Error creating profile:', e)
        }
      }
    }

    syncProfile()
  }, [user, fetchProfile])

  // Presence Tracking: Update last_seen for current user
  useEffect(() => {
    if (!session?.user?.id) return;

    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', session.user.id);
    };

    updateLastSeen();

    const handleFocus = () => updateLastSeen();
    window.addEventListener('focus', handleFocus);
    
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
    setProfile(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      signInWithOtp,
      signInWithProvider,
      signOut,
      refreshProfile,
      isAdmin: profile?.role === 'admin',
    }),
    [session, user, profile, loading, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within SupabaseAuthProvider')
  return value
}

