import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, StatusTimeline } from "@/components/order-status";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { orderDetailQuery } from "@/lib/admin-queries";
import { ALL_STATUSES } from "@/lib/order-status";
import { inr, longDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order details — BuildSupply Admin" },
      { name: "description", content: "Full order details and status management." },
      { property: "og:title", content: "Order details — BuildSupply Admin" },
      { property: "og:description", content: "Full order details and status management." },
    ],
  }),
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { orderId } = Route.useParams();
  const queryClient = useQueryClient();
  const detail = useQuery(orderDetailQuery(orderId));
  const order = detail.data?.order;
  const items = detail.data?.items ?? [];

  const [status, setStatus] = useState("");
  const [charge, setCharge] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingCharge, setSavingCharge] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setCharge(String(Number(order.delivery_charge)));
    }
  }, [order]);

  if (detail.isLoading) {
    return (
      <AppShell variant="admin">
        <LoadingBlock />
      </AppShell>
    );
  }
  if (detail.isError) {
    return (
      <AppShell variant="admin">
        <ErrorState message={(detail.error as Error)?.message} />
      </AppShell>
    );
  }
  if (!order) {
    return (
      <AppShell variant="admin">
        <EmptyState title="Order not found" />
      </AppShell>
    );
  }

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const saveStatus = async () => {
    if (status === order.status) return;
    setSavingStatus(true);
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    if (error) {
      setSavingStatus(false);
      toast.error(error.message);
      return;
    }
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      for_admin: false,
      order_id: order.id,
      title: `Order ${order.order_no} — ${status}`,
      body:
        status === "Confirmed"
          ? `Your order ${order.order_no} has been confirmed.`
          : `Your order ${order.order_no} status changed to ${status}.`,
    });
    setSavingStatus(false);
    refresh();
    toast.success("Status updated and customer notified");
  };

  const saveCharge = async () => {
    const value = Number(charge);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Enter a valid delivery charge");
      return;
    }
    setSavingCharge(true);
    const { error } = await supabase
      .from("orders")
      .update({
        delivery_charge: value,
        total: Number(order.subtotal) + value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    setSavingCharge(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
    toast.success("Delivery charge updated");
  };

  return (
    <AppShell variant="admin">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/admin/orders">
          <ArrowLeft className="mr-1 h-4 w-4" /> Orders
        </Link>
      </Button>

      <div className="mb-6 grid grid-cols-[minmax(0,1fr)] gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{order.order_no}</h1>
          <p className="text-sm text-muted-foreground">{longDate(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <section className="surface-panel mb-6 p-5">
        <StatusTimeline status={order.status} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="surface-panel overflow-hidden">
            <h2 className="border-b border-border px-5 py-4 text-base font-semibold">
              Ordered materials
            </h2>
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{inr(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery charge</span>
                <span className="font-medium">{inr(Number(order.delivery_charge))}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Grand total</span>
                <span>{inr(Number(order.total))}</span>
              </div>
            </div>
          </section>

          <section className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-base font-semibold">Customer</h2>
              <Info label="Name" value={order.contact_name} />
              <Info label="Phone" value={order.contact_phone} />
              <Info label="Email" value={order.contact_email} />
            </div>
            <div>
              <h2 className="mb-3 text-base font-semibold">Delivery</h2>
              <Info label="Site / Project" value={order.site_name} />
              <Info label="Address" value={order.address} />
              <Info label="City / District" value={`${order.city}, ${order.district}`} />
              <Info label="PIN Code" value={order.pincode} />
              {order.location_note && <Info label="Landmark" value={order.location_note} />}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="surface-panel p-5">
            <h2 className="text-base font-semibold">Update status</h2>
            <div className="mt-3 space-y-3">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={saveStatus}
                disabled={savingStatus || status === order.status}
              >
                {savingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save status
              </Button>
              <p className="text-xs text-muted-foreground">
                The customer receives an in-app notification on every status change.
              </p>
            </div>
          </section>

          <section className="surface-panel p-5">
            <h2 className="text-base font-semibold">Delivery charge</h2>
            <div className="mt-3 space-y-3">
              <Label htmlFor="charge">Charge for this order (₹)</Label>
              <Input
                id="charge"
                type="number"
                min={0}
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={saveCharge}
                disabled={savingCharge}
              >
                {savingCharge && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update charge
              </Button>
              <p className="text-xs text-muted-foreground">
                Overrides the configured rule for this order and recalculates the total.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
