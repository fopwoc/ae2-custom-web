import { error } from "@sveltejs/kit";

import { ae2 } from "$lib/server/config";
import {
  apiResponse,
  assertSameOrigin,
  integerParameter,
  requireSession,
} from "$lib/server/request";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({
  cookies,
  locals,
  params,
  request,
  url,
}) => {
  assertSameOrigin(request, url);
  const session = requireSession(locals.session);
  const body = (await request.json()) as Record<string, unknown>;
  const item = Number(body.item);
  const quantity = Number(body.quantity);
  if (!Number.isSafeInteger(item)) error(400, "Invalid item");
  if (!Number.isSafeInteger(quantity) || quantity <= 0)
    error(400, "Quantity must be a positive whole number");
  return apiResponse(cookies, () =>
    ae2.createCraftPlan(
      session.token,
      integerParameter(params.network, "network"),
      item,
      quantity,
    ),
  );
};
