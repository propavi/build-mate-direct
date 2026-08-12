import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LoadingBlock, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingBlock label="Checking access…" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell variant="customer">
        <EmptyState
          icon={<ShieldAlert className="h-8 w-8" />}
          title="Admin access required"
          description="This area is for the supplier team. If this workspace has no admin yet, you can claim owner access."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/claim-admin">Claim admin access</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          }
        />
      </AppShell>
    );
  }

  return <Outlet />;
}
