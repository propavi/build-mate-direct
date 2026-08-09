import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/order-status";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { allOrdersQuery } from "@/lib/admin-queries";
import { ALL_STATUSES } from "@/lib/order-status";
import { inr, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — BuildSupply Admin" },
      { name: "description", content: "Manage all customer material orders." },
      { property: "og:title", content: "Orders — BuildSupply Admin" },
      { property: "og:description", content: "Manage all customer material orders." },
    ],
  }),
  component: AdminOrders,
});

function AdminOrders() {
  const orders = useQuery(allOrdersQuery());
  const [status, setStatus] = useState<string>("All");
  const [term, setTerm] = useState("");

  const list = (orders.data ?? []).filter((o) => {
    if (status !== "All" && o.status !== status) return false;
    if (!term.trim()) return true;
    const t = term.toLowerCase();
    return [o.order_no, o.contact_name, o.contact_phone, o.city].join(" ").toLowerCase().includes(t);
  });

  return (
    <AppShell variant="admin">
      <PageHeader title="Orders" description="Every order placed by customers." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search order ID, customer, phone or city"
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {["All", ...ALL_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                status === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {orders.isLoading ? (
        <LoadingBlock />
      ) : orders.isError ? (
        <ErrorState message={(orders.error as Error)?.message} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No orders found"
          description="Orders placed by customers will appear here."
        />
      ) : (
        <div className="surface-panel overflow-hidden">
          <div className="hidden grid-cols-[1fr_1.2fr_1fr_1fr_1.2fr_1fr_1fr_auto] gap-3 border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:grid">
            <span>Order ID</span>
            <span>Customer</span>
            <span>Phone</span>
            <span>Date</span>
            <span>Location</span>
            <span>Total</span>
            <span>Status</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {list.map((o) => (
              <li
                key={o.id}
                className="grid gap-2 px-4 py-4 xl:grid-cols-[1fr_1.2fr_1fr_1fr_1.2fr_1fr_1fr_auto] xl:items-center xl:gap-3"
              >
                <p className="font-semibold">{o.order_no}</p>
                <p className="truncate text-sm">{o.contact_name}</p>
                <p className="truncate text-sm text-muted-foreground">{o.contact_phone}</p>
                <p className="text-sm text-muted-foreground">{shortDate(o.created_at)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {o.site_name}, {o.city}
                </p>
                <p className="text-sm font-medium">{inr(Number(o.total))}</p>
                <StatusBadge status={o.status} />
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/orders/$orderId" params={{ orderId: o.id }}>
                    Open
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
