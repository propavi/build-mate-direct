import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Clock, CheckCircle2, Truck, IndianRupee, Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/order-status";
import { LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { allOrdersQuery, customersQuery, orderItemsAllQuery } from "@/lib/admin-queries";
import { inr, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — BuildSupply" },
      { name: "description", content: "Orders, sales and materials overview for the supplier." },
      { property: "og:title", content: "Admin Dashboard — BuildSupply" },
      {
        property: "og:description",
        content: "Orders, sales and materials overview for the supplier.",
      },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const orders = useQuery(allOrdersQuery());
  const customers = useQuery(customersQuery());
  const items = useQuery(orderItemsAllQuery());

  const all = orders.data ?? [];
  const pending = all.filter((o) => o.status === "Order Placed");
  const confirmed = all.filter((o) => o.status === "Confirmed");
  const delivered = all.filter((o) => o.status === "Delivered");
  const sales = all
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const popular = Object.values(
    (items.data ?? []).reduce<Record<string, { name: string; qty: number; value: number }>>(
      (acc, i) => {
        const key = `${i.material_name}|${i.brand}`;
        acc[key] ??= { name: `${i.material_name}${i.brand ? ` (${i.brand})` : ""}`, qty: 0, value: 0 };
        acc[key].qty += Number(i.quantity);
        acc[key].value += Number(i.line_total);
        return acc;
      },
      {},
    ),
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <AppShell variant="admin">
      <PageHeader title="Admin Dashboard" description="Overview of orders, sales and customers." />

      {orders.isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat icon={ClipboardList} label="Total orders" value={String(all.length)} />
            <Stat icon={Clock} label="Pending orders" value={String(pending.length)} />
            <Stat icon={CheckCircle2} label="Confirmed orders" value={String(confirmed.length)} />
            <Stat icon={Truck} label="Delivered orders" value={String(delivered.length)} />
            <Stat icon={IndianRupee} label="Total sales" value={inr(sales)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="surface-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold">Recent orders</h2>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/admin/orders">View all</Link>
                </Button>
              </div>
              {all.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {all.slice(0, 6).map((o) => (
                    <li key={o.id}>
                      <Link
                        to="/admin/orders/$orderId"
                        params={{ orderId: o.id }}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {o.order_no} · {o.contact_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {shortDate(o.created_at)} · {o.city} · {inr(Number(o.total))}
                          </p>
                        </div>
                        <StatusBadge status={o.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="space-y-6">
              <section className="surface-panel overflow-hidden">
                <h2 className="border-b border-border px-5 py-4 text-base font-semibold">
                  Popular materials
                </h2>
                {popular.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No sales data yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {popular.map((p) => (
                      <li
                        key={p.name}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-5 py-3 text-sm"
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="font-medium">{inr(p.value)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="surface-panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold">Recent customers</h2>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/admin/customers">View all</Link>
                  </Button>
                </div>
                <ul className="divide-y divide-border">
                  {(customers.data ?? []).slice(0, 5).map((c) => (
                    <li
                      key={c.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-5 py-3"
                    >
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {c.full_name || "Unnamed"}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {c.email} · {c.phone || "no phone"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-panel p-4">
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-bold">{value}</p>
    </div>
  );
}
