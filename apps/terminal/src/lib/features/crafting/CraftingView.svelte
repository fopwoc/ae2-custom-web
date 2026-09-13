<script lang="ts">
  import type {
    CpuDetail,
    CpuIngredient,
    CpuSummary,
  } from '@ae2-terminal/ae2-api';

  import { api, jsonRequest } from '$lib/api/browser-client';
  import {
    formatAmount,
    formatBytes,
    formatCompactAmount,
    formatDuration,
  } from '$lib/api/format';
  import TerminalIcon from '$lib/components/ui/TerminalIcon.svelte';
  import StatusNotice from '$lib/components/ui/StatusNotice.svelte';
  import type { TerminalState } from '$lib/features/terminal-state.svelte';
  import type { InventoryItem } from '$lib/features/inventory/inventory-item';
  import ItemVisual from '$lib/features/inventory/ItemVisual.svelte';

  let { state: terminal }: { state: TerminalState } = $props();
  let detail = $state<CpuDetail | null>(null);
  let detailBusy = $state(false);
  let actionBusy = $state(false);
  let confirmCancel = $state(false);
  let detailReceivedAt = $state(0);
  let clockNow = $state(Date.now());
  let refreshDetail: (() => void) | null = null;

  let cpus = $derived(Object.entries(terminal.cpus));
  let selectedSummary = $derived(
    terminal.selectedCpu ? (terminal.cpus[terminal.selectedCpu] ?? null) : null,
  );
  let activity = $derived(
    detail?.items?.length ? summarizeActivity(detail.items) : emptyActivity(),
  );
  let elapsed = $derived(
    detail?.isBusy && detail.hasTrackingInfo
      ? Math.max(
          0,
          detail.timeElapsed + Math.max(0, clockNow - detailReceivedAt),
        )
      : null,
  );

  $effect(() => {
    const network = terminal.selectedNetwork;
    const cpu = terminal.selectedCpu;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let itemOrder: string[] = [];
    let jobSignature: string | null = null;

    confirmCancel = false;
    if (network === null || !cpu) {
      detail = null;
      return;
    }
    const selectedNetwork = network;
    const selectedCpu = cpu;
    detailBusy = true;

    async function refresh() {
      if (running || cancelled) return;
      running = true;
      let pollDelay = 5_000;

      try {
        const [detailResult, cpusResult] = await Promise.allSettled([
          api<CpuDetail>(
            `/api/networks/${selectedNetwork}/cpus/${encodeURIComponent(selectedCpu)}`,
          ),
          api<Record<string, CpuSummary>>(
            `/api/networks/${selectedNetwork}/cpus`,
          ),
        ]);
        if (cancelled) return;

        if (cpusResult.status === 'fulfilled') {
          terminal.cpus = cpusResult.value;
          if (!cpusResult.value[selectedCpu]) {
            terminal.selectedCpu = Object.keys(cpusResult.value)[0] ?? null;
            return;
          }
        }

        if (detailResult.status === 'rejected') throw detailResult.reason;

        const nextDetail = detailResult.value;
        const nextSignature = nextDetail.isBusy
          ? `${nextDetail.finalOutput?.itemid ?? 'job'}:${nextDetail.timeStarted}`
          : null;
        if (nextSignature !== jobSignature) {
          itemOrder = [];
          jobSignature = nextSignature;
        }

        detail = {
          ...nextDetail,
          items: stableIngredients(nextDetail.items, itemOrder),
        };
        itemOrder = detail.items?.map(({ itemid }) => itemid) ?? [];
        detailReceivedAt = Date.now();
        clockNow = detailReceivedAt;
        pollDelay = nextDetail.isBusy ? 2_000 : 5_000;
      } catch (cause) {
        terminal.error =
          cause instanceof Error
            ? cause.message
            : 'Unable to refresh crafting CPU';
      } finally {
        if (!cancelled) {
          running = false;
          detailBusy = false;
          timer = setTimeout(() => void refresh(), pollDelay);
        }
      }
    }

    const refreshNow = () => {
      if (running) return;
      if (timer) clearTimeout(timer);
      void refresh();
    };
    refreshDetail = refreshNow;
    void refresh();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (refreshDetail === refreshNow) refreshDetail = null;
    };
  });

  $effect(() => {
    if (!detail?.isBusy || !detail.hasTrackingInfo) return;
    clockNow = Date.now();
    const timer = setInterval(() => (clockNow = Date.now()), 1_000);
    return () => clearInterval(timer);
  });

  async function cancelJob() {
    if (terminal.selectedNetwork === null || !terminal.selectedCpu) return;
    actionBusy = true;
    try {
      await api(
        `/api/networks/${terminal.selectedNetwork}/cpus/${encodeURIComponent(terminal.selectedCpu)}/job`,
        jsonRequest('DELETE'),
      );
      confirmCancel = false;
      await terminal.loadCurrent();
    } catch (cause) {
      terminal.error =
        cause instanceof Error
          ? cause.message
          : 'Unable to cancel the crafting job';
    } finally {
      actionBusy = false;
    }
  }

  function visualItem(itemid: string, itemname: string): InventoryItem {
    return (
      terminal.items.find((item) => item.itemid === itemid) ?? {
        hashcode: 0,
        itemid,
        itemname,
        quantity: 0,
        craftable: false,
      }
    );
  }

  function emptyActivity() {
    return { active: 0, pending: 0, stored: 0, crafted: 0 };
  }

  function summarizeActivity(items: CpuIngredient[]) {
    return items.reduce(
      (sum, item) => ({
        active: sum.active + item.active,
        pending: sum.pending + item.pending,
        stored: sum.stored + item.stored,
        crafted: sum.crafted + item.craftedTotal,
      }),
      emptyActivity(),
    );
  }

  function stableIngredients(
    items: CpuIngredient[] | null | undefined,
    order: string[],
  ): CpuIngredient[] | null | undefined {
    if (!items?.length || order.length === 0) return items;
    const positions = new Map(order.map((itemid, index) => [itemid, index]));
    return [...items].sort(
      (left, right) =>
        (positions.get(left.itemid) ?? Number.MAX_SAFE_INTEGER) -
        (positions.get(right.itemid) ?? Number.MAX_SAFE_INTEGER),
    );
  }
