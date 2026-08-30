import { ae2 } from "$lib/server/config";
import {
  apiResponse,
  assertSameOrigin,
  integerParameter,
  requireSession,
} from "$lib/server/request";

import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({
  cookies,
  locals,
  params,
  request,
  url,
}) => {
  assertSameOrigin(request, url);
  const session = requireSession(locals.session);
  const body = (await request.json()) as Record<string, unknown>;
  return apiResponse(cookies, () =>
    ae2.updateGridSettings(
      session.token,
      integerParameter(params.network, "network"),
      body.tracked === true,
    ),
  );
};
