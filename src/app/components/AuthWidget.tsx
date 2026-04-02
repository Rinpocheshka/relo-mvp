import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Mail, LogIn, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { useAuth } from '../SupabaseAuthProvider'

export function AuthWidget() {
  const { user, loading, signInWithOtp, signOut } = useAuth()
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
        onClick={() => {
          setOpen(true)
          setStatus(null)
        }}
      >
        <LogIn className="w-4 h-4 mr-2" />
        Войти
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[16px] max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-terracotta-deep" />
                <h3 className="font-semibold text-lg">Войти через email</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Мы отправим код на вашу почту.</p>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-3 bg-input-background border border-border rounded-[12px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 mb-4"
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

              <div className="flex items-center gap-3">
                <Button
                  className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px] flex-1"
                  onClick={async () => {
                    setStatus(null)
                    const res = await signInWithOtp(email.trim())
                    if (!res.ok) {
                      setStatus(`Ошибка: ${res.error}`)
                      return
                    }
                    setStatus('Код отправлен. Проверьте почту.')
                    setTimeout(() => setOpen(false), 1200)
                  }}
                  disabled={!email.trim()}
                >
                  Отправить код
                </Button>
                <Button variant="outline" className="rounded-[12px]" onClick={() => setOpen(false)}>
                  Закрыть
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

