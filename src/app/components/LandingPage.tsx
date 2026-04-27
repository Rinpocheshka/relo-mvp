import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { X, ArrowRight, MapPin, ChevronDown, ChevronUp, CheckCircle2, Search, Zap } from 'lucide-react';
import { AuthModal } from './AuthWidget';
import { AlertCircle, Download, CheckCircle, Navigation, Info } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowStage = 'landing' | 'onboarding';
type OnboardingStep = number;
type UserPath = 'planning' | 'just_arrived' | 'settling' | 'sharing' | 'moving_on' | null;

interface AppInfo {
  name: string;
  desc: string;
  color: string;
  icon: string | React.ReactNode;
  textDark?: boolean;
  link?: { ios?: string; android?: string; web?: string };
}

interface SurvivalCard {
  emoji: string | React.ReactNode;
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
    emoji: <img src="/assets/icons/custom/bus.png" alt="" className="w-8 h-8 object-contain" />,
    title: 'Как добраться',
    short: 'Такси, автобусы, поезда',
    detail: 'Стойка официального такси находится у выхода из таможни, но дешевле вызвать машину через приложение.',
    warning: 'Осторожно: фейковые таксисты. В зоне прилета к вам будут подходить люди и предлагать такси. Игнорируйте их, они завышают цены в 3-5 раз.',
    apps: [
      { name: 'Grab', desc: 'Самое популярное такси', color: 'bg-[#00B14F]', icon: 'G', link: { ios: 'https://apps.apple.com/app/grab/id647268330', android: 'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger', web: 'https://www.grab.com/vn/en/' } },
      { name: 'Xanh SM', desc: 'Электромобили (рекомендуем)', color: 'bg-[#00B4D8]', icon: 'X', link: { web: 'https://www.xanhsm.com/' } },
      { name: 'Vexere', desc: 'Междугородные автобусы', color: 'bg-[#E85D04]', icon: 'V', link: { web: 'https://vexere.com/en-US/referral?rid=KRIUCHKOV001' } },
      { name: 'ЖД', desc: 'Билеты на поезда', color: 'bg-[#003580]', icon: '🚆', link: { web: 'https://dsvn.vn/#/' } },
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
    ],
    color: 'bg-dusty-indigo/10 text-dusty-indigo',
    border: 'border-dusty-indigo/20',
  },
  {
    emoji: <img src="/assets/icons/custom/category_finance.png" alt="" className="w-8 h-8 object-contain" />,
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
    emoji: <img src="/assets/icons/custom/passport.png" alt="" className="w-8 h-8 object-contain" />,
    title: 'Какую визу делать?',
    short: 'Штамп по прилёту или E-visa',
    detail: <>Граждане России могут въехать во Вьетнам бесплатно по штампу на 45 дней. Если планируете остаться дольше — можно оформить электронную визу (E-visa) на 90 дней онлайн. Сделать её можно самостоятельно на официальном сайте: <a href="https://evisa.gov.vn/" target="_blank" rel="noopener noreferrer" className="underline hover:text-dusty-indigo">evisa.gov.vn</a></>,
    color: 'bg-dusty-indigo/10 text-dusty-indigo',
    border: 'border-dusty-indigo/20',
  },
  {
    emoji: <img src="/assets/icons/custom/people_moving.png" alt="" className="w-8 h-8 object-contain" />,
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
  {
    emoji: <img src="/assets/icons/custom/category_housing.png" alt="" className="w-8 h-8 object-contain" />,
    title: 'Где искать жилье?',
    short: 'Отели и аренда на долгий срок',
    detail: <>Постоянное жилье можно найти у нас на сайте или на местном аналоге Авито <a href="https://www.nhatot.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-warm-olive">www.nhatot.com</a>.<br/><br/>А на первое время можно забронировать отель или апартаменты на любом из популярных сайтов.</>,
    apps: [
      { name: 'Booking', desc: 'Популярный сервис бронирования', color: 'bg-[#003580]', icon: 'B', link: { web: 'https://www.booking.com/' } },
      { name: 'Agoda', desc: 'Много вариантов в Азии', color: 'bg-[#0E5196]', icon: 'A', link: { web: 'https://www.agoda.com/' } },
      { name: 'Airbnb', desc: 'Аренда жилья у местных', color: 'bg-[#FF5A5F]', icon: 'ab', link: { web: 'https://www.airbnb.com/' } },
    ],
    warning: 'Никогда не подписывайте контракт удаленно — всегда проверяйте квартиру лично на шум и плесень.',
    color: 'bg-warm-olive/10 text-warm-olive',
    border: 'border-warm-olive/20',
  },
];

