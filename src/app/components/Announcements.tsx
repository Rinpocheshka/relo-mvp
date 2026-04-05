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

interface Announcement {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  description: string;
  author: string;
  price?: string;
  price_numeric?: number;
  location: string;
  date: string;
  images: string[];
}

export function Announcements() {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const PAGE_SIZE = 50;
  const [housingFilters, setHousingFilters] = useState({
    format: [] as string[],
    size: [] as string[],
    district: [] as string[],
    term: [] as string[],
  });

  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const categories = [
    { name: 'Все', icon: Megaphone },
    { name: 'Жильё', icon: Home },
    { name: 'Вещи', icon: Package },
    { name: 'Услуги', icon: Briefcase },
    { name: 'Бесплатно', icon: Heart },
  ];

  const itemsSubcategories = [
    'Для дома',
    'Одежда, обувь, аксессуары',
    'Для детей',
    'Спорт, хобби',
    'Авто, мото',
    'Красота и здоровье',
    'Другое',
  ];

  const housingFilterOptions = {
    format: ['Квартира', 'Дом', 'Отель', 'Бесплатное жилье (Couchsurfing)'],
    size: ['Комната', 'Студия', '1 спальня', '2 спальни', '3 и более спален'],
    district: [
      'My An (Туристический)',
      'Hai Chau (Центральный)',
      'Son Tra (Прибрежный)',
      'Ngu Hanh Son (Мраморные горы)',
      'Thanh Khe (Вьетнамский центр)',
      'Cam Le (Отдаленный)',
      'Hoa Vang (Пригород)',
    ],
    term: ['2 недели', '1 месяц', '3 месяца', '6 месяцев', 'Год'],
  };

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
        subcategory: (row.subcategory ?? undefined) as string | undefined,
        description: (row.description ?? '') as string,
        author: (row.author_name ?? 'Пользователь') as string,
        price: (row.price_text ?? undefined) as string | undefined,
        price_numeric: row.price_numeric as number | undefined,
        location: (row.location_text ?? '') as string,
        date: row.created_at ? formatRelativeRu(new Date(row.created_at as string)) : '',
        images: (row.images ?? []) as string[],
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
    if (selectedSubcategory) {
      return announcements.filter(
        (a) => a.category === selectedCategory && a.subcategory === selectedSubcategory,
      );
    }
    return announcements.filter((a) => a.category === selectedCategory);
  }, [announcements, selectedCategory, selectedSubcategory]);

  const getSubtitle = () => {
    if (selectedCategory === 'Жильё') return '🏠 Найди свой дом в новом городе';
    if (selectedCategory === 'Услуги') return '💼 Проверенные специалисты рядом';
    if (selectedCategory === 'Вещи') return '📦 Всё необходимое от местных';
    if (selectedCategory === 'Бесплатно') return '💝 Помогай и получай помощь';
    return 'Все предложения от релокантов в одном месте';
  };

  const toggleFilter = (filterType: keyof typeof housingFilters, value: string) => {
    setHousingFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value],
    }));
  };

  return (
    <div className="min-h-screen bg-warm-milk py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-deep/10 rounded-full mb-4">
            <Megaphone className="w-5 h-5 text-terracotta-deep" />
            <span className="text-terracotta-deep font-medium">Объявления</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Жильё, вещи, услуги</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {getSubtitle()}
          </p>
        </motion.div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => {
                    setSelectedCategory(category.name);
                    setSelectedSubcategory('');
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-[12px] whitespace-nowrap transition-all ${
                    selectedCategory === category.name
                      ? 'bg-terracotta-deep text-white shadow-md'
                      : 'bg-white text-foreground hover:bg-soft-sand/30 border border-border'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{category.name}</span>
                </button>
              );
            })}
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

        {/* Housing Filters */}
        {selectedCategory === 'Жильё' && (
          <div className="mb-8 bg-white p-6 rounded-[16px] border border-border">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium mb-4 hover:text-terracotta-deep transition-colors"
            >
              Фильтры
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {showFilters && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Format Filter */}
                <div>
                  <h4 className="font-medium mb-3 text-sm">Формат</h4>
                  <div className="space-y-2">
                    {housingFilterOptions.format.map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={housingFilters.format.includes(option)}
                          onChange={() => toggleFilter('format', option)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Size Filter */}
                <div>
                  <h4 className="font-medium mb-3 text-sm">Размер</h4>
                  <div className="space-y-2">
                    {housingFilterOptions.size.map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={housingFilters.size.includes(option)}
                          onChange={() => toggleFilter('size', option)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* District Filter */}
                <div>
                  <h4 className="font-medium mb-3 text-sm">Район</h4>
                  <div className="space-y-2">
                    {housingFilterOptions.district.map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={housingFilters.district.includes(option)}
                          onChange={() => toggleFilter('district', option)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Term Filter */}
                <div>
                  <h4 className="font-medium mb-3 text-sm">Срок</h4>
                  <div className="space-y-2">
                    {housingFilterOptions.term.map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={housingFilters.term.includes(option)}
                          onChange={() => toggleFilter('term', option)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items Subcategories */}
        {selectedCategory === 'Вещи' && (
          <div className="mb-8">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedSubcategory('')}
                className={`px-4 py-2 rounded-[12px] whitespace-nowrap text-sm transition-all ${
                  !selectedSubcategory
                    ? 'bg-terracotta-deep/10 text-terracotta-deep font-medium'
                    : 'bg-white text-foreground hover:bg-soft-sand/30 border border-border'
                }`}
              >
                Все вещи
              </button>
              {itemsSubcategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-4 py-2 rounded-[12px] whitespace-nowrap text-sm transition-all ${
                    selectedSubcategory === sub
                      ? 'bg-terracotta-deep/10 text-terracotta-deep font-medium'
                      : 'bg-white text-foreground hover:bg-soft-sand/30 border border-border'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sorting & Search & Add Button */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск объявлений..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-[16px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-4 bg-white border border-border rounded-[16px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm font-medium shadow-sm cursor-pointer min-w-[160px]"
              >
                <option value="newest">Сначала новые</option>
                <option value="price_asc">Дешевле</option>
                <option value="price_desc">Дороже</option>
              </select>
              <Button
                size="lg"
                onClick={() => user ? setIsCreateModalOpen(true) : setIsAuthModalOpen(true)}
                className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[16px] h-[58px] px-8 shadow-md shadow-terracotta-deep/20 transition-all active:scale-[0.98]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Разместить
              </Button>
            </div>
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              className="bg-white rounded-[24px] border border-border hover:shadow-xl transition-all cursor-pointer overflow-hidden group flex flex-col h-full active:scale-[0.98]"
            >
              {/* Image */}
              <div className="h-56 bg-soft-sand/10 relative overflow-hidden">
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
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    announcement.category === 'Жильё' ? 'bg-terracotta-deep/10 text-terracotta-deep' :
                    announcement.category === 'Вещи' ? 'bg-dusty-indigo/10 text-dusty-indigo' :
                    announcement.category === 'Услуги' ? 'bg-warm-olive/10 text-warm-olive' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {announcement.category}
                  </span>
                  {announcement.price && (
                    <span className="font-bold text-terracotta-deep">{announcement.price}</span>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2 group-hover:text-terracotta-deep transition-colors">
                  {announcement.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {announcement.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>от {announcement.author}</span>
                  <span>{announcement.date}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  📍 {announcement.location}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls */}
        {!loading && announcements.length > 0 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page === 1}
              className="rounded-[16px] px-6 h-12 bg-white"
            >
              ← Назад
            </Button>
            <span className="text-sm font-medium text-muted-foreground bg-white px-4 py-2 rounded-full border border-border shadow-sm">
              Страница {page}
            </span>
            <Button
              variant="outline"
              onClick={() => {
                setPage(p => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={announcements.length < PAGE_SIZE}
              className="rounded-[16px] px-6 h-12 bg-white"
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
