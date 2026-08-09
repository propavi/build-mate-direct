import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — BuildSupply" },
      { name: "description", content: "Manage your contact details for site deliveries." },
      { property: "og:title", content: "Profile — BuildSupply" },
      { property: "og:description", content: "Manage your contact details for site deliveries." },
    ],
  }),
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
});

function ProfilePage() {
  const { profile, user, isAdmin, refresh } = useAuth();
  const [values, setValues] = useState({ full_name: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setValues({ full_name: profile.full_name, phone: profile.phone });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user!.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Profile updated");
  };

  return (
    <AppShell variant="customer">
      <PageHeader title="Profile" description="These details are pre-filled at checkout." />
      <form onSubmit={save} className="surface-panel max-w-xl space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={values.full_name}
            onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))}
          />
          {errors["full_name"] && (
            <p className="text-xs text-destructive">{errors["full_name"]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
          />
          {errors["phone"] && <p className="text-xs text-destructive">{errors["phone"]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile?.email ?? ""} disabled />
          <p className="text-xs text-muted-foreground">Email is linked to your login.</p>
        </div>
        <div className="space-y-2">
          <Label>Account type</Label>
          <p className="text-sm font-medium">{isAdmin ? "Admin / Supplier" : "Customer"}</p>
        </div>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
        </Button>
      </form>
    </AppShell>
  );
}
