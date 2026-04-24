import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ArrowLeft, 
  Megaphone, 
  Calendar, 
  HelpCircle, 
  Users, 
  ArrowRight,
  Loader2,
  FileText,
  MapPin,
  Tag
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from './ui/button';
import { translateTag } from '@/lib/tags';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'announcement' | 'event' | 'question' | 'resource' | 'profile';
  category?: string;
  image?: string;
  link: string;
}

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle search with 50 char limit
  const handleSearchChange = (val: string) => {
    if (val.length <= 50) {
      setSearchInput(val);
    }
  };

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const term = `%${searchQuery}%`;

      // Parallel queries to all searchable tables
      const [
        announcements,
        events,
        questions,
        resources,
        profiles
      ] = await Promise.all([
        supabase.from('announcements').select('id, title, description, category, images').or(`title.ilike.${term},description.ilike.${term}`).limit(10),
        supabase.from('events').select('id, title, description, location_text, type').or(`title.ilike.${term},description.ilike.${term}`).limit(10),
        supabase.from('questions').select('id, question, body, category').or(`question.ilike.${term},body.ilike.${term}`).limit(10),
        supabase.from('resources').select('id, name, description, category').or(`name.ilike.${term},description.ilike.${term}`).limit(10),
        supabase.from('profiles').select('id, display_name, bio, city').or(`display_name.ilike.${term},bio.ilike.${term}`).limit(10)
      ]);

      const mergedResults: SearchResult[] = [
        ...(announcements.data || []).map(item => ({
          id: item.id,
          title: item.title,
          subtitle: item.description,
          type: 'announcement' as const,
          category: item.category,
          image: (item as any).images?.[0],
          link: `/announcements?id=${item.id}`
        })),
        ...(events.data || []).map(item => ({
          id: item.id,
          title: item.title,
          subtitle: item.location_text,
          type: 'event' as const,
          category: item.type,
          link: `/events?id=${item.id}`
        })),
        ...(questions.data || []).map(item => ({
          id: item.id,
          title: item.question,
          type: 'question' as const,
          category: item.category,
          link: `/support?tab=questions&id=${item.id}`
        })),
        ...(resources.data || []).map(item => ({
          id: item.id,
          title: item.name,
          subtitle: item.description,
          type: 'resource' as const,
          category: item.category,
          link: `/support?tab=resources&id=${item.id}`
        })),
        ...(profiles.data || []).map(item => ({
          id: item.id,
          title: item.display_name,
          subtitle: item.bio || item.city,
          type: 'profile' as const,
          link: `/profile/${item.id}`
        }))
      ];

      setResults(mergedResults);
    } catch (error) {
      console.error('Global search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const resultsByType = {
    announcement: results.filter(r => r.type === 'announcement'),
    event: results.filter(r => r.type === 'event'),
    question: results.filter(r => r.type === 'question'),
    resource: results.filter(r => r.type === 'resource'),
    profile: results.filter(r => r.type === 'profile'),
  };

  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen bg-warm-milk">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header Search */}
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <form onSubmit={handleSearchSubmit} className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-dusty-indigo transition-colors" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ищи что угодно"
              className="w-full pl-14 pr-16 py-3.5 bg-white border border-border/60 rounded-[20px] shadow-sm focus:outline-none focus:ring-4 focus:ring-dusty-indigo/10 focus:border-dusty-indigo/50 transition-all text-base md:text-lg"
              autoFocus
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
              {searchInput.length}/50
            </div>
          </form>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-dusty-indigo" />
            <p className="font-medium animate-pulse">Ищем по всему Данангу...</p>
          </div>
        ) : !hasResults ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white/50 rounded-[40px] border border-dashed border-border/60"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Search className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ничего не нашлось</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Попробуйте изменить запрос или поискать в конкретном разделе
            </p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            <Section title="Объявления" results={resultsByType.announcement} icon={<Megaphone className="w-5 h-5" />} color="text-terracotta-deep" bg="bg-terracotta-deep/10" />
            <Section title="События" results={resultsByType.event} icon={<Calendar className="w-5 h-5" />} color="text-dusty-indigo" bg="bg-dusty-indigo/10" />
            <Section title="Вопросы и ответы" results={resultsByType.question} icon={<HelpCircle className="w-5 h-5" />} color="text-warm-olive" bg="bg-warm-olive/10" />
            <Section title="Проверенные ресурсы" results={resultsByType.resource} icon={<FileText className="w-5 h-5" />} color="text-warm-olive" bg="bg-warm-olive/10" />
            <Section title="Люди рядом" results={resultsByType.profile} icon={<Users className="w-5 h-5" />} color="text-dusty-indigo" bg="bg-dusty-indigo/10" />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, results, icon, color, bg }: { title: string, results: SearchResult[], icon: React.ReactNode, color: string, bg: string }) {
  if (results.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 px-1">
        <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="h-px flex-1 bg-border/40 ml-2" />
      </div>

      <div className="grid gap-3">
        {results.map((item) => (
          <Link 
            key={item.id} 
            to={item.link}
            className="group bg-white rounded-[24px] p-5 border border-border/40 hover:border-dusty-indigo/30 transition-all hover:shadow-lg flex items-center gap-4"
          >
            {item.image ? (
              <img src={item.image} className="w-14 h-14 rounded-2xl object-cover shrink-0" alt="" />
            ) : (
              <div className={`w-14 h-14 rounded-2xl ${bg} ${color} shrink-0 flex items-center justify-center opacity-50`}>
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-foreground group-hover:text-dusty-indigo transition-colors truncate">
                  {item.title}
                </h4>
                {item.category && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-soft-sand px-2 py-0.5 rounded-full text-muted-foreground whitespace-nowrap">
                    {translateTag(item.category)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate leading-relaxed">
                {item.subtitle || 'Посмотреть подробнее...'}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-dusty-indigo group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
