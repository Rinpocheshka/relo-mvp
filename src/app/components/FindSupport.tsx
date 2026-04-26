import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Heart,
  MessageCircle,
  Star,
  ChevronDown,
  Plus,
  ThumbsUp,
  CheckCircle2,
  ExternalLink,
  SortDesc,
  Loader2,
  Eye,
  Filter,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from './ui/button';
import { UserAvatar } from './UserAvatar';
import { supabase } from '@/lib/supabaseClient';
import { useMessageModal } from '../hooks/useMessageModal';
import { formatRelativeRu } from '@/lib/date';
import { AskQuestionModal } from './AskQuestionModal';
import { CreateArticleModal } from './CreateArticleModal';
import { useAuth } from '@/app/SupabaseAuthProvider';
import { SuggestResourceModal } from './SuggestResourceModal';
import { AuthModal } from './AuthWidget';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  question: string;
  body?: string;
  type?: 'question' | 'article';
  image_url?: string | null;
  askedBy: string;
  category: string;
  createdAt?: string;
  answers: number;
  isAnswered: boolean;
  viewsCount?: number;
  isAnonymous?: boolean;
  authorIsGuide?: boolean;
}

interface Answer {
  id: string;
  body: string;
  author: string;
  authorId: string | null;
  authorAvatarUrl: string | null;
  authorIsGuide?: boolean;
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
  isGuide: boolean;
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
  'Все', 'Жильё', 'Документы/визы', 'Обмен/деньги', 'Дети',
  'О городе', 'Куда сходить', 'Здоровье', 'Для бизнеса', 'О платформе', 'Другое',
];

const RESOURCE_CATEGORIES = [
  'Все', 'Жильё', 'Документы/визы', 'Обмен/деньги', 'Дети',
  'О городе', 'Куда сходить', 'Здоровье', 'Для бизнеса', 'О платформе', 'Другое',
];

