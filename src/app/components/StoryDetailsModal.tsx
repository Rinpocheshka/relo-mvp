import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Send, Loader2, Calendar, User, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/app/SupabaseAuthProvider';
import { UserAvatar } from './UserAvatar';
import { formatRelativeRu } from '@/lib/date';

interface Comment {
  id: string;
  story_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

interface Story {
  id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

interface StoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string | null;
}

export function StoryDetailsModal({ isOpen, onClose, storyId }: StoryDetailsModalProps) {
  const { user, profile } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && storyId) {
      void fetchStoryDetails();
    } else {
      setStory(null);
      setComments([]);
    }
  }, [isOpen, storyId]);

  const fetchStoryDetails = async () => {
    if (!storyId) return;
    setLoading(true);
    try {
      // Fetch story with author info
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select(`
          *,
          author:profiles!stories_author_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;
      
      setStory({
        ...storyData,
        author_name: storyData.author?.display_name || 'Пользователь',
        author_avatar: storyData.author?.avatar_url
      });

      // Fetch comments with author info
      setCommentsLoading(true);
      const { data: commentsData, error: commentsError } = await supabase
        .from('story_comments')
        .select(`
          *,
          author:profiles!story_comments_author_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      
      setComments((commentsData || []).map(c => ({
        ...c,
        author_name: c.author?.display_name || 'Пользователь',
        author_avatar: c.author?.avatar_url
      })));

    } catch (e) {
      console.error('Error fetching story details:', e);
    } finally {
      setLoading(false);
      setCommentsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!user || !storyId || !commentDraft.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('story_comments')
        .insert({
          story_id: storyId,
          author_id: user.id,
          content: commentDraft.trim()
        })
        .select(`
          *,
          author:profiles!story_comments_author_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      const newComment: Comment = {
        ...data,
        author_name: data.author?.display_name || 'Вы',
        author_avatar: data.author?.avatar_url
      };

      setComments(prev => [...prev, newComment]);
      setCommentDraft('');
    } catch (e) {
      console.error('Error sending comment:', e);
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
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] flex items-center justify-center p-0 sm:p-4"
          onClick={handleBackdrop}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="bg-warm-milk w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden text-foreground"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/20 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-terracotta-deep/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-terracotta-deep" />
                </div>
                <h2 className="font-bold text-lg truncate">История релокации</h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-soft-sand/30 hover:bg-soft-sand/60 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white flex flex-col md:flex-row">
              {/* Content Column */}
              <div className="flex-1 p-6 md:p-10 border-b md:border-b-0 md:border-r border-border/10">
                {loading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-terracotta-deep" />
                  </div>
                ) : story ? (
                  <article>
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border/10">
                      <UserAvatar src={story.author_avatar} name={story.author_name || ''} size="lg" />
                      <div>
                        <div className="font-bold text-lg">{story.author_name}</div>
                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatRelativeRu(new Date(story.created_at))}
                        </div>
                      </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold mb-8 leading-tight tracking-tight text-foreground">
                      {story.title}
                    </h1>

                    <div className="prose prose-sm max-w-none prose-slate">
                      <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {story.content}
                      </p>
                    </div>
                  </article>
                ) : (
                  <div className="text-center py-20 text-muted-foreground">История не найдена</div>
                )}
              </div>

              {/* Comments Column */}
              <div className="w-full md:w-80 lg:w-96 bg-warm-milk/30 flex flex-col h-[500px] md:h-auto">
                <div className="p-4 border-b border-border/10 font-bold text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Комментарии ({comments.length})
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {commentsLoading && comments.length === 0 ? (
                    <div className="flex justify-center py-8">
                       <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="text-3xl mb-3 opacity-20">💬</div>
                      <p className="text-xs text-muted-foreground">Пока нет комментариев. Будьте первым!</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <UserAvatar src={comment.author_avatar} name={comment.author_name || ''} size="sm" className="flex-shrink-0" />
                        <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-border/20">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-[13px]">{comment.author_name}</span>
                            <span className="text-[10px] text-muted-foreground">{formatRelativeRu(new Date(comment.created_at))}</span>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/80">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <div className="p-4 bg-white border-t border-border/10">
                   {user ? (
                     <div className="flex items-end gap-2">
                        <textarea
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="Ваш комментарий..."
                          rows={2}
                          maxLength={2000}
                          className="flex-1 bg-soft-sand/20 border border-border/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 resize-none"
                        />
                        <Button 
                          size="icon" 
                          disabled={!commentDraft.trim() || submitting}
                          onClick={handleSendComment}
                          className="rounded-xl h-10 w-10 bg-terracotta-deep text-white shadow-md shadow-terracotta-deep/20 flex-shrink-0"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                     </div>
                   ) : (
                     <div className="text-center py-4 bg-soft-sand/10 rounded-xl border border-dashed border-border/40">
                        <p className="text-xs text-muted-foreground px-4">Войдите, чтобы оставить комментарий</p>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

