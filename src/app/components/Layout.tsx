import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Home, Megaphone, Calendar, User, Users, Search, Plus,
  LogOut, ChevronDown, Settings, Edit, Heart
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { AuthModal } from './AuthWidget';
import { useAuth } from '../SupabaseAuthProvider';
import { supabase } from '../../lib/supabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

// ─── Telegram SVG ─────────────────────────────────────────────────────────────
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ profile }: { profile: any }) {
  const name = profile?.display_name || 'U';
  const avatarUrl = profile?.avatar_url;
  const initial = name.charAt(0).toUpperCase();

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-terracotta-deep text-white flex items-center justify-center text-sm font-bold">
      {initial}
    </div>
  );
}

// ─── Header Auth Block ────────────────────────────────────────────────────────
function HeaderAuth() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  if (loading) return <div className="w-20 h-9 bg-soft-sand/30 rounded-full animate-pulse" />;

  if (user) {
    const displayName = profile?.display_name || user.email?.split('@')[0] || 'Профиль';
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-soft-sand/40 transition-colors">
              <UserAvatar profile={profile} />
              <span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">{displayName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
            </button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] rounded-[20px] p-2 mt-2 shadow-xl border-soft-sand/20">
              <DropdownMenuItem asChild className="rounded-[12px] cursor-pointer hover:bg-soft-sand/30 font-medium">
                <Link to="/profile" className="flex items-center gap-2 w-full px-2 py-1.5">
                  <User className="w-4 h-4" /> Мой профиль
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-soft-sand/10" />
              <DropdownMenuItem onClick={signOut} className="rounded-[12px] cursor-pointer text-destructive focus:text-destructive hover:bg-red-50/50 flex items-center gap-2 px-3 py-1.5">
                <LogOut className="w-4 h-4" /> Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setAuthOpen(true)}
        className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full px-5 h-9 font-medium shadow-sm"
      >
        Войти
      </Button>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

