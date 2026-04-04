import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { Button } from './ui/button';
import { MessageCircle, ArrowRight, Star, Users, Megaphone, Calendar, Heart, MapPin, Plus } from 'lucide-react';
import { MessageHelper } from './MessageHelper';

type Stage = 'planning' | 'living' | 'helping' | 'leaving';

// ─── Stage label mapping (supports legacy & new values) ──────────────────────
const STAGE_LABEL_MAP: Record<string, Stage> = {
  'planning': 'planning',
  'Планирую переезд': 'planning',
  'living': 'living',
  'Уже здесь': 'living',
  'helping': 'helping',
  'Помогаю другим': 'helping',
  'leaving': 'leaving',
  'Уезжаю': 'leaving',
};

// ─── Mock people nearby ───────────────────────────────────────────────────────
const NEARBY_PEOPLE: Record<Stage, Array<{ name: string; status: string; tag: string; isGuide?: boolean }>> = {
  planning: [
    { name: 'Мария', status: 'Планирует переезд', tag: 'Собирает документы' },
    { name: 'Олег', status: 'Уже переехал · 6 мес.', tag: 'Делится опытом', isGuide: true },
    { name: 'Таня', status: 'Планирует переезд', tag: 'Ищет информацию о школах' },
  ],
  living: [
    { name: 'Елена', status: 'Уже здесь · 3 нед.', tag: 'Ищет друзей' },
    { name: 'Дмитрий', status: 'Уже здесь · 1 год', tag: 'Организует встречи', isGuide: true },
    { name: 'Катя', status: 'Уже здесь · 2 мес.', tag: 'IT · Фриланс' },
  ],
  helping: [
    { name: 'Светлана', status: 'Только приехала', tag: 'Ищет жильё' },
    { name: 'Максим', status: 'Новичок · 1 нед.', tag: 'Нужна помощь' },
    { name: 'Аня', status: 'Только приехала', tag: 'С детьми' },
  ],
  leaving: [
    { name: 'Артём', status: 'Тоже уезжает', tag: 'Продаёт вещи' },
    { name: 'Ксения', status: 'Новичок', tag: 'Примет эстафету' },
  ],
};

