import type { Handle, ServerInit } from "@sveltejs/kit";

import { config } from "$lib/server/config";
import { iconPack } from "$lib/server/icons";
import { log } from "$lib/server/logger";
import { readSession } from "$lib/server/session";

export const init: ServerInit = async () => {
  log("info", "startup", "AE2 Terminal starting", { version: __APP_VERSION__ });
  log("info", "startup", "AE2 upstream configured", {
    upstream: config.upstreamUrl,
  });
  const icons = await iconPack.load();
  if (icons.state === "loaded") {
    log("info", "startup", "Item icon pack loaded", icons);
  } else if (icons.state === "unavailable") {
    log("warn", "startup", "Item icon pack unavailable; using fallbacks", {
      reason: icons.reason,
    });
  } else {
    log("info", "startup", "Item icon pack disabled");
  }
  log("info", "startup", "AE2 Terminal ready");
};

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.session = readSession(event.cookies);
  const response = await resolve(event);
  response.headers.set("referrer-policy", "same-origin");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  return response;
};
