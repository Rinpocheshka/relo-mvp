import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { X, ArrowRight, MapPin, ChevronDown, ChevronUp, CheckCircle2, Search, Loader2 } from 'lucide-react';
import { AuthModal } from './AuthWidget';
import { AlertCircle, Download, CheckCircle, Navigation } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowStage = 'landing' | 'onboarding';
type OnboardingStep = 0 | 1 | 2 | 3;
type UserPath = 'here' | 'planning' | null;

interface AppInfo {
  name: string;
  desc: string;
  color: string;
  icon: string | React.ReactNode;
  textDark?: boolean;
  link?: { ios?: string; android?: string; web?: string };
}

interface SurvivalCard {
  emoji: string;
  title: string;
  short: string;
  detail: string | React.ReactNode;
  color: string;
  border: string;
  warning?: string;
  apps?: AppInfo[];
}

// ─── Static data ──────────────────────────────────────────────────────────────

const SURVIVAL_CARDS_HERE: SurvivalCard[] = [
  {
    emoji: '🚕',
    title: 'Как добраться',
    short: 'Такси, автобусы, поезда',
    detail: 'Стойка официального такси находится у выхода из таможни, но дешевле вызвать машину через приложение.',
    warning: 'Осторожно: фейковые таксисты. В зоне прилета к вам будут подходить люди и предлагать такси. Игнорируйте их, они завышают цены в 3-5 раз.',
    apps: [
      { name: 'Grab', desc: 'Самое популярное такси', color: 'bg-[#00B14F]', icon: 'G', link: { ios: 'https://apps.apple.com/app/grab/id647268330', android: 'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger' } },
      { name: 'InDrive', desc: 'Можно торговаться', color: 'bg-[#B1D235]', textDark: true, icon: 'in', link: { ios: 'https://apps.apple.com/app/indrive/id1444377865', android: 'https://play.google.com/store/apps/details?id=sinet.startup.inDriver' } },
      { name: 'Vexere', desc: 'Междугородные автобусы', color: 'bg-[#E85D04]', icon: 'V', link: { web: 'https://vexere.com/en-US/referral?rid=KRIUCHKOV001' } },
    ],
    color: 'bg-terracotta-deep/10 text-terracotta-deep',
    border: 'border-terracotta-deep/20',
  },
  {
    emoji: '🌐',
    title: 'Связь и интернет',
    short: 'Симка за 5 минут прямо в аэропорту',
    detail: 'В аэропорту обычно есть стойки операторов. Симка стоит около 200 ₽, пакет данных на месяц ~300 ₽.',
    apps: [
      { name: 'Viettel', desc: 'Самый крупный оператор', color: 'bg-[#E30019]', icon: 'V', link: { web: 'https://viettel.vn/' } },
      { name: 'Vinaphone', desc: 'Хороший охват', color: 'bg-[#0066CC]', icon: 'VP', link: { web: 'https://vinaphone.com.vn/' } },
      { name: 'MobiFone', desc: 'Популярен в городах', color: 'bg-[#009944]', icon: 'M', link: { web: 'https://www.mobifone.vn/' } },
    ],
    color: 'bg-dusty-indigo/10 text-dusty-indigo',
    border: 'border-dusty-indigo/20',
  },
  {
    emoji: '💵',
    title: 'Деньги — где снять и обменять',
    short: 'Банкоматы, обменники, какие карты работают',
    detail: 'Лучший курс обычно в ювелирных магазинах в туристических местах. Карту Мир можно использовать в банкоматах VRB банка. В некоторых магазинах и кафе можно расплатиться по QR-коду Сбербанка.',
    warning: 'Банкоматы берут комиссию. Ищите банкоматы VRB — принимают карту Мир, или TPBank / VPBank — без местной комиссии.',
    color: 'bg-warm-olive/10 text-warm-olive',
    border: 'border-warm-olive/20',
  },
];

