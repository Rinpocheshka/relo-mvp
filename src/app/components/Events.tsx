import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Search, Plus, Users, MapPin, Clock, Filter, CheckCircle } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
import { AuthModal } from './AuthWidget';
import { EventDetailsModal } from './EventDetailsModal';
import { EventFormModal } from './EventFormModal';
import { formatPrice } from '@/lib/format';

interface Event {
  id: string;
  title: string;
  type: string;
  starts_at: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  organizer_id?: string;
  attendees: number;
  maxAttendees?: number;
  description: string;
  price: string;
  images: string[];
  is_attending?: boolean;
}

export function Events() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('Все');
  const [timeFilter, setTimeFilter] = useState('Все');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 30;

  // Modal states
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<any>(null);

  const [emblaRef] = useEmblaCarousel({ 
    loop: true, 
    align: 'start',
    dragFree: true
  });

  const handleToggleAttendance = async (event: Event) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      if (event.is_attending) {
        await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);
      } else {
        // Optional: Check max attendees if needed
        if (event.maxAttendees && event.attendees >= event.maxAttendees) {
          alert('Извините, мест больше нет');
          return;
        }
        await supabase
          .from('event_participants')
          .insert([{ event_id: event.id, user_id: user.id }]);
      }
      fetchData();
    } catch (e) {
      console.error('Attendance toggle error:', e);
    }
  };

  const eventTypes = [
    { name: 'Все', icon: '/assets/icons/custom/events_all.png' },
    { name: 'Развлечения', icon: '/assets/icons/custom/events_entertainment.png' },
    { name: 'Деловые и язык', icon: '/assets/icons/custom/events_business.png' },
    { name: 'Спорт и экскурсии', icon: '/assets/icons/custom/events_sport.png' },
    { name: 'Для детей', icon: '/assets/icons/custom/events_kids.png' },
    { name: 'Иное', icon: '/assets/icons/custom/events_other.png' }
  ];

  const timeFilters = ['Все', 'Сегодня', 'Эта неделя', 'Этот месяц', 'Прошедшие'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          event_participants(user_id)
        `, { count: 'exact' });

      // Apply filters
      if (selectedType !== 'Все') {
        query = query.eq('type', selectedType);
      }

      if (timeFilter !== 'Все') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (timeFilter === 'Сегодня') {
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          query = query.gte('starts_at', today.toISOString()).lt('starts_at', tomorrow.toISOString());
        } else if (timeFilter === 'Эта неделя') {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          query = query.gte('starts_at', today.toISOString()).lt('starts_at', nextWeek.toISOString());
        } else if (timeFilter === 'Этот месяц') {
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          query = query.gte('starts_at', today.toISOString()).lt('starts_at', nextMonth.toISOString());
        } else if (timeFilter === 'Прошедшие') {
          query = query.lt('starts_at', today.toISOString());
        }
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

      if (error) throw error;

      const mapped: Event[] = (data ?? []).map((row: any) => {
        const startsAt = row.starts_at ? new Date(row.starts_at) : new Date();
        const participants = row.event_participants || [];
        return {
          id: row.id,
          title: row.title || '',
          type: row.type || '',
          starts_at: row.starts_at,
          date: startsAt.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }),
          time: startsAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          location: row.location_text || '',
          organizer: row.organizer_name || 'Организатор',
          organizer_id: row.organizer_id,
          attendees: participants.length,
          maxAttendees: row.max_attendees,
          description: row.description || '',
          price: row.price_text || 'Бесплатно',
          images: row.images || [],
          is_attending: user ? participants.some((p: any) => p.user_id === user.id) : false,
        };
      });
      setEvents(mapped);
      setTotalCount(count || 0);
    } catch (e) {
      console.error('Fetch error:', e);
      setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, selectedType, timeFilter, PAGE_SIZE]);

  useEffect(() => {
    fetchData();
  }, [fetchData, currentPage, selectedType, timeFilter]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, timeFilter]);

  const handleCreate = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setEventToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEventToEdit(event);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  const handleCardClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  return (
    <div className="bg-warm-milk py-4 md:py-8 pb-12 md:pb-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-12"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4">События и встречи</h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Находи интересные мероприятия и знакомься с новыми людьми
          </p>
        </motion.div>



        {/* Filters */}
        <div className="mb-6 md:mb-10 space-y-6 md:space-y-8">
          {/* Category Filter */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Категория</span>
            </div>
            <div className="relative w-full overflow-hidden -mx-4 uppercase" ref={emblaRef}>
              <div className="flex gap-2 py-2 px-4 scrollbar-hide">
                {eventTypes.map((type) => (
                  <div key={type.name} className="flex-shrink-0">
                    <button
                      onClick={() => setSelectedType(type.name)}
                      className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full whitespace-nowrap transition-all font-bold border shadow-sm ${
                        selectedType === type.name
                          ? 'bg-dusty-indigo text-white border-dusty-indigo shadow-md shadow-dusty-indigo/10'
                          : 'bg-white text-muted-foreground hover:bg-soft-sand/40 border-border/60 hover:text-foreground'
                      }`}
                    >
                      <img 
                        src={type.icon} 
                        className={`w-5 h-5 sm:w-6 sm:h-6 object-contain transition-all duration-300 ${selectedType === type.name ? 'brightness-0 invert' : ''}`} 
                        alt="" 
                      />
                      <span className="text-xs sm:text-sm">{type.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
            <div className="space-y-3 md:space-y-4 flex-1">
              <div className="flex items-center gap-2 px-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Когда</span>
              </div>
              <div className="relative w-full overflow-visible -mx-4">
                <div className="flex gap-2.5 overflow-x-auto py-2 px-4 scrollbar-hide">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`flex-shrink-0 px-5 md:px-6 py-2.5 sm:py-3 rounded-full whitespace-nowrap transition-all font-bold border shadow-sm ${
                        timeFilter === filter
                          ? 'bg-warm-olive text-white border-warm-olive shadow-md shadow-warm-olive/10'
                          : 'bg-white text-muted-foreground hover:bg-soft-sand/40 border-border/60 hover:text-foreground'
                      }`}
                    >
                      <span className="text-xs sm:text-sm">{filter}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleCreate}
              className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[16px] md:rounded-[20px] h-[52px] md:h-[58px] px-6 md:px-8 shadow-lg shadow-terracotta-deep/20 transition-all active:scale-95 mb-0 md:mb-4 shrink-0 text-sm md:text-base font-bold"
            >
              <Plus className="w-5 h-5 mr-1 md:mr-2" />
              Создать событие
            </Button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {loading && (
            <div className="col-span-full text-center text-muted-foreground py-20 flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-terracotta-deep/20 border-t-terracotta-deep rounded-full animate-spin mb-4" />
              <p className="font-medium">Загружаем события...</p>
            </div>
          )}
          {!loading && loadError && (
            <div className="col-span-full text-center py-20 bg-red-50 rounded-[32px] border border-red-100">
               <p className="text-red-600 font-bold mb-2">Ошибка загрузки</p>
               <p className="text-red-500 text-sm">{loadError}</p>
            </div>
          )}
          {!loading && !loadError && events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleCardClick(event)}
              className="bg-white rounded-[24px] md:rounded-[32px] border border-border/40 hover:shadow-xl transition-all cursor-pointer group overflow-hidden flex flex-col h-full shadow-sm hover:-translate-y-1 active:scale-[0.98]"
            >
              <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden">
                {event.images && event.images.length > 0 ? (
                  <img 
                    src={event.images[0]} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${
                    event.type === 'Развлечения' ? 'from-terracotta-deep/20 to-dusty-indigo/20' :
                    event.type === 'Спорт и экскурсии' ? 'from-warm-olive/20 to-terracotta-deep/20' :
                    'from-dusty-indigo/20 to-terracotta-deep/20'
                  } group-hover:scale-105 transition-transform duration-700`} />
                )}
              </div>

              <div className="p-4 md:p-6 flex flex-col flex-1 gap-2 md:gap-3">
                {/* Category & Price */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-soft-sand/80 text-terracotta-deep text-[10px] font-bold tracking-widest uppercase rounded-full border border-terracotta-deep/5">
                    {event.type === 'Развлечения' ? 'Встречи' : event.type}
                  </span>
                  <span className={`font-bold text-sm ${
                    event.price === 'Бесплатно' ? 'text-green-600' : 'text-foreground'
                  }`}>
                    {formatPrice(event.price)}
                  </span>
                </div>
                <h3 className="font-bold text-lg md:text-xl text-dusty-indigo leading-tight group-hover:underline decoration-dusty-indigo/30 transition-all line-clamp-1">
                  {event.title}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {event.description}
                </p>

                {/* Event Details List */}
                <div className="py-2 space-y-2">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground/80 font-medium italic">
                    <Calendar className="w-4 h-4 opacity-70" />
                    <span>{event.date}, {event.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground/80 font-medium italic">
                    <MapPin className="w-4 h-4 opacity-70" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground/80 font-medium italic">
                    <Users className="w-4 h-4 opacity-70" />
                    <span>{event.attendees} участников {event.maxAttendees ? `/ ${event.maxAttendees}` : ''}</span>
                  </div>
                </div>

                {/* Footer Organizer & Join Button */}
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/30">
                  <span className="text-xs text-muted-foreground font-medium italic">
                    от {event.organizer}
                  </span>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleAttendance(event);
                    }}
                    className={`rounded-xl md:rounded-2xl px-4 md:px-5 h-9 md:h-10 font-bold text-xs md:text-sm shadow-md transition-all active:scale-[0.97] ${
                      event.is_attending
                        ? 'bg-soft-sand text-dusty-indigo hover:bg-soft-sand/80 shadow-soft-sand/10'
                        : 'bg-dusty-indigo text-white hover:bg-dusty-indigo/90 shadow-dusty-indigo/20'
                    }`}
                  >
                    {event.is_attending ? 'Я иду' : 'Я пойду!'}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls */}
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

        {/* Empty State */}
        {!loading && !loadError && events.length === 0 && (
          <div className="bg-white border border-border/40 rounded-[32px] p-16 text-center my-8 shadow-sm">
            <div className="w-24 h-24 bg-soft-sand/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-dusty-indigo/40" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Событий пока нет</h3>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
              Самое время проявить инициативу. Создайте встречу, и к вам обязательно присоединятся.
            </p>
            <Button 
              onClick={handleCreate}
              className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full px-10 h-14 font-bold text-lg shadow-lg shadow-terracotta-deep/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              Создать событие
            </Button>
          </div>
        )}

        {/* Stats */}
        {events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 my-10 md:my-16">
            <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-border/40 text-center shadow-sm">
              <div className="text-3xl md:text-4xl font-black text-dusty-indigo mb-1 md:mb-2">{events.length}</div>
              <p className="text-[10px] md:text-sm text-muted-foreground font-bold uppercase tracking-widest">Мероприятий</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-border/40 text-center shadow-sm">
              <div className="text-3xl md:text-4xl font-black text-terracotta-deep mb-1 md:mb-2">
                {events.reduce((sum, e) => sum + e.attendees, 0)}
              </div>
              <p className="text-[10px] md:text-sm text-muted-foreground font-bold uppercase tracking-widest">Участников</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-border/40 text-center shadow-sm">
              <div className="text-3xl md:text-4xl font-black text-warm-olive mb-1 md:mb-2">
                {events.filter(e => e.price.toLowerCase().includes('бесплатно')).length}
              </div>
              <p className="text-[10px] md:text-sm text-muted-foreground font-bold uppercase tracking-widest">Бесплатных встреч</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedEvent && (
        <EventDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          event={selectedEvent}
          onJoined={fetchData}
          onLeft={fetchData}
          onDeleted={fetchData}
          onEdited={() => handleEdit(selectedEvent)}
          onAuthRequired={() => setIsAuthModalOpen(true)}
        />
      )}

      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        eventToEdit={eventToEdit}
        onSuccess={fetchData}
      />

      <AuthModal 
        open={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}