// ─── Stage content ─────────────────────────────────────────────────────────────
const stageContent = {
  planning: {
    greeting: 'Переезд — это не про чемоданы.\nЭто про то, как создать новую жизнь.',
    warmth: 'Ты выбираешь куда переехать. Посмотри, что происходит в Дананге, пообщайся с теми, кто уже там.',
    quickLinks: [
      { text: '🏠 Найти жильё', link: '/announcements?category=housing' },
      { text: '❓ Найти ответы', link: '/support' },
      { text: '📍 События', link: '/events' },
      { text: '👥 Написать местным', link: '/people' },
    ],
    sections: [
      { icon: Heart, title: 'Ответы на вопросы «А как проще…»', subtitle: 'Найти опору', link: '/support', color: 'text-warm-olive', bg: 'bg-warm-olive/10' },
      { icon: Megaphone, title: 'Актуальные объявления: жильё, услуги', subtitle: 'Объявления', link: '/announcements', color: 'text-dusty-indigo', bg: 'bg-dusty-indigo/10' },
      { icon: Calendar, title: 'Что происходит в Дананге?', subtitle: 'Афиша', link: '/events', color: 'text-terracotta-deep', bg: 'bg-terracotta-deep/10' },
    ],
  },
  living: {
    greeting: 'Ты в Дананге 🌿\nЗдесь есть люди, которые проходят тот же путь.',
    warmth: 'Первые дни в новом городе — давай разберёмся вместе. Здесь нормально писать первым.',
    quickLinks: [
      { text: '🏠 Жильё и сервисы', link: '/announcements?category=housing' },
      { text: '🎉 Куда сходить', link: '/events' },
      { text: '👥 Найти своих', link: '/people' },
      { text: '💙 Получить совет', link: '/support' },
    ],
    sections: [
      { icon: Megaphone, title: 'Самое актуальное на первое время', subtitle: 'Объявления', link: '/announcements', color: 'text-terracotta-deep', bg: 'bg-terracotta-deep/10' },
      { icon: Heart, title: 'Честные вопросы и ответы на них', subtitle: 'Найти опору', link: '/support', color: 'text-warm-olive', bg: 'bg-warm-olive/10' },
      { icon: Calendar, title: 'Всегда есть куда сходить', subtitle: 'Афиша', link: '/events', color: 'text-dusty-indigo', bg: 'bg-dusty-indigo/10' },
    ],
  },
  helping: {
    greeting: 'Ты уже часть этого города —\nтебе есть чем поделиться 🌿',
    warmth: 'Активные пользователи видны лучше и помогают сообществу расти. Спасибо, что ты здесь!',
    quickLinks: [
      { text: '🤝 Помочь новичкам', link: '/people?filter=newcomers' },
      { text: '🎪 Провести событие', link: '/events/create' },
      { text: '📦 Продать вещи', link: '/announcements' },
      { text: '💬 Ответить на вопросы', link: '/support' },
    ],
    sections: [
      { icon: Users, title: 'Люди, которым ты можешь помочь', subtitle: 'Люди рядом', link: '/people', color: 'text-dusty-indigo', bg: 'bg-dusty-indigo/10' },
      { icon: Calendar, title: 'Организовать свою встречу', subtitle: 'Афиша', link: '/events', color: 'text-terracotta-deep', bg: 'bg-terracotta-deep/10' },
      { icon: Heart, title: 'Ответить на вопросы новичков', subtitle: 'Найти опору', link: '/support', color: 'text-warm-olive', bg: 'bg-warm-olive/10' },
    ],
  },
  leaving: {
    greeting: 'Освободи место\nдля нового опыта 👋',
    warmth: 'Уезжать — это тоже начало. Продай ненужное, сохрани контакты и передай эстафету.',
    quickLinks: [
      { text: '📦 Продать вещи', link: '/announcements?category=items' },
      { text: '🏠 Пересдать квартиру', link: '/announcements?category=housing' },
      { text: '🎉 Сделать отвальную', link: '/events' },
      { text: '👥 Сохранить контакты', link: '/people' },
    ],
    sections: [
      { icon: Megaphone, title: 'Продать то, что не влезет в чемодан', subtitle: 'Объявления', link: '/announcements', color: 'text-dusty-indigo', bg: 'bg-dusty-indigo/10' },
      { icon: Calendar, title: 'Сделать отвальную или встречу', subtitle: 'Афиша', link: '/events', color: 'text-terracotta-deep', bg: 'bg-terracotta-deep/10' },
      { icon: Heart, title: 'Поделиться своими лайфхаками', subtitle: 'Найти опору', link: '/support', color: 'text-warm-olive', bg: 'bg-warm-olive/10' },
    ],
  },
};