const SURVIVAL_CARDS_PLANNING: SurvivalCard[] = [
  {
    emoji: '🛂',
    title: 'Какую визу делать?',
    short: 'Сроки, документы и E-visa',
    detail: 'E-visa (электронная виза) на 90 дней делается онлайн за 2-3 рабочих дня. Это самый простой способ легально находиться в стране долго.',
    color: 'bg-dusty-indigo/10 text-dusty-indigo',
    border: 'border-dusty-indigo/20',
  },
  {
    emoji: '🏠',
    title: 'Где искать жилье?',
    short: 'Первые дни и долгосрок',
    detail: 'Забронируйте Airbnb на первые 3 дня. Затем ищите постоянное жилье через группы в Facebook или Telegram.',
    warning: 'Никогда не подписывайте долгосрочный контракт удаленно. Всегда проверяйте квартиру на плесень и шум лично.',
    color: 'bg-warm-olive/10 text-warm-olive',
    border: 'border-warm-olive/20',
  },
  {
    emoji: '💬',
    title: 'Вступить в комьюнити',
    short: 'Чаты для новичков',
    detail: 'Там ответят на любой вопрос за 5 минут. Напишите "Привет, я скоро буду", и вам сразу накидают полезных ссылок.',
    color: 'bg-terracotta-deep/10 text-terracotta-deep',
    border: 'border-terracotta-deep/20',
  },
];

const SITUATION_TAGS = [
  { value: 'solo', label: '🧍 Я один' },
  { value: 'partner', label: '👫 С партнёром' },
  { value: 'kids', label: '👨‍👩‍👧 С детьми' },
  { value: 'pet', label: '🐾 С питомцем' },
  { value: 'remote', label: '💻 Удалёнщик' },
  { value: 'job', label: '💼 Ищу работу' },
  { value: 'housing', label: '🏠 Ищу жильё' },
];

const ROADMAP_STEPS = [
  {
    period: 'Первые 3 дня',
    icon: '🛬',
    color: 'text-terracotta-deep',
    bg: 'bg-terracotta-deep/10',
    items: ['Симка и интернет', 'Снять наличные / обменять', 'Краткосрочное жильё', 'Еда и доставки', 'Транспорт — Grab, байк-такси'],
  },
  {
    period: 'Первый месяц',
    icon: '📋',
    color: 'text-dusty-indigo',
    bg: 'bg-dusty-indigo/10',
    items: ['Виза и легализация', 'Долгосрочное жильё', 'Банковские карты', 'Байк или скутер', 'Страховка'],
  },
  {
    period: 'Жизнь и сообщество',
    icon: '🌿',
    color: 'text-warm-olive',
    bg: 'bg-warm-olive/10',
    items: ['Местные чаты и комьюнити', 'Спорт, кафе, люди', 'Медицина и стоматология', 'Налоги и документы', 'Стать частью Relo'],
  },
];

