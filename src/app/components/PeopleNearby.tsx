import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Heart, MessageCircle, MapPin, Clock, Star, Lock, ChevronLeft, ChevronRight, ChevronDown, User as UserIcon } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from './ui/button';
import { AuthModal } from './AuthWidget';
import { UserAvatar } from './UserAvatar';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
import { Link, useNavigate } from 'react-router';
import { translateTag } from '@/lib/tags';
import { useMessageModal } from '../hooks/useMessageModal';

interface Person {
  id: string;
  display_name: string;
  stage: string;
  city: string;
  bio: string;
  interests: string[];
  is_guide: boolean;
  rating?: number;
  last_seen?: string;
  avatar_url?: string;
}

const INTEREST_OPTIONS = [
  { value: 'solo', label: '🧍 я один' },
  { value: 'partner', label: '👫 с партнером' },
  { value: 'kids', label: '👨‍👩‍👧 с детьми' },
  { value: 'pet', label: '🐾 с питомцем' },
  { value: 'lgbt', label: '🏳️‍🌈 LGBT' },
  { value: 'volunteer', label: '🤝 волонтер' },
  { value: 'remote', label: '💻 удаленщик' },
  { value: 'maternity', label: '👶 мама в декрете' },
  { value: 'it_specialist', label: '👨‍💻 IT специалист' },
  { value: 'master_classes', label: '🎨 веду мастер-классы' },
  { value: 'looking_job', label: '💼 ищу работу' },
  { value: 'looking_friends', label: '👋 ищу друзей' },
  { value: 'local_business', label: '🏗️ строю местный бизнес' },
  { value: 'english', label: '🇬🇧 учу английский' },
  { value: 'philosopher', label: '🧠 философ' },
  { value: 'artist', label: '🎨 художник' },
  { value: 'sport', label: '💪 спорт' },
  { value: 'yoga', label: '🧘 йога' },
  { value: 'surfing', label: '🏄 серфинг' },
  { value: 'motorcycles', label: '🏍️ мотоциклы' },
  { value: 'biking', label: '🚲 велопрогулки' },
  { value: 'psychology', label: '🧩 психология' },
  { value: 'wine', label: '🍷 люблю вино' },
  { value: 'photographer', label: '📸 фотограф' },
  { value: 'health', label: '🥗 ЗОЖ' },
  { value: 'clubbing', label: '🕺 хожу в клубы' },
  { value: 'no_alcohol', label: '🚫 Non Alcohol' },
  { value: 'musician', label: '🎸 музыкант' },
  { value: 'karaoke', label: '🎤 караоке' },
  { value: 'handicrafts', label: '🧶 рукоделие' },
  { value: 'kids_activities', label: '🧸 занятия с детьми' },
  { value: 'reading', label: '📚 чтение книг' },
  { value: 'esoterics', label: '🔮 эзотерика' },
  { value: 'dancing', label: '💃 люблю танцевать' },
  { value: 'actor', label: '🎭 актер' },
  { value: 'standup', label: '🎤 стендап' },
  { value: 'vietnamese', label: '🇻🇳 учу вьетнамский' },
];