export function HomePage() {
  const [currentStage, setCurrentStage] = useState<Stage>('living');
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [showMessageHelper, setShowMessageHelper] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [city, setCity] = useState('Дананг');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('reloOnboarding');
      const storedStage = localStorage.getItem('reloStage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.city) setCity(parsed.city);
      }
      if (storedStage) {
        const mapped = STAGE_LABEL_MAP[storedStage] || 'living';
        setCurrentStage(mapped);
      }
    } catch {
      // ignore
    }
  }, []);

  const content = stageContent[currentStage];
  const people = NEARBY_PEOPLE[currentStage];

  const stageLabels: Record<Stage, { label: string; icon: string }> = {
    planning: { label: 'Планирую переезд', icon: '🗺️' },
    living: { label: 'Уже здесь', icon: '🌿' },
    helping: { label: 'Помогаю другим', icon: '🤝' },
    leaving: { label: 'Уезжаю', icon: '👋' },
  };

  return (
    <div className="min-h-screen bg-warm-milk">
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">

        {/* ── Stage bar ── */}
        <div className="flex items-center justify-end mb-8">
          <button
            onClick={() => setShowStageSelector(!showStageSelector)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border/50 rounded-full text-sm font-medium shadow-sm hover:bg-soft-sand/30 transition-all"
          >
            <span>{stageLabels[currentStage].icon}</span>
            <span>{stageLabels[currentStage].label}</span>
            <span className="text-muted-foreground text-xs">· изменить</span>
          </button>
        </div>

        {/* Stage selector dropdown */}
        <AnimatePresence>
          {showStageSelector && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="bg-white rounded-[24px] border border-border/50 shadow-lg p-4 mb-6 grid grid-cols-2 gap-2"
            >
              {(Object.entries(stageLabels) as [Stage, { label: string; icon: string }][]).map(([id, { label, icon }]) => (
                <button
                  key={id}
                  onClick={() => {
                    setCurrentStage(id);
                    localStorage.setItem('reloStage', id);
                    setShowStageSelector(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-[16px] text-sm font-medium text-left transition-all ${
                    currentStage === id
                      ? 'bg-terracotta-deep text-white'
                      : 'hover:bg-soft-sand/30 text-foreground'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* ── Greeting ── */}
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.15] tracking-tight mb-3 whitespace-pre-line">
                {content.greeting}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">{content.warmth}</p>
            </div>

            {/* ── Quick actions ── */}
            <div className="bg-white rounded-[24px] border border-border/40 shadow-sm p-5 mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Что важно сейчас</p>
              <div className="flex flex-wrap gap-2">
                {content.quickLinks.map((link, i) => (
                  <Link key={i} to={link.link}>
                    <button className="px-5 py-2.5 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-full text-sm font-medium transition-all text-foreground">
                      {link.text}
                    </button>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── PEOPLE NEARBY (always first, always visible) ── */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold">Люди рядом с тобой</h2>
                  <p className="text-muted-foreground text-sm mt-1">Здесь нормально писать первым 👋</p>
                </div>
                <Link to="/people" className="flex items-center gap-1 text-sm font-medium text-terracotta-deep hover:text-terracotta-deep/80 transition-colors">
                  Все люди <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {people.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {people.map((person, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`bg-white p-6 rounded-[24px] border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
                        person.isGuide
                          ? 'border-warm-olive/30 bg-gradient-to-b from-white to-warm-olive/5'
                          : 'border-border/40'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                          person.isGuide ? 'bg-warm-olive' : 'bg-dusty-indigo/80'
                        }`}>
                          {person.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{person.name}</span>
                            {person.isGuide && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{person.status}</p>
                        </div>
                      </div>
                      <span className="inline-block px-3 py-1 bg-soft-sand/50 text-xs font-medium rounded-full mb-4">
                        {person.tag}
                      </span>
                      <Button
                        className="w-full bg-dusty-indigo/10 hover:bg-dusty-indigo text-dusty-indigo hover:text-white rounded-full h-10 text-sm font-medium transition-all"
                        onClick={() => {
                          setSelectedPerson(person.name);
                          setShowMessageHelper(true);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Написать
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Empty state
                <div className="bg-white rounded-[24px] border border-border/40 p-10 text-center">
                  <p className="text-4xl mb-4">👥</p>
                  <h3 className="text-lg font-semibold mb-2">Кто-то уже готов написать тебе</h3>
                  <p className="text-muted-foreground mb-6">Добавь профиль или открой страницу людей — начни разговор</p>
                  <Link to="/people">
                    <Button className="bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-full px-6">
                      Посмотреть всех <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </section>

            {/* ── Section cards ── */}
            <div className="grid md:grid-cols-3 gap-5 mb-12">
              {content.sections.map((section, i) => {
                const Icon = section.icon;
                return (
                  <Link key={i} to={section.link}>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-6 rounded-[24px] border border-border/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all h-full flex flex-col"
                    >
                      <div className={`w-12 h-12 ${section.bg} ${section.color} rounded-2xl flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${section.color} mb-2`}>
                        {section.subtitle}
                      </p>
                      <h3 className="text-base font-semibold leading-snug flex-1">{section.title}</h3>
                      <div className={`flex items-center gap-1 mt-4 ${section.color} text-sm font-medium`}>
                        Перейти <ArrowRight className="w-4 h-4" />
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* ── CTA: Create something ── */}
            <div className="bg-gradient-to-br from-dusty-indigo to-terracotta-deep rounded-[32px] p-8 md:p-10 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">У тебя есть что предложить?</h2>
                  <p className="opacity-85">Размести объявление, предложи событие или поделись советом</p>
                </div>
                <div className="flex gap-3 flex-wrap flex-shrink-0">
                  <Link to="/announcements">
                    <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-5 h-12 font-medium">
                      <Plus className="w-4 h-4 mr-2" />
                      Объявление
                    </Button>
                  </Link>
                  <Link to="/events">
                    <Button className="bg-white text-dusty-indigo hover:bg-white/90 rounded-full px-5 h-12 font-semibold shadow-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Событие
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Message Helper ── */}
      <AnimatePresence>
        {showMessageHelper && (
          <MessageHelper
            personName={selectedPerson}
            onClose={() => setShowMessageHelper(false)}
            onSend={(message) => {
              console.log('Message sent to', selectedPerson, ':', message);
              setShowMessageHelper(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
