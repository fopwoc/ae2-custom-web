import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const port = Number(process.env.MOCK_PORT ?? 4324);

createIconPack();

const items = [
  {
    hashcode: 101,
    itemid: "appliedenergistics2:item.ItemMultiMaterial:7",
    itemname: "Fluix Crystal",
    quantity: 12480,
    craftable: true,
  },
  {
    hashcode: 102,
    itemid: "minecraft:iron_ingot:0",
    itemname: "Iron Ingot",
    quantity: 8192,
    craftable: true,
  },
  {
    hashcode: 103,
    itemid: "gregtech:gt.metaitem.01:17305",
    itemname: "Stainless Steel Plate",
    quantity: 348,
    craftable: false,
  },
  {
    hashcode: 104,
    itemid: "appliedenergistics2:item.ItemMultiMaterial:23",
    itemname: "Calculation Processor",
    quantity: 0,
    craftable: true,
  },
  {
    hashcode: 105,
    itemid: "ammonium nitrate solution",
    itemname: "Ammonium Nitrate Solution",
    quantity: 4_000_000,
    craftable: false,
  },
];

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  response.setHeader("content-type", "application/json");

  if (url.pathname === "/auth") {
    response.end(
      JSON.stringify({
        token: "test-token",
        username: "DemoPlayer",
        isAdmin: false,
        isOutdated: false,
      }),
    );
    return;
  }

  const data = responseFor(url.pathname, url.searchParams);
  response.end(JSON.stringify({ status: "OK", data }));
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(
    `Mock AE2 upstream listening on http://127.0.0.1:${port}\n`,
  );
});

function responseFor(pathname, search) {
  if (pathname === "/grids") {
    return [
      {
        key: 7,
        cpuCount: 2,
        owner: "DemoPlayer",
        isOwned: true,
        isTrackingEnabled: true,
      },
    ];
  }
  if (pathname === "/items") return items;
  if (pathname === "/list") {
    return {
      "CPU · Molecular": {
        isBusy: true,
        finalOutput: {
          itemid: items[0].itemid,
          itemname: items[0].itemname,
          quantity: 64,
        },
        availableStorage: 131072,
        usedStorage: 32768,
        coProcessors: 4,
        hasTrackingInfo: true,
        timeStarted: Date.now() - 84000,
      },
      "CPU · General": {
        isBusy: false,
        finalOutput: null,
        availableStorage: 65536,
        usedStorage: 0,
        coProcessors: 2,
        hasTrackingInfo: false,
        timeStarted: 0,
      },
    };
  }
  if (pathname === "/get") {
    return {
      size: 163840,
      isBusy: true,
      finalOutput: {
        itemid: items[0].itemid,
        itemname: items[0].itemname,
        quantity: 64,
      },
      items: [
        {
          itemid: items[1].itemid,
          itemname: items[1].itemname,
          active: 8,
          pending: 24,
          stored: 128,
          timeSpentCrafting: 42000,
          craftedTotal: 32,
          shareInCraftingTime: 0.5,
          shareInCraftingTimeCombined: 0.5,
          craftsPerSec: 1.2,
        },
      ],
      hasTrackingInfo: true,
      timeStarted: Date.now() - 84000,
      timeElapsed: 84000,
    };
  }
  if (pathname === "/trackinghistory") {
    return [
      {
        timeStarted: Date.now() - 300000,
        timeDone: Date.now() - 180000,
        wasCancelled: false,
        finalOutput: {
          itemid: items[1].itemid,
          itemname: items[1].itemname,
          quantity: 128,
        },
        id: 55,
      },
    ];
  }
  if (pathname === "/gettracking") {
    return {
      finalOutput: {
        itemid: items[1].itemid,
        itemname: items[1].itemname,
        quantity: 128,
      },
      timeStarted: Date.now() - 300000,
      timeDone: Date.now() - 180000,
      wasCancelled: false,
      items: [
        {
          itemid: items[1].itemid,
          itemname: items[1].itemname,
          timeSpentOn: 96000,
          craftedTotal: 128,
          shareInCraftingTime: 0.8,
          shareInCraftingTimeCombined: 0.8,
          craftsPerSec: 1.33,
          timings: [],
        },
      ],
      interfaceShare: [],
    };
  }
  if (pathname === "/order") return { jobID: 9001 };
  if (pathname === "/job" && search.has("id")) {
    return {
      isDone: true,
      isSimulating: false,
      bytesTotal: 2048,
      plan: [
        {
          itemid: items[1].itemid,
          itemname: items[1].itemname,
          stored: 8192,
          requested: 8,
          missing: 0,
          steps: 1,
          usedPercent: 0.1,
        },
      ],
    };
  }
  if (pathname === "/gridsettings")
    return { isTracked: search.get("track") === "1" };
  return null;
}

function createIconPack() {
  const pack = resolve(
    process.env.ICON_PACK_TEST_DIR ?? "test-results/icon-pack",
  );
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const hash = createHash("sha256").update(png).digest("hex");
  rmSync(pack, { recursive: true, force: true });
  mkdirSync(resolve(pack, "icons", hash.slice(0, 2)), { recursive: true });
  writeFileSync(resolve(pack, "icons", hash.slice(0, 2), `${hash}.png`), png);
  writeFileSync(
    resolve(pack, "manifest.json"),
    JSON.stringify({
      schema: "ae2-icons/v1",
      generatedAt: "2026-08-31T12:00:00Z",
      environment: {
        minecraft: "1.7.10",
        iconSize: 64,
        modsSha256: "c".repeat(64),
        mods: ["test@1"],
        resourcePacks: [],
      },
      entries: [
        {
          kind: "item",
          registry: "minecraft:iron_ingot",
          damage: 0,
          nbtHash: null,
          legacyId: "minecraft:iron_ingot:0",
          displayName: "Iron Ingot",
          png: `icons/${hash.slice(0, 2)}/${hash}.png`,
        },
        {
          kind: "fluid",
          fluidId: "ammonium nitrate solution",
          displayName: "Ammonium Nitrate Solution",
          png: `icons/${hash.slice(0, 2)}/${hash}.png`,
        },
      ],
      failures: [],
    }),
  );
}
