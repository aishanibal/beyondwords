'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';


// Force this page to be dynamic
export const dynamicConfig = 'force-dynamic';

// Use refactored version by default, fallback to original if needed
const USE_REFACTORED = process.env.NEXT_PUBLIC_USE_REFACTORED !== 'false';

// Dynamically import the client component with no SSR
const AnalyzeClient = dynamic(() => 
  USE_REFACTORED 
    ? import('./AnalyzeClientRefactored').then(mod => ({ default: mod.default || mod }))
    : import('./AnalyzeClient').then(mod => ({ default: mod.default || mod }))
, {
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