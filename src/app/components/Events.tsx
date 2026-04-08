import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Search, Plus, Users, MapPin, Clock, Filter, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal states
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<any>(null);

  const handleToggleAttendance = async (event: Event) => {
    if (!user) {
      alert('Пожалуйста, войдите, чтобы записаться на событие');
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
    { name: 'Все', icon: '/assets/icons/custom/kite.png' },
    { name: 'Развлечения', icon: '/assets/icons/custom/kite.png' },
    { name: 'Деловые и язык', icon: '/assets/icons/custom/signpost.png' },
    { name: 'Спорт и экскурсии', icon: '/assets/icons/custom/sandcastle.png' },
    { name: 'Для детей', icon: '/assets/icons/custom/umbrella.png' },
    { name: 'Иное', icon: '/assets/icons/custom/clouds.png' }
  ];

  const timeFilters = ['Все', 'Сегодня', 'Эта неделя', 'Этот месяц', 'Прошедшие'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_participants(user_id)
        `)
        .order('created_at', { ascending: false });

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
    } catch (e) {
      console.error('Fetch error:', e);
      setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const typeMatch = selectedType === 'Все' || event.type === selectedType;
      const searchMatch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      let dateMatch = true;
      if (timeFilter !== 'Все') {
        const eventDate = new Date(event.starts_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (timeFilter === 'Сегодня') {
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          dateMatch = eventDate >= today && eventDate < tomorrow;
        } else if (timeFilter === 'Эта неделя') {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          dateMatch = eventDate >= today && eventDate < nextWeek;
        } else if (timeFilter === 'Этот месяц') {
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          dateMatch = eventDate >= today && eventDate < nextMonth;
        } else if (timeFilter === 'Прошедшие') {
          dateMatch = eventDate < today;
        }
      }

      return typeMatch && searchMatch && dateMatch;
    });
  }, [events, selectedType, searchTerm, timeFilter]);

  const handleCreate = () => {
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
    <div className="min-h-screen bg-warm-milk py-8 pb-32">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dusty-indigo/10 rounded-full mb-4">
            <img src="/assets/icons/custom/kite.png" className="w-5 h-5 object-contain" alt="" />
            <span className="text-dusty-indigo font-medium">Афиша</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">События и встречи</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Находи интересные мероприятия и знакомься с новыми людьми
          </p>
        </motion.div>

        {/* Search & Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск событий..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-border/50 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleCreate}
            size="lg"
            className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[16px] h-[58px] px-8 shadow-lg shadow-terracotta-deep/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Создать событие
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-10 space-y-8">
          {/* Category Filter */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Категория</span>
            </div>
            <div className="relative w-full faded-scroller">
              <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex gap-2.5 pr-12 md:pr-0">
                  {eventTypes.map((type) => (
                    <button
                      key={type.name}
                      onClick={() => setSelectedType(type.name)}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-full whitespace-nowrap transition-all font-bold border ${
                        selectedType === type.name
                          ? 'bg-dusty-indigo text-white border-dusty-indigo shadow-lg shadow-dusty-indigo/20 scale-105 active:scale-95'
                          : 'bg-white text-muted-foreground hover:bg-soft-sand/40 border-border/60 hover:text-foreground shadow-sm'
                      }`}
                    >
                      <img 
                        src={type.icon} 
                        className={`w-6 h-6 object-contain transition-all duration-300 ${selectedType === type.name ? 'brightness-0 invert' : ''}`} 
                        alt="" 
                      />
                      <span className="text-sm">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Time Filter */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Когда</span>
            </div>
            <div className="relative w-full faded-scroller">
              <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex gap-2.5 pr-12 md:pr-0">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`px-6 py-3 rounded-full whitespace-nowrap transition-all font-bold border ${
                        timeFilter === filter
                          ? 'bg-warm-olive text-white border-warm-olive shadow-lg shadow-warm-olive/20 scale-105 active:scale-95'
                          : 'bg-white text-muted-foreground hover:bg-soft-sand/40 border-border/60 hover:text-foreground shadow-sm'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          {!loading && !loadError && filteredEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleCardClick(event)}
              className="bg-white rounded-[32px] border border-border/40 hover:shadow-xl transition-all cursor-pointer group overflow-hidden flex flex-col h-full shadow-sm hover:-translate-y-1 active:scale-[0.98]"
            >
              <div className="relative h-48 sm:h-56 overflow-hidden">
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

              <div className="p-6 flex flex-col flex-1 gap-3">
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
                <h3 className="font-bold text-xl text-dusty-indigo leading-tight group-hover:underline decoration-dusty-indigo/30 transition-all line-clamp-1">
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
                    className={`rounded-2xl px-5 h-10 font-bold text-sm shadow-md transition-all active:scale-[0.97] ${
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

        {/* Empty State */}
        {!loading && !loadError && filteredEvents.length === 0 && (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-16">
            <div className="bg-white p-8 rounded-[32px] border border-border/40 text-center shadow-sm">
              <div className="text-4xl font-black text-dusty-indigo mb-2">{events.length}</div>
              <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">Мероприятий</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-border/40 text-center shadow-sm">
              <div className="text-4xl font-black text-terracotta-deep mb-2">
                {events.reduce((sum, e) => sum + e.attendees, 0)}
              </div>
              <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">Участников</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-border/40 text-center shadow-sm">
              <div className="text-4xl font-black text-warm-olive mb-2">
                {events.filter(e => e.price.toLowerCase().includes('бесплатно')).length}
              </div>
              <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">Бесплатных встреч</p>
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
        />
      )}

      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        eventToEdit={eventToEdit}
        onSuccess={fetchData}
      />
    </div>
  );
}