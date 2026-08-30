import { ae2 } from "$lib/server/config";
import {
  apiResponse,
  integerParameter,
  requireSession,
} from "$lib/server/request";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ cookies, locals, params }) => {
  const session = requireSession(locals.session);
  return apiResponse(cookies, () =>
    ae2.getActivityDetail(
      session.token,
      integerParameter(params.network, "network"),
      integerParameter(params.activity, "activity"),
    ),
  );
};
