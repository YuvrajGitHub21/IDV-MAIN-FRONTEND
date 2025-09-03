// Lightweight auth + HTTP helper with in-memory access token and auto-refresh

export const API_BASE = "http://localhost:5294/api"; // via Vite proxy in dev

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token ?? null;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

// POST /api/Auth/login: expects { data: { accessToken, user? }, ... }
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // ensure refresh cookie is set cross-site
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `Login failed: ${res.status} ${res.statusText}${errText ? ` — ${errText.slice(
        0,
        200,
      )}` : ""}`,
    );
  }

  const json = await res.json().catch(() => ({}));
  const token = json?.data?.accessToken ?? json?.accessToken ?? null;
  if (!token) {
    throw new Error("Login succeeded but no access token was returned.");
  }
  setAccessToken(token);
  return json;
}

// POST /api/Auth/refresh: expects { data: { accessToken }, ... }
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/Auth/refresh`, {
      method: "POST",
      credentials: "include", // send secure HttpOnly cookie
    });

    if (!res.ok) return null;

    const json = await res.json().catch(() => ({}));
    const token = json?.data?.accessToken ?? json?.accessToken ?? null;
    if (!token) return null;

    setAccessToken(token);
    return token;
  } catch (_e) {
    return null;
  }
}

// Optional: log out to clear refresh cookie server-side if supported
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/Auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (_e) {
    // ignore network errors during logout
  } finally {
    clearAccessToken();
  }
}

// fetch wrapper that adds Authorization and retries once after refresh
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(input, {
    ...init,
    headers,
    credentials: "include", // allow cookie-based flows if needed
  });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(init.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(input, {
        ...init,
        headers: retryHeaders,
        credentials: "include",
      });
    }
  }

  return response;
}
