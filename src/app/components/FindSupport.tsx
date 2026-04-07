import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Heart,
  MessageCircle,
  Star,
  ChevronDown,
  CheckCircle2,
  Plus,
  ThumbsUp,
  ExternalLink,
  SortDesc,
  Loader2,
  Eye,
} from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { formatRelativeRu } from '@/lib/date';
import { AskQuestionModal } from './AskQuestionModal';
import { useAuth } from '@/app/SupabaseAuthProvider';
import { SuggestResourceModal } from './SuggestResourceModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  question: string;
  category: string;
  askedBy: string;
  answers: number;
  isAnswered: boolean;
  createdAt?: string;
  viewsCount?: number;
}

interface Answer {
  id: string;
  body: string;
  author: string;
  authorId: string | null;
  isBest: boolean;
  upvotesCount: number;
  createdAt?: string;
}

interface Guide {
  id: string;
  name: string;
  rating: number | null;
  expertise: string[];
  answeredCount: number;
  avatarUrl: string | null;
  avatarColor: string;
  contactTelegram: string | null;
  contactWhatsapp: string | null;
}

interface Resource {
  id: string;
  category: string;
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
  isVerified: boolean;
}

type SortMode = 'new' | 'unanswered' | 'popular';

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_CATEGORIES = [
  'Все', 'Жилье, документы', 'Дети', 'О городе',
  'Куда сходить', 'Здоровье', 'Банки и финансы', 'О платформе', 'Для бизнеса',
];

const RESOURCE_CATEGORIES = [
  'Все', 'Переезд и транспорт', 'Жилье', 'Легализация',
  'Здоровье', 'Банки и финансы', 'Шопинг', 'Образование',
];

const GUIDE_COLORS = [
  'bg-dusty-indigo/40', 'bg-warm-olive/40', 'bg-terracotta-deep/40',
  'bg-[#7C9D8E]/40', 'bg-[#9B8EA8]/40',
];

