import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { Button } from './ui/button';
import { MessageCircle, ArrowRight, Star, Users, Megaphone, Calendar, Heart, MapPin, Plus, Edit } from 'lucide-react';
import { MessageHelper } from './MessageHelper';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';

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

// ─── OLD Mock removed ──────────────────────

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
  const { session, user } = useAuth();
  const [currentStage, setCurrentStage] = useState<Stage>('living');
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [showMessageHelper, setShowMessageHelper] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [city, setCity] = useState('Дананг');
  const [nearbyPeople, setNearbyPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Person | null>(null);

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
      let currentCity = city;
      let currentUser: Person | null = null;

      // 1. Fetch current user's profile
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUserProfile(profile);
          currentUser = profile;
          if (profile.city) {
            setCity(profile.city);
            currentCity = profile.city;
          }
        }
      }

      // 2. Fetch others with proximity logic
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (!error && allProfiles) {
        let results: Person[] = [];
        const others = allProfiles.filter(p => p.id !== session?.user?.id);

        if (others.length === 0 && currentUser) {
          // If I'm alone, show me 3x
          results = [currentUser, currentUser, currentUser];
        } else {
          // Fallback logic
          const sameCity = others.filter(p => p.city === currentCity);
          results = [...sameCity];

          if (results.length < 3 && currentCity.includes(',')) {
            const country = currentCity.split(',')[1]?.trim();
            const sameCountry = others.filter(p => 
              p.city?.includes(country) && !results.find(r => r.id === p.id)
            );
            results = [...results, ...sameCountry];
          }

          if (results.length < 3) {
            const leftovers = others.filter(p => !results.find(r => r.id === p.id));
            results = [...results, ...leftovers];
          }
          
          results = results.slice(0, 3);
          
          // Final safety: if no one else exists and I'm even not in DB yet (not likely but safe)
          if (results.length === 0 && currentUser) {
            results = [currentUser, currentUser, currentUser];
          }
        }
        setNearbyPeople(results);
      }
      setPeopleLoading(false);
    }
    fetchMainData();
  }, [session, user]);

  const content = stageContent[currentStage];

  const stageLabels: Record<Stage, { label: string; icon: string }> = {
    planning: { label: 'Планирую переезд', icon: '🗺️' },
    living: { label: 'Уже здесь', icon: '🌿' },
    helping: { label: 'Помогаю другим', icon: '🤝' },
    leaving: { label: 'Уезжаю', icon: '👋' },
  };

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
            {/* ── Greeting Header ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold mb-4">
                {content.warmth}
              </h1>
            </motion.div>
            {/* ── Quick actions ── */}
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
                  <img 
                    src="/assets/images/community-circle.jpg" 
                    className="absolute inset-0 w-full h-full object-cover" 
                    alt="" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
                </div>
              </div>
            </div>

            {/* ── PEOPLE NEARBY ── */}
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
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`bg-white p-6 rounded-[24px] border shadow-sm transition-all relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 ${
                        person.is_guide
                          ? 'border-warm-olive/30 bg-gradient-to-b from-white to-warm-olive/5'
                          : 'border-border/40'
                      }`}
                    >
                      <Link to={`/profile/${person.id}`} className="block">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="relative flex-shrink-0">
                            {person.avatar_url ? (
                              <img src={person.avatar_url} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                            ) : (
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm ${
                                person.is_guide ? 'bg-warm-olive' : 'bg-dusty-indigo/80'
                              }`}>
                                {(person.display_name || '?').charAt(0)}
                              </div>
                            )}
                            {/* Online Status Dot */}
                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                              person.last_seen && (new Date().getTime() - new Date(person.last_seen).getTime() < 5 * 60 * 1000)
                                ? 'bg-green-500' 
                                : 'bg-amber-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-bold text-lg text-foreground truncate">{person.display_name || 'Без имени'}</span>
                              {person.is_guide && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{person.city}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                           <span className="px-2.5 py-1 bg-soft-sand/50 rounded-full text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {person.stage === 'planning' ? 'Планирует' : 
                               person.stage === 'living' ? 'Живет здесь' : 
                               person.stage === 'helping' ? 'Помогает' : 
                               person.stage === 'leaving' ? 'Уезжает' : person.stage || 'Участник'}
                           </span>
                           {person.interests && person.interests.length > 0 && (
                             <span className="px-2.5 py-1 bg-terracotta-deep/5 rounded-full text-[10px] font-semibold text-terracotta-deep uppercase tracking-wider">
                               {person.interests[0]}
                             </span>
                           )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {person.bio || 'Привет! Я присоединился к Relo.me, чтобы находить новых друзей.'}
                        </p>
                      </Link>

                      {userProfile?.role === 'admin' && (
                        <Link to={`/profile/${person.id}`}>
                           <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
