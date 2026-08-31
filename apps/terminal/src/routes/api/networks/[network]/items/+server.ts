import { ae2 } from "$lib/server/config";
import { iconPack } from "$lib/server/icons";
import { inventoryResourceKind } from "$lib/api/resource-kind";
import {
  apiResponse,
  integerParameter,
  requireSession,
} from "$lib/server/request";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ cookies, locals, params }) => {
  const session = requireSession(locals.session);
  return apiResponse(cookies, async () => {
    const items = await ae2.getItems(
      session.token,
      integerParameter(params.network, "network"),
    );
    return items.map((item) => {
      const iconUrl =
        inventoryResourceKind(item) === "fluid"
          ? iconPack.resolveFluidIconUrl(item.itemid, item.itemname)
          : iconPack.resolveIconUrl(item.itemid, item.itemname);
      return iconUrl ? { ...item, iconUrl } : item;
    });
  });
};
