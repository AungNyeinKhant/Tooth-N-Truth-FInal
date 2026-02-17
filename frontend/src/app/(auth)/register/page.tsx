'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { Mail, Lock, User, Phone } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useUIStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      const redirectUrl = await register(formData);
      addToast('Registration successful! Welcome to Tooth & Truth.', 'success');
      router.push(redirectUrl);
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
