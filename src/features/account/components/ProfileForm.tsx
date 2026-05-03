import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProfile } from '../hooks/use-profile';
import { useUpdateProfile } from '../hooks/use-update-profile';
import { AvatarUpload } from './AvatarUpload';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '../api';

export function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    phone: '',
    bio: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-zinc-200/60 shadow-sm animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/3 bg-zinc-200 rounded"></div>
          <div className="h-4 w-1/2 bg-zinc-100 rounded mt-2"></div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-24 w-24 bg-zinc-200 rounded-full"></div>
          <div className="space-y-4">
            <div className="h-10 w-full bg-zinc-100 rounded"></div>
            <div className="h-10 w-full bg-zinc-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = () => {
    if (!profile) return false;
    if (avatarFile !== null) return true;
    return (
      formData.name !== (profile.name || '') ||
      formData.phone !== (profile.phone || '') ||
      formData.bio !== (profile.bio || '')
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name?.trim()) {
      return; // Could add specific field errors here
    }

    updateProfile.mutate({
      name: formData.name,
      phone: formData.phone,
      bio: formData.bio,
      avatarFile,
    });
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
      setAvatarFile(null);
    }
  };

  return (
    <Card className="rounded-xl border-zinc-200/60 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-zinc-900">Personal Information</CardTitle>
        <CardDescription className="text-zinc-500">
          Update your personal details and public profile.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            <Label className="text-zinc-700">Profile Picture</Label>
            <AvatarUpload 
              currentAvatar={profile?.avatar_url || null} 
              name={profile?.name || null} 
              onUpload={(file) => setAvatarFile(file)} 
            />
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-zinc-700">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
                className="rounded-lg border-zinc-200 focus-visible:ring-zinc-400"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-zinc-700">Email Address</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="rounded-lg bg-zinc-50 text-zinc-500 border-zinc-200 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500">Your email address is used for login and cannot be changed here.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-zinc-700">Phone Number (Optional)</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="rounded-lg border-zinc-200 focus-visible:ring-zinc-400"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio" className="text-zinc-700">Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us a little bit about yourself..."
                className="rounded-lg border-zinc-200 focus-visible:ring-zinc-400 min-h-[120px] resize-y"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={!hasChanges() || updateProfile.isPending}
              className="rounded-lg text-zinc-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges() || !formData.name?.trim() || updateProfile.isPending}
              className="rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
            >
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
