import { error } from "@sveltejs/kit";

import { iconPack } from "$lib/server/icons";
import { requireSession } from "$lib/server/request";

import type { RequestHandler } from "./$types";

const sha256 = /^[0-9a-f]{64}$/;

export const GET: RequestHandler = async ({ locals, params }) => {
  requireSession(locals.session);
  const hash = params.hash;
  if (!sha256.test(hash)) error(404, "Icon not found");
  const icon = await iconPack.readIcon(hash);
  if (!icon) error(404, "Icon not found");

  return new Response(Uint8Array.from(icon).buffer, {
    headers: {
      "cache-control": "private, max-age=31536000, immutable",
      "content-type": "image/png",
    },
  });
};
