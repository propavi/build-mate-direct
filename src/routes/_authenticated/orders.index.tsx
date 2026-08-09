import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/order-status";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { myOrdersQuery } from "@/lib/queries";
import { inr, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders/")({
  head: () => ({
    meta: [
      { title: "My Orders — BuildSupply" },
      { name: "description", content: "Track all your construction material orders." },
      { property: "og:title", content: "My Orders — BuildSupply" },
      { property: "og:description", content: "Track all your construction material orders." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const orders = useQuery({ ...myOrdersQuery(user?.id ?? ""), enabled: Boolean(user?.id) });

  return (
    <AppShell variant="customer">
      <PageHeader
        title="My Orders"
        description="Current and previous material orders."
        action={
          <Button asChild>
            <Link to="/materials">New order</Link>
          </Button>
        }
      />

      {orders.isLoading ? (
        <LoadingBlock />
      ) : orders.isError ? (
        <ErrorState message={(orders.error as Error)?.message} />
      ) : (orders.data ?? []).length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No orders yet"
          description="Your placed orders will appear here."
          action={
            <Button asChild>
              <Link to="/materials">Browse materials</Link>
            </Button>
          }
        />
      ) : (
        <div className="surface-panel overflow-hidden">
          <div className="hidden grid-cols-[1fr_1fr_1fr_1.4fr_1fr_auto] gap-3 border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
            <span>Order ID</span>
            <span>Date</span>
            <span>Total</span>
            <span>Delivery location</span>
            <span>Status</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {(orders.data ?? []).map((o) => (
              <li
                key={o.id}
                className="grid gap-2 px-4 py-4 lg:grid-cols-[1fr_1fr_1fr_1.4fr_1fr_auto] lg:items-center lg:gap-3"
              >
                <p className="font-semibold">{o.order_no}</p>
                <p className="text-sm text-muted-foreground">{shortDate(o.created_at)}</p>
                <p className="text-sm font-medium">{inr(Number(o.total))}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {o.site_name}, {o.city}
                </p>
                <StatusBadge status={o.status} />
                <Button asChild size="sm" variant="outline">
                  <Link to="/orders/$orderId" params={{ orderId: o.id }} search={{ placed: undefined }}>
                    View Details
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
