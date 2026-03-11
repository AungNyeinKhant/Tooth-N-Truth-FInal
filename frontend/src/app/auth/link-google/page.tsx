'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LinkGooglePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    if (token) {
      // OAuth successful - store token and send message to opener
      localStorage.setItem('accessToken', token);
      
      const isProduction = window.location.protocol === 'https:';
      document.cookie = `accessToken=${token}; path=/; max-age=900; SameSite=Lax${isProduction ? '; Secure' : ''}`;
      
      // Send success message to opener (profile page)
      if (window.opener) {
        window.opener.postMessage({ type: 'googleOAuthSuccess' }, '*');
        // Close this window after a short delay
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        // No opener, redirect to profile
        router.replace('/profile?linked=true');
      }
    } else if (error) {
      // OAuth failed
      if (window.opener) {
        window.opener.postMessage({ type: 'googleOAuthError', message: error }, '*');
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        router.replace(`/profile?error=${error}`);
      }
    } else {
      // No token or error - redirect to backend OAuth
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      window.location.href = `${backendUrl}/api/auth/google`;
    }
  }, [token, error, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-cyan border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-700 font-semibold">Connecting to Google...</p>
        <p className="text-gray-500 text-sm">Please wait</p>
      </div>
    </div>
  );
}
