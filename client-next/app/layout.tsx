'use client';
import './globals.css';
import ClientLayout from './ClientLayout';
import { DarkModeProvider } from './contexts/DarkModeContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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