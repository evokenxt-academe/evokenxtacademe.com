import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Calendar, GraduationCap, Award, Loader2 } from 'lucide-react';
import { useProfile } from '../hooks/use-profile';
import { format } from 'date-fns';

export function ProfileCard() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <Card className="rounded-xl border-zinc-200/60 shadow-sm animate-pulse h-full">
        <CardContent className="pt-6 flex flex-col items-center">
          <div className="h-24 w-24 bg-zinc-200 rounded-full mb-4"></div>
          <div className="h-6 w-3/4 bg-zinc-200 rounded mb-2"></div>
          <div className="h-4 w-1/2 bg-zinc-100 rounded mb-6"></div>
          <div className="w-full space-y-3">
            <div className="h-4 w-full bg-zinc-100 rounded"></div>
            <div className="h-4 w-full bg-zinc-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const initials = profile.name?.charAt(0).toUpperCase() || 'U';
  const roleName = profile.role === 'admin' ? 'Administrator' : 
                   profile.role === 'instructor' ? 'Instructor' : 'Student';
                   
  const joinedDate = profile.created_at 
    ? format(new Date(profile.created_at), 'MMMM yyyy') 
    : 'Unknown';

  return (
    <Card className="rounded-xl border-zinc-200/60 shadow-sm overflow-hidden flex flex-col h-full bg-white relative">
      <div className="h-24 bg-zinc-100 w-full absolute top-0 left-0" />
      <CardContent className="pt-12 relative z-10 flex-1 flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 border-4 border-white shadow-md mb-4 bg-white">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || 'Avatar'} className="object-cover" />
          <AvatarFallback className="text-2xl bg-zinc-100 text-zinc-600">{initials}</AvatarFallback>
        </Avatar>

        <h2 className="text-xl font-semibold text-zinc-900 mb-1">{profile.name || 'Anonymous User'}</h2>
        
        <Badge variant="secondary" className="mb-6 font-medium text-xs rounded-full px-3 py-0.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-none">
          {roleName}
        </Badge>

        <Separator className="w-full mb-6 bg-zinc-100" />

        <div className="w-full space-y-4 text-left">
          <div className="flex items-center text-sm">
            <Mail className="w-4 h-4 mr-3 text-zinc-400" />
            <span className="text-zinc-600 truncate">{profile.email}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 mr-3 text-zinc-400" />
            <span className="text-zinc-600">Joined {joinedDate}</span>
          </div>

          {/* Optional Stats - Can be updated later with real data */}
          {profile.role === 'student' && (
            <>
              <div className="flex items-center text-sm">
                <GraduationCap className="w-4 h-4 mr-3 text-zinc-400" />
                <span className="text-zinc-600">Active Enrollments</span>
              </div>
              <div className="flex items-center text-sm">
                <Award className="w-4 h-4 mr-3 text-zinc-400" />
                <span className="text-zinc-600">Completed Courses</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
