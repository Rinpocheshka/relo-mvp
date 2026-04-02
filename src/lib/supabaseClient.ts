import { createClient, type Session, type User } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Важно: для разработки эти значения приходят из Vite env (`.env.local`).
// Если они не заданы, то клиент не сможет работать с Supabase.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in .env.local'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type { Session, User }

