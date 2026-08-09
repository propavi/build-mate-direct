import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { deliveryRulesQuery } from "@/lib/queries";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery Charges — BuildSupply Admin" },
      { name: "description", content: "Set manual delivery charges per destination location." },
      { property: "og:title", content: "Delivery Charges — BuildSupply Admin" },
      {
        property: "og:description",
        content: "Set manual delivery charges per destination location.",
      },
    ],
  }),
  component: AdminDelivery,
});

function AdminDelivery() {
  const queryClient = useQueryClient();
  const rules = useQuery(deliveryRulesQuery());
  const [from, setFrom] = useState("Palakkad");
  const [to, setTo] = useState("");
  const [charge, setCharge] = useState("");

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["delivery_rules"] });

  const add = async () => {
    if (!from.trim() || !to.trim() || charge === "") {
      toast.error("Fill all fields");
      return;
    }
    const { error } = await supabase
      .from("delivery_rules")
      .insert({ from_location: from.trim(), to_location: to.trim(), charge: Number(charge) });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTo("");
    setCharge("");
    refresh();
    toast.success("Rule added");
  };

  const update = async (id: string, value: number) => {
    const { error } = await supabase.from("delivery_rules").update({ charge: value }).eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("delivery_rules").delete().eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  };

  return (
    <AppShell variant="admin">
      <PageHeader
        title="Delivery Charges"
        description="Charges are matched to the customer's city at checkout. The 'Other' rule is the fallback."
      />

      <section className="surface-panel mb-6 grid gap-3 p-5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label>From (depot)</Label>
          <Input value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>To (city / area)</Label>
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. Ottapalam" />
        </div>
        <div className="space-y-1.5">
          <Label>Charge (₹)</Label>
          <Input
            type="number"
            min={0}
            value={charge}
            onChange={(e) => setCharge(e.target.value)}
          />
        </div>
        <Button onClick={add}>
          <Plus className="mr-2 h-4 w-4" /> Add rule
        </Button>
      </section>

      {rules.isLoading ? (
        <LoadingBlock />
      ) : rules.isError ? (
        <ErrorState message={(rules.error as Error)?.message} />
      ) : (
        <div className="surface-panel overflow-hidden">
          <ul className="divide-y divide-border">
            {(rules.data ?? []).map((r) => (
              <li
                key={r.id}
                className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {r.from_location} → {r.to_location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current: {inr(Number(r.charge))}
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  defaultValue={Number(r.charge)}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v !== Number(r.charge)) update(r.id, v);
                  }}
                />
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
