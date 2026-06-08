'use client';

import { ReactNode } from 'react';
import { ModalProvider } from '@/context/ModalContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return <ModalProvider>{children}</ModalProvider>;
}