const SURVIVAL_CARDS_SHOPPING: SurvivalCard[] = [
  {
    emoji: <img src="/assets/icons/custom/luggage.png" alt="" className="w-8 h-8 object-contain" />,
    title: 'Шоппинг и маркетплейсы',
    short: 'Shopee и Lazada — всё с доставкой на дом',
    detail: 'Во Вьетнаме почти всё покупают онлайн. На Shopee и Lazada можно найти практически любой товар: от продуктов до техники.',
    warning: 'Оплатить картой РФ не получится. Выбирайте оплату наличными при получении (Cash on Delivery).',
    apps: [
      { name: 'Shopee', desc: 'Самый массовый маркетплейс', color: 'bg-[#EE4D2D]', icon: 'S', link: { web: 'https://shopee.vn/' } },
      { name: 'Lazada', desc: 'Популярный аналог Shopee', color: 'bg-[#00008B]', icon: 'L', link: { web: 'https://www.lazada.vn/' } },
    ],
    color: 'bg-warm-olive/10 text-warm-olive',
    border: 'border-warm-olive/20',
  },
];

const SURVIVAL_CARDS_WHY_RELO: SurvivalCard[] = [
  {
    emoji: <img src="/assets/icons/custom/signpost.png" alt="" className="w-8 h-8 object-contain" />,
    title: 'Зачем мне этот сайт?',
    short: 'Relo — твой помощник в мобильности',
    detail: 'С Relo удобно: пересдать квартиру, продать лишние вещи, запланировать переезд в новое место. Мы помогаем сделать каждое перемещение проще.',
    color: 'bg-terracotta-deep/10 text-terracotta-deep',
    border: 'border-terracotta-deep/20',
  }
];

const SITUATION_TAGS = [
  { value: 'solo', label: 'я один' },
  { value: 'partner', label: 'с партнером' },
  { value: 'kids', label: 'с детьми' },
  { value: 'pet', label: 'с питомцем' },
  { value: 'lgbt', label: 'LGBT' },
  { value: 'volunteer', label: 'волонтер' },
  { value: 'remote', label: 'удаленщик' },
  { value: 'maternity', label: 'мама в декрете' },
  { value: 'it_specialist', label: 'IT специалист' },
  { value: 'master_classes', label: 'веду мастер-классы' },
  { value: 'looking_job', label: 'ищу работу' },
  { value: 'looking_friends', label: 'ищу друзей' },
  { value: 'local_business', label: 'строю местный бизнес' },
];

