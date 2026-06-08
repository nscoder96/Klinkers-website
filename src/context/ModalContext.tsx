'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';

interface ModalOptions {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface ModalContent {
  content: ReactNode;
  title: string;
  options?: ModalOptions;
}

interface ModalContextType {
  showModal: (content: ReactNode, title: string, options?: ModalOptions) => void;
  hideModal: () => void;
  isOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);

  const showModal = useCallback((content: ReactNode, title: string, options?: ModalOptions) => {
    setModalContent({ content, title, options });
  }, []);

  const hideModal = useCallback(() => {
    setModalContent(null);
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, hideModal, isOpen: !!modalContent }}>
      {children}
      {modalContent && (
        <Modal
          isOpen={!!modalContent}
          onClose={hideModal}
          title={modalContent.title}
          size={modalContent.options?.size}
        >
          {modalContent.content}
        </Modal>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
