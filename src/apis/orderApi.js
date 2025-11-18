import { apiPost } from "./apiClient";

export async function previewOrder(previewRequest, signal) {
  const json = await apiPost("/api/orders/preview", previewRequest, { signal });
  if (json?.code && !String(json.code).startsWith("SUCCESS")) {
    throw new Error(json?.message || "주문 미리보기 실패");
  }
  return json.result;
}

export async function createOrder(orderRequest, signal) {
  const json = await apiPost("/api/orders", orderRequest, { signal });
  if (json?.code && !String(json.code).startsWith("SUCCESS")) {
    throw new Error(json?.message || "주문 처리에 실패했습니다.");
  }
  return json;
}
