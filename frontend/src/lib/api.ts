// Thin client-side fetch wrapper that prepends NEXT_PUBLIC_API_URL and always
// includes credentials so the cross-origin auth cookie set by the backend
// (jewelflow_token) is sent on every request.
//
// Usage:
//   const data = await api("/api/dashboard/summary");                // GET
//   await api("/api/issues", { method: "POST", body: { ... } });      // POST
//   await api(`/api/materials/${id}`, { method: "DELETE" });          // DELETE

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:4000";

export type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch(
  path: string,
  options: ApiOptions = {},
): Promise<Response> {
  const { body, headers, ...rest } = options;

  const init: RequestInit = {
    credentials: "include",
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  };

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  return fetch(url, init);
}

// Convenience: parse JSON, throw if response is not ok.
export async function api<T = any>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j?.message ?? msg;
    } catch {
      // ignore
    }
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