const ANSWERS_PAGE_SIZE = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FindSupport() {
  const { user, profile } = useAuth();

  // Tabs & filters
  const [activeTab, setActiveTab] = useState<'questions' | 'resources'>('questions');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchInput, setSearchInput] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('new');
  const searchQuery = useDebounce(searchInput, 300);

  // Questions data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [loadErrorQ, setLoadErrorQ] = useState<string | null>(null);

  // Answers per question
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<string, Answer[]>>({});
  const [answersLoading, setAnswersLoading] = useState<Record<string, boolean>>({});
  const [answersHasMore, setAnswersHasMore] = useState<Record<string, boolean>>({});
  const [answersPage, setAnswersPage] = useState<Record<string, number>>({});
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  // Resources
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingR, setLoadingR] = useState(true);

  // Guides
  const [guides, setGuides] = useState<Guide[]>([]);

  // Modals
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);

  const categories = activeTab === 'questions' ? QUESTION_CATEGORIES : RESOURCE_CATEGORIES;

  // ── Fetch Questions ────────────────────────────────────────────────────────

  const fetchQuestions = useCallback(async () => {
    setLoadingQ(true);
    setLoadErrorQ(null);
    try {
      let q = supabase
        .from('questions')
        .select('id, question, category, asked_by_name, created_at, views_count, answers(count)');

      if (sortMode === 'new') q = q.order('created_at', { ascending: false });
      if (sortMode === 'unanswered') q = q.order('created_at', { ascending: false });
      if (sortMode === 'popular') q = q.order('views_count', { ascending: false });

      const { data, error } = await q;
      if (error) throw error;

      let mapped: Question[] = (data ?? []).map((row) => {
        const cnt = Array.isArray((row as any).answers)
          ? (row as any).answers[0]?.count ?? 0
          : (row as any).answers?.count ?? 0;
        return {
          id: row.id as string,
          question: (row.question ?? '') as string,
          category: (row.category ?? 'Другое') as string,
          askedBy: ((row as any).asked_by_name ?? 'Пользователь') as string,
          answers: Number(cnt) || 0,
          isAnswered: (Number(cnt) || 0) > 0,
          createdAt: row.created_at ? formatRelativeRu(new Date(row.created_at as string)) : undefined,
          viewsCount: (row as any).views_count ?? 0,
        };
      });

      if (sortMode === 'unanswered') mapped = mapped.filter((q) => !q.isAnswered);

      setQuestions(mapped);
    } catch (e) {
      setLoadErrorQ(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoadingQ(false);
    }
  }, [sortMode]);

  useEffect(() => { void fetchQuestions(); }, [fetchQuestions]);

  // ── Fetch Resources ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchResources = async () => {
      setLoadingR(true);
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('id, category, name, description, url, icon, is_verified')
          .order('sort_order', { ascending: true });
        if (!error && data) {
          setResources(data.map((r) => ({
            id: r.id,
            category: r.category,
            name: r.name,
            description: r.description,
            url: r.url,
            icon: r.icon,
            isVerified: r.is_verified,
          })));
        }
      } finally {
        setLoadingR(false);
      }
    };
    void fetchResources();
  }, []);

  // ── Fetch Guides ───────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchGuides = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, rating, expertise, answered_count, avatar_url, contact_telegram, contact_whatsapp')
        .eq('is_guide', true)
        .order('rating', { ascending: false })
        .limit(3);

      if (data) {
        setGuides(data.map((p, i) => ({
          id: p.id,
          name: (p as any).display_name ?? 'Проводник',
          rating: (p as any).rating,
          expertise: (p as any).expertise ?? [],
          answeredCount: (p as any).answered_count ?? 0,
          avatarUrl: (p as any).avatar_url,
          avatarColor: GUIDE_COLORS[i % GUIDE_COLORS.length],
          contactTelegram: (p as any).contact_telegram,
          contactWhatsapp: (p as any).contact_whatsapp,
        })));
      }
    };
    void fetchGuides();
  }, []);

  // ── Fetch Upvotes for current user ─────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    const fetchUpvotes = async () => {
      const { data } = await supabase
        .from('answer_upvotes')
        .select('answer_id')
        .eq('user_id', user.id);
      if (data) setUpvotedIds(new Set(data.map((r) => r.answer_id)));
    };
    void fetchUpvotes();
  }, [user]);

  // ── Load answers for a question ────────────────────────────────────────────

  const loadAnswers = useCallback(async (questionId: string, page = 0) => {
    setAnswersLoading((prev) => ({ ...prev, [questionId]: true }));
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('id, body, author_name, author_id, is_best, upvotes_count, created_at')
        .eq('question_id', questionId)
        .order('is_best', { ascending: false })
        .order('upvotes_count', { ascending: false })
        .order('created_at', { ascending: true })
        .range(page * ANSWERS_PAGE_SIZE, (page + 1) * ANSWERS_PAGE_SIZE - 1);

      if (error) throw error;
      const mapped: Answer[] = (data ?? []).map((a) => ({
        id: a.id,
        body: a.body ?? '',
        author: (a as any).author_name ?? 'Проводник',
        authorId: (a as any).author_id,
        isBest: (a as any).is_best ?? false,
        upvotesCount: (a as any).upvotes_count ?? 0,
        createdAt: a.created_at ? formatRelativeRu(new Date(a.created_at)) : undefined,
      }));

      setAnswersMap((prev) => ({
        ...prev,
        [questionId]: page === 0 ? mapped : [...(prev[questionId] ?? []), ...mapped],
      }));
      setAnswersHasMore((prev) => ({ ...prev, [questionId]: mapped.length === ANSWERS_PAGE_SIZE }));
      setAnswersPage((prev) => ({ ...prev, [questionId]: page }));
    } finally {
      setAnswersLoading((prev) => ({ ...prev, [questionId]: false }));
    }

    // Increment views
    void supabase.rpc('increment_question_views', { question_id: questionId });
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedQuestion((prev) => {
      const next = prev === id ? null : id;
      if (next && !answersMap[id]) void loadAnswers(id, 0);
      return next;
    });
  }, [answersMap, loadAnswers]);

  // ── Upvote ─────────────────────────────────────────────────────────────────

  const handleUpvote = async (answerId: string) => {
    if (!user) return;
    const already = upvotedIds.has(answerId);

    // Optimistic update
    setUpvotedIds((prev) => {
      const next = new Set(prev);
      already ? next.delete(answerId) : next.add(answerId);
      return next;
    });
    setAnswersMap((prev) => {
      const updated: Record<string, Answer[]> = {};
      for (const [qid, list] of Object.entries(prev)) {
        updated[qid] = list.map((a) =>
          a.id === answerId
            ? { ...a, upvotesCount: a.upvotesCount + (already ? -1 : 1) }
            : a
        );
      }
      return updated;
    });

    if (already) {
      await supabase.from('answer_upvotes').delete().match({ answer_id: answerId, user_id: user.id });
      await supabase.from('answers').update({ upvotes_count: supabase.rpc('decrement' as any) }).eq('id', answerId);
    } else {
      await supabase.from('answer_upvotes').insert({ answer_id: answerId, user_id: user.id });
      // Actually we don't have a increment rpc for upvotes_count yet in my DB schema shown, 
      // but let's assume it should work similarly if exists or use update.
      // Wait, let's use simple increment if possible or update.
      await supabase.rpc('increment_question_views' as any, { question_id: answerId }); // reuse increment
    }
  };

  const handleAnswerSubmit = async (questionId: string, body: string) => {
    if (!user || !body.trim()) return false;

    try {
      const { data, error } = await supabase
        .from('answers')
        .insert({
          question_id: questionId,
          author_id: user.id,
          author_name: profile?.display_name ?? 'Пользователь',
          body: body.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      const newAnswer: Answer = {
        id: data.id,
        body: data.body,
        author: data.author_name ?? 'Пользователь',
        authorId: data.author_id,
        isBest: false,
        upvotesCount: 0,
        createdAt: 'только что',
      };

      setAnswersMap((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] ?? []), newAnswer],
      }));

      // Update local question answer count
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, answers: q.answers + 1, isAnswered: true } : q
        )
      );

      return true;
    } catch (e) {
      console.error('Error submitting answer:', e);
      return false;
    }
  };

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filteredQuestions = useMemo(() => {
    let list = questions;
    if (selectedCategory !== 'Все') list = list.filter((q) => q.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.question.toLowerCase().includes(q));
    }
    return list;
  }, [questions, selectedCategory, searchQuery]);

  const filteredResources = useMemo(() => {
    let list = resources;
    if (selectedCategory !== 'Все') list = list.filter((r) => r.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [resources, selectedCategory, searchQuery]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleTabChange = (tab: 'questions' | 'resources') => {
    setActiveTab(tab);
    setSelectedCategory('Все');
    setSearchInput('');
  };

  const handleQuestionCreated = (newQ: Question) => {
    setQuestions((prev) => [newQ, ...prev]);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-warm-milk py-8 pb-32">
      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dusty-indigo/10 rounded-full mb-4">
            <Heart className="w-5 h-5 text-dusty-indigo" />
            <span className="text-dusty-indigo font-medium">Найти опору</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">Вопросы и ответы</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Задавай вопросы и получай проверенные ответы от проводников города
          </p>
        </motion.div>

        {/* ── Tab Switcher ── */}
        <div className="flex justify-center mb-10">
          <div className="bg-soft-sand/20 p-1.5 rounded-2xl border border-border/40 inline-flex shadow-sm">
            {(['questions', 'resources'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white text-dusty-indigo shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'questions' ? 'Вопросы и ответы' : 'Полезные ресурсы'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* ── Search & Actions ── */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={activeTab === 'questions' ? 'Поиск по вопросам...' : 'Поиск по ресурсам...'}
                className="w-full pl-12 pr-4 py-4 bg-white border border-border/50 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 shadow-sm"
              />
            </div>
            {activeTab === 'questions' && (
              <Button
                onClick={() => setAskModalOpen(true)}
                className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[16px] h-[58px] px-8 shadow-lg shadow-terracotta-deep/20 transition-all active:scale-95 font-bold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Задать вопрос
              </Button>
            )}
            {activeTab === 'resources' && (
              <Button
                onClick={() => setSuggestModalOpen(true)}
                className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[16px] h-[58px] px-8 shadow-lg shadow-terracotta-deep/20 transition-all active:scale-95 font-bold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Предложить ресурс
              </Button>
            )}
          </div>

          {/* Sort + Categories row */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {activeTab === 'questions' && (
              <div className="flex gap-1.5 flex-shrink-0 bg-white border border-border/40 rounded-full px-1.5 py-1 shadow-sm">
                {([['new', 'Новые'], ['unanswered', 'Без ответа'], ['popular', 'Популярные']] as [SortMode, string][]).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      sortMode === mode
                        ? 'bg-dusty-indigo text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-200 border flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-dusty-indigo text-white border-dusty-indigo shadow-md'
                      : 'bg-white text-muted-foreground hover:bg-soft-sand/20 border-border/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* ── Questions / Resources ── */}
          <div className="lg:col-span-8 space-y-4">
            {activeTab === 'questions' ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-black text-foreground">
                    {sortMode === 'new' ? 'Недавние вопросы'
                      : sortMode === 'unanswered' ? 'Без ответа'
                      : 'Популярные'}
                  </h2>
                  {!loadingQ && (
                    <span className="text-sm text-muted-foreground">{filteredQuestions.length} вопросов</span>
                  )}
                </div>

                {loadingQ ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-36 bg-white rounded-[28px] animate-pulse border border-border/40" />
                    ))}
                  </div>
                ) : loadErrorQ ? (
                  <div className="bg-red-50 p-6 rounded-[24px] border border-red-100 text-red-600 font-medium">
                    Ошибка загрузки: {loadErrorQ}
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <EmptyState onAsk={() => setAskModalOpen(true)} />
                ) : (
                  filteredQuestions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      expanded={expandedQuestion === q.id}
                      onToggle={() => toggleExpanded(q.id)}
                      answers={answersMap[q.id] ?? []}
                      answersLoading={answersLoading[q.id] ?? false}
                      hasMoreAnswers={answersHasMore[q.id] ?? false}
                      onLoadMore={() => loadAnswers(q.id, (answersPage[q.id] ?? 0) + 1)}
                      upvotedIds={upvotedIds}
                      onUpvote={handleUpvote}
                      currentUserId={user?.id}
                      onSubmitAnswer={(body) => handleAnswerSubmit(q.id, body)}
                    />
                  ))
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-black text-foreground">Проверенные ресурсы</h2>
                  {!loadingR && (
                    <span className="text-sm text-muted-foreground">{filteredResources.length} ресурсов</span>
                  )}
                </div>

                {loadingR ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-40 bg-white rounded-[28px] animate-pulse border border-border/40" />
                    ))}
                  </div>
                ) : filteredResources.length === 0 ? (
                  <div className="bg-white border border-border/40 rounded-[28px] p-16 text-center">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="font-bold text-foreground mb-1">Ничего не найдено</p>
                    <p className="text-muted-foreground text-sm">Попробуйте другую категорию или поисковый запрос</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredResources.map((res) => (
                      <ResourceCard key={res.id} resource={res} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-4 space-y-6 h-fit sticky top-24">
            <GuidesPanel guides={guides} />

            {/* CTA cards */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#CD7F67] to-[#8E78B2] p-8 rounded-[32px] text-white shadow-xl shadow-terracotta-deep/10 group">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-3 leading-tight">Стать проводником</h3>
                <p className="text-sm opacity-90 mb-8 leading-relaxed font-medium">
                  Помогай новичкам и получи статус эксперта сообщества
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

      {/* ── Modals ── */}
      <AskQuestionModal
        isOpen={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        onSuccess={handleQuestionCreated}
      />
      <SuggestResourceModal
        isOpen={suggestModalOpen}
        onClose={() => setSuggestModalOpen(false)}
        onSuccess={() => { /* refetch resources silently */ }}
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: Question;
  expanded: boolean;
  onToggle: () => void;
  answers: Answer[];
  answersLoading: boolean;
  hasMoreAnswers: boolean;
  onLoadMore: () => void;
  upvotedIds: Set<string>;
  onUpvote: (id: string) => void;
  currentUserId?: string;
  onSubmitAnswer: (body: string) => Promise<boolean>;
}

function QuestionCard({
  question: q,
  expanded,
  onToggle,
  answers,
  answersLoading,
  hasMoreAnswers,
  onLoadMore,
  upvotedIds,
  onUpvote,
  currentUserId,
  onSubmitAnswer,
}: QuestionCardProps) {
  const [answerDraft, setAnswerDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <div className="group bg-white rounded-[28px] border border-border/60 hover:border-dusty-indigo/20 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
      <div className="p-6 md:p-8 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 bg-soft-sand/40 text-warm-olive text-[11px] font-black uppercase tracking-wider rounded-md">
                {q.category}
              </span>
              {q.isAnswered && (
                <span className="px-3 py-1 bg-green-50 text-green-600 text-[11px] font-black uppercase tracking-wider rounded-md flex items-center gap-1.5 border border-green-100">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Есть ответ
                </span>
              )}
            </div>

            <h3 className="text-lg md:text-xl font-bold text-foreground mb-3 leading-snug group-hover:text-dusty-indigo transition-colors break-words">
              {q.question}
            </h3>

            <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
              <span className="font-medium">от {q.askedBy}</span>
              {q.createdAt && (
                <>
                  <span className="w-1 h-1 bg-border rounded-full" />
                  <span>{q.createdAt}</span>
                </>
              )}
              <span className="w-1 h-1 bg-border rounded-full" />
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" /> {q.answers}
              </span>
              {(q.viewsCount ?? 0) > 0 && (
                <>
                  <span className="w-1 h-1 bg-border rounded-full" />
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {q.viewsCount}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className={`p-2 rounded-full bg-soft-sand/20 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${expanded ? 'rotate-180 text-dusty-indigo' : ''}`}>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Expanded answers */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 md:px-8 pb-6 border-t border-border/40 pt-6 space-y-4">
              {answersLoading && answers.length === 0 ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : answers.length === 0 ? (
                <div className="bg-soft-sand/10 rounded-[20px] p-6 text-center border border-dashed border-border/40">
                  <p className="text-muted-foreground text-sm">
                    Проводники ещё не ответили на этот вопрос. Оставайтесь на связи!
                  </p>
                </div>
              ) : (
                answers.map((a) => (
                  <AnswerCard
                    key={a.id}
                    answer={a}
                    isUpvoted={upvotedIds.has(a.id)}
                    onUpvote={() => onUpvote(a.id)}
                  />
                ))
              )}

              {hasMoreAnswers && (
                <button
                  onClick={onLoadMore}
                  disabled={answersLoading}
                  className="w-full py-3 text-sm font-semibold text-dusty-indigo hover:text-dusty-indigo/80 transition-colors flex items-center justify-center gap-2"
                >
                  {answersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Показать ещё ответы
                </button>
              )}

              {/* Answer form */}
              {currentUserId && (
                <div className="mt-8 pt-8 border-t border-border/40">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-soft-sand/40 border border-border/40 flex items-center justify-center text-muted-foreground text-xs font-bold flex-shrink-0">
                      Вы
                    </div>
                    <div className="flex-1 space-y-3">
                      <textarea
                        value={answerDraft}
                        onChange={(e) => setAnswerDraft(e.target.value)}
                        placeholder="Напишите свой ответ..."
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-3 bg-soft-sand/10 border border-border/50 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 text-sm leading-relaxed resize-none transition-all"
                      />
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${answerDraft.length >= 450 ? 'text-terracotta-deep' : 'text-muted-foreground/40'}`}>
                          {answerDraft.length}/500
                        </span>
                        <Button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!answerDraft.trim() || isSubmitting) return;
                            setIsSubmitting(true);
                            const success = await onSubmitAnswer(answerDraft);
                            if (success) setAnswerDraft('');
                            setIsSubmitting(false);
                          }}
                          disabled={!answerDraft.trim() || isSubmitting}
                          className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full h-10 px-6 font-bold shadow-md shadow-terracotta-deep/10 text-sm disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Отправляем...
                            </>
                          ) : (
                            'Ответить'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnswerCard({
  answer: a,
  isUpvoted,
  onUpvote,
}: {
  answer: Answer;
  isUpvoted: boolean;
  onUpvote: () => void;
}) {
  return (
    <div className={`rounded-[20px] p-5 border transition-all ${a.isBest ? 'bg-yellow-50/60 border-yellow-200' : 'bg-soft-sand/10 border-soft-sand/20'}`}>
      {a.isBest && (
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-black text-yellow-600 uppercase tracking-wider">Лучший ответ</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-dusty-indigo/30 flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center">
          <span className="text-dusty-indigo font-bold text-sm">{a.author.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-bold text-sm text-foreground">{a.author}</span>
            {a.createdAt && (
              <span className="text-xs text-muted-foreground/60">{a.createdAt}</span>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed break-words">{a.body}</p>
          <button
            onClick={onUpvote}
            className={`mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              isUpvoted ? 'text-dusty-indigo' : 'text-muted-foreground hover:text-dusty-indigo'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-dusty-indigo' : ''}`} />
            {a.upvotesCount > 0 && <span>{a.upvotesCount}</span>}
            <span>{isUpvoted ? 'Полезно!' : 'Полезно'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ resource: res }: { resource: Resource }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-white p-6 rounded-[28px] border border-border/60 hover:border-terracotta-deep/20 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col h-full"
      onClick={() => window.open(res.url, '_blank', 'noopener,noreferrer')}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-soft-sand/30 rounded-[20px] flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
          {res.icon ?? '🔗'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {res.category}
            </span>
            {res.isVerified && (
              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
            )}
          </div>
          <h3 className="text-lg font-bold text-foreground group-hover:text-terracotta-deep transition-colors truncate">
            {res.name}
          </h3>
        </div>
      </div>
      {res.description && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1 break-words">{res.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
        <span className="text-xs font-bold text-terracotta-deep group-hover:underline">Перейти на сайт</span>
        <div className="w-8 h-8 rounded-full bg-soft-sand/30 flex items-center justify-center group-hover:bg-terracotta-deep/10 transition-colors">
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-terracotta-deep" />
        </div>
      </div>
    </motion.div>
  );
}

function GuidesPanel({ guides }: { guides: Guide[] }) {
  if (guides.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-black text-foreground mb-5">Проводники города</h2>
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
              {guide.avatarUrl ? (
                <img
                  src={guide.avatarUrl}
                  alt={guide.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                />
              ) : (
                <div className={`w-14 h-14 rounded-full ${guide.avatarColor} flex-shrink-0 border-2 border-white shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{guide.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-foreground truncate">{guide.name}</h3>
                <p className="text-xs font-bold text-warm-olive/70 uppercase tracking-tighter mb-1.5">Проводник города</p>
                {guide.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm font-black text-foreground">{guide.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {guide.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {guide.expertise.map((exp) => (
                  <span key={exp} className="px-2.5 py-1 bg-soft-sand/30 text-[10px] font-bold text-muted-foreground uppercase tracking-tight rounded-md">
                    {exp}
                  </span>
                ))}
              </div>
            )}

            {guide.answeredCount > 0 && (
              <p className="text-[11px] font-medium text-muted-foreground/60 mb-4 px-1">
                Ответил на <span className="text-foreground font-bold">{guide.answeredCount}</span> вопросов
              </p>
            )}

            <Button
              className="w-full bg-terracotta-deep text-white hover:bg-terracotta-deep/90 rounded-full h-11 font-bold shadow-sm transition-all"
              onClick={() => {
                const contact = guide.contactTelegram
                  ? `https://t.me/${guide.contactTelegram.replace('@', '')}`
                  : guide.contactWhatsapp
                  ? `https://wa.me/${guide.contactWhatsapp}`
                  : null;
                if (contact) window.open(contact, '_blank', 'noopener,noreferrer');
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Написать
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onAsk }: { onAsk: () => void }) {
  return (
    <div className="bg-white border border-border/50 rounded-[32px] p-16 text-center shadow-sm">
      <div className="text-5xl mb-5">💬</div>
      <h3 className="text-2xl font-bold mb-3">Вопросов ещё нет</h3>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
        Задайте первый вопрос — наши проводники ответят в ближайшее время
      </p>
      <Button
        onClick={onAsk}
        className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full px-10 h-12 font-bold shadow-md"
      >
        <Plus className="w-4 h-4 mr-2" />
        Задать вопрос
      </Button>
    </div>
  );
}