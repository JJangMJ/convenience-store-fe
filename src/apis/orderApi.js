export async function createOrder(orderRequest) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderRequest),
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const msg = json?.message || `주문 요청 실패 (${response.status})`;
    throw new Error(msg);
  }

  if (json?.code && !String(json.code).startsWith("SUCCESS")) {
    throw new Error(json?.message || "주문 처리에 실패했습니다.");
  }

  return json;
}