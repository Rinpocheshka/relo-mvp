import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, User, Share2, CornerUpRight } from 'lucide-react';
import { Button } from './ui/button';

interface Announcement {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  description: string;
  author: string;
  price?: string;
  location: string;
  date: string;
  images: string[];
}

interface Props {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AnnouncementDetailsModal({ announcement, isOpen, onClose }: Props) {
  if (!announcement) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
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
            className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Navigation / Close */}
            <div className="absolute top-6 right-6 z-20 flex gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
                title="Поделиться"
              >
                <Share2 className="w-5 h-5 text-foreground" />
              </button>
              <button 
                onClick={onClose}
                className="w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
                aria-label="Закрыть"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid lg:grid-cols-2 h-full">
                {/* Visuals */}
                <div className="bg-soft-sand/20 relative min-h-[300px] lg:min-h-0 border-r border-border/40">
                  {announcement.images && announcement.images.length > 0 ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 relative overflow-hidden">
                        <img 
                          src={announcement.images[0]} 
                          alt={announcement.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {announcement.images.length > 1 && (
                        <div className="p-4 grid grid-cols-4 gap-2 bg-white/50 backdrop-blur-sm">
                          {announcement.images.slice(1, 5).map((img, idx) => (
                            <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-white shadow-sm hover:ring-2 hover:ring-terracotta-deep transition-all cursor-pointer">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h2 className="text-3xl font-black leading-tight text-foreground">{announcement.title}</h2>
                      {announcement.price && (
                        <div className="bg-terracotta-deep/10 px-4 py-2 rounded-2xl">
                          <span className="text-xl font-black text-terracotta-deep whitespace-nowrap">{announcement.price}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
                      <div className="flex items-center gap-2 bg-white/80 border border-border/40 px-3 py-1.5 rounded-xl">
                        <MapPin className="w-4 h-4 text-terracotta-deep" />
                        {announcement.location}
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 border border-border/40 px-3 py-1.5 rounded-xl">
                        <Calendar className="w-4 h-4 text-dusty-indigo" />
                        {announcement.date}
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 border border-border/40 px-3 py-1.5 rounded-xl">
                        <User className="w-4 h-4 text-warm-olive" />
                        {announcement.author}
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
                  <div className="mt-12 pt-8 border-t border-border/40">
                    <Button className="w-full bg-foreground hover:bg-foreground/90 text-white rounded-2xl h-14 font-black text-lg shadow-xl shadow-foreground/10 transition-all active:scale-[0.98]">
                      Написать автору
                    </Button>
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
