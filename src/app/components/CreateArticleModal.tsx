import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, ChevronDown, Upload, Trash2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/app/SupabaseAuthProvider';

interface CreateArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newArticle: any) => void;
  articleToEdit?: any | null;
}

const CATEGORIES = [
  'Жильё',
  'Документы/визы',
  'Обмен/деньги',
  'Дети',
  'О городе',
  'Куда сходить',
  'Здоровье',
  'Для бизнеса',
  'О платформе',
  'Другое',
];

export function CreateArticleModal({ isOpen, onClose, onSuccess, articleToEdit }: CreateArticleModalProps) {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{file: File, preview: string} | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isEdit = !!articleToEdit;

  useEffect(() => {
    if (articleToEdit) {
      setTitle(articleToEdit.question || '');
      setBody(articleToEdit.body || '');
      setCategory(articleToEdit.category || '');
      setExistingImage(articleToEdit.image_url || null);
      setSelectedFile(null);
    } else {
      setTitle('');
      setBody('');
      setCategory('');
      setExistingImage(null);
      setSelectedFile(null);
    }
  }, [articleToEdit, isOpen]);

  const isValid = title.trim().length >= 5 && body.trim().length >= 20 && category !== '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingFiles(true);
    setError(null);

    try {
      if (file.size > 9 * 1024 * 1024) {
        throw new Error(`Файл слишком большой. Максимальный размер — 9 Мб.`);
      }

      const reader = new FileReader();
      const promise = new Promise<void>((resolve) => {
        reader.onloadend = () => {
          setSelectedFile({
            file: file,
            preview: reader.result as string
          });
          setExistingImage(null); // overwrite existing
          resolve();
        };
      });
      reader.readAsDataURL(file);
      await promise;
    } catch (err: any) {
      setError(err.message || 'Ошибка обработки файла');
    } finally {
      setProcessingFiles(false);
      if (e.target) e.target.value = '';
    }
  };

  const uploadImage = async () => {
    if (!selectedFile || !user) return null;
    const file = selectedFile.file;
    const fileExt = file.name.split('.').pop();
    const fileName = `articles/${user.id}/${Math.random()}.${fileExt}`;
    
    // We reuse events bucket to avoid needing to create a new one, as it's common for general uploads
    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setSubmitting(true);
    setError(null);

    try {
      let finalImageUrl = existingImage;
      if (selectedFile) {
        finalImageUrl = await uploadImage();
      }

      const payload = {
        type: 'article',
        question: title.trim(),
        body: body.trim(),
        category,
        image_url: finalImageUrl,
        asked_by: user.id,
        asked_by_name: profile?.display_name ?? 'Администратор',
        city: profile?.city ?? 'Дананг',
        status: 'open',
      };
      
      let result;
      if (isEdit) {
        // Drop asked_by on update to avoid changing author
        delete (payload as any).asked_by;
        const { data, error: updateError } = await supabase
          .from('questions')
          .update(payload)
          .eq('id', articleToEdit.id)
          .select()
          .single();
        if (updateError) throw updateError;
        result = data;
      } else {
        const { data, error: insertError } = await supabase
          .from('questions')
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        result = data;
      }

      onSuccess({
        id: result.id,
        question: result.question,
        body: result.body,
        type: result.type,
        image_url: result.image_url,
        category: result.category,
        askedBy: result.asked_by_name ?? 'Пользователь',
        answers: isEdit ? (articleToEdit.answers || 0) : 0,
        isAnswered: isEdit ? (articleToEdit.isAnswered || false) : false,
        createdAt: result.created_at ? 'только что' : 'только что',
        authorIsGuide: profile?.is_guide,
      });

      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить статью');
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleBackdrop}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-terracotta-deep/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-terracotta-deep" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {isEdit ? 'Редактировать статью' : 'Написать статью'}
                  </h2>
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
            <div className="px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              
              {/* Category */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Категория <span className="text-terracotta-deep">*</span>
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none px-4 py-3.5 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm font-medium pr-10"
                  >
                    <option value="" disabled>Выбери категорию...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Заголовок статьи <span className="text-terracotta-deep">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="О чем хочется рассказать?"
                  className="w-full px-4 py-3.5 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm font-medium"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Обложка
                </label>
                {(existingImage || selectedFile) ? (
                  <div className="relative w-full aspect-video rounded-[16px] overflow-hidden group border border-border/30">
                    <img src={selectedFile ? selectedFile.preview : existingImage!} alt="cover" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setExistingImage(null); }}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full aspect-video rounded-[16px] border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:bg-soft-sand/20 transition-all hover:border-terracotta-deep/30 group">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
                    {processingFiles ? (
                      <Loader2 className="w-8 h-8 text-terracotta-deep animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground group-hover:text-terracotta-deep transition-colors mb-3" />
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-terracotta-deep">Загрузить обложку (опционально)</span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Body text */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Текст статьи <span className="text-terracotta-deep">*</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Развернутый текст, ссылки будут кликабельными..."
                  rows={10}
                  className="w-full px-4 py-3.5 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 text-sm leading-relaxed resize-none custom-scrollbar"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-[12px] px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-border/40 flex gap-3 shrink-0 bg-white">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 rounded-[16px] border-border/60"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || submitting || processingFiles}
                className="flex-[2] h-12 rounded-[16px] bg-terracotta-deep hover:bg-terracotta-deep/90 text-white font-bold shadow-lg shadow-terracotta-deep/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Публикуем...' : (isEdit ? 'Сохранить изменения' : 'Опубликовать статью')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
