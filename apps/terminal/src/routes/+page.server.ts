import { redirect } from "@sveltejs/kit";

import { Ae2TransportError } from "@ae2-terminal/ae2-api";

import { ae2 } from "$lib/server/config";
import { clearSession } from "$lib/server/session";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ cookies, depends, locals }) => {
  depends("app:networks");
  if (!locals.session) redirect(303, "/login");

  try {
    const networks = await ae2.getNetworks(locals.session.token);
    return { networks, upstreamError: null };
  } catch (cause) {
    if (cause instanceof Ae2TransportError && cause.httpStatus === 401) {
      clearSession(cookies);
      redirect(303, "/login?expired");
    }
    return {
      networks: [],
      upstreamError:
        cause instanceof Error
          ? cause.message
          : "AE2 Web Integration is unavailable",
    };
  }
};
