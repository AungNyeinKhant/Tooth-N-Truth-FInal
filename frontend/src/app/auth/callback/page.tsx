'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // 1. Save token
      localStorage.setItem('accessToken', token);
      
      // 2. Fetch user profile
      checkAuth()
        .then(() => {
          const user = useAuthStore.getState().user;
          // Redirect to appropriate dashboard
          const userRole = user?.role; // e.g. PATIENT
          // Wait to ensure state is updated
          setTimeout(() => {
            if (userRole === 'PATIENT') router.replace('/patient/dashboard');
            else if (userRole === 'BRANCH_MANAGER') router.replace('/branch-manager/dashboard');
            else if (userRole === 'ADMIN') router.replace('/admin/dashboard');
            else router.replace('/');
          }, 100);
        })
        .catch((err) => {
          console.error('Failed to fetch user profile after OAuth:', err);
          router.replace('/login?error=ProfileFetchFailed');
        });
    } else {
      router.replace('/login?error=NoTokenProvided');
    }
  }, [searchParams, router, checkAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-cyan border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-navy font-semibold text-lg">Authenticating with Google...</p>
        <p className="text-text-gray text-sm">Please wait while we log you in.</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-primary-cyan border-t-transparent rounded-full animate-spin"></div></div>}>
      <CallbackContent />
    </Suspense>
  );
}
