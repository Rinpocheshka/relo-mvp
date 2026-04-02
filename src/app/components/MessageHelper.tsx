import { motion } from 'motion/react';
import { X, Send } from 'lucide-react';
import { Button } from './ui/button';

interface MessageHelperProps {
  personName: string;
  onClose: () => void;
  onSend: (message: string) => void;
}

export function MessageHelper({ personName, onClose, onSend }: MessageHelperProps) {
  const quickMessages = [
    `Привет! Я тоже ищу жильё в Дананге. Можем обменяться опытом?`,
    `Привет, ${personName}! Увидел(а) твой профиль. Может, встретимся?`,
    `Здравствуй! Можно задать пару вопросов о городе?`,
    `Привет! Я новичок в городе, буду рад(а) знакомству!`,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[16px] max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-lg">Написать {personName}</h3>
            <p className="text-sm text-muted-foreground">Как начать разговор?</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-soft-sand/30 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {quickMessages.map((message, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSend(message)}
              className="w-full p-4 text-left bg-soft-sand/20 hover:bg-soft-sand/40 rounded-[12px] transition-colors border border-transparent hover:border-terracotta-deep/30"
            >
              <p className="text-sm">{message}</p>
            </motion.button>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <div className="relative">
            <textarea
              placeholder="Или напишите своё сообщение..."
              rows={3}
              className="w-full p-3 pr-12 bg-input-background border border-border rounded-[12px] focus:outline-none focus:ring-2 focus:ring-terracotta-deep/20 resize-none"
            />
            <button
              onClick={() => onSend('Custom message')}
              className="absolute right-3 bottom-3 p-2 bg-terracotta-deep text-white rounded-lg hover:bg-terracotta-deep/90 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
