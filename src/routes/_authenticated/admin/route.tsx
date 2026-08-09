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
          description="This area is for the supplier team. Contact the business owner if you need access."
          action={
            <Button asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return <Outlet />;
}
