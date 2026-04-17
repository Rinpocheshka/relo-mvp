import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../SupabaseAuthProvider';
import { getOrCreateChat } from '@/lib/chatUtils';
import { supabase } from '../../lib/supabaseClient';

interface MessageComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  context?: {
    title: string;
    type: 'announcement' | 'event';
    id: string;
  };
}

export function MessageComposeModal({ isOpen, onClose, recipientId, recipientName, context }: MessageComposeModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (context) {
        if (context.type === 'announcement') {
          setContent(`Здравствуйте! Пишу вам по вашему объявлению "${context.title}": `);
        } else {
          setContent(`Здравствуйте! Пишу вам по поводу события "${context.title}": `);
        }
      } else {
        setContent('');
      }
      setIsSuccess(false);
      setErrorMsg('');
      setTimeout(() => {
        textareaRef.current?.focus();
        // Move cursor to end
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.value.length;
          textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
      }, 100);
    }
  }, [isOpen, context]);

  const handleSend = async () => {
    if (!user) {
      setErrorMsg('Пожалуйста, войдите в систему.');
      return;
    }
    if (!content.trim()) return;
    
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Get or create the chat session
      const chatId = await getOrCreateChat(user.id, recipientId);
      
      if (!chatId) {
        throw new Error('Не удалось создать/найти чат');
      }

      // 2. Insert the message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: content.trim()
        });

      if (msgError) throw msgError;

      // 3. Update the chat last message 
      await supabase
        .from('chats')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_content: content.trim()
        })
        .eq('id', chatId);

      // Show success briefly before closing automatically
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error sending first message:', err);
      setErrorMsg('Возникла ошибка при отправке сообщения. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-white sm:rounded-[32px] rounded-t-[32px] shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-soft-sand flex items-center justify-between shrink-0">
              <div className="min-w-0 flex-1 pr-4">
                <h3 className="text-xl font-black text-foreground truncate">Новое сообщение</h3>
                <p className="text-sm text-muted-foreground font-medium">Кому: <span className="text-dusty-indigo font-bold">{recipientName}</span></p>
                {context && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-dusty-indigo/10 text-dusty-indigo text-[10px] font-bold uppercase tracking-wider rounded-md border border-dusty-indigo/20">
                      Контекст
                    </span>
                    <span className="text-[11px] text-muted-foreground font-bold truncate italic">
                      {context.title}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-soft-sand/30 hover:bg-soft-sand text-muted-foreground rounded-full transition-colors active:scale-95 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                    <Send className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-black text-foreground mb-2">Отправлено!</h4>
                  <p className="text-muted-foreground">Сообщение успешно доставлено собеседнику.</p>
                </motion.div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value.slice(0, 1000))}
                      placeholder="Напишите ваше сообщение здесь..."
                      className="w-full bg-soft-sand/20 border border-border/40 rounded-2xl p-4 md:p-5 focus:outline-none focus:ring-2 focus:ring-dusty-indigo/30 focus:border-dusty-indigo transition-all resize-none font-medium custom-scrollbar"
                    />
                    <div className={`absolute bottom-4 right-4 text-xs font-bold ${content.length >= 1000 ? 'text-red-500' : 'text-muted-foreground/50'}`}>
                      {content.length} / 1000
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <Button
                    onClick={handleSend}
                    disabled={loading || !content.trim()}
                    className="w-full h-14 bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-2xl font-black text-lg shadow-xl shadow-dusty-indigo/10 transition-all flex items-center justify-center mt-6 active:scale-95"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Оправить сообщение
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
