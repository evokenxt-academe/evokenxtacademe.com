import AdminNotifyPanel from "@/components/notifications/AdminNotifyPanel";

export default function AdminNotificationsPage() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send custom push notifications to all registered users.
        </p>
      </div>
      <AdminNotifyPanel />
    </div>
  );
}
