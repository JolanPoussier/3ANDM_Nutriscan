import type { OFFProduct } from "../types/off";

export function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const value = url.trim();
  if (!value) return undefined;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http://")) return `https://${value.slice("http://".length)}`;
  return value;
}

export function resolveProductImageUrl(product?: OFFProduct | null): string | undefined {
  if (!product) return undefined;
  return normalizeImageUrl(
    product.image_url ||
    product.image_front_url ||
    product.image_front_small_url ||
    product.image_small_url ||
    undefined,
  );
}
