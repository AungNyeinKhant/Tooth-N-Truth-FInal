'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, ImageUpload } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants/api';
import apiClient from '@/lib/api/axios-instance';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    profileImage: null as string | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (url: string | null) => {
    setPreviewUrl(url);
    setFormData({ ...formData, profileImage: url });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      let profileImageUrl = formData.profileImage;

      // If there's a preview image (newly selected), upload it first
      if (previewUrl && previewUrl.startsWith('blob:')) {
        addToast('Uploading profile image...', 'info');
        
        // Get the file from the input
        const file = fileInputRef.current?.files?.[0];
        if (file) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);
          
          try {
            const uploadRes = await apiClient.post('/api/upload/single?folder=tnt-clinic/patients', formDataUpload, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            profileImageUrl = uploadRes.data.data.url;
          } catch (uploadError: any) {
            console.error('Image upload failed:', uploadError);
            addToast('Failed to upload profile image. Registration will continue without it.', 'warning');
            profileImageUrl = null;
          }
        }
      }

      // Register with profile image URL
      await register({
        ...formData,
        profileImage: profileImageUrl || undefined,
      });
      
      addToast('Registration successful! Welcome to Tooth & Truth.', 'success');
      
      // Check if there's a stored booking redirect URL
      const bookingRedirect = sessionStorage.getItem('bookingRedirect');
      if (bookingRedirect) {
        sessionStorage.removeItem('bookingRedirect');
        router.push(bookingRedirect);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-navy">Create Account</h1>
          <p className="mt-2 text-text-gray">
            Join Tooth & Truth and start your dental care journey
          </p>
        </div>

        {/* Profile Image Upload */}
        <div className="flex justify-center mb-6">
          <ImageUpload 
            value={previewUrl || undefined} 
            onChange={handleImageChange}
          />
        </div>

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              setPreviewUrl(url);
              setFormData({ ...formData, profileImage: url });
            }
          }}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              icon={<User className="w-5 h-5" />}
              required
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

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
            label="Phone Number"
            type="tel"
            placeholder="09XXXXXXXXX"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            icon={<Phone className="w-5 h-5" />}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            icon={<Lock className="w-5 h-5" />}
            required
          />

          <p className="text-xs text-text-light">
            Password must be at least 8 characters with uppercase, lowercase, and number.
          </p>

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
            Create Account
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <a
              href={`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`}
              onClick={() => {
                // Store current URL for redirect after Google signup
                sessionStorage.setItem('bookingRedirect', window.location.href);
              }}
              className="w-full flex justify-center items-center gap-3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <GoogleIcon className="w-5 h-5" />
              Sign up with Google
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-text-gray">Already have an account? </span>
          <Link href="/login" className="text-primary-cyan hover:underline font-medium">
            Sign in here
          </Link>
        </div>
      </Card>
    </div>
  );
}
