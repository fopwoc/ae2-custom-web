import type {
  ActivitySummary,
  CpuSummary,
  Item,
  Network,
} from "@ae2-terminal/ae2-api";

import { api, BrowserApiError, jsonRequest } from "$lib/api/browser-client";

export type TerminalTab = "inventory" | "crafting" | "activity";

export class TerminalState {
  networks = $state<Network[]>([]);
  selectedNetwork = $state<number | null>(null);
  tab = $state<TerminalTab>("inventory");
  items = $state<Item[]>([]);
  cpus = $state<Record<string, CpuSummary>>({});
  activity = $state<ActivitySummary[]>([]);
  selectedItem = $state<Item | null>(null);
  selectedCpu = $state<string | null>(null);
  selectedActivity = $state<number | null>(null);
  search = $state("");
  busy = $state(false);
  error = $state<string | null>(null);
  #requestGeneration = 0;

  constructor(networks: Network[]) {
    this.networks = networks;
    this.selectedNetwork =
      networks.find((network) => network.key !== -1)?.key ?? null;
  }

  get network(): Network | null {
    return (
      this.networks.find((network) => network.key === this.selectedNetwork) ??
      null
    );
  }

  async initialize(): Promise<void> {
    if (this.selectedNetwork !== null) await this.loadCurrent();
  }

  async chooseNetwork(network: number): Promise<void> {
    if (network === this.selectedNetwork) return;
    this.selectedNetwork = network;
    this.selectedItem = null;
    this.selectedCpu = null;
    this.selectedActivity = null;
    this.items = [];
    this.cpus = {};
    this.activity = [];
    localStorage.setItem("ae2-network", String(network));
    await this.loadCurrent();
  }

  async restoreNetwork(): Promise<void> {
    const stored = Number(localStorage.getItem("ae2-network"));
    if (
      Number.isSafeInteger(stored) &&
      this.networks.some((network) => network.key === stored)
    ) {
      this.selectedNetwork = stored;
    }
    await this.initialize();
  }

  async chooseTab(tab: TerminalTab): Promise<void> {
    this.tab = tab;
    this.selectedItem = null;
    this.selectedCpu = null;
    this.selectedActivity = null;
    await this.loadCurrent();
  }

  async loadCurrent(): Promise<void> {
    const network = this.selectedNetwork;
    if (network === null) return;
    const generation = ++this.#requestGeneration;
    this.busy = true;
    this.error = null;
    try {
      if (this.tab === "inventory") {
        this.items = await api<Item[]>(`/api/networks/${network}/items`);
      } else if (this.tab === "crafting") {
        this.cpus = await api<Record<string, CpuSummary>>(
          `/api/networks/${network}/cpus`,
        );
        if (!this.selectedCpu)
          this.selectedCpu = Object.keys(this.cpus)[0] ?? null;
      } else {
        this.activity = await api<ActivitySummary[]>(
          `/api/networks/${network}/activity`,
        );
      }
    } catch (cause) {
      if (generation === this.#requestGeneration) {
        this.error =
          cause instanceof Error ? cause.message : "Unable to load AE2 data";
      }
    } finally {
      if (generation === this.#requestGeneration) this.busy = false;
    }
  }

  async refreshNetworks(): Promise<void> {
    try {
      this.networks = await api<Network[]>("/api/networks");
    } catch (cause) {
      this.error =
        cause instanceof Error ? cause.message : "Unable to refresh networks";
    }
  }

  async setTracking(tracked: boolean): Promise<void> {
    if (this.selectedNetwork === null) return;
    try {
      await api(
        `/api/networks/${this.selectedNetwork}/settings`,
        jsonRequest("PATCH", { tracked }),
      );
      await this.refreshNetworks();
      await this.loadCurrent();
    } catch (cause) {
      this.error =
        cause instanceof BrowserApiError
          ? cause.message
          : "Unable to update tracking";
    }
  }
}
