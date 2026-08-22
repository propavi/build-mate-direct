import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Package, ShoppingCart, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { categoriesQuery, materialsQuery, type Material } from "@/lib/queries";
import { MaterialImage } from "@/components/material-image";
import { useMaterialImageUrls } from "@/lib/material-images";
import { useCart } from "@/lib/cart-context";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/materials")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Materials — BuildSupply" },
      {
        name: "description",
        content: "Browse cement, bricks, sand, steel and other construction materials with prices.",
      },
      { property: "og:title", content: "Materials — BuildSupply" },
      {
        property: "og:description",
        content: "Browse cement, bricks, sand, steel and other construction materials with prices.",
      },
    ],
  }),
  component: MaterialsPage,
});

function MaterialsPage() {
  const { category, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const categories = useQuery(categoriesQuery());
  const materials = useQuery(materialsQuery());
  const [term, setTerm] = useState(q ?? "");
  const imageUrls = useMaterialImageUrls((materials.data ?? []).map((m) => m.image_path));

  const list = useMemo(() => {
    const cat = (categories.data ?? []).find((c) => c.slug === category);
    const search = (q ?? "").toLowerCase();
    return (materials.data ?? []).filter((m) => {
      if (cat && m.category_id !== cat.id) return false;
      if (!search) return true;
      return [m.name, m.brand, m.type, m.quality].join(" ").toLowerCase().includes(search);
    });
  }, [materials.data, categories.data, category, q]);

  const applySearch = (value: string) =>
    navigate({ search: { category, q: value.trim() || undefined } });

  return (
    <AppShell variant="customer">
      <PageHeader
        title="Materials"
        description="Select material, brand and grade, then add the quantity you need."
        action={
          <Button asChild variant="outline">
            <Link to="/cart">
              <ShoppingCart className="mr-1 h-4 w-4" /> Go to cart
            </Link>
          </Button>
        }
      />

      <form
        className="surface-panel mb-4 flex items-center gap-2 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch(term);
        }}
      >
        <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by material, brand or grade"
          className="border-0 shadow-none focus-visible:ring-0"
        />
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip
          active={!category}
          onClick={() => navigate({ search: { category: undefined, q } })}
          label="All"
        />
        {(categories.data ?? []).map((c) => (
          <FilterChip
            key={c.id}
            active={category === c.slug}
            onClick={() => navigate({ search: { category: c.slug, q } })}
            label={c.name}
          />
        ))}
      </div>

      {materials.isLoading ? (
        <LoadingBlock label="Loading materials…" />
      ) : materials.isError ? (
        <ErrorState message={(materials.error as Error)?.message} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No materials found"
          description="Try a different category or search term."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              imageUrl={m.image_path ? imageUrls.data?.[m.image_path] : undefined}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40",
      )}
    >
      {label}
    </button>
  );
}

function MaterialCard({ material, imageUrl }: { material: Material; imageUrl?: string | undefined }) {
  const cart = useCart();
  const [quantity, setQuantity] = useState("1");

  const add = () => {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    cart.add({
      materialId: material.id,
      name: material.name,
      brand: material.brand,
      quality: material.quality,
      unit: material.unit,
      unitPrice: Number(material.price),
      quantity: qty,
    });
    toast.success(`${material.name} added to cart`);
  };

  return (
    <article className="surface-panel flex flex-col p-4 sm:p-5">
      <MaterialImage
        url={imageUrl}
        alt={material.name}
        className="mb-4 aspect-[4/3] w-full"
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <h3 className="truncate text-base font-semibold">{material.name}</h3>
        <Badge variant={material.available ? "secondary" : "outline"}>
          {material.available ? "In stock" : "Unavailable"}
        </Badge>
      </div>
      <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
        <div className="flex justify-between gap-3">
          <dt>Brand</dt>
          <dd className="truncate font-medium text-foreground">{material.brand || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Type</dt>
          <dd className="truncate font-medium text-foreground">{material.type || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Quality / Grade</dt>
          <dd className="truncate font-medium text-foreground">{material.quality || "—"}</dd>
        </div>
      </dl>
      <p className="mt-4 text-2xl font-bold">
        {inr(Number(material.price))}
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          / {material.unit.trim().toLowerCase()}
        </span>
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-24"
          aria-label={`Quantity for ${material.name}`}
          disabled={!material.available}
        />
        <Button className="flex-1" onClick={add} disabled={!material.available}>
          Add to Cart
        </Button>
      </div>
    </article>
  );
}
