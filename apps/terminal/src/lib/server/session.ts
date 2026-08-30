import { dev } from "$app/environment";
import type { Cookies } from "@sveltejs/kit";

import { sessionSchema, type Session } from "@ae2-terminal/ae2-api";

const cookieName = "ae2_session";

export function readSession(cookies: Cookies): Session | null {
  const value = cookies.get(cookieName);
  if (!value) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );
    const result = sessionSchema.safeParse(decoded);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function writeSession(
  cookies: Cookies,
  session: Session,
  remember: boolean,
): void {
  cookies.set(
    cookieName,
    Buffer.from(JSON.stringify(session)).toString("base64url"),
    {
      httpOnly: true,
      maxAge: remember ? 604_800 : 3_600,
      path: "/",
      sameSite: "strict",
      secure: secureCookies(),
    },
  );
}

function secureCookies(): boolean {
  const configured = process.env.COOKIE_SECURE?.toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;
  return !dev;
}

export function clearSession(cookies: Cookies): void {
  cookies.delete(cookieName, { path: "/" });
}