const CATEGORY_ICON_MAP: Record<string, string> = {
  'Жильё': '/assets/icons/custom/category_housing.png',
  'Документы/визы': '/assets/icons/custom/passport.png',
  'Обмен/деньги': '/assets/icons/custom/category_finance.png',
  'Дети': '/assets/icons/custom/category_kids_support.png',
  'О городе': '/assets/icons/custom/category_city.png',
  'Куда сходить': '/assets/icons/custom/signpost.png',
  'Здоровье': '/assets/icons/custom/category_health.png',
  'Для бизнеса': '/assets/icons/custom/category_write.png',
  'О платформе': '/assets/icons/custom/platform_about.png',
  'Другое': '/assets/icons/custom/coconut.png',
};

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
  const { user, profile, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  // Tabs & filters
  const [activeTab, setActiveTab] = useState<'questions' | 'resources'>(
    (searchParams.get('tab') as 'questions' | 'resources') || 'questions'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'questions' || tab === 'resources') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchInput, setSearchInput] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('new');
  const [isSearchHelpOpen, setIsSearchHelpOpen] = useState(false);
  
  // Handle search input with 50 char limit
  const handleSearchInputChange = (val: string) => {
    if (val.length <= 50) {
      setSearchInput(val);
    }
  };

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Resources
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingR, setLoadingR] = useState(true);

  // Resource modals
  const [resourceDetailOpen, setResourceDetailOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceFormOpen, setResourceFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { openMessageModal } = useMessageModal();

  const [emblaRef] = useEmblaCarousel({ 
    loop: true, 
    align: 'start',
    dragFree: true,
    breakpoints: {
      '(min-width: 640px)': { active: false }
    }
  });

  // Modals state
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState<Question | null>(null);

  // Guides
  const [guides, setGuides] = useState<Guide[]>([]);

  const categories = activeTab === 'questions' ? QUESTION_CATEGORIES : RESOURCE_CATEGORIES;

  // ── Fetch Questions ────────────────────────────────────────────────────────

  const fetchQuestions = useCallback(async () => {
    setLoadingQ(true);
    setLoadErrorQ(null);
    try {
      let q = supabase
        .from('questions')
        .select('id, question, body, type, image_url, category, asked_by, asked_by_name, created_at, views_count, is_anonymous, status, answers(count), profiles:asked_by(is_guide)', { count: 'exact' })
        .eq('status', 'active');

      // Server-side filtering
      if (selectedCategory !== 'Все') q = q.eq('category', selectedCategory);
      if (searchQuery.trim()) {
        q = q.or(`question.ilike.%${searchQuery}%,body.ilike.%${searchQuery}%`);
      }

      if (sortMode === 'new') q = q.order('created_at', { ascending: false });
      if (sortMode === 'unanswered') q = q.order('created_at', { ascending: false });
      if (sortMode === 'popular') q = q.order('views_count', { ascending: false });

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;

      setTotalQuestions(count || 0);

      let mapped: Question[] = (data ?? []).map((row) => {
        const cnt = Array.isArray((row as any).answers)
          ? (row as any).answers[0]?.count ?? 0
          : (row as any).answers?.count ?? 0;
        return {
          id: row.id as string,
          question: (row.question ?? '') as string,
          body: (row as any).body as string | undefined,
          type: ((row as any).type ?? 'question') as 'question' | 'article',
          image_url: (row as any).image_url as string | null,
          category: (row.category ?? 'Другое') as string,
          askedBy: ((row as any).asked_by_name ?? 'Пользователь') as string,
          answers: Number(cnt) || 0,
          isAnswered: (Number(cnt) || 0) > 0,
          createdAt: row.created_at ? formatRelativeRu(new Date(row.created_at as string)) : undefined,
          viewsCount: (row as any).views_count ?? 0,
          isAnonymous: !!(row as any).is_anonymous,
          authorIsGuide: (row as any).profiles?.is_guide ?? false,
        };
      });

      if (sortMode === 'unanswered') mapped = mapped.filter((q) => !q.isAnswered);

      setQuestions(mapped);
    } catch (e) {
      setLoadErrorQ(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoadingQ(false);
    }
  }, [sortMode, selectedCategory, searchQuery, currentPage]);

  const deepLinkId = searchParams.get('id');
  useEffect(() => {
    if (deepLinkId) {
      // If question is already in list, expand it
      if (questions.some(q => q.id === deepLinkId)) {
        setExpandedQuestion(deepLinkId);
      } else {
        // If not in list, we could fetch it, but usually the first page contains recent ones
        // For now, let's just set the expanded state and hope the fetchAnswers logic handles it
        // Or we could fetch the specific question and add it to the list.
        const fetchAndExpand = async () => {
          const { data, error } = await supabase
            .from('questions')
            .select('id, question, category, asked_by, asked_by_name, created_at, views_count, status, answers(count), profiles:asked_by(is_guide)')
            .eq('id', deepLinkId)
            .eq('status', 'active')
            .single();
          
          if (!error && data) {
            const cnt = Array.isArray((data as any).answers)
              ? (data as any).answers[0]?.count ?? 0
              : (data as any).answers?.count ?? 0;
            const q: Question = {
              id: data.id,
              question: data.question || '',
              category: data.category || 'Другое',
              askedBy: (data as any).asked_by_name || 'Пользователь',
              answers: Number(cnt) || 0,
              isAnswered: (Number(cnt) || 0) > 0,
              createdAt: data.created_at ? formatRelativeRu(new Date(data.created_at as string)) : undefined,
              viewsCount: (data as any).views_count ?? 0,
              isAnonymous: (data as any).is_anonymous as boolean,
              authorIsGuide: (data as any).profiles?.is_guide as boolean,
            };
            setQuestions(prev => [q, ...prev.filter(x => x.id !== q.id)]);
            setExpandedQuestion(q.id);
          }
        };
        void fetchAndExpand();
      }
    }
  }, [deepLinkId, questions.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortMode, selectedCategory, searchQuery]);

  useEffect(() => { void fetchQuestions(); }, [fetchQuestions]);

  // ── Fetch Resources ────────────────────────────────────────────────────────

  const fetchResources = useCallback(async () => {
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
  }, []);

  useEffect(() => { void fetchResources(); }, [fetchResources]);

  // ── Fetch Guides ───────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchGuides = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, rating, expertise, answered_count, avatar_url, contact_telegram, contact_whatsapp, is_guide')
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
          isGuide: (p as any).is_guide ?? true,
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
        .select(`
          id, 
          body, 
          author_name, 
          author_id, 
          is_best, 
          upvotes_count, 
          created_at,
          profiles:author_id(avatar_url, is_guide)
        `)
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
        authorAvatarUrl: (a as any).profiles?.avatar_url,
        authorIsGuide: (a as any).profiles?.is_guide,
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
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
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
            ? { ...a, upvotesCount: Math.max(0, a.upvotesCount + (already ? -1 : 1)) }
            : a
        );
      }
      return updated;
    });

    if (already) {
      // Remove upvote — DB trigger will decrement helpfulness_count on the author's profile
      await supabase.from('answer_upvotes').delete().match({ answer_id: answerId, user_id: user.id });
      // Sync counter in answers table
      const { data: ans } = await supabase.from('answers').select('upvotes_count').eq('id', answerId).single();
      if (ans) {
        await supabase.from('answers').update({ upvotes_count: Math.max(0, (ans.upvotes_count ?? 1) - 1) }).eq('id', answerId);
      }
    } else {
      // Add upvote — DB trigger will increment helpfulness_count on the author's profile
      await supabase.from('answer_upvotes').insert({ answer_id: answerId, user_id: user.id });
      const { data: ans } = await supabase.from('answers').select('upvotes_count, author_id, body').eq('id', answerId).single();
      if (ans) {
        await supabase.from('answers').update({ upvotes_count: (ans.upvotes_count ?? 0) + 1 }).eq('id', answerId);
        // Notify the answer author (if it's not the same user liking their own answer)
        if (ans.author_id && ans.author_id !== user.id) {
          const likerName = profile?.display_name || 'Кто-то';
          const preview = (ans.body ?? '').slice(0, 60) + ((ans.body ?? '').length > 60 ? '…' : '');
          await supabase.from('user_activities').insert({
            user_id: ans.author_id,
            type: 'answer_liked',
            title: `${likerName} отметил ваш ответ полезным`,
            subtitle: preview,
            entity_id: answerId,
          });
        }
      }
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
        authorAvatarUrl: profile?.avatar_url ?? null,
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

      // Notify the question author about the new answer
      const { data: qData } = await supabase
        .from('questions')
        .select('asked_by, question')
        .eq('id', questionId)
        .single();
      if (qData?.asked_by && qData.asked_by !== user.id) {
        const answererName = profile?.display_name || 'Кто-то';
        const qPreview = (qData.question ?? '').slice(0, 60) + ((qData.question ?? '').length > 60 ? '…' : '');
        await supabase.from('user_activities').insert({
          user_id: qData.asked_by,
          type: 'new_answer',
          title: `${answererName} ответил на ваш вопрос`,
          subtitle: qPreview,
          entity_id: data.id,
        });
      }

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
      list = list.filter((item) => 
        item.question.toLowerCase().includes(q) || 
        (item.body ?? '').toLowerCase().includes(q)
      );
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

  // Pagination helper
  const totalPages = Math.ceil(totalQuestions / ITEMS_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleTabChange = (tab: 'questions' | 'resources') => {
    setActiveTab(tab);
    setSelectedCategory('Все');
    setSearchInput('');
  };

  const handleQuestionCreated = (newQ: Question) => {
    setQuestions((prev) => {
      const exists = prev.find(q => q.id === newQ.id);
      if (exists) {
        return prev.map(q => q.id === newQ.id ? { ...q, ...newQ } : q);
      }
      return [newQ, ...prev];
    });
  };

  const handleEditQuestion = (q: Question) => {
    if (q.type === 'article') {
      setArticleToEdit(q);
      setArticleModalOpen(true);
    } else {
      setQuestionToEdit(q);
      setAskModalOpen(true);
    }
  };

  const handleDeleteQuestion = async (id: string, text: string) => {
    if (!confirm(`Вы уверены, что хотите удалить вопрос: "${text}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (e) {
      console.error('Error deleting question:', e);
      alert('Не удалось удалить вопрос');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-warm-milk py-4 md:py-8 pb-12 md:pb-16 overflow-x-hidden">
      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-10"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-3">Вопросы и ответы</h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Здесь делятся опытом и поддержкой: задай вопрос – получишь ответ!
          </p>
        </motion.div>

        {/* ── Tab Switcher ── */}
        <div className="flex justify-center mb-6 md:mb-10">
          <div className="bg-soft-sand/20 p-1 md:p-1.5 rounded-[16px] md:rounded-2xl border border-border/40 inline-flex shadow-sm w-full sm:w-auto">
            {(['questions', 'resources'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-3 sm:px-8 py-2.5 md:py-3 rounded-[12px] md:rounded-xl text-[13px] sm:text-sm font-bold transition-all duration-200 flex-1 sm:flex-initial ${
                  activeTab === tab
                    ? 'bg-white text-dusty-indigo shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'questions' ? 'Вопросы' : 'Ресурсы'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* ── Search & Actions ── */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                placeholder={activeTab === 'questions' ? 'Что узнаем про жизнь здесь сегодня?' : 'Поиск по ресурсам...'}
                className="w-full pl-12 pr-16 py-3.5 md:py-4 bg-white border border-border/50 rounded-[16px] md:rounded-[20px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 shadow-sm text-sm md:text-base"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                {searchInput.length}/50
              </div>
            </div>

            {/* How to search help toggle */}
            <div className="mt-2 px-1">
              <button
                onClick={() => setIsSearchHelpOpen(!isSearchHelpOpen)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/60 hover:text-dusty-indigo transition-colors group"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isSearchHelpOpen ? 'rotate-180 text-dusty-indigo' : ''}`} />
                <span className="uppercase tracking-wider">Как тут искать информацию?</span>
              </button>
              
              <AnimatePresence>
                {isSearchHelpOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'circOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 pb-2 px-2 space-y-2 border-l-2 border-dusty-indigo/10 ml-1.5 mt-1">
                      {[
                        "Проверь свой вопрос через «поиск»",
                        "Если вопрос есть, но есть что добавить — оставь комментарий или напиши напрямую тем, кто уже отвечал на него",
                        "Введи тот же запрос во вкладке «Ресурсы»",
                        "Если вопроса нет — добавь новый",
                        "Мы сообщим когда поступит ответ"
                      ].map((text, idx) => (
                        <div key={idx} className="flex gap-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
                          <span className="font-bold text-dusty-indigo/40 shrink-0">{idx + 1}.</span>
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {activeTab === 'questions' && (
              <>
                <Button
                  onClick={() => user ? setAskModalOpen(true) : setIsAuthModalOpen(true)}
                  className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[16px] h-[52px] md:h-[58px] px-6 md:px-8 shadow-lg shadow-terracotta-deep/20 transition-all active:scale-95 font-bold text-sm md:text-base"
                >
                  <Plus className="w-5 h-5 mr-1 md:mr-2" />
                  Задать вопрос
                </Button>
                {(isAdmin || profile?.is_guide) && (
                  <Button
                    onClick={() => user ? (setArticleToEdit(null), setArticleModalOpen(true)) : setIsAuthModalOpen(true)}
                    className="bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-[16px] h-[52px] md:h-[58px] px-6 md:px-8 shadow-lg shadow-dusty-indigo/20 transition-all active:scale-95 font-bold text-sm md:text-base"
                  >
                    <Plus className="w-5 h-5 mr-1 md:mr-2" />
                    Добавить статью
                  </Button>
                )}
              </>
            )}
            {activeTab === 'resources' && isAdmin && (
              <Button
                onClick={() => user ? setSuggestModalOpen(true) : setIsAuthModalOpen(true)}
                className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[16px] h-[52px] md:h-[58px] px-6 md:px-8 shadow-lg shadow-terracotta-deep/20 transition-all active:scale-95 font-bold text-sm md:text-base"
              >
                <Plus className="w-5 h-5 mr-1 md:mr-2" />
                Добавить ресурс
              </Button>
            )}
          </div>

          {/* Sort & Categories restructured for full visibility without extra labels */}
          <div className="flex flex-col gap-4 md:gap-5">
            {/* Row 1: Sort Buttons */}
            {activeTab === 'questions' && (
              <div className="flex flex-shrink-0 -mx-4 px-5 overflow-x-auto scrollbar-hide">
                <div className="flex gap-1.5 bg-white border border-border/40 rounded-full px-1.5 py-1 shadow-sm whitespace-nowrap min-w-max">
                  {([['new', 'Новые'], ['unanswered', 'Без ответа'], ['popular', 'Популярные']] as [SortMode, string][]).map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => setSortMode(mode)}
                      className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        sortMode === mode
                          ? 'bg-dusty-indigo text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Row 2: Categories Carousel (Mobile) / Wrap (Desktop) */}
            <div className="overflow-visible sm:overflow-visible -mx-4 sm:mx-0 px-5 sm:px-0" ref={emblaRef}>
              <div className="flex sm:flex-wrap sm:justify-center gap-2 md:gap-2.5 pb-2">
                {categories.map((cat) => (
                  <div key={cat} className="flex-shrink-0">
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2 md:px-5 md:py-3 rounded-full whitespace-nowrap text-[12px] md:text-sm font-bold transition-all duration-300 border flex items-center gap-1.5 md:gap-2 ${
                        selectedCategory === cat
                          ? 'bg-dusty-indigo text-white border-dusty-indigo shadow-md shadow-dusty-indigo/10'
                          : 'bg-white text-muted-foreground hover:bg-soft-sand/40 border-border/60 hover:text-foreground shadow-sm'
                      }`}
                    >
                      {CATEGORY_ICON_MAP[cat] && (
                        <img 
                          src={CATEGORY_ICON_MAP[cat] as string} 
                          className={`w-4 h-4 md:w-5 md:h-5 object-contain transition-all duration-300 ${selectedCategory === cat ? 'brightness-0 invert' : ''}`} 
                          alt="" 
                        />
                      )}
                      <span>{cat}</span>
                    </button>
                  </div>
                ))}
              </div>
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
                  <h2 className="text-xl md:text-2xl font-black text-foreground">
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
                  ) : (
                    <>
                      <div className="space-y-4">
                        {filteredQuestions.map((q) => (
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
                            isAdmin={isAdmin}
                            onEdit={() => handleEditQuestion(q)}
                            onDelete={() => handleDeleteQuestion(q.id, q.question)}
                            onSubmitAnswer={(body) => handleAnswerSubmit(q.id, body)}
                          />
                        ))}
                      </div>

                      {/* Pagination Pager */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-1.5 mt-10 mb-6">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => {
                              setCurrentPage(prev => Math.max(1, prev - 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="rounded-xl border-border/40 text-muted-foreground hover:bg-white h-10 w-10 p-0"
                          >
                            <SortDesc className="w-4 h-4 rotate-90" />
                          </Button>

                          {visiblePages.map((p, idx) => (
                            <div key={p} className="flex items-center gap-1.5">
                              {idx > 0 && visiblePages[idx - 1] !== p - 1 && (
                                <span className="text-muted-foreground px-1">...</span>
                              )}
                              <Button
                                variant={currentPage === p ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  setCurrentPage(p);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`rounded-xl h-10 w-10 p-0 font-bold ${
                                  currentPage === p
                                    ? 'bg-dusty-indigo text-white shadow-md shadow-dusty-indigo/20 border-dusty-indigo'
                                    : 'border-border/40 text-muted-foreground hover:bg-white'
                                }`}
                              >
                                {p}
                              </Button>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => {
                              setCurrentPage(prev => Math.min(totalPages, prev + 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="rounded-xl border-border/40 text-muted-foreground hover:bg-white h-10 w-10 p-0"
                          >
                            <SortDesc className="w-4 h-4 -rotate-90" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-3 gap-x-6 mb-4">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-black text-foreground leading-tight">Проверенные ресурсы</h2>
                    {!loadingR && (
                      <span className="text-xs font-bold text-muted-foreground/60 bg-soft-sand/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {filteredResources.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isAdmin && (
                      <button
                        onClick={() => { setEditingResource(null); setResourceFormOpen(true); }}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-dusty-indigo text-white rounded-full text-sm font-bold hover:bg-dusty-indigo/90 transition-all shadow-md shadow-dusty-indigo/10 active:scale-[0.98]"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить
                      </button>
                    )}
                  </div>
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
                      <ResourceCard
                        key={res.id}
                        resource={res}
                        isAdmin={isAdmin}
                        onOpen={() => { setSelectedResource(res); setResourceDetailOpen(true); }}
                        onEdit={() => { setEditingResource(res); setResourceFormOpen(true); }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-4 space-y-6 h-fit sticky top-24">
            <GuidesPanel 
              guides={guides} 
              user={user} 
              onMessage={(id, name) => openMessageModal(id, name)} 
              onAuth={() => setIsAuthModalOpen(true)} 
            />

            {/* CTA cards */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#CD7F67] to-[#8E78B2] p-8 rounded-[32px] text-white shadow-xl shadow-terracotta-deep/10 group">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-3 leading-tight">Стать проводником</h3>
                <p className="text-sm opacity-90 mb-8 leading-relaxed font-medium">
                  Помогай новичкам и получи статус эксперта сообщества
                </p>
                <Link
                  to="/become-guide"
                  className="w-full bg-white/10 border border-white/30 text-white hover:bg-white hover:text-terracotta-deep rounded-full h-12 font-bold transition-all shadow-lg flex items-center justify-center text-sm"
                >
                  Узнать больше
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Modals ── */}
      <AskQuestionModal
        key={questionToEdit?.id ?? 'new-question'}
        isOpen={askModalOpen}
        onClose={() => {
          setAskModalOpen(false);
          setQuestionToEdit(null);
        }}
        onSuccess={handleQuestionCreated}
        questionToEdit={questionToEdit ? {
          id: questionToEdit.id,
          question: questionToEdit.question,
          category: questionToEdit.category,
          isAnonymous: !!questionToEdit.isAnonymous
        } : null}
      />
      <CreateArticleModal
        key={articleToEdit?.id ?? 'new-article'}
        isOpen={articleModalOpen}
        onClose={() => {
          setArticleModalOpen(false);
          setArticleToEdit(null);
        }}
        onSuccess={handleQuestionCreated}
        articleToEdit={articleToEdit}
      />
      <SuggestResourceModal
        isOpen={suggestModalOpen}
        onClose={() => setSuggestModalOpen(false)}
        onSuccess={() => { void fetchResources(); }}
      />
      {resourceDetailOpen && selectedResource && (
        <ResourceDetailModal
          resource={selectedResource}
          isAdmin={isAdmin}
          onClose={() => setResourceDetailOpen(false)}
          onEdit={() => { setEditingResource(selectedResource); setResourceDetailOpen(false); setResourceFormOpen(true); }}
          onDelete={async () => {
            if (!confirm(`Удалить ресурс «${selectedResource.name}»?`)) return;
            await supabase.from('resources').delete().eq('id', selectedResource.id);
            setResourceDetailOpen(false);
            void fetchResources();
          }}
        />
      )}
      {resourceFormOpen && (
        <ResourceFormModal
          resource={editingResource}
          onClose={() => setResourceFormOpen(false)}
          onSuccess={() => { setResourceFormOpen(false); void fetchResources(); }}
        />
      )}
      <AuthModal 
        open={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
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
  isAdmin?: boolean;
  onEdit: () => void;
  onDelete: () => void;
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
  isAdmin,
  onEdit,
  onDelete,
  onSubmitAnswer,
}: QuestionCardProps) {
  const [answerDraft, setAnswerDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <div className={`group rounded-[28px] border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden ${
      q.type === 'article'
        ? 'bg-[#F3F1F9] border-dusty-indigo/40 hover:border-dusty-indigo/60 hover:shadow-dusty-indigo/10'
        : 'bg-white border-border/60 hover:border-dusty-indigo/20'
    }`}>
      {/* Article: colored top accent bar */}
      {q.type === 'article' && (
        <div className="h-1.5 w-full bg-gradient-to-r from-dusty-indigo to-[#8E78B2]" />
      )}
      <div className="p-6 md:p-8 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {q.type === 'article' && (
                <span className="px-3 py-1 bg-dusty-indigo/10 text-dusty-indigo text-[11px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                  📄 Статья
                </span>
              )}
              <span className="px-3 py-1 bg-soft-sand/40 text-warm-olive text-[11px] font-black uppercase tracking-wider rounded-md">
                {q.category}
              </span>
              {q.isAnswered && q.type !== 'article' && (
                <span className="px-3 py-1 bg-green-50 text-green-600 text-[11px] font-black uppercase tracking-wider rounded-md flex items-center gap-1.5 border border-green-100">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Есть ответ
                </span>
              )}
            </div>

            <h3 className={`text-lg md:text-xl font-bold text-foreground mb-3 leading-snug group-hover:text-dusty-indigo transition-colors break-words ${!expanded ? 'line-clamp-1' : ''}`}>
              {q.question}
            </h3>
            {q.type === 'article' && q.body && !expanded && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{q.body}</p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
              <span className="font-medium flex items-center gap-1.5">
                {q.isAnonymous ? 'Анонимно' : `от ${q.askedBy}`}
                {!q.isAnonymous && q.authorIsGuide && (
                  <img src="/assets/icons/custom/guide_badge.png" className="w-4 h-4 object-contain" alt="Guide" />
                )}
              </span>
              {q.createdAt && (
                <>
                  <span className="w-1 h-1 bg-border rounded-full" />
                  <span>{q.createdAt}</span>
                </>
              )}
              <span className="w-1 h-1 bg-border rounded-full" />
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" /> {q.answers} {q.type === 'article' ? 'комм.' : ''}
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

          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-2 rounded-full hover:bg-dusty-indigo/10 text-muted-foreground hover:text-dusty-indigo transition-colors"
                  title="Редактировать"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-2 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className={`p-2 rounded-full bg-soft-sand/20 text-muted-foreground transition-transform duration-300 ${expanded ? 'rotate-180 text-dusty-indigo' : ''}`}>
              <ChevronDown className="w-5 h-5" />
            </div>
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
              {/* Article: full image + body */}
              {q.type === 'article' && q.image_url && (
                <div className="w-full aspect-video rounded-[16px] overflow-hidden mb-2">
                  <img src={q.image_url} alt={q.question} className="w-full h-full object-cover" />
                </div>
              )}
              {q.type === 'article' && q.body && (
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed text-sm mb-4">
                  {q.body.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                    /^https?:\/\//.test(part)
                      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-dusty-indigo underline break-all">{part}</a>
                      : <span key={i}>{part}</span>
                  )}
                </div>
              )}
              {q.type === 'article' && (
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Комментарии</p>
              )}
              {answersLoading && answers.length === 0 ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : answers.length === 0 ? (
                <div className="bg-soft-sand/10 rounded-[20px] p-6 text-center border border-dashed border-border/40">
                  <p className="text-muted-foreground text-sm">
                    {q.type === 'article' ? 'Пока комментариев нет.' : 'Пока ответов нет.'}
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
        <UserAvatar 
          src={a.authorAvatarUrl} 
          name={a.author} 
          isGuide={a.authorIsGuide} 
          size="sm" 
          className="border-2 border-white !shadow-sm" 
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              {a.author}
              {a.authorIsGuide && <img src="/assets/icons/custom/guide_badge.png" className="w-3.5 h-3.5 object-contain" alt="Guide" />}
            </span>
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

function ResourceCard({
  resource: res,
  isAdmin,
  onOpen,
  onEdit,
}: {
  resource: Resource;
  isAdmin: boolean;
  onOpen: () => void;
  onEdit: () => void;
}) {
  // Determine if icon is a URL/path or an emoji
  const iconIsImage = res.icon && (res.icon.startsWith('/') || res.icon.startsWith('http'));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-white p-6 rounded-[28px] border border-border/60 hover:border-terracotta-deep/20 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col h-full"
      onClick={onOpen}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-soft-sand/30 rounded-[20px] flex items-center justify-center text-3xl shadow-inner flex-shrink-0 overflow-hidden">
          {iconIsImage
            ? <img src={res.icon!} alt={res.name} className="w-full h-full object-contain p-1" />
            : <span>{res.icon ?? '🔗'}</span>
          }
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
        {isAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 rounded-full hover:bg-dusty-indigo/10 text-muted-foreground hover:text-dusty-indigo transition-colors flex-shrink-0"
            title="Редактировать"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
      {res.description && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1 line-clamp-3 break-words">{res.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            const finalUrl = res.url.startsWith('http') ? res.url : `https://${res.url}`;
            window.open(finalUrl, '_blank', 'noopener,noreferrer'); 
          }}
          className="text-xs font-bold text-terracotta-deep hover:underline flex items-center gap-1.5"
        >
          Перейти на сайт
          <ExternalLink className="w-3 h-3" />
        </button>
        <span className="text-xs text-muted-foreground">Подробнее →</span>
      </div>
    </motion.div>
  );
}

// ── Resource Detail Modal ────────────────────────────────────────────────────

function ResourceDetailModal({
  resource: res,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
}: {
  resource: Resource;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const iconIsImage = res.icon && (res.icon.startsWith('/') || res.icon.startsWith('http'));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white w-full sm:max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30 flex-shrink-0">
            <span className="px-3 py-1 bg-soft-sand/40 text-warm-olive text-[11px] font-black uppercase tracking-wider rounded-md">
              {res.category}
            </span>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-2 rounded-full hover:bg-dusty-indigo/10 text-muted-foreground hover:text-dusty-indigo transition-colors"
                    title="Редактировать"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-2 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-soft-sand/40 text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-6 py-6 space-y-5">
            {/* Logo + Title */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-soft-sand/30 rounded-[20px] flex items-center justify-center text-4xl shadow-inner flex-shrink-0 overflow-hidden">
                {iconIsImage
                  ? <img src={res.icon!} alt={res.name} className="w-full h-full object-contain p-2" />
                  : <span>{res.icon ?? '🔗'}</span>
                }
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground leading-tight">{res.name}</h2>
                {res.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-bold mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Проверенный ресурс
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {res.description && (
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{res.description}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t border-border/30 flex-shrink-0">
            <Button
              onClick={() => {
                const finalUrl = res.url.startsWith('http') ? res.url : `https://${res.url}`;
                window.open(finalUrl, '_blank', 'noopener,noreferrer');
              }}
              className="w-full bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full h-12 font-bold shadow-sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Перейти на сайт
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Resource Form Modal (Admin) ───────────────────────────────────────────────

function ResourceFormModal({
  resource,
  onClose,
  onSuccess,
}: {
  resource: Resource | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const isEdit = !!resource;
  const [name, setName] = useState(resource?.name ?? '');
  const [icon, setIcon] = useState(resource?.icon ?? '');
  const [category, setCategory] = useState(resource?.category ?? 'Другое');
  const [description, setDescription] = useState(resource?.description ?? '');
  const [url, setUrl] = useState(resource?.url ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAttachment, setSelectedAttachment] = useState<{file: File, preview: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const iconIsImage = icon && (icon.startsWith('/') || icon.startsWith('http'));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой. Максимум 5 МБ.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    let fileToProcess = file;

    // Optional HEIC check here if it's not strictly passed by validTypes but extension is 
    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    
    if (!validTypes.includes(file.type) && !isHeic) {
      setError('Неподдерживаемый формат. Пожалуйста, загрузите JPEG, PNG, WEBP или HEIC.');
      return;
    }

    setError(null);

    if (isHeic) {
      try {
        const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        fileToProcess = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
      } catch (err) {
        setError(`Не удалось обработать HEIC.`);
        return;
      }
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedAttachment({ file: fileToProcess, preview: reader.result as string });
    };
    reader.readAsDataURL(fileToProcess);
    
    if (e.target) e.target.value = '';
  };

  const uploadIcon = async (): Promise<string | null> => {
    if (!selectedAttachment) return icon;
    const file = selectedAttachment.file;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Math.random()}.${fileExt}`;
    const filePath = `resources/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('announcements').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('announcements').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) {
      setError('Заполните название и ссылку');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const finalIconUrl = await uploadIcon();
      
      // Normalize URL: ensure it has a protocol
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('/')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      if (isEdit && resource) {
        const { error: e } = await supabase
          .from('resources')
          .update({ name: name.trim(), icon: finalIconUrl, category, description: description.trim() || null, url: normalizedUrl })
          .eq('id', resource.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase
          .from('resources')
          .insert({ name: name.trim(), icon: finalIconUrl, category, description: description.trim() || null, url: normalizedUrl, is_verified: true, sort_order: 0 });
        if (e) throw e;
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white w-full sm:max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30 flex-shrink-0">
            <h2 className="text-xl font-black text-foreground">
              {isEdit ? 'Редактировать ресурс' : 'Новый ресурс'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-soft-sand/40 text-muted-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="overflow-y-auto flex-1 px-6 py-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-[16px] px-4 py-3">{error}</div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">Заголовок *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название ресурса"
                className="w-full px-4 py-3 bg-soft-sand/20 border border-border/50 rounded-[16px] text-sm focus:outline-none focus:ring-2 focus:ring-dusty-indigo/30 focus:border-dusty-indigo/50 transition-all"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">Логотип</label>
              <div className="flex gap-4 items-center">
                <div 
                  className={`w-20 h-20 bg-soft-sand/30 rounded-[20px] flex items-center justify-center text-3xl overflow-hidden flex-shrink-0 border-2 border-dashed ${selectedAttachment ? 'border-transparent' : 'border-border/60 hover:border-dusty-indigo/50 cursor-pointer'}`}
                  onClick={() => !selectedAttachment && fileInputRef.current?.click()}
                >
                  {selectedAttachment ? (
                    <div className="relative w-full h-full group">
                      <img src={selectedAttachment.preview} alt="Preview" className="w-full h-full object-contain p-1" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setSelectedAttachment(null)}>
                        <Trash2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : iconIsImage ? (
                    <div className="relative w-full h-full group">
                      <img src={icon} alt="Icon" className="w-full h-full object-contain p-1" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setIcon('')}>
                        <Trash2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <ImagePlus className="w-8 h-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/jpeg, image/png, image/webp, image/heic, image/heif"
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full shadow-sm text-xs font-bold"
                  >
                    Загрузить фото
                  </Button>
                  <p className="text-[11px] text-muted-foreground mt-2 font-medium">JPEG, PNG, WEBP (до 5 МБ)</p>
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-soft-sand/20 border border-border/50 rounded-[16px] text-sm focus:outline-none focus:ring-2 focus:ring-dusty-indigo/30 focus:border-dusty-indigo/50 transition-all appearance-none"
              >
                {['Жильё','Документы/визы','Обмен/деньги','Дети','О городе','Куда сходить','Здоровье','Для бизнеса','О платформе','Другое'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Подробное описание ресурса..."
                rows={5}
                className="w-full px-4 py-3 bg-soft-sand/20 border border-border/50 rounded-[16px] text-sm focus:outline-none focus:ring-2 focus:ring-dusty-indigo/30 focus:border-dusty-indigo/50 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">Ссылка на сайт *</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
                className="w-full px-4 py-3 bg-soft-sand/20 border border-border/50 rounded-[16px] text-sm focus:outline-none focus:ring-2 focus:ring-dusty-indigo/30 focus:border-dusty-indigo/50 transition-all"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t border-border/30 flex gap-3 flex-shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full h-12 font-bold border-border/50"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-full h-12 font-bold shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEdit ? 'Сохранить' : 'Создать')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function GuidesPanel({ 
  guides, 
  user, 
  onMessage, 
  onAuth 
}: { 
  guides: Guide[]; 
  user: any; 
  onMessage: (id: string, name: string) => void;
  onAuth: () => void;
}) {
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
              <Link to={`/profile/${guide.id}`} className="shrink-0">
                <UserAvatar 
                  src={guide.avatarUrl} 
                  name={guide.name} 
                  isGuide={guide.isGuide} 
                  size="xl" 
                  className="!shadow-sm !border-2 !border-white hover:scale-105 transition-transform" 
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${guide.id}`} className="hover:text-terracotta-deep transition-colors">
                  <h3 className="font-bold text-lg text-foreground truncate group-hover:text-terracotta-deep transition-colors">
                    {guide.name}
                  </h3>
                </Link>
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
                if (!user) {
                  onAuth();
                  return;
                }
                onMessage(guide.id, guide.name);
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