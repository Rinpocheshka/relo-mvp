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
              <a href="https://t.me/relo_me" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors">
                <span className="text-lg">📱</span>
              </a>
              <a href="https://wa.me/relome" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors">
                <span className="text-lg">💬</span>
              </a>
              <a href="mailto:hello@relo.me" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors">
                <span className="text-lg">✉️</span>
              </a>
              <a href="https://tiktok.com/@relome" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors">
                <span className="text-lg">🎵</span>
              </a>
              <a href="https://instagram.com/relo.me" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors">
                <span className="text-lg">📷</span>
              </a>
              <a href="https://facebook.com/relome" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-soft-sand/30 hover:bg-terracotta-deep/10 rounded-full flex items-center justify-center transition-colors">
                <span className="text-lg">👥</span>
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