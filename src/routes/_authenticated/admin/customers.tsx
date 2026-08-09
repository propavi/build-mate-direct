import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { allOrdersQuery, customersQuery } from "@/lib/admin-queries";
import { inr, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({
    meta: [
      { title: "Customers — BuildSupply Admin" },
      { name: "description", content: "Registered builders and contractors with order history." },
      { property: "og:title", content: "Customers — BuildSupply Admin" },
      {
        property: "og:description",
        content: "Registered builders and contractors with order history.",
      },
    ],
  }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const customers = useQuery(customersQuery());
  const orders = useQuery(allOrdersQuery());

  const stats = (userId: string) => {
    const mine = (orders.data ?? []).filter((o) => o.user_id === userId);
    return {
      count: mine.length,
      spend: mine
        .filter((o) => o.status !== "Cancelled")
        .reduce((s, o) => s + Number(o.total), 0),
    };
  };

  return (
    <AppShell variant="admin">
      <PageHeader title="Customers" description="Everyone registered on the platform." />

      {customers.isLoading ? (
        <LoadingBlock />
      ) : customers.isError ? (
        <ErrorState message={(customers.error as Error)?.message} />
      ) : (customers.data ?? []).length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No customers yet" />
      ) : (
        <div className="surface-panel overflow-hidden">
          <ul className="divide-y divide-border">
            {(customers.data ?? []).map((c) => {
              const s = stats(c.id);
              return (
                <li
                  key={c.id}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.full_name || "Unnamed"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.email} · {c.phone || "no phone"} · joined {shortDate(c.created_at)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {s.count} order{s.count === 1 ? "" : "s"} ·{" "}
                    <span className="font-medium text-foreground">{inr(s.spend)}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
