import { json } from "@sveltejs/kit";

import { ae2 } from "$lib/server/config";
import {
  apiResponse,
  assertSameOrigin,
  requireSession,
} from "$lib/server/request";
import { clearSession, writeSession } from "$lib/server/session";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies, request, url }) => {
  assertSameOrigin(request, url);
  return apiResponse(cookies, async () => {
    const body = (await request.json()) as Record<string, unknown>;
    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const remember = body.remember === true;
    if (!username || !password)
      throw new TypeError("Username and password are required");
    const session = await ae2.login({ username, password, remember });
    writeSession(cookies, session, remember);
    return {
      username: session.username,
      isAdmin: session.isAdmin,
      isOutdated: session.isOutdated,
    };
  });
};

export const DELETE: RequestHandler = async ({
  cookies,
  locals,
  request,
  url,
}) => {
  assertSameOrigin(request, url);
  const session = requireSession(locals.session);
  const response = await apiResponse(cookies, async () => {
    await ae2.revoke(session.token);
    return null;
  });
  clearSession(cookies);
  return response;
};
