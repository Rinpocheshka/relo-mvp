import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router';
import { Button } from './ui/button';
import { MessageCircle, ArrowRight, Star, Users, Megaphone, Calendar, Heart, MapPin, Plus, Edit, Search, BookOpen, Loader2 } from 'lucide-react';
import { MessageHelper } from './MessageHelper';
import { UserAvatar } from './UserAvatar';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
import { AuthModal } from './AuthWidget';
import { WriteStoryModal } from './WriteStoryModal';
import { StoryDetailsModal } from './StoryDetailsModal';
import { translateTag } from '@/lib/tags';
import { formatRelativeRu } from '@/lib/date';

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

interface Story {
  id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  author_is_guide?: boolean;
  comments_count?: number;
}

interface Announcement {
  id: string;
  title: string;
  category: string;
  description: string;
  price_text: string;
  author_name: string;
  images: string[];
  created_at: string;
  location_text: string;
}

interface Event {
  id: string;
  title: string;
  type: string;
  starts_at: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  attendees: number;
  maxAttendees?: number;
  description: string;
  price: string;
  images: string[];
}

type Stage = 'planning' | 'just_arrived' | 'settling' | 'sharing' | 'moving_on';

// ─── Stage label mapping (supports legacy & new values) ──────────────────────
const STAGE_LABEL_MAP: Record<string, Stage> = {
  'planning': 'planning',
  'Планирую переезд': 'planning',
  'living': 'settling',
  'just_arrived': 'just_arrived',
  'Только приехал': 'just_arrived',
  'settling': 'settling',
  'Осваиваюсь': 'settling',
  'helping': 'sharing',
  'sharing': 'sharing',
  'Делюсь опытом': 'sharing',
  'leaving': 'moving_on',
  'moving_on': 'moving_on',
  'Переезжаю дальше': 'moving_on',
};

const commonSections = [
  { icon: '/assets/icons/custom/people_tab.png', title: 'Найти своих и познакомиться', subtitle: 'Люди рядом', link: '/people', color: 'text-terracotta-deep', bg: 'bg-terracotta-deep/10' },
  { icon: '/assets/icons/custom/support_tab.png', title: 'Ответы на ваши вопросы «А как проще…»', subtitle: 'База знаний', link: '/support', color: 'text-warm-olive', bg: 'bg-warm-olive/10' },
  { icon: '/assets/icons/custom/stories_large.png', title: 'Опыт, который меняет жизнь', subtitle: 'Истории релокации', link: '/stories', color: 'text-dusty-indigo', bg: 'bg-dusty-indigo/10' },
];

const commonQuickLinks = [
  { text: 'Жильё и сервисы', icon: '/assets/icons/custom/category_housing.png', link: '/announcements?category=housing' },
  { text: 'Куда сходить', icon: '/assets/icons/custom/events_all.png', link: '/events' },
  { text: 'Найти своих', icon: '/assets/icons/custom/people_tab.png', link: '/people' },
  { text: 'Получить совет', icon: '/assets/icons/custom/support_tab.png', link: '/support' },
  { text: 'Почитать истории', icon: '/assets/icons/custom/stories_large.png', link: '/stories' },
];

// ─── Stage configuration ───────────────────────────────────────────────────────
const STAGES_CONFIG: { value: Stage; label: string; icon: string }[] = [
  { value: 'planning', label: 'Планирую', icon: '✈️' },
  { value: 'just_arrived', label: 'Приехал', icon: '🧳' },
  { value: 'settling', label: 'Осваиваюсь', icon: '🏠' },
  { value: 'sharing', label: 'Делюсь', icon: '🤝' },
  { value: 'moving_on', label: 'Дальше', icon: '🌍' },
];

const planningQuickLinks = [
  { text: 'Посмотреть жилье', icon: '/assets/icons/custom/category_housing.png', link: '/announcements?category=housing' },
  { text: 'Понять куда тут ходят', icon: '/assets/icons/custom/events_all.png', link: '/events' },
  { text: 'Найти своих', icon: '/assets/icons/custom/people_tab.png', link: '/people' },
  { text: 'Собрать информацию', icon: '/assets/icons/custom/support_tab.png', link: '/support' },
  { text: 'Почитать как это было у других', icon: '/assets/icons/custom/stories_large.png', link: '/stories' },
];

