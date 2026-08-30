import { fail, redirect } from "@sveltejs/kit";

import { Ae2TransportError } from "@ae2-terminal/ae2-api";

import { ae2, config } from "$lib/server/config";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
  if (!config.publicMode) redirect(303, "/login");
  if (locals.session) redirect(303, "/");
};

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const passwordConfirmation = String(data.get("passwordConfirmation") ?? "");

    if (!username || !password)
      return fail(400, { error: "Enter a username and password.", username });
    if (password !== passwordConfirmation) {
      return fail(400, { error: "The passwords do not match.", username });
    }
    if (username.length > 128 || password.length > 1_024) {
      return fail(400, {
        error: "The account details are too long.",
        username,
      });
    }

    try {
      return { confirmationToken: await ae2.register({ username, password }) };
    } catch (cause) {
      const message =
        cause instanceof Ae2TransportError
          ? registrationError(cause.message)
          : "Registration is unavailable.";
      return fail(cause instanceof Ae2TransportError ? cause.httpStatus : 502, {
        error: message,
        username,
      });
    }
  },
} satisfies Actions;

function registrationError(value: string): string {
  if (value === "notonline")
    return "Join the Minecraft server before registering.";
  if (value === "invalidpassword") return "The server rejected that password.";
  if (value === "Too Many Requests")
    return "Too many attempts. Wait a minute and try again.";
  return value || "Registration failed.";
}
