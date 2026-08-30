import { error, json, type Cookies } from "@sveltejs/kit";

import {
  Ae2ApiError,
  Ae2ContractError,
  Ae2TransportError,
  type Session,
} from "@ae2-terminal/ae2-api";

import { log } from "./logger";
import { clearSession } from "./session";

export function requireSession(session: Session | null): Session {
  if (!session) error(401, "Authentication required");
  return session;
}

export function integerParameter(
  value: string | undefined,
  name: string,
): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) error(400, `Invalid ${name}`);
  return parsed;
}

export function assertSameOrigin(request: Request, url: URL): void {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== url.origin) || fetchSite === "cross-site")
    error(403, "Cross-site request blocked");
}

export async function apiResponse<T>(
  cookies: Cookies,
  operation: () => Promise<T>,
): Promise<Response> {
  try {
    return json(await operation());
  } catch (cause) {
    if (cause instanceof Ae2TransportError) {
      if (cause.httpStatus === 401) clearSession(cookies);
      return json(
        {
          code:
            cause.httpStatus === 401
              ? "SESSION_EXPIRED"
              : "UPSTREAM_UNAVAILABLE",
          message: cause.message,
        },
        { status: cause.httpStatus },
      );
    }
    if (cause instanceof Ae2ContractError) {
      log("error", "ae2-api", cause.message, { endpoint: cause.endpoint });
      return json(
        { code: "UPSTREAM_CONTRACT", message: cause.message },
        { status: 502 },
      );
    }
    if (cause instanceof Ae2ApiError) {
      const status = apiStatus(cause.status);
      return json(
        {
          code: cause.status,
          message: humanizeStatus(cause.status),
          data: cause.data,
        },
        { status },
      );
    }
    log("error", "http", "Unhandled API error", {
      error: cause instanceof Error ? cause.message : String(cause),
    });
    return json(
      { code: "INTERNAL_ERROR", message: "Unexpected server error" },
      { status: 500 },
    );
  }
}

function apiStatus(status: string): number {
  if (status.endsWith("_NOT_FOUND") || status === "INVALID_ID") return 404;
  if (status === "NO_PERMISSIONS") return 403;
  if (
    status === "ALL_CPU_BUSY" ||
    status === "CPU_NOT_BUSY" ||
    status === "JOB_NOT_DONE"
  )
    return 409;
  if (status === "SERVER_STOPPING" || status === "TIMEOUT") return 503;
  return 400;
}

function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
