const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function parseJsonSafely(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function apiGet(path, { signal } = {}) {
  const res = await fetch(BASE_URL + path, { method: "GET", signal });
  const json = await parseJsonSafely(res);
  if (!res.ok) {
    throw new Error(json?.message || `GET ${path} 실패 (${res.status})`);
  }
  return json;
}

export async function apiPost(path, body, { signal } = {}) {
  const res = await fetch(BASE_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const json = await parseJsonSafely(res);
  if (!res.ok) {
    throw new Error(json?.message || `POST ${path} 실패 (${res.status})`);
  }
  return json;
}
