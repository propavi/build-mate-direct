import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Cart — BuildSupply" },
      { name: "description", content: "Review the materials in your construction order." },
      { property: "og:title", content: "Cart — BuildSupply" },
      { property: "og:description", content: "Review the materials in your construction order." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <AppShell variant="customer">
        <PageHeader title="Cart" />
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="Your cart is empty"
          description="Add cement, bricks, sand or steel to start an order."
          action={
            <Button asChild>
              <Link to="/materials">Browse materials</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell variant="customer">
      <PageHeader title="Cart" description={`${cart.items.length} material(s) in this order`} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="surface-panel overflow-hidden">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1.2fr_1fr_1fr_auto] gap-3 border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
            <span>Material</span>
            <span>Brand</span>
            <span>Quality</span>
            <span>Quantity</span>
            <span className="text-right">Unit Price</span>
            <span className="text-right">Total</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {cart.items.map((item) => (
              <li
                key={item.materialId}
                className="grid gap-3 px-4 py-4 lg:grid-cols-[2fr_1fr_1fr_1.2fr_1fr_1fr_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground lg:hidden">
                    {item.brand} · {item.quality}
                  </p>
                </div>
                <p className="hidden truncate text-sm lg:block">{item.brand || "—"}</p>
                <p className="hidden truncate text-sm lg:block">{item.quality || "—"}</p>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    aria-label="Decrease quantity"
                    onClick={() => cart.setQuantity(item.materialId, item.quantity - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => cart.setQuantity(item.materialId, Number(e.target.value))}
                    className="h-8 w-16 rounded-md border border-input bg-background px-2 text-center text-sm"
                    aria-label={`Quantity of ${item.name}`}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    aria-label="Increase quantity"
                    onClick={() => cart.setQuantity(item.materialId, item.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {item.unit.trim().toLowerCase()}
                  </span>
                </div>
                <p className="text-sm lg:text-right">{inr(item.unitPrice)}</p>
                <p className="font-semibold lg:text-right">
                  {inr(item.unitPrice * item.quantity)}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => cart.remove(item.materialId)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="surface-panel h-fit p-5">
          <h2 className="text-base font-semibold">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{inr(cart.subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Delivery charge is calculated at checkout based on your site location.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/checkout">Proceed to Checkout</Link>
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link to="/materials">Continue Shopping</Link>
          </Button>
          <Button variant="ghost" className="mt-2 w-full" onClick={cart.clear}>
            Clear cart
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}
