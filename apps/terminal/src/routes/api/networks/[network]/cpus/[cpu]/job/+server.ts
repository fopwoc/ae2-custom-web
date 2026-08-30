import { ae2 } from "$lib/server/config";
import {
  apiResponse,
  assertSameOrigin,
  integerParameter,
  requireSession,
} from "$lib/server/request";

import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = ({
  cookies,
  locals,
  params,
  request,
  url,
}) => {
  assertSameOrigin(request, url);
  const session = requireSession(locals.session);
  return apiResponse(cookies, () =>
    ae2.cancelCpu(
      session.token,
      integerParameter(params.network, "network"),
      params.cpu,
    ),
  );
};
