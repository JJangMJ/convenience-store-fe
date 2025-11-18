import { apiGet } from "./apiClient";

export async function getProducts(signal) {
  const json = await apiGet("/api/products", { signal });
  return Array.isArray(json?.result) ? json.result : json?.result?.data ?? [];
}
