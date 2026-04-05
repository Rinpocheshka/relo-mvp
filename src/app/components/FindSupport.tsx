import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Heart, 
  MessageCircle, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { formatRelativeRu } from '@/lib/date';

interface Question {
  id: string;
  question: string;
  category: string;
  askedBy: string;
  answers: number;
  isAnswered: boolean;
  createdAt?: string;
}

interface Guide {
  id: number;
  name: string;
  role: string;
  rating: number;
  expertise: string[];
  answeredQuestions: number;
  avatarColor: string;
}

export function FindSupport() {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedAnswer, setExpandedAnswer] = useState<Record<string, { body: string; author: string } | null>>({});

  const categories = ['Все', 'Жилье, документы', 'Дети', 'О городе', 'Куда сходить', 'Здоровье', 'О платформе', 'Для бизнеса'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('id,question,category,asked_by_name,created_at,answers(count)')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped: Question[] = (data ?? []).map((row) => {
          const answersCount = Array.isArray((row as any).answers) ? (row as any).answers[0]?.count ?? 0 : (row as any).answers?.count ?? 0;
          return {
            id: row.id as string,
            question: (row.question ?? '') as string,
            category: (row.category ?? 'Другое') as string,
            askedBy: ((row as any).asked_by_name ?? 'Пользователь') as string,
            answers: Number(answersCount) || 0,
            isAnswered: (Number(answersCount) || 0) > 0,
            createdAt: row.created_at ? formatRelativeRu(new Date(row.created_at as string)) : undefined,
          };
        });
        setQuestions(mapped);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Не удалось загрузить данные';
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const guides: Guide[] = [
    { id: 1, name: 'Дмитрий', role: 'Проводник города', rating: 4.9, expertise: ['Банки', 'Документы'], answeredQuestions: 45, avatarColor: 'bg-dusty-indigo/40' },
    { id: 2, name: 'Светлана', role: 'Проводник города', rating: 4.8, expertise: ['Жильё', 'Здоровье'], answeredQuestions: 32, avatarColor: 'bg-warm-olive/40' },
    { id: 3, name: 'Максим', role: 'Проводник города', rating: 4.7, expertise: ['Работа', 'Транспорт'], answeredQuestions: 28, avatarColor: 'bg-terracotta-deep/40' },
  ];

  const filteredQuestions = useMemo(() => {
    if (selectedCategory === 'Все') return questions;
    return questions.filter((q) => q.category === selectedCategory);
  }, [questions, selectedCategory]);

  const toggleExpanded = async (id: string) => {
    setExpandedQuestion((prev) => (prev === id ? null : id));
    if (expandedAnswer[id] !== undefined) return;
    try {
      const { data } = await supabase
        .from('answers')
        .select('body,author_name,created_at')
        .eq('question_id', id)
        .order('created_at', { ascending: true })
        .limit(1);
      const first = (data ?? [])[0];
      setExpandedAnswer((prev) => ({
        ...prev,
        [id]: first ? { body: (first.body ?? '') as string, author: (first.author_name ?? 'Проводник') as string } : null,
      }));
    } catch {
      setExpandedAnswer((prev) => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      {/* ── Header Section ── */}
      <section className="pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-terracotta-deep/5 rounded-full mb-6 border border-terracotta-deep/10"
          >
            <Heart className="w-4 h-4 text-terracotta-deep fill-terracotta-deep/20" />
            <span className="text-terracotta-deep font-semibold text-sm">Найти опору</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6 tracking-tight">
            Вопросы и ответы
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Задавай вопросы и получай проверенные ответы от проводников города
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* ── Search & Categories ── */}
        <div className="mb-12">
          <div className="bg-white p-2 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 flex flex-col md:flex-row gap-2 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Поиск вопросов..."
                className="w-full pl-14 pr-6 py-4 bg-transparent outline-none text-lg placeholder:text-muted-foreground/40"
              />
            </div>
            <Button 
              className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[18px] px-8 h-14 md:h-auto font-bold text-lg shadow-sm transition-all active:scale-[0.98]"
            >
              Задать вопрос
            </Button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-200 border ${
                  selectedCategory === category
                    ? 'bg-terracotta-deep text-white border-terracotta-deep shadow-md'
                    : 'bg-white text-muted-foreground hover:bg-soft-sand/20 border-border/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* ── Main Content: Questions ── */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-foreground">Недавние вопросы</h2>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-white rounded-[24px] animate-pulse border border-border/40" />
                ))}
              </div>
            ) : loadError ? (
              <div className="bg-red-50 p-6 rounded-[24px] border border-red-100 text-red-600 font-medium">
                Ошибка загрузки: {loadError}
              </div>
            ) : filteredQuestions.length === 0 ? (
               <div className="bg-white border border-border/50 rounded-[32px] p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-soft-sand/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-10 h-10 text-terracotta-deep" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Вопросов пока нет</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Будьте первым, кто задаст вопрос в этой категории. Наши проводники ответят вам в ближайшее время.
                </p>
                <Button className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full px-10 h-12 font-bold shadow-md">
                  Задать вопрос
                </Button>
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="group bg-white rounded-[24px] border border-border/60 hover:border-terracotta-deep/20 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden"
                >
                  <div 
                    className="p-6 md:p-8 cursor-pointer"
                    onClick={() => void toggleExpanded(q.id)}
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1 bg-soft-sand/40 text-warm-olive text-[11px] font-black uppercase tracking-wider rounded-md">
                            {q.category}
                          </span>
                          {q.isAnswered && (
                            <span className="px-3 py-1 bg-green-50 text-green-600 text-[11px] font-black uppercase tracking-wider rounded-md flex items-center gap-1.5 border border-green-100">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Есть ответ
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 leading-tight group-hover:text-terracotta-deep transition-colors">
                          {q.question}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                          <span className="font-medium">от {q.askedBy}</span>
                          <span className="w-1 h-1 bg-border rounded-full" />
                          <span>{q.answers} ответов</span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full bg-soft-sand/20 text-muted-foreground transition-transform duration-300 ${expandedQuestion === q.id ? 'rotate-180 text-terracotta-deep' : ''}`}>
                        <ChevronDown className="w-6 h-6" />
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedQuestion === q.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="mt-8 pt-8 border-t border-border/50">
                            <div className="bg-soft-sand/10 rounded-[20px] p-6 border border-soft-sand/20">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-dusty-indigo/40 flex-shrink-0 border-2 border-white shadow-sm" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-base text-foreground">
                                      {expandedAnswer[q.id]?.author ?? 'Проводник'}
                                    </span>
                                    <div className="flex items-center gap-0.5 text-yellow-500">
                                      <Star className="w-4 h-4 fill-current" />
                                    </div>
                                  </div>
                                  <p className="text-foreground leading-relaxed">
                                    {expandedAnswer[q.id]?.body ??
                                      'Наши проводники уже готовят ответ на этот вопрос. Пожалуйста, подождите или свяжитесь с поддержкой.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                              <Button variant="outline" className="rounded-full px-6 border-border/60 hover:bg-soft-sand/20">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Написать проводнику
                              </Button>
                              <Button variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground italic text-sm">
                                Еще 4 ответа...
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Sidebar: Guides ── */}
          <aside className="lg:col-span-4 space-y-8 h-fit sticky top-24">
            <div>
              <h2 className="text-2xl font-black text-foreground mb-6">Проводники города</h2>
              <div className="space-y-4">
                {guides.map((guide, i) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-5 rounded-[24px] border border-border/60 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-full ${guide.avatarColor} flex-shrink-0 border-2 border-white shadow-sm group-hover:scale-105 transition-transform`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate">{guide.name}</h3>
                        <p className="text-xs font-bold text-warm-olive/70 uppercase tracking-tighter mb-1.5">{guide.role}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm font-black text-foreground">{guide.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {guide.expertise.map((exp) => (
                        <span key={exp} className="px-2.5 py-1 bg-soft-sand/30 text-[10px] font-bold text-muted-foreground uppercase tracking-tight rounded-md">
                          {exp}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-[11px] font-medium text-muted-foreground/60 mb-4 px-1">
                      Ответил на <span className="text-foreground font-bold">{guide.answeredQuestions}</span> вопросов
                    </p>
                    
                    <Button 
                      className="w-full bg-terracotta-deep text-white hover:bg-terracotta-deep/90 rounded-full h-11 font-bold shadow-sm transition-all"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Написать
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA: Become a Guide */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#CD7F67] to-[#8E78B2] p-8 rounded-[32px] text-white shadow-xl shadow-terracotta-deep/10 group">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-3 leading-tight">Стать проводником</h3>
                <p className="text-sm opacity-90 mb-8 leading-relaxed font-medium">
                  Помогай новичкам и получай статус проводника города
                </p>
                <Button 
                  variant="outline" 
                  className="w-full bg-white/10 border-white/30 text-white hover:bg-white hover:text-terracotta-deep rounded-full h-12 font-bold transition-all shadow-lg"
                >
                  Узнать больше
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}