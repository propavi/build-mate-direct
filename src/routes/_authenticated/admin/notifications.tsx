import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { notificationsQuery } from "@/lib/queries";
import { longDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — BuildSupply Admin" },
      { name: "description", content: "New order alerts and customer activity." },
      { property: "og:title", content: "Notifications — BuildSupply Admin" },
      { property: "og:description", content: "New order alerts and customer activity." },
    ],
  }),
  component: AdminNotifications,
});

function AdminNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notifications = useQuery({
    ...notificationsQuery({ userId: user?.id ?? "", admin: true }),
    enabled: !!user,
  });

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("for_admin", true);
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <AppShell variant="admin">
      <PageHeader
        title="Notifications"
        description="Alerts for new orders placed by customers."
        action={
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        }
      />

      {notifications.isLoading ? (
        <LoadingBlock />
      ) : notifications.isError ? (
        <ErrorState message={(notifications.error as Error)?.message} />
      ) : (notifications.data ?? []).length === 0 ? (
        <EmptyState icon={<Bell className="h-8 w-8" />} title="Nothing new" />
      ) : (
        <div className="surface-panel overflow-hidden">
          <ul className="divide-y divide-border">
            {(notifications.data ?? []).map((n) => (
              <li key={n.id} className="px-5 py-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{longDate(n.created_at)}</p>
                  </div>
                  {n.order_id && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/orders/$orderId" params={{ orderId: n.order_id }}>
                        View
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
