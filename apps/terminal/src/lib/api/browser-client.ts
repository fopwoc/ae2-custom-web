export class BrowserApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "BrowserApiError";
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401) {
    window.location.assign("/login?expired");
    throw new BrowserApiError(401, "SESSION_EXPIRED", "Session expired");
  }

  const body = (await response.json().catch(() => null)) as
    { code?: string; message?: string } | T | null;
  if (!response.ok) {
    const errorBody = body as { code?: string; message?: string } | null;
    throw new BrowserApiError(
      response.status,
      errorBody?.code ?? "REQUEST_FAILED",
      errorBody?.message ?? response.statusText,
    );
  }
  return body as T;
}

export function jsonRequest(
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): RequestInit {
  return {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}
