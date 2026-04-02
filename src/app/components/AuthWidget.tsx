import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LogIn, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { useAuth } from '../SupabaseAuthProvider'

// Quick inline inline SVG for icons since lucide-react doesn't have brand icons built-in
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const AppleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.82 3.59-.8 1.52.02 2.81.65 3.61 1.77-3.05 1.7-2.55 5.56.39 6.74-.69 1.62-1.54 3.35-2.67 4.46zm-2.87-14.7c-.12-1.63 1.25-3.2 2.76-3.58.33 1.68-1.12 3.48-2.76 3.58z" />
  </svg>
)

export function AuthWidget() {
  const { user, loading, signInWithOtp, signInWithProvider, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  if (loading) return null

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:block">
          <div className="text-sm font-medium text-foreground truncate max-w-[220px]">
            {user.email ?? 'Пользователь'}
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-[12px]" onClick={() => void signOut()}>
          <LogOut className="w-4 h-4 mr-2" />
          Выйти
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-[12px]"
        onClick={() => setOpen(true)}
      >
        <LogIn className="w-4 h-4 mr-2" />
        Войти
      </Button>

      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signInWithOtp, signInWithProvider } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-[16px] max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-xl mb-6 text-center">Создайте аккаунт или войдите</h3>
            
            <div className="flex flex-col gap-3 mb-6">
              <Button 
                variant="outline" 
                className="rounded-[12px] h-12 text-[15px] font-medium border-border/60 shadow-sm"
                onClick={() => signInWithProvider('google')}
              >
                <GoogleIcon />
                Продолжить с Google
              </Button>
              <Button 
                className="rounded-[12px] h-12 text-[15px] font-medium bg-black text-white hover:bg-black/90"
                onClick={() => signInWithProvider('apple')}
              >
                <AppleIcon />
                Продолжить с Apple
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-muted-foreground">Или через email</span>
              </div>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-3 bg-white border border-border rounded-[12px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 mb-4"
            />

            {status && (
              <div
                className={`text-sm mb-4 ${
                  status.startsWith('Ошибка')
                    ? 'text-red-600'
                    : 'text-terracotta-deep'
                }`}
              >
                {status}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px] w-full h-12"
                onClick={async () => {
                  setStatus(null)
                  const res = await signInWithOtp(email.trim())
                  if (!res.ok) {
                    setStatus(`Ошибка: ${res.error}`)
                    return
                  }
                  setStatus('Код отправлен. Проверьте почту.')
                  setTimeout(onClose, 1200)
                }}
                disabled={!email.trim()}
              >
                Получить код на почту
              </Button>
              <Button variant="ghost" className="rounded-[12px] text-muted-foreground hover:text-foreground" onClick={onClose}>
                Отмена
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