const justArrivedQuickLinks = [
  { text: 'Найти жилье', icon: '/assets/icons/custom/category_housing.png', link: '/announcements?category=housing' },
  { text: 'Войти в сообщество', icon: '/assets/icons/custom/events_all.png', link: '/events' },
  { text: 'Написать тем кто поможет', icon: '/assets/icons/custom/people_tab.png', link: '/people' },
  { text: 'Быстро найти ответы', icon: '/assets/icons/custom/support_tab.png', link: '/support' },
  { text: 'Успокоиться что это проходили все', icon: '/assets/icons/custom/stories_large.png', link: '/stories' },
];

const settlingQuickLinks = [
  { text: 'Докупить необходимое', icon: '/assets/icons/custom/category_housing.png', link: '/announcements?category=housing' },
  { text: 'Хорошо провести вечер', icon: '/assets/icons/custom/events_all.png', link: '/events' },
  { text: 'Найти новых друзей', icon: '/assets/icons/custom/people_tab.png', link: '/people' },
  { text: 'Решить бытовые вопросы', icon: '/assets/icons/custom/support_tab.png', link: '/support' },
  { text: 'Узнать как это бывает', icon: '/assets/icons/custom/stories_large.png', link: '/stories' },
];

const sharingQuickLinks = [
  { text: 'Обновить гардероб', icon: '/assets/icons/custom/category_housing.png', link: '/announcements?category=housing' },
  { text: 'Организовать встречу', icon: '/assets/icons/custom/events_all.png', link: '/events' },
  { text: 'Найти единомышленников', icon: '/assets/icons/custom/people_tab.png', link: '/people' },
  { text: 'Помочь новичкам', icon: '/assets/icons/custom/support_tab.png', link: '/support' },
  { text: 'Поделиться своим опытом', icon: '/assets/icons/custom/stories_large.png', link: '/stories' },
];

const movingOnQuickLinks = [
  { text: 'Продать лишнее', icon: '/assets/icons/custom/category_housing.png', link: '/announcements?category=housing' },
  { text: 'Устроить отвальную', icon: '/assets/icons/custom/events_all.png', link: '/events' },
  { text: 'Сохранить контакты', icon: '/assets/icons/custom/people_tab.png', link: '/people' },
  { text: 'Поделиться лайф-хаками', icon: '/assets/icons/custom/support_tab.png', link: '/support' },
  { text: 'Описать свой путь', icon: '/assets/icons/custom/stories_large.png', link: '/stories' },
];

const stageContent = {
  planning: {
    greeting: 'Переезд — это не про чемоданы.\nЭто про то, как создать новую жизнь.',
    warmth: 'Ты выбираешь куда переехать. Посмотри, что происходит в городе, пообщайся с теми, кто уже там.',
    quickLinks: planningQuickLinks,
    sections: commonSections,
  },
  just_arrived: {
    greeting: 'Здесь есть люди, которые проходят тот же путь',
    warmth: 'Чтобы первые дни прошли легче — давай разберёмся вместе\nТут принято писать первым',
    quickLinks: justArrivedQuickLinks,
    sections: commonSections,
  },
  settling: {
    greeting: 'Поздравляем, ты уже почти свой! Пора вливаться!',
    warmth: 'Найди куда сходить или организуй любую встречу сам',
    quickLinks: settlingQuickLinks,
    sections: commonSections,
  },
  sharing: {
    greeting: 'Ты уже часть этого города — тебе есть чем поделиться 🌿',
    warmth: 'Делись опытом, создавай события, открывай проекты - расширяй возможности! Спасибо, что ты здесь!',
    quickLinks: sharingQuickLinks,
    sections: commonSections,
  },
  moving_on: {
    greeting: 'Освободи место для нового опыта 👋',
    warmth: 'Уезжать — это тоже начало. Продай ненужное, сохрани контакты и перейди на новый уровень',
    quickLinks: movingOnQuickLinks,
    sections: commonSections,
  },
};

