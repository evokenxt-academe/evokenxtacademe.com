import { createClient } from '@/utils/supabase/client';

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  role?: string;
  created_at?: string;
}

export async function getUserProfile(): Promise<UserProfile> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  // As per instructions, fetching from 'profiles'
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // Fallback to users table if profiles doesn't exist yet
    if (error.code === '42P01') { 
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (userError) throw userError;
      return {
        ...userData,
        avatar_url: userData.avatar,
        bio: null
      } as any;
    }
    throw error;
  }
  return data as UserProfile;
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      const { avatar_url, bio, ...rest } = updates;
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({ ...rest, avatar: avatar_url } as any)
        .eq('id', user.id)
        .select()
        .single();
      
      if (userError) throw userError;
      return {
        ...userData,
        avatar_url: userData.avatar,
        bio: null
      } as any;
    }
    throw error;
  }
  return data as UserProfile;
}

export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}