</script>

<section class="terminal-view crafting-terminal">
  <div class="crafting-toolbar">
    <span class="result-count"
      >{cpus.length} processor{cpus.length === 1 ? '' : 's'}</span
    >
    <span class="crafting-toolbar-status">
      {cpus.filter(([, cpu]) => cpu.isBusy).length} active
    </span>
    <button
      class="machine-button icon-only"
      type="button"
      aria-label="Refresh processors"
      title="Refresh processors"
      onclick={() => refreshDetail?.()}
    >
      <TerminalIcon name="refresh" size={18} />
    </button>
  </div>

  {#if terminal.busy && cpus.length === 0}
    <StatusNotice
      kind="loading"
      title="Reading processors"
      message="Loading crafting CPU state."
    />
  {:else if cpus.length === 0}
    <StatusNotice
      title="No crafting CPUs"
      message="No processors are available on the selected network."
    />
  {:else}
    <div class="crafting-workbench">
      <aside class="cpu-rail" aria-label="Crafting CPUs">
        <div class="cpu-rail-heading">
          <TerminalIcon name="processor" size={18} />
          <span>CPUs</span>
        </div>
        <div class="cpu-list">
          {#each cpus as [name, cpu] (name)}
            {@const output = cpu.finalOutput
              ? visualItem(cpu.finalOutput.itemid, cpu.finalOutput.itemname)
              : null}
            <button
              type="button"
              class="cpu-card"
              class:selected={terminal.selectedCpu === name}
              class:busy={cpu.isBusy}
              aria-pressed={terminal.selectedCpu === name}
              onclick={() => (terminal.selectedCpu = name)}
            >
              <span class="cpu-card-copy">
                <strong>{name}</strong>
                <span
                  >{cpu.isBusy
                    ? formatBytes(cpu.usedStorage)
                    : 'Available'}</span
                >
              </span>
              <span class="cpu-card-output" aria-hidden="true">
                {#if output}<ItemVisual item={output} />{:else}<TerminalIcon
                    name="processor"
                    size={22}
                  />{/if}
              </span>
              <span class="cpu-capacity"
                >{cpu.coProcessors} co-processor{cpu.coProcessors === 1
                  ? ''
                  : 's'}</span
              >
            </button>
          {/each}
        </div>
      </aside>

      <div class="crafting-bay">
        {#if detailBusy}
          <div class="panel-loading">
            <span class="spinner"></span><span>Reading CPU</span>
          </div>
        {:else if detail && terminal.selectedCpu}
          <header class="crafting-bay-heading">
            <div>
              <p class="eyebrow">Selected processor</p>
              <h2>{terminal.selectedCpu}</h2>
              <p>
                {detail.finalOutput?.itemname ??
                  (detail.isBusy
                    ? 'Active crafting job'
                    : 'Ready for a new job')}
              </p>
            </div>
            <dl class="cpu-readout">
              <div>
                <dt>Capacity</dt>
                <dd>{formatBytes(detail.size)}</dd>
              </div>
              <div>
                <dt>Elapsed</dt>
                <dd>
                  {detail.isBusy
                    ? elapsed === null
                      ? 'Not tracked'
                      : formatDuration(elapsed)
                    : '—'}
                </dd>
              </div>
            </dl>
          </header>

          {#if detail.isBusy}
            <div class="crafting-activity" aria-label="Live crafting activity">
              <span class="crafting-activity-heading">
                <strong>Working</strong>
                <span
                  >{detail.hasTrackingInfo
                    ? `${formatCompactAmount(activity.crafted)} crafted`
                    : 'Detailed tracking unavailable'}</span
                >
              </span>
              <dl class="crafting-activity-counts">
                <div title={`${formatAmount(activity.active)} active`}>
                  <dt>Active</dt>
                  <dd>{formatCompactAmount(activity.active)}</dd>
                </div>
                <div title={`${formatAmount(activity.pending)} queued`}>
                  <dt>Queued</dt>
                  <dd>{formatCompactAmount(activity.pending)}</dd>
                </div>
                <div title={`${formatAmount(activity.stored)} stored`}>
                  <dt>Stored</dt>
                  <dd>{formatCompactAmount(activity.stored)}</dd>
                </div>
              </dl>
              <span class="activity-track" aria-hidden="true"
                ><span></span></span
              >
            </div>
          {/if}

          {#if detail.items?.length}
            <div class="craft-grid" aria-label="Items in the current craft">
              {#each detail.items as ingredient (ingredient.itemid)}
                {@const item = visualItem(
                  ingredient.itemid,
                  ingredient.itemname,
                )}
                <article
                  class="craft-slot"
                  title={`${ingredient.itemname}\n${ingredient.itemid}\n${formatAmount(ingredient.craftedTotal)} crafted\n${formatAmount(ingredient.active)} active\n${formatAmount(ingredient.pending)} pending`}
                >
                  <span class="craft-slot-icon" aria-hidden="true"
                    ><ItemVisual {item} /></span
                  >
                  <strong class="craft-slot-amount"
                    >{formatCompactAmount(
                      ingredient.active + ingredient.pending,
                    )}</strong
                  >
                  <span class="craft-slot-name">{ingredient.itemname}</span>
                  <span class="craft-slot-state"
                    >{ingredient.active > 0
                      ? `${formatCompactAmount(ingredient.active)} active`
                      : ingredient.pending > 0
                        ? `${formatCompactAmount(ingredient.pending)} queued`
                        : `${formatCompactAmount(ingredient.stored)} stored`}</span
                  >
                  <span
                    class="craft-slot-crafted"
                    title={`${formatAmount(ingredient.craftedTotal)} crafted`}
                    >{formatCompactAmount(ingredient.craftedTotal)} crafted</span
                  >
                </article>
              {/each}
            </div>
          {:else if selectedSummary?.isBusy}
            <StatusNotice
              title="No tracked ingredients"
              message="The server reports an active craft without per-item tracking data."
            />
          {:else}
            <StatusNotice
              title="Processor available"
              message="This CPU is ready for a new crafting request from the Items tab."
            />
          {/if}

          {#if detail.isBusy}
            <div class="crafting-actions">
              {#if confirmCancel}
                <p>
                  Cancel this server-side crafting job? Crafted progress cannot
                  be restored.
                </p>
                <div>
                  <button
                    class="machine-button"
                    type="button"
                    onclick={() => (confirmCancel = false)}>Keep running</button
                  >
                  <button
                    class="machine-button danger"
                    type="button"
                    disabled={actionBusy}
                    onclick={cancelJob}
                    >{actionBusy ? 'Cancelling…' : 'Cancel job'}</button
                  >
                </div>
              {:else}
                <button
                  class="machine-button danger-quiet"
                  type="button"
                  onclick={() => (confirmCancel = true)}
                  >Cancel crafting job</button
                >
              {/if}
            </div>
          {/if}
        {:else}
          <StatusNotice
            title="Select a processor"
            message="Choose a crafting CPU to inspect its current job."
          />
        {/if}
      </div>
    </div>
  {/if}
</section>
