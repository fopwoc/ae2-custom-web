import { z, type ZodType } from "zod";

import {
  activityDetailSchema,
  activitySummarySchema,
  cpuDetailSchema,
  cpuSummarySchema,
  craftPlanReferenceSchema,
  craftPlanSchema,
  gridSettingsSchema,
  itemSchema,
  networkSchema,
  sessionSchema,
  type ActivityDetail,
  type ActivitySummary,
  type CpuDetail,
  type CpuSummary,
  type CraftPlan,
  type CraftPlanReference,
  type GridSettings,
  type Item,
  type Network,
  type Session,
} from "./contracts.js";
import { Ae2ApiError, Ae2ContractError, Ae2TransportError } from "./errors.js";

const envelopeSchema = z.object({
  status: z.string(),
  data: z.unknown().nullable(),
});

export interface LoginRequest {
  username: string;
  password: string;
  remember: boolean;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface Ae2ClientOptions {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

export class Ae2Client {
  readonly #baseUrl: URL;
  readonly #fetch: typeof globalThis.fetch;
  readonly #timeoutMs: number;

  constructor(options: Ae2ClientOptions) {
    this.#baseUrl = normalizeBaseUrl(options.baseUrl);
    this.#fetch = options.fetch ?? globalThis.fetch;
    this.#timeoutMs = options.timeoutMs ?? 15_000;
  }

  async login(request: LoginRequest): Promise<Session> {
    const form = new URLSearchParams({
      username: request.username,
      password: request.password,
    });
    if (request.remember) form.set("remember", "on");

    const response = await this.#send("auth", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: form,
    });
    const body = await response.text();
    if (!response.ok)
      throw new Ae2TransportError(
        body || "Authentication failed",
        response.status,
      );

    return parseContract("auth", sessionSchema, parseJson(body, "auth"));
  }

  async register(request: RegisterRequest): Promise<string> {
    const response = await this.#send("auth", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        register: request.username,
        password: request.password,
      }),
    });
    const body = await response.text();
    if (!response.ok)
      throw new Ae2TransportError(
        body || "Registration failed",
        response.status,
      );
    return body;
  }

  async revoke(token: string): Promise<void> {
    const response = await this.#send("auth", {
      headers: authorization(token),
      query: { revoke: "" },
    });
    if (!response.ok)
      throw new Ae2TransportError("Session revocation failed", response.status);
  }

  getNetworks(token: string): Promise<Network[]> {
    return this.#request("grids", token, z.array(networkSchema));
  }

  getItems(token: string, network: number): Promise<Item[]> {
    return this.#networkRequest("items", token, network, z.array(itemSchema));
  }

  getCpus(token: string, network: number): Promise<Record<string, CpuSummary>> {
    return this.#networkRequest(
      "list",
      token,
      network,
      z.record(z.string(), cpuSummarySchema),
    );
  }

  getCpu(token: string, network: number, cpu: string): Promise<CpuDetail> {
    return this.#networkRequest("get", token, network, cpuDetailSchema, {
      cpu,
    });
  }

  async cancelCpu(token: string, network: number, cpu: string): Promise<void> {
    await this.#networkRequest("cancelcpu", token, network, z.null(), { cpu });
  }

  createCraftPlan(
    token: string,
    network: number,
    item: number,
    quantity: number,
  ): Promise<CraftPlanReference> {
    return this.#networkRequest(
      "order",
      token,
      network,
      craftPlanReferenceSchema,
      {
        item: String(item),
        quantity: String(quantity),
      },
    );
  }

  getCraftPlan(
    token: string,
    network: number,
    plan: number,
  ): Promise<CraftPlan> {
    return this.#networkRequest("job", token, network, craftPlanSchema, {
      id: String(plan),
    });
  }

  async cancelCraftPlan(
    token: string,
    network: number,
    plan: number,
  ): Promise<void> {
    await this.#networkRequest("job", token, network, z.null(), {
      id: String(plan),
      cancel: "",
    });
  }

  async submitCraftPlan(
    token: string,
    network: number,
    plan: number,
    cpu?: string,
  ): Promise<void> {
    await this.#networkRequest("job", token, network, z.null(), {
      id: String(plan),
      submit: "",
      ...(cpu ? { cpu } : {}),
    });
  }

  getActivity(token: string, network: number): Promise<ActivitySummary[]> {
    return this.#networkRequest(
      "trackinghistory",
      token,
      network,
      z.array(activitySummarySchema),
    );
  }

  getActivityDetail(
    token: string,
    network: number,
    id: number,
  ): Promise<ActivityDetail> {
    return this.#networkRequest(
      "gettracking",
      token,
      network,
      activityDetailSchema,
      {
        id: String(id),
      },
    );
  }

  updateGridSettings(
    token: string,
    network: number,
    tracked: boolean,
  ): Promise<GridSettings> {
    return this.#networkRequest(
      "gridsettings",
      token,
      network,
      gridSettingsSchema,
      {
        track: tracked ? "1" : "0",
      },
    );
  }

  async #networkRequest<T>(
    endpoint: string,
    token: string,
    network: number,
    schema: ZodType<T>,
    query: Record<string, string> = {},
  ): Promise<T> {
    try {
      return await this.#request(endpoint, token, schema, {
        grid: String(network),
        ...query,
      });
    } catch (error) {
      if (
        !(error instanceof Ae2ApiError) ||
        error.status !== "REFRESH_REQUIRED"
      )
        throw error;
      await this.getNetworks(token);
      return this.#request(endpoint, token, schema, {
        grid: String(network),
        ...query,
      });
    }
  }

  async #request<T>(
    endpoint: string,
    token: string,
    schema: ZodType<T>,
    query: Record<string, string> = {},
  ): Promise<T> {
    const response = await this.#send(endpoint, {
      headers: authorization(token),
      query,
    });
    if (response.status === 401)
      throw new Ae2TransportError("Session expired", 401);
    const body = await response.text();
    if (!response.ok)
      throw new Ae2TransportError(body || response.statusText, response.status);

    const envelope = parseContract(
      endpoint,
      envelopeSchema,
      parseJson(body, endpoint),
    );
    if (envelope.status !== "OK")
      throw new Ae2ApiError(envelope.status, envelope.data);
    return parseContract(endpoint, schema, envelope.data);
  }

  async #send(
    endpoint: string,
    init: RequestInit & { query?: Record<string, string> } = {},
  ): Promise<Response> {
    const url = new URL(endpoint, this.#baseUrl);
    for (const [key, value] of Object.entries(init.query ?? {}))
      url.searchParams.set(key, value);
    const { query: _query, ...requestInit } = init;

    try {
      return await this.#fetch(url, {
        ...requestInit,
        redirect: "manual",
        signal: AbortSignal.timeout(this.#timeoutMs),
      });
    } catch (error) {
      throw new Ae2TransportError("AE2 Web Integration is unavailable", 502, {
        cause: error,
      });
    }
  }
}

function normalizeBaseUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("UPSTREAM_URL must use http or https");
  }
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  url.search = "";
  url.hash = "";
  return url;
}

function authorization(token: string): HeadersInit {
  return { authorization: `Bearer ${token}` };
}

function parseJson(value: string, endpoint: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Ae2TransportError(
      `AE2 returned invalid JSON for ${endpoint}`,
      502,
      { cause: error },
    );
  }
}

function parseContract<T>(
  endpoint: string,
  schema: ZodType<T>,
  value: unknown,
): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Ae2ContractError(endpoint, result.error);
  return result.data;
}
