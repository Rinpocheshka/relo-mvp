import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { X, ArrowRight, MapPin, ChevronDown, ChevronUp, CheckCircle2, Search } from 'lucide-react';
import { AuthModal } from './AuthWidget';
import { AlertCircle, Download, CheckCircle, Navigation } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowStage = 'landing' | 'onboarding';
type OnboardingStep = number;
type UserPath = 'planning' | 'leaving_soon' | 'just_arrived' | 'living' | 'helper' | null;

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
    short: 'Штамп по прилёту или E-visa',
    detail: <>Граждане России могут въехать во Вьетнам бесплатно по штампу на 45 дней. Если планируете остаться дольше — можно оформить электронную визу (E-visa) на 90 дней онлайн. Сделать её можно самостоятельно на официальном сайте: <a href="https://evisa.gov.vn/" target="_blank" rel="noopener noreferrer" className="underline hover:text-dusty-indigo">evisa.gov.vn</a></>,
    color: 'bg-dusty-indigo/10 text-dusty-indigo',
    border: 'border-dusty-indigo/20',
  },
  {
    emoji: '🏠',
    title: 'Где искать жилье?',
    short: 'Отели на первое время и жилье на долгий срок',
    detail: <>Постоянное жилье можно найти у нас на сайте, в тематических группах Facebook или на местном аналоге Авито <a href="https://www.nhatot.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-warm-olive">www.nhatot.com</a>.<br/><br/>А на первое время можно забронировать отель или апартаменты на любом из популярных сайтов.</>,
    apps: [
      { name: 'Booking', desc: 'Популярный сервис бронирования', color: 'bg-[#003580]', icon: 'B', link: { web: 'https://www.booking.com/' } },
      { name: 'Agoda', desc: 'Много вариантов в Азии', color: 'bg-[#0E5196]', icon: 'A', link: { web: 'https://www.agoda.com/' } },
      { name: 'Trip.com', desc: 'Можно оплатить картами РФ', color: 'bg-[#3264FF]', icon: 'T', link: { web: 'https://ru.trip.com/' } },
      { name: 'Airbnb', desc: 'Аренда жилья у местных', color: 'bg-[#FF5A5F]', icon: 'ab', link: { web: 'https://www.airbnb.com/' } },
    ],
    warning: 'Никогда не подписывайте долгосрочный контракт удаленно. Всегда проверяйте квартиру на плесень и шум лично.',
    color: 'bg-warm-olive/10 text-warm-olive',
    border: 'border-warm-olive/20',
  },
  {
    emoji: '✈️',
    title: 'Как добраться',
    short: 'Поиск авиабилетов и маршрутов',
    detail: 'Спланировать сложный маршрут и найти самые дешевые билеты помогут эти сервисы.',
    apps: [
      { name: 'Aviasales', desc: 'Ищет варианты из России', color: 'bg-[#1CAFE4]', icon: 'AS', link: { web: 'https://aviasales.tpo.lu/OaVNZVw2' } },
      { name: 'Trip.com', desc: 'Можно оплатить картами РФ', color: 'bg-[#3264FF]', icon: 'T', link: { web: 'https://ru.trip.com/' } },
      { name: 'Skyscanner', desc: 'Ищет дешевые билеты', color: 'bg-[#00A2EE]', icon: 'S', link: { web: 'https://www.skyscanner.net/' } },
      { name: '12 Go', desc: 'Поезда, автобусы, паромы', color: 'bg-[#37b75f]', icon: '12', link: { web: 'https://12go.tpo.lu/Rg6rUhYY' } },
    ],
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
  { value: 'musician', label: '🎸 Музыкант' },
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
  const [userPath, setUserPath] = useState<UserPath>(null);
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

  const saveAndFinish = (cityToSave: string) => {
    localStorage.setItem('reloOnboarding', JSON.stringify({
      city: cityToSave,
      stage: userPath,
      need: selectedTags,
      savePath: false,
    }));
    localStorage.setItem('reloStage', userPath || 'planning');
  };

  const goToNextStep = () => {
    setOnboardingStep(prev => prev + 1);
  };

  const goToPrevStep = () => {
    setOnboardingStep(prev => Math.max(0, prev - 1));
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
          onFinish={(c) => {
            saveAndFinish(c);
            setIsAuthOpen(true);
          }}
          onSkipAuth={(c) => {
            saveAndFinish(c);
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
      <section className="px-4 pt-12 pb-6 md:pt-20 md:pb-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.15] tracking-tight mb-4 md:mb-6">
              В любой точке мира -{' '}
              <span className="text-terracotta-deep">как дома</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Relo.me — система для удобной жизни релокантов<br />
              Удобно когда жильё, события, вещи и поддержка в одном месте.
            </p>
          </motion.div>
        </div>
      </section>


      {/* Live stats */}
      <section className="px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-[32px] border border-border/40 shadow-sm px-6 py-8 md:px-8 md:py-6 grid grid-cols-2 md:flex md:flex-wrap gap-8 md:gap-6 items-center justify-around">
            {[
              { num: '140+', label: 'участников', color: 'text-terracotta-deep' },
              { num: '15', label: 'Ищут жильё', color: 'text-dusty-indigo' },
              { num: '8', label: 'предлагают помощь', color: 'text-warm-olive' },
              { num: '30+', label: 'объявлений за месяц', color: 'text-terracotta-deep' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold mb-1 whitespace-nowrap">
                   <span className={s.color}>{s.num}</span>
                </div>
                <p className="text-[12px] md:text-sm text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOOK */}
      <section className="px-4 py-10 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight">Жизнь релоканта<br className="md:hidden" /> часто выглядит так</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {[
              { emoji: '😮‍💨', text: 'Открываешь десятки чатов — и не понимаешь, кому можно доверять' },
              { emoji: '⏳', text: 'Тратишь часы на поиски простых вещей: жильё, обменники, школы' },
              { emoji: '🤷', text: 'Не знаешь, с чего начать и что делать дальше' },
            ].map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white p-6 md:p-8 rounded-[24px] border border-border/40 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-3xl md:text-4xl mb-3 md:mb-4 block">{p.emoji}</span>
                <p className="text-base md:text-lg text-foreground/90 leading-relaxed">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features block */}
      <section className="px-4 py-10 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2 md:mb-3 leading-tight">Мы собрали всё в одном месте</h2>
            <p className="text-lg md:text-xl text-muted-foreground">чтобы пройти этот путь проще</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {[
              {
                icon: '🗂️',
                title: 'Актуальные объявления и события',
                desc: 'Можно выбрать по категориям, фильтрам и всё — актуальное',
                accent: 'bg-terracotta-deep/5 border-terracotta-deep/10',
              },
              {
                icon: '🤝',
                title: 'Люди, которым можно доверять',
                desc: 'Ты видишь путь, который уже прошёл человек, а не только его ник',
                accent: 'bg-dusty-indigo/5 border-dusty-indigo/10',
              },
              {
                icon: '💬',
                title: 'Все ответы в одном месте',
                desc: 'Кто прошёл путь — делится опытом, помогает другим',
                accent: 'bg-warm-olive/5 border-warm-olive/10',
              },
              {
                icon: '🗺️',
                title: 'Понятно куда дальше',
                desc: 'Внутри уже есть шаги на каждый этап релокации',
                accent: 'bg-rose-50/50 border-rose-100/50',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-[28px] border p-5 md:p-7 flex gap-4 md:gap-5 items-start ${f.accent}`}
              >
                <div className="text-3xl md:text-4xl flex-shrink-0 mt-0.5">{f.icon}</div>
                <div>
                  <div className="font-bold text-base md:text-lg mb-1">{f.title}</div>
                  <p className="text-[14px] md:text-base text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-10 md:py-16 mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-dusty-indigo/90 to-terracotta-deep rounded-[32px] md:rounded-[40px] p-8 md:p-16 text-white text-center shadow-xl relative overflow-hidden">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="relative z-10"
            >
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8 md:mb-10 leading-tight">
                Узнаешь себя?<br />Начни — и получи помощь<br />прямо сейчас
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" onClick={startOnboarding} className="bg-white text-terracotta-deep hover:bg-white/90 rounded-full h-14 md:h-14 px-8 md:px-10 text-base font-bold shadow-lg w-full sm:w-auto transition-transform active:scale-95">
                  Начать свой путь →
                </Button>
                <Button size="lg" variant="outline" onClick={skipToHome} className="border-white/40 text-white !text-white bg-transparent hover:bg-white/10 rounded-full h-14 md:h-14 px-8 md:px-10 text-base font-medium w-full sm:w-auto">
                  Просто посмотреть
                </Button>
              </div>
            </motion.div>
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="font-bold text-terracotta-deep text-base">Relo.me</div>
          <p>© 2026 · Relo.me — система для удобной жизни релокантов</p>
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

// ─── Stage-Based Onboarding Flow ─────────────────────────────────────────────

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
  onFinish: (c: string) => void;
  onSkipAuth: (c: string) => void;
}) {
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');

  const isVietnam = city.toLowerCase().includes('вьетнам');
  const showArrivalKit = ['leaving_soon', 'just_arrived', 'living'].includes(userPath || '') && isVietnam;
  const showPlanningKit = userPath === 'planning' && isVietnam;
  const shouldSkipSurvival = !showArrivalKit && !showPlanningKit;

  // Handle conditional step skipping for Step 2
  useEffect(() => {
    if (step === 2 && shouldSkipSurvival) {
      onNext();
    }
  }, [step, shouldSkipSurvival, onNext]);

  const handleManualSubmit = () => {
    const val = manualInput.trim();
    if (!val) return;
    setCity(val);
    const parts = val.split(',');
    setCountry(parts.length > 1 ? parts[parts.length - 1].trim() : val);
    onNext();
  };

  const toggleComplete = (item: string) => {
    const next = new Set(completedItems);
    if (next.has(item)) next.delete(item); else next.add(item);
    setCompletedItems(next);
  };

  const STAGES: { value: UserPath; label: string; icon: string }[] = [
    { value: 'planning', label: 'планирую переезд', icon: '🗓️' },
    { value: 'leaving_soon', label: 'скоро выезжаю', icon: '✈️' },
    { value: 'just_arrived', label: 'только приехал', icon: '🛬' },
    { value: 'living', label: 'уже живу', icon: '🏠' },
    { value: 'helper', label: 'помогаю другим', icon: '🤝' },
  ];

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
            Шаг {step + 1} из 4
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

            {/* ── Step 0: Stage Selection ── */}
            {step === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-5 py-8 sm:py-12 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-8 min-h-[3.5rem] tracking-tight text-foreground">Привет!<br />Где ты на этом пути?</h2>

                <div className="w-full max-w-sm space-y-3">
                  {STAGES.map((s, i) => (
                    <motion.button
                      key={s.value}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { setUserPath(s.value); onNext(); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${userPath === s.value ? 'bg-terracotta-deep text-white border-terracotta-deep shadow-md' : 'bg-white border-border hover:border-terracotta-deep/40 hover:bg-terracotta-deep/5'}`}
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <span className="font-bold">{s.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 1: Location selection ── */}
            {step === 1 && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-5 py-8 sm:py-12 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-8 tracking-tight text-foreground">Место уже известно?</h2>

                <div className="w-full max-w-sm space-y-3 mb-8">
                  {/* Ручной выбор */}
                  <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                    <select
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="w-full bg-white border border-border rounded-2xl pl-12 pr-10 py-4 text-foreground focus:outline-none focus:border-terracotta-deep/50 focus:ring-2 focus:ring-terracotta-deep/5 transition-all shadow-sm appearance-none cursor-pointer relative z-0"
                    >
                      <option value="" disabled>Выберите город из списка...</option>
                      <optgroup label="Вьетнам">
                        <option value="Вьетнам">Вьетнам (вся страна)</option>
                        <option value="Дананг, Вьетнам">Дананг</option>
                        <option value="Нячанг, Вьетнам">Нячанг</option>
                        <option value="Муйне, Вьетнам">Муйне</option>
                        <option value="Хошимин, Вьетнам">Хошимин</option>
                        <option value="Ханой, Вьетнам">Ханой</option>
                      </optgroup>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground z-10">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>

                  {manualInput.trim().length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleManualSubmit}
                      className="w-full bg-white border-2 border-terracotta-deep/60 text-terracotta-deep rounded-2xl px-6 py-3.5 font-semibold hover:bg-terracotta-deep/5 transition-all"
                    >
                      Я в {manualInput.split(',')[0]} →
                    </motion.button>
                  )}
                </div>

                {/* Ссылка "Пока думаю" */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => { setCity(''); setCountry(''); onNext(); }}
                  className="text-muted-foreground hover:text-terracotta-deep font-medium transition-colors mt-4 underline underline-offset-4 decoration-border hover:decoration-terracotta-deep/30"
                >
                  Пока думаю
                </motion.button>
              </div>
            )}

            {/* ── Step 2: Survival kit (Conditional) ── */}
            {step === 2 && !shouldSkipSurvival && (
              <div className="px-4 sm:px-5 py-6 sm:py-10 max-w-2xl mx-auto">
                <div className="text-center mb-8 sm:mb-10">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                    {showArrivalKit
                      ? <>Добро пожаловать{country ? <> {country === 'Вьетнам' ? 'во' : 'в'} {country}!</> : '!'}</>
                      : 'Подготовка к переезду'}
                  </h2>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    {showArrivalKit ? 'Вот что нужно прямо сейчас:' : 'Вот что стоит знать до прилёта:'}
                  </p>
                </div>

                <div className="space-y-4 mb-10">
                  {(showArrivalKit ? SURVIVAL_CARDS_HERE : SURVIVAL_CARDS_PLANNING).map((card, i) => (
                    <div key={i} className={`bg-white rounded-[20px] border ${card.border} overflow-hidden shadow-sm`}>
                      <button className="w-full text-left px-6 py-5 flex items-center justify-between gap-4" onClick={() => setOpenCard(openCard === i ? null : i)}>
                        <div className="flex items-center gap-4">
                          <span className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center text-2xl flex-shrink-0`}>{card.emoji}</span>
                          <div>
                            <div className="font-bold text-base">{card.title}</div>
                            <div className="text-sm text-muted-foreground">{card.short}</div>
                          </div>
                        </div>
                        {openCard === i ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                      </button>
                      <AnimatePresence>
                        {openCard === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-6 pb-6 pt-2 space-y-5 border-t border-border/40 mt-1">
                              <p className="text-foreground/90 leading-relaxed text-sm">{card.detail}</p>
                              {card.warning && (
                                <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 flex gap-3 text-sm text-amber-900/80">
                                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <p>{card.warning}</p>
                                </div>
                              )}
                              {card.apps && (
                                <div className="space-y-3">
                                  <p className="font-bold text-sm">Скачайте приложения:</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {card.apps.map((app, appIdx) => (
                                      <div key={appIdx} onClick={() => toggleComplete(app.name)} className="flex items-center justify-between p-3 rounded-2xl border border-border/60 hover:bg-muted/50 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                          <div className={`w-10 h-10 ${app.color} rounded-[12px] flex items-center justify-center font-bold text-lg ${app.textDark ? 'text-black/80' : 'text-white'}`}>{app.icon}</div>
                                          <div>
                                            <div className="font-semibold text-sm">{app.name}</div>
                                            <div className="text-xs text-muted-foreground">{app.desc}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="pt-2">
                                <Button className="w-full rounded-2xl bg-muted/50 text-foreground hover:bg-terracotta-deep hover:text-white transition-colors" onClick={() => { toggleComplete(`card-${i}`); setOpenCard(null); }}>
                                  <CheckCircle className="w-4 h-4 mr-2" /> Понятно
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
                <Button size="lg" onClick={onNext} className="w-full bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full h-14 font-semibold shadow-md text-base">
                  С первым шагом разобрались! →
                </Button>
              </div>
            )}

            {/* ── Step 3: Situation Tags & Auth ── */}
            {step === 3 && (
              <div className="flex flex-col items-center px-4 sm:px-5 py-6 sm:py-10 max-w-xl mx-auto w-full">
                <div className="text-center mb-6 sm:mb-8">
                  <p className="text-xs sm:text-sm text-warm-olive font-medium mb-1.5 sm:mb-3">Почти готово! 🌿</p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 sm:mb-3">Расскажи немного о себе</h2>
                  <p className="text-muted-foreground text-base sm:text-lg">Чтобы показать актуальное именно для тебя. Можно выбрать несколько.</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-8 sm:mb-10">
                  {SITUATION_TAGS.map((tag, i) => {
                    const selected = selectedTags.includes(tag.value);
                    return (
                      <motion.button key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => toggleTag(tag.value)} className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium border-2 transition-all ${selected ? 'bg-terracotta-deep text-white border-terracotta-deep shadow-sm' : 'bg-white text-foreground border-border hover:border-terracotta-deep/50'}`}>
                        {tag.label}
                      </motion.button>
                    );
                  })}
                </div>
                {/* Сохрани свой путь - moved higher as requested */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-dusty-indigo/90 to-terracotta-deep rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 text-white text-center shadow-xl w-full">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🌿</div>
                  <h3 className="text-xl sm:text-2xl font-extrabold mb-2 sm:mb-3 leading-tight">Сохрани свой путь</h3>
                  <p className="text-sm sm:text-base opacity-85 mb-2 leading-relaxed">Без аккаунта прогресс, контакты и настройки не сохранятся.</p>
                  <div className="space-y-2.5 sm:space-y-3">
                    <Button size="lg" onClick={() => onFinish(city)} className="w-full bg-white text-terracotta-deep hover:bg-white/90 rounded-full h-12 sm:h-14 font-bold text-sm sm:text-base shadow-lg">Создать профиль и сохранить →</Button>
                    <button onClick={() => onSkipAuth(city)} className="w-full text-center text-[10px] sm:text-sm opacity-70 hover:opacity-100 py-1.5 transition-opacity">Продолжить без сохранения</button>
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