import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/app/SupabaseAuthProvider';

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newQuestion: {
    id: string;
    question: string;
    category: string;
    askedBy: string;
    answers: number;
    isAnswered: boolean;
    createdAt?: string;
  }) => void;
}

const CATEGORIES = [
  'Жилье, документы',
  'Дети',
  'О городе',
  'Куда сходить',
  'Здоровье',
  'Банки и финансы',
  'О платформе',
  'Для бизнеса',
  'Другое',
];

export function AskQuestionModal({ isOpen, onClose, onSuccess }: AskQuestionModalProps) {
  const { user, profile } = useAuth();
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_LENGTH = 500;
  const isValid = questionText.trim().length >= 10 && category !== '';

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setSubmitting(true);
    setError(null);

    try {
      const authorName = isAnonymous
        ? 'Пользователь'
        : (profile?.display_name ?? 'Пользователь');

      const { data, error: insertError } = await supabase
        .from('questions')
        .insert({
          question: questionText.trim(),
          category,
          asked_by: user.id,
          asked_by_name: authorName,
          city: profile?.city ?? 'Дананг',
          is_anonymous: isAnonymous,
          status: 'open',
        })
        .select('id, question, category, asked_by_name, created_at')
        .single();

      if (insertError) throw insertError;

      onSuccess({
        id: data.id,
        question: data.question,
        category: data.category,
        askedBy: data.asked_by_name ?? 'Пользователь',
        answers: 0,
        isAnswered: false,
        createdAt: 'только что',
      });

      setQuestionText('');
      setCategory('');
      setIsAnonymous(false);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить вопрос');
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
                  <HelpCircle className="w-5 h-5 text-dusty-indigo" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Задать вопрос</h2>
                  <p className="text-xs text-muted-foreground">Проводники города ответят вам</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-soft-sand/30 hover:bg-soft-sand/60 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-5">

              {/* Category */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Тема вопроса <span className="text-terracotta-deep">*</span>
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none px-4 py-3.5 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 text-sm font-medium pr-10"
                  >
                    <option value="" disabled>Выбери категорию...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Question text */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Вопрос <span className="text-terracotta-deep">*</span>
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value.slice(0, MAX_LENGTH))}
                  placeholder="Опишите свой вопрос подробно — так проводники смогут дать точный ответ..."
                  rows={4}
                  className="w-full px-4 py-3.5 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 text-sm leading-relaxed resize-none"
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    Минимум 10 символов
                  </span>
                  <span className={`text-xs font-medium ${questionText.length > MAX_LENGTH * 0.9 ? 'text-terracotta-deep' : 'text-muted-foreground'}`}>
                    {questionText.length}/{MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* Anonymous toggle */}
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div
                  onClick={() => setIsAnonymous((p) => !p)}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${isAnonymous ? 'bg-dusty-indigo' : 'bg-border'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm m-0.5 transition-transform duration-200 ${isAnonymous ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Задать анонимно</p>
                  <p className="text-xs text-muted-foreground">Вместо имени будет показано «Пользователь»</p>
                </div>
              </label>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-[12px] px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 rounded-[16px] border-border/60"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="flex-1 h-12 rounded-[16px] bg-terracotta-deep hover:bg-terracotta-deep/90 text-white font-bold shadow-lg shadow-terracotta-deep/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Отправляем...' : 'Задать вопрос'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
