import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router';
import { Button } from './ui/button';
import { MessageCircle, ArrowRight, Plus, BookOpen, Loader2 } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
import { AuthModal } from './AuthWidget';
import { WriteStoryModal } from './WriteStoryModal';
import { StoryDetailsModal } from './StoryDetailsModal';
import { formatRelativeRu } from '@/lib/date';

interface Story {
  id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  author_is_guide?: boolean;
  comments_count?: number;
}

export function StoriesPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [writeStoryOpen, setWriteStoryOpen] = useState(false);
  const [detailsStoryId, setDetailsStoryId] = useState<string | null>(null);
  const [storyToEdit, setStoryToEdit] = useState<Story | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const storyParamId = searchParams.get('story');

  useEffect(() => {
    if (storyParamId) {
      setDetailsStoryId(storyParamId);
    }
  }, [storyParamId]);

  const fetchStories = async () => {
    setStoriesLoading(true);
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          author:profiles!stories_author_id_fkey (
            display_name,
            avatar_url,
            is_guide
          ),
          story_comments(count)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setStories(data.map(s => ({
          ...s,
          author_name: s.author?.display_name || 'Пользователь',
          author_avatar: s.author?.avatar_url,
          author_is_guide: !!s.author?.is_guide,
          comments_count: s.story_comments?.[0]?.count || 0
        })));
      }
    } finally {
      setStoriesLoading(false);
    }
  };

  useEffect(() => {
    void fetchStories();
  }, []);

  const handleEditStory = (story: Story) => {
    setStoryToEdit(story);
    setDetailsStoryId(null);
    setWriteStoryOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F5F2] pt-20 pb-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-dusty-indigo/10 flex items-center justify-center overflow-hidden">
              <img src="/assets/icons/custom/stories_large.png" className="w-full h-full object-contain p-2" alt="" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Истории релокаций</h1>
              <p className="text-muted-foreground">Опыт, который меняет жизнь</p>
            </div>
          </div>
          <Button 
            onClick={() => user ? setWriteStoryOpen(true) : setAuthOpen(true)}
            className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full px-6 font-bold shadow-md h-12 transition-all active:scale-95"
          >
            <Plus className="w-5 h-4 mr-2" />
            Рассказать свою историю
          </Button>
        </div>

        {storiesLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-dusty-indigo/20" />
          </div>
        ) : stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {stories.map((story, i) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => user ? setDetailsStoryId(story.id) : setAuthOpen(true)}
                  className="bg-white rounded-[32px] p-6 border border-border/40 hover:border-terracotta-deep/30 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 group flex flex-col h-full"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <UserAvatar src={story.author_avatar} name={story.author_name || ''} size="sm" isGuide={story.author_is_guide} />
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                       {story.author_name}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-3 leading-tight group-hover:text-terracotta-deep transition-colors line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed mb-6 flex-grow">
                    {story.content}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-soft-sand/30">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground font-medium">
                           {formatRelativeRu(new Date(story.created_at))}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-bold">
                          <MessageCircle className="w-3 h-3" />
                          {story.comments_count}
                        </div>
                      </div>
                     <div className="flex items-center gap-1 text-[10px] font-black text-terracotta-deep uppercase tracking-tighter">
                        Читать <ArrowRight className="w-3 h-3" />
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-dashed border-border/50 p-20 text-center">
            <p className="text-muted-foreground text-lg">Тут пока пусто. Станьте первым, кто расскажет свою историю!</p>
          </div>
        )}
      </div>

      <WriteStoryModal 
        isOpen={writeStoryOpen} 
        onClose={() => {
          setWriteStoryOpen(false);
          setStoryToEdit(null);
        }} 
        storyToEdit={storyToEdit}
        onSuccess={() => {
          void fetchStories();
        }} 
      />

      <StoryDetailsModal
        isOpen={!!detailsStoryId}
        onClose={() => setDetailsStoryId(null)}
        storyId={detailsStoryId}
        onEdit={handleEditStory}
        onDeleteSuccess={() => {
          void fetchStories();
        }}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
