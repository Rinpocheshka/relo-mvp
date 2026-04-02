import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Home, Megaphone, Calendar, Map, User, Heart, Users, MessageCircle, Search, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { AuthWidget } from './AuthWidget';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [city, setCity] = useState<string>('Дананг');

  const navItems = [
    { path: '/home', icon: Home, label: 'Главная' },
    { path: '/announcements', icon: Megaphone, label: 'Объявления' },
    { path: '/events', icon: Calendar, label: 'Афиша' },
    { path: '/support', icon: Heart, label: 'Найти опору' },
    { path: '/people', icon: Users, label: 'Люди рядом' },
    { path: '/map', icon: Map, label: 'Карта' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  useEffect(() => {
    try {
      const stored = localStorage.getItem('reloOnboarding');
      if (!stored) return;
      const data = JSON.parse(stored) as { city?: string };
      if (data.city) setCity(data.city);
    } catch {
      // ignore
    }
  }, []);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const mobileNavItems = [navItems[0], navItems[1], navItems[2], navItems[3], navItems[4]];

  // Don't show header/footer on landing page
  if (isLanding) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-warm-milk">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/home" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-terracotta-deep" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Relo.me
              </div>
            </Link>

            {/* Mobile actions */}
            <div className="flex md:hidden items-center gap-2">
              <div className="hidden min-[380px]:flex items-center px-3 py-1.5 bg-soft-sand/30 rounded-full border border-border text-xs text-muted-foreground">
                {city}
              </div>
              <Link
                to="/announcements"
                className="p-2 rounded-[12px] bg-soft-sand/30 hover:bg-soft-sand/50 transition-colors"
                aria-label="Поиск"
              >
                <Search className="w-5 h-5" />
              </Link>
              <Link
                to="/profile"
                className={`p-2 rounded-[12px] transition-colors ${
                  isActive('/profile') ? 'bg-terracotta-deep text-white' : 'bg-soft-sand/30 hover:bg-soft-sand/50'
                }`}
                aria-label="Профиль"
              >
                <User className="w-5 h-5" />
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-[12px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[12px] transition-colors text-sm ${
                      isActive(item.path)
                        ? 'bg-terracotta-deep/10 text-terracotta-deep font-medium'
                        : 'text-foreground hover:bg-soft-sand/30'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                to="/profile"
                className={`ml-2 p-2 rounded-full transition-colors ${
                  isActive('/profile')
                    ? 'bg-terracotta-deep text-white'
                    : 'bg-soft-sand/30 hover:bg-soft-sand/50'
                }`}
              >
                <User className="w-5 h-5" />
              </Link>
            </nav>

            {/* Telegram Support Button */}
            <a
              href="https://t.me/relo_support"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 ml-4"
            >
              <Button 
                variant="outline" 
                size="sm"
                className="border-dusty-indigo text-dusty-indigo hover:bg-dusty-indigo/10 rounded-[12px]"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Поддержка
              </Button>
            </a>

            {/* Auth */}
            <div className="hidden md:flex items-center ml-4">
              <AuthWidget />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-bold text-terracotta-deep mb-4">Relo.me</div>
              <p className="text-sm mb-2">
                Экосистема поддержки релокантов. Твой дом на колесах.
              </p>
              <p className="text-xs text-muted-foreground">
                Наша миссия: создать прочную системы доверия, общения и взаимообмена в любой стране.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">О проекте</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep">Подробнее о Relo.me</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep">Relo.me для тебя</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep">Продвижение на Relo.me</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep">Истории релокации</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Поддержка</h4>
              <p className="text-xs text-muted-foreground mb-4">Пожалуйста ознакомьтесь перед использованием платформы</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep">Правила сайта</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep">Политика конфиденциальности</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep">Как получить статус «Проводник города»?</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-terracotta-deep">Обратиться в поддержку</a></li>
              </ul>
            </div>
          </div>
          
          {/* Social Links */}
          <div className="mt-12 text-center">
            <p className="text-sm font-medium mb-4">Давайте поговорим</p>
            <div className="flex justify-center gap-4 mb-8">
              <a href="https://t.me/relo_me" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors text-dusty-indigo hover:text-terracotta-deep">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a href="https://wa.me/relome" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors text-dusty-indigo hover:text-terracotta-deep">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.01 2.014a10.01 10.01 0 0 0-8.5 15.28L2 22l4.87-1.25a9.96 9.96 0 0 0 5.14 1.41h.01a10.03 10.03 0 0 0 10-10.04 10.01 10.01 0 0 0-10.01-10.1zm0 18.23a8.21 8.21 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24a8.24 8.24 0 0 1 8.23 8.24 8.24 8.24 0 0 1-8.26 8.24zm4.53-6.17c-.25-.13-1.47-.73-1.7-.81-.23-.08-.4-.13-.57.12-.17.25-.65.81-.79.98-.15.17-.3.19-.55.06a6.83 6.83 0 0 1-3.32-2.05c-.32-.37-.54-.83-.72-1.14-.17-.31-.02-.48.11-.6.11-.11.25-.3.37-.45.09-.13.13-.22.19-.37.06-.15.03-.28-.03-.41-.06-.13-.57-1.38-.78-1.89-.2-.5-.4-.43-.55-.43h-.47c-.17 0-.45.06-.68.32-.23.25-.87.85-.87 2.08s.89 2.42 1.01 2.58c.13.17 1.76 2.69 4.26 3.77 1.49.65 2.15.7 2.92.59.88-.13 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.19-.06-.1-.23-.16-.48-.28z"/></svg>
              </a>
              <a href="mailto:hello@relo.me" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors text-dusty-indigo hover:text-terracotta-deep">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </a>
              <a href="https://tiktok.com/@relome" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors text-dusty-indigo hover:text-terracotta-deep">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.24a8.1 8.1 0 0 1-5 7.42 8.13 8.13 0 0 1-9.98-3.9 8.01 8.01 0 0 1 1-8.52 8.1 8.1 0 0 1 6.57-2.6v4.13a4.01 4.01 0 0 0-2.31 7.23 4.06 4.06 0 0 0 4.1.6 4.01 4.01 0 0 0 2.22-3.66l.01-15.9Z"/></svg>
              </a>
              <a href="https://instagram.com/relo.me" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors text-dusty-indigo hover:text-terracotta-deep">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://facebook.com/relome" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors text-dusty-indigo hover:text-terracotta-deep">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Relo.me · Платформа для релокантов
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              31 000+ участников, 1500+ объявлений, 10+ городов
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 flex-1 ${
                  isActive(item.path) ? 'text-terracotta-deep' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Create FAB */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-14 h-14 bg-terracotta-deep text-white rounded-full shadow-lg flex items-center justify-center hover:bg-terracotta-deep/90 transition-colors"
              aria-label="Создать"
            >
              <Plus className="w-6 h-6" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-[16px] p-2">
            <DropdownMenuItem asChild>
              <Link to="/announcements">Создать объявление</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/events">Создать событие</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/support">Задать вопрос</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/map">Добавить место на карту</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Add padding for mobile navigation */}
      <div className="md:hidden h-16"></div>
    </div>
  );
}