const INTERESTS_TAGS = [
  { value: 'english', label: 'учу английский' },
  { value: 'philosopher', label: 'философ' },
  { value: 'artist', label: 'художник' },
  { value: 'sport', label: 'спорт' },
  { value: 'yoga', label: 'йога' },
  { value: 'surfing', label: 'серфинг' },
  { value: 'motorcycles', label: 'мотоциклы' },
  { value: 'biking', label: 'велопрогулки' },
  { value: 'psychology', label: 'психология' },
  { value: 'wine', label: 'люблю вино' },
  { value: 'photographer', label: 'фотограф' },
  { value: 'health', label: 'ЗОЖ' },
  { value: 'clubbing', label: 'хожу в клубы' },
  { value: 'no_alcohol', label: 'Non Alcohol' },
  { value: 'musician', label: 'музыкант' },
  { value: 'karaoke', label: 'караоке' },
  { value: 'handicrafts', label: 'рукоделие' },
  { value: 'kids_activities', label: 'занятия с детьми' },
  { value: 'reading', label: 'чтение книг' },
  { value: 'esoterics', label: 'эзотерика' },
  { value: 'dancing', label: 'люблю танцевать' },
  { value: 'actor', label: 'актер' },
  { value: 'standup', label: 'стендап' },
  { value: 'vietnamese', label: 'учу вьетнамский' },
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
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [openCard, setOpenCard] = useState<number | null>(null);
  const [openRoadmap, setOpenRoadmap] = useState<number>(0);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [progress] = useState(10);
  const [stats, setStats] = useState({
    newUsers: 0,
    newAnnouncements: 0,
    newEvents: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const [uRes, aRes, eRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
          supabase.from('announcements').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
          supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo)
        ]);

        setStats({
          newUsers: uRes.count || 0,
          newAnnouncements: aRes.count || 0,
          newEvents: eRes.count || 0,
        });
      } catch (e) {
        console.error('Error fetching stats:', e);
      }
    }
    void fetchStats();
  }, []);

  const statsItems = useMemo(() => [
    { num: stats.newUsers.toString(), label: 'Новых пользователей', color: 'text-terracotta-deep' },
    { num: stats.newAnnouncements.toString(), label: 'Новых объявлений', color: 'text-dusty-indigo' },
    { num: stats.newEvents.toString(), label: 'Новых событий', color: 'text-warm-olive' },
  ], [stats]);

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

  const toggleInterest = (val: string) => {
    setSelectedInterests(prev =>
      prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]
    );
  };

  const saveAndFinish = (cityToSave: string) => {
    localStorage.setItem('reloOnboarding', JSON.stringify({
      city: cityToSave,
      stage: userPath,
      situation: selectedTags,
      interests: selectedInterests,
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
          selectedInterests={selectedInterests}
          toggleInterest={toggleInterest}
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
          <div className="flex items-center gap-2">
            <img src="/assets/logo/Relo_me.png" alt="Relo.me" className="h-7 w-auto object-contain" />
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
              Relo me — система для удобной жизни релокантов<br />
              Удобно когда жильё, события, вещи и поддержка в одном месте.
            </p>
          </motion.div>
        </div>
      </section>


      {/* Live stats */}
      <section className="px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-[32px] border border-border/40 shadow-sm px-6 py-8 md:px-8 md:py-6 grid grid-cols-2 md:flex md:flex-wrap gap-8 md:gap-6 items-center justify-around">
            {statsItems.map((s, i) => (
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
              { emoji: <img src="/assets/icons/custom/people_all.png" alt="" className="w-12 h-12 md:w-14 md:h-14 object-contain mb-3 md:mb-4" />, text: 'Открываешь десятки чатов — и не понимаешь, кому можно доверять' },
              { emoji: <img src="/assets/icons/custom/watch.png" alt="" className="w-10 h-10 md:w-12 md:h-12 object-contain mb-3 md:mb-4" />, text: 'Тратишь часы на поиски простых вещей: жильё, обменники, школы' },
              { emoji: <img src="/assets/icons/custom/events_business.png" alt="" className="w-12 h-12 md:w-14 md:h-14 object-contain mb-3 md:mb-4" />, text: 'Не знаешь, с чего начать и что делать дальше' },
            ].map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white p-6 md:p-8 rounded-[24px] border border-border/40 shadow-sm hover:shadow-md transition-shadow">
                {p.emoji}
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
                icon: <img src="/assets/icons/custom/afisha.png" alt="" className="w-10 h-10 md:w-12 md:h-12 object-contain" />,
                title: 'Актуальные объявления и события',
                desc: 'Можно выбрать по категориям, фильтрам и всё — актуальное',
                accent: 'bg-terracotta-deep/5 border-terracotta-deep/10',
              },
              {
                icon: <img src="/assets/icons/custom/people_tab.png" alt="" className="w-10 h-10 md:w-12 md:h-12 object-contain" />,
                title: 'Люди, которым можно доверять',
                desc: 'Ты видишь путь, который уже прошёл человек, а не только его ник',
                accent: 'bg-dusty-indigo/5 border-dusty-indigo/10',
              },
              {
                icon: <img src="/assets/icons/custom/signpost.png" alt="" className="w-10 h-10 md:w-12 md:h-12 object-contain" />,
                title: 'Все ответы в одном месте',
                desc: 'Кто прошёл путь — делится опытом, помогает другим',
                accent: 'bg-warm-olive/5 border-warm-olive/10',
              },
              {
                icon: <img src="/assets/icons/custom/people_sharing.png" alt="" className="w-10 h-10 md:w-12 md:h-12 object-contain" />,
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
                <div className="flex-shrink-0 mt-0.5">{f.icon}</div>
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
          <div className="font-bold text-terracotta-deep text-base">Relo me</div>
          <p>© 2026 · Relo me — система для удобной жизни релокантов</p>
          <div className="flex gap-3">
             {/* Icons here... */}
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
  selectedInterests,
  toggleInterest,
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
  selectedInterests: string[];
  toggleInterest: (v: string) => void;
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
  
  // Conditional kits logic
  const showPlanningKit = userPath === 'planning' && isVietnam;
  const showArrivalKit = userPath === 'just_arrived' && isVietnam;
  const showShoppingKit = (userPath === 'settling' || userPath === 'sharing') && isVietnam;
  const showMovingOnKit = userPath === 'moving_on';
  
  const shouldSkipSurvival = !showPlanningKit && !showArrivalKit && !showShoppingKit && !showMovingOnKit;

  // Handle conditional step skipping for Step 2
  useEffect(() => {
    if (step === 2 && shouldSkipSurvival) {
      onNext();
    }
  }, [step, shouldSkipSurvival, onNext]);

  const handleManualSubmit = () => {
    const val = manualInput.trim();
    if (val) {
      setCity(val);
      const parts = val.split(',');
      setCountry(parts.length > 1 ? parts[parts.length - 1].trim() : val);
    }
    onNext();
  };

  const toggleComplete = (item: string) => {
    const next = new Set(completedItems);
    if (next.has(item)) next.delete(item); else next.add(item);
    setCompletedItems(next);
  };

  const STAGES: { value: UserPath; label: string; icon: string }[] = [
    { value: 'planning', label: 'планирую переезд', icon: '/assets/icons/custom/people_planning.png' },
    { value: 'just_arrived', label: 'только приехал', icon: '/assets/icons/custom/category_bus.png' },
    { value: 'settling', label: 'осваиваюсь', icon: '/assets/icons/custom/people_settling.png' },
    { value: 'sharing', label: 'делюсь опытом', icon: '/assets/icons/custom/people_sharing.png' },
    { value: 'moving_on', label: 'переезжаю дальше', icon: '/assets/icons/custom/people_moving.png' },
  ];

  return (
    <div className="fixed inset-0 bg-warm-milk z-50 flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <button onClick={onBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Назад">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          ) : (
            <img src="/assets/logo/Relo_me.png" alt="Relo.me" className="h-6 w-auto object-contain" />
          )}
          <div className="h-4 w-[1px] bg-border/30 mx-1" />
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

                <div className="w-full max-w-sm mx-auto mb-8 space-y-3 px-4">
                  {STAGES.map((s, i) => (
                    <motion.button
                      key={s.value}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { setUserPath(s.value); onNext(); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${userPath === s.value ? 'bg-terracotta-deep text-white border-terracotta-deep shadow-md' : 'bg-white border-border hover:border-terracotta-deep/40 hover:bg-terracotta-deep/5'}`}
                    >
                      <span className="text-2xl flex-shrink-0">
                        {s.icon.startsWith('/') || s.icon.includes('.jpg') ? (
                          <img src={s.icon} alt="" className="w-8 h-8 object-contain rounded-lg bg-white/10" />
                        ) : (
                          s.icon
                        )}
                      </span>
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

                <div className="w-full max-w-sm space-y-4 mb-8">
                  {/* Выбор из списка */}
                  <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                    <select
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setManualInput(''); }}
                      className="w-full bg-white border border-border rounded-2xl pl-12 pr-10 py-4 text-foreground focus:outline-none focus:border-terracotta-deep/50 focus:ring-2 focus:ring-terracotta-deep/5 transition-all shadow-sm appearance-none cursor-pointer relative z-0"
                    >
                      <option value="" disabled selected={city === ''}>Выберите город из списка...</option>
                      <option value="Вьетнам">Весь Вьетнам</option>
                      <option value="Дананг, Вьетнам">Дананг</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground z-10">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <div className="h-px bg-border/40 flex-1" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">или введи свой</span>
                    <div className="h-px bg-border/40 flex-1" />
                  </div>

                  {/* Свой вариант */}
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                    <input
                      type="text"
                      maxLength={20}
                      value={manualInput}
                      placeholder="Город \ страна"
                      onChange={(e) => { setManualInput(e.target.value); if (e.target.value) setCity(''); }}
                      className="w-full bg-white border border-border rounded-2xl pl-12 pr-4 py-4 text-foreground focus:outline-none focus:border-terracotta-deep/50 transition-all shadow-sm"
                    />
                    {manualInput && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40">
                        {manualInput.length}/20
                      </div>
                    )}
                  </div>

                  {(city || manualInput.trim().length > 0) && (
                    <motion.button
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleManualSubmit}
                      className="w-full bg-terracotta-deep text-white rounded-2xl px-6 py-4 font-bold hover:bg-terracotta-deep/90 transition-all shadow-lg shadow-terracotta-deep/10"
                    >
                      Продолжить →
                    </motion.button>
                  )}
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => { setCity(''); setCountry(''); setManualInput(''); onNext(); }}
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
                    {showMovingOnKit ? 'Relo помогает в пути' : 'Твой путеводитель'}
                  </h2>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    {showPlanningKit && 'Вот что стоит знать до прилёта:'}
                    {showArrivalKit && 'Вот что нужно прямо сейчас:'}
                    {showShoppingKit && 'Твой шоппинг-гид:'}
                    {showMovingOnKit && 'Для тех, кто не стоит на месте:'}
                  </p>
                </div>

                <div className="space-y-4 mb-10">
                  {(
                    showPlanningKit ? SURVIVAL_CARDS_PLANNING :
                    showArrivalKit ? SURVIVAL_CARDS_HERE :
                    showShoppingKit ? SURVIVAL_CARDS_SHOPPING :
                    showMovingOnKit ? SURVIVAL_CARDS_WHY_RELO : []
                  ).map((card, i) => (
                    <div key={i} className={`bg-white rounded-[20px] border shadow-sm ${card.border} overflow-hidden`}>
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
                                      <div 
                                        key={appIdx} 
                                        onClick={() => {
                                          const url = app.link?.web || (typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent) ? app.link?.ios : app.link?.android);
                                          if (url) window.open(url, '_blank');
                                          toggleComplete(app.name);
                                        }} 
                                        className="flex items-center justify-between p-3 rounded-2xl border border-border/60 hover:bg-muted/50 transition-colors cursor-pointer"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-10 h-10 ${app.color} rounded-[12px] flex items-center justify-center font-black text-xs ${app.textDark ? 'text-black/80' : 'text-white'}`}>{app.icon}</div>
                                          <div>
                                            <div className="font-semibold text-[13px]">{app.name}</div>
                                            <div className="text-[11px] text-muted-foreground leading-tight">{app.desc}</div>
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
                <Button size="lg" onClick={onNext} className="w-full bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full h-14 font-bold shadow-md text-base">
                  Продолжить →
                </Button>
              </div>
            )}

            {/* ── Step 3: Situation & Interests ── */}
            {step === 3 && (
              <div className="flex flex-col items-center px-4 sm:px-5 py-6 sm:py-10 max-w-xl mx-auto w-full">
                <div className="text-center mb-8">
                   <h2 className="text-3xl font-extrabold tracking-tight mb-2">Расскажи о себе</h2>
                   <p className="text-muted-foreground">Твой профиль будет полезнее для других</p>
                </div>

                <div className="w-full space-y-10">
                  {/* Situation tags */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                       <Info className="w-4 h-4 text-warm-olive" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Кто ты?</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SITUATION_TAGS.map((tag, i) => {
                        const selected = selectedTags.includes(tag.value);
                        return (
                          <motion.button key={tag.value} onClick={() => toggleTag(tag.value)} className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${selected ? 'bg-warm-olive text-white border-warm-olive' : 'bg-white text-foreground border-border/60 hover:border-warm-olive/40'}`}>
                            {tag.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interests tags */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-terracotta-deep" />
                          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Интересы</h3>
                       </div>
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selectedInterests.length >= 3 ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'}`}>
                         {selectedInterests.length < 3 ? `выбери ещё ${3 - selectedInterests.length}` : 'Готово!'}
                       </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS_TAGS.map((tag, i) => {
                        const selected = selectedInterests.includes(tag.value);
                        return (
                          <motion.button key={tag.value} onClick={() => toggleInterest(tag.value)} className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${selected ? 'bg-terracotta-deep text-white border-terracotta-deep' : 'bg-white text-foreground border-border/60 hover:border-terracotta-deep/40'}`}>
                            {tag.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="h-10" />

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 border border-border/40 shadow-xl w-full text-center">
                  <div className="w-16 h-16 bg-soft-sand rounded-[24px] flex items-center justify-center mx-auto mb-6 text-3xl">🌿</div>
                  <h3 className="text-2xl font-black mb-3">Сохрани свой путь</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-8">Без аккаунта твои интересы и настройки не сохранятся.</p>
                  
                  <div className="space-y-3">
                    <Button 
                      size="lg" 
                      disabled={selectedInterests.length < 3}
                      onClick={() => onFinish(city)} 
                      className="w-full bg-terracotta-deep text-white rounded-full h-14 font-black shadow-lg shadow-terracotta-deep/20 disabled:opacity-50"
                    >
                      Сохранить и войти →
                    </Button>
                    <button onClick={() => onSkipAuth(city)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2 font-medium">
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