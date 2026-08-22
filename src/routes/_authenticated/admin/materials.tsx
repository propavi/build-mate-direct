import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, materialsQuery, type Material } from "@/lib/queries";
import { MaterialImage } from "@/components/material-image";
import {
  removeMaterialImage,
  uploadMaterialImage,
  useMaterialImageUrls,
  validateImageFile,
} from "@/lib/material-images";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/materials")({
  head: () => ({
    meta: [
      { title: "Materials — BuildSupply Admin" },
      { name: "description", content: "Add, edit and manage construction material listings." },
      { property: "og:title", content: "Materials — BuildSupply Admin" },
      {
        property: "og:description",
        content: "Add, edit and manage construction material listings.",
      },
    ],
  }),
  component: AdminMaterials,
});

const blank = {
  name: "",
  category_id: "",
  brand: "",
  type: "",
  quality: "",
  unit: "",
  price: "",
};

function AdminMaterials() {
  const queryClient = useQueryClient();
  const categories = useQuery(categoriesQuery());
  const materials = useQuery(materialsQuery({ includeInactive: true }));
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const imageUrls = useMaterialImageUrls((materials.data ?? []).map((m) => m.image_path));
  const editingImageUrl =
    editing?.image_path ? imageUrls.data?.[editing.image_path] : undefined;

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
  };

  const pickImage = (file: File | null) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["materials"] });
    void queryClient.invalidateQueries({ queryKey: ["material-image-urls"] });
  };
  const set = (k: keyof typeof blank, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const startEdit = (m: Material) => {
    setEditing(m);
    resetImageState();
    setForm({
      name: m.name,
      category_id: m.category_id,
      brand: m.brand ?? "",
      type: m.type ?? "",
      quality: m.quality ?? "",
      unit: m.unit,
      price: String(Number(m.price)),
    });
  };

  const submit = async () => {
    if (!form.name.trim() || !form.category_id || !form.unit.trim() || !form.price) {
      toast.error("Name, category, unit and price are required");
      return;
    }
    setSaving(true);
    const payload = { ...form, price: Number(form.price) };
    try {
      let materialId = editing?.id ?? "";
      if (editing) {
        const { error } = await supabase.from("materials").update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase
          .from("materials")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        materialId = data.id;
      }

      const oldPath = editing?.image_path ?? null;
      if (imageFile) {
        const path = await uploadMaterialImage(imageFile, materialId);
        const { error } = await supabase
          .from("materials")
          .update({ image_path: path })
          .eq("id", materialId);
        if (error) throw new Error(error.message);
        if (oldPath) await removeMaterialImage(oldPath);
      } else if (removeImage && oldPath) {
        const { error } = await supabase
          .from("materials")
          .update({ image_path: null })
          .eq("id", materialId);
        if (error) throw new Error(error.message);
        await removeMaterialImage(oldPath);
      }

      toast.success(editing ? "Material updated" : "Material added");
      setEditing(null);
      setForm(blank);
      resetImageState();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (m: Material, field: "available" | "active") => {
    const patch =
      field === "available" ? { available: !m.available } : { active: !m.active };
    const { error } = await supabase.from("materials").update(patch).eq("id", m.id);

    if (error) toast.error(error.message);
    else refresh();
  };

  return (
    <AppShell variant="admin">
      <PageHeader title="Materials" description="Manage your catalogue, pricing and stock status." />

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="surface-panel h-fit p-5">
          <h2 className="text-base font-semibold">
            {editing ? `Edit ${editing.name}` : "Add material"}
          </h2>
          <div className="mt-4 space-y-3">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Category">
              <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Brand">
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </Field>
            <Field label="Type">
              <Input value={form.type} onChange={(e) => set("type", e.target.value)} />
            </Field>
            <Field label="Grade / Quality">
              <Input value={form.quality} onChange={(e) => set("quality", e.target.value)} />
            </Field>
            <Field label="Unit (bag, load, kg…)">
              <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} />
            </Field>
            <Field label="Price per unit (₹)">
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </Field>
            <div className="space-y-2">
              <Label>Material image</Label>
              <MaterialImage
                url={imagePreview ?? (removeImage ? null : editingImageUrl)}
                alt={editing ? editing.name : "Material image preview"}
                className="aspect-[4/3] w-full"
              />
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <label className="cursor-pointer">
                    {imagePreview || (editing?.image_path && !removeImage)
                      ? "Replace image"
                      : "Upload image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        pickImage(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </Button>
                {(imagePreview || (editing?.image_path && !removeImage)) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      if (editing?.image_path) setRemoveImage(true);
                    }}
                  >
                    Delete image
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP · max 5 MB. Changes apply when you save.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={submit} disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {editing ? "Save changes" : "Add material"}
              </Button>
              {editing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setForm(blank);
                    resetImageState();
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </section>

        {materials.isLoading ? (
          <LoadingBlock />
        ) : materials.isError ? (
          <ErrorState message={(materials.error as Error)?.message} />
        ) : (
          <section className="surface-panel overflow-hidden">
            <ul className="divide-y divide-border">
              {(materials.data ?? []).map((m) => (
                <li key={m.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="flex min-w-0 gap-3">
                    <MaterialImage
                      url={m.image_path ? imageUrls.data?.[m.image_path] : null}
                      alt={m.name}
                      className="h-16 w-20 shrink-0"
                    />
                    <div className="min-w-0">
                    <p className="truncate font-semibold">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[m.brand, m.type, m.quality].filter(Boolean).join(" · ")} —{" "}
                      {inr(Number(m.price))} / {m.unit}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.available ? "In stock" : "Out of stock"} ·{" "}
                      {m.active ? "Listed" : "Hidden"}
                    </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(m)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggle(m, "available")}>
                      {m.available ? "Mark out of stock" : "Mark in stock"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle(m, "active")}>
                      {m.active ? "Hide" : "Show"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
