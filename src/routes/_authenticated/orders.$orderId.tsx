import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, StatusTimeline } from "@/components/order-status";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { orderDetailQuery } from "@/lib/queries";
import { inr, longDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders/$orderId")({
  validateSearch: z.object({ placed: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Order details — BuildSupply" },
      { name: "description", content: "Materials, delivery details and status for your order." },
      { property: "og:title", content: "Order details — BuildSupply" },
      {
        property: "og:description",
        content: "Materials, delivery details and status for your order.",
      },
    ],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { placed } = Route.useSearch();
  const detail = useQuery(orderDetailQuery(orderId));

  if (detail.isLoading) {
    return (
      <AppShell variant="customer">
        <LoadingBlock />
      </AppShell>
    );
  }
  if (detail.isError) {
    return (
      <AppShell variant="customer">
        <ErrorState message={(detail.error as Error)?.message} />
      </AppShell>
    );
  }

  const order = detail.data?.order;
  const items = detail.data?.items ?? [];

  if (!order) {
    return (
      <AppShell variant="customer">
        <EmptyState
          title="Order not found"
          description="This order may have been removed."
          action={
            <Button asChild>
              <Link to="/orders">Back to my orders</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell variant="customer">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/orders">
          <ArrowLeft className="mr-1 h-4 w-4" /> My Orders
        </Link>
      </Button>

      {placed && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-5">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold">Order Placed Successfully</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ve notified our team. You&apos;ll see the status update here as your materials
              are prepared and dispatched.
            </p>
          </div>
        </div>
      )}

      <div className="surface-panel mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Order ID" value={order.order_no} />
        <Info label="Date" value={longDate(order.created_at)} />
        <Info label="Total amount" value={inr(Number(order.total))} />
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
          <div className="mt-1">
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <section className="surface-panel mb-6 p-5">
        <h2 className="mb-5 text-base font-semibold">Order status</h2>
        <StatusTimeline status={order.status} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="surface-panel overflow-hidden">
          <h2 className="border-b border-border px-5 py-4 text-base font-semibold">Materials</h2>
          <ul className="divide-y divide-border">
            {items.map((i) => (
              <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.material_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[i.brand, i.quality].filter(Boolean).join(" · ")} — {Number(i.quantity)}{" "}
                    {i.unit.trim().toLowerCase()} × {inr(Number(i.unit_price))}
                  </p>
                </div>
                <p className="font-semibold">{inr(Number(i.line_total))}</p>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-border px-5 py-4 text-sm">
            <Row label="Subtotal" value={inr(Number(order.subtotal))} />
            <Row label="Delivery charge" value={inr(Number(order.delivery_charge))} />
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Grand total</span>
              <span>{inr(Number(order.total))}</span>
            </div>
          </div>
        </section>

        <aside className="surface-panel h-fit p-5">
          <h2 className="text-base font-semibold">Delivery details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Info label="Site / Project" value={order.site_name} />
            <Info label="Address" value={order.address} />
            <Info label="City" value={order.city} />
            <Info label="District" value={order.district} />
            <Info label="PIN Code" value={order.pincode} />
            {order.location_note && <Info label="Landmark" value={order.location_note} />}
            <Info label="Contact" value={`${order.contact_name} · ${order.contact_phone}`} />
          </dl>
        </aside>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value || "—"}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
