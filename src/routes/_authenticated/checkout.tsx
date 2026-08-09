import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { deliveryRulesQuery, resolveDeliveryCharge } from "@/lib/queries";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — BuildSupply" },
      { name: "description", content: "Confirm delivery details and place your material order." },
      { property: "og:title", content: "Checkout — BuildSupply" },
      {
        property: "og:description",
        content: "Confirm delivery details and place your material order.",
      },
    ],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  contact_name: z.string().trim().min(2, "Name is required").max(100),
  contact_phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  contact_email: z.string().trim().email("Enter a valid email").max(255),
  site_name: z.string().trim().min(2, "Site / project name is required").max(120),
  address: z.string().trim().min(5, "Delivery address is required").max(500),
  city: z.string().trim().min(2, "City is required").max(80),
  district: z.string().trim().min(2, "District is required").max(80),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, "Enter a valid 6-digit PIN code"),
  location_note: z.string().trim().max(300).optional(),
});

function CheckoutPage() {
  const { user, profile } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const rules = useQuery(deliveryRulesQuery());
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState({
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    site_name: "",
    address: "",
    city: "",
    district: "",
    pincode: "",
    location_note: "",
  });

  useEffect(() => {
    if (profile) {
      setValues((v) => ({
        ...v,
        contact_name: v.contact_name || profile.full_name,
        contact_phone: v.contact_phone || profile.phone,
        contact_email: v.contact_email || profile.email,
      }));
    }
  }, [profile]);

  const delivery = useMemo(
    () => resolveDeliveryCharge(rules.data ?? [], values.city),
    [rules.data, values.city],
  );

  const subtotal = cart.subtotal;
  const grandTotal = subtotal + delivery.charge;

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const placeOrder = async () => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (!user) return;
    setErrors({});
    setBusy(true);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        contact_name: parsed.data.contact_name,
        contact_phone: parsed.data.contact_phone,
        contact_email: parsed.data.contact_email,
        site_name: parsed.data.site_name,
        address: parsed.data.address,
        city: parsed.data.city,
        district: parsed.data.district,
        pincode: parsed.data.pincode,
        location_note: parsed.data.location_note ?? "",
        subtotal,
        delivery_charge: delivery.charge,
        total: grandTotal,
        status: "Order Placed",
      })
      .select()
      .single();

    if (error || !order) {
      setBusy(false);
      toast.error(error?.message ?? "Could not place the order");
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      cart.items.map((i) => ({
        order_id: order.id,
        material_id: i.materialId,
        material_name: i.name,
        brand: i.brand,
        quality: i.quality,
        unit: i.unit,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        line_total: i.unitPrice * i.quantity,
      })),
    );

    if (itemsError) {
      setBusy(false);
      toast.error(itemsError.message);
      return;
    }

    await supabase.from("notifications").insert({
      for_admin: true,
      order_id: order.id,
      title: `New Order Received — ${order.order_no}`,
      body: `${parsed.data.contact_name} placed an order worth ${inr(grandTotal)} for ${parsed.data.city}.`,
    });

    cart.clear();
    setBusy(false);
    toast.success("Order placed successfully");
    navigate({ to: "/orders/$orderId", params: { orderId: order.id }, search: { placed: true } });
  };

  if (cart.items.length === 0) {
    return (
      <AppShell variant="customer">
        <PageHeader title="Checkout" />
        <EmptyState
          title="Nothing to check out"
          description="Add materials to your cart first."
          action={
            <Button asChild>
              <Link to="/materials">Browse materials</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const field = (
    key: keyof typeof values,
    label: string,
    placeholder?: string,
    type = "text",
  ) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} type={type} value={values[key]} onChange={set(key)} placeholder={placeholder} />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <AppShell variant="customer">
      <PageHeader title="Checkout" description="Confirm where these materials should be delivered." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="surface-panel p-5">
            <h2 className="mb-4 text-base font-semibold">Customer information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("contact_name", "Name")}
              {field("contact_phone", "Phone", "98765 43210", "tel")}
              <div className="sm:col-span-2">{field("contact_email", "Email", undefined, "email")}</div>
            </div>
          </section>

          <section className="surface-panel p-5">
            <h2 className="mb-4 text-base font-semibold">Delivery information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("site_name", "Site / Project Name", "Residential House")}
              {field("city", "City", "Coimbatore")}
              {field("district", "District", "Coimbatore")}
              {field("pincode", "PIN Code", "641001")}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea
                  id="address"
                  value={values.address}
                  onChange={set("address")}
                  placeholder="Plot 14, Sector 2, near water tank"
                  rows={3}
                />
                {errors["address"] && (
                  <p className="text-xs text-destructive">{errors["address"]}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="location_note">Location landmark / map link (optional)</Label>
                <Input
                  id="location_note"
                  value={values.location_note}
                  onChange={set("location_note")}
                  placeholder="Google Maps link or landmark"
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="surface-panel h-fit p-5">
          <h2 className="text-base font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {cart.items.map((i) => (
              <li key={i.materialId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <span className="truncate text-muted-foreground">
                  {i.name} — {i.quantity} {i.unit.trim().toLowerCase()}
                </span>
                <span className="font-medium">{inr(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{inr(subtotal)}</span>
            </div>
            <div className="flex items-start justify-between gap-3 rounded-md bg-accent/15 p-3">
              <span className="flex min-w-0 items-center gap-2 text-accent-foreground">
                <Truck className="h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-medium">Delivery Charge</span>
                  <span className="block text-xs opacity-80">
                    {values.city.trim()
                      ? delivery.rule
                        ? `${delivery.rule.from_location} → ${delivery.rule.to_location}`
                        : "No rule configured — admin will confirm"
                      : "Enter your city to see the charge"}
                  </span>
                </span>
              </span>
              <span className="font-semibold text-accent-foreground">{inr(delivery.charge)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <span className="font-semibold">Grand Total</span>
              <span className="font-bold">{inr(grandTotal)}</span>
            </div>
          </div>
          <Button className="mt-5 w-full" onClick={placeOrder} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Place Order
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link to="/cart">Back to cart</Link>
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}
