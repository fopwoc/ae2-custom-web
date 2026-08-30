import { fail, redirect } from "@sveltejs/kit";

import { Ae2TransportError } from "@ae2-terminal/ae2-api";

import { ae2 } from "$lib/server/config";
import { writeSession } from "$lib/server/session";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
  if (locals.session) redirect(303, "/");
};

export const actions = {
  default: async ({ cookies, request }) => {
    const data = await request.formData();
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const remember = data.get("remember") === "on";

    if (!username || !password) {
      return fail(400, {
        error: "Enter both username and password.",
        username,
      });
    }
    if (username.length > 128 || password.length > 1_024) {
      return fail(400, { error: "The credentials are too long.", username });
    }

    try {
      const session = await ae2.login({ username, password, remember });
      writeSession(cookies, session, remember);
    } catch (cause) {
      const message =
        cause instanceof Ae2TransportError
          ? loginError(cause.message)
          : "Login is unavailable.";
      return fail(cause instanceof Ae2TransportError ? cause.httpStatus : 502, {
        error: message,
        username,
      });
    }
    redirect(303, "/");
  },
} satisfies Actions;

function loginError(value: string): string {
  if (value === "invaliduser") return "No account exists for that username.";
  if (value === "invalidpassword") return "The password is incorrect.";
  if (value === "Too Many Requests")
    return "Too many attempts. Wait a minute and try again.";
  return value || "Login failed.";
}