export function HomePage() {
  const { session, user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState<Stage>('settling');
  const [city, setCity] = useState('Дананг');
  const [nearbyPeople, setNearbyPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle search with 50 char limit
  const handleSearchChange = (val: string) => {
    if (val.length <= 50) {
      setSearchQuery(val);
    }
  };

  // Stories
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [writeStoryOpen, setWriteStoryOpen] = useState(false);
  const [detailsStoryId, setDetailsStoryId] = useState<string | null>(null);
  const [storyToEdit, setStoryToEdit] = useState<Story | null>(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const storyParamId = searchParams.get('story');

  useEffect(() => {
    if (location.hash === '#stories') {
      const element = document.getElementById('stories');
      if (element) {
        // Small delay to ensure content is rendered before scrolling
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash]);

  useEffect(() => {
    if (storyParamId) {
      setDetailsStoryId(storyParamId);
    }
  }, [storyParamId]);

  // Sync stage and city from profile when it changes
  useEffect(() => {
    if (profile) {
      if (profile.stage) {
        const mapped = STAGE_LABEL_MAP[profile.stage] || 'settling';
        setCurrentStage(mapped);
      }
      if (profile.city) {
        setCity(profile.city.split(',')[0]);
      }
    }
  }, [profile]);

  useEffect(() => {
    async function fetchStories() {
      setStoriesLoading(true);
      try {
        const { data, error } = await supabase
          .from('stories')
          .select(`
            *,
            author:profiles!stories_author_id_fkey (
              display_name,
              avatar_url,
              is_guide
            ),
            story_comments(count)
          `)
          .order('created_at', { ascending: false })
          .limit(3);

        if (!error && data) {
          setStories(data.map(s => ({
            ...s,
            author_name: s.author?.display_name || 'Пользователь',
            author_avatar: s.author?.avatar_url,
            author_is_guide: !!s.author?.is_guide,
            comments_count: s.story_comments?.[0]?.count || 0
          })));
        }
      } finally {
        setStoriesLoading(false);
      }
    }

    async function fetchAnnouncements() {
      setAnnouncementsLoading(true);
      try {
        let query = supabase
          .from('announcements')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        // Personalization: if parent, show kid-related items
        const isParent = profile?.interests?.some(tag => 
          ['kids', 'maternity', 'kids_activities'].includes(tag)
        );

        if (isParent) {
          query = query.eq('category', 'Для детей');
        }

        const { data, error } = await query.limit(3);

        if (!error && data) {
          setAnnouncements(data.map(row => ({
            id: row.id,
            title: row.title || '',
            category: row.category || '',
            description: row.description || '',
            price_text: row.price_text || '',
            author_name: row.author_name || 'Пользователь',
            images: row.images || [],
            created_at: row.created_at,
            location_text: row.location_text || ''
          })));
        }
      } finally {
        setAnnouncementsLoading(false);
      }
    }

    async function fetchEvents() {
      setEventsLoading(true);
      try {
        let query = supabase
          .from('events')
          .select('*, event_participants(user_id)')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        // Personalization logic: if user has kid-related tags, show kid events
        // Using internal values 'kids', 'maternity', 'kids_activities' from SITUATION_TAGS/INTERESTS_TAGS
        const isParent = profile?.interests?.some(tag => 
          ['kids', 'maternity', 'kids_activities'].includes(tag)
        );

        if (isParent) {
          query = query.eq('type', 'Для детей');
        }

        const { data, error } = await query.limit(3);

        if (!error && data) {
          setEvents(data.map((row: any) => {
            const startsAt = row.starts_at ? new Date(row.starts_at) : new Date();
            return {
              id: row.id,
              title: row.title || '',
              type: row.type || '',
              starts_at: row.starts_at,
              date: startsAt.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }),
              time: startsAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
              location: row.location_text || '',
              organizer: row.organizer_name || 'Организатор',
              attendees: (row.event_participants || []).length,
              maxAttendees: row.max_attendees,
              description: row.description || '',
              price: row.price_text || 'Бесплатно',
              images: row.images || [],
            };
          }));
        }
      } finally {
        setEventsLoading(false);
      }
    }

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

    void fetchStories();
    void fetchAnnouncements();
    void fetchEvents();
    void fetchMainData();
  }, [session, user, city, profile]);

  const content = stageContent[currentStage];

  const handleEditStory = (story: Story) => {
    setDetailsStoryId(null);
    setStoryToEdit(story);
    setWriteStoryOpen(true);
  };


  return (
    <div className="bg-warm-milk pb-8 md:pb-16">
      <div className="max-w-5xl mx-auto px-4 py-8 pb-10 md:pb-8">

        {/* Relocation Stage Stepper */}
        {user && (
          <div className="mb-10 px-2 sm:px-6">
            <div className="relative">
              {/* Background Line */}
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-border/40 -translate-y-1/2 rounded-full" />
              
              {/* Progress Line */}
              <motion.div 
                className="absolute top-1/2 left-0 h-[2.5px] bg-dusty-indigo -translate-y-1/2 rounded-full z-10"
                initial={false}
                animate={{ 
                  width: `${(STAGES_CONFIG.findIndex(s => s.value === currentStage) / (STAGES_CONFIG.length - 1)) * 100}%` 
                }}
                transition={{ duration: 0.5, ease: 'circOut' }}
              />

              {/* Steps */}
              <div className="relative flex justify-between items-center z-20">
                {STAGES_CONFIG.map((stage, idx) => {
                  const isActive = stage.value === currentStage;
                  const isCompleted = STAGES_CONFIG.findIndex(s => s.value === currentStage) > idx;
                  
                  return (
                    <div key={stage.value} className="flex flex-col items-center">
                      <div
                        className={`
                          w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl
                          transition-all duration-300 shadow-sm border-2
                          ${isActive 
                            ? 'bg-dusty-indigo border-dusty-indigo text-white scale-110 shadow-lg shadow-dusty-indigo/30' 
                            : isCompleted
                              ? 'bg-white border-dusty-indigo text-dusty-indigo'
                              : 'bg-white border-border/60 text-muted-foreground'
                          }
                        `}
                      >
                        {stage.icon}
                      </div>
                      <span className={`
                        mt-3 text-[10px] sm:text-xs font-bold uppercase tracking-tighter sm:tracking-widest whitespace-nowrap transition-colors duration-300
                        ${isActive ? 'text-dusty-indigo' : 'text-muted-foreground/60'}
                      `}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto whitespace-pre-line">{content.warmth}</p>

              {/* Global Search Bar */}
              <div className="mt-8 max-w-2xl mx-auto relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-dusty-indigo transition-colors" />
                <input
                  type="text"
                  placeholder="ищи что угодно"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-14 pr-32 py-4 md:py-5 bg-white border border-border/60 rounded-[24px] shadow-sm focus:outline-none focus:ring-4 focus:ring-dusty-indigo/10 focus:border-dusty-indigo/50 transition-all text-base md:text-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if (val.trim()) {
                        navigate(`/search?q=${encodeURIComponent(val.trim())}`);
                      }
                    }
                  }}
                />
                <div className="absolute right-24 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest hidden md:block mr-2">
                  {searchQuery.length}/50
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Button 
                    className="bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-xl h-10 md:h-12 px-6 font-bold shadow-lg shadow-dusty-indigo/20 transition-all active:scale-95"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                  >
                    Найти
                  </Button>
                </div>
              </div>
            </motion.div>

            <div className="bg-white rounded-[32px] border border-border/40 shadow-sm overflow-hidden mb-10">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 md:p-8 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Что важно сейчас</p>
                  <div className="flex flex-wrap gap-3">
                    {content.quickLinks.map((link, i) => (
                      <Link key={i} to={link.link}>
                        <button className="flex items-center gap-2.5 px-6 py-3 bg-soft-sand/40 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-2xl text-sm font-semibold transition-all text-foreground border border-transparent hover:border-terracotta-deep/20">
                          {(link as any).icon && <img src={(link as any).icon} className="w-5 h-5 object-contain" alt="" />}
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

            {/* Announcements Block */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <Link to="/announcements" className="flex items-center gap-4 group/header">
                  <div className="w-12 h-12 rounded-2xl bg-dusty-indigo/10 flex items-center justify-center overflow-hidden group-hover/header:rotate-3 transition-transform">
                    <img src="/assets/icons/custom/category_housing.png" className="w-8 h-8 object-contain" alt="" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <h2 className="text-2xl font-bold group-hover/header:text-dusty-indigo transition-colors">Объявления</h2>
                      <p className="text-sm text-muted-foreground">Жилье, услуги, вещи</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-dusty-indigo opacity-0 -translate-x-2 group-hover/header:opacity-100 group-hover/header:translate-x-0 transition-all" />
                  </div>
                </Link>
                <Link to="/announcements?create=true">
                  <Button size="sm" className="bg-white hover:bg-white/90 text-dusty-indigo border border-border/40 rounded-full px-5 font-bold shadow-sm h-10 transition-all active:scale-95">
                    <Plus className="w-4 h-4 mr-2" /> Разместить
                  </Button>
                </Link>
              </div>

              {announcementsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-dusty-indigo/20" /></div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {announcements.map((ann, i) => (
                    <Link key={ann.id} to={`/announcements?id=${ann.id}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-[32px] overflow-hidden border border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all h-full flex flex-col group"
                      >
                        <div className="h-40 bg-soft-sand/10 relative overflow-hidden">
                          {ann.images?.[0] ? (
                            <img src={ann.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Megaphone className="w-8 h-8 text-muted-foreground/20" /></div>
                          )}
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-dusty-indigo uppercase tracking-wider">{ann.category}</span>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-dusty-indigo transition-colors">{ann.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{ann.description}</p>
                          <div className="mt-auto pt-4 border-t border-soft-sand/30 flex items-center justify-between">
                            <span className="text-sm font-black text-terracotta-deep">{ann.price_text || 'Цена не указана'}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{ann.location_text.split(',')[0]}</span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Afisha Block */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <Link to="/events" className="flex items-center gap-4 group/header">
                  <div className="w-12 h-12 rounded-2xl bg-terracotta-deep/10 flex items-center justify-center overflow-hidden group-hover/header:rotate-3 transition-transform">
                    <img src="/assets/icons/custom/events_all.png" className="w-8 h-8 object-contain" alt="" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <h2 className="text-2xl font-bold group-hover/header:text-terracotta-deep transition-colors">Афиша</h2>
                      <p className="text-sm text-muted-foreground">Встречи и мероприятия</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-terracotta-deep opacity-0 -translate-x-2 group-hover/header:opacity-100 group-hover/header:translate-x-0 transition-all" />
                  </div>
                </Link>
                <Link to="/events?create=true">
                  <Button size="sm" className="bg-white hover:bg-white/90 text-terracotta-deep border border-border/40 rounded-full px-5 font-bold shadow-sm h-10 transition-all active:scale-95">
                    <Plus className="w-4 h-4 mr-2" /> Создать
                  </Button>
                </Link>
              </div>

              {eventsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-terracotta-deep/20" /></div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {events.map((event, i) => (
                    <Link key={event.id} to={`/events?id=${event.id}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-[32px] overflow-hidden border border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all h-full flex flex-col group"
                      >
                        <div className="h-40 bg-soft-sand/10 relative overflow-hidden">
                          {event.images?.[0] ? (
                            <img src={event.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-terracotta-deep/10 to-dusty-indigo/10" />
                          )}
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-terracotta-deep uppercase tracking-wider">{event.type}</span>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-terracotta-deep transition-colors">{event.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 italic">
                            <Calendar className="w-3.5 h-3.5" /> {event.date}, {event.time}
                          </div>
                          <div className="mt-auto pt-4 border-t border-soft-sand/30 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                              <Users className="w-3.5 h-3.5" /> {event.attendees} идут
                            </div>
                            <span className="text-sm font-black text-terracotta-deep">{event.price}</span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <div className="grid md:grid-cols-3 gap-5 mb-12">
              {content.sections.map((section, i) => {
                return (
                  <Link key={i} to={section.link}>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-6 rounded-[24px] border border-border/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all h-full flex flex-col"
                    >
                      <div className={`w-14 h-14 rounded-2xl ${section.bg} flex items-center justify-center mb-6`}>
                        <img src={section.icon as string} className="w-8 h-8 object-contain" alt="" />
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

            {/* Relocation Stories Section removed from Home for cleaner look, available via grid link */}

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
            
            {/* Cooperation & Suggestions Block */}
            <div className="mt-8 bg-white rounded-[32px] p-8 border border-border/40 shadow-sm text-center">
              <p className="text-lg md:text-xl font-medium text-foreground">
                Хочешь добавить что-то еще? Есть предложения по сотрудничеству? —{' '}
                <a 
                  href="https://t.me/Relome_help" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-terracotta-deep hover:text-terracotta-deep/80 underline decoration-2 underline-offset-4 transition-all"
                >
                  пиши
                </a>
              </p>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      <WriteStoryModal 
        isOpen={writeStoryOpen} 
        onClose={() => {
          setWriteStoryOpen(false);
          setStoryToEdit(null);
        }} 
        storyToEdit={storyToEdit}
        onSuccess={() => {
          // Re-fetch stories after new one added or edited
          window.location.reload(); 
        }} 
      />

      <StoryDetailsModal
        isOpen={!!detailsStoryId}
        onClose={() => setDetailsStoryId(null)}
        storyId={detailsStoryId}
        onEdit={handleEditStory}
        onDeleteSuccess={() => {
          window.location.reload();
        }}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

// ─── Helper for Card Content ──────────────────────────────────────────────────
function CardItemContent({ person }: { person: Person }) {
  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <UserAvatar 
          src={person.avatar_url} 
          name={person.display_name} 
          isGuide={!!person.is_guide} 
          size="xl" 
          className="!shadow-md !border-2 !border-white" 
        >
          {/* Online indicator */}
          <div className={`absolute bottom-0 left-0 w-4 h-4 border-2 border-white rounded-full shadow-sm transition-colors duration-500 ${
            person.last_seen && (new Date().getTime() - new Date(person.last_seen).getTime() < 5 * 60 * 1000)
              ? 'bg-green-500' 
              : 'bg-amber-400'
          }`} title={person.last_seen && (new Date().getTime() - new Date(person.last_seen).getTime() < 5 * 60 * 1000) ? "В сети" : "Был в сети недавно"} />
        </UserAvatar>
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
            {translateTag(tag)}
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
