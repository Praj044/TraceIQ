
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const CSRF_COOKIE_NAME = "traceiq_csrf";

function getCsrfToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${CSRF_COOKIE_NAME}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.substring(CSRF_COOKIE_NAME.length + 1));
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(method);

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let body: BodyInit | undefined;

  if (options.body !== undefined) {
    if (
      typeof options.body === "string" ||
      options.body instanceof FormData ||
      options.body instanceof URLSearchParams ||
      options.body instanceof Blob
    ) {
      body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  if (isMutation) {
    const csrfToken = getCsrfToken();

    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    body,
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `API request failed (${response.status}): ${
        message || response.statusText
      }`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function apiPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body });
}

export function apiPatch<T>(
  path: string,
  body: unknown,
): Promise<T> {
  return apiRequest<T>(path, { method: "PATCH", body });
}

export function apiDelete<T = void>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}
