import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/app/SupabaseAuthProvider';
import { CheckCircle2, XCircle, Clock, Eye, MapPin, Tag, User, Calendar, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';

type Status = 'pending' | 'active' | 'rejected' | 'all';
type Collection = 'announcements' | 'events';

interface ModeratedItem {
  id: string;
  title: string;
  category: string;
  description: string;
  author_name: string;
  city: string;
  price_text: string;
  images: string[];
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'На модерации', color: 'bg-amber-100 text-amber-700' },
  active:   { label: 'Опубликовано', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Отклонено',    color: 'bg-red-100   text-red-700'   },
};

export function AnnouncementModerationPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [collection, setCollection] = useState<Collection>('announcements');
  const [filter, setFilter] = useState<Status>('pending');
  const [items, setItems] = useState<ModeratedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ pending: 0, active: 0, rejected: 0, all: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from(collection)
      .select('*')
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    
    // Map data to generic ModeratedItem based on collection schema
    const mapped = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title ?? '',
      category: collection === 'announcements' ? row.category : row.type,
      description: row.description ?? '',
      author_name: collection === 'announcements' ? row.author_name : row.organizer_name,
      city: row.city ?? '',
      price_text: row.price_text ?? '',
      images: row.images ?? [],
      status: row.status ?? 'active',
      created_at: row.created_at,
    }));
    
    setItems(mapped);
    setLoading(false);
  }, [filter, collection]);

  const fetchCounts = useCallback(async () => {
    const [pendingRes, activeRes, rejectedRes, allRes] = await Promise.all([
      supabase.from(collection).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from(collection).select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from(collection).select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from(collection).select('id', { count: 'exact', head: true }),
    ]);

    setCounts({
      pending: pendingRes.count ?? 0,
      active: activeRes.count ?? 0,
      rejected: rejectedRes.count ?? 0,
      all: allRes.count ?? 0,
    });
  }, [collection]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);
  useEffect(() => { void fetchCounts(); }, [fetchCounts]);

  // Reset tab to pending when switching collections
  useEffect(() => {
    setFilter('pending');
    setExpandedId(null);
  }, [collection]);

  const setStatus = async (id: string, status: 'active' | 'rejected') => {
    setActionLoading(id);
    try {
      const { error } = await supabase.from(collection).update({ status }).eq('id', id);
      if (!error) {
        toast.success(status === 'active' ? 'Запись одобрена' : 'Запись отклонена');
        await Promise.all([fetchItems(), fetchCounts()]);
      } else {
        console.error('Moderation error:', error);
        toast.error(`Ошибка: ${error.message}`);
      }
    } catch (e) {
      console.error('Unexpected error during moderation:', e);
      toast.error('Произошла непредвиденная ошибка');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-deep" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const FILTERS: { value: Status; label: string; count: number }[] = [
    { value: 'pending',  label: 'На модерации', count: counts.pending },
    { value: 'active',   label: 'Опубликованные', count: counts.active },
    { value: 'rejected', label: 'Отклонённые',   count: counts.rejected },
    { value: 'all',      label: 'Все',           count: counts.all },
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="bg-white border-b border-border/40 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Модерация контента</h1>
            {counts.pending > 0 && (
              <p className="text-sm text-amber-600 font-medium mt-0.5">
                {counts.pending} запис{counts.pending === 1 ? 'ь' : counts.pending < 5 ? 'и' : 'ей'} ожидает проверки
              </p>
            )}
          </div>
          <span className="text-xs bg-terracotta-deep/10 text-terracotta-deep px-3 py-1.5 rounded-full font-semibold hidden md:inline-block">
            Только для администраторов
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* Collection Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={collection === 'announcements' ? 'default' : 'outline'}
            onClick={() => setCollection('announcements')}
            className={`rounded-full shadow-sm font-semibold ${collection === 'announcements' ? 'bg-terracotta-deep hover:bg-terracotta-deep' : ''}`}
          >
            Объявления
          </Button>
          <Button
            variant={collection === 'events' ? 'default' : 'outline'}
            onClick={() => setCollection('events')}
            className={`rounded-full shadow-sm font-semibold ${collection === 'events' ? 'bg-warm-olive hover:bg-warm-olive' : ''}`}
          >
            События (Афиша)
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                filter === f.value
                  ? 'bg-dusty-indigo text-white shadow-md shadow-dusty-indigo/20'
                  : 'bg-white border border-border/60 text-muted-foreground hover:border-dusty-indigo/40'
              } ${f.value === 'pending' && counts.pending > 0 ? 'ring-2 ring-amber-400/50' : ''}`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === f.value ? 'bg-white/20 text-white' : 'bg-soft-sand text-muted-foreground'
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Здесь пока пусто</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => {
                const isExpanded = expandedId === item.id;
                const statusInfo = STATUS_LABELS[item.status] ?? { label: item.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                      item.status === 'pending' ? 'border-amber-300/60' : 'border-border/60'
                    }`}
                  >
                    {/* Card header */}
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        {item.images?.[0] && (
                          <img
                            src={item.images[0]}
                            alt=""
                            className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-soft-sand/40 text-warm-olive">
                              {item.category}
                            </span>
                          </div>
                          <h3 className="font-bold text-foreground truncate">{item.title}</h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.author_name}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.city}</span>
                            {item.price_text && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{item.price_text}</span>}
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.created_at).toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>

                        {/* Expand toggle */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="p-2 rounded-full hover:bg-soft-sand/30 text-muted-foreground transition-colors ml-auto flex-shrink-0"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Action buttons */}
                      {item.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => setStatus(item.id, 'active')}
                            disabled={actionLoading === item.id}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl gap-1.5"
                          >
                            {actionLoading === item.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <CheckCircle2 className="w-4 h-4" />}
                            Одобрить
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus(item.id, 'rejected')}
                            disabled={actionLoading === item.id}
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            Отклонить
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="px-3 rounded-xl"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {item.status === 'active' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus(item.id, 'rejected')}
                            disabled={actionLoading === item.id}
                            className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl gap-1.5 text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Снять с публикации
                          </Button>
                        </div>
                      )}
                      {item.status === 'rejected' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus(item.id, 'active')}
                            disabled={actionLoading === item.id}
                            className="border-green-200 text-green-700 hover:bg-green-50 rounded-xl gap-1.5 text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Одобрить
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Expanded: full description + images */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-border/40"
                        >
                          <div className="p-5 space-y-4">
                            {item.description && (
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Описание</p>
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{item.description}</p>
                              </div>
                            )}
                            {item.images?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Фото</p>
                                <div className="flex gap-2 flex-wrap">
                                  {item.images.map((url, i) => (
                                    <img key={i} src={url} alt="" className="w-24 h-24 object-cover rounded-xl" />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
