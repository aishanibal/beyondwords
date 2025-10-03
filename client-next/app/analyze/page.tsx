'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUser } from '../ClientLayout';

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
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (user === null) {
      // User is not authenticated, redirect to login
      console.log('[ANALYZE_PAGE] User not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }
    
    // User is authenticated, allow component to load
    setIsLoading(false);
  }, [user, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  // If user is not authenticated, don't render the component
  if (!user) {
    return null;
  }

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