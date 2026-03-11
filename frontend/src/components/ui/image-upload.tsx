'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useUIStore } from '@/stores';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useUIStore();

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      addToast('Invalid file type. Allowed: PNG, JPG, JPEG, WEBP, GIF', 'error');
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      addToast('File too large. Maximum size is 2MB', 'error');
      return;
    }

    // For registration: just create a preview URL (actual upload happens on submit)
    // The parent component will handle the actual upload
    const previewUrl = URL.createObjectURL(file);
    onChange(previewUrl);

    // Store the file for later upload
    // We'll attach it to the form data in the parent
    if (fileInputRef.current) {
      (fileInputRef.current as any).files = event.target.files;
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {value ? (
          <img
            src={value}
            alt="Profile preview"
            className="w-24 h-24 rounded-full object-cover border-4 border-primary-cyan/20"
          />
        ) : (
          <div
            onClick={handleClick}
            className={`w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200 cursor-pointer ${!disabled ? 'hover:border-primary-cyan hover:bg-gray-50' : ''} transition-colors`}
          >
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        {!disabled && (
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary-cyan text-white rounded-full flex items-center justify-center hover:bg-primary-cyan/90 disabled:opacity-50 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
        )}
        
        {value && !disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      
      <div className="text-sm text-text-gray">
        <p>Upload a profile photo</p>
        <p>PNG, JPG, JPEG, WebP, GIF • Max 2MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}

// Helper function to validate file before upload
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: PNG, JPG, JPEG, WEBP, GIF' };
  }
  
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 2MB' };
  }
  
  return { valid: true };
}
