
'use client';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalProps {
  [key: string]: any; // Allow any props for different modals
}

interface ModalEntry {
  isOpen: boolean;
  props: ModalProps;
}

interface ModalState {
  [modalName: string]: ModalEntry;
}

interface ModalContextType {
  modalState: ModalState;
  openModal: (modalName: string, props?: ModalProps) => void;
  closeModal: (modalName: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    // login: { isOpen: false, props: {} }, // Example initial modal state
    // premium: { isOpen: false, props: {} },
  });

  const openModal = useCallback((modalName: string, props: ModalProps = {}) => {
    setModalState((prevState) => ({
      ...prevState,
      [modalName]: { isOpen: true, props },
    }));
  }, []);

  const closeModal = useCallback((modalName: string) => {
    setModalState((prevState) => ({
      ...prevState,
      [modalName]: { isOpen: false, props: {} },
    }));
  }, []);

  return (
    <ModalContext.Provider value={{ modalState, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextType {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
