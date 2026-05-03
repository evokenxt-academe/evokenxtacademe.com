import React from 'react';
import { ProfileCard } from './ProfileCard';
import { ProfileForm } from './ProfileForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AccountPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Account</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your profile and settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-zinc-100/80 p-1 border border-zinc-200/50">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all">Profile</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all">Security</TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 items-start">
            <div className="md:sticky md:top-6">
              <ProfileCard />
            </div>
            <div>
              <ProfileForm />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="security" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="p-8 text-center border border-zinc-200/60 rounded-xl bg-white shadow-sm">
            <h3 className="text-lg font-medium text-zinc-900 mb-2">Security Settings</h3>
            <p className="text-zinc-500 max-w-sm mx-auto">
              Change your password and manage your active sessions. This section is currently under construction.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="p-8 text-center border border-zinc-200/60 rounded-xl bg-white shadow-sm">
            <h3 className="text-lg font-medium text-zinc-900 mb-2">Account Preferences</h3>
            <p className="text-zinc-500 max-w-sm mx-auto">
              Manage your email notifications and platform preferences. This section is currently under construction.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
