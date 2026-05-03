import React, { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar: string | null;
  name: string | null;
  onUpload: (file: File | null) => void;
}

export function AvatarUpload({ currentAvatar, name, onUpload }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onUpload(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const initials = name?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex items-center space-x-6">
      <Avatar className="h-24 w-24 border-2 border-zinc-100 shadow-sm">
        <AvatarImage src={preview || currentAvatar || undefined} alt={name || 'Avatar'} className="object-cover" />
        <AvatarFallback className="text-xl bg-zinc-50 text-zinc-600">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-zinc-700 font-medium"
          >
            <Upload className="h-4 w-4 mr-2" />
            Change Avatar
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-zinc-500 hover:text-red-600"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          JPG, GIF or PNG. Max size of 2MB.
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/gif"
        className="hidden"
      />
    </div>
  );
}
