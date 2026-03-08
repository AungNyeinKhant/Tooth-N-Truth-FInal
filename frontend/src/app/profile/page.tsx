'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  X
} from 'lucide-react';
import { 
  getMyProfile, 
  updateMyProfile,
  uploadProfileImage,
  PatientProfile
} from '@/lib/api/patients.api';
import { usersApi } from '@/lib/api/users.api';

export default function ProfilePage() {
  const router = useRouter();
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

  // Fetch profile on mount
  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    init();
  }, [checkAuth]);

  // Fetch profile data
  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
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

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Please select a valid image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('File size must be less than 5MB', 'error');
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
