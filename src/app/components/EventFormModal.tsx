import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Clock, Users, Upload, Image as ImageIcon, AlertCircle, Trash2, Wallet, Loader2, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';

declare const heic2any: any;

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: any; // If provided, we are in Edit mode
  onSuccess: () => void;
}

export function EventFormModal({ isOpen, onClose, eventToEdit, onSuccess }: EventFormModalProps) {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<{file: File, preview: string}[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Развлечения',
    description: '',
    date: '',
    hour: '12',
    minute: '00',
    location_text: '',
    price_text: 'Бесплатно',
    city: profile?.city || 'Дананг, Вьетнам',
    max_attendees: '',
  });

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const eventTypes = [
    'Развлечения',
    'Деловые и язык',
    'Спорт и экскурсии',
    'Для детей',
    'Иное'
  ];

  useEffect(() => {
    if (eventToEdit) {
      const startsAt = eventToEdit.starts_at ? new Date(eventToEdit.starts_at) : new Date();
      setFormData({
        title: eventToEdit.title || '',
        type: eventToEdit.type || 'Развлечения',
        description: eventToEdit.description || '',
        date: startsAt.toISOString().split('T')[0],
        hour: startsAt.getHours().toString().padStart(2, '0'),
        minute: startsAt.getMinutes().toString().padStart(2, '0'),
        location_text: eventToEdit.location_text || '',
        price_text: eventToEdit.price_text || 'Бесплатно',
        city: eventToEdit.city || 'Весь Вьетнам',
        max_attendees: eventToEdit.max_attendees?.toString() || '',
      });
      setExistingImages(eventToEdit.images || []);
      setSelectedAttachments([]);
    } else {
      setFormData({
        title: '',
        type: 'Развлечения',
        description: '',
        date: '',
        hour: '12',
        minute: '00',
        location_text: '',
        price_text: 'Бесплатно',
        city: profile?.city || 'Дананг, Вьетнам',
        max_attendees: '',
      });
      setExistingImages([]);
      setSelectedAttachments([]);
    }
  }, [eventToEdit, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 1);
    if (files.length === 0) return;
    
    // Clear previous if only 1 allowed
    setSelectedAttachments([]);
    setExistingImages([]);

    setProcessingFiles(true);
    setError(null);

    try {
      for (const file of files) {
        if (file.size > 9 * 1024 * 1024) {
          setError(`Файл ${file.name} слишком большой. Максимальный размер — 9 Мб.`);
          continue;
        }
        let fileToProcess = file;
        const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        
        if (isHeic) {
          try {
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8
            });
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            fileToProcess = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
              type: 'image/jpeg'
            });
          } catch (err) {
            console.error('HEIC conversion failed:', err);
            continue;
          }
        }

        const reader = new FileReader();
        const promise = new Promise<void>((resolve) => {
          reader.onloadend = () => {
            setSelectedAttachments(prev => [...prev, {
              file: fileToProcess,
              preview: reader.result as string
            }]);
            resolve();
          };
        });
        reader.readAsDataURL(fileToProcess);
        await promise;
      }
    } catch (err) {
      setError('Ошибка при обработке файлов');
    } finally {
      setProcessingFiles(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const item of selectedAttachments) {
      const file = item.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);

      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Upload new images if any
      const newImageUrls = selectedAttachments.length > 0 ? await uploadImages() : [];
      const finalImages = [...existingImages, ...newImageUrls];

      // 2. Prepare payload
      const combinedStartsAt = new Date(`${formData.date}T${formData.hour}:${formData.minute}:00`).toISOString();
      const payload = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        location_text: formData.location_text,
        price_text: formData.price_text,
        organizer_id: user.id,
        organizer_name: profile?.display_name || user.email?.split('@')[0],
        city: formData.city,
        images: finalImages,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        starts_at: combinedStartsAt,
      };

      // 3. Upsert
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
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 md:p-12">
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
          className="relative w-full max-w-2xl bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[82vh] mb-6 sm:mb-8 mx-4"
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
                    maxLength={50}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* City selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Город</label>
                  <div className="relative">
                    <select
                      className="w-full px-5 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium appearance-none cursor-pointer"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                    >
                      <option value="Вьетнам">🇻🇳 Весь Вьетнам</option>
                      <option value="Дананг, Вьетнам">🏙️ Дананг, Вьетнам</option>
                    </select>
                    <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Date & Time */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Дата</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      type="date"
                      className="w-full pl-12 pr-5 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Время</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                      <select
                        className="w-full pl-10 pr-4 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium appearance-none"
                        value={formData.hour}
                        onChange={e => setFormData({ ...formData, hour: e.target.value })}
                      >
                        {hours.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center text-muted-foreground font-black">:</div>
                    <div className="relative flex-1">
                      <select
                        className="w-full px-4 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium appearance-none"
                        value={formData.minute}
                        onChange={e => setFormData({ ...formData, minute: e.target.value })}
                      >
                        {minutes.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Max Attendees */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Сколько поместится</label>
                  <div className="relative">
                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      placeholder="Безлимитно"
                      className="w-full pl-12 pr-5 py-4 bg-soft-sand/20 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 transition-all font-medium"
                      value={formData.max_attendees}
                      onChange={e => {
                        const val = e.target.value.slice(0, 4);
                        setFormData({ ...formData, max_attendees: val });
                      }}
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
                    maxLength={60}
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
                  {/* Existing Images */}
                  {existingImages.map((url, i) => (
                    <div key={`exist-${i}`} className="relative aspect-square rounded-2xl overflow-hidden group border border-border/30">
                      <img src={url} alt="event" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(i)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* New Selected Previews */}
                  {selectedAttachments.map((item, i) => (
                    <div key={`new-${i}`} className="relative aspect-square rounded-2xl overflow-hidden group border border-dashed border-terracotta-deep/30">
                      <img src={item.preview} alt="new-event" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(i)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {(existingImages.length + selectedAttachments.length < 1) && (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:bg-soft-sand/20 transition-all hover:border-terracotta-deep/30 group">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
                      {processingFiles ? (
                        <Loader2 className="w-6 h-6 text-terracotta-deep animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground group-hover:text-terracotta-deep transition-colors mb-2" />
                          <span className="text-[10px] font-bold text-muted-foreground group-hover:text-terracotta-deep uppercase tracking-tighter">Добавить</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-8 pb-12 sm:pb-10 bg-white border-t border-border/50 flex gap-3">
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
              disabled={loading || processingFiles}
              className="flex-[2] h-14 rounded-2xl bg-terracotta-deep hover:bg-terracotta-deep/90 text-white font-bold text-lg shadow-lg shadow-terracotta-deep/10"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                   <Loader2 className="w-5 h-5 animate-spin" />
                   Загрузка...
                </div>
              ) : (eventToEdit ? 'Сохранить изменения' : 'Создать событие')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
