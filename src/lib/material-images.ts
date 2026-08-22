import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MATERIAL_IMAGE_BUCKET = "material-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const validateImageFile = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase()))
    return "Unsupported file type. Use JPG, PNG or WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "Image is too large. Maximum size is 5 MB.";
  return null;
};

/**
 * Signed URLs for private material images.
 * Customers can read (RLS allows authenticated SELECT); only admins can write.
 */
export const useMaterialImageUrls = (paths: (string | null | undefined)[]) => {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p))).sort();
  return useQuery({
    queryKey: ["material-image-urls", unique],
    enabled: unique.length > 0,
    staleTime: 45 * 60 * 1000,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.storage
        .from(MATERIAL_IMAGE_BUCKET)
        .createSignedUrls(unique, 60 * 60);
      if (error) throw new Error(error.message);
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
      }
      return map;
    },
  });
};

export const uploadMaterialImage = async (file: File, materialId: string) => {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${materialId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(MATERIAL_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
};

export const removeMaterialImage = async (path: string) => {
  await supabase.storage.from(MATERIAL_IMAGE_BUCKET).remove([path]);
};
