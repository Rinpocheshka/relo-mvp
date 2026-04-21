import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/app/SupabaseAuthProvider';
import { toast } from 'sonner';

interface WriteStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storyToEdit?: { id: string; title: string; content: string } | null;
}

export function WriteStoryModal({ isOpen, onClose, onSuccess, storyToEdit }: WriteStoryModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill when editing
  useState(() => {
    if (storyToEdit) {
      setTitle(storyToEdit.title);
      setContent(storyToEdit.content);
    }
  });

  // Also update if storyToEdit changes while open (though unlikely in this flow)
  useEffect(() => {
    if (storyToEdit) {
      setTitle(storyToEdit.title);
      setContent(storyToEdit.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [storyToEdit]);

  const isValid = title.trim().length >= 3 && content.trim().length >= 20;

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setSubmitting(true);
    setError(null);

    try {
      if (storyToEdit) {
        const { error: updateError } = await supabase
          .from('stories')
          .update({
            title: title.trim(),
            content: content.trim(),
            status: 'pending'
          })
          .eq('id', storyToEdit.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('stories').insert({
          title: title.trim(),
          content: content.trim(),
          author_id: user.id,
          status: 'pending'
        });

        if (insertError) throw insertError;
      }

      if (storyToEdit ? false : false) {} // placeholder for parity if needed
      
      toast.success('История отправлена на модерацию', {
        description: 'Она появится в списке после одобрения модератором.'
      });
      onSuccess();
      onClose();
      setTitle('');
      setContent('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить историю');
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
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[82vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-terracotta-deep/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-terracotta-deep" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {storyToEdit ? 'Редактировать историю' : 'Поделиться историей'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {storyToEdit ? 'Обнови свой рассказ для читателей' : 'Твой опыт поможет другим решиться или избежать ошибок'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-soft-sand/30 hover:bg-soft-sand/60 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Заголовок истории <span className="text-terracotta-deep">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Как я переехал в Дананг с тремя котами"
                  maxLength={100}
                  className="w-full px-4 py-3.5 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm font-bold"
                />
                <div className="mt-1 flex justify-end">
                   <span className={`text-[10px] font-bold ${title.length > 90 ? 'text-terracotta-deep' : 'text-muted-foreground/40'}`}>
                    {title.length}/100
                  </span>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Твоя история <span className="text-terracotta-deep">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Расскажи подробно: почему выбрал это место, с какими трудностями столкнулся, что больше всего удивило..."
                  rows={12}
                  maxLength={10000}
                  className="w-full px-4 py-4 bg-soft-sand/10 border border-border/50 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm leading-relaxed resize-none transition-all"
                />
                <div className="mt-1 flex justify-between items-center text-[10px] font-bold">
                  <span className="text-muted-foreground/60 italic">Минимум 20 символов</span>
                   <span className={`transition-colors ${content.length > 9500 ? 'text-terracotta-deep' : 'text-muted-foreground/40'}`}>
                    {content.length.toLocaleString()}/10,000
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-[12px] px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="px-8 pb-8 pt-4 flex gap-3 bg-white border-t border-border/10">
              <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-[16px] border-border/60">
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="flex-3 h-12 rounded-[16px] bg-terracotta-deep hover:bg-terracotta-deep/90 text-white font-bold shadow-lg shadow-terracotta-deep/20 disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Публикуем...
                  </>
                ) : (
                  storyToEdit ? 'Сохранить изменения' : 'Опубликовать историю'
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
