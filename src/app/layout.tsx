
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ClientEventBlocker } from '@/components/client-event-blocker';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { ModalProvider } from '@/contexts/ModalContext';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Test taker',
  description: 'Secure Browser Testing Environment',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full w-full overflow-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full overflow-hidden flex flex-col`}
      >
        <LoadingProvider>
          <ModalProvider>
            <ClientEventBlocker />
            <main className="flex-grow flex flex-col h-full w-full overflow-auto">{children}</main>
            <Toaster />
          </ModalProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
