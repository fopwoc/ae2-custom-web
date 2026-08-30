import { describe, expect, it, vi } from "vitest";

import { Ae2ApiError, Ae2Client } from "../src/index.js";

describe("Ae2Client", () => {
  it("forwards the bearer token and parses an envelope", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "OK",
          data: [
            {
              key: 7,
              cpuCount: 2,
              owner: "Player",
              isOwned: true,
              isTrackingEnabled: true,
            },
          ],
        }),
      ),
    );
    const client = new Ae2Client({ baseUrl: "http://gtnh:2324", fetch });

    await expect(client.getNetworks("secret")).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      new URL("http://gtnh:2324/grids"),
      expect.objectContaining({ headers: { authorization: "Bearer secret" } }),
    );
  });

  it("preserves upstream status errors", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ status: "GRID_NOT_FOUND", data: null })),
      );
    const client = new Ae2Client({ baseUrl: "http://gtnh:2324", fetch });

    const error = await client
      .getNetworks("secret")
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(Ae2ApiError);
    expect(error).toHaveProperty("status", "GRID_NOT_FOUND");
  });
});
