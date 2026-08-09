import { createFileRoute, Link } from "@tanstack/react-router";
import { HardHat, Truck, ClipboardCheck, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BuildSupply — Order Construction Materials Online" },
      {
        name: "description",
        content:
          "Cement, bricks, sand and steel delivered to your construction site. Compare brands, see delivery charges upfront and track every order.",
      },
      { property: "og:title", content: "BuildSupply — Order Construction Materials Online" },
      {
        property: "og:description",
        content:
          "Cement, bricks, sand and steel delivered to your site. Transparent pricing and live order tracking.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <HardHat className="h-5 w-5" />
            </span>
            <span className="truncate text-lg font-bold">BuildSupply</span>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-foreground">
            For engineers, builders &amp; contractors
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Construction materials, ordered in minutes.
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Stop chasing suppliers over phone calls. Browse cement, bricks, sand and steel with real
            brands and grades, add them to a cart, and get everything delivered to your site with a
            clear delivery charge.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Create an account <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth" search={{ mode: "login" }}>
                I already have an account
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ClipboardCheck,
              title: "One clear order",
              text: "Material, brand, grade and quantity captured properly — no more misunderstandings.",
            },
            {
              icon: Truck,
              title: "Upfront delivery charge",
              text: "Delivery cost for your site location is shown before you place the order.",
            },
            {
              icon: ShieldCheck,
              title: "Live status tracking",
              text: "From Order Placed to Delivered, follow every stage from your dashboard.",
            },
          ].map((f) => (
            <div key={f.title} className="surface-panel p-5">
              <f.icon className="h-5 w-5 text-accent" />
              <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} BuildSupply — construction materials supply &amp; delivery.
        </p>
      </footer>
    </div>
  );
}
