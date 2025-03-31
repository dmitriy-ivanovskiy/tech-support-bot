// Import the polyfill first to ensure it's loaded before other modules
import '../polyfills';
import '../styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ToastContainer from '@/components/ui/toast';
import { ChatProvider } from '@/context/chat-context';
import { AnalyticsProvider } from '@/context/analytics-context';
import { ThemeProvider } from '@/context/theme-context';
import { ToastProvider } from '@/context/toast-context';

const inter = Inter({ subsets: ['latin'] });

// Metadata must be exported from a Server Component
export const metadata: Metadata = {
  title: 'Computer Tech Support Assistant',
  description: 'AI-powered tech support assistant for computer problems',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            <AnalyticsProvider>
              <ChatProvider>
                {children}
                <ToastContainer />
              </ChatProvider>
            </AnalyticsProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 