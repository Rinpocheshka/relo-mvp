import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Megaphone, Search, Plus, Home, Package, Briefcase, Heart, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router';
import { supabase } from '@/lib/supabaseClient';
import { formatRelativeRu } from '@/lib/date';
import { useAuth } from '../SupabaseAuthProvider';
import { AuthModal } from './AuthWidget';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { AnnouncementDetailsModal } from './AnnouncementDetailsModal';
import { formatPrice } from '@/lib/format';

export interface Announcement {
  id: string;
  title: string;
  category: string;
  description: string;
  author_name: string; // From table
  price_text: string;  // From table
  price_numeric?: number;
  location_text: string; // From table
  created_at: string;
  images: string[];
  author_id: string;
  status: string;
}

export function Announcements() {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [showFilters, setShowFilters] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const PAGE_SIZE = 27;


  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const categories = [
    { name: 'Все', icon: '/assets/icons/custom/luggage.png' },
    { name: 'Жильё', icon: '/assets/icons/custom/category_housing.png' },
    { name: 'Вещи', icon: '/assets/icons/custom/category_stuff.png' },
    { name: 'Услуги', icon: '/assets/icons/custom/category_services.png' },
    { name: 'Документы/визы', icon: '/assets/icons/custom/passport.png' },
    { name: 'Обмен/деньги', icon: '/assets/icons/custom/category_finance.png' },
    { name: 'Бесплатно', icon: '/assets/icons/custom/category_free.png' },
  ];





  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let query = supabase
        .from('announcements')
        .select('*', { count: 'exact' });

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price_asc') {
        query = query.order('price_numeric', { ascending: true, nullsFirst: false });
      } else if (sortBy === 'price_desc') {
        query = query.order('price_numeric', { ascending: false, nullsFirst: false });
      }

      // Apply pagination
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      const mapped: Announcement[] = (data ?? []).map((row) => ({
        id: row.id as string,
        title: (row.title ?? '') as string,
        category: (row.category ?? '') as string,
        description: (row.description ?? '') as string,
        author_name: (row.author_name ?? 'Пользователь') as string,
        price_text: (row.price_text ?? '') as string,
        price_numeric: row.price_numeric as number | undefined,
        location_text: (row.location_text ?? '') as string,
        created_at: (row.created_at ?? '') as string,
        images: (row.images ?? []) as string[],
        author_id: (row.author_id ?? '') as string,
        status: (row.status ?? 'active') as string,
      }));
      setAnnouncements(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось загрузить данные';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [page, sortBy]);

  const filteredAnnouncements = useMemo(() => {
    if (selectedCategory === 'Все') return announcements;
    return announcements.filter((a) => a.category === selectedCategory);
  }, [announcements, selectedCategory]);

  const getSubtitle = () => {
    if (selectedCategory === 'Жильё') return '🏠 Найди свой дом в новом городе';
    if (selectedCategory === 'Услуги') return '💼 Проверенные специалисты рядом';
    if (selectedCategory === 'Вещи') return '📦 Всё необходимое от местных';
    if (selectedCategory === 'Бесплатно') return '💝 Помогай и получай помощь';
    return 'Все предложения от релокантов в одном месте';
  };



  return (
    <div className="min-h-screen bg-warm-milk py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-deep/10 rounded-full mb-3 md:mb-4">
            <img src="/assets/icons/custom/luggage.png" className="w-5 h-5 object-contain" alt="" />
            <span className="text-terracotta-deep font-medium text-sm md:text-base">Объявления</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4">Жильё, вещи, услуги</h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            {getSubtitle()}
          </p>
        </motion.div>

        {/* Categories */}
        <div className="mb-8 relative w-full overflow-visible">
          <div className="flex gap-3 overflow-x-auto py-3 scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 pr-12 md:pr-0">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => {
                    setSelectedCategory(category.name);
                  }}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-full whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === category.name
                      ? 'bg-terracotta-deep text-white shadow-xl shadow-terracotta-deep/20 scale-105 active:scale-95'
                      : 'bg-white text-foreground hover:bg-soft-sand/40 border border-border/60 hover:border-terracotta-deep/30'
                  }`}
                >
                  <img 
                    src={category.icon as string} 
                    className={`w-6 h-6 object-contain transition-all duration-300 ${selectedCategory === category.name ? 'brightness-0 invert' : ''}`} 
                    alt="" 
                  />
                  <span className="font-semibold text-sm">{category.name}</span>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        {/* Housing Article Link */}
        {selectedCategory === 'Жильё' && (
          <div className="mb-6">
            <Link to="/support?article=housing-quirks" className="text-terracotta-deep hover:text-terracotta-deep/80 text-sm font-medium">
              О странностях поиска жилья в Дананге →
            </Link>
          </div>
        )}





        {/* Sorting & Search & Add Button */}
        <div className="flex flex-col gap-3 mb-6 md:mb-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск объявлений..."
              className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-border rounded-[16px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 shadow-sm text-sm md:text-base"
            />
          </div>
          {/* Sort + Button */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-3 md:py-4 bg-white border border-border rounded-[16px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm font-medium shadow-sm cursor-pointer"
            >
              <option value="newest">Сначала новые</option>
              <option value="price_asc">Дешевле</option>
              <option value="price_desc">Дороже</option>
            </select>
            <Button
              onClick={() => user ? setIsCreateModalOpen(true) : setIsAuthModalOpen(true)}
              className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[16px] h-[50px] md:h-[58px] px-4 sm:px-8 shadow-md shadow-terracotta-deep/20 transition-all active:scale-[0.98] text-sm md:text-base whitespace-nowrap"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              Разместить
            </Button>
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {loading && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              Загружаем объявления…
            </div>
          )}
          {!loading && loadError && (
            <div className="col-span-full text-center text-red-600 py-10">
              Ошибка загрузки: {loadError}
            </div>
          )}
          {!loading && !loadError && filteredAnnouncements.map((announcement, i) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                setSelectedAnnouncement(announcement);
                setIsDetailsModalOpen(true);
              }}
              className="bg-white rounded-[16px] md:rounded-[24px] border border-border hover:shadow-xl transition-all cursor-pointer overflow-hidden group flex flex-col h-full active:scale-[0.98]"
            >
              {/* Image */}
              <div className="h-40 sm:h-48 md:h-56 bg-soft-sand/10 relative overflow-hidden">
                {announcement.images && announcement.images.length > 0 ? (
                  <img 
                    src={announcement.images[0]} 
                    alt={announcement.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-soft-sand/30 to-dusty-indigo/20">
                    <Megaphone className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase rounded-full shadow-sm backdrop-blur-md ${
                    announcement.category === 'Жильё' ? 'bg-terracotta-deep/90 text-white' :
                    announcement.category === 'Вещи' ? 'bg-dusty-indigo/90 text-white' :
                    announcement.category === 'Услуги' ? 'bg-warm-olive/90 text-white' :
                    'bg-green-600/90 text-white'
                  }`}>
                    {announcement.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    announcement.category === 'Жильё' ? 'bg-terracotta-deep/10 text-terracotta-deep' :
                    announcement.category === 'Вещи' ? 'bg-dusty-indigo/10 text-dusty-indigo' :
                    announcement.category === 'Услуги' ? 'bg-warm-olive/10 text-warm-olive' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {announcement.category}
                  </span>
                  {announcement.price_text && (
                    <span className="font-bold text-terracotta-deep">{formatPrice(announcement.price_text)}</span>
                  )}
                </div>

                <h3 className="font-semibold text-base md:text-lg mb-2 group-hover:text-terracotta-deep transition-colors">
                  {announcement.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2">
                  {announcement.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>от {announcement.author_name}</span>
                  <span>{formatRelativeRu(new Date(announcement.created_at))}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  📍 {announcement.location_text}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls */}
        {!loading && announcements.length > 0 && (
          <div className="mt-8 md:mt-12 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page === 1}
              className="rounded-[14px] px-4 md:px-6 h-10 md:h-12 bg-white text-sm"
            >
              ← Назад
            </Button>
            <span className="text-sm font-medium text-muted-foreground bg-white px-3 md:px-4 py-2 rounded-full border border-border shadow-sm">
              Стр. {page}
            </span>
            <Button
              variant="outline"
              onClick={() => {
                setPage(p => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={announcements.length < PAGE_SIZE}
              className="rounded-[14px] px-4 md:px-6 h-10 md:h-12 bg-white text-sm"
            >
              Вперед →
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !loadError && filteredAnnouncements.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-soft-sand/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Тут может быть твоё объявление</h3>
            <p className="text-muted-foreground mb-6">
              Поделись тем, что ищешь или предлагаешь — здесь это ценят
            </p>
            <Button 
              onClick={() => user ? setIsCreateModalOpen(true) : setIsAuthModalOpen(true)}
              className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px]"
            >
              <Plus className="w-5 h-5 mr-2" />
              Добавить объявление
            </Button>
          </div>
        )}

        <AuthModal 
          open={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
        
        <CreateAnnouncementModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => void fetchData()}
        />

        <AnnouncementDetailsModal 
          announcement={selectedAnnouncement}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      </div>
    </div>
  );
}
