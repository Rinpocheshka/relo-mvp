import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Link2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/app/SupabaseAuthProvider';

interface SuggestResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RESOURCE_CATEGORIES = [
  'Переезд и транспорт',
  'Жилье',
  'Легализация',
  'Здоровье',
  'Банки и финансы',
  'Шопинг',
  'Образование',
  'Другое',
];

const ICON_OPTIONS = ['🌐', '🏠', '🚌', '📄', '🏥', '🏦', '💳', '🛍️', '📚', '✈️', '🔗'];

export function SuggestResourceModal({ isOpen, onClose, onSuccess }: SuggestResourceModalProps) {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🌐');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isValid = name.trim().length > 1 && url.trim().length > 5 && category !== '';

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setSubmitting(true);
    setError(null);

    // Basic URL sanity check
    let safeUrl = url.trim();
    if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
      safeUrl = 'https://' + safeUrl;
    }

    try {
      const { error: insertError } = await supabase.from('resources').insert({
        name: name.trim(),
        url: safeUrl,
        category,
        description: description.trim() || null,
        icon,
        city: profile?.city ?? 'Дананг',
        added_by: user.id,
        is_verified: false, // pending moderation
      });

      if (insertError) throw insertError;

      setDone(true);
      setTimeout(() => {
        setDone(false);
        setName(''); setUrl(''); setCategory(''); setDescription(''); setIcon('🌐');
        onSuccess();
        onClose();
      }, 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleBackdrop}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-dusty-indigo/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-dusty-indigo" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Предложить ресурс</h2>
                  <p className="text-xs text-muted-foreground">Будет добавлен после модерации</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-soft-sand/30 hover:bg-soft-sand/60 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {done ? (
              <div className="px-8 py-16 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold mb-2">Спасибо!</h3>
                <p className="text-muted-foreground text-sm">Ресурс отправлен на модерацию и появится в списке после проверки.</p>
              </div>
            ) : (
              <>
                <div className="px-8 py-6 space-y-5">
                  {/* Icon picker */}
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Иконка</label>
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map((em) => (
                        <button
                          key={em}
                          onClick={() => setIcon(em)}
                          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all border-2 ${
                            icon === em ? 'border-dusty-indigo bg-dusty-indigo/5' : 'border-transparent bg-soft-sand/20 hover:bg-soft-sand/40'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Название <span className="text-terracotta-deep">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Например: Vinmec Hospital"
                      className="w-full px-4 py-3.5 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 text-sm"
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Ссылка <span className="text-terracotta-deep">*</span>
                    </label>
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      type="url"
                      className="w-full px-4 py-3.5 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 text-sm font-mono"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Категория <span className="text-terracotta-deep">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full appearance-none px-4 py-3.5 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 text-sm font-medium pr-10"
                      >
                        <option value="" disabled>Выбери категорию...</option>
                        {RESOURCE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Краткое описание <span className="text-muted-foreground font-normal">(необязательно)</span>
                    </label>
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 120))}
                      placeholder="Что это такое и почему полезно?"
                      className="w-full px-4 py-3.5 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 text-sm"
                    />
                  </div>

                  {/* Moderation notice */}
                  <div className="bg-dusty-indigo/5 border border-dusty-indigo/15 rounded-[14px] px-4 py-3 text-xs text-dusty-indigo leading-relaxed">
                    🔍 Ресурс пройдёт проверку перед публикацией. Это обычно занимает 1–2 дня.
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-[12px] px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                </div>

                <div className="px-8 pb-8 flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-[16px] border-border/60">
                    Отмена
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!isValid || submitting}
                    className="flex-1 h-12 rounded-[16px] bg-terracotta-deep hover:bg-terracotta-deep/90 text-white font-bold shadow-lg shadow-terracotta-deep/20 disabled:opacity-40"
                  >
                    {submitting ? 'Отправляем...' : 'Предложить'}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
