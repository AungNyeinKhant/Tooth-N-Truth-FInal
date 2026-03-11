'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Camera,
  Loader2,
  Lock,
  Save,
  X,
  Link,
  Unlink,
  AlertTriangle,
  CalendarCheck,
  CalendarX,
  RefreshCw
} from 'lucide-react';
import { 
  getMyProfile, 
  updateMyProfile,
  uploadProfileImage,
  PatientProfile
} from '@/lib/api/patients.api';
import { usersApi } from '@/lib/api/users.api';
import { calendarApi, CalendarStatus } from '@/lib/api/calendar.api';

interface GoogleStatus {
  isLinked: boolean;
  googleEmail: string | null;
  hasPassword: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkAuth, isLoading: authLoading } = useAuthStore();
  const { addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Profile data
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: '',
  });
  
  // Password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // Google account linking
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [isLoadingGoogleStatus, setIsLoadingGoogleStatus] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [googleSetPasswordForm, setGoogleSetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [googleSetPasswordError, setGoogleSetPasswordError] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Google Calendar integration
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [isLoadingCalendarStatus, setIsLoadingCalendarStatus] = useState(false);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [isDisconnectingCalendar, setIsDisconnectingCalendar] = useState(false);
  const [isTogglingSync, setIsTogglingSync] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    init();
  }, [checkAuth]);

  // Handle query params from OAuth redirect
  useEffect(() => {
    const linked = searchParams.get('linked');
    const calendar = searchParams.get('calendar');
    const error = searchParams.get('error');
    
    if (linked === 'true') {
      addToast('Google account linked successfully!', 'success');
      fetchGoogleStatus();
      checkAuth();
      // Remove query param from URL
      router.replace('/profile');
    } else if (calendar === 'connected') {
      addToast('Google Calendar connected successfully!', 'success');
      fetchCalendarStatus();
      router.replace('/profile');
    } else if (error) {
      addToast(`Failed to connect: ${error}`, 'error');
      router.replace('/profile');
    }
  }, [searchParams]);

  // Fetch profile data
  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
      fetchGoogleStatus();
      fetchCalendarStatus();
    }
  }, [authLoading, user]);

  const fetchProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
      setEditForm({
        email: data.email || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        address: data.address || '',
        emergencyContact: data.emergencyContact || '',
        medicalHistory: data.medicalHistory || '',
        allergies: data.allergies || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      addToast('Failed to load profile', 'error');
    }
  };

  // Fetch Google status on mount
  const fetchGoogleStatus = async () => {
    setIsLoadingGoogleStatus(true);
    try {
      const response = await usersApi.getGoogleStatus();
      setGoogleStatus(response.data.data);
      console.log('[Profile] Google status:', response.data.data);
    } catch (error: any) {
      console.error('Error fetching Google status:', error);
    } finally {
      setIsLoadingGoogleStatus(false);
    }
  };

  // Fetch Calendar status
  const fetchCalendarStatus = async () => {
    setIsLoadingCalendarStatus(true);
    try {
      const response = await calendarApi.getStatus();
      setCalendarStatus(response.data.data);
      console.log('[Profile] Calendar status:', response.data.data);
    } catch (error: any) {
      console.error('Error fetching calendar status:', error);
    } finally {
      setIsLoadingCalendarStatus(false);
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Invalid file type. Allowed: PNG, JPG, JPEG, WebP, GIF', 'error');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addToast('File size must be less than 2MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      await uploadProfileImage(file);
      addToast('Profile image updated', 'success');
      await checkAuth();
      await fetchProfile();
    } catch (error: any) {
      console.error('Upload error:', error);
      addToast(error.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateMyProfile(editForm);
      addToast('Profile updated successfully', 'success');
      setIsEditing(false);
      await checkAuth();
      await fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      addToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await usersApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      addToast('Password changed successfully. Please login again.', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Logout after password change
      setTimeout(() => {
        useAuthStore.getState().logout();
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle linking Google account
  const handleLinkGoogle = () => {
    // Open Google OAuth in a popup - use frontend route that redirects to backend
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const oauthWindow = window.open(
      '/auth/link-google',
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    setIsLinkingGoogle(true);

    // Listen for message from OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'googleOAuthSuccess') {
        addToast('Google account linked successfully!', 'success');
        fetchGoogleStatus();
        checkAuth();
        setIsLinkingGoogle(false);
        window.removeEventListener('message', handleMessage);
      } else if (event.data.type === 'googleOAuthError') {
        addToast(event.data.message || 'Failed to link Google account', 'error');
        setIsLinkingGoogle(false);
        window.removeEventListener('message', handleMessage);
      }
    };

    // Check if window is closed periodically
    const checkWindowClosed = setInterval(() => {
      if (oauthWindow?.closed) {
        clearInterval(checkWindowClosed);
        setIsLinkingGoogle(false);
        // Refresh Google status when window closes
        fetchGoogleStatus();
      }
    }, 1000);

    window.addEventListener('message', handleMessage);
  };

  // Handle unlinking Google account
  const handleUnlinkGoogle = async () => {
    setIsUnlinkingGoogle(true);
    try {
      await usersApi.unlinkGoogle();
      addToast('Google account unlinked successfully', 'success');
      setShowUnlinkConfirm(false);
      fetchGoogleStatus();
      checkAuth();
    } catch (error: any) {
      console.error('Error unlinking Google:', error);
      addToast(error.response?.data?.message || 'Failed to unlink Google account', 'error');
    } finally {
      setIsUnlinkingGoogle(false);
    }
  };

  // Handle setting password (for Google-only users)
  const handleSetPassword = async () => {
    setGoogleSetPasswordError('');

    if (googleSetPasswordForm.newPassword !== googleSetPasswordForm.confirmPassword) {
      setGoogleSetPasswordError('Passwords do not match');
      return;
    }

    if (googleSetPasswordForm.newPassword.length < 6) {
      setGoogleSetPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsSettingPassword(true);
    try {
      await usersApi.setPassword(googleSetPasswordForm.newPassword);
      addToast('Password set successfully!', 'success');
      setShowSetPassword(false);
      setGoogleSetPasswordForm({ newPassword: '', confirmPassword: '' });
      fetchGoogleStatus();
      checkAuth();
    } catch (error: any) {
      console.error('Error setting password:', error);
      setGoogleSetPasswordError(error.response?.data?.message || 'Failed to set password');
    } finally {
      setIsSettingPassword(false);
    }
  };

  // Handle connecting Google Calendar
  const handleConnectCalendar = async () => {
    setIsConnectingCalendar(true);
    try {
      const response = await calendarApi.getConnectUrl();
      const { url } = response.data;
      window.location.href = url;
    } catch (error: any) {
      console.error('Error getting calendar connect URL:', error);
      addToast('Failed to get calendar connection URL', 'error');
      setIsConnectingCalendar(false);
    }
  };

  // Handle disconnecting Google Calendar
  const handleDisconnectCalendar = async () => {
    setIsDisconnectingCalendar(true);
    try {
      await calendarApi.disconnect();
      addToast('Google Calendar disconnected successfully', 'success');
      fetchCalendarStatus();
    } catch (error: any) {
      console.error('Error disconnecting calendar:', error);
      addToast(error.response?.data?.message || 'Failed to disconnect calendar', 'error');
    } finally {
      setIsDisconnectingCalendar(false);
    }
  };

  // Handle toggling calendar sync
  const handleToggleSync = async () => {
    if (!calendarStatus) return;
    
    setIsTogglingSync(true);
    try {
      const newEnabled = !calendarStatus.syncEnabled;
      await calendarApi.toggleSync(newEnabled);
      addToast(`Calendar sync ${newEnabled ? 'enabled' : 'disabled'}`, 'success');
      fetchCalendarStatus();
    } catch (error: any) {
      console.error('Error toggling calendar sync:', error);
      addToast(error.response?.data?.message || 'Failed to toggle sync', 'error');
    } finally {
      setIsTogglingSync(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Show loading
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Patient';

  return (
    <div className="container-app py-8">
      <h1 className="text-3xl font-bold text-text-navy mb-8">My Profile</h1>

      {/* Profile Image Section */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-cyan/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary-cyan/10 flex items-center justify-center border-4 border-primary-cyan/20">
                <User className="w-16 h-16 text-primary-cyan" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary-cyan text-white rounded-full flex items-center justify-center hover:bg-primary-cyan/90 disabled:opacity-50 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleProfileImageUpload}
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-text-navy">{displayName}</h2>
            <p className="text-text-gray">{user.email}</p>
            <Badge variant="success" className="mt-2">Active Account</Badge>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-text-navy">Personal Information</h3>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-gray mb-1">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-gray mb-1">First Name</label>
              <Input
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-gray mb-1">Last Name</label>
              <Input
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                placeholder="Last Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-gray mb-1">Phone</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="09xxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-gray mb-1">Date of Birth</label>
              <Input
                type="date"
                value={editForm.dateOfBirth}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-gray mb-1">Address</label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Your address"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-gray mb-1">Emergency Contact</label>
              <Input
                value={editForm.emergencyContact}
                onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                placeholder="Name and phone number"
              />
            </div>
            
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                // Reset form
                if (profile) {
                  setEditForm({
                    email: profile.email || '',
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    phone: profile.phone || '',
                    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
                    address: profile.address || '',
                    emergencyContact: profile.emergencyContact || '',
                    medicalHistory: profile.medicalHistory || '',
                    allergies: profile.allergies || '',
                  });
                }
              }}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-text-gray" />
              <div>
                <p className="text-sm text-text-gray">Email</p>
                <p className="font-medium">{profile?.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-text-gray" />
              <div>
                <p className="text-sm text-text-gray">Name</p>
                <p className="font-medium">{profile?.firstName} {profile?.lastName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-text-gray" />
              <div>
                <p className="text-sm text-text-gray">Phone</p>
                <p className="font-medium">{profile?.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-text-gray" />
              <div>
                <p className="text-sm text-text-gray">Date of Birth</p>
                <p className="font-medium">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <MapPin className="w-5 h-5 text-text-gray" />
              <div>
                <p className="text-sm text-text-gray">Address</p>
                <p className="font-medium">{profile?.address || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Medical Information */}
      <Card className="mb-6">
        <h3 className="text-xl font-semibold text-text-navy mb-4">Medical Information</h3>
        
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-gray mb-1">Medical History</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-cyan focus:border-transparent"
                rows={3}
                value={editForm.medicalHistory}
                onChange={(e) => setEditForm({ ...editForm, medicalHistory: e.target.value })}
                placeholder="Any medical conditions or history..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-gray mb-1">Allergies</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-cyan focus:border-transparent"
                rows={2}
                value={editForm.allergies}
                onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                placeholder="Any allergies..."
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-gray mb-1">Medical History</p>
              <p className="font-medium">{profile?.medicalHistory || 'None'}</p>
            </div>
            <div>
              <p className="text-sm text-text-gray mb-1">Allergies</p>
              <p className="font-medium">{profile?.allergies || 'None'}</p>
            </div>
            <div>
              <p className="text-sm text-text-gray mb-1">Emergency Contact</p>
              <p className="font-medium">{profile?.emergencyContact || '-'}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Google Account Linking */}
      <Card className="mb-6">
        <h3 className="text-xl font-semibold text-text-navy mb-4">Google Account</h3>
        
        {isLoadingGoogleStatus ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        ) : googleStatus ? (
          <div className="space-y-4">
            {/* Linked Status */}
            {googleStatus.isLinked && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800">Google Account Linked</p>
                  <p className="text-sm text-green-600">{googleStatus.googleEmail}</p>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
            )}

            {/* Not Linked Status */}
            {!googleStatus.isLinked && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-700">No Google Account Linked</p>
                  <p className="text-sm text-gray-500">Link your Google account for easier login</p>
                </div>
                <Badge variant="secondary">Not Linked</Badge>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Link Google Button */}
              {!googleStatus.isLinked && (
                <Button
                  variant="outline"
                  onClick={handleLinkGoogle}
                  disabled={isLinkingGoogle}
                  className="flex items-center gap-2"
                >
                  {isLinkingGoogle ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4" />
                  )}
                  Link Google Account
                </Button>
              )}

              {/* Unlink Google Button (only if has password) */}
              {googleStatus.isLinked && googleStatus.hasPassword && (
                <Button
                  variant="outline"
                  onClick={() => setShowUnlinkConfirm(true)}
                  disabled={isUnlinkingGoogle}
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Unlink className="w-4 h-4" />
                  Unlink Google
                </Button>
              )}

              {/* Set Password Button (only for Google-only users) */}
              {googleStatus.isLinked && !googleStatus.hasPassword && (
                <Button
                  variant="outline"
                  onClick={() => setShowSetPassword(true)}
                  className="flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Set Password
                </Button>
              )}
            </div>

            {/* Unlink Confirmation Modal */}
            {showUnlinkConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Unlink Google Account?</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to unlink your Google account? You will need to use your email and password to log in afterwards.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowUnlinkConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUnlinkGoogle}
                      disabled={isUnlinkingGoogle}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isUnlinkingGoogle ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Unlink
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Set Password Modal */}
            {showSetPassword && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold mb-4">Set Password</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Set a password to be able to log in with your email even without Google.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <Input
                        type="password"
                        value={googleSetPasswordForm.newPassword}
                        onChange={(e) => setGoogleSetPasswordForm({ ...googleSetPasswordForm, newPassword: e.target.value })}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <Input
                        type="password"
                        value={googleSetPasswordForm.confirmPassword}
                        onChange={(e) => setGoogleSetPasswordForm({ ...googleSetPasswordForm, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                      />
                    </div>
                    {googleSetPasswordError && (
                      <p className="text-sm text-red-500">{googleSetPasswordError}</p>
                    )}
                  </div>
                  <div className="flex gap-3 justify-end mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSetPassword(false);
                        setGoogleSetPasswordError('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSetPassword}
                      disabled={isSettingPassword || !googleSetPasswordForm.newPassword}
                    >
                      {isSettingPassword ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Set Password
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Unable to load Google account status</p>
        )}
      </Card>

      {/* Google Calendar Integration */}
      <Card className="mb-6">
        <h3 className="text-xl font-semibold text-text-navy mb-4">Google Calendar</h3>
        
        {isLoadingCalendarStatus ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        ) : calendarStatus ? (
          <div className="space-y-4">
            {/* Connected Status */}
            {calendarStatus.isConnected && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <CalendarCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-blue-800">Google Calendar Connected</p>
                  <p className="text-sm text-blue-600">
                    {calendarStatus.syncEnabled 
                      ? 'Auto-sync is enabled - appointments will be added to your calendar' 
                      : 'Auto-sync is disabled'}
                  </p>
                  {calendarStatus.lastSyncAt && (
                    <p className="text-xs text-blue-500 mt-1">
                      Last synced: {new Date(calendarStatus.lastSyncAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <Badge variant={calendarStatus.syncEnabled ? "success" : "secondary"}>
                  {calendarStatus.syncEnabled ? "Sync On" : "Sync Off"}
                </Badge>
              </div>
            )}

            {/* Not Connected Status */}
            {!calendarStatus.isConnected && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                  <CalendarX className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Google Calendar Not Connected</p>
                  <p className="text-sm text-gray-500">Connect your calendar to sync appointments with reminders</p>
                </div>
                <Badge variant="secondary">Not Connected</Badge>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Connect Calendar Button */}
              {!calendarStatus.isConnected && (
                <Button
                  variant="outline"
                  onClick={handleConnectCalendar}
                  disabled={isConnectingCalendar}
                  className="flex items-center gap-2"
                >
                  {isConnectingCalendar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4" />
                  )}
                  Connect Google Calendar
                </Button>
              )}

              {/* Toggle Sync Button (only when connected) */}
              {calendarStatus.isConnected && (
                <Button
                  variant="outline"
                  onClick={handleToggleSync}
                  disabled={isTogglingSync}
                  className="flex items-center gap-2"
                >
                  {isTogglingSync ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {calendarStatus.syncEnabled ? 'Disable Sync' : 'Enable Sync'}
                </Button>
              )}

              {/* Disconnect Calendar Button */}
              {calendarStatus.isConnected && (
                <Button
                  variant="outline"
                  onClick={handleDisconnectCalendar}
                  disabled={isDisconnectingCalendar}
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isDisconnectingCalendar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                  Disconnect
                </Button>
              )}
            </div>

            {/* Info about reminders */}
            {calendarStatus.isConnected && calendarStatus.syncEnabled && (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700 mb-1">Calendar Reminders:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Email reminder 24 hours before appointment</li>
                  <li>Popup reminder 1 hour before appointment</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Unable to load calendar status</p>
        )}
      </Card>

      {/* Change Password */}
      <Card>
        <h3 className="text-xl font-semibold text-text-navy mb-4">Change Password</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-gray mb-1">Current Password</label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-gray mb-1">New Password</label>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-gray mb-1">Confirm New Password</label>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
            />
          </div>
          
          {passwordError && (
            <div className="md:col-span-2 text-red-500 text-sm">{passwordError}</div>
          )}
          
          <div className="md:col-span-2">
            <Button 
              onClick={handleChangePassword} 
              disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
              variant="outline"
            >
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Change Password
            </Button>
            <p className="text-sm text-text-gray mt-2">
              Note: You will be logged out after changing password and need to login again.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
