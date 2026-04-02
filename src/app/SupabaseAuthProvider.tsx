import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, type Session, type User } from '../lib/supabaseClient'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithOtp: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>
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
  }, [])

  const signInWithOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // В большинстве случаев Supabase использует redirect URL, чтобы корректно вернуть пользователя обратно.
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

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      signInWithOtp,
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

