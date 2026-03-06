'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth, user } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // 1. Save token to localStorage
      localStorage.setItem('accessToken', token);
      
      // 2. Set cookie for middleware (required for SSR route protection)
      const isProduction = window.location.protocol === 'https:';
      document.cookie = `accessToken=${token}; path=/; max-age=900; SameSite=Lax${isProduction ? '; Secure' : ''}`;
      
      // 3. Fetch user profile and wait for state update
      checkAuth()
        .then(() => {
          // Get updated user from state after checkAuth completes
          const currentUser = useAuthStore.getState().user;
          const userRole = currentUser?.role;
          
          console.log('[OAuth Callback] User loaded:', currentUser);
          console.log('[OAuth Callback] Role:', userRole);
          
          // Redirect based on role
          if (userRole === 'PATIENT') router.replace('/patient/dashboard');
          else if (userRole === 'BRANCH_MANAGER') router.replace('/branch-manager/dashboard');
          else if (userRole === 'ADMIN') router.replace('/admin/dashboard');
          else router.replace('/');
        })
        .catch((err) => {
          console.error('[OAuth Callback] Failed to fetch user profile:', err);
          router.replace('/login?error=ProfileFetchFailed');
        });
    } else {
      console.error('[OAuth Callback] No token provided');
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
