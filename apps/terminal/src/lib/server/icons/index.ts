import { config } from "$lib/server/config";

import { IconPackStore } from "./IconPackStore";

export const iconPack = new IconPackStore(config.iconPackDir);
