'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { Mail, Lock, X } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const router = useRouter();
  const { login, isLoading, error, clearError, checkAuth, isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', password: '' });
      clearError();
    }
  }, [isOpen, clearError]);

  // Check if authenticated after login
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      addToast('Login successful!', 'success');
      onSuccess();
    }
  }, [isAuthenticated, isOpen, addToast, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(formData);
      // onSuccess will be called by the useEffect above
    } catch (err) {
      // Error is handled by the store
    }
  };

  const handleGoogleLogin = () => {
    // Store the current URL (with all booking selections) for redirect after Google login
    const currentUrl = window.location.href;
    sessionStorage.setItem('bookingRedirect', currentUrl);
    
    // Redirect to Google OAuth
    window.location.href = `${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <Card className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-text-navy">Sign In</h2>
            <p className="text-sm text-text-gray mt-1">
              Sign in to complete your booking
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              icon={<Lock className="w-5 h-5" />}
              required
            />

            {error && (
              <div className="text-sm text-status-error bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <div className="mt-4">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-text-gray">Don&apos;t have an account? </span>
            <Link 
              href="/register" 
              className="text-primary-cyan hover:underline font-medium"
              onClick={() => {
                // Store current URL for redirect after registration
                sessionStorage.setItem('bookingRedirect', window.location.href);
              }}
            >
              Register here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
