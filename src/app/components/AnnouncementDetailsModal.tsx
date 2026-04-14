import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, User, CornerUpRight, Trash2, Loader2, Edit, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../SupabaseAuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router';
import { getOrCreateChat } from '@/lib/chatUtils';

import { Announcement } from './Announcements';
import { formatPrice } from '@/lib/format';

interface Props {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  onEdited?: (announcement: Announcement) => void;
}

export function AnnouncementDetailsModal({ announcement, isOpen, onClose, onDeleted, onEdited }: Props) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const canManage = user && (user.id === announcement?.author_id || profile?.role === 'admin');

  const handleMessageClick = async () => {
    console.log('DEBUG: Contact Author clicked', { authorId: announcement?.author_id, userId: user?.id });
    
    if (!user) {
      console.log('DEBUG: No user, opening auth modal');
      // @ts-ignore - assuming parent has auth handlers or we use a global modal
      setAuthOpen?.(true); 
      return;
    }

    if (!announcement?.author_id) {
      console.error('DEBUG: Missing author_id');
      return;
    }

    if (user.id === announcement.author_id) {
      alert('Это ваше объявление.');
      return;
    }

    setChatLoading(true);
    try {
      console.log('DEBUG: Calling getOrCreateChat for author...');
      const chatId = await getOrCreateChat(user.id, announcement.author_id);
      console.log('DEBUG: Chat result:', chatId);
      
      if (chatId) {
        navigate(`/messages/${chatId}`);
      } else {
        alert('Не удалось начать чат с автором (null). Проверьте консоль.');
      }
    } catch (err: any) {
      console.error('DEBUG: Catch error:', err);
      alert('Ошибка чата: ' + (err.message || 'Unknown'));
    } finally {
      setChatLoading(false);
    }
  };

  // Reset active image when announcement changes
  useEffect(() => {
    setActiveImageIndex(0);
    setIsDeleting(false);
  }, [announcement?.id]);

  const handleDelete = async () => {
    if (!announcement || !canManage) return;
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id);

      if (error) throw error;
      
      if (onDeleted) {
        onDeleted();
      } else {
        onClose();
        // Fallback for pages without onDeleted handler yet
        window.location.reload();
      }
    } catch (err) {
      alert('Ошибка при удалении');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!announcement) return null;

  const images = (announcement.images || []).filter(img => typeof img === 'string' && img.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 text-foreground">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] mb-4 lg:mb-0"
          >
            {/* Close Button */}
            <div className="absolute top-6 right-6 z-20">
              <button 
                onClick={onClose}
                className="w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
                aria-label="Закрыть"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="grid lg:grid-cols-2 h-full">
                {/* Visuals */}
                <div className="bg-soft-sand/5 relative min-h-[350px] lg:min-h-0 border-r border-border/40 flex flex-col">
                  {images.length > 0 ? (
                    <>
                      <div className="flex-1 relative overflow-hidden bg-white/50">
                        <img 
                          key={activeImageIndex}
                          src={images[activeImageIndex]} 
                          alt={announcement.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {images.length > 1 && (
                        <div className="p-4 grid grid-cols-5 gap-2 bg-white/80 border-t border-border/20 backdrop-blur-sm">
                          {images.map((img, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => setActiveImageIndex(idx)}
                              className={`aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                activeImageIndex === idx ? 'border-terracotta-deep shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-soft-sand/40 to-dusty-indigo/10 p-12 text-center">
                      <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <CornerUpRight className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground font-medium">Нет дополнительных фотографий</p>
                    </div>
                  )}
                  
                  <div className="absolute top-6 left-6">
                    <span className={`px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-full shadow-lg backdrop-blur-md ${
                      announcement.category === 'Жильё' ? 'bg-terracotta-deep/90 text-white' :
                      announcement.category === 'Вещи' ? 'bg-dusty-indigo/90 text-white' :
                      announcement.category === 'Услуги' ? 'bg-warm-olive/90 text-white' :
                      'bg-green-600/90 text-white'
                    }`}>
                      {announcement.category}
                    </span>
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-8 lg:p-12 flex flex-col bg-milk-shake/5">
                  <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 relative pr-16 lg:pr-16">
                      <h2 className="text-3xl font-black leading-tight text-foreground">{announcement.title}</h2>
                      {announcement.price_text && (
                        <div className="bg-terracotta-deep/10 px-4 py-2 rounded-2xl shrink-0">
                          <span className="text-xl font-black text-terracotta-deep whitespace-nowrap">
                            {formatPrice(announcement.price_text)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
                      <div className="flex items-start gap-2 bg-white/80 border border-border/40 px-3 py-1.5 rounded-xl">
                        <MapPin className="w-4 h-4 text-terracotta-deep shrink-0 mt-0.5" />
                        <span className="break-words min-w-0">{announcement.location_text}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 border border-border/40 px-3 py-1.5 rounded-xl">
                        <Calendar className="w-4 h-4 text-dusty-indigo" />
                        {new Date(announcement.created_at).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 border border-border/40 px-3 py-1.5 rounded-xl">
                        <User className="w-4 h-4 text-warm-olive" />
                        {announcement.author_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 border-b border-border/40 pb-2">Описание</h3>
                    <div className="text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                      {announcement.description}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-12 pt-8 border-t border-border/40 pb-8 sm:pb-0 safe-area-bottom relative z-50">
                    {!canManage && (
                      <button 
                        onClick={handleMessageClick}
                        disabled={chatLoading}
                        className="w-full bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-2xl h-14 font-black text-lg shadow-xl shadow-terracotta-deep/10 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                        style={{ pointerEvents: 'auto' }}
                      >
                        {chatLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Написать автору
                          </>
                        )}
                      </button>
                    )}
                    
                    {canManage && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            if (announcement && onEdited) {
                              onEdited(announcement);
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-soft-sand hover:bg-soft-sand/80 text-foreground font-bold py-3 rounded-2xl transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Изменить
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-2xl transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Удалить
                        </button>
                      </div>
                    )}

                    <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-bold">
                      Скажите, что нашли это объявление на Relo.me 🤍
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
