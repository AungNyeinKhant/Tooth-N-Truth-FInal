'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useUIStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      const redirectUrl = await login(formData);
      addToast('Login successful!', 'success');
      router.push(redirectUrl);
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-navy">Welcome Back</h1>
          <p className="mt-2 text-text-gray">
            Sign in to your Tooth & Truth account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="mt-6 text-center text-sm">
          <span className="text-text-gray">Don't have an account? </span>
          <Link href="/register" className="text-primary-cyan hover:underline font-medium">
            Register here
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-text-light text-center">
            Demo accounts:<br />
            Admin: admin@toothandtruth.com / admin123<br />
            Manager: manager1@toothandtruth.com / manager123<br />
            Patient: patient1@example.com / patient123
          </p>
        </div>
      </Card>
    </div>
  );
}
