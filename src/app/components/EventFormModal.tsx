import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Clock, Users, Upload, Image as ImageIcon, AlertCircle, Trash2, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: any; // If provided, we are in Edit mode
  onSuccess: () => void;
}

export function EventFormModal({ isOpen, onClose, eventToEdit, onSuccess }: EventFormModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Развлечения',
    description: '',
    starts_at: '',
    location_text: '',
    price_text: 'Бесплатно',
    max_attendees: '',
  });

  const eventTypes = [
    'Развлечения',
    'Деловые и язык',
    'Спорт и экскурсии',
    'Для детей',
    'Иное'
  ];

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title || '',
        type: eventToEdit.type || 'Развлечения',
        description: eventToEdit.description || '',
        starts_at: eventToEdit.starts_at ? new Date(eventToEdit.starts_at).toISOString().slice(0, 16) : '',
        location_text: eventToEdit.location_text || '',
        price_text: eventToEdit.price_text || 'Бесплатно',
        max_attendees: eventToEdit.max_attendees?.toString() || '',
      });
      setImages(eventToEdit.images || []);
    } else {
      setFormData({
        title: '',
        type: 'Развлечения',
        description: '',
        starts_at: '',
        location_text: '',
        price_text: 'Бесплатно',
        max_attendees: '',
      });
      setImages([]);
    }
  }, [eventToEdit, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    const newImages = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('events')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    }

    setImages(newImages);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      organizer_id: user.id,
      organizer_name: profile?.display_name || user.email?.split('@')[0],
      city: profile?.city || 'Не указано',
      images,
      max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
      starts_at: new Date(formData.starts_at).toISOString(),
    };

    try {
      let result;
      if (eventToEdit) {
        result = await supabase
          .from('events')
          .update(payload)
          .eq('id', eventToEdit.id);
      } else {
        result = await supabase
          .from('events')
          .insert([payload]);
      }

      if (result.error) throw result.error;
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving event:', err);
      setError(err instanceof Error ? err.message : 'Не удалось сохранить событие');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
          {/* Header */}
          <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between bg-white sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-black text-foreground">
                {eventToEdit ? 'Редактировать событие' : 'Создать событие'}
              </h2>
              <p className="text-sm text-muted-foreground">Заполните детали вашего мероприятия</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-soft-sand/30 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Название</label>
                <input
                  required
                  type="text"
                  placeholder="Например: Встреча в коворкинге"
                  className="w-full px-5 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Категория</label>
                  <select
                    className="w-full px-5 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium appearance-none"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    {eventTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1 flex items-center gap-1">
                    Стоимость
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Бесплатно или 1000"
                      maxLength={10}
                      className="w-full pl-12 pr-5 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium"
                      value={formData.price_text}
                      onChange={e => setFormData({ ...formData, price_text: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Date & Time */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Дата и время</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      type="datetime-local"
                      max="9999-12-31T23:59"
                      className="w-full pl-12 pr-5 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium"
                      value={formData.starts_at}
                      onChange={e => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                </div>

                {/* Max Attendees */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Лимит человек</label>
                  <div className="relative">
                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      min={0}
                      placeholder="Безлимитно"
                      className="w-full pl-12 pr-5 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium"
                      value={formData.max_attendees}
                      onChange={e => setFormData({ ...formData, max_attendees: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Местоположение</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    required
                    type="text"
                    maxLength={40}
                    placeholder="Название заведения или адрес"
                    className="w-full pl-12 pr-5 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium"
                    value={formData.location_text}
                    onChange={e => setFormData({ ...formData, location_text: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Описание</label>
                <textarea
                  required
                  placeholder="О чем будет встреча? Кого вы ждете?"
                  rows={4}
                  maxLength={1000}
                  className="w-full px-5 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium resize-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Фотографии</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group border border-border/30">
                      <img src={url} alt="event" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:bg-soft-sand/20 transition-all hover:border-terracotta-deep/30 group">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-terracotta-deep border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground group-hover:text-terracotta-deep transition-colors mb-2" />
                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-terracotta-deep uppercase tracking-tighter">Добавить</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-8 bg-white border-t border-border/50 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl font-bold border-border/50"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || uploading}
              className="flex-[2] h-14 rounded-2xl bg-terracotta-deep hover:bg-terracotta-deep/90 text-white font-bold text-lg shadow-lg shadow-terracotta-deep/10"
            >
              {loading ? 'Сохранение...' : (eventToEdit ? 'Сохранить изменения' : 'Создать событие')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
