import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  User,
  LogOut,
  Menu,
  Truck,
  Users,
  Bell,
  HardHat,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";

type NavItem = { to: string; label: string; icon: typeof Package; badge?: number };

export function AppShell({ children, variant }: { children: ReactNode; variant: "customer" | "admin" }) {
  const { profile, isAdmin } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const customerNav: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/materials", label: "Materials", icon: Package },
    { to: "/cart", label: "Cart", icon: ShoppingCart, badge: cart.count },
    { to: "/orders", label: "My Orders", icon: ClipboardList },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const adminNav: NavItem[] = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/orders", label: "Orders", icon: ClipboardList },
    { to: "/admin/materials", label: "Materials", icon: Package },
    { to: "/admin/delivery", label: "Delivery Charges", icon: Truck },
    { to: "/admin/customers", label: "Customers", icon: Users },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
  ];

  const nav = variant === "admin" ? adminNav : customerNav;

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const isActive = (to: string) =>
    to === "/admin" ? pathname === "/admin" : pathname === to || pathname.startsWith(to + "/");

  const NavLinks = () => (
    <nav className="flex flex-1 flex-col gap-1">
      {nav.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.to)
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
          {item.badge ? (
            <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-semibold text-sidebar-primary-foreground">
              {item.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );

  const SidebarBody = () => (
    <div className="flex h-full flex-col gap-6 bg-sidebar p-4">
      <Link to={variant === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-2 px-1">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <HardHat className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-sidebar-foreground">BuildSupply</span>
          <span className="block truncate text-xs text-sidebar-foreground/60">
            {variant === "admin" ? "Admin Console" : "Materials Ordering"}
          </span>
        </span>
      </Link>
      <NavLinks />
      <div className="border-t border-sidebar-border pt-3">
        {isAdmin && (
          <Link
            to={variant === "admin" ? "/dashboard" : "/admin"}
            onClick={() => setOpen(false)}
            className="mb-2 block rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60"
          >
            {variant === "admin" ? "Switch to customer view" : "Switch to admin console"}
          </Link>
        )}
        <div className="px-3 pb-2">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {profile?.full_name || "Account"}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/60">{profile?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SidebarBody />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody />
            </SheetContent>
          </Sheet>
          <span className="truncate text-sm font-bold">BuildSupply</span>
          {variant === "customer" ? (
            <Link to="/cart" className="relative inline-flex p-2" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cart.count > 0 && (
                <span className="absolute -right-0 -top-0 grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {cart.count}
                </span>
              )}
            </Link>
          ) : (
            <span />
          )}
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)] items-start gap-3 sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
