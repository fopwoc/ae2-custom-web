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
  const cpu = typeof body.cpu === "string" && body.cpu ? body.cpu : undefined;
  return apiResponse(cookies, () =>
    ae2.submitCraftPlan(
      session.token,
      integerParameter(params.network, "network"),
      integerParameter(params.plan, "plan"),
      cpu,
    ),
  );
};
