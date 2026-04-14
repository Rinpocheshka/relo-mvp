import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MessageComposeModal } from '../components/MessageComposeModal';

interface MessageModalContextType {
  openMessageModal: (recipientId: string, recipientName: string) => void;
  closeMessageModal: () => void;
}

const MessageModalContext = createContext<MessageModalContextType | undefined>(undefined);

export function MessageModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipient, setRecipient] = useState<{ id: string; name: string } | null>(null);

  const openMessageModal = (recipientId: string, recipientName: string) => {
    setRecipient({ id: recipientId, name: recipientName });
    setIsOpen(true);
  };

  const closeMessageModal = () => {
    setIsOpen(false);
    // Optional delay before wiping recipient state to let animation finish gracefully
    setTimeout(() => setRecipient(null), 300);
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
