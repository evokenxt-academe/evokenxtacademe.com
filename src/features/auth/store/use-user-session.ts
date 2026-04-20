import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

interface User {
    id: string;
    avatar: string;
    name: string;
    email: string;
    phone: string;
    role: "student" | "admin" | "instructor";
}

interface UserSessionStore {
    user: User | null;
    isLoading: boolean;
    getSession: () => Promise<void>;
}

export const useUserSession = create<UserSessionStore>((set) => ({
    user: null,
    isLoading: false,
    getSession: async () => {
        set({ isLoading: true });
        const supabase = createClient();

        const { data: { session }, error } = await supabase.auth.getSession();
        const user = session?.user;

        if (error && error.message !== "Auth session missing!") {
            console.log("Supabase Auth Error:", error.message);
        }

        let userProfile = null;

        if (user) {
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()


            if (profileError) {
                console.log("Error fetching user profile:", profileError.message);
            }

            userProfile = {
                id: profile?.id,
                avatar: profile?.avatar || user.user_metadata?.avatar_url || '',
                name: profile?.name || user.user_metadata?.full_name || '',
                email: profile?.email || user.email || '',
                phone: profile?.phone || user.phone || '',
                role: (profile?.role as User["role"] | undefined) || 'student'
            };
        }

        set({
            user: userProfile,
            isLoading: false
        });
    }
}));