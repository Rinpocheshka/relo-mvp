import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, type Session, type User } from '../lib/supabaseClient'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  city: string | null
  stage: string | null
  role: string
  last_seen: string | null
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
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      
      if (newSession?.user) {
        // Sync profile
        const existingProfile = await fetchProfile(newSession.user.id)
        
        if (!existingProfile) {
          // Create new profile with default name
          const metadata = newSession.user.user_metadata
          const fullName = metadata?.full_name || metadata?.name
          const defaultName = fullName || `User #${newSession.user.id.slice(-4)}`
          const avatarUrl = metadata?.avatar_url || null
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: newSession.user.id,
                display_name: defaultName,
                avatar_url: avatarUrl,
                role: 'user'
              }
            ])
            .select()
            .single()
          
          if (!createError && newProfile) {
            setProfile(newProfile as Profile)
          }
        } else {
          setProfile(existingProfile)
        }
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile]);

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

