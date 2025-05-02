import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ClientEventBlocker } from '@/components/client-event-blocker'; // Import the new component

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Test taker', // Changed title here
  description: 'Secure Browser Testing Environment',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Event handlers removed to fix the error */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientEventBlocker /> {/* Add the client component */}
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
