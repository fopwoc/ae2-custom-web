<script lang="ts">
  import type { CpuDetail, CpuIngredient } from '@ae2-terminal/ae2-api';

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

  let cpus = $derived(Object.entries(terminal.cpus));
  let selectedSummary = $derived(
    terminal.selectedCpu ? (terminal.cpus[terminal.selectedCpu] ?? null) : null,
  );
  let overallProgress = $derived(
    detail?.items?.length ? progressFor(detail.items) : null,
  );

  $effect(() => {
    const network = terminal.selectedNetwork;
    const cpu = terminal.selectedCpu;
    confirmCancel = false;
    if (network === null || !cpu) {
      detail = null;
      return;
    }
    void loadDetail(network, cpu);
  });

  async function loadDetail(network: number, cpu: string) {
    detailBusy = true;
    try {
      detail = await api<CpuDetail>(
        `/api/networks/${network}/cpus/${encodeURIComponent(cpu)}`,
      );
    } catch (cause) {
      terminal.error =
        cause instanceof Error ? cause.message : 'Unable to load crafting CPU';
    } finally {
      detailBusy = false;
    }
  }

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

  function ingredientProgress(ingredient: CpuIngredient): number | null {
    const total =
      ingredient.craftedTotal + ingredient.active + ingredient.pending;
    if (total <= 0) return null;
    return Math.max(0, Math.min(100, (ingredient.craftedTotal / total) * 100));
  }

  function progressFor(items: CpuIngredient[]): number | null {
    const totals = items.reduce(
      (sum, item) => ({
        crafted: sum.crafted + item.craftedTotal,
        total: sum.total + item.craftedTotal + item.active + item.pending,
      }),
      { crafted: 0, total: 0 },
    );
    return totals.total > 0
      ? Math.max(0, Math.min(100, (totals.crafted / totals.total) * 100))
      : null;
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
      onclick={() => terminal.loadCurrent()}
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
                  {detail.isBusy ? formatDuration(detail.timeElapsed) : '—'}
                </dd>
              </div>
            </dl>
          </header>

          {#if detail.isBusy && overallProgress !== null}
            <div
              class="overall-progress"
              aria-label={`Overall tracked progress ${Math.round(overallProgress)}%`}
            >
              <span
                ><strong>{Math.round(overallProgress)}%</strong><span
                  >tracked progress</span
                ></span
              >
              <span class="progress-track"
                ><span style={`width: ${overallProgress}%`}></span></span
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
                {@const progress = ingredientProgress(ingredient)}
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
                    >{formatCompactAmount(ingredient.craftedTotal)} crafted</span
                  >
                  {#if progress !== null}
                    <span class="progress-track"
                      ><span style={`width: ${progress}%`}></span></span
                    >
                  {/if}
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
