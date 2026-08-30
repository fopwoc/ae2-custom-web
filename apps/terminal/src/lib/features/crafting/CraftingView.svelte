<script lang="ts">
  import type { CpuDetail, CpuSummary } from '@ae2-terminal/ae2-api';

  import { api, jsonRequest } from '$lib/api/browser-client';
  import { formatAmount, formatBytes, formatDuration } from '$lib/api/format';
  import StatusNotice from '$lib/components/ui/StatusNotice.svelte';
  import type { TerminalState } from '$lib/features/terminal-state.svelte';

  let { state: terminal }: { state: TerminalState } = $props();
  let detail = $state<CpuDetail | null>(null);
  let detailBusy = $state(false);
  let actionBusy = $state(false);
  let confirmCancel = $state(false);

  let filteredCpus = $derived(
    Object.entries(terminal.cpus).filter(([name, cpu]) => {
      const query = terminal.search.trim().toLowerCase();
      return !query || name.toLowerCase().includes(query) || cpu.finalOutput?.itemname.toLowerCase().includes(query);
    })
  );

  $effect(() => {
    const network = terminal.selectedNetwork;
    const cpu = terminal.selectedCpu;
    if (network === null || !cpu) {
      detail = null;
      return;
    }
    void loadDetail(network, cpu);
  });

  async function loadDetail(network: number, cpu: string) {
    detailBusy = true;
    try {
      detail = await api<CpuDetail>(`/api/networks/${network}/cpus/${encodeURIComponent(cpu)}`);
    } catch (cause) {
      terminal.error = cause instanceof Error ? cause.message : 'Unable to load crafting CPU';
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
        jsonRequest('DELETE')
      );
      confirmCancel = false;
      await terminal.loadCurrent();
    } catch (cause) {
      terminal.error = cause instanceof Error ? cause.message : 'Unable to cancel the crafting job';
    } finally {
      actionBusy = false;
    }
  }

  function usage(cpu: CpuSummary): number {
    const total = cpu.availableStorage + cpu.usedStorage;
    return total === 0 ? 0 : (cpu.usedStorage / total) * 100;
  }
</script>

<section class="view-stack">
  <header class="view-heading">
    <div>
      <p class="eyebrow">Crafting service</p>
      <h1>Crafting CPUs</h1>
      <p>{filteredCpus.length} processors on this network</p>
    </div>
    <button class="button secondary" type="button" onclick={() => terminal.loadCurrent()}>↻ Refresh</button>
  </header>

  {#if terminal.busy && Object.keys(terminal.cpus).length === 0}
    <StatusNotice kind="loading" title="Reading processors" message="Loading crafting CPU state." />
  {:else if filteredCpus.length === 0}
    <StatusNotice title="No crafting CPUs" message="No processors match this filter on the selected network." />
  {:else}
    <div class="split-layout">
      <div class="cpu-list" role="list" aria-label="Crafting CPUs">
        {#each filteredCpus as [name, cpu] (name)}
          <button
            type="button"
            class="cpu-card"
            class:selected={terminal.selectedCpu === name}
            onclick={() => (terminal.selectedCpu = name)}
          >
            <span class="cpu-card-top"><strong>{name}</strong><span class:busy-badge={cpu.isBusy}>{cpu.isBusy ? 'Busy' : 'Idle'}</span></span>
            <span class="cpu-output">{cpu.finalOutput?.itemname ?? 'Available for a new job'}</span>
            <span class="capacity-track"><span style={`width:${usage(cpu)}%`}></span></span>
            <span class="cpu-meta">
              <span>{formatBytes(cpu.usedStorage)} used</span>
              <span>{cpu.coProcessors} coprocessor{cpu.coProcessors === 1 ? '' : 's'}</span>
            </span>
          </button>
        {/each}
      </div>

      <aside class="detail-panel cpu-detail">
        {#if detailBusy}
          <div class="panel-loading"><span class="spinner"></span><span>Reading CPU</span></div>
        {:else if detail && terminal.selectedCpu}
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Processor detail</p>
              <h2>{terminal.selectedCpu}</h2>
              <p>{detail.isBusy ? 'Active crafting job' : 'Ready for a job'}</p>
            </div>
            <span class="status-pill" class:active={detail.isBusy}>{detail.isBusy ? 'Busy' : 'Idle'}</span>
          </div>

          <dl class="metric-grid">
            <div><dt>Capacity</dt><dd>{formatBytes(detail.size)}</dd></div>
            <div><dt>Elapsed</dt><dd>{formatDuration(detail.timeElapsed)}</dd></div>
            <div><dt>Output</dt><dd>{detail.finalOutput?.itemname ?? '—'}</dd></div>
            <div><dt>Tracking</dt><dd>{detail.hasTrackingInfo ? 'Available' : 'Off'}</dd></div>
          </dl>

          {#if detail.items?.length}
            <div class="ingredient-list">
              <div class="section-label"><span>Ingredients</span><span>Active / pending</span></div>
              {#each detail.items as ingredient (ingredient.itemid)}
                <div class="ingredient-row">
                  <span><strong>{ingredient.itemname}</strong><code>{ingredient.itemid}</code></span>
                  <span>{formatAmount(ingredient.active)} / {formatAmount(ingredient.pending)}</span>
                </div>
              {/each}
            </div>
          {/if}

          {#if detail.isBusy}
            <div class="danger-zone">
              {#if confirmCancel}
                <p>Cancel this server-side crafting job? Crafted progress cannot be restored.</p>
                <div><button class="button secondary" type="button" onclick={() => (confirmCancel = false)}>Keep running</button><button class="button danger" type="button" disabled={actionBusy} onclick={cancelJob}>{actionBusy ? 'Cancelling…' : 'Cancel job'}</button></div>
              {:else}
                <button class="button danger-quiet" type="button" onclick={() => (confirmCancel = true)}>Cancel crafting job</button>
              {/if}
            </div>
          {/if}
        {:else}
          <StatusNotice title="Select a processor" message="Choose a crafting CPU to inspect its capacity and current job." />
        {/if}
      </aside>
    </div>
  {/if}
</section>