// ─── Main export ──────────────────────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate();
  const [flowStage, setFlowStage] = useState<FlowStage>('landing');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(0);
  const [userPath, setUserPath] = useState<UserPath>('here');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [openCard, setOpenCard] = useState<number | null>(null);
  const [openRoadmap, setOpenRoadmap] = useState<number>(0);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [progress] = useState(10);

  const startOnboarding = () => {
    setFlowStage('onboarding');
    setOnboardingStep(0);
  };

  const skipToHome = () => navigate('/home');

  const toggleTag = (val: string) => {
    setSelectedTags(prev =>
      prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]
    );
  };

  const saveAndFinish = () => {
    localStorage.setItem('reloOnboarding', JSON.stringify({
      city: 'Дананг',
      stage: userPath === 'here' ? 'living' : 'planning',
      need: selectedTags,
      savePath: false,
    }));
    localStorage.setItem('reloStage', userPath === 'here' ? 'living' : 'planning');
  };

  const goToNextStep = () => {
    if (onboardingStep < 3) {
      setOnboardingStep((onboardingStep + 1) as OnboardingStep);
    }
  };

  const goToPrevStep = () => {
    if (onboardingStep > 0) {
      setOnboardingStep((onboardingStep - 1) as OnboardingStep);
    }
  };

  if (flowStage === 'onboarding') {
    return (
      <>
        <OnboardingFlow
          step={onboardingStep}
          userPath={userPath}
          setUserPath={setUserPath}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          openCard={openCard}
          setOpenCard={setOpenCard}
          openRoadmap={openRoadmap}
          setOpenRoadmap={setOpenRoadmap}
          completedItems={completedItems}
          setCompletedItems={setCompletedItems}
          progress={progress}
          onNext={goToNextStep}
          onBack={goToPrevStep}
          onClose={skipToHome}
          onFinish={() => {
            saveAndFinish();
            setIsAuthOpen(true);
          }}
          onSkipAuth={() => {
            saveAndFinish();
            navigate('/home');
          }}
        />
        <AuthModal open={isAuthOpen} onClose={() => { setIsAuthOpen(false); navigate('/home'); }} />
      </>
    );
  }

  // ── Landing page ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-warm-milk">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-warm-milk/90 backdrop-blur-md border-b border-border/30 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold text-terracotta-deep" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Relo.me
          </div>
          <div className="flex items-center gap-3">
            <button onClick={skipToHome} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Просто посмотреть
            </button>
            <Button
              size="sm"
              onClick={startOnboarding}
              className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full px-5"
            >
              Начать
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pt-20 pb-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
              В любой точке мира можно{' '}
              <span className="text-terracotta-deep">быть дома</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Relo.me — живая экосистема людей, которые помогают друг другу адаптироваться.<br />
              Жильё, события, советы и поддержка — всё в одном месте.
            </p>
          </motion.div>
        </div>
      </section>


      {/* Live stats */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-[32px] border border-border/40 shadow-sm px-8 py-6 flex flex-wrap gap-6 items-center justify-around">
            {[
              { num: '140+', label: 'участников', color: 'text-terracotta-deep' },
              { num: '15', label: 'Ищут жильё', color: 'text-dusty-indigo' },
              { num: '8', label: 'предлагают помощь', color: 'text-warm-olive' },
              { num: '30+', label: 'объявлений за месяц', color: 'text-terracotta-deep' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
                <div className={`text-3xl font-extrabold ${s.color}`}>{s.num}</div>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOOK */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Жизнь релоканта<br />часто выглядит так</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '😮‍💨', text: 'Открываешь десятки чатов — и не понимаешь, кому можно доверять' },
              { emoji: '⏳', text: 'Тратишь часы на поиски простых вещей: жильё, обменники, школы' },
              { emoji: '🤷', text: 'Не знаешь, с чего начать и что делать дальше' },
            ].map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white p-8 rounded-[24px] border border-border/40 shadow-sm">
                <span className="text-4xl mb-4 block">{p.emoji}</span>
                <p className="text-lg text-foreground leading-relaxed">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features block */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Мы собрали всё в одном месте</h2>
            <p className="text-xl text-muted-foreground">чтобы пройти этот путь проще</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: '🗂️',
                title: 'Актуальные объявления и события',
                desc: 'Можно выбрать по категориям, фильтрам и всё — актуальное',
                accent: 'bg-terracotta-deep/8 border-terracotta-deep/15',
              },
              {
                icon: '🤝',
                title: 'Люди, которым можно доверять',
                desc: 'Ты видишь путь, который уже прошёл человек, а не только его ник',
                accent: 'bg-dusty-indigo/8 border-dusty-indigo/15',
              },
              {
                icon: '💬',
                title: 'Все ответы в одном месте',
                desc: 'Кто прошёл путь — делится опытом, помогает другим',
                accent: 'bg-warm-olive/8 border-warm-olive/15',
              },
              {
                icon: '🗺️',
                title: 'Понятно куда дальше',
                desc: 'Внутри уже есть шаги на каждый этап релокации',
                accent: 'bg-rose-50 border-rose-100',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-[28px] border p-7 flex gap-5 items-start ${f.accent}`}
              >
                <div className="text-4xl flex-shrink-0 mt-0.5">{f.icon}</div>
                <div>
                  <div className="font-bold text-lg mb-1.5">{f.title}</div>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-dusty-indigo to-terracotta-deep rounded-[40px] p-12 md:p-16 text-white text-center shadow-xl">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-10 leading-tight">
              Узнаешь себя?<br />Начни — и получи помощь<br />прямо сейчас
            </h2>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" onClick={startOnboarding} className="bg-white text-terracotta-deep hover:bg-white/90 rounded-full h-14 px-10 text-base font-bold shadow-lg">
                Начать свой путь →
              </Button>
              <Button size="lg" variant="outline" onClick={skipToHome} className="border-white/40 text-white !text-white bg-transparent hover:bg-white/10 rounded-full h-14 px-10 text-base font-medium">
                Просто посмотреть
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="font-bold text-terracotta-deep text-base">Relo.me</div>
          <p>© 2026 · Платформа для релокантов</p>
          <div className="flex gap-3">
            {/* Telegram */}
            <a href="https://t.me/relo_me" target="_blank" rel="noopener noreferrer" aria-label="Telegram"
              className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
            {/* WhatsApp */}
            <a href="https://wa.me/relome" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12.01 2.014a10.01 10.01 0 0 0-8.5 15.28L2 22l4.87-1.25a9.96 9.96 0 0 0 5.14 1.41h.01a10.03 10.03 0 0 0 10-10.04 10.01 10.01 0 0 0-10.01-10.1zm0 18.23a8.21 8.21 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24a8.24 8.24 0 0 1 8.23 8.24 8.24 8.24 0 0 1-8.26 8.24zm4.53-6.17c-.25-.13-1.47-.73-1.7-.81-.23-.08-.4-.13-.57.12-.17.25-.65.81-.79.98-.15.17-.3.19-.55.06a6.83 6.83 0 0 1-3.32-2.05c-.32-.37-.54-.83-.72-1.14-.17-.31-.02-.48.11-.6.11-.11.25-.3.37-.45.09-.13.13-.22.19-.37.06-.15.03-.28-.03-.41-.06-.13-.57-1.38-.78-1.89-.2-.5-.4-.43-.55-.43h-.47c-.17 0-.45.06-.68.32-.23.25-.87.85-.87 2.08s.89 2.42 1.01 2.58c.13.17 1.76 2.69 4.26 3.77 1.49.65 2.15.7 2.92.59.88-.13 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.19-.06-.1-.23-.16-.48-.28z" />
              </svg>
            </a>
            {/* TikTok */}
            <a href="https://tiktok.com/@relome" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
              className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.24a8.1 8.1 0 0 1-5 7.42 8.13 8.13 0 0 1-9.98-3.9 8.01 8.01 0 0 1 1-8.52 8.1 8.1 0 0 1 6.57-2.6v4.13a4.01 4.01 0 0 0-2.31 7.23 4.06 4.06 0 0 0 4.1.6 4.01 4.01 0 0 0 2.22-3.66l.01-15.9Z" />
              </svg>
            </a>
            {/* Instagram */}
            <a href="https://instagram.com/relo.me" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            {/* Facebook */}
            <a href="https://facebook.com/relome" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
              className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            {/* Email */}
            <a href="mailto:hello@relo.me" aria-label="Email"
              className="w-8 h-8 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full flex items-center justify-center transition-colors text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── 4-Step Reverse Onboarding ────────────────────────────────────────────────

function OnboardingFlow({
  step,
  userPath,
  setUserPath,
  selectedTags,
  toggleTag,
  openCard,
  setOpenCard,
  openRoadmap,
  setOpenRoadmap,
  completedItems,
  setCompletedItems,
  progress,
  onNext,
  onBack,
  onClose,
  onFinish,
  onSkipAuth,
}: {
  step: OnboardingStep;
  userPath: UserPath;
  setUserPath: (p: UserPath) => void;
  selectedTags: string[];
  toggleTag: (v: string) => void;
  openCard: number | null;
  setOpenCard: (i: number | null) => void;
  openRoadmap: number;
  setOpenRoadmap: (i: number) => void;
  completedItems: Set<string>;
  setCompletedItems: (s: Set<string>) => void;
  progress: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onFinish: () => void;
  onSkipAuth: () => void;
}) {
  const [locState, setLocState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');

  const handleAutoLocation = () => {
    setLocState('loading');
    if (!navigator.geolocation) {
      setLocState('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=ru`);
          const data = await res.json();
          const foundCity = data.address?.city || data.address?.town || data.address?.village || data.address?.state || 'Неизвестный город';
          const foundCountry = data.address?.country || '';
          setCity(`${foundCity}${foundCountry ? ', ' + foundCountry : ''}`);
          setCountry(foundCountry);
          setLocState('success');
          setTimeout(() => { setUserPath('here'); onNext(); }, 1500);
        } catch (e) {
          setLocState('error');
        }
      },
      (_err) => {
        setLocState('error');
      },
      { timeout: 8000 }
    );
  };

  const handleManualSubmit = () => {
    const val = manualInput.trim();
    if (!val) return;
    setCity(val);
    // Try to extract country from the last part after comma
    const parts = val.split(',');
    setCountry(parts.length > 1 ? parts[parts.length - 1].trim() : val);
    setUserPath('here');
    onNext();
  };

  const toggleComplete = (item: string) => {
    const next = new Set(completedItems);
    if (next.has(item)) next.delete(item); else next.add(item);
    setCompletedItems(next);
  };

  const totalItems = ROADMAP_STEPS.flatMap(s => s.items).length;
  const doneCount = completedItems.size;
  const progressPct = Math.round((doneCount / totalItems) * 100);

  return (
    <div className="fixed inset-0 bg-warm-milk z-50 flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Назад">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {step === 0 ? 'Шаг 1 из 3' : step === 1 ? 'Шаг 2 из 3' : 'Шаг 3 из 3'}
          </span>
        </div>
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${i < step ? 'w-5 h-2 bg-terracotta-deep/60' :
                  i === step ? 'w-8 h-2 bg-terracotta-deep' :
                    'w-2 h-2 bg-border'
                }`}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Пропустить <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="min-h-full"
          >

            {/* ── Step 0: Where are you? ── */}
            {step === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-5 py-12 text-center h-[calc(100vh-65px)]">

                <h2 className="text-3xl md:text-4xl font-extrabold mb-8 tracking-tight text-foreground">Привет!<br />Где ты сейчас?</h2>

                <div className="w-full max-w-sm space-y-3 mb-8">
                  {/* Геопозиция кнопка */}
                  {locState !== 'error' && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      onClick={handleAutoLocation}
                      disabled={locState === 'loading' || locState === 'success'}
                      className={`w-full text-white rounded-2xl px-6 py-4 flex items-center justify-center gap-3 transition-all font-semibold shadow-sm ${
                        locState === 'success' ? 'bg-green-600' : 'bg-terracotta-deep hover:bg-terracotta-deep/90 shadow-terracotta-deep/20 shadow-lg'
                      }`}
                    >
                      {locState === 'idle' && (
                        <>
                          <MapPin className="w-5 h-5" />
                          Определить автоматически
                        </>
                      )}
                      {locState === 'loading' && (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Определяем...
                        </>
                      )}
                      {locState === 'success' && (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          {city}
                        </>
                      )}
                    </motion.button>
                  )}

                  {/* Сообщение об ошибке геолокации */}
                  {locState === 'error' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-muted-foreground bg-amber-50 border border-amber-200/60 rounded-2xl px-4 py-3"
                    >
                      Не удалось определить геолокацию — введи город вручную 👇
                    </motion.p>
                  )}

                  {/* Ручной ввод */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                  >
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Страна / город, например: Вьетнам, Дананг"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="w-full bg-white border border-border rounded-2xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-terracotta-deep/50 focus:ring-2 focus:ring-terracotta-deep/5 transition-all shadow-sm"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
                    />
                  </motion.div>

                  {/* Кнопка подтверждения ручного ввода */}
                  <AnimatePresence>
                    {manualInput.trim().length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        onClick={handleManualSubmit}
                        className="w-full bg-white border-2 border-terracotta-deep/60 text-terracotta-deep rounded-2xl px-6 py-3.5 font-semibold hover:bg-terracotta-deep/5 transition-all"
                      >
                        Я в {manualInput.trim()} →
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Ссылка "Еще не уехал" */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => { setUserPath('planning'); onNext(); }}
                  className="text-muted-foreground hover:text-terracotta-deep font-medium transition-colors mt-4 underline underline-offset-4 decoration-border hover:decoration-terracotta-deep/30"
                >
                  Я еще не уехал
                </motion.button>

              </div>
            )}

            {/* ── Step 1: Aptechka (survival kit) ── */}
            {step === 1 && (
              <div className="px-5 py-10 max-w-2xl mx-auto">
                <div className="text-center mb-10">
                  {userPath !== 'here' && (
                    <p className="text-sm text-warm-olive font-medium mb-3">Отличный выбор! 🌿 Вот что важно узнать заранее</p>
                  )}
                  <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                    {userPath === 'here'
                      ? <>Добро пожаловать{country ? <> в {country}!</> : '!'}</>
                      : 'Готовимся к переезду!'}
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    {userPath === 'here' ? 'Вот что нужно прямо сейчас:' : 'Вот что стоит знать до прилёта:'}
                  </p>
                </div>

                <div className="space-y-4 mb-10">
                  {(userPath === 'here' ? SURVIVAL_CARDS_HERE : SURVIVAL_CARDS_PLANNING).map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`bg-white rounded-[20px] border ${card.border} overflow-hidden shadow-sm`}
                    >
                      <button
                        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                        onClick={() => setOpenCard(openCard === i ? null : i)}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                            {card.emoji}
                          </span>
                          <div>
                            <div className="font-bold text-base">{card.title}</div>
                            <div className="text-sm text-muted-foreground">{card.short}</div>
                          </div>
                        </div>
                        {openCard === i ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                      <AnimatePresence>
                        {openCard === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-2 space-y-5 border-t border-border/40 mt-1">

                              {/* Основной текст */}
                              <p className="text-foreground/90 leading-relaxed text-sm">{card.detail}</p>

                              {/* Блок предупреждения */}
                              {card.warning && (
                                <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 flex gap-3 text-sm text-amber-900/80">
                                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <p>{card.warning}</p>
                                </div>
                              )}

                              {/* Приложения */}
                              {card.apps && (
                                <div className="space-y-3">
                                  <p className="font-bold text-sm">
                                    {card.title === 'Связь и интернет' ? 'Выберите оператора:' : 'Скачайте приложения:'}
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {card.apps.map((app, appIdx) => (
                                      <div key={appIdx} onClick={() => toggleComplete(app.name)} className="flex items-center justify-between p-3 rounded-2xl border border-border/60 hover:bg-muted/50 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                          <div className={`w-10 h-10 ${app.color} rounded-[12px] flex items-center justify-center font-bold text-lg ${app.textDark ? 'text-black/80' : 'text-white'}`}>
                                            {app.icon}
                                          </div>
                                          <div>
                                            <div className="font-semibold text-sm">{app.name}</div>
                                            <div className="text-xs text-muted-foreground">{app.desc}</div>
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5 items-end ml-1">
                                          {app.link?.web && (
                                            <a href={app.link.web} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs font-medium text-terracotta-deep flex items-center gap-1 hover:underline">
                                              Перейти <Navigation className="w-3 h-3" />
                                            </a>
                                          )}
                                          {!app.link?.web && (app.link?.ios || app.link?.android) && (
                                            <div className="flex flex-col gap-1 items-end">
                                              {app.link.ios && (
                                                <a href={app.link.ios} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="max-w-[75px] text-right leading-tight text-[11px] font-medium text-terracotta-deep flex items-center gap-1 hover:underline">
                                                  App Store <Download className="w-3 h-3 flex-shrink-0" />
                                                </a>
                                              )}
                                              {app.link.android && (
                                                <a href={app.link.android} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="max-w-[85px] text-right leading-tight text-[11px] font-medium text-terracotta-deep flex items-center gap-1 hover:underline">
                                                  Google Play <Download className="w-3 h-3 flex-shrink-0" />
                                                </a>
                                              )}
                                            </div>
                                          )}
                                          {!app.link && (
                                            <span className="text-xs font-medium text-terracotta-deep flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              Скачать <Download className="w-3 h-3" />
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Кнопка "Понятно" */}
                              <div className="pt-2">
                                <Button className="w-full rounded-2xl bg-muted/50 text-foreground hover:bg-terracotta-deep hover:text-white transition-colors" onClick={() => { toggleComplete(`card-${i}`); setOpenCard(null); }}>
                                  <CheckCircle className="w-4 h-4 mr-2 opacity-70" /> Понятно
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                <Button
                  size="lg"
                  onClick={onNext}
                  className="w-full bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full h-14 font-semibold shadow-md text-base"
                >
                  С первым шагом разобрались! →
                </Button>
              </div>
            )}

            {/* ── Step 2: Situation tags ── */}
            {step === 2 && (
              <div className="flex flex-col items-center px-5 py-10 max-w-xl mx-auto">
                <div className="text-center mb-10">
                  <p className="text-sm text-warm-olive font-medium mb-3">Почти готово! 🌿</p>
                  <h2 className="text-3xl font-extrabold tracking-tight mb-3">Расскажи немного о себе</h2>
                  <p className="text-muted-foreground text-lg">
                    Чтобы показать актуальное именно для тебя. Можно выбрать несколько.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 justify-center mb-10">
                  {SITUATION_TAGS.map((tag, i) => {
                    const selected = selectedTags.includes(tag.value);
                    return (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => toggleTag(tag.value)}
                        className={`px-5 py-3 rounded-full text-sm font-medium border-2 transition-all ${selected
                            ? 'bg-terracotta-deep text-white border-terracotta-deep shadow-sm'
                            : 'bg-white text-foreground border-border hover:border-terracotta-deep/50'
                          }`}
                      >
                        {tag.label}
                      </motion.button>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ── Step 2: Auth CTA (was Step 3) ── */}
            {step === 2 && (
              <div className="px-5 py-10 max-w-xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-dusty-indigo/90 to-terracotta-deep rounded-[28px] p-8 text-white text-center shadow-xl"
                >
                  <div className="text-4xl mb-4">🌿</div>
                  <h3 className="text-2xl font-extrabold mb-3 leading-tight">
                    Сохрани свой путь
                  </h3>
                  <p className="opacity-85 mb-2 leading-relaxed">
                    Без аккаунта прогресс, контакты и настройки не сохранятся — они исчезнут, когда ты закроешь страницу.
                  </p>
                  <p className="text-sm opacity-70 mb-7">
                    Регистрация займет всего пару секунд
                  </p>
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      onClick={onFinish}
                      className="w-full bg-white text-terracotta-deep hover:bg-white/90 rounded-full h-14 font-bold text-base shadow-lg"
                    >
                      Создать профиль и сохранить →
                    </Button>
                    <button
                      onClick={onSkipAuth}
                      className="w-full text-center text-sm opacity-70 hover:opacity-100 py-2 transition-opacity"
                    >
                      Продолжить без сохранения
                    </button>
                  </div>
                </motion.div>
              </div>
            )}




          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}