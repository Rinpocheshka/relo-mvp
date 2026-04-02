import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Heart, MessageCircle, Star, ChevronDown, ChevronUp } from 'lucide-react';
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
    { id: 1, name: 'Дмитрий', role: 'Проводник города', rating: 4.9, expertise: ['Банки', 'Документы'], answeredQuestions: 45 },
    { id: 2, name: 'Светлана', role: 'Проводник города', rating: 4.8, expertise: ['Жильё', 'Здоровье'], answeredQuestions: 32 },
    { id: 3, name: 'Максим', role: 'Эксперт', rating: 4.7, expertise: ['Работа', 'Транспорт'], answeredQuestions: 28 },
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
    <div className="min-h-screen bg-warm-milk py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-deep/10 rounded-full mb-4">
            <Heart className="w-5 h-5 text-terracotta-deep" />
            <span className="text-terracotta-deep font-medium">Найти опору</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Вопросы и ответы</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Задавай вопросы и получай проверенные ответы от проводников города
          </p>
        </motion.div>

        {/* Search & Ask Question */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск вопросов..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-[16px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20"
            />
          </div>
          <Button 
            size="lg"
            className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px] whitespace-nowrap"
          >
            Задать вопрос
          </Button>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-[12px] whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-terracotta-deep text-white'
                    : 'bg-white text-foreground hover:bg-soft-sand/30 border border-border'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Questions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Недавние вопросы</h2>
            </div>

            {loading && (
              <div className="bg-white p-6 rounded-[16px] border border-border text-muted-foreground">
                Загружаем вопросы…
              </div>
            )}
            {!loading && loadError && (
              <div className="bg-white p-6 rounded-[16px] border border-border text-red-600">
                Ошибка загрузки: {loadError}
              </div>
            )}
            {!loading && !loadError && filteredQuestions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[16px] border border-border"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-warm-olive/20 text-warm-olive text-xs rounded-full">
                        {q.category}
                      </span>
                      {q.isAnswered && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                          ✓ Есть ответ
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2">{q.question}</h3>
                    <p className="text-sm text-muted-foreground">
                      от {q.askedBy} · {q.answers} ответов
                    </p>
                  </div>
                  <button
                    onClick={() => void toggleExpanded(q.id)}
                    className="p-2 hover:bg-soft-sand/30 rounded-lg transition-colors"
                  >
                    {expandedQuestion === q.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {expandedQuestion === q.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    <div className="bg-soft-sand/20 p-4 rounded-[12px] mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-dusty-indigo rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {expandedAnswer[q.id]?.author ?? 'Проводник'}
                            </span>
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          </div>
                          <p className="text-sm">
                            {expandedAnswer[q.id]?.body ??
                              'Пока нет ответа — но можно написать проводнику или задать уточняющий вопрос.'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-[12px]"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Написать проводнику
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            ))}

            {!loading && !loadError && filteredQuestions.length === 0 && (
              <div className="bg-white border border-border/80 rounded-[16px] p-12 text-center">
                <div className="w-20 h-20 bg-soft-sand/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-terracotta-deep" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Вопросов пока нет</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Будьте первым, кто задаст вопрос в этой категории. Наши проводники ответят вам в ближайшее время.
                </p>
                <Button className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px] px-8">
                  Задать вопрос
                </Button>
              </div>
            )}
          </div>

          {/* Guides Sidebar */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Проводники города</h2>
            <div className="space-y-4">
              {guides.map((guide, i) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-4 rounded-[16px] border border-border"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-dusty-indigo rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{guide.name}</h3>
                      <p className="text-sm text-muted-foreground">{guide.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{guide.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {guide.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="px-2 py-1 bg-soft-sand/30 text-xs rounded-full"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Ответил на {guide.answeredQuestions} вопросов
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px]"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Написать
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Become a Guide */}
            <div className="mt-6 bg-gradient-to-br from-terracotta-deep to-dusty-indigo p-6 rounded-[16px] text-white">
              <h3 className="font-semibold mb-2">Стать проводником</h3>
              <p className="text-sm opacity-90 mb-4">
                Помогай новичкам и получай статус проводника города
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full border-white text-white hover:bg-white/10 rounded-[12px]"
              >
                Узнать больше
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}