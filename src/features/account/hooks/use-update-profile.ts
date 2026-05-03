import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserProfile, uploadAvatar, UserProfile } from '../api';
import { toast } from 'sonner';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile> & { avatarFile?: File | null }) => {
      let avatar_url = updates.avatar_url;

      if (updates.avatarFile) {
        avatar_url = await uploadAvatar(updates.avatarFile);
      }

      const { avatarFile, ...restUpdates } = updates;
      return updateUserProfile({ ...restUpdates, avatar_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}
