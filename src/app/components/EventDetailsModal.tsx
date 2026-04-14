import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { X, Calendar, MapPin, Clock, Users, MessageCircle, Trash2, ShieldCheck, AlertTriangle, Edit, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
import { formatPrice } from '@/lib/format';
import { getOrCreateChat } from '@/lib/chatUtils';
import { useNavigate } from 'react-router';

interface Event {
  id: string;
  title: string;
  type: string;
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
  starts_at: string;
}

interface Participant {
  user_id: string;
  profiles: {
    avatar_url: string | null;
    display_name: string | null;
  };
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onJoined?: () => void;
  onLeft?: () => void;
  onDeleted?: () => void;
  onEdited?: (event: Event) => void;
}

export function EventDetailsModal({
  isOpen,
  onClose,
  event,
  onJoined,
  onLeft,
  onDeleted,
  onEdited
}: EventDetailsModalProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOrganizer = user && event.organizer_id === user.id;
  const isAdmin = profile?.role === 'admin';
  const canManage = isOrganizer || isAdmin;

  useEffect(() => {
    if (isOpen && event.id) {
      fetchParticipants();
    }
  }, [isOpen, event.id, user]);

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          user_id,
          profiles:user_id (
            avatar_url,
            display_name
          )
        `)
        .eq('event_id', event.id);

      if (error) throw error;
      
      const typedData = (data || []) as unknown as Participant[];
      setParticipants(typedData);
      setIsAttending(typedData.some(p => p.user_id === user?.id));
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const handleJoinToggle = async () => {
    if (!user) return; // Should show auth modal ideally
    setLoading(true);
    try {
      if (isAttending) {
        const { error } = await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);
        if (error) throw error;
        onLeft?.();
      } else {
        const { error } = await supabase
          .from('event_participants')
          .insert({ event_id: event.id, user_id: user.id });
        if (error) throw error;
        onJoined?.();
      }
      await fetchParticipants();
    } catch (err) {
      console.error('Error toggling attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    alert('Шаг 1: Кнопка нажата! ID организатора: ' + (event?.organizer_id || 'Отсутствует'));
    
    if (!user) {
      alert('Пожалуйста, войдите в систему.');
      return;
    }

    if (!event.organizer_id) {
      alert('Ошибка: ID организатора не найден.');
      return;
    }

    if (user.id === event.organizer_id) {
      alert('Вы организатор этого события.');
      return;
    }

    setChatLoading(true);
    try {
      console.log('DEBUG: Calling getOrCreateChat from EventModal...');
      const chatId = await getOrCreateChat(user.id, event.organizer_id);
      console.log('DEBUG: Chat result:', chatId);
      
      if (chatId) {
        navigate(`/messages/${chatId}`);
      } else {
        alert('Не удалось начать чат (в базе вернулся null). Проверьте консоль.');
      }
    } catch (err: any) {
      console.error('DEBUG: Catch error:', err);
      alert('Ошибка при создании чата: ' + (err.message || 'Unknown'));
    } finally {
      setChatLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canManage || !window.confirm('Вы уверены, что хотите удалить это событие?')) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);
      
      if (error) throw error;
      onDeleted?.();
      onClose();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Не удалось удалить событие');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-full max-h-[85dvh] lg:max-h-[85vh] mb-4 lg:mb-0"
          >
            {/* Left Column (Images) - Desktop only (fixed area) */}
            <div className="relative h-48 sm:h-64 md:h-80 lg:h-auto lg:w-[42%] bg-soft-sand/10 shrink-0">
              {event.images && event.images.length > 0 ? (
                <img src={event.images[0]} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${
                  event.type === 'Развлечения' ? 'from-terracotta-deep/20 to-dusty-indigo/20' :
                  event.type === 'Спорт и экскурсии' ? 'from-warm-olive/20 to-terracotta-deep/20' :
                  'from-dusty-indigo/20 to-terracotta-deep/20'
                }`} />
              )}
              
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors lg:hidden z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-6 left-6 flex gap-2 hidden lg:flex">
                 <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm text-terracotta-deep text-[10px] font-bold tracking-widest uppercase rounded-full border border-terracotta-deep/20 shadow-sm">
                  {event.type}
                </span>
              </div>
              
              <div className="absolute top-4 left-4 flex gap-2 lg:hidden">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-terracotta-deep text-[10px] font-bold tracking-widest uppercase rounded-full border border-terracotta-deep/20 shadow-sm">
                  {event.type}
                </span>
              </div>
            </div>

            {/* Right Column (Content) */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white relative">
              {/* Desktop Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-soft-sand/30 text-muted-foreground rounded-full transition-colors hidden lg:flex z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-10 custom-scrollbar lg:pt-12 min-h-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3 leading-[1.1] tracking-tight">
                      {event.title}
                    </h2>
                    <div className="flex items-center gap-3 text-muted-foreground text-sm">
                      <span className="font-bold text-terracotta-deep bg-terracotta-deep/5 px-3 py-1 rounded-lg">от {event.organizer}</span>
                      {isAdmin && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg uppercase tracking-tighter border border-red-100">
                          <ShieldCheck className="w-3.5 h-3.5" /> Администратор
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-terracotta-deep text-white px-5 py-3 rounded-2xl shrink-0 flex items-center gap-2 shadow-lg shadow-terracotta-deep/20">
                    <Wallet className="w-5 h-5" />
                    <span className="text-2xl font-black whitespace-nowrap">
                      {formatPrice(event.price)}
                    </span>
                  </div>
                </div>

                {/* Event Details Grid - 2 columns always on large */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                  <div className="flex items-center gap-4 p-4 bg-soft-sand/20 rounded-2xl border border-border/5">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md text-terracotta-deep">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 mb-0.5">Дата</p>
                      <p className="font-black text-base text-foreground/90">{event.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-soft-sand/20 rounded-2xl border border-border/5">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md text-terracotta-deep">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 mb-0.5">Время</p>
                      <p className="font-black text-base text-foreground/90">{event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-soft-sand/20 rounded-2xl border border-border/5">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md text-terracotta-deep shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 mb-0.5">Место</p>
                      <p className="font-black text-base text-foreground/90 break-words leading-tight">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-soft-sand/20 rounded-2xl border border-border/5">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md text-terracotta-deep">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 mb-0.5">Поместится</p>
                      <p className="font-black text-base text-foreground/90">
                        {participants.length} {event.maxAttendees ? `/ ${event.maxAttendees}` : 'безлимитно'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4 px-1">
                     <div className="w-1 h-4 bg-terracotta-deep rounded-full" />
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Описание</h3>
                  </div>
                  <div className="text-foreground/90 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                    {event.description}
                  </div>
                </div>

                {/* Participants Avatars */}
                {participants.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-5 px-1">
                       <div className="w-1 h-4 bg-dusty-indigo rounded-full" />
                       <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Идут на встречу</h3>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {participants.slice(0, 12).map((p, idx) => (
                        <Link 
                          key={p.user_id || idx} 
                          to={`/profile/${p.user_id}`}
                          onClick={onClose}
                          className="group relative" 
                          title={p.profiles?.display_name || 'Anonymous'}
                        >
                           {p.profiles?.avatar_url ? (
                              <img 
                                src={p.profiles.avatar_url} 
                                className="w-12 h-12 rounded-2xl border-2 border-white shadow-md object-cover transition-all group-hover:-translate-y-1 group-hover:scale-105 active:scale-95" 
                                alt="participant"
                              />
                           ) : (
                              <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-md bg-soft-sand text-dusty-indigo flex items-center justify-center text-sm font-black transition-all group-hover:-translate-y-1 group-hover:scale-105 active:scale-95">
                                {(p.profiles?.display_name || 'U').charAt(0)}
                              </div>
                           )}
                        </Link>
                      ))}
                      {participants.length > 12 && (
                        <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-md bg-warm-milk flex items-center justify-center text-xs font-black text-muted-foreground">
                          +{participants.length - 12}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 pb-8 sm:p-6 sm:pb-6 bg-white border-t border-border/50 flex flex-col sm:flex-row gap-3 shrink-0 safe-area-bottom">
                {!user ? (
                  <div className="flex-1 flex items-center gap-3 p-3 bg-red-50 rounded-2xl">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700 font-medium leading-tight">
                      Пожалуйста, войдите в систему, чтобы записываться на события.
                    </p>
                  </div>
                  <div className="flex-1 flex gap-2 w-full">
                    <Button
                      onClick={handleJoinToggle}
                      disabled={loading || (!!event.maxAttendees && participants.length >= event.maxAttendees && !isAttending)}
                      className={`flex-1 h-14 rounded-2xl font-bold text-lg shadow-lg shadow-terracotta-deep/10 transition-all ${
                        isAttending 
                        ? 'bg-soft-sand text-foreground hover:bg-soft-sand/80' 
                        : 'bg-terracotta-deep hover:bg-terracotta-deep/90 text-white'
                      }`}
                    >
                      {isAttending ? 'Я передумал' : 'Я пойду!'}
                    </Button>
                    {!canManage && (
                      <Button 
                        onClick={handleMessageClick}
                        disabled={chatLoading}
                        className="w-[180px] h-14 bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-2xl font-black text-lg shadow-xl shadow-terracotta-deep/10 transition-all flex hidden md:flex items-center justify-center pointer-events-auto"
                      >
                        {chatLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Написать
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {canManage && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => onEdited?.(event)}
                      className="w-14 h-14 rounded-2xl border-border/50 hover:bg-soft-sand/30"
                    >
                      <Edit className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <Button
                      disabled={deleting}
                      onClick={handleDelete}
                      className="w-14 h-14 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
