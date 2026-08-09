import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = { id: string; name: string; slug: string; sort_order: number };

export type Material = {
  id: string;
  name: string;
  category_id: string;
  brand: string;
  type: string;
  quality: string;
  unit: string;
  price: number;
  available: boolean;
  active: boolean;
  created_at: string;
};

export type DeliveryRule = {
  id: string;
  from_location: string;
  to_location: string;
  charge: number;
};

export type Order = {
  id: string;
  order_no: string;
  user_id: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  site_name: string;
  address: string;
  city: string;
  district: string;
  pincode: string;
  location_note: string;
  subtotal: number;
  delivery_charge: number;
  total: number;
  status: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  material_id: string | null;
  material_name: string;
  brand: string;
  quality: string;
  unit: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type AppNotification = {
  id: string;
  user_id: string | null;
  for_admin: boolean;
  order_id: string | null;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

const unwrap = <T>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
};

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () =>
      unwrap<Category[]>(await supabase.from("categories").select("*").order("sort_order")),
  });

export const materialsQuery = (opts?: { includeInactive?: boolean }) =>
  queryOptions({
    queryKey: ["materials", opts?.includeInactive ?? false],
    queryFn: async () => {
      let q = supabase.from("materials").select("*").order("name");
      if (!opts?.includeInactive) q = q.eq("active", true);
      return unwrap<Material[]>(await q);
    },
  });

export const deliveryRulesQuery = () =>
  queryOptions({
    queryKey: ["delivery_rules"],
    queryFn: async () =>
      unwrap<DeliveryRule[]>(
        await supabase.from("delivery_rules").select("*").order("to_location"),
      ),
  });

export const myOrdersQuery = (userId: string) =>
  queryOptions({
    queryKey: ["orders", "mine", userId],
    queryFn: async () =>
      unwrap<Order[]>(
        await supabase
          .from("orders")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ),
  });

export const allOrdersQuery = () =>
  queryOptions({
    queryKey: ["orders", "all"],
    queryFn: async () =>
      unwrap<Order[]>(
        await supabase.from("orders").select("*").order("created_at", { ascending: false }),
      ),
  });

export const orderDetailQuery = (orderId: string) =>
  queryOptions({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const orderRes = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (orderRes.error) throw new Error(orderRes.error.message);
      const itemsRes = await supabase.from("order_items").select("*").eq("order_id", orderId);
      if (itemsRes.error) throw new Error(itemsRes.error.message);
      return {
        order: (orderRes.data as Order) ?? null,
        items: (itemsRes.data ?? []) as OrderItem[],
      };
    },
  });

export const notificationsQuery = (params: { userId: string; admin: boolean }) =>
  queryOptions({
    queryKey: ["notifications", params.admin ? "admin" : params.userId],
    queryFn: async () => {
      const q = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      const res = params.admin
        ? await q.eq("for_admin", true)
        : await q.eq("user_id", params.userId);
      return unwrap<AppNotification[]>(res);
    },
  });

export const customersQuery = () =>
  queryOptions({
    queryKey: ["customers"],
    queryFn: async () =>
      unwrap<{ id: string; full_name: string; phone: string; email: string; created_at: string }[]>(
        await supabase
          .from("profiles")
          .select("id, full_name, phone, email, created_at")
          .order("created_at", { ascending: false }),
      ),
  });

/**
 * Resolve the delivery charge for a destination city.
 * MVP: matches an admin-configured rule (case-insensitive), falling back to the
 * "Other" rule. Designed so a distance-based calculator can replace this later.
 */
export const resolveDeliveryCharge = (rules: DeliveryRule[], city: string) => {
  const normalized = city.trim().toLowerCase();
  const match = rules.find((r) => r.to_location.trim().toLowerCase() === normalized);
  if (match) return { charge: Number(match.charge), rule: match };
  const fallback = rules.find((r) => r.to_location.trim().toLowerCase() === "other");
  if (fallback) return { charge: Number(fallback.charge), rule: fallback };
  return { charge: 0, rule: null };
};
