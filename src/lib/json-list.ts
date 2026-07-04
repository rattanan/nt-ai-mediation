import type { Json } from "@/types/database";

export function jsonList(value: Json | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}
