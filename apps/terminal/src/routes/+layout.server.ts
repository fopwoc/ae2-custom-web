import type { LayoutServerLoad } from "./$types";

import { config } from "$lib/server/config";

export const load: LayoutServerLoad = ({ locals }) => ({
  publicMode: config.publicMode,
  session: locals.session
    ? {
        username: locals.session.username,
        isAdmin: locals.session.isAdmin,
        isOutdated: locals.session.isOutdated,
      }
    : null,
  version: __APP_VERSION__,
});
