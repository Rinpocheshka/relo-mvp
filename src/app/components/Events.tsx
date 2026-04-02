import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Search, Plus, Users, MapPin, Clock, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { formatRelativeRu } from '@/lib/date';

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  attendees: number;
  maxAttendees?: number;
  description: string;
  price: string;
}

export function Events() {
  const [selectedType, setSelectedType] = useState('Все');
  const [timeFilter, setTimeFilter] = useState('Все');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const eventTypes = [
    'Все',
    'Развлечения',
    'Деловые и язык',
    'Спорт и экскурсии',
    'Для детей',
  ];

  const timeFilters = ['Все', 'Сегодня', 'Эта неделя', 'Этот месяц'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id,type,title,description,starts_at,location_text,organizer_name,price_text,max_attendees,created_at')
          .order('starts_at', { ascending: true, nullsFirst: false });

        if (error) throw error;

        const mapped: Event[] = (data ?? []).map((row) => {
          const startsAt = row.starts_at ? new Date(row.starts_at as string) : null;
          return {
            id: row.id as string,
            title: (row.title ?? '') as string,
            type: (row.type ?? '') as string,
            date: startsAt ? startsAt.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }) : (row.created_at ? formatRelativeRu(new Date(row.created_at as string)) : ''),
            time: startsAt ? startsAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '',
            location: (row.location_text ?? '') as string,
            organizer: (row.organizer_name ?? 'Организатор') as string,
            attendees: 0,
            maxAttendees: (row.max_attendees ?? undefined) as number | undefined,
            description: (row.description ?? '') as string,
            price: (row.price_text ?? 'Бесплатно') as string,
          };
        });
        setEvents(mapped);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Не удалось загрузить данные';
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const typeMatch = selectedType === 'Все' || event.type === selectedType;
      return typeMatch;
    });
  }, [events, selectedType]);

  return (
    <div className="min-h-screen bg-warm-milk py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dusty-indigo/10 rounded-full mb-4">
            <Calendar className="w-5 h-5 text-dusty-indigo" />
            <span className="text-dusty-indigo font-medium">Афиша</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">События и встречи</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Находи интересные мероприятия и знакомься с людьми
          </p>
        </motion.div>

        {/* Search & Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск событий..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-[16px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20"
            />
          </div>
          <Button 
            size="lg"
            className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px] whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" />
            Создать событие
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Тип события:</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {eventTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-[12px] whitespace-nowrap transition-all ${
                    selectedType === type
                      ? 'bg-dusty-indigo text-white shadow-md'
                      : 'bg-white text-foreground hover:bg-soft-sand/30 border border-border'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Когда:</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {timeFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-2 rounded-[12px] whitespace-nowrap transition-all ${
                    timeFilter === filter
                      ? 'bg-warm-olive text-white shadow-md'
                      : 'bg-white text-foreground hover:bg-soft-sand/30 border border-border'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              Загружаем события…
            </div>
          )}
          {!loading && loadError && (
            <div className="col-span-full text-center text-red-600 py-10">
              Ошибка загрузки: {loadError}
            </div>
          )}
          {!loading && !loadError && filteredEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[16px] border border-border hover:shadow-md transition-all cursor-pointer group overflow-hidden"
            >
              {/* Image Placeholder with gradient */}
              <div className={`h-40 bg-gradient-to-br ${
                event.type === 'Встречи' ? 'from-terracotta-deep/20 to-dusty-indigo/20' :
                event.type === 'Спорт' ? 'from-warm-olive/20 to-terracotta-deep/20' :
                event.type === 'Культура' ? 'from-dusty-indigo/20 to-warm-olive/20' :
                event.type === 'Обучение' ? 'from-warm-olive/30 to-soft-sand/30' :
                event.type === 'Нетворкинг' ? 'from-terracotta-deep/30 to-warm-olive/20' :
                'from-dusty-indigo/20 to-terracotta-deep/20'
              } group-hover:scale-105 transition-transform`}></div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    event.type === 'Встречи' ? 'bg-terracotta-deep/10 text-terracotta-deep' :
                    event.type === 'Спорт' ? 'bg-warm-olive/10 text-warm-olive' :
                    event.type === 'Культура' ? 'bg-dusty-indigo/10 text-dusty-indigo' :
                    event.type === 'Обучение' ? 'bg-warm-olive/20 text-warm-olive' :
                    'bg-terracotta-deep/10 text-terracotta-deep'
                  }`}>
                    {event.type}
                  </span>
                  <span className={`font-semibold text-sm ${
                    event.price === 'Бесплатно' ? 'text-green-600' : 'text-foreground'
                  }`}>
                    {event.price}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-2 group-hover:text-dusty-indigo transition-colors">
                  {event.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{event.date}, {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {event.attendees} участников
                      {event.maxAttendees && ` / ${event.maxAttendees}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">от {event.organizer}</span>
                  <Button 
                    size="sm"
                    className="bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-[12px]"
                  >
                    Я пойду!
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {!loading && !loadError && filteredEvents.length === 0 && (
          <div className="bg-white border border-border/80 rounded-[16px] p-12 text-center my-8">
            <div className="w-20 h-20 bg-soft-sand/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-dusty-indigo" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Событий пока нет</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Самое время проявить инициативу. Создайте встречу, и к вам обязательно присоединятся.
            </p>
            <Button className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px] px-8">
              <Plus className="w-5 h-5 mr-2" />
              Создать событие
            </Button>
          </div>
        )}

        {events.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 my-12">
            <div className="bg-white p-6 rounded-[16px] border border-border text-center">
              <div className="text-3xl font-bold text-dusty-indigo mb-2">{events.length}</div>
              <p className="text-muted-foreground">Событий на этой неделе</p>
            </div>
            <div className="bg-white p-6 rounded-[16px] border border-border text-center">
              <div className="text-3xl font-bold text-terracotta-deep mb-2">
                {events.reduce((sum, e) => sum + e.attendees, 0)}
              </div>
              <p className="text-muted-foreground">Участников</p>
            </div>
            <div className="bg-white p-6 rounded-[16px] border border-border text-center">
              <div className="text-3xl font-bold text-warm-olive mb-2">
                {events.filter(e => e.price === 'Бесплатно').length}
              </div>
              <p className="text-muted-foreground">Бесплатных событий</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}