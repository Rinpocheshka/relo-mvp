import { useNavigate } from 'react-router';
import { useAuth } from '../SupabaseAuthProvider';
import { useChats } from '../hooks/useChats';
import { MessageSquare, Clock, ChevronRight, Search } from 'lucide-react';
import { motion } from 'motion/react';

export function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { chats, loading } = useChats(user?.id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-terracotta-deep/20 border-t-terracotta-deep rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Загрузка ваших чатов...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-2">Сообщения</h1>
          <p className="text-muted-foreground font-medium">Ваши диалоги с людьми из сообщества</p>
        </div>
        
        <div className="relative group w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-dusty-indigo transition-colors" />
          <input 
            type="text" 
            placeholder="Поиск по чатам..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-border/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 focus:border-dusty-indigo/40 transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      {chats.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] border border-border/40 p-12 md:p-20 text-center shadow-sm"
        >
          <div className="w-20 h-20 bg-soft-sand/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold mb-2">Пока нет диалогов</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Найдите нужного человека в разделе «Люди рядом» или откликнитесь на понравившееся объявление.
          </p>
          <button 
            onClick={() => navigate('/people')}
            className="px-8 py-3.5 bg-dusty-indigo text-white rounded-full font-bold hover:bg-dusty-indigo/90 transition-all shadow-lg shadow-dusty-indigo/10 active:scale-95"
          >
            Найти людей
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          {chats.map((chat, idx) => {
            const otherParticipant = chat.participants.find(p => p.user_id !== user?.id);
            const profiles = otherParticipant?.profiles;
            
            return (
              <motion.button
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/messages/${chat.id}`)}
                className="w-full flex items-center gap-4 p-4 bg-white hover:bg-soft-sand/20 border border-border/40 rounded-[24px] shadow-sm hover:shadow-md transition-all group group-active:scale-[0.98]"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {profiles?.avatar_url ? (
                    <img 
                      src={profiles.avatar_url} 
                      alt="" 
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white shadow-sm" 
                    />
                  ) : (
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-terracotta-deep/10 text-terracotta-deep flex items-center justify-center text-lg font-black bg-gradient-to-br from-terracotta-deep/20 to-terracotta-deep/5">
                      {profiles?.display_name?.charAt(0) || '?'}
                    </div>
                  )}
                  {/* Unread Badge */}
                  {chat.unread_count && chat.unread_count > 0 ? (
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-red-500 text-[10px] md:text-xs font-bold text-white shadow-sm border-2 border-white">
                      {chat.unread_count > 9 ? '9+' : chat.unread_count}
                    </div>
                  ) : null}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-base md:text-lg truncate group-hover:text-dusty-indigo transition-colors font-manrope">
                      {profiles?.display_name || 'Загрузка...'}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground whitespace-nowrap ml-2">
                       <Clock className="w-3 h-3" />
                       {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground/80 line-clamp-1 leading-relaxed">
                    {chat.last_message_content || 'Начните общение...'}
                  </p>
                </div>

                <div className="flex-shrink-0 text-muted-foreground/30 group-hover:text-dusty-indigo transition-colors pl-2">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
