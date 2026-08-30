import { ae2 } from "$lib/server/config";
import {
  apiResponse,
  assertSameOrigin,
  integerParameter,
  requireSession,
} from "$lib/server/request";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ cookies, locals, params }) => {
  const session = requireSession(locals.session);
  return apiResponse(cookies, () =>
    ae2.getCraftPlan(
      session.token,
      integerParameter(params.network, "network"),
      integerParameter(params.plan, "plan"),
    ),
  );
};

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
    ae2.cancelCraftPlan(
      session.token,
      integerParameter(params.network, "network"),
      integerParameter(params.plan, "plan"),
    ),
  );
};
