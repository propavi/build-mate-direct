import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, ClipboardList, Clock, Plus, Search, ArrowRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/order-status";
import { EmptyState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { categoriesQuery, materialsQuery, myOrdersQuery } from "@/lib/queries";
import { inr, shortDate } from "@/lib/format";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BuildSupply" },
      { name: "description", content: "Your construction material orders at a glance." },
      { property: "og:title", content: "Dashboard — BuildSupply" },
      { property: "og:description", content: "Your construction material orders at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile } = useAuth();
  const [search, setSearch] = useState("");
  const orders = useQuery({ ...myOrdersQuery(user?.id ?? ""), enabled: Boolean(user?.id) });
  const categories = useQuery(categoriesQuery());
  const materials = useQuery(materialsQuery());

  const pending = (orders.data ?? []).filter(
    (o) => !["Delivered", "Cancelled"].includes(o.status),
  );
  const recent = (orders.data ?? []).slice(0, 5);

  const countFor = (categoryId: string) =>
    (materials.data ?? []).filter((m) => m.category_id === categoryId).length;

  return (
    <AppShell variant="customer">
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(" ")[0] || "there"}`}
        description="Order materials for your site and track every delivery."
        action={
          <Button asChild>
            <Link to="/materials">
              <Plus className="mr-1 h-4 w-4" /> Create New Order
            </Link>
          </Button>
        }
      />

      <form
        className="surface-panel mb-6 flex items-center gap-2 p-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search materials — cement, TMT steel, M-Sand…"
          className="border-0 shadow-none focus-visible:ring-0"
        />
        <Button asChild size="sm" disabled={!search.trim()}>
          <Link to="/materials" search={{ q: search.trim() || undefined, category: undefined }}>
            Search
          </Link>
        </Button>
      </form>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={ClipboardList}
          label="Total orders"
          value={String(orders.data?.length ?? 0)}
        />
        <StatCard icon={Clock} label="Pending orders" value={String(pending.length)} />
        <StatCard
          icon={Package}
          label="Materials available"
          value={String(materials.data?.length ?? 0)}
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Material categories</h2>
        {categories.isLoading ? (
          <LoadingBlock />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(categories.data ?? []).map((c) => (
              <Link
                key={c.id}
                to="/materials"
                search={{ category: c.slug, q: undefined }}
                className="surface-panel group p-4 transition-colors hover:border-accent"
              >
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{countFor(c.id)} products</p>
                <span className="mt-3 inline-flex items-center text-xs font-medium text-accent-foreground">
                  Browse <ArrowRight className="ml-1 h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/orders">View all</Link>
          </Button>
        </div>
        {orders.isLoading ? (
          <LoadingBlock />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="No orders yet"
            description="Browse materials and place your first site order."
            action={
              <Button asChild>
                <Link to="/materials">Browse materials</Link>
              </Button>
            }
          />
        ) : (
          <div className="surface-panel divide-y divide-border">
            {recent.map((o) => (
              <Link
                key={o.id}
                to="/orders/$orderId"
                params={{ orderId: o.id }}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{o.order_no}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {shortDate(o.created_at)} · {o.city || "—"} · {inr(Number(o.total))}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-panel grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
        <span className="block text-xl font-bold">{value}</span>
      </span>
    </div>
  );
}
