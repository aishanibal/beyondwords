'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Force this page to be dynamic
export const dynamicConfig = 'force-dynamic';

// Dynamically import the client component with no SSR
const AnalyzeClient = dynamic(() => import('./AnalyzeClientRefactored'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading analyze page...</div>
    </div>
  )
});

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <AnalyzeClient />
    </Suspense>
  );
}