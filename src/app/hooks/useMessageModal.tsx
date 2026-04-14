import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MessageComposeModal } from '../components/MessageComposeModal';

interface MessageContext {
  title: string;
  type: 'announcement' | 'event';
  id: string;
}

interface MessageModalContextType {
  openMessageModal: (recipientId: string, recipientName: string, context?: MessageContext) => void;
  closeMessageModal: () => void;
}

const MessageModalContext = createContext<MessageModalContextType | undefined>(undefined);

export function MessageModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipient, setRecipient] = useState<{ id: string; name: string } | null>(null);
  const [context, setContext] = useState<MessageContext | null>(null);

  const openMessageModal = (recipientId: string, recipientName: string, messageContext?: MessageContext) => {
    setRecipient({ id: recipientId, name: recipientName });
    setContext(messageContext || null);
    setIsOpen(true);
  };

  const closeMessageModal = () => {
    setIsOpen(false);
    // Optional delay before wiping state
    setTimeout(() => {
      setRecipient(null);
      setContext(null);
    }, 300);
  };

  return (
    <MessageModalContext.Provider value={{ openMessageModal, closeMessageModal }}>
      {children}
      {recipient && (
        <MessageComposeModal 
          isOpen={isOpen} 
          onClose={closeMessageModal} 
          recipientId={recipient.id}
          recipientName={recipient.name}
          context={context || undefined}
        />
      )}
    </MessageModalContext.Provider>
  );
}

export function useMessageModal() {
  const context = useContext(MessageModalContext);
  if (context === undefined) {
    throw new Error('useMessageModal must be used within a MessageModalProvider');
  }
  return context;
}
