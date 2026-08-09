import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { OrderItem } from "@/lib/queries";

export { allOrdersQuery, customersQuery, orderDetailQuery, deliveryRulesQuery } from "@/lib/queries";

export const orderItemsAllQuery = () =>
  queryOptions({
    queryKey: ["order_items", "all"],
    queryFn: async (): Promise<OrderItem[]> => {
      const { data, error } = await supabase.from("order_items").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []) as OrderItem[];
    },
  });
