import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Clock, Users, MessageCircle, Trash2, ShieldCheck, AlertTriangle, Edit, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';

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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(false);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header / Images */}
            <div className="relative h-64 sm:h-80 bg-soft-sand/10">
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
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-terracotta-deep text-[10px] font-bold tracking-widest uppercase rounded-full border border-terracotta-deep/20 shadow-sm">
                  {event.type}
                </span>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2 leading-tight">
                    {event.title}
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span className="font-medium text-terracotta-deep">от {event.organizer}</span>
                    {isAdmin && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                        <ShieldCheck className="w-3 h-3" /> Администратор
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-terracotta-deep/10 px-4 py-2 rounded-2xl shrink-0 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-terracotta-deep" />
                  <span className="text-xl font-black text-terracotta-deep whitespace-nowrap">
                    {event.price}
                  </span>
                </div>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-3 bg-soft-sand/20 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-terracotta-deep">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Дата</p>
                    <p className="font-bold text-sm">{event.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-soft-sand/20 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-terracotta-deep">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Время</p>
                    <p className="font-bold text-sm">{event.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-soft-sand/20 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-terracotta-deep">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Место</p>
                    <p className="font-bold text-sm truncate max-w-[150px]">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-soft-sand/20 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-terracotta-deep">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Участники</p>
                    <p className="font-bold text-sm">
                      {participants.length} {event.maxAttendees ? `/ ${event.maxAttendees}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">О событии</h3>
                <div className="bg-soft-sand/10 rounded-2xl p-4 text-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>

              {/* Attendees Avatars */}
              {participants.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1">Участники</h3>
                  <div className="flex flex-wrap gap-2">
                    {participants.slice(0, 10).map((p, idx) => (
                      <div key={idx} className="group relative" title={p.profiles?.display_name || 'Anonymous'}>
                         {p.profiles?.avatar_url ? (
                            <img 
                              src={p.profiles.avatar_url} 
                              className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" 
                              alt="participant"
                            />
                         ) : (
                            <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-terracotta-deep/10 text-terracotta-deep flex items-center justify-center text-xs font-bold">
                              {(p.profiles?.display_name || 'U').charAt(0)}
                            </div>
                         )}
                      </div>
                    ))}
                    {participants.length > 10 && (
                      <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-soft-sand flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        +{participants.length - 10}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-white border-t border-border/50 flex flex-col sm:flex-row gap-3">
              {!user ? (
                <div className="flex-1 flex items-center gap-3 p-3 bg-red-50 rounded-2xl">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700 font-medium leading-tight">
                    Пожалуйста, войдите в систему, чтобы записываться на события.
                  </p>
                </div>
              ) : (
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
