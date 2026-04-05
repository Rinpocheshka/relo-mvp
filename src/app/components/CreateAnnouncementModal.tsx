import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Megaphone, Loader2, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../SupabaseAuthProvider';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { name: 'Жильё', icon: '🏠' },
  { name: 'Вещи', icon: '📦' },
  { name: 'Услуги', icon: '💼' },
  { name: 'Бесплатно', icon: '💝' },
];

const SUBCATEGORIES: Record<string, string[]> = {
  'Вещи': [
    'Для дома',
    'Одежда, обувь, аксессуары',
    'Для детей',
    'Спорт, хобби',
    'Авто, мото',
    'Красота и здоровье',
    'Другое',
  ],
  'Жильё': [
    'Квартира',
    'Дом',
    'Отель',
    'Комната',
    'Студия',
  ],
  'Услуги': [
    'Ремонт',
    'Обучение',
    'Красота',
    'Перевозки',
    'Юристы',
    'Другое',
  ]
};

export function CreateAnnouncementModal({ isOpen, onClose, onSuccess }: Props) {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Жильё',
    subcategory: '',
    price_text: '',
    price_numeric: '',
    location_text: '',
    description: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 5) {
      setError('Максимум 5 фотографий');
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
    setError(null);
  };

  const removeImage = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('announcements')
        .getPublicUrl(filePath);

      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);
    setError(null);

    try {
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        imageUrls = await uploadImages();
      }

      const { error: insertError } = await supabase
        .from('announcements')
        .insert({
          title: form.title,
          category: form.category,
          subcategory: form.subcategory || null,
          price_text: form.price_text,
          price_numeric: form.price_numeric ? parseFloat(form.price_numeric) : null,
          location_text: form.location_text,
          description: form.description,
          author_id: user.id,
          author_name: profile.display_name || 'Пользователь',
          city: profile.city || 'Дананг',
          status: 'active',
          images: imageUrls
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
        // Reset form
        setForm({
          title: '',
          category: 'Жильё',
          subcategory: '',
          price_text: '',
          price_numeric: '',
          location_text: '',
          description: '',
        });
        setSelectedFiles([]);
        setPreviews([]);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при публикации');
    } finally {
      setLoading(false);
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-border/40 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-terracotta-deep/10 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-terracotta-deep" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Новое объявление</h2>
                  <p className="text-xs text-muted-foreground">Его увидят сотни релокантов в этом городе</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {success ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Опубликовано!</h3>
                  <p className="text-muted-foreground">Ваше объявление уже в ленте.</p>
                </div>
              ) : (
                <form id="announcement-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Category Selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.name, subcategory: '' })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          form.category === cat.name
                            ? 'bg-terracotta-deep border-terracotta-deep text-white shadow-md'
                            : 'bg-white border-border hover:border-terracotta-deep/30'
                        }`}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-semibold">{cat.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Subcategory */}
                  {SUBCATEGORIES[form.category] && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold ml-1">Подкатегория</label>
                      <select
                        value={form.subcategory}
                        onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                        className="w-full p-4 bg-soft-sand/20 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Выберите подкатегорию</option>
                        {SUBCATEGORIES[form.category].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">Фотографии (до 5)</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {previews.map((preview, index) => (
                        <div key={preview} className="relative aspect-square rounded-xl overflow-hidden group border border-border">
                          <img src={preview} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      ))}
                      {selectedFiles.length < 5 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-terracotta-deep/50 hover:bg-soft-sand/20 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground"
                        >
                          <ImagePlus className="w-6 h-6" />
                          <span className="text-[10px] font-medium">Добавить</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                      multiple
                    />
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">Заголовок</label>
                    <input
                      required
                      type="text"
                      placeholder="Напр: Классная студия в Сон Тра"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full p-4 bg-soft-sand/20 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Price Text */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold ml-1">Цена текстом</label>
                      <input
                        type="text"
                        placeholder="Напр: $500 / мес"
                        value={form.price_text}
                        onChange={(e) => setForm({ ...form, price_text: e.target.value })}
                        className="w-full p-4 bg-soft-sand/20 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm"
                      />
                    </div>
                    {/* Price Numeric */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold ml-1">Цена для фильтров ($)</label>
                      <input
                        type="number"
                        placeholder="Напр: 500"
                        value={form.price_numeric}
                        onChange={(e) => setForm({ ...form, price_numeric: e.target.value })}
                        className="w-full p-4 bg-soft-sand/20 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm"
                      />
                    </div>
                  </div>

                  {/* Location & Description */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold ml-1">Район / Место</label>
                      <input
                        required
                        type="text"
                        placeholder="Напр: Сон Тра, Дананг"
                        value={form.location_text}
                        onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                        className="w-full p-4 bg-soft-sand/20 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold ml-1">Описание</label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Расскажите подробнее о вашем предложении..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full p-4 bg-soft-sand/20 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm resize-none"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 italic">
                      ⚠️ {error}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="p-8 border-t border-border/40 bg-soft-sand/10 flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 rounded-2xl h-14 font-bold text-base"
                >
                  Отмена
                </Button>
                <Button 
                  form="announcement-form"
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-2xl h-14 font-bold text-base shadow-lg shadow-terracotta-deep/20 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Публикуем...
                    </>
                  ) : (
                    'Опубликовать →'
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