// ─── Mobile Auth Button ───────────────────────────────────────────────────────
function MobileUserButton({ isActive }: { isActive: boolean }) {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  if (loading) return (
    <div className="flex flex-col items-center gap-1 p-2 flex-1">
      <div className="w-5 h-5 bg-border/30 rounded-full animate-pulse" />
    </div>
  );

  if (user) {
    return (
      <>
        <Link to="/profile" className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-[14px] transition-colors ${isActive ? 'text-terracotta-deep bg-terracotta-deep/8' : 'text-muted-foreground'}`}>
          <UserAvatar profile={profile} />
          <span className="text-[10px] font-medium">Профиль</span>
        </Link>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setAuthOpen(true)}
        className="flex flex-col items-center gap-1 p-2 flex-1 rounded-[14px] text-muted-foreground hover:text-terracotta-deep transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium">Войти</span>
      </button>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isLanding = location.pathname === '/';
  const [city, setCity] = useState<string>('');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    // 1. Redirect logged-in users from Landing to Home
    if (!loading && user && location.pathname === '/') {
      navigate('/home', { replace: true });
    }

    // 2. Sync onboarding data if exists
    if (!loading && user) {
      const stored = localStorage.getItem('reloOnboarding');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data && data.city) {
            supabase.from('profiles').upsert({
              id: user.id,
              city: data.city,
              stage: data.stage,
              interests: [...(data.situation || []), ...(data.interests || [])],
            }).then(({ error }: { error: any }) => {
              if (!error) {
                localStorage.removeItem('reloOnboarding');
              }
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user, loading, location.pathname, navigate]);

  const navItems = [
    { path: '/home', icon: '/assets/icons/custom/danang_symbol.png', label: 'Главная' },
    { path: '/announcements', icon: '/assets/icons/custom/luggage.png', label: 'Объявления' },
    { path: '/events', icon: '/assets/icons/custom/afisha.png', label: 'Афиша' },
    { path: '/support', icon: '/assets/icons/custom/support_tab.png', label: 'Найти опору' },
    { path: '/people', icon: '/assets/icons/custom/people_tab.png', label: 'Люди рядом' },
  ];

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('city').eq('id', user.id).single().then(({ data, error }) => {
        if (!error && data?.city) {
          setCity(data.city);
        } else {
          setCity('');
        }
      });
    } else {
      try {
        const stored = localStorage.getItem('reloOnboarding');
        if (stored) {
          const data = JSON.parse(stored) as { city?: string };
          if (data.city) {
            setCity(data.city);
          } else {
            setCity('');
          }
        } else {
          setCity('');
        }
      } catch {
        setCity('');
      }
    }
  }, [user]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  if (isLanding) return <Outlet />;

  return (
    <div className="min-h-screen bg-warm-milk">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-[60px] gap-4">

            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2 mr-2 flex-shrink-0">
              <div
                className="text-xl font-extrabold text-terracotta-deep tracking-tight"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Relo.me
              </div>
            </Link>

            {/* City pill */}
            <button
              onClick={() => {
                if (!user) setAuthOpen(true);
                else navigate('/profile');
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-soft-sand/40 hover:bg-soft-sand/60 transition-colors rounded-full border border-border/40 text-xs font-medium text-muted-foreground flex-shrink-0 cursor-pointer"
            >
              <img src="/assets/icons/custom/map_pin.png" alt="location" className="w-4 h-4 object-contain" />
              {user ? (city || 'Не указано') : (city || 'Выберите место')}
            </button>
            {!user && <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />}

            {/* Desktop nav — centered */}
            <nav className="hidden md:flex items-center gap-0.5 mx-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      active
                        ? 'bg-terracotta-deep/10 text-terracotta-deep'
                        : 'text-muted-foreground hover:text-foreground hover:bg-soft-sand/40'
                    }`}
                  >
                    <img src={item.icon as string} className="w-6 h-6 object-contain" alt="" />
                    {item.label}
                    {active && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-terracotta-deep/10 rounded-full -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0 ml-auto xl:ml-0">
              {/* Auth — Profile or Login */}
              <HeaderAuth />
            </div>

            <div className="flex md:hidden items-center gap-2 ml-auto">
              <MobileUserButton isActive={isActive('/profile')} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-border/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="text-xl font-extrabold text-terracotta-deep mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Relo.me
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Экосистема поддержки релокантов. Жильё, люди, советы и события — в одном месте.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-foreground">Сервисы</h4>
              <ul className="space-y-2.5">
                <li><Link to="/announcements" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">Объявления</Link></li>
                <li><Link to="/events" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">Афиша</Link></li>
                <li><Link to="/people" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">Люди рядом</Link></li>
                <li><Link to="/support" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">База знаний</Link></li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-foreground">О проекте</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">Подробнее о Relo.me</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">Стать Проводником города</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">Продвижение</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">Истории переезда</a></li>
              </ul>
            </div>

            {/* Support — hidden in header, lives here */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-foreground">Поддержка</h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://t.me/relo_support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-terracotta-deep transition-colors"
                  >
                    <TelegramIcon /> Написать в поддержку
                  </a>
                </li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">Правила сайта</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">Политика конфиденциальности</a></li>
                <li><a href="mailto:hello@relo.me" className="text-sm text-muted-foreground hover:text-terracotta-deep transition-colors">hello@relo.me</a></li>
              </ul>
            </div>
          </div>

          {/* Social + copy */}
          <div className="mt-10 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 Relo.me — система для удобной жизни релокантов</p>
            <div className="flex gap-3">
              {/* Telegram */}
              <a href="https://t.me/relo_me" target="_blank" rel="noopener noreferrer" aria-label="Telegram"
                className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              {/* WhatsApp */}
              <a href="https://wa.me/relome" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12.01 2.014a10.01 10.01 0 0 0-8.5 15.28L2 22l4.87-1.25a9.96 9.96 0 0 0 5.14 1.41h.01a10.03 10.03 0 0 0 10-10.04 10.01 10.01 0 0 0-10.01-10.1zm0 18.23a8.21 8.21 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24a8.24 8.24 0 0 1 8.23 8.24 8.24 8.24 0 0 1-8.26 8.24zm4.53-6.17c-.25-.13-1.47-.73-1.7-.81-.23-.08-.4-.13-.57.12-.17.25-.65.81-.79.98-.15.17-.3.19-.55.06a6.83 6.83 0 0 1-3.32-2.05c-.32-.37-.54-.83-.72-1.14-.17-.31-.02-.48.11-.6.11-.11.25-.3.37-.45.09-.13.13-.22.19-.37.06-.15.03-.28-.03-.41-.06-.13-.57-1.38-.78-1.89-.2-.5-.4-.43-.55-.43h-.47c-.17 0-.45.06-.68.32-.23.25-.87.85-.87 2.08s.89 2.42 1.01 2.58c.13.17 1.76 2.69 4.26 3.77 1.49.65 2.15.7 2.92.59.88-.13 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.19-.06-.1-.23-.16-.48-.28z"/>
                </svg>
              </a>
              {/* TikTok */}
              <a href="https://tiktok.com/@relome" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.24a8.1 8.1 0 0 1-5 7.42 8.13 8.13 0 0 1-9.98-3.9 8.01 8.01 0 0 1 1-8.52 8.1 8.1 0 0 1 6.57-2.6v4.13a4.01 4.01 0 0 0-2.31 7.23 4.06 4.06 0 0 0 4.1.6 4.01 4.01 0 0 0 2.22-3.66l.01-15.9Z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://instagram.com/relo.me" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://facebook.com/relome" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              {/* Email */}
              <a href="mailto:hello@relo.me" aria-label="Email"
                className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl shadow-xl border border-border/40 rounded-2xl z-50 p-1.5 safe-area-bottom">
        <div className="flex items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 py-2 flex-1 rounded-[14px] transition-all ${
                  active
                    ? 'text-terracotta-deep bg-terracotta-deep/8'
                    : 'text-muted-foreground hover:bg-soft-sand/20'
                }`}
              >
                <img src={item.icon as string} className="w-6 h-6 object-contain" alt="" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* Profile / Login as 5th item */}
          <MobileUserButton isActive={isActive('/profile')} />
        </div>
      </nav>

      {/* ── Mobile FAB ── */}
      <div className="md:hidden fixed bottom-24 right-4 z-40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-12 h-12 bg-terracotta-deep text-white rounded-full shadow-lg flex items-center justify-center hover:bg-terracotta-deep/90 transition-all active:scale-95"
              aria-label="Создать"
            >
              <Plus className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-[16px] shadow-xl border-border/50 p-1.5 mb-2">
            <DropdownMenuItem asChild className="rounded-[10px] px-3 py-2.5">
              <Link to="/announcements">📋 Создать объявление</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-[10px] px-3 py-2.5">
              <Link to="/events">🎪 Создать событие</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Spacer for mobile nav */}
      <div className="md:hidden h-24" />
    </div>
  );
}