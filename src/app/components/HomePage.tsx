import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { Button } from './ui/button';
import { MessageCircle, ArrowRight, Star, Users, Megaphone, Calendar, Heart, MapPin, Plus, Edit } from 'lucide-react';
import { MessageHelper } from './MessageHelper';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
import { AuthModal } from './AuthWidget';

interface Person {
  id: string;
  display_name: string;
  stage: string;
  city: string;
  bio: string;
  interests: string[];
  is_guide: boolean;
  avatar_url?: string;
  role?: string;
  last_seen?: string;
}

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
    warmth: 'Первые дни в новом городе — давай разберёмся вместе.',
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
  const { session, user, profile } = useAuth();
  const [currentStage, setCurrentStage] = useState<Stage>('living');
  const [city, setCity] = useState('Дананг');
  const [nearbyPeople, setNearbyPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

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

  useEffect(() => {
    async function fetchMainData() {
      setPeopleLoading(true);
      
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (!error && allProfiles) {
        let results: Person[] = [];
        const currentUserId = session?.user?.id;
        const others = allProfiles.filter(p => p.id !== currentUserId);

        // 1. Fill by proximity (city)
        results = others.filter(p => p.city === city);

        // 2. Fallback to same country if filtered by city is empty
        if (results.length < 3 && city.includes(',')) {
          const country = city.split(',')[1]?.trim();
          const sameCountry = others.filter(p => 
            p.city?.includes(country) && !results.find(r => r.id === p.id)
          );
          results = [...results, ...sameCountry];
        }

        // 3. Last fallback: random profiles to ensure 3
        if (results.length < 3) {
          const remaining = others.filter(p => !results.find(r => r.id === p.id));
          const extras = remaining.sort(() => 0.5 - Math.random()).slice(0, 3 - results.length);
          results = [...results, ...extras];
        }

        // 4. For absolute empty state (nobody else in DB), show self
        if (results.length === 0) {
          const self = allProfiles.find(p => p.id === currentUserId);
          if (self) results = [self, self, self];
        }

        setNearbyPeople(results.slice(0, 3));
      }
      setPeopleLoading(false);
    }
    fetchMainData();
  }, [session, user, city]);

  const content = stageContent[currentStage];

  return (
    <div className="min-h-screen bg-warm-milk">
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 whitespace-pre-line">{content.greeting.split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{content.warmth}</p>
            </motion.div>

            <div className="bg-white rounded-[32px] border border-border/40 shadow-sm overflow-hidden mb-10">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 md:p-8 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Что важно сейчас</p>
                  <div className="flex flex-wrap gap-3">
                    {content.quickLinks.map((link, i) => (
                      <Link key={i} to={link.link}>
                        <button className="px-6 py-3 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-2xl text-sm font-semibold transition-all text-foreground border border-transparent hover:border-terracotta-deep/20">
                          {link.text}
                        </button>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="hidden md:block w-1/3 relative bg-terracotta-deep/5">
                  <img src="/assets/images/community-circle.jpg" className="absolute inset-0 w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
                </div>
              </div>
            </div>

            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-warm-olive/10 flex items-center justify-center overflow-hidden">
                    <img src="/assets/images/community-puzzle.jpg" className="w-full h-full object-cover scale-110" alt="" />
                  </div>
                  <h2 className="text-2xl font-bold">Люди рядом</h2>
                </div>
                <Link to="/people" className="flex items-center gap-1.5 text-sm font-bold text-terracotta-deep hover:text-terracotta-deep/80 transition-colors">
                  Все люди <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {peopleLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dusty-indigo"></div></div>
              ) : nearbyPeople.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nearbyPeople.map((person, i) => (
                    <motion.div
                      key={person.id + i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="group bg-white rounded-[32px] p-5 border border-border/40 hover:border-terracotta-deep/30 transition-all hover:shadow-xl hover:-translate-y-1 relative"
                    >
                      {user ? (
                        <Link to={person.id === user?.id ? "/profile?edit=true" : `/profile/${person.id}`} className="block">
                          <CardItemContent person={person} />
                        </Link>
                      ) : (
                        <div onClick={() => setAuthOpen(true)} className="cursor-pointer">
                          <CardItemContent person={person} />
                        </div>
                      )}

                      {user && (person.id === user.id || profile?.role === 'admin') && (
                        <Link to={person.id === user.id ? "/profile?edit=true" : `/profile/${person.id}`}>
                           <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 hover:bg-white border border-border/50 shadow-sm">
                              <Edit className="w-4 h-4 text-muted-foreground" />
                           </Button>
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[32px] border border-border/40 p-12 text-center relative overflow-hidden group">
                  <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-terracotta-deep/5 rounded-full blur-3xl transition-transform group-hover:scale-110 duration-1000" />
                  <h3 className="text-xl font-bold mb-2">Кто-то уже готов написать тебе</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">Добавь профиль или открой страницу людей — начни разговор первым.</p>
                  <Link to="/people">
                    <Button className="bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-full px-8 h-12 font-semibold shadow-lg transition-all hover:-translate-y-0.5">
                      Посмотреть всех <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </section>

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
                      <p className={`text-xs font-semibold uppercase tracking-wider ${section.color} mb-2`}>{section.subtitle}</p>
                      <h3 className="text-base font-semibold leading-snug flex-1">{section.title}</h3>
                      <div className={`flex items-center gap-1 mt-4 ${section.color} text-sm font-medium`}>
                        Перейти <ArrowRight className="w-4 h-4" />
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-dusty-indigo to-terracotta-deep rounded-[32px] p-8 md:p-10 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">У тебя есть что предложить?</h2>
                  <p className="opacity-85">Размести объявление, предложи событие или поделись опытом</p>
                </div>
                <div className="flex gap-3 flex-wrap flex-shrink-0">
                  <Link to="/announcements">
                    <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-5 h-12 font-medium">
                      <Plus className="w-4 h-4 mr-2" /> Объявление
                    </Button>
                  </Link>
                  <Link to="/events">
                    <Button className="bg-white text-dusty-indigo hover:bg-white/90 rounded-full px-5 h-12 font-semibold shadow-sm">
                      <Plus className="w-4 h-4 mr-2" /> Событие
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

// ─── Helper for Card Content ──────────────────────────────────────────────────
function CardItemContent({ person }: { person: Person }) {
  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          {person.avatar_url ? (
            <img src={person.avatar_url} alt={person.display_name} className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-white" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-soft-sand flex items-center justify-center shadow-inner">
              <Users className="w-7 h-7 text-dusty-indigo" />
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="В сети" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground group-hover:text-terracotta-deep transition-colors w-full truncate">
            {person.display_name || 'Без имени'}
          </h3>
          <div className="flex items-center text-xs text-muted-foreground bg-soft-sand/50 px-2 py-0.5 rounded-full mt-0.5 w-fit">
            <MapPin className="w-3 h-3 mr-1" /> {person.city?.split(',')[0] || 'Не указан'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4 h-[1.5rem] overflow-hidden">
        {(person.interests || []).slice(0, 3).map((tag, idx) => (
          <span key={idx} className="text-[10px] uppercase tracking-wider font-bold bg-white border border-border/60 text-muted-foreground px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            {tag}
          </span>
        ))}
        {(person.interests || []).length > 3 && (
          <span className="text-[10px] font-bold text-muted-foreground/60 px-1">+{(person.interests || []).length - 3}</span>
        )}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-[2.5rem]">
        {person.bio || 'Привет! Я присоединился к Relo.me, чтобы находить новых друзей.'}
      </p>
    </>
  );
}
