import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/app-shell";
import { LoadingBlock, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/claim-admin")({
  head: () => ({
    meta: [
      { title: "Claim Admin Access — BuildSupply" },
      {
        name: "description",
        content:
          "One-time owner claim to become the admin of your BuildSupply materials ordering workspace.",
      },
      { property: "og:title", content: "Claim Admin Access — BuildSupply" },
      {
        property: "og:description",
        content: "One-time owner claim for the BuildSupply supplier workspace.",
      },
    ],
  }),
  component: ClaimAdminPage,
});

function ClaimAdminPage() {
  const { user, profile, isAdmin, refresh } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const existsQuery = useQuery({
    queryKey: ["admin-exists"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_exists");
      if (error) throw error;
      return Boolean(data);
    },
  });

  const claim = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("claim_admin");
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data) {
      toast.error("Admin access is already claimed by another account.");
      void existsQuery.refetch();
      return;
    }
    await refresh();
    toast.success("You are now the admin");
    void navigate({ to: "/admin" });
  };

  return (
    <AppShell variant="customer">
      <div className="mx-auto max-w-xl">
        <div className="surface-panel space-y-5 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold">Claim admin access</h1>
              <p className="text-sm text-muted-foreground">
                One-time owner claim for this workspace.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium">{profile?.full_name || "Your account"}</p>
            <p className="text-muted-foreground">{profile?.email || user?.email}</p>
          </div>

          {isAdmin ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> This account already has admin
                access.
              </p>
              <Button asChild className="w-full">
                <Link to="/admin">Go to admin dashboard</Link>
              </Button>
            </div>
          ) : existsQuery.isLoading ? (
            <LoadingBlock label="Checking workspace…" />
          ) : existsQuery.isError ? (
            <ErrorState message={(existsQuery.error as Error).message} />
          ) : existsQuery.data ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                An admin has already been assigned for this workspace, so the one-time claim is
                closed. Ask the current admin to grant you access.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No admin exists yet. Claim ownership to manage materials, orders, delivery charges
                and customers. This can only be done once.
              </p>
              <Button className="w-full" onClick={claim} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Claim admin access
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