export function PeopleNearby() {
  const { session, user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('Все');
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, newcomers: 0, guides: 0 });
  const PAGE_SIZE = 30;

  const [emblaRef] = useEmblaCarousel({ 
    loop: true, 
    align: 'start',
    dragFree: true
  });

  const filters = [
    { name: 'Все', value: 'Все', icon: '/assets/icons/custom/people_all.png' },
    { name: 'Планирую переезд', value: 'planning', icon: '/assets/icons/custom/people_planning.png' },
    { name: 'Только приехал', value: 'just_arrived', icon: '/assets/icons/custom/category_bus.png' },
    { name: 'Осваиваюсь', value: 'settling', icon: '/assets/icons/custom/people_settling.png' },
    { name: 'Делюсь опытом', value: 'sharing', icon: '/assets/icons/custom/people_sharing.png' },
    { name: 'Переезжаю дальше', value: 'moving_on', icon: '/assets/icons/custom/people_moving.png' },
  ];

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    
    async function fetchProfiles() {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .neq('id', session?.user?.id || '');

      // Apply Filter
      if (selectedFilter !== 'Все') {
        if (selectedFilter === 'guide') {
          query = query.eq('is_guide', true);
        } else {
          query = query.eq('stage', selectedFilter);
        }
      }

      // Apply Interest Filter
      if (selectedInterest) {
        query = query.contains('interests', [selectedInterest]);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

      if (!error && data) {
        setPeople(data);
        setTotalCount(count || 0);
      }
      setLoading(false);
    }
    
    fetchProfiles();
  }, [session, selectedFilter, selectedInterest, currentPage]);

  useEffect(() => {
    async function fetchStats() {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [totalRes, newcomersRes, guidesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_guide', true)
      ]);

      setStats({
        total: totalRes.count || 0,
        newcomers: newcomersRes.count || 0,
        guides: guidesRes.count || 0
      });
    }

    fetchStats();
  }, [session]);

  const navigate = useNavigate();
  const { openMessageModal } = useMessageModal();
  const [chatLoading, setChatLoading] = useState<string | null>(null);

  const handleMessageClick = async (e: React.MouseEvent, person: Person) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setAuthOpen(true);
      return;
    }

    if (user.id === person.id) {
      alert('Вы не можете написать самому себе.');
      return;
    }

    openMessageModal(person.id, person.display_name || 'Пользователь');
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="bg-warm-milk py-4 md:py-8 px-4 pb-12 md:pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-12"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4 leading-tight">Здесь уже есть люди, которые проходят тот же путь</h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-4xl mx-auto px-2">
            Познакомься с теми, кто сейчас на том же этапе или может помочь советом
          </p>
        </motion.div>

        {/* Interest Selection Dropdown */}
        <div className="mb-6 md:mb-8">
          <div className="relative max-w-sm mx-auto">
            <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-terracotta-deep/50" />
            <select
              value={selectedInterest}
              onChange={(e) => {
                setSelectedInterest(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 md:pl-12 pr-10 py-3.5 md:py-4 bg-white shadow-sm border border-border/50 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 transition-all text-[13px] md:text-sm font-semibold appearance-none cursor-pointer"
            >
              <option value="">🎯 Любой интерес или статус</option>
              {INTEREST_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>
        </div>

        {/* Filters Carousel */}
        <div className="mb-8 md:mb-10 relative w-full overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0" ref={emblaRef}>
          <div className="flex py-2 px-0 scrollbar-hide md:justify-center">
            {filters.map((f) => (
              <div key={f.name} className="flex-shrink-0 px-1">
                <button
                  onClick={() => {
                    setSelectedFilter(f.value);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 h-11 md:h-12 rounded-full whitespace-nowrap text-xs md:text-sm font-bold transition-all duration-300 border shadow-sm ${
                    selectedFilter === f.value
                      ? 'bg-dusty-indigo text-white border-dusty-indigo shadow-md shadow-dusty-indigo/10'
                      : 'bg-white text-muted-foreground hover:bg-soft-sand/40 border-border/60 hover:text-foreground'
                  }`}
                >
                  <img 
                    src={f.icon} 
                    className={`w-5 h-5 md:w-6 md:h-6 object-contain shrink-0 transition-all duration-300 ${
                      selectedFilter === f.value ? 'brightness-0 invert' : ''
                    }`} 
                    alt="" 
                  />
                  <span>{f.name}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dusty-indigo"></div>
          </div>
        ) : !session ? (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 py-12 bg-white/50 backdrop-blur-sm rounded-[32px] border border-white/20 shadow-xl relative overflow-hidden">
              <div className="relative z-10 p-6">
                <div className="w-16 h-16 bg-terracotta-deep/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-terracotta-deep" />
                </div>
                <h1 className="text-3xl font-extrabold text-foreground mb-4">Люди рядом</h1>
                <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                  Присоединяйтесь к сообществу, чтобы видеть анкеты релокантов в вашем городе и находить новых друзей.
                </p>
                <Button 
                  onClick={() => setAuthOpen(true)}
                  className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full px-8 h-12 text-base font-medium shadow-lg"
                >
                  Создать профиль
                </Button>
              </div>
              
              {/* Decorative blurred background */}
              <div className="absolute inset-x-0 -bottom-10 flex justify-center gap-4 opacity-10 pointer-events-none px-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-[24px] border border-border w-64 blur-sm transform rotate-1 flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-32 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[32px] border border-border/50 shadow-sm">
            <div className="w-16 h-16 bg-soft-sand/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">Пока нет пользователей, подходящих под критерии поиска.</p>
            <Button 
              variant="link" 
              onClick={() => { setSelectedFilter('Все'); setSelectedInterest(''); }}
              className="mt-2 text-dusty-indigo"
            >
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {people.map((person, i) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border transition-all shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group flex flex-col h-full ${
                    person.is_guide 
                      ? 'border-warm-olive/30 bg-gradient-to-br from-white to-warm-olive/5' 
                      : 'border-border/40'
                  }`}
                >
                  <div className="flex-grow">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <UserAvatar 
                        src={person.avatar_url} 
                        name={person.display_name} 
                        isGuide={!!person.is_guide} 
                        size="2xl" 
                        className="w-12 h-12 md:w-16 md:h-16 !shadow-sm !border-2 !border-white"
                      >
                        {/* Online status indicator - moved to bottom-left to avoid overlap with guide star */}
                        <div className={`absolute bottom-0 left-0 w-4 h-4 rounded-full border-2 border-white ${
                          person.last_seen && (new Date().getTime() - new Date(person.last_seen).getTime() < 5 * 60 * 1000)
                            ? 'bg-green-500' 
                            : 'bg-amber-400'
                        }`} />
                      </UserAvatar>
                      <div className="flex-1 min-w-0 pt-1">
                        <Link to={`/profile/${person.id}`} className="hover:text-dusty-indigo transition-colors">
                          <h3 className="font-semibold text-base md:text-lg truncate group-hover:text-dusty-indigo transition-colors">
                            {person.display_name || 'Аноним'}
                          </h3>
                        </Link>
                        <p className="text-[12px] md:text-sm font-medium text-muted-foreground mt-0.5">
                          {translateTag(person.stage) || (person.is_guide ? 'Проводник' : 'Участник')}
                        </p>
                      </div>
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{person.city || 'Не указан'}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(person.interests || []).slice(0, 3).map((interest) => (
                        <span
                          key={interest}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-soft-sand/50 text-foreground/70 uppercase tracking-tight"
                        >
                          {translateTag(interest)}
                        </span>
                      ))}
                    </div>

                    {/* Bio snippet */}
                    {person.bio && (
                      <div className="mb-6 h-20 relative overflow-hidden">
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {person.bio}
                        </p>
                        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent" />
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex gap-2 mt-auto relative z-20">
                    <button 
                      onClick={(e) => handleMessageClick(e, person)}
                      disabled={chatLoading === person.id}
                      className={`flex-1 rounded-full h-11 font-bold shadow-sm transition-all flex items-center justify-center cursor-pointer ${
                        person.is_guide
                          ? 'bg-warm-olive hover:bg-warm-olive/90'
                          : 'bg-dusty-indigo hover:bg-dusty-indigo/90'
                      } text-white text-sm`}
                      style={{ pointerEvents: 'auto' }}
                    >
                      {chatLoading === person.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Написать
                        </>
                      )}
                    </button>
                    <Link to={`/profile/${person.id}`}>
                      <Button 
                        variant="outline"
                        className="w-11 h-11 rounded-full border-border/40 text-muted-foreground hover:bg-soft-sand/20 p-0"
                      >
                        <UserIcon className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {!loading && totalCount > 0 && (
              <div className="mt-8 md:mt-12 flex items-center justify-center gap-3 md:gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="rounded-[14px] md:rounded-[16px] px-4 md:px-6 h-10 md:h-12 bg-white text-sm"
                >
                  ← Назад
                </Button>
                <span className="text-xs md:text-sm font-medium text-muted-foreground bg-white px-3 md:px-4 py-2 rounded-full border border-border shadow-sm">
                  Стр. {currentPage}
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage * PAGE_SIZE >= totalCount}
                  className="rounded-[14px] md:rounded-[16px] px-4 md:px-6 h-10 md:h-12 bg-white text-sm"
                >
                  Вперед →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-border/40">
          <div className="bg-white/40 p-6 md:p-8 rounded-[20px] md:rounded-[24px] text-center backdrop-blur-sm">
            <div className="text-2xl md:text-3xl font-extrabold text-terracotta-deep mb-1">{stats.total}</div>
            <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Пользователей</p>
          </div>
          <div className="bg-white/40 p-6 md:p-8 rounded-[20px] md:rounded-[24px] text-center backdrop-blur-sm">
            <div className="text-2xl md:text-3xl font-extrabold text-dusty-indigo mb-1">{stats.newcomers}</div>
            <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Новичков</p>
          </div>
          <div className="bg-white/40 p-6 md:p-8 rounded-[20px] md:rounded-[24px] text-center backdrop-blur-sm">
            <div className="text-2xl md:text-3xl font-extrabold text-warm-olive mb-1">{stats.guides}</div>
            <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Проводников</p>
          </div>
        </div>
      </div>
    </div>
  );
}