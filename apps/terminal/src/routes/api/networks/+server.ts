import { ae2 } from "$lib/server/config";
import { apiResponse, requireSession } from "$lib/server/request";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ cookies, locals }) => {
  const session = requireSession(locals.session);
  return apiResponse(cookies, () => ae2.getNetworks(session.token));
};
