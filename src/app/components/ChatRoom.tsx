import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../SupabaseAuthProvider';
import { useMessages } from '../hooks/useMessages';
import { useChats } from '../hooks/useChats';
import { ArrowLeft, Send, MoreHorizontal, Smile, Paperclip } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function ChatRoom() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading: messagesLoading, sendMessage, markAsRead } = useMessages(chatId, user?.id);
  const { chats } = useChats(user?.id);
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatId) markAsRead();
  }, [chatId, messages]);

  // Find the other participant's profile for the header
  const currentChat = chats.find(c => c.id === chatId);
  const otherParticipant = currentChat?.participants.find(p => p.user_id !== user?.id);
  const profiles = otherParticipant?.profiles;

  const handleSend = async () => {
    if (!input.trim()) return;
    const ok = await sendMessage(input);
    if (ok) setInput('');
  };

  return (
    <div className="fixed inset-0 bg-warm-milk z-[60] flex flex-col md:relative md:inset-auto md:min-h-[calc(100vh-140px)] md:bg-white md:rounded-[32px] md:border md:border-border/40 md:shadow-sm overflow-hidden md:max-w-4xl md:mx-auto md:my-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-6 bg-white border-b border-border/30 sticky top-0 z-10">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => navigate('/messages')}
            className="p-2 hover:bg-soft-sand/40 rounded-full text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              {profiles?.avatar_url ? (
                <img src={profiles.avatar_url} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-border/20" />
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-terracotta-deep/10 text-terracotta-deep flex items-center justify-center font-black">
                  {profiles?.display_name?.charAt(0) || '?'}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-xl leading-tight font-manrope">
                {profiles?.display_name || 'Чат'}
              </h3>
              <p className="text-[10px] md:text-xs text-green-600 font-bold uppercase tracking-wider">В сети</p>
            </div>
          </div>
        </div>

        <button className="p-2 hover:bg-soft-sand/40 rounded-full text-muted-foreground transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 bg-[#FDFBF9]">
        {messagesLoading ? (
            <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-terracotta-deep/20 border-t-terracotta-deep rounded-full animate-spin" />
            </div>
        ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/60">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                    <Smile className="w-8 h-8" />
                </div>
                <p className="font-medium">Напишите что-нибудь,<br />чтобы начать общение</p>
            </div>
        ) : (
            <AnimatePresence initial={false}>
                {messages.map((msg, i) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: isOwn ? 20 : -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] md:max-w-[70%] rounded-[24px] px-5 py-3 shadow-sm ${
                                isOwn 
                                    ? 'bg-dusty-indigo text-white rounded-br-[4px]' 
                                    : 'bg-white text-foreground rounded-bl-[4px] border border-border/40'
                            }`}>
                                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <div className={`text-[10px] mt-1.5 font-medium flex items-center gap-1.5 ${
                                    isOwn ? 'text-white/60 justify-end' : 'text-muted-foreground/40'
                                }`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isOwn && (
                                        <span className="text-[8px]">{msg.is_read ? '✓✓' : '✓'}</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 bg-white border-t border-border/30 md:rounded-b-[32px] safe-area-bottom">
        <div className="flex items-center gap-2 md:gap-4 p-1.5 md:p-2 bg-soft-sand/20 border border-border/40 rounded-[24px] md:rounded-[32px] focus-within:ring-2 focus-within:ring-dusty-indigo/10 transition-all">
          <button className="p-2.5 text-muted-foreground hover:text-dusty-indigo transition-colors hidden sm:block">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <textarea 
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base py-2 px-3 md:px-4 resize-none max-h-32 placeholder:text-muted-foreground/50"
          />
          
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                input.trim() 
                    ? 'bg-terracotta-deep text-white shadow-lg shadow-terracotta-deep/20' 
                    : 'bg-soft-sand/40 text-muted-foreground/40'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
