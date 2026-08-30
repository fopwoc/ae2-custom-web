import { createServer } from "node:http";

const port = Number(process.env.MOCK_PORT ?? 4324);

const items = [
  {
    hashcode: 101,
    itemid: "appliedenergistics2:item.ItemMultiMaterial",
    itemname: "Fluix Crystal",
    quantity: 12480,
    craftable: true,
  },
  {
    hashcode: 102,
    itemid: "minecraft:iron_ingot",
    itemname: "Iron Ingot",
    quantity: 8192,
    craftable: true,
  },
  {
    hashcode: 103,
    itemid: "gregtech:gt.metaitem.01",
    itemname: "Stainless Steel Plate",
    quantity: 348,
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
