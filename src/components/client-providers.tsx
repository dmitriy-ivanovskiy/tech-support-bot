"use client";

import { ReactNode } from 'react';
import { ChatProvider } from '@/context/chat-context';
import { ThemeProvider } from '@/context/theme-context';
import { ToastProvider } from '@/context/toast-context';
import { AnalyticsProvider } from '@/context/analytics-context';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AnalyticsProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </AnalyticsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
} 