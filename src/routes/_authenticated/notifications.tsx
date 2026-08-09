import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { notificationsQuery } from "@/lib/queries";
import { longDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — BuildSupply" },
      { name: "description", content: "Order updates and confirmations." },
      { property: "og:title", content: "Notifications — BuildSupply" },
      { property: "og:description", content: "Order updates and confirmations." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notifications = useQuery({
    ...notificationsQuery({ userId: user?.id ?? "", admin: false }),
    enabled: Boolean(user?.id),
  });

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <AppShell variant="customer">
      <PageHeader title="Notifications" description="Updates on your material orders." />
      {notifications.isLoading ? (
        <LoadingBlock />
      ) : (notifications.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="No notifications yet"
          description="You'll be notified when your order status changes."
        />
      ) : (
        <ul className="surface-panel divide-y divide-border">
          {(notifications.data ?? []).map((n) => (
            <li
              key={n.id}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4",
                !n.read && "bg-accent/5",
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{n.title}</p>
                <p className="truncate text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{longDate(n.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {n.order_id && (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to="/orders/$orderId"
                      params={{ orderId: n.order_id }}
                      search={{ placed: undefined }}
                    >
                      View
                    </Link>
                  </Button>
                )}
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
