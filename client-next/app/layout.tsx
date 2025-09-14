import './globals.css';
import ClientLayout from './ClientLayout';
import { DarkModeProvider } from './contexts/DarkModeContext';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BeyondWords - Heritage Language Learning',
  description: 'Learn and practice your heritage language through AI-powered conversations',
  icons: {
    icon: '/favicon/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/favicon/site.webmanifest',
  themeColor: '#3c4c73',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon/favicon.ico" />
        <link rel="icon" href="/favicon/favicon.ico" sizes="16x16" type="image/x-icon" />
        <link rel="icon" href="/favicon/favicon.ico" sizes="32x32" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <meta name="theme-color" content="#3c4c73" />
      </head>
      <body>
        <DarkModeProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </DarkModeProvider>
      </body>
    </html>
  );
} 